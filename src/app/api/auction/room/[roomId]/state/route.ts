import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/lib/mongodb";
import { getAuctionRuntimeSettings } from "@/lib/auction-settings";
import { getRoomLiveState, userCanAccessRoom } from "@/services/auction.service";

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
  const role = session.user.role === "admin" ? "admin" : "manager";

  if (!(await userCanAccessRoom(db, roomId, session.user.id, role))) {
    return NextResponse.json({ error: "Room access denied" }, { status: 403 });
  }

  const runtimeSettings = await getAuctionRuntimeSettings(db);
  const state = await getRoomLiveState(db, roomId, runtimeSettings.roundTimeSeconds);

  if (!state) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  return NextResponse.json(state);
}
