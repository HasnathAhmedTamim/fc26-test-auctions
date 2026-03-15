"use client";

import { useMemo, useState } from "react";
import { Container } from "@/components/layout/container";
import { PlayerFilterSidebar } from "@/components/players/player-filter-sidebar";
import { PlayerCard } from "@/components/players/player-card";
import { players } from "@/data/players";

export default function PlayersPage() {
  const [position, setPosition] = useState("All");
  const [minRating, setMinRating] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const filtered = useMemo(
    () =>
      players.filter((p) => {
        if (position !== "All" && p.position !== position) return false;
        if (minRating && p.rating < Number(minRating)) return false;
        if (maxPrice && p.price > Number(maxPrice)) return false;
        return true;
      }),
    [position, minRating, maxPrice]
  );

  return (
    <section className="py-10">
      <Container>
        <div className="mb-8">
          <h1 className="text-3xl font-black">Players</h1>
          <p className="mt-2 text-slate-400">
            Explore your FC26 player pool before the auction begins.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          <PlayerFilterSidebar
            position={position}
            setPosition={setPosition}
            minRating={minRating}
            setMinRating={setMinRating}
            maxPrice={maxPrice}
            setMaxPrice={setMaxPrice}
          />

          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.length === 0 ? (
              <p className="col-span-full text-slate-400">No players match the current filters.</p>
            ) : (
              filtered.map((player) => <PlayerCard key={player.id} player={player} />)
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}