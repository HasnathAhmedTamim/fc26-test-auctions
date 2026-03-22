type Props = {
  position: string;
  setPosition: (v: string) => void;
  minRating: string;
  setMinRating: (v: string) => void;
  maxPrice: string;
  setMaxPrice: (v: string) => void;
  positions?: string[];
};

const DEFAULT_POSITIONS = [
  "All",
  "ST",
  "CF",
  "LW",
  "RW",
  "LM",
  "RM",
  "CAM",
  "CM",
  "CDM",
  "LWB",
  "RWB",
  "LB",
  "RB",
  "CB",
  "GK",
];

export function PlayerFilterSidebar({
  position,
  setPosition,
  minRating,
  setMinRating,
  maxPrice,
  setMaxPrice,
  positions,
}: Props) {
  const hasFilters = position !== "All" || minRating !== "" || maxPrice !== "";
  const options = positions && positions.length > 0 ? positions : DEFAULT_POSITIONS;
  const quickPositions = options.filter((p) => p !== "All").slice(0, 8);

  return (
    <aside className="rounded-3xl border border-white/10 bg-white/5 p-5 lg:sticky lg:top-24 lg:h-fit">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Filters</h2>
        {hasFilters && (
          <button
            onClick={() => {
              setPosition("All");
              setMinRating("");
              setMaxPrice("");
            }}
            className="text-xs text-emerald-300 hover:text-emerald-200"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {quickPositions.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPosition(p)}
            className={`rounded-full border px-3 py-1 text-xs ${position === p
              ? "border-emerald-400/60 bg-emerald-500/15 text-emerald-300"
              : "border-white/10 text-slate-300 hover:border-emerald-400/40"
            }`}
          >
            {p}
          </button>
        ))}
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
            {options.map((p) => (
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