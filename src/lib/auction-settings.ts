import { Db } from "mongodb";

export const AUCTION_ROUND_TIME_KEY = "auctionRoundTimeSeconds";
export const BID_INCREMENT_KEY = "bidIncrement";
export const BID_COOLDOWN_KEY = "bidCooldownMs";

export const DEFAULT_AUCTION_SETTINGS = {
  roundTimeSeconds: 120,
  bidIncrement: 10,
  bidCooldownMs: 500,
} as const;

type RuntimeSettingsKey =
  | typeof AUCTION_ROUND_TIME_KEY
  | typeof BID_INCREMENT_KEY
  | typeof BID_COOLDOWN_KEY;

// Normalize persisted values and enforce safe bounds before exposing them at runtime.
function coerceInt(value: unknown, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return fallback;
  if (parsed < min) return fallback;
  if (parsed > max) return fallback;
  return parsed;
}

export async function getAuctionRuntimeSettings(db: Db) {
  const keys: RuntimeSettingsKey[] = [
    AUCTION_ROUND_TIME_KEY,
    BID_INCREMENT_KEY,
    BID_COOLDOWN_KEY,
  ];

  // Fetch all runtime knobs in one query to keep reads cheap during request handling.
  const docs = await db
    .collection("settings")
    .find({ key: { $in: keys } })
    .toArray();

  const byKey = new Map(docs.map((doc) => [String(doc.key), doc.value]));

  return {
    roundTimeSeconds: coerceInt(
      byKey.get(AUCTION_ROUND_TIME_KEY),
      DEFAULT_AUCTION_SETTINGS.roundTimeSeconds,
      15,
      600
    ),
    bidIncrement: coerceInt(
      byKey.get(BID_INCREMENT_KEY),
      DEFAULT_AUCTION_SETTINGS.bidIncrement,
      1,
      1000
    ),
    bidCooldownMs: coerceInt(
      byKey.get(BID_COOLDOWN_KEY),
      DEFAULT_AUCTION_SETTINGS.bidCooldownMs,
      0,
      10000
    ),
  };
}

export async function setAuctionRuntimeSetting(db: Db, key: RuntimeSettingsKey, value: number) {
  // Upsert keeps settings idempotent while preserving createdAt for existing keys.
  await db.collection("settings").updateOne(
    { key },
    {
      $set: {
        key,
        value,
        updatedAt: new Date(),
      },
      $setOnInsert: {
        createdAt: new Date(),
      },
    },
    { upsert: true }
  );
}