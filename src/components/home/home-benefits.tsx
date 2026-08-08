import { Container } from "@/components/layout/container";

const benefits = [
  {
    title: "Built for FC leagues",
    desc: "Player catalogs, budgets, squad limits, and room access match real auction-night rules.",
  },
  {
    title: "Zero spreadsheet chaos",
    desc: "Sold players, budgets, and lineups stay synced for every manager automatically.",
  },
  {
    title: "Admin control room",
    desc: "Set players, pause rounds, skip lots, and grant room access from one panel.",
  },
  {
    title: "Mobile-ready bidding",
    desc: "Managers can follow the room and bid from phone, tablet, or desktop.",
  },
];

export function HomeBenefits() {
  return (
    <section className="py-16">
      <Container>
        <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">Why FC26 Auction</p>
        <h2 className="mt-2 text-3xl font-black">Everything your custom league needs</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {benefits.map((item) => (
            <article key={item.title} className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h3 className="text-xl font-bold">{item.title}</h3>
              <p className="mt-3 text-slate-400">{item.desc}</p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
