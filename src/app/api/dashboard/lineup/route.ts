import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/lib/mongodb";
import { saveLineupSchema } from "@/lib/validations";
import type { LineupFormation, LineupSlotId } from "@/types/auction";

const FORMATION_SLOTS: Record<LineupFormation, LineupSlotId[]> = {
  "4-3-3": ["gk", "lb", "lcb", "rcb", "rb", "lcm", "cm", "rcm", "lw", "st", "rw"],
  "4-4-2": ["gk", "lb", "lcb", "rcb", "rb", "lcm", "rcm", "lw", "rw", "ls", "rs"],
  "3-5-2": ["gk", "lcb", "cb", "rcb", "lwb", "cdm", "cm", "cam", "rwb", "ls", "rs"],
};

type BoughtPlayer = {
  playerId: string;
  playerName: string;
  amount: number;
};

async function resolveUserRoster(userId: string) {
  const db = await getDb();
  const roomsCollection = db.collection("auctionRooms");
  const statsCollection = db.collection("managerStats");

  const activeRoom = await roomsCollection.findOne(
    { status: { $in: ["live", "waiting", "sold", "paused"] } },
    { sort: { createdAt: -1 } }
  );

  let dashboardRoom = activeRoom;
  let stats = activeRoom
    ? await statsCollection.findOne({
        userId,
        roomId: activeRoom.roomId,
      })
    : null;

  if (!stats) {
    const latestStats = await statsCollection.find({ userId })
      .sort({ updatedAt: -1, createdAt: -1 })
      .limit(1)
      .next();

    if (latestStats) {
      const statsRoom = await roomsCollection.findOne({ roomId: latestStats.roomId });
      dashboardRoom = statsRoom ?? dashboardRoom;
      stats = latestStats;
    }
  }

  return {
    roomId: String(dashboardRoom?.roomId ?? ""),
    playersBought: (stats?.playersBought ?? []) as BoughtPlayer[],
  };
}

function toBench(playersBought: BoughtPlayer[], starterPlayerIds: string[]) {
  const starterSet = new Set(starterPlayerIds);
  return playersBought.filter((player) => !starterSet.has(player.playerId));
}

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { roomId, playersBought } = await resolveUserRoster(session.user.id);

  if (!roomId) {
    return NextResponse.json({
      roomId: null,
      formation: "4-3-3",
      starters: [],
      bench: [],
      availablePlayers: [],
      updatedAt: null,
    });
  }

  const db = await getDb();
  const lineupsCollection = db.collection("lineups");
  const existing = await lineupsCollection.findOne({ userId: session.user.id, roomId });

  const defaultFormation: LineupFormation = "4-3-3";
  const formation = (existing?.formation as LineupFormation | undefined) ?? defaultFormation;
  const slots = FORMATION_SLOTS[formation] ?? FORMATION_SLOTS[defaultFormation];

  const ownedSet = new Set(playersBought.map((p) => p.playerId));
  const persistedStarters = Array.isArray(existing?.starters)
    ? existing.starters.filter(
        (entry: { slotId?: string; playerId?: string }) =>
          entry.slotId &&
          entry.playerId &&
          slots.includes(entry.slotId as LineupSlotId) &&
          ownedSet.has(String(entry.playerId))
      )
    : [];

  const seen = new Set<string>();
  const normalizedStarters: Array<{ slotId: LineupSlotId; playerId: string }> = [];

  for (const slotId of slots) {
    const existingForSlot = persistedStarters.find(
      (entry: { slotId?: string; playerId?: string }) => entry.slotId === slotId
    );

    if (existingForSlot && !seen.has(String(existingForSlot.playerId))) {
      normalizedStarters.push({ slotId, playerId: String(existingForSlot.playerId) });
      seen.add(String(existingForSlot.playerId));
    }
  }

  if (normalizedStarters.length < 11) {
    for (const player of playersBought) {
      if (normalizedStarters.length >= 11) break;
      if (seen.has(player.playerId)) continue;
      const slotId = slots[normalizedStarters.length];
      normalizedStarters.push({ slotId, playerId: player.playerId });
      seen.add(player.playerId);
    }
  }

  return NextResponse.json({
    roomId,
    formation,
    starters: normalizedStarters,
    bench: toBench(playersBought, normalizedStarters.map((s) => s.playerId)),
    availablePlayers: playersBought,
    updatedAt: existing?.updatedAt ? new Date(existing.updatedAt).toISOString() : null,
  });
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = saveLineupSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid payload" },
      { status: 400 }
    );
  }

  const { roomId, formation, starters } = parsed.data;
  const slots = FORMATION_SLOTS[formation];

  const slotSet = new Set(starters.map((entry) => entry.slotId));
  if (slotSet.size !== starters.length || starters.some((entry) => !slots.includes(entry.slotId as LineupSlotId))) {
    return NextResponse.json(
      { error: "Starter slots do not match selected formation" },
      { status: 400 }
    );
  }

  const starterPlayerIds = starters.map((entry) => entry.playerId);
  if (new Set(starterPlayerIds).size !== starterPlayerIds.length) {
    return NextResponse.json({ error: "Duplicate starter players are not allowed" }, { status: 400 });
  }

  const db = await getDb();
  const stats = await db.collection("managerStats").findOne({ userId: session.user.id, roomId });
  const playersBought = Array.isArray(stats?.playersBought) ? (stats.playersBought as BoughtPlayer[]) : [];

  const ownedSet = new Set(playersBought.map((player) => player.playerId));
  const hasForeignPlayer = starterPlayerIds.some((playerId) => !ownedSet.has(playerId));
  if (hasForeignPlayer) {
    return NextResponse.json({ error: "Lineup contains players not owned by you" }, { status: 400 });
  }

  await db.collection("lineups").updateOne(
    { userId: session.user.id, roomId },
    {
      $set: {
        userId: session.user.id,
        roomId,
        formation,
        starters,
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
    message: "Lineup saved",
    bench: toBench(playersBought, starterPlayerIds),
  });
}
