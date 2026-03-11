import { Tournament } from "@/types/tournament";

export function TournamentCard({ tournament }: { tournament: Tournament }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold">{tournament.name}</h3>
          <p className="mt-2 text-sm text-slate-400">{tournament.participants} participants</p>
        </div>
        <span className="rounded-full bg-emerald-500 px-3 py-1 text-sm font-semibold text-black">
          {tournament.status}
        </span>
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
    </div>
  );
}