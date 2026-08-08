"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  lineup: "Lineup",
  achievements: "Achievements",
  players: "Players",
  compare: "Compare",
  about: "About",
  contact: "Contact",
  privacy: "Privacy",
  terms: "Terms",
  profile: "Profile",
  tournaments: "Tournaments",
  auction: "Auction",
  admin: "Admin",
  settings: "Settings",
};

export function Breadcrumbs() {
  const pathname = usePathname() ?? "/";
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  const crumbs = segments.map((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join("/")}`;
    const label = SEGMENT_LABELS[segment] ?? segment;
    const isLast = index === segments.length - 1;

    return { href, label, isLast };
  });

  return (
    <nav aria-label="Breadcrumb" className="mb-6 text-sm text-slate-400">
      <ol className="flex flex-wrap items-center gap-2">
        <li>
          <Link href="/" className="hover:text-emerald-300">
            Home
          </Link>
        </li>
        {crumbs.map((crumb) => (
          <li key={crumb.href} className="flex items-center gap-2">
            <span aria-hidden="true">/</span>
            {crumb.isLast ? (
              <span className="font-medium text-slate-200">{crumb.label}</span>
            ) : (
              <Link href={crumb.href} className="hover:text-emerald-300">
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
