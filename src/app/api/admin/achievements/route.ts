import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/roles";
import { getDb } from "@/lib/mongodb";
import { awardBadgeSchema } from "@/lib/validations";

function toObjectId(value: string) {
  try {
    return new ObjectId(value);
  } catch {
    return null;
  }
}

function buildUserIdQuery(userId: string) {
  const objectId = toObjectId(userId);
  // Compatibility layer for historical ObjectId-based achievements.
  if (!objectId) {
    return { userId };
  }

  return {
    $or: [
      { userId },
      { userId: objectId },
    ],
  };
}

export async function GET(request: NextRequest) {
  const access = await requireAdmin();
  if (!access.ok) return access.response;

  const userId = request.nextUrl.searchParams.get("userId")?.trim();

  const db = await getDb();
  const query = userId ? buildUserIdQuery(userId) : {};
  const achievements = await db.collection("userAchievements")
    .find(query)
    .sort({ awardedAt: -1, createdAt: -1 })
    .toArray();

  const userIds = [...new Set(achievements.map((item) => String(item.userId ?? "")).filter(Boolean))];
  // Enrich achievement rows with current user profile metadata when available.
  const objectIds = userIds.map((id) => toObjectId(id)).filter((id): id is ObjectId => Boolean(id));
  const users = objectIds.length
    ? await db
        .collection("users")
        .find({ _id: { $in: objectIds } }, { projection: { name: 1, email: 1 } })
        .toArray()
    : [];
  const usersById = new Map(users.map((user) => [String(user._id), user]));

  return NextResponse.json({
    achievements: achievements.map((item) => ({
      id: String(item._id),
      userId: String(item.userId ?? ""),
      userName: String(item.userName ?? usersById.get(String(item.userId ?? ""))?.name ?? "Unknown Manager"),
      userEmail: String(item.userEmail ?? usersById.get(String(item.userId ?? ""))?.email ?? ""),
      tournamentId: String(item.tournamentId ?? ""),
      tournamentName: String(item.tournamentName ?? "Unknown Tournament"),
      badgeType: String(item.badgeType ?? "Champion"),
      awardedAt: String(item.awardedAt ?? ""),
      awardedBy: String(item.awardedBy ?? ""),
    })),
  });
}

export async function POST(request: NextRequest) {
  const access = await requireAdmin();
  if (!access.ok) return access.response;

  const body = await request.json();
  const parsed = awardBadgeSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid payload" },
      { status: 400 }
    );
  }

  const { userId, tournamentId, tournamentName, badgeType } = parsed.data;

  const db = await getDb();
  const userObjectId = toObjectId(userId);
  const user = userObjectId
    ? await db.collection("users").findOne({ _id: userObjectId })
    : null;

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const existing = await db.collection("userAchievements").findOne({
    ...buildUserIdQuery(userId),
    tournamentId,
    badgeType,
  });

  // Prevent duplicate badge grants for the same tournament result.
  if (existing) {
    return NextResponse.json({ error: "Badge already awarded for this tournament" }, { status: 409 });
  }

  const nowIso = new Date().toISOString();

  await db.collection("userAchievements").insertOne({
    userId,
    userName: String(user.name ?? "Unknown Manager"),
    userEmail: String(user.email ?? ""),
    tournamentId,
    tournamentName,
    badgeType,
    awardedBy: access.session.user.id,
    awardedAt: nowIso,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  await db.collection("adminAuditLog").insertOne({
    roomId: "tournament",
    userId,
    userName: String(user.name ?? "Unknown Manager"),
    action: "achievement-award",
    message: `Admin awarded ${badgeType} badge for ${tournamentName} (${tournamentId}).`,
    createdAt: nowIso,
  });

  return NextResponse.json({ ok: true, message: "Badge awarded" });
}

export async function DELETE(request: NextRequest) {
  const access = await requireAdmin();
  if (!access.ok) return access.response;

  const body = await request.json();
  const achievementId = String(body?.achievementId ?? "").trim();

  if (!achievementId) {
    return NextResponse.json({ error: "achievementId is required" }, { status: 400 });
  }

  const objectId = toObjectId(achievementId);
  if (!objectId) {
    return NextResponse.json({ error: "Invalid achievementId" }, { status: 400 });
  }

  const db = await getDb();
  const existing = await db.collection("userAchievements").findOne({ _id: objectId });

  if (!existing) {
    return NextResponse.json({ error: "Achievement not found" }, { status: 404 });
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

  return NextResponse.json({ ok: true, message: "Badge revoked" });
}
