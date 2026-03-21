import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/lib/mongodb";

const ROUND_TIME_SECONDS = 120;

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
      timer: Math.max(0, Number(room.timer ?? ROUND_TIME_SECONDS)),
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