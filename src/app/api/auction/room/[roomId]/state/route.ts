import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { auth } from "@/auth";
import { getDb } from "@/lib/mongodb";
import { getAuctionRuntimeSettings } from "@/lib/auction-settings";

function toObjectId(value: string) {
  try {
    return new ObjectId(value);
  } catch {
    return null;
  }
}

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
  const runtimeSettings = await getAuctionRuntimeSettings(db);

  if (session.user.role !== "admin") {
    const userObjectId = toObjectId(session.user.id);
    const accessQuery = userObjectId
      ? {
          roomId,
          canJoin: true,
          $or: [{ userId: session.user.id }, { userId: userObjectId }],
        }
      : {
          roomId,
          userId: session.user.id,
          canJoin: true,
        };

    const permission = await db.collection("roomAccess").findOne(accessQuery);

    if (!permission) {
      return NextResponse.json({ error: "Room access denied" }, { status: 403 });
    }
  }

  const room = await db.collection("auctionRooms").findOne({ roomId });

  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  const recentBids = await db
    .collection("bids")
    .find({ roomId })
    .sort({ createdAt: -1 })
    .limit(10)
    .toArray();
  const soldPlayers = await db
    .collection("soldPlayers")
    .find({ roomId })
    .sort({ createdAt: -1 })
    .limit(20)
    .toArray();

  return NextResponse.json({
    room: {
      roomId: room.roomId,
      status: room.status,
      timer: Math.max(0, Number(room.timer ?? runtimeSettings.roundTimeSeconds)),
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
  });
}