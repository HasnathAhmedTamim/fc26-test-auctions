"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const { data: session } = useSession();

  const navLinks = [
    { href: "/players", label: "Players" },
    { href: "/tournaments", label: "Tournaments" },
  ];

  if (session?.user) {
    navLinks.push({ href: "/dashboard", label: "Dashboard" });
  }

  if (session?.user?.role === "admin") {
    navLinks.push({ href: "/admin", label: "Admin" });
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur">
      <Container className="flex min-h-16 flex-wrap items-center justify-between gap-y-3 py-2">
        <Link
          href="/"
          className="text-xl font-bold tracking-wide text-emerald-400"
        >
          FC26 Auction
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-slate-200 hover:text-emerald-400"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {session?.user ? (
            <>
              <span className="hidden text-sm text-slate-300 md:inline">
                {session.user.name} ({session.user.role})
              </span>
              <Button
                onClick={() => signOut({ callbackUrl: "/" })}
                variant="outline"
                className="border-white/20 bg-transparent text-white hover:bg-white/10"
              >
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button
                asChild
                variant="outline"
                className="border-white/20 bg-transparent text-white hover:bg-white/10"
              >
                <Link href="/login">Login</Link>
              </Button>
              <Button
                asChild
                className="bg-emerald-500 text-black hover:bg-emerald-400"
              >
                <Link href="/register">Register</Link>
              </Button>
            </>
          )}
        </div>

        <nav className="flex w-full items-center gap-4 overflow-x-auto pb-1 md:hidden">
          {navLinks.map((link) => (
            <Link
              key={`mobile-${link.href}`}
              href={link.href}
              className="shrink-0 rounded-full border border-white/15 px-3 py-1 text-xs text-slate-200 hover:border-emerald-400/40 hover:text-emerald-300"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </Container>
    </header>
  );
}