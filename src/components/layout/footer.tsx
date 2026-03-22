import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Logo } from "@/components/common/logo";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black/20 py-10">
      <Container className="grid gap-8 md:grid-cols-3">
        <div>
          <Logo />
          <p className="mt-3 max-w-sm text-sm text-slate-400">
            Real-time transfer-night experience for leagues that want speed, transparency, and drama.
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-300">Explore</p>
          <div className="mt-3 flex flex-col gap-2 text-sm text-slate-400">
            <Link href="/players" className="hover:text-emerald-300">Players</Link>
            <Link href="/tournaments" className="hover:text-emerald-300">Tournaments</Link>
            <Link href="/dashboard" className="hover:text-emerald-300">Dashboard</Link>
          </div>
        </div>

        <div className="text-sm text-slate-400 md:text-right">
          <p>Built for FC26 custom leagues.</p>
          <p className="mt-2">© 2026 FC26 Auction</p>
        </div>
      </Container>
    </footer>
  );
}