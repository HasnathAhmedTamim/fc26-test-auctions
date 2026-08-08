import {
  buildAtomicBidFilter,
  canPlaceBid,
  getBidCooldownState,
  isBidIdentitySpoofAttempt,
  resolveSocketIdentity,
  validateBidAmount,
} from "../../src/lib/auction-realtime-guards.mjs";
import { toObjectId } from "../lib/db.mjs";

export function registerAuctionHandlers(io, { db, getAuctionSettings, runtime }) {
  const {
    roomTimers,
    roomTimeLeft,
    roomOptOuts,
    roomBidCooldowns,
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
  } = runtime;

  io.on("connection", (socket) => {
    socket.on("auction:join", async ({ roomId }) => {
      if (!roomId) {
        socket.emit("auction:error", { message: "roomId is required" });
        return;
      }

      const socketUser = getSocketUser(socket);
      if (!socketUser) {
        socket.emit("auction:error", { message: "Unauthorized socket connection." });
        socket.disconnect(true);
        return;
      }

      if (socketUser.role !== "admin") {
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
            message: "You are not allowed to join this room. Ask admin for access.",
          });
          return;
        }
      }

      socket.join(roomId);

      if (socketUser.id) {
        addManagerToRoom(
          roomId,
          socketUser.id,
          socketUser.name ?? "Unknown",
          socketUser.role ?? "manager",
          socket.id
        );
      }

      const room = await db.collection("auctionRooms").findOne({ roomId });
      if (!room) {
        socket.emit("auction:error", { message: "Room not found" });
        return;
      }

      const recentBids = await db
        .collection("bids")
        .find({ roomId })
        .sort({ createdAt: -1 })
        .limit(10)
        .toArray();

      const settings = await getAuctionSettings();
      const persistedTimer = Math.max(0, Number(room?.timer ?? settings.roundTimeSeconds));
      const timerForClient =
        room?.status === "live" ? (roomTimeLeft.get(roomId) ?? persistedTimer) : persistedTimer;

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
        userName: socketUser.name ?? "Unknown",
      });
    });

    socket.on("auction:bid", async (payload) => {
      if (!payload?.roomId) {
        socket.emit("auction:error", { message: "roomId is required" });
        return;
      }

      const socketUser = getSocketUser(socket);
      if (!socketUser) {
        socket.emit("auction:error", { message: "Unauthorized socket connection." });
        socket.disconnect(true);
        return;
      }

      if (!canPlaceBid(socketUser)) {
        socket.emit("auction:error", { message: "Only managers can place bids." });
        return;
      }

      if (!(await ensureSocketRoomAccess(socket, payload.roomId))) {
        return;
      }

      if (isBidIdentitySpoofAttempt(socketUser, payload)) {
        socket.emit("auction:error", { message: "Identity mismatch detected in bid payload." });
        return;
      }

      const { roomId, amount } = payload;
      const identity = resolveSocketIdentity(socketUser);
      if (!identity) {
        socket.emit("auction:error", { message: "Unauthorized socket identity." });
        return;
      }

      const userId = identity.userId;
      const userName = identity.userName;
      const settings = await getAuctionSettings();

      const roomCooldowns = roomBidCooldowns.get(roomId) ?? new Map();
      const cooldownState = getBidCooldownState(
        roomCooldowns.get(userId),
        Date.now(),
        settings.bidCooldownMs
      );
      if (cooldownState.limited) {
        socket.emit("auction:error", {
          message: `Bid rate limited. Try again in ${Math.ceil(cooldownState.retryAfterMs / 1000)}s.`,
        });
        return;
      }

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

      const bidAmountCheck = validateBidAmount(amount, room.currentBid, settings.bidIncrement);
      if (!bidAmountCheck.ok) {
        socket.emit("auction:error", { message: bidAmountCheck.message });
        return;
      }
      const expectedCurrentBid = bidAmountCheck.expectedCurrentBid;

      const bidCheck = await validateManagerEligibility(room, userId, amount);
      if (!bidCheck.ok) {
        socket.emit("auction:error", { message: bidCheck.message });
        return;
      }

      const roomUpdateResult = await db.collection("auctionRooms").updateOne(
        buildAtomicBidFilter(roomId, expectedCurrentBid),
        {
          $set: {
            currentBid: amount,
            highestBidderId: userId,
            highestBidderName: userName,
            updatedAt: new Date(),
          },
        }
      );

      if (!roomUpdateResult.modifiedCount) {
        socket.emit("auction:error", {
          message: "Bid rejected because auction state changed. Please bid again.",
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

      roomCooldowns.set(userId, Date.now());
      roomBidCooldowns.set(roomId, roomCooldowns);

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
      if (!requireSocketAdmin(socket)) return;

      if (!roomId) {
        socket.emit("auction:error", { message: "roomId is required" });
        return;
      }

      if (!ensureSocketJoinedRoom(socket, roomId)) return;

      const settings = await getAuctionSettings();

      const room = await db.collection("auctionRooms").findOne({ roomId });
      if (!room) {
        socket.emit("auction:error", { message: "Room not found" });
        return;
      }

      if (!room?.currentPlayer) {
        socket.emit("auction:error", { message: "Set a player before starting the auction" });
        return;
      }

      if (room.status === "sold" || room.status === "ended") {
        socket.emit("auction:error", { message: "Set next player before starting" });
        return;
      }

      const startTime =
        room.status === "paused"
          ? (roomTimeLeft.get(roomId) ?? room.timer ?? settings.roundTimeSeconds)
          : settings.roundTimeSeconds;

      await db.collection("auctionRooms").updateOne(
        { roomId },
        { $set: { status: "live", timer: startTime, updatedAt: new Date() } }
      );

      io.to(roomId).emit("auction:started", { status: "live", timer: startTime });
      await startRoomTimer(roomId, startTime);
    });

    socket.on("auction:pause", async ({ roomId }) => {
      if (!requireSocketAdmin(socket)) return;

      if (!roomId) {
        socket.emit("auction:error", { message: "roomId is required" });
        return;
      }

      if (!ensureSocketJoinedRoom(socket, roomId)) return;

      const room = await db.collection("auctionRooms").findOne({ roomId });
      const settings = await getAuctionSettings();
      if (!room || room.status !== "live") {
        socket.emit("auction:error", { message: "Auction is not live" });
        return;
      }

      const remaining = roomTimeLeft.get(roomId) ?? room.timer ?? settings.roundTimeSeconds;
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
      if (!requireSocketAdmin(socket)) return;

      if (!roomId) {
        socket.emit("auction:error", { message: "roomId is required" });
        return;
      }

      if (!ensureSocketJoinedRoom(socket, roomId)) return;

      const room = await db.collection("auctionRooms").findOne({ roomId });
      if (!room) {
        socket.emit("auction:error", { message: "Room not found" });
        return;
      }

      if (room.status === "ended") {
        socket.emit("auction:error", { message: "Room has ended. Reset room before selling." });
        return;
      }

      await finalizeCurrentPlayerAsSold(roomId, socket);
    });

    socket.on("auction:set-player", async ({ roomId, player }) => {
      if (!requireSocketAdmin(socket)) return;
      if (!roomId) {
        socket.emit("auction:error", { message: "roomId is required" });
        return;
      }
      if (!ensureSocketJoinedRoom(socket, roomId)) return;
      if (!player?.id || !player?.name) return;

      const settings = await getAuctionSettings();

      const room = await db.collection("auctionRooms").findOne({ roomId });
      if (!room) {
        socket.emit("auction:error", { message: "Room not found" });
        return;
      }

      if (room.status === "ended") {
        socket.emit("auction:error", { message: "Room has ended. Reset room before setting player." });
        return;
      }

      if (room.status === "live") {
        socket.emit("auction:error", { message: "Pause the auction before changing player." });
        return;
      }

      const alreadySold = await db.collection("soldPlayers").findOne({
        roomId,
        playerId: String(player.id),
      });

      if (alreadySold) {
        socket.emit("auction:error", {
          message: `${player.name} has already been sold in this room.`,
        });
        return;
      }

      clearRoomTimer(roomId);
      clearRoomOptOuts(roomId);
      clearRoomBidCooldowns(roomId);

      const basePrice = Number(player.basePrice) || settings.bidIncrement;

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
            currentBid: Math.max(0, basePrice - settings.bidIncrement),
            status: "waiting",
            highestBidderId: null,
            highestBidderName: null,
            timer: settings.roundTimeSeconds,
            updatedAt: new Date(),
          },
        }
      );

      io.to(roomId).emit("auction:player-set", {
        player,
        currentBid: Math.max(0, basePrice - settings.bidIncrement),
      });
    });

    socket.on("auction:opt-out", async ({ roomId }) => {
      if (!roomId) {
        socket.emit("auction:error", { message: "roomId is required" });
        return;
      }

      const socketUser = getSocketUser(socket);
      if (!socketUser || !roomId) return;

      if (!canPlaceBid(socketUser)) {
        socket.emit("auction:error", { message: "Only managers can opt out." });
        return;
      }

      if (!(await ensureSocketRoomAccess(socket, roomId))) {
        return;
      }

      const userId = socketUser.id;
      const userName = socketUser.name ?? "Unknown";

      const optedOutUsers = roomOptOuts.get(roomId) ?? new Set();
      optedOutUsers.add(userId);
      roomOptOuts.set(roomId, optedOutUsers);

      socket.emit("auction:you-opted-out", {});
      io.to(roomId).emit("auction:user-opted-out", {
        userId,
        userName: userName ?? "Unknown",
      });

      checkAllOptedOut(roomId);
    });

    socket.on("disconnect", () => {
      const affectedRooms = removeSocketFromRooms(socket.id);
      for (const roomId of affectedRooms) {
        checkAllOptedOut(roomId);
      }
    });

    socket.on("auction:skip", async ({ roomId }) => {
      if (!requireSocketAdmin(socket)) return;

      if (!roomId) {
        socket.emit("auction:error", { message: "roomId is required" });
        return;
      }

      if (!ensureSocketJoinedRoom(socket, roomId)) return;

      const room = await db.collection("auctionRooms").findOne({ roomId });
      const settings = await getAuctionSettings();
      if (!room) {
        socket.emit("auction:error", { message: "Room not found" });
        return;
      }

      if (room.status === "ended") {
        socket.emit("auction:error", { message: "Room has ended. Reset room before skipping." });
        return;
      }

      if (!room.currentPlayer) {
        socket.emit("auction:error", { message: "No active player to skip." });
        return;
      }

      clearRoomTimer(roomId);
      clearRoomOptOuts(roomId);
      clearRoomBidCooldowns(roomId);

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

      io.to(roomId).emit("auction:skipped", {});
    });
  });
}
