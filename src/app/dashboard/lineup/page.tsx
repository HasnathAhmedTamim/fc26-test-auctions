import { LineupBuilder } from "@/components/dashboard/lineup-builder";

export default function DashboardLineupPage() {
  return (
    <div>
      <h1 className="text-3xl font-black">Lineup Builder</h1>
      <p className="mt-2 text-slate-400">
        Drag your bought players onto the pitch and save your preferred formation.
      </p>

      <div className="mt-8">
        <LineupBuilder />
      </div>
    </div>
  );
}
