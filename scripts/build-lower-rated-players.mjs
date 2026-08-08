import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tsvPath = path.join(__dirname, "data", "lower-rated-players.tsv");
const fc26Path = path.join(__dirname, "..", "public", "fc26-player-list-with-base-price.json");
const fc24Path = path.join(__dirname, "..", "public", "fifa24-player-list.json");
const outPath = path.join(__dirname, "..", "public", "lower-rated-players.json");

/** Short auction-sheet names → FC26 fullName (normalized matching handled separately). */
const NAME_ALIASES = {
  oyarzabal: "Mikel Oyarzabal Ugarte",
  morata: "Álvaro Morata Martín",
  gaya: "José Luís Gayà Peña",
  palhinha: "João Maria Palhinha Gonçalves",
  zubimendi: "Martín Zubimendi Ibáñez",
  balde: "Alejandro Balde Martínez",
  mingueza: "Oscar Mingueza",
  malcom: "Malcom Filipe Silva de Oliveira",
  rafa: "Rafa Silva",
  isi: "Isaac Palazón Camacho",
  galeno: "Wenderson Galeno",
  ibanez: "Roger Ibañez",
  rodinei: "Rodinei De Almeida",
};

function norm(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function slugify(value) {
  return norm(value).replace(/ /g, "-").replace(/(^-|-$)/g, "");
}

function defaultBasePrice(overall) {
  if (overall >= 83) return 10;
  if (overall >= 82) return 5;
  return 5;
}

function fc26DisplayName(entry) {
  return entry.fullName || [entry.firstName, entry.lastName].filter(Boolean).join(" ");
}

function buildFc26Lookups(entries) {
  const byNorm = new Map();
  for (const entry of entries) {
    byNorm.set(norm(fc26DisplayName(entry)), entry);
  }
  return { byNorm, entries };
}

function buildFc24Lookups(entries) {
  const byNorm = new Map();
  for (const entry of entries) {
    byNorm.set(norm(entry.name), entry);
  }
  return byNorm;
}

function resolveAliasName(name) {
  const key = norm(name).replace(/ /g, " ");
  const single = key.split(" ").length === 1 ? key : null;
  if (single && NAME_ALIASES[single]) return NAME_ALIASES[single];
  return name;
}

function findFc26(name, position, lookups) {
  const resolved = resolveAliasName(name);
  const normalized = norm(resolved);

  if (lookups.byNorm.has(normalized)) {
    return lookups.byNorm.get(normalized);
  }

  const tokens = normalized.split(" ").filter(Boolean);
  const candidates = lookups.entries.filter((entry) => {
    const full = norm(fc26DisplayName(entry));
    if (full === normalized) return true;
    if (tokens.length === 1) {
      return full.split(" ").includes(tokens[0]) || full.startsWith(`${tokens[0]} `);
    }
    return tokens.every((token) => full.includes(token));
  });

  if (candidates.length === 1) return candidates[0];
  if (candidates.length > 1 && position) {
    const byPos = candidates.filter(
      (entry) => String(entry.position ?? "").toUpperCase() === position.toUpperCase()
    );
    if (byPos.length === 1) return byPos[0];
  }

  return null;
}

function findFc24(name, fc26Entry, fc24ByNorm) {
  const names = [
    fc26Entry ? fc26DisplayName(fc26Entry) : null,
    resolveAliasName(name),
    name,
  ].filter(Boolean);

  for (const candidate of names) {
    const hit = fc24ByNorm.get(norm(candidate));
    if (hit) return hit;
  }

  return null;
}

function mergePlayer({ name, position, overall, basePrice }, fc26Entry, fc24Entry) {
  const sheetBasePrice = Number.isFinite(basePrice) ? basePrice : defaultBasePrice(overall);

  if (fc26Entry) {
    const mergedName = fc26DisplayName(fc26Entry);
    const merged = {
      ...(fc24Entry ?? {}),
      name: mergedName,
      slug: fc26Entry.slug || slugify(mergedName),
      position: fc26Entry.position || position,
      overall: Number(fc26Entry.overall ?? overall),
      basePrice: Number(fc26Entry.basePrice ?? sheetBasePrice),
      firstName: fc26Entry.firstName,
      lastName: fc26Entry.lastName,
      fullName: mergedName,
    };

    if (fc24Entry) {
      merged.picture = fc24Entry.picture;
      merged.cardPicture = fc24Entry.cardPicture;
      merged.club = fc24Entry.club;
      merged.league = fc24Entry.league;
      merged.nation = fc24Entry.nation;
    }

    return merged;
  }

  if (fc24Entry) {
    return {
      ...fc24Entry,
      name: fc24Entry.name,
      slug: slugify(fc24Entry.name),
      position: position || fc24Entry.position,
      overall,
      basePrice: sheetBasePrice,
    };
  }

  return {
    name,
    slug: slugify(name),
    position,
    overall,
    basePrice: sheetBasePrice,
  };
}

const fc26 = JSON.parse(fs.readFileSync(fc26Path, "utf8"));
const fc24 = JSON.parse(fs.readFileSync(fc24Path, "utf8"));
const fc26Lookups = buildFc26Lookups(fc26);
const fc24ByNorm = buildFc24Lookups(fc24);

const lines = fs
  .readFileSync(tsvPath, "utf8")
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter(Boolean);

const players = [];
const seenSlugs = new Set();
const stats = { fc26: 0, fc24Only: 0, sheetOnly: 0 };

for (const line of lines) {
  const parts = line.split("\t");
  const name = parts[0]?.trim();
  const position = parts[1]?.trim().toUpperCase();
  const overall = Number(parts[2]);
  const basePriceRaw = parts[3]?.trim();
  const basePrice = basePriceRaw ? Number(basePriceRaw) : defaultBasePrice(overall);

  if (!name || !position || !Number.isFinite(overall)) continue;

  const fc26Entry = findFc26(name, position, fc26Lookups);
  const fc24Entry = findFc24(name, fc26Entry, fc24ByNorm);
  const merged = mergePlayer({ name, position, overall, basePrice }, fc26Entry, fc24Entry);

  if (fc26Entry) stats.fc26 += 1;
  else if (fc24Entry) stats.fc24Only += 1;
  else stats.sheetOnly += 1;

  let slug = merged.slug || slugify(merged.name);
  if (seenSlugs.has(slug)) slug = `${slug}-${position.toLowerCase()}`;
  seenSlugs.add(slug);
  merged.slug = slug;

  players.push(merged);
}

fs.writeFileSync(outPath, `${JSON.stringify(players, null, 2)}\n`, "utf8");
console.log(`Wrote ${players.length} players to ${outPath}`);
console.log(JSON.stringify(stats, null, 2));
