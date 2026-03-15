import Link from "next/link";
import { HeroSection } from "@/components/home/hero-section";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <>
      <HeroSection />

      <section className="relative pb-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(16,185,129,0.12),transparent_45%),radial-gradient(circle_at_80%_100%,rgba(250,204,21,0.08),transparent_40%)]" />
        <Container className="relative">
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Live Transfer Drama",
                desc: "Real-time bids, instant winner updates, and room activity for every manager.",
              },
              {
                title: "Deep Player Scouting",
                desc: "Face stats, detailed attributes, playstyles, and profile info in one FC-style view.",
              },
              {
                title: "Versioned Databases",
                desc: "Run FC24 today and switch to FC26 instantly when your next player list is ready.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-3xl border border-white/10 bg-linear-to-b from-white/10 to-white/5 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]"
              >
                <h3 className="text-xl font-black tracking-tight">{item.title}</h3>
                <p className="mt-3 text-slate-300">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-3xl border border-emerald-400/20 bg-black/30 p-8 backdrop-blur-sm">
            <h2 className="text-2xl font-black">Start Your Next Auction Night</h2>
            <p className="mt-3 max-w-2xl text-slate-300">
              Create an auction room, set player pools, manage bids in real-time, and build dream squads with a premium FC-inspired experience.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild className="bg-emerald-500 text-black hover:bg-emerald-400">
                <Link href="/players">Explore Players</Link>
              </Button>
              <Button asChild variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10">
                <Link href="/tournaments">View Tournaments</Link>
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
