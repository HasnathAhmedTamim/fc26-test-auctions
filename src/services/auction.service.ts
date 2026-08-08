import { Db } from "mongodb";
import { toObjectId } from "@/lib/db/object-id";

export async function findRoomById(db: Db, roomId: string) {
  return db.collection("auctionRooms").findOne({ roomId });
}

export async function listAccessibleRooms(db: Db, userId: string, role: "admin" | "manager") {
  if (role === "admin") {
    const rooms = await db.collection("auctionRooms").find({}).sort({ createdAt: -1 }).toArray();
    return rooms;
  }

  const userObjectId = toObjectId(userId);
  const accessQuery = userObjectId
    ? {
        canJoin: true,
        $or: [{ userId }, { userId: userObjectId }],
      }
    : {
        userId,
        canJoin: true,
      };

  const accessRows = await db.collection("roomAccess").find(accessQuery).toArray();
  const roomIds = [...new Set(accessRows.map((row) => String(row.roomId)))];

  if (!roomIds.length) return [];

  return db
    .collection("auctionRooms")
    .find({ roomId: { $in: roomIds } })
    .sort({ createdAt: -1 })
    .toArray();
}

export async function userCanAccessRoom(
  db: Db,
  roomId: string,
  userId: string,
  role: "admin" | "manager"
) {
  if (role === "admin") return true;

  const userObjectId = toObjectId(userId);
  const accessQuery = userObjectId
    ? {
        roomId,
        canJoin: true,
        $or: [{ userId }, { userId: userObjectId }],
      }
    : {
        roomId,
        userId,
        canJoin: true,
      };

  const access = await db.collection("roomAccess").findOne(accessQuery);
  return Boolean(access);
}

export async function createRoom(
  db: Db,
  payload: { roomId: string; name: string; budget: number; maxPlayers: number; timer?: number }
) {
  const now = new Date();
  await db.collection("auctionRooms").insertOne({
    roomId: payload.roomId,
    name: payload.name,
    status: "waiting",
    timer: payload.timer ?? 120,
    currentPlayer: null,
    currentBid: 0,
    highestBidderId: null,
    highestBidderName: null,
    budget: payload.budget,
    maxPlayers: payload.maxPlayers,
    createdAt: now,
    updatedAt: now,
  });
}

export async function getRoomLiveState(db: Db, roomId: string, defaultTimer: number) {
  const room = await findRoomById(db, roomId);
  if (!room) return null;

  const [recentBids, soldPlayers] = await Promise.all([
    db.collection("bids").find({ roomId }).sort({ createdAt: -1 }).limit(10).toArray(),
    db.collection("soldPlayers").find({ roomId }).sort({ createdAt: -1 }).limit(20).toArray(),
  ]);

  return {
    room: {
      roomId: room.roomId,
      status: room.status,
      timer: Math.max(0, Number(room.timer ?? defaultTimer)),
      currentPlayer: room.currentPlayer,
      currentBid: room.currentBid,
      highestBidderId: room.highestBidderId,
      highestBidderName: room.highestBidderName,
    },
    bidHistory: recentBids.map((bid) => ({
      userId: bid.userId,
      userName: bid.userName,
      amount: bid.amount,
      timestamp: bid.createdAt,
    })),
    soldPlayers: soldPlayers.map((item) => ({
      playerName: item.playerName,
      winnerName: item.winnerName,
      amount: Number(item.amount ?? 0),
      timestamp: item.createdAt,
    })),
  };
}

export async function deleteRoomCascade(db: Db, roomId: string) {
  await Promise.all([
    db.collection("auctionRooms").deleteOne({ roomId }),
    db.collection("bids").deleteMany({ roomId }),
    db.collection("soldPlayers").deleteMany({ roomId }),
    db.collection("managerStats").deleteMany({ roomId }),
    db.collection("roomAccess").deleteMany({ roomId }),
    db.collection("lineups").deleteMany({ roomId }),
  ]);
}
