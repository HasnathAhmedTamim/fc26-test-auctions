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