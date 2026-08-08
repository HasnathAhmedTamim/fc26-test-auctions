import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/roles";
import { getDb } from "@/lib/mongodb";
import {
  bulkSetRoomAccess,
  getRoomAccessManagers,
  setRoomAccess,
} from "@/services/room-access.service";

export async function GET(request: NextRequest) {
  const access = await requireAdmin();
  if (!access.ok) return access.response;

  const roomId = request.nextUrl.searchParams.get("roomId")?.trim();
  if (!roomId) {
    return NextResponse.json({ error: "roomId is required" }, { status: 400 });
  }

  const db = await getDb();
  const managers = await getRoomAccessManagers(db, roomId);

  return NextResponse.json({ roomId, managers });
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
    const result = await bulkSetRoomAccess(db, roomId, action, access.session.user.id);
    return NextResponse.json({ ok: true, message: result.message });
  }

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const result = await setRoomAccess(db, roomId, userId, canJoin);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true, message: result.message });
}
