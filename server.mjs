import dotenv from "dotenv";
import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
import { MongoClient } from "mongodb";

dotenv.config({ path: ".env.local" });

console.log("ENV CHECK:", process.env.MONGODB_URI);

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();
const ROUND_TIME_SECONDS = 120;

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  throw new Error("MONGODB_URI is missing in .env.local");
}

const client = new MongoClient(mongoUri);

app.prepare().then(async () => {
  await client.connect();
  const db = client.db("fc26-auction");

  const httpServer = createServer(handler);
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  });

  // Per-room countdown timers
  const roomTimers = new Map();
  // In-memory remaining time for live rooms (for users joining mid-round)
  const roomTimeLeft = new Map();
  // Users who opted out for the current player in each room
  const roomOptOuts = new Map();

  function clearRoomTimer(roomId) {
    if (roomTimers.has(roomId)) {
      clearInterval(roomTimers.get(roomId));
      roomTimers.delete(roomId);
    }
    roomTimeLeft.delete(roomId);
  }

  function clearRoomOptOuts(roomId) {
    roomOptOuts.delete(roomId);
  }

  async function startRoomTimer(roomId) {
    clearRoomTimer(roomId);
    let timeLeft = ROUND_TIME_SECONDS;
    roomTimeLeft.set(roomId, timeLeft);

    const interval = setInterval(async () => {
      timeLeft--;
      roomTimeLeft.set(roomId, timeLeft);
      io.to(roomId).emit("auction:timer-tick", { timer: timeLeft });

      if (timeLeft <= 0) {
        clearRoomTimer(roomId);
        clearRoomOptOuts(roomId);
        const room = await db.collection("auctionRooms").findOne({ roomId });

        if (room?.highestBidderId && room?.currentPlayer) {
          // Player sold to highest bidder
          const { highestBidderId: winnerId, highestBidderName: winnerName, currentBid: amount, currentPlayer: player } = room;

          await db.collection("managerStats").updateOne(
            { userId: winnerId, roomId },
            {
              $inc: { budgetSpent: amount },
              $push: { playersBought: { playerId: player.id, playerName: player.name, amount } },
              $setOnInsert: { userName: winnerName },
            },
            { upsert: true }
          );

          await db.collection("auctionRooms").updateOne(
            { roomId },
            { $set: { status: "sold", updatedAt: new Date() } }
          );

          io.to(roomId).emit("auction:sold", { player, winnerId, winnerName, amount });
        } else {
          // No bids — reset the player slot
          await db.collection("auctionRooms").updateOne(
            { roomId },
            {
              $set: {
                status: "waiting",
                currentPlayer: null,
                currentBid: 0,
                highestBidderId: null,
                highestBidderName: null,
                timer: ROUND_TIME_SECONDS,
                updatedAt: new Date(),
              },
            }
          );
          io.to(roomId).emit("auction:no-bid", { message: "No bids placed. Player skipped." });
        }
      }
    }, 1000);

    roomTimers.set(roomId, interval);
  }

  io.on("connection", (socket) => {
    socket.on("auction:join", async ({ roomId, user }) => {
      socket.join(roomId);

      const room = await db.collection("auctionRooms").findOne({ roomId });
      const recentBids = await db
        .collection("bids")
        .find({ roomId })
        .sort({ createdAt: -1 })
        .limit(10)
        .toArray();

      const timerForClient = room?.status === "live"
        ? (roomTimeLeft.get(roomId) ?? ROUND_TIME_SECONDS)
        : ROUND_TIME_SECONDS;

      socket.emit("auction:state", {
        roomId,
        status: room?.status ?? "waiting",
        timer: timerForClient,
        currentPlayer: room?.currentPlayer ?? null,
        currentBid: room?.currentBid ?? 0,
        highestBidderId: room?.highestBidderId ?? null,
        highestBidderName: room?.highestBidderName ?? null,
        bidHistory: recentBids.reverse().map((bid) => ({
          userId: bid.userId,
          userName: bid.userName,
          amount: bid.amount,
          timestamp: bid.createdAt,
        })),
      });

      io.to(roomId).emit("auction:user-joined", {
        userName: user?.name ?? "Unknown",
      });
    });

    socket.on("auction:bid", async (payload) => {
      const { roomId, userId, userName, amount } = payload;

      const optedOutUsers = roomOptOuts.get(roomId);
      if (optedOutUsers?.has(userId)) {
        socket.emit("auction:error", {
          message: "You opted out for this player. Wait for the next player.",
        });
        return;
      }

      const room = await db.collection("auctionRooms").findOne({ roomId });

      if (!room) {
        socket.emit("auction:error", { message: "Room not found" });
        return;
      }

      if (room.status !== "live") {
        socket.emit("auction:error", { message: "Auction is not live" });
        return;
      }

      if (typeof amount !== "number" || amount <= (room.currentBid ?? 0)) {
        socket.emit("auction:error", { message: "Bid must be higher than current bid" });
        return;
      }

      const bidDoc = {
        roomId,
        userId,
        userName,
        playerId: room.currentPlayer?.id ?? null,
        amount,
        createdAt: new Date().toISOString(),
      };

      await db.collection("bids").insertOne(bidDoc);

      await db.collection("auctionRooms").updateOne(
        { roomId },
        {
          $set: {
            currentBid: amount,
            highestBidderId: userId,
            highestBidderName: userName,
            updatedAt: new Date(),
          },
        }
      );

      io.to(roomId).emit("auction:new-bid", {
        userId,
        userName,
        amount,
        timestamp: bidDoc.createdAt,
      });

      io.to(roomId).emit("auction:bid-updated", {
        currentBid: amount,
        highestBidderId: userId,
        highestBidderName: userName,
      });
    });

    socket.on("auction:start", async ({ roomId }) => {
      const room = await db.collection("auctionRooms").findOne({ roomId });
      if (!room?.currentPlayer) {
        socket.emit("auction:error", { message: "Set a player before starting the auction" });
        return;
      }

      await db.collection("auctionRooms").updateOne(
        { roomId },
        { $set: { status: "live", timer: ROUND_TIME_SECONDS, updatedAt: new Date() } }
      );

      io.to(roomId).emit("auction:started", { status: "live", timer: ROUND_TIME_SECONDS });
      await startRoomTimer(roomId);
    });

    socket.on("auction:set-player", async ({ roomId, player }) => {
      if (!player?.id || !player?.name) return;
      clearRoomTimer(roomId);
      clearRoomOptOuts(roomId);

      const basePrice = Number(player.basePrice) || 10;

      await db.collection("auctionRooms").updateOne(
        { roomId },
        {
          $set: {
            currentPlayer: {
              id: String(player.id),
              name: String(player.name),
              rating: Number(player.rating) || 0,
              position: String(player.position || ""),
              club: String(player.club || ""),
              nation: String(player.nation || ""),
              image: String(player.image || ""),
              basePrice,
            },
            currentBid: Math.max(0, basePrice - 10),
            status: "waiting",
            highestBidderId: null,
            highestBidderName: null,
            timer: ROUND_TIME_SECONDS,
            updatedAt: new Date(),
          },
        }
      );

      io.to(roomId).emit("auction:player-set", {
        player,
        currentBid: Math.max(0, basePrice - 10),
      });
    });

    socket.on("auction:opt-out", ({ roomId, userId, userName }) => {
      if (!roomId || !userId) return;

      const optedOutUsers = roomOptOuts.get(roomId) ?? new Set();
      optedOutUsers.add(userId);
      roomOptOuts.set(roomId, optedOutUsers);

      socket.emit("auction:you-opted-out", {});
      io.to(roomId).emit("auction:user-opted-out", {
        userId,
        userName: userName ?? "Unknown",
      });
    });

    socket.on("auction:skip", async ({ roomId }) => {
      clearRoomTimer(roomId);
      clearRoomOptOuts(roomId);

      await db.collection("auctionRooms").updateOne(
        { roomId },
        {
          $set: {
            status: "waiting",
            currentPlayer: null,
            currentBid: 0,
            highestBidderId: null,
            highestBidderName: null,
            timer: ROUND_TIME_SECONDS,
            updatedAt: new Date(),
          },
        }
      );

      io.to(roomId).emit("auction:skipped", {});
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});