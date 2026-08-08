type BarItem = { label: string; value: number };
type PieItem = { label: string; value: number; color: string };
type LineItem = { label: string; value: number };

type Props = {
  squadBar: BarItem[];
  budgetPie: PieItem[];
  soldLine: LineItem[];
};

function maxValue(items: { value: number }[]) {
  return Math.max(...items.map((item) => item.value), 1);
}

export function DashboardCharts({ squadBar, budgetPie, soldLine }: Props) {
  const barMax = maxValue(squadBar);
  const lineMax = maxValue(soldLine);
  const pieTotal = budgetPie.reduce((sum, item) => sum + item.value, 0) || 1;

  return (
    <div className="mt-8 grid gap-6 xl:grid-cols-3">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-5 xl:col-span-2">
        <h2 className="text-lg font-bold">Players bought by manager</h2>
        <p className="mt-1 text-sm text-slate-400">Current or latest room squad counts</p>
        <div className="mt-6 space-y-3">
          {squadBar.length === 0 ? (
            <p className="text-sm text-slate-500">No squad data yet.</p>
          ) : (
            squadBar.map((item) => (
              <div key={item.label}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{item.label}</span>
                  <span className="font-semibold text-emerald-300">{item.value}</span>
                </div>
                <div className="h-3 rounded-full bg-black/30">
                  <div
                    className="h-3 rounded-full bg-emerald-500"
                    style={{ width: `${(item.value / barMax) * 100}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-lg font-bold">Your budget split</h2>
        <p className="mt-1 text-sm text-slate-400">Spent vs remaining</p>
        <div className="mt-6 flex h-40 items-end gap-3">
          {budgetPie.map((item) => (
            <div key={item.label} className="flex flex-1 flex-col items-center gap-2">
              <div
                className="w-full rounded-t-xl"
                style={{
                  height: `${Math.max(12, (item.value / pieTotal) * 140)}px`,
                  backgroundColor: item.color,
                }}
              />
              <span className="text-xs text-slate-400">{item.label}</span>
              <span className="text-sm font-semibold">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-5 xl:col-span-3">
        <h2 className="text-base font-bold sm:text-lg">Players sold over time</h2>
        <p className="mt-1 text-sm text-slate-400">Cumulative sold count in the active room</p>
        {soldLine.length > 6 ? (
          <p className="mt-2 text-xs text-slate-500 md:hidden">Swipe horizontally to see more →</p>
        ) : null}
        <div className="scroll-hint-x mt-4 flex h-40 items-end gap-2 overflow-x-auto pb-1 sm:mt-6 sm:h-44">
          {soldLine.length === 0 ? (
            <p className="text-sm text-slate-500">No sold players yet.</p>
          ) : (
            soldLine.map((item) => (
              <div key={item.label} className="flex min-w-[48px] flex-col items-center gap-2">
                <div
                  className="w-10 rounded-t-lg bg-cyan-500"
                  style={{ height: `${Math.max(12, (item.value / lineMax) * 120)}px` }}
                />
                <span className="text-[10px] text-slate-500">{item.label}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
