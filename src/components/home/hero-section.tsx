import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden py-24 sm:py-32">
      <Container className="relative z-10 grid gap-10 lg:grid-cols-2 lg:items-center">
        <div className="stagger-rise">
          <p className="mb-4 inline-block rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-1 text-sm text-emerald-300">
            FC26 Tournament Auction Platform
          </p>
          <h1 className="text-4xl font-black leading-tight sm:text-6xl">
            Build your squad. Bid live. Win the league.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-slate-300">
            Manage tournaments, auction top FC26 players, track budgets, and dominate your custom league with a clean modern platform.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Button asChild className="bg-emerald-500 text-black hover:bg-emerald-400">
              <Link href="/players">Explore Players</Link>
            </Button>
            <Button asChild variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10">
              <Link href="/tournaments">View Tournaments</Link>
            </Button>
          </div>
        </div>

        <div className="panel-glass stagger-rise rounded-3xl p-6 shadow-2xl" style={{ animationDelay: "120ms" }}>
          <div className="space-y-4">
            <div className="rounded-2xl bg-slate-900 p-5">
              <p className="text-sm text-slate-400">Live Auction</p>
              <div className="mt-2 flex items-center justify-between">
                <h3 className="text-xl font-bold">Kylian Mbappe</h3>
                <span className="rounded-full bg-emerald-500 px-3 py-1 text-sm font-semibold text-black">
                  420 Coins
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-2xl bg-slate-900 p-4 text-center">
                <p className="text-sm text-slate-400">Budget</p>
                <p className="mt-1 text-xl font-bold">2000</p>
              </div>
              <div className="rounded-2xl bg-slate-900 p-4 text-center">
                <p className="text-sm text-slate-400">Managers</p>
                <p className="mt-1 text-xl font-bold">10</p>
              </div>
              <div className="rounded-2xl bg-slate-900 p-4 text-center">
                <p className="text-sm text-slate-400">Squad Limit</p>
                <p className="mt-1 text-xl font-bold">24</p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}