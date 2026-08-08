import { Db } from "mongodb";
import {
  AUCTION_ROUND_TIME_KEY,
  BID_COOLDOWN_KEY,
  BID_INCREMENT_KEY,
  DEFAULT_AUCTION_SETTINGS,
} from "@/lib/auction/constants";
// Shared runtime settings logic lives in one module consumed by API routes and the socket server.
import {
  fetchAuctionRuntimeSettings,
  setAuctionRuntimeSetting as persistAuctionRuntimeSetting,
} from "@/lib/auction/runtime-settings.mjs";

export {
  AUCTION_ROUND_TIME_KEY,
  BID_INCREMENT_KEY,
  BID_COOLDOWN_KEY,
  DEFAULT_AUCTION_SETTINGS,
};

type RuntimeSettingsKey =
  | typeof AUCTION_ROUND_TIME_KEY
  | typeof BID_INCREMENT_KEY
  | typeof BID_COOLDOWN_KEY;

export async function getAuctionRuntimeSettings(db: Db) {
  return fetchAuctionRuntimeSettings(db);
}

export async function setAuctionRuntimeSetting(db: Db, key: RuntimeSettingsKey, value: number) {
  await persistAuctionRuntimeSetting(db, key, value);
}
