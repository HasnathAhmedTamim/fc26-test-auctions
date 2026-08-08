import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tournament } from "@/types/tournament";

type ViewerRole = "admin" | "manager" | "guest";

const STATUS_STYLES = {
  Live: "bg-emerald-500 text-black",
  Upcoming: "bg-amber-400 text-black",
  Completed: "bg-slate-300 text-slate-900",
} as const;

export function TournamentDetailView({
  tournament,
  viewerRole = "guest",
  managerTeamName,
}: {
  tournament: Tournament;
  viewerRole?: ViewerRole;
  managerTeamName?: string | null;
}) {
  const standings = [...tournament.standings].sort((a, b) => b.points - a.points);
  const fixtures = [...tournament.fixtures];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Tournament</p>
          <h1 className="mt-2 text-3xl font-black">{tournament.name}</h1>
          <p className="mt-2 text-slate-400">{tournament.participants} participants registered</p>
        </div>
        <span className={`rounded-full px-4 py-2 text-sm font-semibold ${STATUS_STYLES[tournament.status]}`}>
          {tournament.status}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Budget", value: tournament.budget },
          { label: "Max Players", value: tournament.maxPlayers },
          { label: "Min Players", value: tournament.minPlayers },
          { label: "Participants", value: tournament.participants },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-slate-400">{item.label}</p>
            <p className="mt-1 text-2xl font-black">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-xl font-bold">Full Standings</h2>
          <div className="mt-4 overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full min-w-[520px] text-sm">
              <thead className="bg-white/10 text-slate-300">
                <tr>
                  <th className="px-3 py-2 text-left">#</th>
                  <th className="px-3 py-2 text-left">Team</th>
                  <th className="px-3 py-2 text-center">P</th>
                  <th className="px-3 py-2 text-center">W</th>
                  <th className="px-3 py-2 text-center">D</th>
                  <th className="px-3 py-2 text-center">L</th>
                  <th className="px-3 py-2 text-center">GD</th>
                  <th className="px-3 py-2 text-center">Pts</th>
                </tr>
              </thead>
              <tbody>
                {standings.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-6 text-center text-slate-500">
                      Standings will appear once admin publishes the table.
                    </td>
                  </tr>
                ) : (
                  standings.map((team, index) => {
                    const isManagerTeam =
                      managerTeamName &&
                      team.team.trim().toLowerCase() === managerTeamName.trim().toLowerCase();

                    return (
                      <tr
                        key={`${tournament.id}-${team.team}`}
                        className={`border-t border-white/10 ${isManagerTeam ? "bg-emerald-500/10" : ""}`}
                      >
                        <td className="px-3 py-2 text-slate-400">{index + 1}</td>
                        <td className="px-3 py-2 font-medium text-white">
                          {team.team}
                          {isManagerTeam ? (
                            <span className="ml-2 text-xs text-emerald-300">(You)</span>
                          ) : null}
                        </td>
                        <td className="px-3 py-2 text-center">{team.played}</td>
                        <td className="px-3 py-2 text-center">{team.won}</td>
                        <td className="px-3 py-2 text-center">{team.draw}</td>
                        <td className="px-3 py-2 text-center">{team.lost}</td>
                        <td className="px-3 py-2 text-center">{team.goalsFor - team.goalsAgainst}</td>
                        <td className="px-3 py-2 text-center font-semibold text-emerald-300">{team.points}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-xl font-bold">Fixtures & Results</h2>
          <div className="mt-4 space-y-3">
            {fixtures.length === 0 ? (
              <p className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-slate-500">
                No fixtures published yet.
              </p>
            ) : (
              fixtures.map((fixture) => (
                <div key={fixture.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
                    <span>{fixture.round}</span>
                    <span>{fixture.status}</span>
                  </div>
                  <p className="mt-2 text-base font-semibold text-white">
                    {fixture.homeTeam} {fixture.homeScore ?? "-"} : {fixture.awayScore ?? "-"}{" "}
                    {fixture.awayTeam}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">Kickoff: {fixture.kickoff}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href="/tournaments">
          <Button variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10">
            Back to tournaments
          </Button>
        </Link>
        {viewerRole === "admin" ? (
          <Link href="/admin">
            <Button className="bg-amber-400 text-black hover:bg-amber-300">Manage in Admin</Button>
          </Link>
        ) : null}
      </div>
    </div>
  );
}
