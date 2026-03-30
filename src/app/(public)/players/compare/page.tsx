"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/layout/container";
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

type CompareMetric = {
  key: keyof Pick<
    Player,
    "rating" | "pace" | "shooting" | "passing" | "dribbling" | "defending" | "physical" | "price"
  >;
  label: string;
  higherIsBetter?: boolean;
};

const SLOT_COUNT = 4;

const METRICS: CompareMetric[] = [
  { key: "rating", label: "OVR" },
  { key: "pace", label: "Pace" },
  { key: "shooting", label: "Shooting" },
  { key: "passing", label: "Passing" },
  { key: "dribbling", label: "Dribbling" },
  { key: "defending", label: "Defending" },
  { key: "physical", label: "Physical" },
  { key: "price", label: "Price", higherIsBetter: false },
];

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

export default function PlayerComparePage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>(Array(SLOT_COUNT).fill(""));
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<"db" | "json" | "none">("none");

  useEffect(() => {
    let cancelled = false;

    async function loadPlayers() {
      setLoading(true);
      try {
        const allDbPlayers: Player[] = [];
        let hasMore = true;
        let page = 1;

        while (hasMore) {
          const res = await fetch(`/api/players?page=${page}&limit=200`, {
            cache: "no-store",
          });

          if (!res.ok) {
            hasMore = false;
            break;
          }

          const data = await res.json();
          const batch = Array.isArray(data.players) ? (data.players as Player[]) : [];
          allDbPlayers.push(...batch);
          hasMore = Boolean(data.hasMore);
          page += 1;

          if (page > 25) {
            hasMore = false;
          }
        }

        if (!cancelled && allDbPlayers.length > 0) {
          setPlayers(allDbPlayers);
          setSource("db");
          return;
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
          setSource(mapped.length ? "json" : "none");
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

    const timeoutId = window.setTimeout(() => {
      void loadPlayers();
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, []);

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const sorted = [...players].sort((a, b) => b.rating - a.rating || a.name.localeCompare(b.name));
    if (!normalizedQuery) {
      return sorted.slice(0, 120);
    }

    return sorted
      .filter((player) => {
        const searchable = `${player.name} ${player.club} ${player.nation} ${player.position}`.toLowerCase();
        return searchable.includes(normalizedQuery);
      })
      .slice(0, 120);
  }, [players, query]);

  const selectedPlayers = useMemo(
    () => selectedIds.map((id) => players.find((player) => player.id === id) ?? null),
    [players, selectedIds]
  );

  const chosenPlayerIds = useMemo(() => new Set(selectedIds.filter(Boolean)), [selectedIds]);

  const metricBestValues = useMemo(() => {
    return METRICS.reduce<Record<string, number | null>>((acc, metric) => {
      const values = selectedPlayers
        .map((player) => (player ? Number(player[metric.key] ?? 0) : NaN))
        .filter((value) => Number.isFinite(value));

      if (!values.length) {
        acc[metric.key] = null;
        return acc;
      }

      acc[metric.key] = metric.higherIsBetter === false ? Math.min(...values) : Math.max(...values);
      return acc;
    }, {});
  }, [selectedPlayers]);

  const deltaComparison = useMemo(() => {
    const filled = selectedPlayers
      .map((player, index) => ({ player, index }))
      .filter((entry): entry is { player: Player; index: number } => Boolean(entry.player));

    if (filled.length < 2) {
      return null;
    }

    const base = filled[0];
    const target = filled[1];

    const rows = METRICS.map((metric) => {
      const baseValue = Number(base.player[metric.key] ?? 0);
      const targetValue = Number(target.player[metric.key] ?? 0);
      const delta = targetValue - baseValue;
      const isImprovement = metric.higherIsBetter === false ? delta < 0 : delta > 0;

      return {
        metric,
        baseValue,
        targetValue,
        delta,
        isImprovement,
      };
    });

    return {
      base,
      target,
      rows,
    };
  }, [selectedPlayers]);

  function updateSlot(index: number, value: string) {
    setSelectedIds((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  return (
    <section className="py-10">
      <Container>
        <div className="mb-8">
          <h1 className="text-3xl font-black">Compare Players</h1>
          <p className="mt-2 text-slate-400">
            Pick up to four players and compare key attributes side by side before bidding.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/players"
              className="rounded-xl border border-white/20 bg-transparent px-4 py-2 text-sm text-white hover:bg-white/10"
            >
              Back to Players
            </Link>
          </div>

          {source === "json" ? (
            <p className="mt-3 text-sm text-amber-300">Using fallback player dataset from public JSON.</p>
          ) : null}
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <label htmlFor="compare-query" className="mb-1 block text-xs uppercase tracking-[0.18em] text-slate-400">
            Filter Player Pool
          </label>
          <input
            id="compare-query"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type name, club, nation, or position"
            className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm outline-none focus:border-emerald-400/60"
          />
          <p className="mt-2 text-xs text-slate-500">
            Showing {filteredOptions.length} options from {players.length} players.
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {selectedIds.map((selectedId, idx) => (
              <label key={`slot-${idx + 1}`} htmlFor={`compare-slot-${idx + 1}`} className="block">
                <span className="mb-1 block text-xs uppercase tracking-[0.18em] text-slate-400">Slot {idx + 1}</span>
                <select
                  id={`compare-slot-${idx + 1}`}
                  value={selectedId}
                  onChange={(e) => updateSlot(idx, e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-3 py-3 text-sm outline-none focus:border-emerald-400/60"
                >
                  <option value="">Select player...</option>
                  {filteredOptions.map((player) => {
                    const isChosenElsewhere = chosenPlayerIds.has(player.id) && selectedId !== player.id;
                    return (
                      <option key={player.id} value={player.id} disabled={isChosenElsewhere}>
                        {player.name} ({player.rating}) - {player.position}
                      </option>
                    );
                  })}
                </select>
              </label>
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {selectedPlayers.map((player, idx) => (
            <div key={`card-${idx + 1}`} className="rounded-3xl border border-white/10 bg-white/5 p-4">
              {player ? (
                <>
                  <div className="relative h-48 overflow-hidden rounded-2xl border border-white/10 bg-slate-950">
                    <Image
                      src={player.image?.trim() ? player.image : "/player-placeholder.svg"}
                      alt={player.name}
                      fill
                      className="object-cover"
                      unoptimized={/^https?:\/\//i.test(player.image ?? "")}
                    />
                  </div>
                  <h2 className="mt-3 text-lg font-bold">{player.name}</h2>
                  <p className="text-sm text-slate-400">{player.club} • {player.nation}</p>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="rounded-full bg-emerald-500 px-3 py-1 font-semibold text-black">{player.rating} OVR</span>
                    <span className="text-slate-300">{player.position}</span>
                  </div>
                  <Link href={`/players/${player.id}`} className="mt-3 inline-block text-sm text-emerald-300 hover:text-emerald-200">
                    Open full profile
                  </Link>
                </>
              ) : (
                <div className="flex h-full min-h-64 items-center justify-center rounded-2xl border border-dashed border-white/20 bg-slate-950/40 text-center text-sm text-slate-500">
                  Choose a player for slot {idx + 1}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 overflow-x-auto rounded-3xl border border-white/10 bg-white/5 p-4">
          <table className="min-w-full border-separate border-spacing-y-2 text-sm">
            <thead>
              <tr>
                <th className="px-3 py-2 text-left text-xs uppercase tracking-[0.18em] text-slate-400">Metric</th>
                {selectedPlayers.map((player, idx) => (
                  <th key={`head-${idx + 1}`} className="px-3 py-2 text-left text-xs uppercase tracking-[0.18em] text-slate-400">
                    {player?.name ?? `Slot ${idx + 1}`}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {METRICS.map((metric) => (
                <tr key={metric.key}>
                  <td className="rounded-l-xl border border-white/10 bg-black/20 px-3 py-2 font-semibold text-slate-300">
                    {metric.label}
                  </td>
                  {selectedPlayers.map((player, idx) => {
                    const value = player ? Number(player[metric.key] ?? 0) : null;
                    const best = metricBestValues[metric.key];
                    const isBest = value !== null && best !== null && value === best;

                    return (
                      <td
                        key={`${metric.key}-${idx + 1}`}
                        className={`border border-white/10 bg-black/20 px-3 py-2 ${idx === SLOT_COUNT - 1 ? "rounded-r-xl" : ""}`}
                      >
                        <span className={isBest ? "font-bold text-emerald-300" : "text-slate-200"}>
                          {value === null ? "-" : value}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {deltaComparison ? (
          <div className="mt-8 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-5">
            <h2 className="text-lg font-bold">Quick Difference View</h2>
            <p className="mt-1 text-sm text-slate-300">
              Comparing <span className="font-semibold text-white">{deltaComparison.target.player.name}</span> (Slot {deltaComparison.target.index + 1})
              {" vs "}
              <span className="font-semibold text-white">{deltaComparison.base.player.name}</span> (Slot {deltaComparison.base.index + 1})
            </p>
            <p className="mt-1 text-xs text-slate-400">Formula: Target - Base (positive values favor target for most stats).</p>

            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {deltaComparison.rows.map((row) => {
                const sign = row.delta > 0 ? "+" : "";
                const deltaText = `${sign}${row.delta}`;
                const tone =
                  row.delta === 0
                    ? "text-slate-300"
                    : row.isImprovement
                      ? "text-emerald-300"
                      : "text-red-300";

                return (
                  <div key={`delta-${row.metric.key}`} className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{row.metric.label}</p>
                    <p className={`mt-2 text-lg font-bold ${tone}`}>{deltaText}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {row.targetValue} vs {row.baseValue}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="mt-8 text-sm text-slate-400">Select at least two players to see quick deltas.</p>
        )}

        {loading ? <p className="mt-4 text-slate-400">Loading players...</p> : null}
        {!loading && players.length === 0 ? (
          <p className="mt-4 text-amber-300">No players available to compare yet.</p>
        ) : null}
      </Container>
    </section>
  );
}