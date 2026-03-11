export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-3xl font-black">Dashboard</h1>
      <p className="mt-2 text-slate-400">Your manager overview will appear here.</p>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-slate-400">Budget Left</p>
          <p className="mt-2 text-3xl font-black">1540</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-slate-400">Players Bought</p>
          <p className="mt-2 text-3xl font-black">4</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-slate-400">Tournament</p>
          <p className="mt-2 text-3xl font-black">Live</p>
        </div>
      </div>
    </div>
  );
}