import fs from "node:fs/promises";
import path from "node:path";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/container";
import { buildCompareUrl } from "@/lib/players/compare-link";
import { getDb } from "@/lib/mongodb";
import { getActivePlayerEdition } from "@/lib/player-edition";
import {
  getPlayerJsonPathForEdition,
  mapRawJsonToPlayer,
  type RawPlayerJson,
} from "@/lib/players/fallback";

const fallbackCache = new Map<string, Promise<RawPlayerJson[]>>();

function getFallbackPlayers(edition: string) {
  if (!fallbackCache.has(edition)) {
    const relativePath = getPlayerJsonPathForEdition(edition).replace(/^\//, "");
    const jsonPath = path.join(process.cwd(), "public", relativePath);
    fallbackCache.set(
      edition,
      fs
        .readFile(jsonPath, "utf8")
        .then((raw) => {
          const arr = JSON.parse(raw) as RawPlayerJson[];
          return Array.isArray(arr) ? arr : [];
        })
        .catch(() => [])
    );
  }

  return fallbackCache.get(edition)!;
}

function normalizeSlug(value: string) {
  return String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function star(value?: number) {
  return `${value ?? 4}★`;
}

function clean(value?: string | number | null, fallback = "-") {
  if (value === undefined || value === null || value === "") return fallback;
  return String(value);
}

function mapJsonPlayer(item: RawPlayerJson, slug: string, idx: number) {
  const itemSlug = String(item.slug ?? "").toLowerCase();
  if (itemSlug !== slug.toLowerCase()) return null;

  const mapped = mapRawJsonToPlayer(item, idx);
  return {
    id: mapped.id,
    name: mapped.name,
    rating: mapped.rating,
    position: mapped.position,
    club: mapped.club,
    nation: mapped.nation,
    league: mapped.league ?? "Unknown League",
    price: mapped.price,
    pace: mapped.pace,
    shooting: mapped.shooting,
    passing: mapped.passing,
    dribbling: mapped.dribbling,
    defending: mapped.defending,
    physical: mapped.physical,
    image: mapped.image,
    age: mapped.age ?? 27,
    preferredFoot: mapped.preferredFoot ?? "Right",
    height: mapped.height ?? "",
    weight: mapped.weight ?? "",
    weakFoot: 4,
    skillMoves: 4,
    playStyle: item.playStyle ? String(item.playStyle) : "None",
    attributes: {
      acceleration: Number(item.pace ?? 50),
      sprintSpeed: Number(item.pace ?? 50),
      finishing: Number(item.shooting ?? 50),
      shotPower: Number(item.shooting ?? 50),
      vision: Number(item.passing ?? 50),
      shortPassing: Number(item.passing ?? 50),
      agility: Number(item.dribbling ?? 50),
      balance: Number(item.dribbling ?? 50),
      interceptions: Number(item.defending ?? 50),
      standingTackle: Number(item.defending ?? 50),
      stamina: Number(item.physicality ?? 50),
      strength: Number(item.physicality ?? 50),
    },
  };
}

type PlayerView = NonNullable<ReturnType<typeof mapJsonPlayer>> & { basePrice?: number };

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const label = decodeURIComponent(id).replace(/-/g, " ");
  return {
    title: `${label} | Players | FC26 Auction`,
    description: `View stats, attributes, and profile details for ${label}.`,
  };
}

export default async function PlayerDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);
  const normalizedId = normalizeSlug(decodedId);
  const db = await getDb();
  const edition = await getActivePlayerEdition(db);
  const playersCollection = db.collection("players");

  const doc =
    (await playersCollection.findOne({ playerId: decodedId, edition })) ??
    (await playersCollection.findOne({ playerId: decodedId.normalize("NFC"), edition })) ??
    (await playersCollection.findOne({ playerId: decodedId.normalize("NFD"), edition })) ??
    (await playersCollection.findOne({ playerId: normalizedId, edition })) ??
    (await playersCollection.findOne(
      { playerId: decodedId, edition },
      { collation: { locale: "en", strength: 1 } }
    ));

  let player: PlayerView | null = doc
    ? {
        id: String(doc.playerId),
        name: String(doc.name),
        rating: Number(doc.rating),
        position: String(doc.position),
        club: String(doc.club),
        nation: String(doc.nation),
        league: String(doc.league ?? "Unknown League"),
        price: Number(doc.price),
        basePrice: doc.basePrice != null ? Number(doc.basePrice) : undefined,
        pace: Number(doc.pace),
        shooting: Number(doc.shooting),
        passing: Number(doc.passing),
        dribbling: Number(doc.dribbling),
        defending: Number(doc.defending),
        physical: Number(doc.physical),
        image: String(doc.image ?? "").trim() || "/player-placeholder.svg",
        age: Number(doc.age ?? 27),
        preferredFoot: doc.preferredFoot === "Left" ? "Left" : "Right",
        height: String(doc.height ?? ""),
        weight: String(doc.weight ?? ""),
        weakFoot: Number(doc.weakFoot ?? 4),
        skillMoves: Number(doc.skillMoves ?? 4),
        playStyle:
          Array.isArray(doc.playstyles) && doc.playstyles.length > 0
            ? doc.playstyles.map((p: { name?: string }) => p.name).filter(Boolean).join(", ")
            : "None",
        attributes: doc.attributes ?? {},
      }
    : null;

  if (!player) {
    try {
      const arr = await getFallbackPlayers(edition);
      const fallback = Array.isArray(arr)
        ? arr
            .map((item, idx) => mapJsonPlayer(item, decodedId, idx))
            .find(Boolean) ??
          arr
            .map((item, idx) => {
              const slug = String(item.slug ?? "");
              return normalizeSlug(slug) === normalizedId ? mapJsonPlayer(item, slug, idx) : null;
            })
            .find(Boolean)
        : null;
      if (fallback) player = fallback;
    } catch {
      // Ignore fallback read errors; notFound will handle final state.
    }
  }

  if (!player) return notFound();

  const displayPrice = player.basePrice ?? player.price;

  return (
    <section className="py-10">
      <Container>
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-slate-400">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/" className="hover:text-emerald-300">
                Home
              </Link>
            </li>
            <li className="flex items-center gap-2">
              <span aria-hidden="true">/</span>
              <Link href="/players" className="hover:text-emerald-300">
                Players
              </Link>
            </li>
            <li className="flex items-center gap-2">
              <span aria-hidden="true">/</span>
              <span className="font-medium text-slate-200">{player.name}</span>
            </li>
          </ol>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[minmax(280px,380px)_1fr] xl:grid-cols-[minmax(300px,420px)_1fr]">
          <div className="space-y-5">
            <div className="overflow-hidden rounded-3xl border border-emerald-400/30 bg-linear-to-b from-slate-900 to-black">
              <div className="relative flex h-72 items-end justify-center bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.25),transparent_55%)] p-4 sm:h-96 lg:h-130 lg:p-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={player.image?.trim() ? player.image : "/player-placeholder.svg"}
                  alt={player.name}
                  className="h-full w-full object-contain"
                />
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-300">Quick Profile</h3>
              <div className="mt-4 grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
                <p>Preferred Foot: <span className="font-semibold text-white">{clean(player.preferredFoot, "Right")}</span></p>
                <p>Weak Foot: <span className="font-semibold text-white">{star(player.weakFoot)}</span></p>
                <p>Skill Moves: <span className="font-semibold text-white">{star(player.skillMoves)}</span></p>
                <p>Height: <span className="font-semibold text-white">{clean(player.height)}</span></p>
                <p>Weight: <span className="font-semibold text-white">{clean(player.weight)}</span></p>
                <p>Age: <span className="font-semibold text-white">{clean(player.age)}</span></p>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-black text-black">
                  {player.rating} OVR
                </span>
                <span className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold">
                  {player.position}
                </span>
                <span className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold">
                  {displayPrice} coins
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href={buildCompareUrl([player.id])}
                  className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/20"
                >
                  Add to Compare
                </Link>
                <Link
                  href="/players"
                  className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-white/20 hover:text-white"
                >
                  Back to Players
                </Link>
              </div>

              <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">{player.name}</h1>
              <p className="mt-3 text-base text-slate-300 sm:text-lg">
                {player.club} | {clean(player.league, "League")} | {player.nation}
              </p>
              <p className="mt-4 text-sm leading-6 text-slate-400">
                {player.name} is a professional footballer from {player.nation} playing as {player.position} for {player.club}. His overall rating is {player.rating}.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-300">Face Stats</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                ["PACE", player.pace],
                ["SHOOTING", player.shooting],
                ["PASSING", player.passing],
                ["DRIBBLING", player.dribbling],
                ["DEFENDING", player.defending],
                ["PHYSICAL", player.physical],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <p className="text-xs tracking-[0.2em] text-slate-400">{label}</p>
                  <p className="mt-2 text-3xl font-black text-white">{value}</p>
                </div>
              ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-300">Detailed Attributes</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  ["Acceleration", player.attributes.acceleration],
                  ["Sprint Speed", player.attributes.sprintSpeed],
                  ["Finishing", player.attributes.finishing],
                  ["Shot Power", player.attributes.shotPower],
                  ["Vision", player.attributes.vision],
                  ["Short Passing", player.attributes.shortPassing],
                  ["Agility", player.attributes.agility],
                  ["Balance", player.attributes.balance],
                  ["Interceptions", player.attributes.interceptions],
                  ["Standing Tackle", player.attributes.standingTackle],
                  ["Stamina", player.attributes.stamina],
                  ["Strength", player.attributes.strength],
                ].map(([label, value]) => (
                  <div key={String(label)} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 px-3 py-2">
                    <span className="text-sm text-slate-300">{label}</span>
                    <span className="text-sm font-bold text-white">{clean(value, "50")}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {String(player.playStyle || "None")
                  .split(/[|,;/]+/)
                  .map((style) => style.trim())
                  .filter(Boolean)
                  .map((style) => (
                    <span key={style} className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                      {style}
                    </span>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
