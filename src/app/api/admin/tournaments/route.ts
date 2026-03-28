import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/roles";
import { getDb } from "@/lib/mongodb";
import { createTournamentSchema, updateTournamentSchema } from "@/lib/validations";

export async function GET() {
  const access = await requireAdmin();
  if (!access.ok) return access.response;

  const db = await getDb();
  const tournaments = await db.collection("tournaments").find({}).sort({ createdAt: -1 }).toArray();

  return NextResponse.json({
    tournaments: tournaments.map((t) => ({
      id: String(t.id ?? ""),
      name: String(t.name ?? ""),
      status: t.status,
      budget: Number(t.budget ?? 0),
      maxPlayers: Number(t.maxPlayers ?? 0),
      minPlayers: Number(t.minPlayers ?? 0),
      participants: Number(t.participants ?? 0),
      standings: Array.isArray(t.standings) ? t.standings : [],
      fixtures: Array.isArray(t.fixtures) ? t.fixtures : [],
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    })),
  });
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

  const participants = payload.standings.length;

  const db = await getDb();
  const id = randomUUID().slice(0, 8);

  await db.collection("tournaments").insertOne({
    ...payload,
    participants,
    id,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

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

  const participants = payload.standings.length;

  const db = await getDb();
  const result = await db.collection("tournaments").findOneAndUpdate(
    { id: payload.id },
    {
      $set: {
        name: payload.name,
        status: payload.status,
        budget: payload.budget,
        maxPlayers: payload.maxPlayers,
        minPlayers: payload.minPlayers,
        participants,
        standings: payload.standings,
        fixtures: payload.fixtures,
        updatedAt: new Date(),
      },
    },
    { returnDocument: "after" }
  );

  if (!result) {
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
  const result = await db.collection("tournaments").deleteOne({ id });

  if (!result.deletedCount) {
    return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
  }

  return NextResponse.json({ message: "Tournament deleted" });
}
