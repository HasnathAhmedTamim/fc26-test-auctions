import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { auth } from "@/auth";
import { getDb } from "@/lib/mongodb";

function toObjectId(value: string) {
  try {
    return new ObjectId(value);
  } catch {
    return null;
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { roomId } = await params;
  const db = await getDb();

  if (session.user.role !== "admin") {
    const userObjectId = toObjectId(session.user.id);
    const accessQuery = userObjectId
      ? {
          roomId,
          canJoin: true,
          $or: [{ userId: session.user.id }, { userId: userObjectId }],
        }
      : {
          roomId,
          userId: session.user.id,
          canJoin: true,
        };

    const permission = await db.collection("roomAccess").findOne(accessQuery);

    if (!permission) {
      return NextResponse.json({ error: "Room access denied" }, { status: 403 });
    }
  }

  const room = await db.collection("auctionRooms").findOne({ roomId });
  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  const stats = await db.collection("managerStats").findOne({
    roomId,
    userId: session.user.id,
  });
  const auditEntries = await db
    .collection("adminAuditLog")
    .find({ roomId, $or: [{ userId: session.user.id }, { userId: "room" }] })
    .sort({ createdAt: -1 })
    .limit(10)
    .toArray();

  const playersBought = Array.isArray(stats?.playersBought) ? stats.playersBought : [];
  const budgetLimit = Number(room.budget ?? 2000);
  const budgetSpent = Number(stats?.budgetSpent ?? 0);
  const maxPlayers = Number(room.maxPlayers ?? 24);

  return NextResponse.json({
    budgetLimit,
    budgetSpent,
    budgetLeft: Math.max(0, budgetLimit - budgetSpent),
    maxPlayers,
    playersBought: playersBought.length,
    squadSlotsLeft: Math.max(0, maxPlayers - playersBought.length),
    auditEntries: auditEntries.map((entry) => ({
      id: String(entry._id),
      message: String(entry.message ?? "Admin updated this room."),
      timestamp: String(entry.createdAt ?? new Date().toISOString()),
    })),
  });
}