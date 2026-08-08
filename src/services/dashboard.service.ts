import { Db } from "mongodb";

type BoughtPlayer = {
  playerId: string;
  playerName: string;
  amount: number;
};

export async function resolveUserRoster(db: Db, userId: string) {
  const roomsCollection = db.collection("auctionRooms");
  const statsCollection = db.collection("managerStats");

  const activeRoom = await roomsCollection.findOne(
    { status: { $in: ["live", "waiting", "sold", "paused"] } },
    { sort: { createdAt: -1 } }
  );

  let dashboardRoom = activeRoom;
  let stats = activeRoom
    ? await statsCollection.findOne({
        userId,
        roomId: activeRoom.roomId,
      })
    : null;

  if (!stats) {
    const latestStats = await statsCollection.find({ userId })
      .sort({ updatedAt: -1, createdAt: -1 })
      .limit(1)
      .next();

    if (latestStats) {
      const statsRoom = await roomsCollection.findOne({ roomId: latestStats.roomId });
      dashboardRoom = statsRoom ?? dashboardRoom;
      stats = latestStats;
    }
  }

  return {
    roomId: String(dashboardRoom?.roomId ?? ""),
    room: dashboardRoom,
    stats,
    playersBought: (stats?.playersBought ?? []) as BoughtPlayer[],
  };
}

export async function getDashboardSummary(db: Db, userId: string) {
  const { room, stats } = await resolveUserRoster(db, userId);
  const budgetLimit = room?.budget ?? 2000;
  const budgetSpent = stats?.budgetSpent ?? 0;

  return {
    budgetLeft: Math.max(0, budgetLimit - budgetSpent),
    budgetSpent,
    budgetLimit,
    playersBought: stats?.playersBought?.length ?? 0,
    playersList: stats?.playersBought ?? [],
    tournamentStatus: room ? room.status : "No active room",
    activeRoomId: room?.roomId ?? null,
  };
}

export type { BoughtPlayer };
