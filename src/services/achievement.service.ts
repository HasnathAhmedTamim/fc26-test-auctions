import { Db, ObjectId } from "mongodb";
import { toObjectId } from "@/lib/db/object-id";
import { buildUserIdQuery } from "@/lib/db/user-query";
import { findUserById } from "@/services/user.service";

function mapAchievement(
  item: Record<string, unknown>,
  usersById?: Map<string, Record<string, unknown>>
) {
  const userId = String(item.userId ?? "");
  const user = usersById?.get(userId);

  return {
    id: String(item._id),
    userId,
    userName: String(item.userName ?? user?.name ?? "Unknown Manager"),
    userEmail: String(item.userEmail ?? user?.email ?? ""),
    tournamentId: String(item.tournamentId ?? ""),
    tournamentName: String(item.tournamentName ?? "Unknown Tournament"),
    badgeType: String(item.badgeType ?? "Champion"),
    awardedAt: String(item.awardedAt ?? ""),
    awardedBy: String(item.awardedBy ?? ""),
  };
}

export async function listAchievements(db: Db, userId?: string) {
  const query = userId ? buildUserIdQuery(userId) : {};
  const achievements = await db.collection("userAchievements")
    .find(query)
    .sort({ awardedAt: -1, createdAt: -1 })
    .toArray();

  const userIds = [...new Set(achievements.map((item) => String(item.userId ?? "")).filter(Boolean))];
  const objectIds = userIds.map((id) => toObjectId(id)).filter((id): id is ObjectId => Boolean(id));
  const users = objectIds.length
    ? await db
        .collection("users")
        .find({ _id: { $in: objectIds } }, { projection: { name: 1, email: 1 } })
        .toArray()
    : [];
  const usersById = new Map(users.map((user) => [String(user._id), user]));

  return achievements.map((item) => mapAchievement(item as Record<string, unknown>, usersById));
}

export async function listUserAchievements(db: Db, userId: string) {
  const achievements = await db.collection("userAchievements")
    .find(buildUserIdQuery(userId))
    .sort({ awardedAt: -1, createdAt: -1 })
    .toArray();

  return achievements.map((item) => ({
    id: String(item._id),
    userId: String(item.userId ?? ""),
    tournamentId: String(item.tournamentId ?? ""),
    tournamentName: String(item.tournamentName ?? "Unknown Tournament"),
    badgeType: String(item.badgeType ?? "Champion"),
    awardedBy: String(item.awardedBy ?? ""),
    awardedAt: String(item.awardedAt ?? ""),
  }));
}

export async function awardAchievement(
  db: Db,
  payload: {
    userId: string;
    tournamentId: string;
    tournamentName: string;
    badgeType: string;
    awardedBy: string;
  }
) {
  const user = await findUserById(db, payload.userId);
  if (!user) {
    return { ok: false as const, status: 404, error: "User not found" };
  }

  const existing = await db.collection("userAchievements").findOne({
    ...buildUserIdQuery(payload.userId),
    tournamentId: payload.tournamentId,
    badgeType: payload.badgeType,
  });

  if (existing) {
    return { ok: false as const, status: 409, error: "Badge already awarded for this tournament" };
  }

  const nowIso = new Date().toISOString();

  await db.collection("userAchievements").insertOne({
    userId: payload.userId,
    userName: String(user.name ?? "Unknown Manager"),
    userEmail: String(user.email ?? ""),
    tournamentId: payload.tournamentId,
    tournamentName: payload.tournamentName,
    badgeType: payload.badgeType,
    awardedBy: payload.awardedBy,
    awardedAt: nowIso,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  await db.collection("adminAuditLog").insertOne({
    roomId: "tournament",
    userId: payload.userId,
    userName: String(user.name ?? "Unknown Manager"),
    action: "achievement-award",
    message: `Admin awarded ${payload.badgeType} badge for ${payload.tournamentName} (${payload.tournamentId}).`,
    createdAt: nowIso,
  });

  return { ok: true as const, message: "Badge awarded" };
}

export async function revokeAchievement(db: Db, achievementId: string) {
  const objectId = toObjectId(achievementId);
  if (!objectId) {
    return { ok: false as const, status: 400, error: "Invalid achievementId" };
  }

  const existing = await db.collection("userAchievements").findOne({ _id: objectId });
  if (!existing) {
    return { ok: false as const, status: 404, error: "Achievement not found" };
  }

  await db.collection("userAchievements").deleteOne({ _id: objectId });
  await db.collection("adminAuditLog").insertOne({
    roomId: "tournament",
    userId: String(existing.userId ?? ""),
    userName: "Achievement",
    action: "achievement-revoke",
    message: `Admin revoked ${existing.badgeType ?? "badge"} from ${existing.tournamentName ?? "tournament"}.`,
    createdAt: new Date().toISOString(),
  });

  return { ok: true as const, message: "Badge revoked" };
}
