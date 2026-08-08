import { Db } from "mongodb";

type BoughtPlayer = {
  playerId: string;
  playerName: string;
  amount: number;
};

export async function listUserLineupRooms(db: Db, userId: string) {
  const statsRows = await db
    .collection("managerStats")
    .find({ userId })
    .sort({ updatedAt: -1, createdAt: -1 })
    .toArray();

  const roomIds = [
    ...new Set(statsRows.map((row) => String(row.roomId ?? "")).filter(Boolean)),
  ];

  if (!roomIds.length) return [];

  const rooms = await db
    .collection("auctionRooms")
    .find({ roomId: { $in: roomIds } })
    .toArray();
  const roomById = new Map(rooms.map((room) => [String(room.roomId ?? ""), room]));

  const seen = new Set<string>();
  const options: Array<{ roomId: string; roomName: string; playersCount: number }> = [];

  for (const row of statsRows) {
    const roomId = String(row.roomId ?? "");
    if (!roomId || seen.has(roomId)) continue;

    const bought = (row.playersBought ?? []) as BoughtPlayer[];
    if (!bought.length) continue;

    seen.add(roomId);
    const room = roomById.get(roomId);
    options.push({
      roomId,
      roomName: String(room?.name ?? roomId),
      playersCount: bought.length,
    });
  }

  return options;
}

export async function resolveUserRosterForRoom(db: Db, userId: string, roomId?: string) {
  if (roomId) {
    const [stats, room] = await Promise.all([
      db.collection("managerStats").findOne({ userId, roomId }),
      db.collection("auctionRooms").findOne({ roomId }),
    ]);

    const playersBought = (stats?.playersBought ?? []) as BoughtPlayer[];

    return {
      roomId: playersBought.length ? roomId : "",
      room,
      stats,
      playersBought,
    };
  }

  return resolveUserRoster(db, userId);
}

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
