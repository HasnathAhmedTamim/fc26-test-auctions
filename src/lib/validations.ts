import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

function isValidFormationPattern(value: string) {
  if (!/^\d(?:-\d){1,4}$/.test(value)) return false;
  const lines = value.split("-").map((part) => Number(part));
  if (lines.some((line) => !Number.isFinite(line) || line < 1 || line > 6)) return false;
  const totalOutfieldPlayers = lines.reduce((sum, line) => sum + line, 0);
  return totalOutfieldPlayers === 10;
}

const lineupFormationSchema = z.string().refine(isValidFormationPattern, {
  message: "Formation must be a valid pattern like 4-3-3, 4-2-3-1, or 3-4-3",
});

export const lineupStarterSchema = z.object({
  slotId: z.string().min(1),
  playerId: z.string().min(1),
});

export const saveLineupSchema = z.object({
  roomId: z.string().min(1, "roomId is required"),
  formation: lineupFormationSchema,
  starters: z.array(lineupStarterSchema).length(11, "Exactly 11 starters are required"),
});

export const awardBadgeSchema = z.object({
  userId: z.string().min(1, "userId is required"),
  tournamentId: z.string().min(1, "tournamentId is required"),
  tournamentName: z.string().min(1, "tournamentName is required"),
  badgeType: z.enum(["Champion", "RunnerUp", "SemiFinalist"]),
});

const fixtureSchema = z.object({
  id: z.string().min(1, "Fixture id is required"),
  round: z.string().min(1, "Round is required"),
  homeTeam: z.string().min(1, "Home team is required"),
  awayTeam: z.string().min(1, "Away team is required"),
  homeScore: z.number().int().min(0).optional(),
  awayScore: z.number().int().min(0).optional(),
  kickoff: z.string().min(1, "Kickoff is required"),
  status: z.enum(["Scheduled", "Live", "Finished"]),
});

const standingSchema = z.object({
  team: z.string().min(1, "Team name is required"),
  played: z.number().int().min(0),
  won: z.number().int().min(0),
  draw: z.number().int().min(0),
  lost: z.number().int().min(0),
  goalsFor: z.number().int().min(0),
  goalsAgainst: z.number().int().min(0),
  points: z.number().int().min(0),
});

export const createTournamentSchema = z.object({
  name: z.string().min(2, "Tournament name must be at least 2 characters"),
  status: z.enum(["Upcoming", "Live", "Completed"]),
  budget: z.number().positive("Budget must be positive"),
  maxPlayers: z.number().int().positive("Max players must be positive"),
  minPlayers: z.number().int().positive("Min players must be positive"),
  participants: z.number().int().min(0),
  standings: z.array(standingSchema),
  fixtures: z.array(fixtureSchema),
});

export const updateTournamentSchema = createTournamentSchema.extend({
  id: z.string().min(1, "Tournament id is required"),
});