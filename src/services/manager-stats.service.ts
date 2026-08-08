import { Db } from "mongodb";
import { toObjectId } from "@/lib/db/object-id";
import { findRoomById } from "@/services/auction.service";
import { findPlayerById } from "@/services/player.service";
import { findUserById } from "@/services/user.service";

type ManagerPlayer = {
  playerId: string;
  playerName: string;
  amount: number;
};

async function createAuditEntry(
  db: Db,
  input: {
    roomId: string;
    userId: string;
    userName: string;
    action: "add" | "remove" | "adjust-budget" | "room-end" | "room-reset";
    message: string;
  }
) {
  await db.collection("adminAuditLog").insertOne({
    roomId: input.roomId,
    userId: input.userId,
    userName: input.userName,
    action: input.action,
    message: input.message,
    createdAt: new Date().toISOString(),
  });
}

export async function getManagerRoster(db: Db, roomId: string) {
  const [room, users, stats] = await Promise.all([
    findRoomById(db, roomId),
    db.collection("users").find({ role: "manager" }).sort({ name: 1 }).toArray(),
    db.collection("managerStats").find({ roomId }).toArray(),
  ]);

  if (!room) return null;

  const managers = new Map<string, {
    userId: string;
    userName: string;
    email: string;
    budgetSpent: number;
    playersBought: ManagerPlayer[];
  }>();

  for (const user of users) {
    managers.set(String(user._id), {
      userId: String(user._id),
      userName: String(user.name ?? "Unknown Manager"),
      email: String(user.email ?? ""),
      budgetSpent: 0,
      playersBought: [],
    });
  }

  for (const stat of stats) {
    const userId = String(stat.userId ?? "");
    const existing = managers.get(userId);
    const playersBought = Array.isArray(stat.playersBought)
      ? stat.playersBought.map((player: { playerId?: string; playerName?: string; amount?: number }) => ({
          playerId: String(player.playerId ?? ""),
          playerName: String(player.playerName ?? "Unknown Player"),
          amount: Number(player.amount ?? 0),
        }))
      : [];

    managers.set(userId, {
      userId,
      userName: String(stat.userName ?? existing?.userName ?? "Unknown Manager"),
      email: existing?.email ?? "",
      budgetSpent: Number(stat.budgetSpent ?? 0),
      playersBought,
    });
  }

  return {
    room: {
      roomId: room.roomId,
      name: room.name,
      budget: Number(room.budget ?? 0),
      maxPlayers: Number(room.maxPlayers ?? 0),
      status: room.status,
    },
    managers: [...managers.values()].sort((a, b) => a.userName.localeCompare(b.userName)),
  };
}

