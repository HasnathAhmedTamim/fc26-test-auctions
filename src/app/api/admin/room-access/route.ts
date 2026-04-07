import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/roles";
import { getDb } from "@/lib/mongodb";

// Some legacy roomAccess rows store userId as ObjectId.
function toObjectId(value: string) {
  try {
    return new ObjectId(value);
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const access = await requireAdmin();
  if (!access.ok) return access.response;

  const roomId = request.nextUrl.searchParams.get("roomId")?.trim();
  if (!roomId) {
    return NextResponse.json({ error: "roomId is required" }, { status: 400 });
  }

  const db = await getDb();
  const [users, permissions] = await Promise.all([
    db.collection("users").find({ role: "manager" }).sort({ name: 1 }).toArray(),
    db.collection("roomAccess").find({ roomId }).sort({ updatedAt: -1 }).toArray(),
  ]);

  const allowMap = new Map<string, boolean>();
  for (const permission of permissions) {
    const key = String(permission.userId ?? "");
    // Query is sorted newest-first; keep the first value as canonical for each user.
    if (allowMap.has(key)) continue;
    allowMap.set(key, Boolean(permission.canJoin));
  }

  return NextResponse.json({
    roomId,
    managers: users.map((user) => ({
      userId: String(user._id),
      userName: String(user.name ?? "Unknown Manager"),
      email: String(user.email ?? ""),
      canJoin: allowMap.get(String(user._id)) ?? false,
    })),
  });
}

export async function POST(request: NextRequest) {
  const access = await requireAdmin();
  if (!access.ok) return access.response;

  const body = await request.json();
  const roomId = String(body?.roomId ?? "").trim();
  const action = String(body?.action ?? "").trim();
  const userId = String(body?.userId ?? "").trim();
  const canJoin = Boolean(body?.canJoin);

  if (!roomId) {
    return NextResponse.json({ error: "roomId is required" }, { status: 400 });
  }

  const db = await getDb();

  if (action === "grant-all" || action === "revoke-all") {
    // Bulk toggle applies a consistent canJoin flag to every manager in the room.
    const nextCanJoin = action === "grant-all";
    const users = await db.collection("users").find({ role: "manager" }).toArray();

    if (users.length === 0) {
      return NextResponse.json({ ok: true, message: "No managers found" });
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

        // Cleanup old ObjectId-based rows so one user has a single canonical roomAccess record.
        await db.collection("roomAccess").deleteMany({ roomId, userId: user._id });
      })
    );

    await db.collection("adminAuditLog").insertOne({
      roomId,
      userId: "room",
      userName: "Room Access",
      action: "room-access-bulk",
      message: nextCanJoin
        ? "Admin granted room access to all managers."
        : "Admin revoked room access from all managers.",
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      ok: true,
      message: nextCanJoin ? "Access granted for all managers" : "Access revoked for all managers",
    });
  }

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const userObjectId = toObjectId(userId);
  const user = userObjectId
    ? await db.collection("users").findOne({ _id: userObjectId, role: "manager" })
    : null;

  if (!user) {
    return NextResponse.json({ error: "Manager not found" }, { status: 404 });
  }

  await db.collection("roomAccess").updateOne(
    userObjectId
      // Match both ID formats so updates converge into a single string-keyed record.
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

  return NextResponse.json({ ok: true, message: canJoin ? "Access granted" : "Access revoked" });
}
