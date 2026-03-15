import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { MongoClient } from "mongodb";

const fileArg = process.argv[2];
const editionArg = (process.argv[3] || "fc24").toLowerCase();

if (!fileArg) {
  console.error("Usage: node scripts/import-fc-players.mjs <json-file-path> [edition]");
  process.exit(1);
}

const fullPath = path.resolve(fileArg);
if (!fs.existsSync(fullPath)) {
  console.error(`File not found: ${fullPath}`);
  process.exit(1);
}

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI missing");
  process.exit(1);
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function cleanText(value, fallback = "") {
  if (value === undefined || value === null) return fallback;
  return String(value).trim();
}

function derivePrice(overall) {
  const ovr = toNumber(overall, 60);
  return Math.round(ovr * 4.5);
}

function parsePlaystyles(value) {
  const text = cleanText(value);
  if (!text) return [];

  return text
    .split(/[|,;/]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((name) => ({
      name,
      description: `${name} trait from ${editionArg.toUpperCase()} dataset`,
      plus: name.includes("+") || name.toLowerCase().endsWith("plus"),
    }));
}

function upsizePortrait(url) {
  const s = cleanText(url);
  return s ? s.replace(".adapt.50w.png", ".adapt.320w.png") : "";
}

const raw = fs.readFileSync(fullPath, "utf8");
const parsed = JSON.parse(raw);
const sourcePlayers = Array.isArray(parsed)
  ? parsed
  : Array.isArray(parsed.players)
    ? parsed.players
    : [];

if (!sourcePlayers.length) {
  console.error("No players found in JSON file");
  process.exit(1);
}

const now = new Date();

const docs = sourcePlayers.map((item, idx) => {
  const name = cleanText(item.name, `Player ${idx + 1}`);
  const playerId = cleanText(item.slug) || slugify(`${name}-${item.position || idx}`);

  return {
    edition: editionArg,
    playerId,
    name,
    rating: toNumber(item.overall, 60),
    position: cleanText(item.position, "CM"),
    club: cleanText(item.club, "Unknown Club"),
    league: cleanText(item.league, "Unknown League"),
    nation: cleanText(item.nation, "Unknown Nation"),
    image: upsizePortrait(item.picture) || cleanText(item.cardPicture),
    cardImage: cleanText(item.cardPicture),
    price: derivePrice(item.overall),

    pace: toNumber(item.pace, 50),
    shooting: toNumber(item.shooting, 50),
    passing: toNumber(item.passing, 50),
    dribbling: toNumber(item.dribbling, 50),
    defending: toNumber(item.defending, 50),
    physical: toNumber(item.physicality, 50),

    age: toNumber(item.age, undefined),
    preferredFoot: cleanText(item.foot) === "Left" ? "Left" : "Right",
    height: cleanText(item.height),
    weight: cleanText(item.weight),
    playstyles: parsePlaystyles(item.playStyle),
    attributes: {
      acceleration: toNumber(item.acceleration),
      sprintSpeed: toNumber(item.sprintSpeed),
      positioning: toNumber(item.positioning),
      finishing: toNumber(item.finishing),
      shotPower: toNumber(item.shotPower),
      longShots: toNumber(item.longShot),
      volleys: toNumber(item.volleys),
      penalties: toNumber(item.penalties),
      vision: toNumber(item.vision),
      crossing: toNumber(item.crossing),
      freeKickAccuracy: toNumber(item.freeKickAccuracy),
      shortPassing: toNumber(item.shortPassing),
      longPassing: toNumber(item.longPassing),
      curve: toNumber(item.curve),
      agility: toNumber(item.agility),
      balance: toNumber(item.balance),
      reactions: toNumber(item.reaction),
      ballControl: toNumber(item.ballControl),
      dribbling: toNumber(item.subDribbling || item.dribbling),
      composure: toNumber(item.composure),
      interceptions: toNumber(item.interceptions),
      headingAccuracy: toNumber(item.headingAccuracy),
      defensiveAwareness: toNumber(item.defAwareness),
      standingTackle: toNumber(item.standingTackle),
      slidingTackle: toNumber(item.slidingTackle),
      jumping: toNumber(item.jumping),
      stamina: toNumber(item.stamina),
      strength: toNumber(item.strength),
      aggression: toNumber(item.aggression),
    },

    source: {
      fifaVersion: cleanText(item.fifaVersion, editionArg.toUpperCase()),
      nationFlag: cleanText(item.nationFlag),
      clubLogo: cleanText(item.clubLogo),
      playStyleIcon: cleanText(item.playStyleIcon),
      attWorkRate: cleanText(item.attWorkRate),
      defWorkRate: cleanText(item.defWorkRate),
    },

    updatedAt: now,
  };
});

const client = new MongoClient(uri);

try {
  await client.connect();
  const db = client.db("fc26-auction");
  const playersCol = db.collection("players");

  await playersCol.createIndex({ edition: 1, playerId: 1 }, { unique: true });
  await playersCol.createIndex({ edition: 1, rating: -1 });

  const ops = docs.map((doc) => ({
    updateOne: {
      filter: { edition: doc.edition, playerId: doc.playerId },
      update: {
        $set: {
          ...doc,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: now,
        },
      },
      upsert: true,
    },
  }));

  const bulk = await playersCol.bulkWrite(ops, { ordered: false });

  await db.collection("settings").updateOne(
    { key: "activePlayerEdition" },
    {
      $set: {
        key: "activePlayerEdition",
        value: editionArg,
        updatedAt: new Date(),
      },
      $setOnInsert: {
        createdAt: new Date(),
      },
    },
    { upsert: true }
  );

  console.log(
    JSON.stringify(
      {
        edition: editionArg,
        imported: docs.length,
        upserted: bulk.upsertedCount,
        modified: bulk.modifiedCount,
      },
      null,
      2
    )
  );
} catch (error) {
  console.error(error);
  process.exit(1);
} finally {
  await client.close();
}
