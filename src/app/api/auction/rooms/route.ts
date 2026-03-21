import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requireAdmin } from "@/lib/roles";
import { getDb } from "@/lib/mongodb";

export async function GET() {
  const db = await getDb();
  const rooms = await db
    .collection("auctionRooms")
    .find({})
    .sort({ createdAt: -1 })
    .toArray();

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

  await db.collection("auctionRooms").insertOne({
    roomId,
    name: name.trim(),
    status: "waiting",
    timer: 120,
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
