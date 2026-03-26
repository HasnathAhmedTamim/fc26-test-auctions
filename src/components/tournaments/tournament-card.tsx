import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tournament } from "@/types/tournament";

type ViewerRole = "admin" | "manager" | "guest";

export function TournamentCard({
  tournament,
  viewerRole = "guest",
}: {
  tournament: Tournament;
  viewerRole?: ViewerRole;
}) {
  const slotsLeft = Math.max(0, tournament.maxPlayers - tournament.participants);
  const fillPercent = Math.min(
    100,
    Math.round((tournament.participants / Math.max(1, tournament.maxPlayers)) * 100)
  );

  const topStandings = [...tournament.standings].sort((a, b) => b.points - a.points).slice(0, 5);
  const recentFixtures = tournament.fixtures.slice(0, 4);

  const statusStyles = {
    Live: "bg-emerald-500 text-black",
    Upcoming: "bg-amber-400 text-black",
    Completed: "bg-slate-300 text-slate-900",
  } as const;

  const roleMessage =
    viewerRole === "admin"
      ? "Admin view: publish fixtures and update score table for participants."
      : viewerRole === "manager"
        ? "Manager view: follow fixtures and track your table position."
        : "Sign in as manager to follow matchday updates and standings.";

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold">{tournament.name}</h3>
          <p className="mt-2 text-sm text-slate-400">{tournament.participants} participants</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${statusStyles[tournament.status]}`}>
          {tournament.status}
        </span>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Capacity</span>
          <span>{fillPercent}% filled</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
          <div className="h-full rounded-full bg-emerald-400" style={{ width: `${fillPercent}%` }} />
        </div>
        <p className="mt-2 text-xs text-slate-500">{slotsLeft} slots left before full capacity.</p>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-2xl bg-slate-900 p-4">
          <p className="text-xs text-slate-400">Budget</p>
          <p className="mt-1 font-bold">{tournament.budget}</p>
        </div>
        <div className="rounded-2xl bg-slate-900 p-4">
          <p className="text-xs text-slate-400">Max</p>
          <p className="mt-1 font-bold">{tournament.maxPlayers}</p>
        </div>
        <div className="rounded-2xl bg-slate-900 p-4">
          <p className="text-xs text-slate-400">Min</p>
          <p className="mt-1 font-bold">{tournament.minPlayers}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
          <p className="text-sm font-semibold text-white">Points Table</p>
          <div className="mt-3 overflow-hidden rounded-xl border border-white/10">
            <table className="w-full text-xs">
              <thead className="bg-white/10 text-slate-300">
                <tr>
                  <th className="px-2 py-2 text-left">Team</th>
                  <th className="px-2 py-2 text-center">P</th>
                  <th className="px-2 py-2 text-center">GD</th>
                  <th className="px-2 py-2 text-center">Pts</th>
                </tr>
              </thead>
              <tbody>
                {topStandings.map((team) => (
                  <tr key={`${tournament.id}-${team.team}`} className="border-t border-white/10 text-slate-100">
                    <td className="px-2 py-2">{team.team}</td>
                    <td className="px-2 py-2 text-center">{team.played}</td>
                    <td className="px-2 py-2 text-center">{team.goalsFor - team.goalsAgainst}</td>
                    <td className="px-2 py-2 text-center font-semibold text-emerald-300">{team.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
          <p className="text-sm font-semibold text-white">Fixtures</p>
          <div className="mt-3 space-y-2">
            {recentFixtures.map((fixture) => (
              <div key={fixture.id} className="rounded-xl border border-white/10 bg-white/5 p-2">
                <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400">
                  <span>{fixture.round}</span>
                  <span>{fixture.status}</span>
                </div>
                <p className="mt-1 text-sm text-slate-100">
                  {fixture.homeTeam} {fixture.homeScore ?? "-"} : {fixture.awayScore ?? "-"} {fixture.awayTeam}
                </p>
                <p className="mt-1 text-[11px] text-slate-500">Kickoff: {fixture.kickoff}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-3">
        <p className="text-xs text-slate-400">Perspective</p>
        <p className="mt-1 text-sm text-slate-200">{roleMessage}</p>
      </div>

      <div className="mt-4">
        {viewerRole === "admin" ? (
          <div className="flex flex-wrap gap-2">
            <Link href="/admin">
              <Button size="sm" className="bg-amber-400 text-black hover:bg-amber-300">Manage Fixtures & Scores</Button>
            </Link>
            <Link href="/admin">
              <Button size="sm" variant="outline">Publish Table Update</Button>
            </Link>
          </div>
        ) : viewerRole === "manager" ? (
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard">
              <Button size="sm" className="bg-emerald-500 text-black hover:bg-emerald-400">Open Team Dashboard</Button>
            </Link>
            <Link href="/players">
              <Button size="sm" variant="outline">Check Squad Market</Button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Link href="/login">
              <Button size="sm" className="bg-emerald-500 text-black hover:bg-emerald-400">Login as Manager</Button>
            </Link>
            <Link href="/register">
              <Button size="sm" variant="outline">Create Account</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}