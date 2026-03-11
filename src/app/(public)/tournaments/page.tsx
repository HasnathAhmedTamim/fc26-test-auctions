import { Container } from "@/components/layout/container";
import { TournamentCard } from "@/components/tournaments/tournament-card";
import { tournaments } from "@/data/tournaments";

export default function TournamentsPage() {
  return (
    <section className="py-10">
      <Container>
        <div className="mb-8">
          <h1 className="text-3xl font-black">Tournaments</h1>
          <p className="mt-2 text-slate-400">
            View active and upcoming FC26 auction tournaments.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {tournaments.map((tournament) => (
            <TournamentCard key={tournament.id} tournament={tournament} />
          ))}
        </div>
      </Container>
    </section>
  );
}