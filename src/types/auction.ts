export type AuctionPlayer = {
  id: string;
  name: string;
  rating: number;
  position: string;
  altPositions?: string[];
  club: string;
  league?: string;
  nation: string;
  age?: number;
  preferredFoot?: "Left" | "Right";
  weakFoot?: number;
  skillMoves?: number;
  height?: string;
  weight?: string;
  image: string;
  cardImage?: string;
  basePrice: number;
  pace?: number;
  shooting?: number;
  passing?: number;
  dribbling?: number;
  defending?: number;
  physicality?: number;
  playstyles?: Array<{
    name: string;
    description: string;
    plus?: boolean;
  }>;
};

export type BidEntry = {
  userId: string;
  userName: string;
  amount: number;
  timestamp: string;
};

export type AuctionRoomState = {
  roomId: string;
  status: "waiting" | "live" | "sold" | "paused" | "ended";
  timer: number;
  currentPlayer: AuctionPlayer | null;
  currentBid: number;
  highestBidderId: string | null;
  highestBidderName: string | null;
  bidHistory: BidEntry[];
};

export const LINEUP_FORMATIONS = [
  "4-3-3",
  "4-4-2",
  "4-2-3-1",
  "3-5-2",
  "3-4-3",
  "5-3-2",
  "4-1-2-1-2",
  "4-5-1",
] as const;

export type LineupFormation = string;

export type LineupSlotId = string;

export type LineupStarter = {
  slotId: LineupSlotId;
  playerId: string;
};

export type LineupPlayer = {
  playerId: string;
  playerName: string;
  amount: number;
};

export type UserLineupState = {
  roomId: string;
  formation: LineupFormation;
  starters: LineupStarter[];
  bench: LineupPlayer[];
  availablePlayers: LineupPlayer[];
  updatedAt?: string;
};