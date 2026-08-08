"use client";

import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { AdminPanelProvider, useAdminPanelContext } from "@/components/features/admin/admin-panel-context";
import { BadgesTab } from "@/components/features/admin/badges-tab";
import { RoomsTab } from "@/components/features/admin/rooms-tab";
import { RosterTab } from "@/components/features/admin/roster-tab";
import { TournamentsTab } from "@/components/features/admin/tournaments-tab";
import { UsersTab } from "@/components/features/admin/users-tab";

function AdminPanelShell() {
  const { activeAdminView, setActiveAdminView } = useAdminPanelContext();

  return (
    <Container className="py-10">
      <h1 className="text-3xl font-black">Admin Panel</h1>
      <p className="mt-2 text-slate-400">
        Create rooms, control live auctions, and manually fix any squad ownership issue.
      </p>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Control Center</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={activeAdminView === "rooms" ? "default" : "outline"}
            className={activeAdminView === "rooms" ? "bg-emerald-500 text-black hover:bg-emerald-400" : "border-white/20 bg-transparent text-white hover:bg-white/10"}
            onClick={() => setActiveAdminView("rooms")}
          >
            Rooms
          </Button>
          <Button
            type="button"
            size="sm"
            variant={activeAdminView === "roster" ? "default" : "outline"}
            className={activeAdminView === "roster" ? "bg-blue-500 text-white hover:bg-blue-400" : "border-white/20 bg-transparent text-white hover:bg-white/10"}
            onClick={() => setActiveAdminView("roster")}
          >
            Roster
          </Button>
          <Button
            type="button"
            size="sm"
            variant={activeAdminView === "tournaments" ? "default" : "outline"}
            className={activeAdminView === "tournaments" ? "bg-cyan-400 text-black hover:bg-cyan-300" : "border-white/20 bg-transparent text-white hover:bg-white/10"}
            onClick={() => setActiveAdminView("tournaments")}
          >
            Tournaments
          </Button>
          <Button
            type="button"
            size="sm"
            variant={activeAdminView === "badges" ? "default" : "outline"}
            className={activeAdminView === "badges" ? "bg-amber-500 text-black hover:bg-amber-400" : "border-white/20 bg-transparent text-white hover:bg-white/10"}
            onClick={() => setActiveAdminView("badges")}
          >
            Badges
          </Button>
          <Button
            type="button"
            size="sm"
            variant={activeAdminView === "users" ? "default" : "outline"}
            className={activeAdminView === "users" ? "bg-violet-500 text-white hover:bg-violet-400" : "border-white/20 bg-transparent text-white hover:bg-white/10"}
            onClick={() => setActiveAdminView("users")}
          >
            Users
          </Button>
          <Link href="/admin/settings">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-emerald-500/30 bg-transparent text-emerald-300 hover:bg-emerald-500/10"
            >
              Settings
            </Button>
          </Link>
        </div>
        <p className="mt-3 text-xs text-slate-500">Showing one section at a time to reduce admin overload.</p>
      </div>

      {activeAdminView === "rooms" ? <RoomsTab /> : null}
      {activeAdminView === "roster" ? <RosterTab /> : null}
      {activeAdminView === "tournaments" ? <TournamentsTab /> : null}
      {activeAdminView === "badges" ? <BadgesTab /> : null}
      {activeAdminView === "users" ? <UsersTab /> : null}
    </Container>
  );
}

export function AdminPanel() {
  return (
    <AdminPanelProvider>
      <AdminPanelShell />
    </AdminPanelProvider>
  );
}
