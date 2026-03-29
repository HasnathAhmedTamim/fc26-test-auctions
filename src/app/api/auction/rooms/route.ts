import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { ObjectId } from "mongodb";
import { auth } from "@/auth";
import { requireAdmin } from "@/lib/roles";
import { getDb } from "@/lib/mongodb";
import { getAuctionRuntimeSettings } from "@/lib/auction-settings";

function toObjectId(value: string) {
  try {
    return new ObjectId(value);
  } catch {
    return null;
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  let roomQuery: Record<string, unknown> = {};

  if (session.user.role !== "admin") {
    const userObjectId = toObjectId(session.user.id);
    const accessQuery = userObjectId
      ? {
          canJoin: true,
          $or: [{ userId: session.user.id }, { userId: userObjectId }],
        }
      : {
          canJoin: true,
          userId: session.user.id,
        };

    const grantedAccess = await db
      .collection("roomAccess")
      .find(accessQuery, { projection: { roomId: 1 } })
      .toArray();

    const roomIds = [...new Set(grantedAccess.map((entry) => String(entry.roomId ?? "")).filter(Boolean))];
    roomQuery = roomIds.length ? { roomId: { $in: roomIds } } : { roomId: { $in: [] } };
  }

  const rooms = await db.collection("auctionRooms").find(roomQuery).sort({ createdAt: -1 }).toArray();

  return NextResponse.json({
    rooms: rooms.map((r) => ({
      roomId: r.roomId,
      name: r.name,
      status: r.status,
      budget: r.budget,
      maxPlayers: r.maxPlayers,
      createdAt: r.createdAt,
    })),
  });
}

export async function POST(req: Request) {
  const access = await requireAdmin();
  if (!access.ok) return access.response;

  const body = await req.json();
  const { name, budget, maxPlayers } = body;
  const parsedBudget = Number(budget);
  const parsedMaxPlayers = Number(maxPlayers);

  if (!name || typeof name !== "string" || name.trim().length < 2) {
    return NextResponse.json({ error: "Room name must be at least 2 characters" }, { status: 400 });
  }

  if (!Number.isFinite(parsedBudget) || parsedBudget <= 0) {
    return NextResponse.json({ error: "Budget must be a positive number" }, { status: 400 });
  }

  if (!Number.isInteger(parsedMaxPlayers) || parsedMaxPlayers <= 0) {
    return NextResponse.json({ error: "maxPlayers must be a positive integer" }, { status: 400 });
  }

  const roomId = randomUUID().slice(0, 8);
  const db = await getDb();
  const runtimeSettings = await getAuctionRuntimeSettings(db);

  await db.collection("auctionRooms").insertOne({
    roomId,
    name: name.trim(),
    status: "waiting",
    timer: runtimeSettings.roundTimeSeconds,
    currentPlayer: null,
    currentBid: 0,
    highestBidderId: null,
    highestBidderName: null,
    budget: parsedBudget,
    maxPlayers: parsedMaxPlayers,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return NextResponse.json({ roomId, message: "Room created" }, { status: 201 });
}

export async function DELETE(req: Request) {
  const access = await requireAdmin();
  if (!access.ok) return access.response;

  const body = await req.json();
  const roomId = String(body?.roomId ?? "").trim();

  if (!roomId) {
    return NextResponse.json({ error: "roomId is required" }, { status: 400 });
  }

  const db = await getDb();
  const room = await db.collection("auctionRooms").findOne({ roomId });
  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  await Promise.all([
    db.collection("auctionRooms").deleteOne({ roomId }),
    db.collection("managerStats").deleteMany({ roomId }),
    db.collection("bids").deleteMany({ roomId }),
    db.collection("soldPlayers").deleteMany({ roomId }),
    db.collection("adminAuditLog").deleteMany({ roomId }),
    db.collection("roomAccess").deleteMany({ roomId }),
    db.collection("lineups").deleteMany({ roomId }),
  ]);

  return NextResponse.json({ ok: true, message: "Room deleted" });
}
