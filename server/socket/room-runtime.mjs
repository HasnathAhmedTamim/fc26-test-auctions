import { isAdminUser } from "../../src/lib/auction-realtime-guards.mjs";
import { toObjectId } from "../lib/db.mjs";

export function createRoomRuntime({ db, io, getAuctionSettings }) {
  // Per-room countdown timers
  const roomTimers = new Map();
  // In-memory remaining time for live rooms (for users joining mid-round)
  const roomTimeLeft = new Map();
  // Users who opted out for the current player in each room
  const roomOptOuts = new Map();
  // Per-room last bid timestamps: roomId -> Map<userId, epochMs>
  const roomBidCooldowns = new Map();

  // Connected managers per room: roomId -> Map<userId, { role, userName, socketId }>
  const roomConnectedManagers = new Map();

  function getSocketUser(socket) {
    return socket.data?.user ?? null;
  }

  function requireSocketAdmin(socket) {
    const user = getSocketUser(socket);
    if (!isAdminUser(user)) {
      socket.emit("auction:error", { message: "Admin permissions required." });
      return false;
    }
    return true;
  }

  function ensureSocketJoinedRoom(socket, roomId) {
    if (!socket.rooms.has(roomId)) {
      socket.emit("auction:error", {
        message: "Join the room before performing this action.",
      });
      return false;
    }

    return true;
  }

  async function ensureSocketRoomAccess(socket, roomId) {
    const socketUser = getSocketUser(socket);
    if (!socketUser) {
      socket.emit("auction:error", { message: "Unauthorized socket connection." });
      socket.disconnect(true);
      return false;
    }

    if (!ensureSocketJoinedRoom(socket, roomId)) {
      return false;
    }

    if (socketUser.role === "admin") {
      return true;
    }

    // Managers must have explicit per-room access grants.
    const userObjectId = toObjectId(socketUser.id);
    const accessQuery = userObjectId
      ? {
          roomId,
          canJoin: true,
          $or: [{ userId: socketUser.id }, { userId: userObjectId }],
        }
      : {
          roomId,
          userId: socketUser.id,
          canJoin: true,
        };

    const roomAccess = await db.collection("roomAccess").findOne(accessQuery);

    if (!roomAccess) {
      socket.emit("auction:error", {
        message: "You are not allowed to access this room.",
      });
      return false;
    }

    return true;
  }

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

  function clearRoomBidCooldowns(roomId) {
    roomBidCooldowns.delete(roomId);
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

    // Hard room constraints are re-checked server-side before accepting bids/sales.
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

    const existingWinnerStats = await db.collection("managerStats").findOne({
      userId: winnerId,
      roomId: room.roomId,
    });
    const alreadyOwned = Array.isArray(existingWinnerStats?.playersBought)
      ? existingWinnerStats.playersBought.some((item) => String(item?.playerId ?? "") === String(player.id))
      : false;

    if (alreadyOwned) {
      // Pause instead of selling when roster invariants are violated.
      await db.collection("auctionRooms").updateOne(
        { roomId: room.roomId },
        { $set: { status: "paused", updatedAt: new Date() } }
      );
      io.to(room.roomId).emit("auction:error", {
        message: `Auto-sell blocked. ${winnerName} already owns ${player.name} in this room.`,
      });
      return;
    }

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
    const settings = await getAuctionSettings();
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
    const remaining = roomTimeLeft.get(roomId) ?? room.timer ?? settings.roundTimeSeconds;
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

  async function startRoomTimer(roomId, initialTime) {
    const settings = await getAuctionSettings();
    clearRoomTimer(roomId);
    // Persist remaining time in memory so reconnecting clients get the accurate countdown.
    let timeLeft = Math.max(1, Number(initialTime) || settings.roundTimeSeconds);
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
                timer: settings.roundTimeSeconds,
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
    const amount = room.currentBid ?? 0;
    const saleCheck = await validateManagerEligibility(room, winnerId, amount);

    if (!saleCheck.ok) {
      sourceSocket.emit("auction:error", { message: saleCheck.message });
      return;
    }

    await awardPlayerToWinner(room);
  }

  return {
    roomTimers,
    roomTimeLeft,
    roomOptOuts,
    roomBidCooldowns,
    roomConnectedManagers,
    getSocketUser,
    requireSocketAdmin,
    ensureSocketJoinedRoom,
    ensureSocketRoomAccess,
    clearRoomTimer,
    clearRoomOptOuts,
    clearRoomBidCooldowns,
    addManagerToRoom,
    removeSocketFromRooms,
    validateManagerEligibility,
    checkAllOptedOut,
    startRoomTimer,
    finalizeCurrentPlayerAsSold,
  };
}
