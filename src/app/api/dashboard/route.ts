import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/lib/mongodb";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const roomsCollection = db.collection("auctionRooms");
  const statsCollection = db.collection("managerStats");

  const activeRoom = await roomsCollection.findOne(
    { status: { $in: ["live", "waiting", "sold", "paused"] } },
    { sort: { createdAt: -1 } }
  );

  let dashboardRoom = activeRoom;
  let stats = activeRoom
    ? await statsCollection.findOne({
        userId: session.user.id,
        roomId: activeRoom.roomId,
      })
    : null;

  if (!stats) {
    const latestStats = await statsCollection.find({ userId: session.user.id })
      .sort({ updatedAt: -1, createdAt: -1 })
      .limit(1)
      .next();

    if (latestStats) {
      const statsRoom = await roomsCollection.findOne({ roomId: latestStats.roomId });
      dashboardRoom = statsRoom ?? dashboardRoom;
      stats = latestStats;
    }
  }

  const budgetLimit = dashboardRoom?.budget ?? 2000;
  const budgetSpent = stats?.budgetSpent ?? 0;

  return NextResponse.json({
    budgetLeft: Math.max(0, budgetLimit - budgetSpent),
    budgetSpent,
    budgetLimit,
    playersBought: stats?.playersBought?.length ?? 0,
    playersList: stats?.playersBought ?? [],
    tournamentStatus: dashboardRoom ? dashboardRoom.status : "No active room",
    activeRoomId: dashboardRoom?.roomId ?? null,
  });
}
