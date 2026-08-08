"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Container } from "@/components/layout/container";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Button } from "@/components/ui/button";
import { PlayerSearchPicker } from "@/components/players/player-search-picker";
import { Player } from "@/types/player";
import { fetchPlayersFromEditionJson } from "@/lib/players/fallback";

type CompareMetric = {
  key: keyof Pick<
    Player,
    "rating" | "pace" | "shooting" | "passing" | "dribbling" | "defending" | "physical" | "price"
  >;
  label: string;
  higherIsBetter?: boolean;
};

const SLOT_COUNT = 4;
const SLOT_PARAM_KEYS = ["p1", "p2", "p3", "p4"] as const;

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

export default function CompareClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>(Array(SLOT_COUNT).fill(""));
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const hydratedFromUrl = useRef(false);
  const skipUrlSync = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function loadPlayers() {
      setLoading(true);
      try {
        const allDbPlayers: Player[] = [];
        let hasMore = true;
        let page = 1;

        while (hasMore) {
          const res = await fetch(`/api/players?page=${page}&limit=200`, { cache: "no-store" });
          if (!res.ok) {
            hasMore = false;
            break;
          }

          const data = await res.json();
          const batch = Array.isArray(data.players) ? (data.players as Player[]) : [];
          allDbPlayers.push(...batch);
          hasMore = Boolean(data.hasMore);
          page += 1;
          if (page > 25) hasMore = false;
        }

        if (!cancelled && allDbPlayers.length > 0) {
          setPlayers(allDbPlayers);
          return;
        }

        const versionRes = await fetch("/api/players/version", { cache: "no-store" });
        const versionData = versionRes.ok ? await versionRes.json() : { activeEdition: "fc24" };
        const edition = String(versionData.activeEdition ?? "fc24");
        const mapped = await fetchPlayersFromEditionJson(edition);

        if (!cancelled) setPlayers(mapped);
      } catch {
        if (!cancelled) setPlayers([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    const timeoutId = window.setTimeout(() => void loadPlayers(), 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    if (!players.length || hydratedFromUrl.current) return;

    const fromUrl = SLOT_PARAM_KEYS.map((key) => {
      const id = searchParams.get(key)?.trim() ?? "";
      return id && players.some((player) => player.id === id) ? id : "";
    });

    if (fromUrl.some(Boolean)) {
      skipUrlSync.current = true;
      setSelectedIds(fromUrl);
    }

    hydratedFromUrl.current = true;
  }, [players, searchParams]);

  useEffect(() => {
    if (!players.length || !hydratedFromUrl.current) return;
    if (skipUrlSync.current) {
      skipUrlSync.current = false;
      return;
    }

    const params = new URLSearchParams();
    selectedIds.forEach((id, index) => {
      if (id) params.set(SLOT_PARAM_KEYS[index], id);
    });

    const next = params.toString();
    const current = searchParams.toString();
    if (next === current) return;

    router.replace(next ? `/players/compare?${next}` : "/players/compare", { scroll: false });
  }, [selectedIds, players.length, router, searchParams]);

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

    if (filled.length < 2) return null;

    const base = filled[0];
    const target = filled[1];

    const rows = METRICS.map((metric) => {
      const baseValue = Number(base.player[metric.key] ?? 0);
      const targetValue = Number(target.player[metric.key] ?? 0);
      const delta = targetValue - baseValue;
      const isImprovement = metric.higherIsBetter === false ? delta < 0 : delta > 0;
      return { metric, baseValue, targetValue, delta, isImprovement };
    });

    return { base, target, rows };
  }, [selectedPlayers]);

  function updateSlot(index: number, value: string) {
    setSelectedIds((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  async function copyCompareLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="py-10">
      <Container>
        <Breadcrumbs />
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
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-white/20 bg-transparent text-white hover:bg-white/10"
              onClick={() => void copyCompareLink()}
            >
              {copied ? "Link copied!" : "Copy compare link"}
            </Button>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <p className="text-sm text-slate-400">
            Search and pick up to four players. Each slot has its own searchable dropdown.
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {selectedIds.map((selectedId, idx) => (
              <PlayerSearchPicker
                key={`slot-${idx + 1}`}
                id={`compare-slot-${idx + 1}`}
                players={players}
                value={selectedId}
                onChange={(value) => updateSlot(idx, value)}
                label={`Slot ${idx + 1}`}
                isPlayerDisabled={(player) => chosenPlayerIds.has(player.id) && selectedId !== player.id}
                getDisabledReason={(player) =>
                  chosenPlayerIds.has(player.id) && selectedId !== player.id ? "In another slot" : null
                }
              />
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

        <div className="mt-8 scroll-hint-x overflow-x-auto rounded-3xl border border-white/10 bg-white/5 p-4">
          <table className="min-w-[640px] w-full border-separate border-spacing-y-2 text-sm" aria-label="Player comparison metrics">
            <caption className="sr-only">Side-by-side comparison of selected player attributes</caption>
            <thead>
              <tr>
                <th className="px-3 py-2 text-left text-xs uppercase tracking-[0.18em] text-slate-400">Metric</th>
                {selectedPlayers.map((player, idx) => (
                  <th key={`head-${idx + 1}`} className="max-w-[120px] truncate px-3 py-2 text-left text-xs uppercase tracking-[0.18em] text-slate-400">
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
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {deltaComparison.rows.map((row) => {
                const sign = row.delta > 0 ? "+" : "";
                const tone =
                  row.delta === 0 ? "text-slate-300" : row.isImprovement ? "text-emerald-300" : "text-red-300";
                return (
                  <div key={`delta-${row.metric.key}`} className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{row.metric.label}</p>
                    <p className={`mt-2 text-lg font-bold ${tone}`}>{`${sign}${row.delta}`}</p>
                    <p className="mt-1 text-xs text-slate-500">{row.targetValue} vs {row.baseValue}</p>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="mt-8 text-sm text-slate-400">Select at least two players to see quick deltas.</p>
        )}

        {loading ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-64 animate-pulse rounded-3xl border border-white/10 bg-white/5" />
            ))}
          </div>
        ) : null}
        {!loading && players.length === 0 ? (
          <p className="mt-4 text-amber-300">No players available to compare yet.</p>
        ) : null}
      </Container>
    </section>
  );
}
