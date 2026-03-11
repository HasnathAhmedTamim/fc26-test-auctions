import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-[calc(100vh-64px)] lg:grid-cols-[260px_1fr]">
      <aside className="border-r border-white/10 bg-slate-900 p-6">
        <h2 className="text-xl font-black text-emerald-400">Manager Panel</h2>
        <nav className="mt-8 space-y-3">
          <Link href="/dashboard" className="block rounded-xl px-4 py-3 hover:bg-white/5">
            Overview
          </Link>
          <Link href="/players" className="block rounded-xl px-4 py-3 hover:bg-white/5">
            Players
          </Link>
          <Link href="/tournaments" className="block rounded-xl px-4 py-3 hover:bg-white/5">
            Tournaments
          </Link>
        </nav>
      </aside>

      <section className="p-6">{children}</section>
    </div>
  );
}