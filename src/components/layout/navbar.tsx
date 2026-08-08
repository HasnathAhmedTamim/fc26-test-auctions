"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Menu } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { LiveAuctionBadge, LiveAuctionSheetLink } from "@/components/layout/live-auction-badge";
import { Logo } from "@/components/common/logo";
import { showConfirmAlert } from "@/lib/alerts";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();

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
    return pathname?.startsWith(href)
      ? "text-emerald-300"
      : "text-slate-200 hover:text-emerald-400";
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/75 backdrop-blur-xl">
      <Container className="flex min-h-16 items-center justify-between gap-3 py-2">
        <Logo compact={false} />

        <nav className="hidden items-center gap-6 md:flex" aria-label="Main navigation">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm ${navLinkClass(link.href)}`}
              aria-current={pathname?.startsWith(link.href) ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LiveAuctionBadge />
          <Sheet>
            <SheetTrigger
              render={
                <Button
                  variant="outline"
                  size="icon"
                  className="border-white/20 bg-transparent text-white hover:bg-white/10 md:hidden"
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
              <nav className="flex flex-col gap-2 px-4" aria-label="Mobile navigation">
                {navLinks.map((link) => (
                  <Link
                    key={`sheet-${link.href}`}
                    href={link.href}
                    aria-current={pathname?.startsWith(link.href) ? "page" : undefined}
                    className={`rounded-xl px-4 py-3 text-sm ${
                      pathname?.startsWith(link.href)
                        ? "bg-emerald-500/15 font-semibold text-emerald-300"
                        : "text-slate-200 hover:bg-white/5"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                {session?.user ? (
                  <LiveAuctionSheetLink />
                ) : null}
              </nav>
              <div className="mt-auto border-t border-white/10 p-4">
                {session?.user ? (
                  <div className="space-y-3">
                    <p className="text-sm text-slate-400">Signed in as {session.user.name}</p>
                    <Button
                      onClick={handleLogout}
                      variant="outline"
                      className="w-full border-white/20 bg-transparent text-white hover:bg-white/10"
                    >
                      Logout
                    </Button>
                  </div>
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

          {session?.user ? (
            <>
              <span className="hidden max-w-[140px] truncate text-sm text-slate-300 md:inline lg:max-w-none">
                {session.user.name}
              </span>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="hidden border-white/20 bg-transparent text-white hover:bg-white/10 md:inline-flex"
              >
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button
                asChild
                variant="outline"
                className="hidden border-white/20 bg-transparent text-white hover:bg-white/10 sm:inline-flex"
              >
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild className="hidden bg-emerald-500 text-black hover:bg-emerald-400 sm:inline-flex">
                <Link href="/register">Register</Link>
              </Button>
            </>
          )}
        </div>
      </Container>
    </header>
  );
}
