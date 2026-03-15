import fs from "node:fs/promises";
import path from "node:path";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/container";
import { getDb } from "@/lib/mongodb";
import { getActivePlayerEdition } from "@/lib/player-edition";

type Fc24RawPlayer = {
  slug?: string;
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
  acceleration?: number;
  sprintSpeed?: number;
  finishing?: number;
  shotPower?: number;
  vision?: number;
  shortPassing?: number;
  agility?: number;
  balance?: number;
  interceptions?: number;
  standingTackle?: number;
  stamina?: number;
  strength?: number;
};

function star(value?: number) {
  return `${value ?? 4}★`;
}

function clean(value?: string | number | null, fallback = "-") {
  if (value === undefined || value === null || value === "") return fallback;
  return String(value);
}

function mapJsonPlayer(item: Fc24RawPlayer, slug: string) {
  const itemSlug = String(item.slug ?? "").toLowerCase();
  if (itemSlug !== slug.toLowerCase()) return null;

  const rating = Number(item.overall ?? 60);
  return {
    id: String(item.slug ?? ""),
    name: clean(item.name, "Unknown Player"),
    rating,
    position: clean(item.position, "CM"),
    club: clean(item.club, "Unknown Club"),
    nation: clean(item.nation, "Unknown Nation"),
    league: clean(item.league, "Unknown League"),
    price: Math.round(rating * 4.5),
    image: (clean(item.picture, "").trim().replace(".adapt.50w.png", ".adapt.320w.png") || clean(item.cardPicture, "").trim()) || "/player-placeholder.svg",
    pace: Number(item.pace ?? 50),
    shooting: Number(item.shooting ?? 50),
    passing: Number(item.passing ?? 50),
    dribbling: Number(item.dribbling ?? 50),
    defending: Number(item.defending ?? 50),
    physical: Number(item.physicality ?? 50),
    age: Number(item.age ?? 27),
    preferredFoot: clean(item.foot, "Right"),
    height: clean(item.height),
    weight: clean(item.weight),
    weakFoot: 4,
    skillMoves: 4,
    playStyle: clean(item.playStyle, "None"),
    attributes: {
      acceleration: Number(item.acceleration ?? 50),
      sprintSpeed: Number(item.sprintSpeed ?? 50),
      finishing: Number(item.finishing ?? 50),
      shotPower: Number(item.shotPower ?? 50),
      vision: Number(item.vision ?? 50),
      shortPassing: Number(item.shortPassing ?? 50),
      agility: Number(item.agility ?? 50),
      balance: Number(item.balance ?? 50),
      interceptions: Number(item.interceptions ?? 50),
      standingTackle: Number(item.standingTackle ?? 50),
      stamina: Number(item.stamina ?? 50),
      strength: Number(item.strength ?? 50),
    },
  };
}

export default async function PlayerDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = await getDb();
  const edition = await getActivePlayerEdition(db);
  const doc = await db.collection("players").findOne({ playerId: id, edition });

  let player = doc
    ? {
        id: doc.playerId,
        name: doc.name,
        rating: doc.rating,
        position: doc.position,
        club: doc.club,
        nation: doc.nation,
        league: doc.league,
        price: doc.price,
        pace: doc.pace,
        shooting: doc.shooting,
        passing: doc.passing,
        dribbling: doc.dribbling,
        defending: doc.defending,
        physical: doc.physical,
        image: String(doc.image ?? "").trim() || "/player-placeholder.svg",
        age: doc.age,
        preferredFoot: doc.preferredFoot,
        height: doc.height,
        weight: doc.weight,
        weakFoot: doc.weakFoot ?? 4,
        skillMoves: doc.skillMoves ?? 4,
        playStyle:
          Array.isArray(doc.playstyles) && doc.playstyles.length > 0
            ? doc.playstyles.map((p: { name?: string }) => p.name).filter(Boolean).join(", ")
            : "None",
        attributes: doc.attributes ?? {},
      }
    : null;

  if (!player) {
    const jsonPath = path.join(process.cwd(), "public", "fifa24-player-list.json");
    try {
      const raw = await fs.readFile(jsonPath, "utf8");
      const arr = JSON.parse(raw) as Fc24RawPlayer[];
      const fallback = Array.isArray(arr)
        ? arr.map((item) => mapJsonPlayer(item, id)).find(Boolean)
        : null;
      if (fallback) player = fallback;
    } catch {
      // Ignore fallback read errors; notFound will handle final state.
    }
  }

  if (!player) return notFound();

  return (
    <section className="py-10">
      <Container>
        <div className="grid gap-8 xl:grid-cols-[420px_1fr]">
          <div className="space-y-5">
            <div className="overflow-hidden rounded-3xl border border-emerald-400/30 bg-linear-to-b from-slate-900 to-black">
              <div className="relative flex h-130 items-end justify-center bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.25),transparent_55%)] p-6">
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
                  {player.price} coins
                </span>
              </div>

              <h1 className="mt-5 text-5xl font-black tracking-tight">{player.name}</h1>
              <p className="mt-3 text-lg text-slate-300">
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