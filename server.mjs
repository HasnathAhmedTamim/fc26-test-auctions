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

  // Connected managers per room: roomId -> Map<userId, { role, userName, socketId }>
  const roomConnectedManagers = new Map();

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

  function addManagerToRoom(roomId, userId, userName, role, socketId) {
    if (!roomConnectedManagers.has(roomId)) {
      roomConnectedManagers.set(roomId, new Map());
    }
    roomConnectedManagers.get(roomId).set(userId, { role, userName, socketId });
  }

  function removeSocketFromRooms(socketId) {
    const affectedRooms = [];
    for (const [roomId, managers] of roomConnectedManagers.entries()) {
      for (const [userId, info] of managers.entries()) {
        if (info.socketId === socketId) {
          managers.delete(userId);
          affectedRooms.push(roomId);
        }
      }
    }
    return affectedRooms;
  }

  async function getManagerRoomSnapshot(roomId, userId) {
    const stats = await db.collection("managerStats").findOne({ userId, roomId });
    const playersBought = Array.isArray(stats?.playersBought) ? stats.playersBought : [];

    return {
      budgetSpent: Number(stats?.budgetSpent ?? 0),
      playersBoughtCount: playersBought.length,
    };
  }

  async function validateManagerEligibility(room, userId, amount) {
    if (!room?.roomId || !userId) {
      return { ok: false, message: "Missing room or bidder information." };
    }

    const budgetLimit = Number(room.budget ?? 2000);
    const maxPlayers = Number(room.maxPlayers ?? 24);
    const { budgetSpent, playersBoughtCount } = await getManagerRoomSnapshot(room.roomId, userId);
    const remainingBudget = Math.max(0, budgetLimit - budgetSpent);
    const squadSlotsLeft = Math.max(0, maxPlayers - playersBoughtCount);

    if (playersBoughtCount >= maxPlayers) {
      return {
        ok: false,
        message: `Squad limit reached. You already have ${playersBoughtCount}/${maxPlayers} players in this room.`,
      };
    }

    if (Number(amount) > remainingBudget) {
      return {
        ok: false,
        message: `Bid exceeds your remaining budget. You have ${remainingBudget} coins left in this room.`,
      };
    }

    return {
      ok: true,
      remainingBudget,
      squadSlotsLeft,
    };
  }

  async function awardPlayerToWinner(room) {
    const winnerId = room.highestBidderId;
    const winnerName = room.highestBidderName ?? "Unknown";
    const amount = Number(room.currentBid ?? 0);
    const player = room.currentPlayer;

    await db.collection("managerStats").updateOne(
      { userId: winnerId, roomId: room.roomId },
      {
        $inc: { budgetSpent: amount },
        $push: { playersBought: { playerId: player.id, playerName: player.name, amount } },
        $setOnInsert: { userName: winnerName },
      },
      { upsert: true }
    );

    await db.collection("auctionRooms").updateOne(
      { roomId: room.roomId },
      { $set: { status: "sold", updatedAt: new Date() } }
    );

    await db.collection("soldPlayers").insertOne({
      roomId: room.roomId,
      playerId: player.id,
      playerName: player.name,
      winnerId,
      winnerName,
      amount,
      createdAt: new Date().toISOString(),
    });

    clearRoomTimer(room.roomId);
    clearRoomOptOuts(room.roomId);
    io.to(room.roomId).emit("auction:sold", { player, winnerId, winnerName, amount });
  }

  async function checkAllOptedOut(roomId) {
    const room = await db.collection("auctionRooms").findOne({ roomId });
    if (!room || room.status !== "live" || !room.highestBidderId) return;

    const managers = roomConnectedManagers.get(roomId) ?? new Map();
    const optedOut = roomOptOuts.get(roomId) ?? new Set();
    const highestBidderId = room.highestBidderId;

    // All connected non-admin managers who are NOT the current highest bidder
    const eligibleManagers = [...managers.entries()].filter(
      ([userId, info]) => info.role !== "admin" && userId !== highestBidderId
    );

    // Need at least one other active non-highest-bidder manager for auto-pause to trigger
    if (eligibleManagers.length === 0) return;

    const allOtherOptedOut = eligibleManagers.every(([userId]) => optedOut.has(userId));
    if (!allOtherOptedOut) return;

    // Auto-pause: freeze the timer
    const remaining = roomTimeLeft.get(roomId) ?? room.timer ?? ROUND_TIME_SECONDS;
    if (roomTimers.has(roomId)) {
      clearInterval(roomTimers.get(roomId));
      roomTimers.delete(roomId);
    }

    await db.collection("auctionRooms").updateOne(
      { roomId },
      { $set: { status: "paused", timer: remaining, updatedAt: new Date() } }
    );

    io.to(roomId).emit("auction:auto-paused", {
      status: "paused",
      timer: remaining,
      leadingBidder: room.highestBidderName,
      amount: room.currentBid,
    });
  }

  async function startRoomTimer(roomId, initialTime = ROUND_TIME_SECONDS) {
    clearRoomTimer(roomId);
    let timeLeft = Math.max(1, Number(initialTime) || ROUND_TIME_SECONDS);
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
          const saleCheck = await validateManagerEligibility(
            room,
            room.highestBidderId,
            Number(room.currentBid ?? 0)
          );

          if (!saleCheck.ok) {
            await db.collection("auctionRooms").updateOne(
              { roomId },
              { $set: { status: "paused", timer: 0, updatedAt: new Date() } }
            );
            io.to(roomId).emit("auction:paused", { status: "paused", timer: 0 });
            io.to(roomId).emit("auction:error", {
              message: `Auto-sell blocked. ${saleCheck.message} Admin action is required.`,
            });
            return;
          }

          await awardPlayerToWinner(room);
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

  async function finalizeCurrentPlayerAsSold(roomId, sourceSocket) {
    const room = await db.collection("auctionRooms").findOne({ roomId });

    if (!room) {
      sourceSocket.emit("auction:error", { message: "Room not found" });
      return;
    }

    if (!room.currentPlayer) {
      sourceSocket.emit("auction:error", { message: "No active player" });
      return;
    }

    if (!room.highestBidderId) {
      sourceSocket.emit("auction:error", { message: "No bids yet to mark as sold" });
      return;
    }

    const winnerId = room.highestBidderId;
    const winnerName = room.highestBidderName ?? "Unknown";
    const amount = room.currentBid ?? 0;
    const saleCheck = await validateManagerEligibility(room, winnerId, amount);

    if (!saleCheck.ok) {
      sourceSocket.emit("auction:error", { message: saleCheck.message });
      return;
    }

    await awardPlayerToWinner(room);
  }

  io.on("connection", (socket) => {
    socket.on("auction:join", async ({ roomId, user }) => {
      socket.join(roomId);

      // Track this user so we can detect when all others opt out
      if (user?.id) {
        addManagerToRoom(roomId, user.id, user.name ?? "Unknown", user.role ?? "manager", socket.id);
      }

      const room = await db.collection("auctionRooms").findOne({ roomId });
      const recentBids = await db
        .collection("bids")
        .find({ roomId })
        .sort({ createdAt: -1 })
        .limit(10)
        .toArray();

      const persistedTimer = Math.max(0, Number(room?.timer ?? ROUND_TIME_SECONDS));
      const timerForClient = room?.status === "live"
        ? (roomTimeLeft.get(roomId) ?? persistedTimer)
        : persistedTimer;

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

      const bidCheck = await validateManagerEligibility(room, userId, amount);
      if (!bidCheck.ok) {
        socket.emit("auction:error", { message: bidCheck.message });
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

      if (room.status === "sold" || room.status === "ended") {
        socket.emit("auction:error", { message: "Set next player before starting" });
        return;
      }

      const startTime = room.status === "paused"
        ? (roomTimeLeft.get(roomId) ?? room.timer ?? ROUND_TIME_SECONDS)
        : ROUND_TIME_SECONDS;

      await db.collection("auctionRooms").updateOne(
        { roomId },
        { $set: { status: "live", timer: startTime, updatedAt: new Date() } }
      );

      io.to(roomId).emit("auction:started", { status: "live", timer: startTime });
      await startRoomTimer(roomId, startTime);
    });

    socket.on("auction:pause", async ({ roomId }) => {
      const room = await db.collection("auctionRooms").findOne({ roomId });
      if (!room || room.status !== "live") {
        socket.emit("auction:error", { message: "Auction is not live" });
        return;
      }

      const remaining = roomTimeLeft.get(roomId) ?? room.timer ?? ROUND_TIME_SECONDS;
      if (roomTimers.has(roomId)) {
        clearInterval(roomTimers.get(roomId));
        roomTimers.delete(roomId);
      }

      await db.collection("auctionRooms").updateOne(
        { roomId },
        { $set: { status: "paused", timer: remaining, updatedAt: new Date() } }
      );

      io.to(roomId).emit("auction:paused", { status: "paused", timer: remaining });
    });

    socket.on("auction:sold-now", async ({ roomId }) => {
      await finalizeCurrentPlayerAsSold(roomId, socket);
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
              altPositions: Array.isArray(player.altPositions)
                ? player.altPositions.map((item) => String(item))
                : [],
              club: String(player.club || ""),
              league: String(player.league || ""),
              nation: String(player.nation || ""),
              age: Number(player.age) || undefined,
              preferredFoot: player.preferredFoot === "Left" ? "Left" : "Right",
              weakFoot: Number(player.weakFoot) || 4,
              skillMoves: Number(player.skillMoves) || 4,
              height: String(player.height || ""),
              weight: String(player.weight || ""),
              image: String(player.image || ""),
              cardImage: String(player.cardImage || ""),
              basePrice,
              pace: Number(player.pace) || undefined,
              shooting: Number(player.shooting) || undefined,
              passing: Number(player.passing) || undefined,
              dribbling: Number(player.dribbling) || undefined,
              defending: Number(player.defending) || undefined,
              physicality: Number(player.physicality) || undefined,
              playstyles: Array.isArray(player.playstyles)
                ? player.playstyles
                    .filter((item) => item?.name)
                    .map((item) => ({
                      name: String(item.name),
                      description: String(item.description || ""),
                      plus: Boolean(item.plus),
                    }))
                : [],
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

      // If all other managers opted out and a leader exists, auto-pause
      checkAllOptedOut(roomId);
    });

    socket.on("disconnect", () => {
      const affectedRooms = removeSocketFromRooms(socket.id);
      for (const roomId of affectedRooms) {
        checkAllOptedOut(roomId);
      }
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