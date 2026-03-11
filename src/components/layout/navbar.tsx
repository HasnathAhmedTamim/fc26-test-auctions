import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur">
      <Container className="flex h-16 items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-wide text-emerald-400">
          FC26 Auction
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link href="/players" className="text-sm text-slate-200 hover:text-emerald-400">
            Players
          </Link>
          <Link href="/tournaments" className="text-sm text-slate-200 hover:text-emerald-400">
            Tournaments
          </Link>
          <Link href="/dashboard" className="text-sm text-slate-200 hover:text-emerald-400">
            Dashboard
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10">
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild className="bg-emerald-500 text-black hover:bg-emerald-400">
            <Link href="/register">Register</Link>
          </Button>
        </div>
      </Container>
    </header>
  );
}