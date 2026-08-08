import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";

type HomeCtaBandProps = {
  isLoggedIn: boolean;
  role?: "admin" | "manager";
};

export function HomeCtaBand({ isLoggedIn, role }: HomeCtaBandProps) {
  return (
    <section className="relative pb-24 pt-6">
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
              desc: "Run FC24 today and switch to FC26 or custom pools instantly when your list is ready.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="panel-glass stagger-rise rounded-3xl p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]"
            >
              <h3 className="text-xl font-black tracking-tight">{item.title}</h3>
              <p className="mt-3 text-slate-300">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-3xl border border-emerald-400/20 bg-black/30 p-8 shadow-[0_20px_70px_rgba(2,6,23,0.5)] backdrop-blur-sm">
          <h2 className="text-2xl font-black">
            {isLoggedIn ? "Ready for your next matchday?" : "Start Your Next Auction Night"}
          </h2>
          <p className="mt-3 max-w-2xl text-slate-300">
            {isLoggedIn
              ? role === "admin"
                ? "Open the admin panel to run rooms, or jump into the manager dashboard to monitor squads."
                : "Head to your dashboard to join a room, track budget, and build your lineup after the auction."
              : "Register as a manager, get room access from your admin, then bid live and build your dream squad."}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {isLoggedIn ? (
              <>
                <Button asChild className="bg-emerald-500 text-black hover:bg-emerald-400">
                  <Link href="/dashboard">Go to Dashboard</Link>
                </Button>
                {role === "admin" ? (
                  <Button asChild variant="outline" className="border-amber-400/30 bg-transparent text-amber-200 hover:bg-amber-500/10">
                    <Link href="/admin">Admin Panel</Link>
                  </Button>
                ) : null}
                <Button asChild variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10">
                  <Link href="/players">Explore Players</Link>
                </Button>
              </>
            ) : (
              <>
                <Button asChild className="bg-emerald-500 text-black hover:bg-emerald-400">
                  <Link href="/register">Create Account</Link>
                </Button>
                <Button asChild variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10">
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10">
                  <Link href="/players">Browse Players</Link>
                </Button>
              </>
            )}
          </div>
        </div>

        {!isLoggedIn ? (
          <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">How it works</p>
            <ol className="mt-4 grid gap-3 md:grid-cols-4">
              {[
                "Register your manager account",
                "Admin grants auction room access",
                "Join the live room and bid on players",
                "Build lineup and follow tournaments",
              ].map((step, index) => (
                <li key={step} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-200">
                  <span className="font-black text-emerald-300">{index + 1}.</span> {step}
                </li>
              ))}
            </ol>
          </div>
        ) : null}
      </Container>
    </section>
  );
}
