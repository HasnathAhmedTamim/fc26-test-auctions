"use client";

import { useEffect, useMemo, useState } from "react";
import { Container } from "@/components/layout/container";
import { PlayerFilterSidebar } from "@/components/players/player-filter-sidebar";
import { PlayerCard } from "@/components/players/player-card";
import { Player } from "@/types/player";

type Fc24RawPlayer = {
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
  slug?: string;
};

function derivePrice(overall: number) {
  return Math.round(overall * 4.5);
}

function mapFc24ToPlayer(item: Fc24RawPlayer, idx: number): Player {
  const rating = Number(item.overall ?? 60);
  const id = String(item.slug ?? `${item.name ?? "player"}-${idx}`)
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-");

  return {
    id,
    name: String(item.name ?? `Player ${idx + 1}`),
    rating,
    position: String(item.position ?? "CM"),
    club: String(item.club ?? "Unknown Club"),
    league: String(item.league ?? "Unknown League"),
    nation: String(item.nation ?? "Unknown Nation"),
    price: derivePrice(rating),
    pace: Number(item.pace ?? 50),
    shooting: Number(item.shooting ?? 50),
    passing: Number(item.passing ?? 50),
    dribbling: Number(item.dribbling ?? 50),
    defending: Number(item.defending ?? 50),
    physical: Number(item.physicality ?? 50),
    image: (String(item.picture ?? "").trim().replace(".adapt.50w.png", ".adapt.320w.png") || String(item.cardPicture ?? "").trim()) || "/player-placeholder.svg",
    age: Number(item.age ?? 27),
    preferredFoot: item.foot === "Left" ? "Left" : "Right",
    height: String(item.height ?? ""),
    weight: String(item.weight ?? ""),
    playstyles: item.playStyle
      ? String(item.playStyle)
          .split(/[|,;/]+/)
          .map((v) => v.trim())
          .filter(Boolean)
          .map((name) => ({
            name,
            description: `${name} trait`,
            plus: name.includes("+") || name.toLowerCase().endsWith("plus"),
          }))
      : [],
  };
}

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<"db" | "json" | "none">("none");
  const [position, setPosition] = useState("All");
  const [minRating, setMinRating] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadPlayers() {
      setLoading(true);
      try {
        const res = await fetch("/api/players", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          const dbPlayers = Array.isArray(data.players) ? data.players : [];
          if (!cancelled && dbPlayers.length > 0) {
            setPlayers(dbPlayers);
            setSource("db");
            return;
          }
        }

        const fallbackRes = await fetch("/fifa24-player-list.json", {
          cache: "no-store",
        });
        if (!fallbackRes.ok) {
          throw new Error("Fallback JSON fetch failed");
        }
        const raw = (await fallbackRes.json()) as Fc24RawPlayer[];
        const mapped = Array.isArray(raw) ? raw.map(mapFc24ToPlayer) : [];

        if (!cancelled) {
          setPlayers(mapped);
          setSource(mapped.length > 0 ? "json" : "none");
        }
      } catch {
        if (!cancelled) {
          setPlayers([]);
          setSource("none");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadPlayers();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(
    () =>
      players.filter((p) => {
        const pos = String(p.position ?? "").trim().toUpperCase();
        const selectedPos = position.trim().toUpperCase();

        const min = Number(minRating);
        const max = Number(maxPrice);

        if (selectedPos !== "ALL" && pos !== selectedPos) return false;
        if (minRating !== "" && Number.isFinite(min) && p.rating < min) return false;
        if (maxPrice !== "" && Number.isFinite(max) && p.price > max) return false;
        return true;
      }),
    [players, position, minRating, maxPrice]
  );

  const positionOptions = useMemo(() => {
    const all = new Set<string>(["All"]);
    players
      .map((p) => String(p.position ?? "").trim().toUpperCase())
      .filter(Boolean)
      .sort()
      .forEach((p) => all.add(p));
    return Array.from(all);
  }, [players]);

  return (
    <section className="py-10">
      <Container>
        <div className="mb-8">
          <h1 className="text-3xl font-black">Players</h1>
          <p className="mt-2 text-slate-400">
            Explore your FC player pool before the auction begins.
          </p>
          {source === "json" ? (
            <p className="mt-2 text-sm text-amber-300">
              Showing fallback data from public JSON file.
            </p>
          ) : null}
        </div>

        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          <PlayerFilterSidebar
            position={position}
            setPosition={setPosition}
            minRating={minRating}
            setMinRating={setMinRating}
            maxPrice={maxPrice}
            setMaxPrice={setMaxPrice}
            positions={positionOptions}
          />

          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {loading ? (
              <p className="col-span-full text-slate-400">Loading players...</p>
            ) : filtered.length === 0 ? (
              <div className="col-span-full rounded-2xl border border-white/10 bg-white/5 p-6">
                <p className="text-slate-300">No players match the current filters.</p>
                <p className="mt-2 text-sm text-slate-400">
                  Try clearing position/rating/price filters to see all players.
                </p>
              </div>
            ) : (
              filtered.map((player) => <PlayerCard key={player.id} player={player} />)
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}