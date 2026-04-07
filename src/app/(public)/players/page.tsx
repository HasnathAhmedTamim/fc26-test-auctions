"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { PlayerFilterSidebar } from "@/components/players/player-filter-sidebar";
import { PlayerCard } from "@/components/players/player-card";
import { Button } from "@/components/ui/button";
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
  // Keep fallback pricing aligned with server-side seeding conventions.
  return Math.round(overall * 4.5);
}

function mapFc24ToPlayer(item: Fc24RawPlayer, idx: number): Player {
  // Normalize JSON fallback rows into the app-wide `Player` shape.
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
    // Prefer higher-resolution card art variant when JSON includes `.adapt.50w` URLs.
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
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [pageSize, setPageSize] = useState(24);
  const [currentPage, setCurrentPage] = useState(1);

  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<"db" | "json" | "none">("none");
  const [total, setTotal] = useState(0);
  const [position, setPosition] = useState("All");
  const [minRating, setMinRating] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 320);

    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    let cancelled = false;

    async function loadPlayers() {
      setLoading(true);
      try {
        // Prefer paginated DB API first; fallback JSON is used only when DB data is unavailable.
        const allDbPlayers: Player[] = [];
        let hasMore = true;
        let page = 1;

        while (hasMore) {
          const q = debouncedQuery ? `&search=${encodeURIComponent(debouncedQuery)}` : "";
          const res = await fetch(`/api/players?page=${page}&limit=200${q}`, {
            cache: "no-store",
          });

          if (!res.ok) {
            hasMore = false;
            break;
          }

          const data = await res.json();
          const batch = Array.isArray(data.players) ? data.players : [];
          allDbPlayers.push(...batch);
          hasMore = Boolean(data.hasMore);
          page += 1;

          // Safety break to avoid accidental endless pagination loops.
          if (page > 25) {
            hasMore = false;
          }
        }

        if (!cancelled && allDbPlayers.length > 0) {
          setPlayers(allDbPlayers);
          setSource("db");
          setTotal(allDbPlayers.length);
          setCurrentPage(1);
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
        const fallbackFiltered = debouncedQuery
          ? mapped.filter((p) => {
              const q = debouncedQuery.toLowerCase();
              return (
                p.name.toLowerCase().includes(q) ||
                p.club.toLowerCase().includes(q) ||
                p.nation.toLowerCase().includes(q) ||
                p.position.toLowerCase().includes(q)
              );
            })
          : mapped;

        if (!cancelled) {
          setPlayers(fallbackFiltered);
          setSource(fallbackFiltered.length > 0 ? "json" : "none");
          setTotal(fallbackFiltered.length);
          setCurrentPage(1);
        }
      } catch {
        if (!cancelled) {
          setPlayers([]);
          setSource("none");
          setTotal(0);
          setCurrentPage(1);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadPlayers();
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [position, minRating, maxPrice, debouncedQuery, pageSize]);

  const filtered = useMemo(
    () =>
      // Apply sidebar constraints and search text on top of loaded source data.
      players.filter((p) => {
        const pos = String(p.position ?? "").trim().toUpperCase();
        const selectedPos = position.trim().toUpperCase();

        const min = Number(minRating);
        const max = Number(maxPrice);

        if (selectedPos !== "ALL" && pos !== selectedPos) return false;
        if (minRating !== "" && Number.isFinite(min) && p.rating < min) return false;
        if (maxPrice !== "" && Number.isFinite(max) && p.price > max) return false;

        if (debouncedQuery) {
          const q = debouncedQuery.toLowerCase();
          const searchable = `${p.name} ${p.club} ${p.nation} ${p.position}`.toLowerCase();
          if (!searchable.includes(q)) return false;
        }

        return true;
      }),
    [players, position, minRating, maxPrice, debouncedQuery]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = (safePage - 1) * pageSize;
  const pageEnd = pageStart + pageSize;
  const paginatedPlayers = filtered.slice(pageStart, pageEnd);

  const pageButtons = useMemo(() => {
    // Show a compact sliding window of pagination controls around the active page.
    const start = Math.max(1, safePage - 2);
    const end = Math.min(totalPages, start + 4);
    const pages = [];
    for (let p = start; p <= end; p += 1) {
      pages.push(p);
    }
    return pages;
  }, [safePage, totalPages]);

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
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/players/compare">
              <Button size="sm" className="bg-emerald-500 text-black hover:bg-emerald-400">
                Compare Players
              </Button>
            </Link>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto]">
            <label className="block">
              <span className="mb-1 block text-xs uppercase tracking-[0.18em] text-slate-400">Search Player</span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, club, nation, or position"
                className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm outline-none focus:border-emerald-400/60"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs uppercase tracking-[0.18em] text-slate-400">Cards Per Page</span>
              <select
                value={String(pageSize)}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm outline-none focus:border-emerald-400/60"
              >
                <option value="12">12</option>
                <option value="24">24</option>
                <option value="48">48</option>
              </select>
            </label>
          </div>

          <p className="mt-3 text-sm text-slate-400">
            Showing {filtered.length} matched players{filtered.length ? ` • Page ${safePage} of ${totalPages}` : ""}
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
              paginatedPlayers.map((player) => <PlayerCard key={player.id} player={player} />)
            )}
          </div>

          {filtered.length > 0 ? (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-slate-300">
                Showing {pageStart + 1}-{Math.min(pageEnd, filtered.length)} of {filtered.length}
                {total > 0 ? ` loaded (${total} source)` : ""}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage(1)}
                  disabled={safePage <= 1}
                  className="rounded-lg border border-white/15 px-3 py-1 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  First
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={safePage <= 1}
                  className="rounded-lg border border-white/15 px-3 py-1 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                {pageButtons.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setCurrentPage(p)}
                    className={`rounded-lg border px-3 py-1 text-sm ${p === safePage
                      ? "border-emerald-400/60 bg-emerald-500/20 text-emerald-300"
                      : "border-white/15 text-white hover:border-emerald-400/40"
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={safePage >= totalPages}
                  className="rounded-lg border border-white/15 px-3 py-1 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={safePage >= totalPages}
                  className="rounded-lg border border-white/15 px-3 py-1 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Last
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </Container>
    </section>
  );
}