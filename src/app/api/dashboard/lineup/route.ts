import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/lib/mongodb";
import { saveLineupSchema } from "@/lib/validations";
import type { LineupFormation, LineupSlotId } from "@/types/auction";

const DEFAULT_FORMATION = "4-3-3";

function getFormationSlots(formationInput: string): LineupSlotId[] {
  const isValidPattern = /^\d(?:-\d){1,4}$/.test(formationInput);
  const parsedLines = isValidPattern
    ? formationInput.split("-").map((part) => Number(part))
    : [];
  const totalOutfieldPlayers = parsedLines.reduce((sum, line) => sum + line, 0);
  const isValid = isValidPattern && totalOutfieldPlayers === 10;
  // Fallback keeps API resilient if stale or custom invalid formations are stored.
  const formation = isValid ? formationInput : DEFAULT_FORMATION;
  const lines = formation.split("-").map((part) => Number(part));
  const slots: LineupSlotId[] = ["gk"];

  lines.forEach((count, lineIndex) => {
    for (let playerIndex = 1; playerIndex <= count; playerIndex += 1) {
      slots.push(`line${lineIndex + 1}-p${playerIndex}`);
    }
  });

  return slots;
}

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
    // If active-room stats are missing, use the latest known roster for dashboard continuity.
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
  // Bench is derived as owned players minus selected starters.
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
      formation: DEFAULT_FORMATION,
      starters: [],
      bench: [],
      availablePlayers: [],
      updatedAt: null,
    });
  }

  const db = await getDb();
  const lineupsCollection = db.collection("lineups");
  const existing = await lineupsCollection.findOne({ userId: session.user.id, roomId });

  const formation = (existing?.formation as LineupFormation | undefined) ?? DEFAULT_FORMATION;
  const slots = getFormationSlots(formation);

  const ownedSet = new Set(playersBought.map((p) => p.playerId));
  const persistedStarters = Array.isArray(existing?.starters)
    // Keep only starters that are valid for the chosen formation and still owned by the manager.
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
    // Auto-fill missing slots from purchased players to keep a complete initial XI.
    for (const player of playersBought) {
      if (normalizedStarters.length >= 11) break;
      if (seen.has(player.playerId)) continue;
      const slotId = slots[normalizedStarters.length] as LineupSlotId;
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
  const slots = getFormationSlots(formation);

  const slotSet = new Set(starters.map((entry) => entry.slotId));
  // Reject duplicate slots and slots that do not belong to this formation.
  if (slotSet.size !== starters.length || starters.some((entry) => !slots.includes(entry.slotId as LineupSlotId))) {
    return NextResponse.json(
      { error: "Starter slots do not match selected formation" },
      { status: 400 }
    );
  }

  const starterPlayerIds = starters.map((entry) => entry.playerId);
  // Duplicate players across slots are not allowed, even with valid slot IDs.
  if (new Set(starterPlayerIds).size !== starterPlayerIds.length) {
    return NextResponse.json({ error: "Duplicate starter players are not allowed" }, { status: 400 });
  }

  const db = await getDb();
  const stats = await db.collection("managerStats").findOne({ userId: session.user.id, roomId });
  const playersBought = Array.isArray(stats?.playersBought) ? (stats.playersBought as BoughtPlayer[]) : [];

  const ownedSet = new Set(playersBought.map((player) => player.playerId));
  // Server-side ownership guard prevents forged lineup payloads.
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
