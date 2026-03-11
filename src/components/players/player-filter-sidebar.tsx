export function PlayerFilterSidebar() {
  return (
    <aside className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <h2 className="text-lg font-bold">Filters</h2>

      <div className="mt-5 space-y-5">
        <div>
          <label className="mb-2 block text-sm text-slate-300">Position</label>
          <select aria-label="Filter" className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm outline-none">
            <option>All</option>
            <option>ST</option>
            <option>CM</option>
            <option>CB</option>
            <option>GK</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm text-slate-300">Minimum Rating</label>
          <input
            type="number"
            placeholder="e.g. 85"
            className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm outline-none"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm text-slate-300">Max Price</label>
          <input
            type="number"
            placeholder="e.g. 300"
            className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm outline-none"
          />
        </div>
      </div>
    </aside>
  );
}