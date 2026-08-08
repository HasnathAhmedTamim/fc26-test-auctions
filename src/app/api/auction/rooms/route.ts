import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { auth } from "@/auth";
import { requireAdmin } from "@/lib/roles";
import { getDb } from "@/lib/mongodb";
import { getAuctionRuntimeSettings } from "@/lib/auction-settings";
import {
  createRoom,
  deleteRoomCascade,
  findRoomById,
  listAccessibleRooms,
} from "@/services/auction.service";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const role = session.user.role === "admin" ? "admin" : "manager";
  const rooms = await listAccessibleRooms(db, session.user.id, role);

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

  await createRoom(db, {
    roomId,
    name: name.trim(),
    budget: parsedBudget,
    maxPlayers: parsedMaxPlayers,
    timer: runtimeSettings.roundTimeSeconds,
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
  const room = await findRoomById(db, roomId);
  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  await deleteRoomCascade(db, roomId);
  await db.collection("adminAuditLog").deleteMany({ roomId });

  return NextResponse.json({ ok: true, message: "Room deleted" });
}
