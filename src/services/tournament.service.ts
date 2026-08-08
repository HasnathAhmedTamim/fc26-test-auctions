import { Db } from "mongodb";
import { Tournament } from "@/types/tournament";

export function mapTournamentDocument(entry: Record<string, unknown>): Tournament {
  return {
    id: String(entry.id ?? ""),
    name: String(entry.name ?? ""),
    status: (entry.status as Tournament["status"]) ?? "Upcoming",
    budget: Number(entry.budget ?? 0),
    maxPlayers: Number(entry.maxPlayers ?? 0),
    minPlayers: Number(entry.minPlayers ?? 0),
    participants: Number(entry.participants ?? 0),
    standings: Array.isArray(entry.standings) ? (entry.standings as Tournament["standings"]) : [],
    fixtures: Array.isArray(entry.fixtures) ? (entry.fixtures as Tournament["fixtures"]) : [],
  };
}

export async function listTournaments(db: Db) {
  const rows = await db.collection("tournaments").find({}).sort({ createdAt: -1 }).toArray();
  return rows.map((entry) => mapTournamentDocument(entry as Record<string, unknown>));
}

export async function findTournamentById(db: Db, id: string) {
  const entry = await db.collection("tournaments").findOne({ id });
  return entry ? mapTournamentDocument(entry as Record<string, unknown>) : null;
}

export async function createTournament(
  db: Db,
  payload: Omit<Tournament, "id"> & { id: string }
) {
  const participants = payload.standings.length;
  await db.collection("tournaments").insertOne({
    ...payload,
    participants,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return payload.id;
}

export async function updateTournament(
  db: Db,
  payload: Tournament
) {
  const participants = payload.standings.length;
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

  return result ? mapTournamentDocument(result as Record<string, unknown>) : null;
}

export async function deleteTournamentById(db: Db, id: string) {
  const result = await db.collection("tournaments").deleteOne({ id });
  return result.deletedCount === 1;
}
