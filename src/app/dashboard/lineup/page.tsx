import { LineupBuilder } from "@/components/dashboard/lineup-builder";

export default function DashboardLineupPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-black">Lineup Builder</h1>
        <p className="mt-1 text-sm text-slate-400">
          Build your main squad and bench in one compact page.
        </p>
      </div>

      <p className="text-xs text-slate-500">
        Tip: Drag from bench to pitch, drag players back to bench, then save.
      </p>

      <LineupBuilder />
    </div>
  );
}
