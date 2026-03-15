export type AuctionPlayer = {
  id: string;
  name: string;
  rating: number;
  position: string;
  club: string;
  nation: string;
  image: string;
  basePrice: number;
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