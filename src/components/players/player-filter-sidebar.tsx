type Props = {
  position: string;
  setPosition: (v: string) => void;
  minRating: string;
  setMinRating: (v: string) => void;
  maxPrice: string;
  setMaxPrice: (v: string) => void;
};

const POSITIONS = ["All", "ST", "CF", "LW", "RW", "CAM", "CM", "CDM", "LB", "RB", "CB", "GK"];

export function PlayerFilterSidebar({
  position,
  setPosition,
  minRating,
  setMinRating,
  maxPrice,
  setMaxPrice,
}: Props) {
  const hasFilters = position !== "All" || minRating !== "" || maxPrice !== "";

  return (
    <aside className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Filters</h2>
        {hasFilters && (
          <button
            onClick={() => {
              setPosition("All");
              setMinRating("");
              setMaxPrice("");
            }}
            className="text-xs text-slate-400 hover:text-white"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="mt-5 space-y-5">
        <div>
          <label className="mb-2 block text-sm text-slate-300">Position</label>
          <select
            aria-label="Filter by position"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm outline-none"
          >
            {POSITIONS.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm text-slate-300">Minimum Rating</label>
          <input
            type="number"
            value={minRating}
            onChange={(e) => setMinRating(e.target.value)}
            placeholder="e.g. 85"
            className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm outline-none"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm text-slate-300">Max Price (coins)</label>
          <input
            type="number"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="e.g. 300"
            className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm outline-none"
          />
        </div>
      </div>
    </aside>
  );
}