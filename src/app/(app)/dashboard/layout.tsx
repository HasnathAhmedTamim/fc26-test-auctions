import type { Metadata } from "next";
import { DashboardNav } from "@/components/layout/dashboard-nav";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";

export const metadata: Metadata = {
  title: "Dashboard | FC26 Auction",
  description: "Track budget, room access, and your auction squads.",
};

export default function DashboardLayout({  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[calc(100vh-64px)] lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="border-b border-white/10 bg-slate-900 p-4 lg:border-b-0 lg:border-r lg:p-6">
        <h2 className="text-xl font-black text-emerald-400">Manager Panel</h2>
        <div className="mt-4 lg:mt-8">
          <div className="lg:hidden">
            <DashboardNav compact />
          </div>
          <div className="hidden lg:block">
            <DashboardNav />
          </div>
        </div>
      </aside>

      <section className="p-4 sm:p-6">
        <Breadcrumbs />
        {children}
      </section>
    </div>
  );
}
