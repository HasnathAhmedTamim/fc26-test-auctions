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
            Real-time transfer-night experience for custom FC leagues — live bidding, squad
            budgets, lineups, and tournament tracking in one place.
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-300">Explore</p>
          <div className="mt-3 flex flex-col gap-2 text-sm text-slate-400">
            <Link href="/players" className="hover:text-emerald-300">
              Players
            </Link>
            <Link href="/players/compare" className="hover:text-emerald-300">
              Compare Players
            </Link>
            <Link href="/tournaments" className="hover:text-emerald-300">
              Tournaments
            </Link>
            {isLoggedIn ? (
              <>
                <Link href="/dashboard" className="hover:text-emerald-300">
                  Dashboard
                </Link>
                <Link href="/dashboard/lineup" className="hover:text-emerald-300">
                  Lineup Builder
                </Link>
                {isAdmin ? (
                  <Link href="/admin" className="hover:text-emerald-300">
                    Admin Panel
                  </Link>
                ) : null}
              </>
            ) : (
              <>
                <Link href="/login" className="hover:text-emerald-300">
                  Login
                </Link>
                <Link href="/register" className="hover:text-emerald-300">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="text-sm text-slate-400 md:text-right">
          <p className="font-semibold text-slate-300">FC26 Auction</p>
          <p className="mt-2">Built for custom league auction nights.</p>
          <p className="mt-4 text-xs text-slate-500">© 2026 FC26 Auction</p>
        </div>
      </Container>
    </footer>
  );
}
