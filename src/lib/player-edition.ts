import { Db } from "mongodb";

export const ACTIVE_PLAYER_EDITION_KEY = "activePlayerEdition";

export async function getActivePlayerEdition(db: Db) {
  const settings = db.collection("settings");
  const doc = await settings.findOne({ key: ACTIVE_PLAYER_EDITION_KEY });
  if (!doc?.value || typeof doc.value !== "string") {
    return "fc24";
  }
  return doc.value;
}

export async function setActivePlayerEdition(db: Db, edition: string) {
  const settings = db.collection("settings");
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
