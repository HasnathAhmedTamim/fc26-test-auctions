import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getActivePlayerEdition } from "@/lib/player-edition";
import { requireAdmin } from "@/lib/roles";

type ManagerPlayer = {
  playerId: string;
  playerName: string;
  amount: number;
};

function toObjectId(value: string) {
  try {
    return new ObjectId(value);
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const access = await requireAdmin();
  if (!access.ok) return access.response;

  const roomId = request.nextUrl.searchParams.get("roomId");
  if (!roomId) {
    return NextResponse.json({ error: "roomId is required" }, { status: 400 });
  }

  const db = await getDb();
  const [room, users, stats] = await Promise.all([
    db.collection("auctionRooms").findOne({ roomId }),
    db.collection("users").find({ role: "manager" }).sort({ name: 1 }).toArray(),
    db.collection("managerStats").find({ roomId }).toArray(),
  ]);

  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

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

  return NextResponse.json({
    room: {
      roomId: room.roomId,
      name: room.name,
      budget: Number(room.budget ?? 0),
      maxPlayers: Number(room.maxPlayers ?? 0),
      status: room.status,
    },
    managers: [...managers.values()].sort((a, b) => a.userName.localeCompare(b.userName)),
  });
}

export async function POST(request: NextRequest) {
  const access = await requireAdmin();
  if (!access.ok) return access.response;

  const body = await request.json();
  const roomId = String(body.roomId ?? "").trim();
  const userId = String(body.userId ?? "").trim();
  const playerId = String(body.playerId ?? "").trim();
  const action = String(body.action ?? "").trim();
  const amountValue = Number(body.amount);

  if (!roomId || !userId) {
    return NextResponse.json({ error: "roomId and userId are required" }, { status: 400 });
  }

  if (action !== "add" && action !== "remove") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  if (!playerId) {
    return NextResponse.json({ error: "playerId is required" }, { status: 400 });
  }

  const db = await getDb();
  const statsCollection = db.collection("managerStats");
  const room = await db.collection("auctionRooms").findOne({ roomId });

  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  const existingStat = await statsCollection.findOne({ roomId, userId });
  const userObjectId = toObjectId(userId);
  const user = userObjectId
    ? await db.collection("users").findOne({ _id: userObjectId, role: "manager" })
    : null;

  const userName = String(existingStat?.userName ?? user?.name ?? "Unknown Manager");

  if (action === "add") {
    const edition = await getActivePlayerEdition(db);
    const player = await db.collection("players").findOne({ edition, playerId });

    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    const alreadyOwned = existingStat?.playersBought?.some(
      (owned: { playerId?: string }) => String(owned.playerId ?? "") === playerId
    );

    if (alreadyOwned) {
      return NextResponse.json(
        { error: `${userName} already has ${player.name}` },
        { status: 409 }
      );
    }

    const amount = Number.isFinite(amountValue) && amountValue >= 0
      ? amountValue
      : Number(player.price ?? 0);
    const nextPlayersBought = [
      ...((Array.isArray(existingStat?.playersBought) ? existingStat.playersBought : []) as ManagerPlayer[]),
      {
        playerId,
        playerName: String(player.name ?? "Unknown Player"),
        amount,
      },
    ];
    const nextBudgetSpent = Number(existingStat?.budgetSpent ?? 0) + amount;

    await statsCollection.updateOne(
      { roomId, userId },
      {
        $set: {
          roomId,
          userId,
          userName,
          budgetSpent: nextBudgetSpent,
          playersBought: nextPlayersBought,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    return NextResponse.json({
      ok: true,
      message: `${player.name} added to ${userName}`,
    });
  }

  if (!existingStat) {
    return NextResponse.json({ error: "Manager roster not found" }, { status: 404 });
  }

  const playersBought = Array.isArray(existingStat.playersBought)
    ? [...existingStat.playersBought]
    : [];
  const playerIndex = playersBought.findIndex(
    (owned: { playerId?: string }) => String(owned.playerId ?? "") === playerId
  );

  if (playerIndex === -1) {
    return NextResponse.json({ error: "Player not found in roster" }, { status: 404 });
  }

  const [removedPlayer] = playersBought.splice(playerIndex, 1);
  const nextBudgetSpent = Math.max(
    0,
    Number(existingStat.budgetSpent ?? 0) - Number(removedPlayer?.amount ?? 0)
  );

  await statsCollection.updateOne(
    { roomId, userId },
    {
      $set: {
        playersBought,
        budgetSpent: nextBudgetSpent,
        updatedAt: new Date(),
      },
    }
  );

  return NextResponse.json({
    ok: true,
    message: `${removedPlayer.playerName} removed from ${userName}`,
  });
}
