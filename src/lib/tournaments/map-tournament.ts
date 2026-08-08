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