export async function mutateManagerStats(
  db: Db,
  input: {
    roomId: string;
    userId: string;
    action: "add" | "remove" | "adjust-budget";
    playerId?: string;
    amount?: number;
    adjustment?: number;
  }
) {
  const room = await findRoomById(db, input.roomId);
  if (!room) {
    return { ok: false as const, status: 404, error: "Room not found" };
  }

  const statsCollection = db.collection("managerStats");
  const existingStat = await statsCollection.findOne({ roomId: input.roomId, userId: input.userId });
  const user = await findUserById(db, input.userId);
  const userName = String(existingStat?.userName ?? user?.name ?? "Unknown Manager");

  if (input.action === "add") {
    const playerId = String(input.playerId ?? "");
    const player = await findPlayerById(db, playerId);
    if (!player) {
      return { ok: false as const, status: 404, error: "Player not found" };
    }

    const alreadyOwned = existingStat?.playersBought?.some(
      (owned: { playerId?: string }) => String(owned.playerId ?? "") === playerId
    );
    if (alreadyOwned) {
      return { ok: false as const, status: 409, error: `${userName} already has ${player.name}` };
    }

    const amount = Number.isFinite(input.amount) && (input.amount ?? 0) >= 0
      ? Number(input.amount)
      : Number(player.price ?? 0);
    const budgetLimit = Number(room.budget ?? 0);
    const maxPlayers = Number(room.maxPlayers ?? 0);
    const currentPlayersBought = Array.isArray(existingStat?.playersBought)
      ? existingStat.playersBought.length
      : 0;

    if (maxPlayers > 0 && currentPlayersBought >= maxPlayers) {
      return {
        ok: false as const,
        status: 409,
        error: `${userName} already reached the room squad limit (${maxPlayers}).`,
      };
    }

    const nextPlayersBought = [
      ...((Array.isArray(existingStat?.playersBought) ? existingStat.playersBought : []) as ManagerPlayer[]),
      {
        playerId,
        playerName: String(player.name ?? "Unknown Player"),
        amount,
      },
    ];
    const nextBudgetSpent = Number(existingStat?.budgetSpent ?? 0) + amount;

    if (budgetLimit > 0 && nextBudgetSpent > budgetLimit) {
      return {
        ok: false as const,
        status: 409,
        error: `Cannot add ${player.name}. ${userName} would exceed room budget (${budgetLimit}).`,
      };
    }

    await statsCollection.updateOne(
      { roomId: input.roomId, userId: input.userId },
      {
        $set: {
          roomId: input.roomId,
          userId: input.userId,
          userName,
          budgetSpent: nextBudgetSpent,
          playersBought: nextPlayersBought,
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );

    await createAuditEntry(db, {
      roomId: input.roomId,
      userId: input.userId,
      userName,
      action: "add",
      message: `Admin added ${player.name} to your squad for ${amount} coins.`,
    });

    return { ok: true as const, message: `${player.name} added to ${userName}` };
  }

  if (input.action === "adjust-budget") {
    const adjustment = Number(input.adjustment ?? 0);
    if (!Number.isFinite(adjustment)) {
      return { ok: false as const, status: 400, error: "Invalid adjustment value" };
    }

    const currentSpent = Number(existingStat?.budgetSpent ?? 0);
    const budgetLimit = Number(room.budget ?? 0);
    const newBudgetSpent = Math.max(0, currentSpent + adjustment);

    if (budgetLimit > 0 && newBudgetSpent > budgetLimit) {
      return {
        ok: false as const,
        status: 409,
        error: `Adjusted spent budget cannot exceed room budget (${budgetLimit}).`,
      };
    }

    await statsCollection.updateOne(
      { roomId: input.roomId, userId: input.userId },
      {
        $set: {
          roomId: input.roomId,
          userId: input.userId,
          userName,
          budgetSpent: newBudgetSpent,
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );

    const direction = adjustment >= 0 ? `+${adjustment}` : String(adjustment);
    await createAuditEntry(db, {
      roomId: input.roomId,
      userId: input.userId,
      userName,
      action: "adjust-budget",
      message: `Admin adjusted your spent budget by ${direction} coins. New spent total: ${newBudgetSpent}.`,
    });

    return {
      ok: true as const,
      message: `Budget adjusted (${direction}) → ${newBudgetSpent} spent for ${userName}`,
    };
  }

  if (!existingStat) {
    return { ok: false as const, status: 404, error: "Manager roster not found" };
  }

  const playerId = String(input.playerId ?? "");
  const playersBought = Array.isArray(existingStat.playersBought)
    ? [...existingStat.playersBought]
    : [];
  const playerIndex = playersBought.findIndex(
    (owned: { playerId?: string }) => String(owned.playerId ?? "") === playerId
  );

  if (playerIndex === -1) {
    return { ok: false as const, status: 404, error: "Player not found in roster" };
  }

  const [removedPlayer] = playersBought.splice(playerIndex, 1);
  const nextBudgetSpent = Math.max(
    0,
    Number(existingStat.budgetSpent ?? 0) - Number(removedPlayer?.amount ?? 0)
  );

  await statsCollection.updateOne(
    { roomId: input.roomId, userId: input.userId },
    {
      $set: {
        playersBought,
        budgetSpent: nextBudgetSpent,
        updatedAt: new Date(),
      },
    }
  );

  await createAuditEntry(db, {
    roomId: input.roomId,
    userId: input.userId,
    userName,
    action: "remove",
    message: `Admin removed ${removedPlayer.playerName} from your squad and refunded ${Number(removedPlayer?.amount ?? 0)} coins from spent budget.`,
  });

  return {
    ok: true as const,
    message: `${removedPlayer.playerName} removed from ${userName}`,
  };
}

export async function mutateRoomLifecycle(
  db: Db,
  roomId: string,
  action: "end" | "reset"
) {
  const room = await findRoomById(db, roomId);
  if (!room) {
    return { ok: false as const, status: 404, error: "Room not found" };
  }

  if (action === "end") {
    await db.collection("auctionRooms").updateOne(
      { roomId },
      { $set: { status: "ended", updatedAt: new Date() } }
    );
    await createAuditEntry(db, {
      roomId,
      userId: "room",
      userName: "Room",
      action: "room-end",
      message: `Admin ended room ${room.name ?? roomId}.`,
    });
    return { ok: true as const, message: "Room ended" };
  }

  await db.collection("auctionRooms").updateOne(
    { roomId },
    {
      $set: {
        status: "waiting",
        currentPlayer: null,
        currentBid: 0,
        highestBidderId: null,
        highestBidderName: null,
        updatedAt: new Date(),
      },
    }
  );
  await createAuditEntry(db, {
    roomId,
    userId: "room",
    userName: "Room",
    action: "room-reset",
    message: `Admin reset room ${room.name ?? roomId} back to waiting.`,
  });

  return { ok: true as const, message: "Room reset to waiting" };
}

export async function getManagerRoomState(db: Db, roomId: string, userId: string) {
  const room = await findRoomById(db, roomId);
  if (!room) return null;

  const stats = await db.collection("managerStats").findOne({ roomId, userId });
  const auditEntries = await db
    .collection("adminAuditLog")
    .find({ roomId, $or: [{ userId }, { userId: "room" }] })
    .sort({ createdAt: -1 })
    .limit(10)
    .toArray();

  const playersBought = Array.isArray(stats?.playersBought) ? stats.playersBought : [];
  const budgetLimit = Number(room.budget ?? 2000);
  const budgetSpent = Number(stats?.budgetSpent ?? 0);
  const maxPlayers = Number(room.maxPlayers ?? 24);

  return {
    budgetLimit,
    budgetSpent,
    budgetLeft: Math.max(0, budgetLimit - budgetSpent),
    maxPlayers,
    playersBought: playersBought.length,
    squadSlotsLeft: Math.max(0, maxPlayers - playersBought.length),
    auditEntries: auditEntries.map((entry) => ({
      id: String(entry._id),
      message: String(entry.message ?? "Admin updated this room."),
      timestamp: String(entry.createdAt ?? new Date().toISOString()),
    })),
  };
}
