import { Db } from "mongodb";
import { toObjectId } from "@/lib/db/object-id";
import { findUserById } from "@/services/user.service";

export async function getRoomAccessManagers(db: Db, roomId: string) {
  const [users, permissions] = await Promise.all([
    db.collection("users").find({ role: "manager" }).sort({ name: 1 }).toArray(),
    db.collection("roomAccess").find({ roomId }).sort({ updatedAt: -1 }).toArray(),
  ]);

  const allowMap = new Map<string, boolean>();
  for (const permission of permissions) {
    const key = String(permission.userId ?? "");
    if (allowMap.has(key)) continue;
    allowMap.set(key, Boolean(permission.canJoin));
  }

  return users.map((user) => ({
    userId: String(user._id),
    userName: String(user.name ?? "Unknown Manager"),
    email: String(user.email ?? ""),
    canJoin: allowMap.get(String(user._id)) ?? false,
  }));
}

export async function bulkSetRoomAccess(
  db: Db,
  roomId: string,
  action: "grant-all" | "revoke-all",
  adminUserId: string
) {
  const nextCanJoin = action === "grant-all";
  const users = await db.collection("users").find({ role: "manager" }).toArray();

  if (users.length === 0) {
    return { message: "No managers found" };
  }

  await Promise.all(
    users.map(async (user) => {
      const stringUserId = String(user._id);

      await db.collection("roomAccess").updateOne(
        { roomId, userId: stringUserId },
        {
          $set: {
            roomId,
            userId: stringUserId,
            canJoin: nextCanJoin,
            updatedAt: new Date(),
          },
          $setOnInsert: {
            createdAt: new Date(),
          },
        },
        { upsert: true }
      );

      await db.collection("roomAccess").deleteMany({ roomId, userId: user._id });
    })
  );

  await db.collection("adminAuditLog").insertOne({
    roomId,
    userId: adminUserId,
    userName: "Room Access",
    action: "room-access-bulk",
    message: nextCanJoin
      ? "Admin granted room access to all managers."
      : "Admin revoked room access from all managers.",
    createdAt: new Date().toISOString(),
  });

  return {
    message: nextCanJoin ? "Access granted for all managers" : "Access revoked for all managers",
  };
}

export async function setRoomAccess(
  db: Db,
  roomId: string,
  userId: string,
  canJoin: boolean
) {
  const userObjectId = toObjectId(userId);
  const user = userObjectId
    ? await findUserById(db, userId)
    : null;

  if (!user || user.role !== "manager") {
    return { ok: false as const, status: 404, error: "Manager not found" };
  }

  await db.collection("roomAccess").updateOne(
    userObjectId
      ? { roomId, $or: [{ userId }, { userId: userObjectId }] }
      : { roomId, userId },
    {
      $set: {
        roomId,
        userId,
        canJoin,
        updatedAt: new Date(),
      },
      $setOnInsert: {
        createdAt: new Date(),
      },
    },
    { upsert: true }
  );

  await db.collection("adminAuditLog").insertOne({
    roomId,
    userId,
    userName: String(user.name ?? "Unknown Manager"),
    action: "room-access",
    message: canJoin
      ? `Admin granted room access for ${String(user.name ?? "manager")}.`
      : `Admin revoked room access for ${String(user.name ?? "manager")}.`,
    createdAt: new Date().toISOString(),
  });

  return {
    ok: true as const,
    message: canJoin ? "Access granted" : "Access revoked",
  };
}
