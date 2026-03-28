import { auth } from "@/auth";
import { Container } from "@/components/layout/container";
import { TournamentCard } from "@/components/tournaments/tournament-card";
import { Button } from "@/components/ui/button";
import { tournaments } from "@/data/tournaments";
import { getDb } from "@/lib/mongodb";
import { Tournament } from "@/types/tournament";
import Link from "next/link";

export default async function TournamentsPage() {
  const session = await auth();
  const viewerRole = session?.user?.role === "admin" ? "admin" : session?.user?.role === "manager" ? "manager" : "guest";

  let liveTournaments: Tournament[] = [];
  try {
    const db = await getDb();
    const dbTournaments = await db.collection("tournaments").find({}).sort({ createdAt: -1 }).toArray();

    liveTournaments = dbTournaments.map((entry) => ({
      id: String(entry.id ?? ""),
      name: String(entry.name ?? ""),
      status: (entry.status as Tournament["status"]) ?? "Upcoming",
      budget: Number(entry.budget ?? 0),
      maxPlayers: Number(entry.maxPlayers ?? 0),
      minPlayers: Number(entry.minPlayers ?? 0),
      participants: Number(entry.participants ?? 0),
      standings: Array.isArray(entry.standings) ? (entry.standings as Tournament["standings"]) : [],
      fixtures: Array.isArray(entry.fixtures) ? (entry.fixtures as Tournament["fixtures"]) : [],
    }));
  } catch {
    liveTournaments = tournaments;
  }

  const grouped = {
    live: liveTournaments.filter((t) => t.status === "Live"),
    upcoming: liveTournaments.filter((t) => t.status === "Upcoming"),
    completed: liveTournaments.filter((t) => t.status === "Completed"),
  };

  const totalParticipants = liveTournaments.reduce((sum, t) => sum + t.participants, 0);

  return (
    <section className="py-10">
      <Container>
        <div className="mb-8">
          <h1 className="text-3xl font-black">Tournaments</h1>
          <p className="mt-2 text-slate-400">
            View fixtures, results, and points tables published by admin.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {viewerRole === "admin" ? (
              <>
                <Link href="/admin">
                  <Button size="sm" className="bg-amber-400 text-black hover:bg-amber-300">Open Admin Controls</Button>
                </Link>
                <Link href="/dashboard">
                  <Button size="sm" variant="outline">Open Manager Dashboard</Button>
                </Link>
              </>
            ) : viewerRole === "manager" ? (
              <>
                <Link href="/dashboard">
                  <Button size="sm" className="bg-emerald-500 text-black hover:bg-emerald-400">Go to Dashboard</Button>
                </Link>
                <Link href="/players">
                  <Button size="sm" variant="outline">Explore Players</Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button size="sm" className="bg-emerald-500 text-black hover:bg-emerald-400">Login</Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" variant="outline">Register</Button>
                </Link>
              </>
            )}
          </div>

          <div className="mt-4 rounded-2xl border border-cyan-400/30 bg-cyan-500/10 p-4">
            <p className="text-sm font-semibold text-cyan-200">Tournament data is admin-managed.</p>
            <p className="mt-1 text-xs text-cyan-100/90">
              Fixtures, live scores, and standings are created and updated by admin control panel.
            </p>
          </div>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-slate-400">Live</p>
            <p className="mt-1 text-2xl font-black">{grouped.live.length}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-slate-400">Upcoming</p>
            <p className="mt-1 text-2xl font-black">{grouped.upcoming.length}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-slate-400">Completed</p>
            <p className="mt-1 text-2xl font-black">{grouped.completed.length}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-slate-400">Total Participants</p>
            <p className="mt-1 text-2xl font-black">{totalParticipants}</p>
          </div>
        </div>

        {grouped.live.length > 0 && (
          <div className="mb-10">
            <h2 className="text-xl font-bold text-emerald-300">Live Tournaments</h2>
            <p className="mt-1 text-sm text-slate-400">Follow ongoing matchdays with current standings and result updates.</p>
            <div className="mt-4 grid gap-6 md:grid-cols-2">
              {grouped.live.map((tournament) => (
                <TournamentCard key={tournament.id} tournament={tournament} viewerRole={viewerRole} />
              ))}
            </div>
          </div>
        )}

        {grouped.upcoming.length > 0 && (
          <div className="mb-10">
            <h2 className="text-xl font-bold text-amber-200">Upcoming Tournaments</h2>
            <p className="mt-1 text-sm text-slate-400">Upcoming fixtures scheduled by admin before kickoff.</p>
            <div className="mt-4 grid gap-6 md:grid-cols-2">
              {grouped.upcoming.map((tournament) => (
                <TournamentCard key={tournament.id} tournament={tournament} viewerRole={viewerRole} />
              ))}
            </div>
          </div>
        )}

        {grouped.completed.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-slate-300">Completed Tournaments</h2>
            <p className="mt-1 text-sm text-slate-400">Review final table and completed fixture history.</p>
            <div className="mt-4 grid gap-6 md:grid-cols-2">
              {grouped.completed.map((tournament) => (
                <TournamentCard key={tournament.id} tournament={tournament} viewerRole={viewerRole} />
              ))}
            </div>
          </div>
        )}

        {liveTournaments.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
            <p className="text-sm text-slate-300">No tournaments published yet.</p>
            <p className="mt-1 text-xs text-slate-500">Admin can create and publish tournaments from the admin panel.</p>
          </div>
        )}
      </Container>
    </section>
  );
}