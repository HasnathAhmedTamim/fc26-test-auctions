"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Menu } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { LiveAuctionBadge, LiveAuctionSheetLink } from "@/components/layout/live-auction-badge";
import { Logo } from "@/components/common/logo";
import { ProfileMenu } from "@/components/layout/profile-menu";
import { showConfirmAlert } from "@/lib/alerts";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const PUBLIC_LINKS = [
  { href: "/", label: "Home" },
  { href: "/players", label: "Players" },
  { href: "/tournaments", label: "Tournaments" },
] as const;

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  const navLinks = session?.user
    ? [...PUBLIC_LINKS, { href: "/dashboard", label: "Dashboard" }]
    : [...PUBLIC_LINKS];

  async function handleLogout() {
    const confirmed = await showConfirmAlert(
      "Sign out now?",
      "You will need to sign in again to access your dashboard."
    );

    if (!confirmed) return;
    await signOut({ redirect: false, callbackUrl: "/" });
    router.push("/");
    router.refresh();
  }

  function navLinkClass(href: string) {
    const active = href === "/" ? pathname === "/" : pathname?.startsWith(href);
    return active ? "text-emerald-300" : "text-slate-200 hover:text-emerald-400";
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/75 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
      <Container className="flex min-h-14 items-center justify-between gap-2 py-2 sm:min-h-16 sm:gap-4">
        <Logo compact={false} className="min-w-0 shrink" />

        <nav className="hidden items-center gap-6 lg:flex" aria-label="Main navigation">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium ${navLinkClass(link.href)}`}
              aria-current={navLinkClass(link.href).includes("emerald-300") ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LiveAuctionBadge />
          <ProfileMenu />

          <Sheet>
            <SheetTrigger
              render={
                <Button
                  variant="outline"
                  size="icon"
                  className="border-white/20 bg-transparent text-white hover:bg-white/10 lg:hidden"
                  aria-label="Open navigation menu"
                />
              }
            >
              <Menu size={18} />
            </SheetTrigger>
            <SheetContent side="right" className="border-white/10 bg-slate-950 text-white">
              <SheetHeader>
                <SheetTitle className="text-white">Menu</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-4" aria-label="Mobile navigation">
                {navLinks.map((link) => (
                  <Link
                    key={`sheet-${link.href}`}
                    href={link.href}
                    className={`rounded-xl px-4 py-3 text-sm ${
                      navLinkClass(link.href).includes("emerald-300")
                        ? "bg-emerald-500/15 font-semibold text-emerald-300"
                        : "text-slate-200 hover:bg-white/5"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                {session?.user ? (
                  <>
                    <LiveAuctionSheetLink />
                    <Link
                      href="/players/compare"
                      className="rounded-xl px-4 py-3 text-sm text-slate-200 hover:bg-white/5"
                    >
                      Compare Players
                    </Link>
                    <Link
                      href="/dashboard/profile"
                      className="rounded-xl px-4 py-3 text-sm text-slate-200 hover:bg-white/5"
                    >
                      Profile
                    </Link>
                    {session.user.role === "admin" ? (
                      <Link
                        href="/admin"
                        className="rounded-xl px-4 py-3 text-sm text-slate-200 hover:bg-white/5"
                      >
                        Admin Panel
                      </Link>
                    ) : null}
                  </>
                ) : (
                  <Link href="/about" className="rounded-xl px-4 py-3 text-sm text-slate-200 hover:bg-white/5">
                    About
                  </Link>
                )}
              </nav>
              <div className="mt-auto border-t border-white/10 p-4">
                {session?.user ? (
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    className="w-full border-white/20 bg-transparent text-white hover:bg-white/10"
                  >
                    Logout
                  </Button>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Button asChild variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10">
                      <Link href="/login">Login</Link>
                    </Button>
                    <Button asChild className="bg-emerald-500 text-black hover:bg-emerald-400">
                      <Link href="/register">Register</Link>
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>

          {!session?.user ? (
            <>
              <Button
                asChild
                variant="outline"
                className="hidden border-white/20 bg-transparent text-white hover:bg-white/10 lg:inline-flex"
              >
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild className="hidden bg-emerald-500 text-black hover:bg-emerald-400 lg:inline-flex">
                <Link href="/register">Register</Link>
              </Button>
            </>
          ) : null}
        </div>
      </Container>
    </header>
  );
}
