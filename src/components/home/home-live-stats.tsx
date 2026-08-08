import { Container } from "@/components/layout/container";

type Props = {
  stats: {
    totalRooms: number;
    liveRooms: number;
    playersSold: number;
    managers: number;
    playersInCatalog: number;
  };
};

export function HomeLiveStats({ stats }: Props) {
  const items = [
    { label: "Auction rooms", value: stats.totalRooms },
    { label: "Live now", value: stats.liveRooms },
    { label: "Players sold", value: stats.playersSold },
    { label: "Managers", value: stats.managers },
    { label: "Catalog players", value: stats.playersInCatalog },
  ];

  return (
    <section className="py-16">
      <Container>
        <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">Live platform stats</p>
        <h2 className="mt-2 text-2xl font-black sm:text-3xl">Real numbers from your league database</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {items.map((item) => (
            <div key={item.label} className="rounded-3xl border border-white/10 bg-white/5 p-5 text-center">
              <p className="text-3xl font-black text-emerald-300">{item.value}</p>
              <p className="mt-2 text-sm text-slate-400">{item.label}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
