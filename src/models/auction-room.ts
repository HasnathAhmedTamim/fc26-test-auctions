/**
 * This file defines TypeScript types for documents related to the auction room, manager statistics, user lineup, and user achievements in the context of an auction game. These types are used to structure the data stored in a database and to ensure type safety when working with this data throughout the application.
 * - AuctionRoomDoc: Represents the state of an auction room, including its status, current player up for bidding, highest bid, and other relevant details. It is used to manage the auction process and provide real-time updates to participants.
 * - ManagerStatDoc: Represents the statistics of a manager (user) in a specific auction room, including the budget spent and the players bought. It helps track the performance of managers in the auction game.
 * - UserLineupDoc: Represents the lineup of players selected by a user for a specific auction room, including the formation and the list of starters. It allows users to manage their team composition and strategy within the auction game.
 * - UserAchievementDoc: Represents the achievements of a user in tournaments, such as winning or placing in the top ranks. It can be used to display badges or awards on user profiles and to recognize their accomplishments in the auction game.
 * 
 * */ 

// This file defines TypeScript types for documents related to the auction room, manager statistics, user lineup, and user achievements in the context of an auction game. These types are used to structure the data stored in a database and to ensure type safety when working with this data throughout the application.
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
// This document represents the state of an auction room, including its status, current player up for bidding, highest bid, and other relevant details. It is used to manage the auction process and provide real-time updates to participants.
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
// This document tracks the lineup of players selected by a user for a specific auction room. It includes the formation and the list of starters, allowing users to manage their team composition and strategy within the auction game.
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

// This document tracks user achievements in tournaments, such as winning or placing in the top ranks. It can be used to display badges or awards on user profiles and to recognize their accomplishments in the auction game.
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
