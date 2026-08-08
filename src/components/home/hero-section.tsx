import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";

type HeroSectionProps = {
  isLoggedIn?: boolean;
  role?: "admin" | "manager";
};

export function HeroSection({ isLoggedIn = false, role }: HeroSectionProps) {
  return (
    <section className="relative flex min-h-[60vh] items-center py-12 sm:min-h-[65vh] sm:py-16 lg:py-20">
      <Container className="relative z-10 grid gap-10 lg:grid-cols-2 lg:items-center">
        <div className="stagger-rise">
          <p className="mb-4 inline-block rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-1 text-sm text-emerald-300">
            FC26 Tournament Auction Platform
          </p>
          <h1 className="text-3xl font-black leading-tight sm:text-4xl md:text-5xl lg:text-6xl">
            Build your squad. Bid live. Win the league.
          </h1>
          <p className="mt-4 max-w-2xl text-base text-slate-300 sm:mt-6 sm:text-lg">
            Manage tournaments, auction top FC26 players, track budgets, and dominate your custom league with a clean modern platform.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            {isLoggedIn ? (
              <>
                <Button asChild className="bg-emerald-500 text-black hover:bg-emerald-400">
                  <Link href="/dashboard">Open Dashboard</Link>
                </Button>
                {role === "admin" ? (
                  <Button asChild variant="outline" className="border-amber-400/30 bg-transparent text-amber-200 hover:bg-amber-500/10">
                    <Link href="/admin">Admin Panel</Link>
                  </Button>
                ) : (
                  <Button asChild variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10">
                    <Link href="/tournaments">View Tournaments</Link>
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button asChild className="bg-emerald-500 text-black hover:bg-emerald-400">
                  <Link href="/register">Get Started</Link>
                </Button>
                <Button asChild variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10">
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10">
                  <Link href="/players">Explore Players</Link>
                </Button>
              </>
            )}
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
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <div className="rounded-2xl bg-slate-900 p-3 text-center sm:p-4">
                <p className="text-[10px] text-slate-400 sm:text-sm">Budget</p>
                <p className="mt-1 text-lg font-bold sm:text-xl">2000</p>
              </div>
              <div className="rounded-2xl bg-slate-900 p-3 text-center sm:p-4">
                <p className="text-[10px] text-slate-400 sm:text-sm">Managers</p>
                <p className="mt-1 text-lg font-bold sm:text-xl">10</p>
              </div>
              <div className="rounded-2xl bg-slate-900 p-3 text-center sm:p-4">
                <p className="text-[10px] text-slate-400 sm:text-sm">Squad Limit</p>
                <p className="mt-1 text-lg font-bold sm:text-xl">24</p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
