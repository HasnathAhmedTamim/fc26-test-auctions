export const AUCTION_ROUND_TIME_KEY = "auctionRoundTimeSeconds";
export const BID_INCREMENT_KEY = "bidIncrement";
export const BID_COOLDOWN_KEY = "bidCooldownMs";

export const DEFAULT_AUCTION_SETTINGS = {
  roundTimeSeconds: 120,
  bidIncrement: 10,
  bidCooldownMs: 500,
} as const;

export const AUCTION_SOCKET_EVENTS = {
  JOIN: "auction:join",
  BID: "auction:bid",
  START: "auction:start",
  PAUSE: "auction:pause",
  SOLD_NOW: "auction:sold-now",
  SET_PLAYER: "auction:set-player",
  OPT_OUT: "auction:opt-out",
  SKIP: "auction:skip",
  STATE: "auction:state",
  NEW_BID: "auction:new-bid",
  BID_UPDATED: "auction:bid-updated",
  STARTED: "auction:started",
  PAUSED: "auction:paused",
  TIMER_TICK: "auction:timer-tick",
  PLAYER_SET: "auction:player-set",
  SOLD: "auction:sold",
  NO_BID: "auction:no-bid",
  SKIPPED: "auction:skipped",
  YOU_OPTED_OUT: "auction:you-opted-out",
  USER_OPTED_OUT: "auction:user-opted-out",
  AUTO_PAUSED: "auction:auto-paused",
  USER_JOINED: "auction:user-joined",
  ERROR: "auction:error",
} as const;
