export type Tournament = {
  id: string;
  name: string;
  status: "Upcoming" | "Live" | "Completed";
  budget: number;
  maxPlayers: number;
  minPlayers: number;
  participants: number;
};