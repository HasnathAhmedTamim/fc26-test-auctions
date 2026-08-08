import { Player } from "@/types/player";

export type RawPlayerJson = {
  name?: string;
  position?: string;
  overall?: number;
  pace?: number;
  shooting?: number;
  passing?: number;
  dribbling?: number;
  defending?: number;
  physicality?: number;
  nation?: string;
  club?: string;
  league?: string;
  cardPicture?: string;
  picture?: string;
  age?: number;
  foot?: string;
  height?: string;
  weight?: string;
  playStyle?: string;
  basePrice?: number;
  slug?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
};

export const PLAYER_JSON_BY_EDITION: Record<string, string> = {
  fc24: "/fifa24-player-list.json",
  fc26: "/fc26-player-list-with-base-price.json",
  "lower-rated": "/lower-rated-players.json",
};

export function getPlayerJsonPathForEdition(edition: string) {
  const normalized = edition.trim().toLowerCase();
  return PLAYER_JSON_BY_EDITION[normalized] ?? PLAYER_JSON_BY_EDITION.fc24;
}

function derivePrice(overall: number) {
  return Math.round(overall * 4.5);
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function mapRawJsonToPlayer(item: RawPlayerJson, idx: number): Player {
  const rating = Number(item.overall ?? 60);
  const name =
    String(item.name ?? item.fullName ?? [item.firstName, item.lastName].filter(Boolean).join(" ") ?? `Player ${idx + 1}`);
  const id = String(item.slug ?? slugify(name))
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-");
  const basePrice = Number(item.basePrice);
  const price = Number.isFinite(basePrice) && basePrice >= 0 ? basePrice : derivePrice(rating);

  return {
    id,
    name,
    rating,
    position: String(item.position ?? "CM"),
    club: String(item.club ?? "Unknown Club"),
    league: String(item.league ?? "Unknown League"),
    nation: String(item.nation ?? "Unknown Nation"),
    price,
    pace: Number(item.pace ?? 50),
    shooting: Number(item.shooting ?? 50),
    passing: Number(item.passing ?? 50),
    dribbling: Number(item.dribbling ?? 50),
    defending: Number(item.defending ?? 50),
    physical: Number(item.physicality ?? 50),
    image:
      (String(item.picture ?? "").trim().replace(".adapt.50w.png", ".adapt.320w.png") ||
        String(item.cardPicture ?? "").trim()) ||
      "/player-placeholder.svg",
    age: Number(item.age ?? 27),
    preferredFoot: item.foot === "Left" ? "Left" : "Right",
    height: String(item.height ?? ""),
    weight: String(item.weight ?? ""),
    playstyles: item.playStyle
      ? String(item.playStyle)
          .split(/[|,;/]+/)
          .map((value) => value.trim())
          .filter(Boolean)
          .map((name) => ({
            name,
            description: `${name} trait`,
            plus: name.includes("+") || name.toLowerCase().endsWith("plus"),
          }))
      : [],
  };
}

export async function fetchPlayersFromEditionJson(edition = "fc24") {
  const jsonPath = getPlayerJsonPathForEdition(edition);
  const res = await fetch(jsonPath, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to load player JSON at ${jsonPath}`);
  }

  const raw = (await res.json()) as RawPlayerJson[];
  return Array.isArray(raw) ? raw.map(mapRawJsonToPlayer) : [];
}
