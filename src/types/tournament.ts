export type Tournament = {
  id: string;
  name: string;
  status: "Upcoming" | "Live" | "Completed";
  budget: number;
  maxPlayers: number;
  minPlayers: number;
  participants: number;
};

export const TOURNAMENT_BADGE_TYPES = ["Champion", "RunnerUp", "SemiFinalist"] as const;

export type TournamentBadgeType = (typeof TOURNAMENT_BADGE_TYPES)[number];

export type TournamentAchievement = {
  id: string;
  userId: string;
  tournamentId: string;
  tournamentName: string;
  badgeType: TournamentBadgeType;
  awardedAt: string;
  awardedBy: string;
};