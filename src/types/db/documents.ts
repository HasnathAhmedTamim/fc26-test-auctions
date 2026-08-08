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

export type UserLineupDoc = {
  userId: string;
  roomId: string;
  formation: string;
  starters: {
    slotId: string;
    playerId: string;
  }[];
  updatedAt: Date;
  createdAt: Date;
};

export type UserAchievementDoc = {
  userId: string;
  tournamentId: string;
  tournamentName: string;
  badgeType: "Champion" | "RunnerUp" | "SemiFinalist";
  awardedBy: string;
  awardedAt: string;
  createdAt: Date;
  updatedAt: Date;
};
