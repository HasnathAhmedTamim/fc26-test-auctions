import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/roles";
import {
  getManagerRoster,
  mutateManagerStats,
  mutateRoomLifecycle,
} from "@/services/manager-stats.service";

export async function GET(request: NextRequest) {
  const access = await requireAdmin();
  if (!access.ok) return access.response;

  const roomId = request.nextUrl.searchParams.get("roomId");
  if (!roomId) {
    return NextResponse.json({ error: "roomId is required" }, { status: 400 });
  }

  const db = await getDb();
  const roster = await getManagerRoster(db, roomId);
  if (!roster) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  return NextResponse.json(roster);
}

export async function POST(request: NextRequest) {
  const access = await requireAdmin();
  if (!access.ok) return access.response;

  const body = await request.json();
  const roomId = String(body.roomId ?? "").trim();
  const userId = String(body.userId ?? "").trim();
  const playerId = String(body.playerId ?? "").trim();
  const action = String(body.action ?? "").trim();
  const amountValue = Number(body.amount);

  if (!roomId || !userId) {
    return NextResponse.json({ error: "roomId and userId are required" }, { status: 400 });
  }

  if (action !== "add" && action !== "remove" && action !== "adjust-budget") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  if (action !== "adjust-budget" && !playerId) {
    return NextResponse.json({ error: "playerId is required" }, { status: 400 });
  }

  const db = await getDb();
  const result = await mutateManagerStats(db, {
    roomId,
    userId,
    action,
    playerId,
    amount: amountValue,
    adjustment: Number(body.adjustment ?? 0),
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true, message: result.message });
}

export async function PATCH(request: NextRequest) {
  const access = await requireAdmin();
  if (!access.ok) return access.response;

  const body = await request.json();
  const action = String(body.action ?? "").trim();
  const roomId = String(body.roomId ?? "").trim();

  if (!roomId) {
    return NextResponse.json({ error: "roomId is required" }, { status: 400 });
  }

  if (action !== "end" && action !== "reset") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const db = await getDb();
  const result = await mutateRoomLifecycle(db, roomId, action);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true, message: result.message });
}
