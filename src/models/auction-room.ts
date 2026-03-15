export type AuctionRoomDoc = {
  roomId: string;
  name: string;
  status: "waiting" | "live" | "sold" | "paused" | "ended";
  timer: number;
  currentPlayer: {
    id: string;
    name: string;
    rating: number;
    position: string;
    club: string;
    nation: string;
    image: string;
    basePrice: number;
  } | null;
  currentBid: number;
  highestBidderId: string | null;
  highestBidderName: string | null;
  budget: number;
  maxPlayers: number;
  createdAt: Date;
  updatedAt: Date;
};

export type ManagerStatDoc = {
  userId: string;
  userName: string;
  roomId: string;
  budgetSpent: number;
  playersBought: {
    playerId: string;
    playerName: string;
    amount: number;
  }[];
};
