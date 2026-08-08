"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAdminPanelContext } from "@/components/features/admin/admin-panel-context";

export function AdminSetupGuide() {
  const ctx = useAdminPanelContext();

  const managerCount = ctx.managerUsers.length;
  const hasRoom = ctx.rooms.length > 0;
  const hasManagers = managerCount > 0;
  const hasPlayers = ctx.players.length > 0;

  const steps = [
    {
      id: "room",
      done: hasRoom,
      title: "Create an auction room",
      detail: "Set budget and squad limit for your transfer night.",
      actionLabel: "Go to Rooms",
      onAction: () => ctx.setActiveAdminView("rooms"),
    },
    {
      id: "players",
      done: hasPlayers,
      title: "Load the player pool",
      detail: "Import players and choose the active edition in settings.",
      actionLabel: "Open Settings",
      href: "/admin/settings",
    },
    {
      id: "managers",
      done: hasManagers,
      title: "Add manager accounts",
      detail: "Create accounts for each league manager.",
      actionLabel: "Go to Users",
      onAction: () => ctx.setActiveAdminView("users"),
    },
    {
      id: "access",
      done: hasRoom && hasManagers,
      title: "Grant room access",
      detail: "Allow managers to join the auction room from their dashboard.",
      actionLabel: "Go to Rooms",
      onAction: () => ctx.setActiveAdminView("rooms"),
    },
  ];

  const completedCount = steps.filter((step) => step.done).length;
  if (completedCount === steps.length) return null;

  return (
    <div className="mt-6 rounded-3xl border border-cyan-400/25 bg-cyan-500/10 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">First-time setup</p>
          <h2 className="mt-1 text-lg font-black text-white">Get your auction night ready</h2>
          <p className="mt-1 text-sm text-cyan-100/90">
            {completedCount} of {steps.length} steps complete
          </p>
        </div>
        <div className="h-2 w-40 overflow-hidden rounded-full bg-slate-900">
          <div
            className="h-full rounded-full bg-cyan-400 transition-all"
            style={{ width: `${(completedCount / steps.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {steps.map((step) => (
          <div
            key={step.id}
            className={`rounded-2xl border p-4 ${
              step.done
                ? "border-emerald-400/30 bg-emerald-500/10"
                : "border-white/10 bg-black/20"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className={`text-sm font-semibold ${step.done ? "text-emerald-300" : "text-white"}`}>
                  {step.done ? "✓ " : ""}
                  {step.title}
                </p>
                <p className="mt-1 text-xs text-slate-400">{step.detail}</p>
              </div>
            </div>
            {!step.done ? (
              <div className="mt-3">
                {step.href ? (
                  <Link href={step.href}>
                    <Button size="sm" variant="outline" className="border-cyan-500/30 text-cyan-200 hover:bg-cyan-500/10">
                      {step.actionLabel}
                    </Button>
                  </Link>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="border-cyan-500/30 text-cyan-200 hover:bg-cyan-500/10"
                    onClick={step.onAction}
                  >
                    {step.actionLabel}
                  </Button>
                )}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
