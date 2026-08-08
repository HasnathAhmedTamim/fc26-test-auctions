import { Tournament, TournamentFixture, TournamentStanding } from "@/types/tournament";

export type AuctionRoom = {
  roomId: string;
  name: string;
  status: string;
  budget: number;
  maxPlayers: number;
};

export type ManagerRosterPlayer = {
  playerId: string;
  playerName: string;
  amount: number;
};

export type ManagerRoster = {
  userId: string;
  userName: string;
  email: string;
  budgetSpent: number;
  playersBought: ManagerRosterPlayer[];
};

export type RoomAccessManager = {
  userId: string;
  userName: string;
  email: string;
  canJoin: boolean;
};

export type PlayerOption = {
  id: string;
  name: string;
  position: string;
  rating: number;
  price: number;
  club: string;
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "manager";
  createdAt: string | null;
};

export type UserDraft = {
  name: string;
  email: string;
  role: "admin" | "manager";
  password: string;
};

export type AdminAchievement = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  tournamentId: string;
  tournamentName: string;
  badgeType: "Champion" | "RunnerUp" | "SemiFinalist";
  awardedAt: string;
};

export type TournamentStandingRow = TournamentStanding;
export type TournamentFixtureRow = TournamentFixture;
export type AdminView = "rooms" | "roster" | "tournaments" | "badges" | "users";
