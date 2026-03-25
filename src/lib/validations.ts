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