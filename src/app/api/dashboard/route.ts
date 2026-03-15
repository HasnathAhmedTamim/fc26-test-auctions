import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/lib/mongodb";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();

  const [stats, activeRoom] = await Promise.all([
    db.collection("managerStats").findOne({ userId: session.user.id }),
    db
      .collection("auctionRooms")
      .findOne({ status: { $in: ["live", "waiting", "sold"] } }),
  ]);

  const budgetLimit = activeRoom?.budget ?? 2000;
  const budgetSpent = stats?.budgetSpent ?? 0;

  return NextResponse.json({
    budgetLeft: budgetLimit - budgetSpent,
    budgetSpent,
    budgetLimit,
    playersBought: stats?.playersBought?.length ?? 0,
    playersList: stats?.playersBought ?? [],
    tournamentStatus: activeRoom ? activeRoom.status : "No active room",
    activeRoomId: activeRoom?.roomId ?? null,
  });
}
