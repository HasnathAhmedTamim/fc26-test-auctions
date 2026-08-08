export const AUCTION_ROUND_TIME_KEY = "auctionRoundTimeSeconds";
export const BID_INCREMENT_KEY = "bidIncrement";
export const BID_COOLDOWN_KEY = "bidCooldownMs";

export const DEFAULT_AUCTION_SETTINGS = {
  roundTimeSeconds: 120,
  bidIncrement: 10,
  bidCooldownMs: 500,
};

export const AUCTION_SETTINGS_CACHE_TTL_MS = 5000;

export function coerceSettingInt(value, fallback, min, max) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return fallback;
  if (parsed < min || parsed > max) return fallback;
  return parsed;
}

export async function fetchAuctionRuntimeSettings(db, cacheRef) {
  const now = Date.now();

  if (cacheRef?.value && now - cacheRef.fetchedAt < AUCTION_SETTINGS_CACHE_TTL_MS) {
    return cacheRef.value;
  }

  const keys = [AUCTION_ROUND_TIME_KEY, BID_INCREMENT_KEY, BID_COOLDOWN_KEY];
  const docs = await db.collection("settings").find({ key: { $in: keys } }).toArray();
  const byKey = new Map(docs.map((doc) => [String(doc.key), doc.value]));

  const value = {
    roundTimeSeconds: coerceSettingInt(
      byKey.get(AUCTION_ROUND_TIME_KEY),
      DEFAULT_AUCTION_SETTINGS.roundTimeSeconds,
      15,
      600
    ),
    bidIncrement: coerceSettingInt(
      byKey.get(BID_INCREMENT_KEY),
      DEFAULT_AUCTION_SETTINGS.bidIncrement,
      1,
      1000
    ),
    bidCooldownMs: coerceSettingInt(
      byKey.get(BID_COOLDOWN_KEY),
      DEFAULT_AUCTION_SETTINGS.bidCooldownMs,
      0,
      10000
    ),
  };

  if (cacheRef) {
    cacheRef.value = value;
    cacheRef.fetchedAt = now;
  }

  return value;
}

export async function setAuctionRuntimeSetting(db, key, value) {
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
