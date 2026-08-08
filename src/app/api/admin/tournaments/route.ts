import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/roles";
import { getDb } from "@/lib/mongodb";
import { createTournamentSchema, updateTournamentSchema } from "@/lib/validations";
import {
  createTournament,
  deleteTournamentById,
  listTournaments,
  updateTournament,
} from "@/services/tournament.service";

export async function GET() {
  const access = await requireAdmin();
  if (!access.ok) return access.response;

  const db = await getDb();
  const tournaments = await listTournaments(db);

  return NextResponse.json({ tournaments });
}

export async function POST(req: Request) {
  const access = await requireAdmin();
  if (!access.ok) return access.response;

  const raw = await req.json();
  const parsed = createTournamentSchema.safeParse({
    name: String(raw?.name ?? "").trim(),
    status: raw?.status,
    budget: Number(raw?.budget),
    maxPlayers: Number(raw?.maxPlayers),
    minPlayers: Number(raw?.minPlayers),
    participants: Number(raw?.participants),
    standings: Array.isArray(raw?.standings) ? raw.standings : [],
    fixtures: Array.isArray(raw?.fixtures) ? raw.fixtures : [],
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid payload" }, { status: 400 });
  }

  const payload = parsed.data;
  if (payload.minPlayers > payload.maxPlayers) {
    return NextResponse.json({ error: "Min players cannot be greater than max players" }, { status: 400 });
  }

  const id = randomUUID().slice(0, 8);
  const db = await getDb();
  await createTournament(db, { ...payload, id });

  return NextResponse.json({ message: "Tournament created", id }, { status: 201 });
}

export async function PATCH(req: Request) {
  const access = await requireAdmin();
  if (!access.ok) return access.response;

  const raw = await req.json();
  const parsed = updateTournamentSchema.safeParse({
    id: String(raw?.id ?? "").trim(),
    name: String(raw?.name ?? "").trim(),
    status: raw?.status,
    budget: Number(raw?.budget),
    maxPlayers: Number(raw?.maxPlayers),
    minPlayers: Number(raw?.minPlayers),
    participants: Number(raw?.participants),
    standings: Array.isArray(raw?.standings) ? raw.standings : [],
    fixtures: Array.isArray(raw?.fixtures) ? raw.fixtures : [],
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid payload" }, { status: 400 });
  }

  const payload = parsed.data;
  if (payload.minPlayers > payload.maxPlayers) {
    return NextResponse.json({ error: "Min players cannot be greater than max players" }, { status: 400 });
  }

  const db = await getDb();
  const updated = await updateTournament(db, payload);

  if (!updated) {
    return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
  }

  return NextResponse.json({ message: "Tournament updated" });
}

export async function DELETE(req: Request) {
  const access = await requireAdmin();
  if (!access.ok) return access.response;

  const raw = await req.json();
  const id = String(raw?.id ?? "").trim();

  if (!id) {
    return NextResponse.json({ error: "Tournament id is required" }, { status: 400 });
  }

  const db = await getDb();
  const deleted = await deleteTournamentById(db, id);

  if (!deleted) {
    return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
  }

  return NextResponse.json({ message: "Tournament deleted" });
}
