import { Db } from "mongodb";

export const ACTIVE_PLAYER_EDITION_KEY = "activePlayerEdition";

export async function getActivePlayerEdition(db: Db) {
  const settings = db.collection("settings");
  const doc = await settings.findOne({ key: ACTIVE_PLAYER_EDITION_KEY });
  // Keep app boot-safe when the setting has not been initialized yet.
  if (!doc?.value || typeof doc.value !== "string") {
    return "fc24";
  }
  return doc.value;
}

export async function setActivePlayerEdition(db: Db, edition: string) {
  const settings = db.collection("settings");
  // Upsert keeps the operation idempotent for repeated admin updates.
  await settings.updateOne(
    { key: ACTIVE_PLAYER_EDITION_KEY },
    {
      $set: {
        key: ACTIVE_PLAYER_EDITION_KEY,
        value: edition,
        updatedAt: new Date(),
      },
      $setOnInsert: {
        createdAt: new Date(),
      },
    },
    { upsert: true }
  );
}

export async function listAvailablePlayerEditions(db: Db) {
  const rows = await db
    .collection("players")
    .aggregate<{ edition: string }>([
      // Normalize and dedupe editions from player documents for settings dropdowns.
      {
        $match: {
          edition: { $type: "string", $ne: "" },
        },
      },
      {
        $project: {
          _id: 0,
          edition: { $toLower: "$edition" },
        },
      },
      {
        $group: {
          _id: "$edition",
        },
      },
      {
        $project: {
          _id: 0,
          edition: "$_id",
        },
      },
      {
        $sort: { edition: 1 },
      },
    ])
    .toArray();

  return rows.map((row) => row.edition).filter(Boolean);
}
