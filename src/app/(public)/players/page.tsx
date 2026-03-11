import { Container } from "@/components/layout/container";
import { PlayerFilterSidebar } from "@/components/players/player-filter-sidebar";
import { PlayerCard } from "@/components/players/player-card";
import { players } from "@/data/players";

export default function PlayersPage() {
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
          <PlayerFilterSidebar />

          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {players.map((player) => (
              <PlayerCard key={player.id} player={player} />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}