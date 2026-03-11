import { HeroSection } from "@/components/home/hero-section";
import { Container } from "@/components/layout/container";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <section className="pb-20">
        <Container>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Player Database",
                desc: "Browse FC26 players with ratings, positions, price, and detailed stats.",
              },
              {
                title: "Live Auction",
                desc: "Run live bidding sessions with budgets, rules, and realtime updates.",
              },
              {
                title: "Tournament Control",
                desc: "Track squads, standings, and achievements in one place.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-3xl border border-white/10 bg-white/5 p-6"
              >
                <h3 className="text-xl font-bold">{item.title}</h3>
                <p className="mt-3 text-slate-300">{item.desc}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}