"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", match: (path: string) => path === "/dashboard" },
  { href: "/dashboard/lineup", label: "Lineup", match: (path: string) => path.startsWith("/dashboard/lineup") },
  {
    href: "/dashboard/achievements",
    label: "Achievements",
    match: (path: string) => path.startsWith("/dashboard/achievements"),
  },
  {
    href: "/dashboard/profile",
    label: "Profile",
    match: (path: string) => path.startsWith("/dashboard/profile"),
  },
  { href: "/players", label: "Players", match: (path: string) => path.startsWith("/players") },
  { href: "/tournaments", label: "Tournaments", match: (path: string) => path.startsWith("/tournaments") },
];

function linkClass(active: boolean, compact = false) {
  if (compact) {
    return active
      ? "shrink-0 rounded-full border border-emerald-400/50 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-300"
      : "shrink-0 rounded-full border border-white/15 px-3 py-1.5 text-xs text-slate-200 hover:border-emerald-400/40 hover:text-emerald-300";
  }

  return active
    ? "block rounded-xl bg-emerald-500/15 px-4 py-3 font-semibold text-emerald-300"
    : "block rounded-xl px-4 py-3 text-slate-200 hover:bg-white/5";
}

export function DashboardNav({ compact = false }: { compact?: boolean }) {
  const pathname = usePathname() ?? "";

  return (
    <nav className={compact ? "flex gap-2 overflow-x-auto pb-1" : "space-y-1"}>
      {NAV_ITEMS.map((item) => {
        const active = item.match(pathname);
        return (
          <Link key={item.href} href={item.href} className={linkClass(active, compact)}>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
