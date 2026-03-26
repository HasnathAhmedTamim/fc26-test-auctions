export type TournamentFixtureStatus = "Scheduled" | "Live" | "Finished";

export type TournamentFixture = {
  id: string;
  round: string;
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  kickoff: string;
  status: TournamentFixtureStatus;
};

export type TournamentStanding = {
  team: string;
  played: number;
  won: number;
  draw: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
};

export type Tournament = {
  id: string;
  name: string;
  status: "Upcoming" | "Live" | "Completed";
  budget: number;
  maxPlayers: number;
  minPlayers: number;
  participants: number;
  standings: TournamentStanding[];
  fixtures: TournamentFixture[];
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