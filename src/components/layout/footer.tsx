"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Container } from "@/components/layout/container";
import { Logo } from "@/components/common/logo";

export function Footer() {
  const { data: session } = useSession();
  const isLoggedIn = Boolean(session?.user);
  const isAdmin = session?.user?.role === "admin";

  return (
    <footer className="border-t border-white/10 bg-black/20 py-10">
      <Container className="grid gap-8 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-3 max-w-md text-sm text-slate-400">
            Real-time transfer-night experience for custom FC leagues — live bidding, squad budgets,
            lineups, and tournament tracking in one place.
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-300">Explore</p>
          <div className="mt-3 flex flex-col gap-2 text-sm text-slate-400">
            <Link href="/" className="hover:text-emerald-300">Home</Link>
            <Link href="/players" className="hover:text-emerald-300">Players</Link>
            <Link href="/players/compare" className="hover:text-emerald-300">Compare Players</Link>
            <Link href="/tournaments" className="hover:text-emerald-300">Tournaments</Link>
            <Link href="/about" className="hover:text-emerald-300">About</Link>
            <Link href="/contact" className="hover:text-emerald-300">Contact</Link>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-300">Account</p>
          <div className="mt-3 flex flex-col gap-2 text-sm text-slate-400">
            {isLoggedIn ? (
              <>
                <Link href="/dashboard" className="hover:text-emerald-300">Dashboard</Link>
                <Link href="/dashboard/profile" className="hover:text-emerald-300">Profile</Link>
                <Link href="/dashboard/lineup" className="hover:text-emerald-300">Lineup Builder</Link>
                {isAdmin ? <Link href="/admin" className="hover:text-emerald-300">Admin Panel</Link> : null}
              </>
            ) : (
              <>
                <Link href="/login" className="hover:text-emerald-300">Login</Link>
                <Link href="/register" className="hover:text-emerald-300">Register</Link>
              </>
            )}
            <Link href="/privacy" className="hover:text-emerald-300">Privacy</Link>
            <Link href="/terms" className="hover:text-emerald-300">Terms</Link>
          </div>
        </div>
      </Container>
      <Container className="mt-8 border-t border-white/10 pt-6 text-xs text-slate-500">
        © 2026 FC26 Auction
      </Container>
    </footer>
  );
}
