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

      socket.emit("auction:state", {
        roomId,
        status: room?.status ?? "waiting",
        timer: room?.timer ?? 30,
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

      const room = await db.collection("auctionRooms").findOne({ roomId });

      if (!room) {
        socket.emit("auction:error", { message: "Room not found" });
        return;
      }

      if (room.status !== "live") {
        socket.emit("auction:error", { message: "Auction is not live" });
        return;
      }

      if (amount <= (room.currentBid ?? 0)) {
        socket.emit("auction:error", {
          message: "Bid must be higher than current bid",
        });
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
      await db.collection("auctionRooms").updateOne(
        { roomId },
        {
          $set: {
            status: "live",
            timer: 30,
            updatedAt: new Date(),
          },
        }
      );

      io.to(roomId).emit("auction:started", {
        status: "live",
        timer: 30,
      });
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});