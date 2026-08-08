"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAdminPanelContext } from "./admin-panel-context";
import { STATUS_STYLES } from "./constants";

export function BadgesTab() {
  const ctx = useAdminPanelContext();
  return (
<div className="mt-10 grid gap-8 xl:grid-cols-[420px_1fr]">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-bold">Tournament Badges</h2>
          <p className="mt-1 text-sm text-slate-400">
            Award achievement badges to ctx.managers who win tournaments.
          </p>

          <div className="mt-5 space-y-4">
            <div>
              <label className="mb-1 block text-sm text-slate-300">Manager</label>
              <select
                aria-label="Select manager for badge award"
                value={ctx.achievementUserId}
                onChange={(event) => ctx.setAchievementUserId(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-2 text-sm outline-none"
              >
                <option value="">All ctx.managers (history)</option>
                {ctx.managerUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-300">Tournament</label>
              <select
                aria-label="Select tournament for badge award"
                value={ctx.achievementTournamentId}
                onChange={(event) => ctx.handleTournamentChange(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-2 text-sm outline-none"
              >
                <option value="">Select a managed tournament...</option>
                {ctx.achievementTournamentOptions.map((tournament) => (
                  <option key={tournament.id} value={tournament.id}>
                    {tournament.name}
                  </option>
                ))}
              </select>
              {ctx.achievementTournamentOptions.length === 0 ? (
                <p className="mt-1 text-xs text-amber-300">Create a tournament first to award badges.</p>
              ) : null}
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-300">Tournament Name</label>
              <input
                aria-label="Tournament name for badge award"
                value={ctx.achievementTournamentName}
                onChange={(event) => ctx.setAchievementTournamentName(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-2 text-sm outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-300">Badge Type</label>
              <select
                aria-label="Select badge type"
                value={ctx.achievementBadgeType}
                onChange={(event) => ctx.setAchievementBadgeType(event.target.value as "Champion" | "RunnerUp" | "SemiFinalist")}
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-2 text-sm outline-none"
              >
                <option value="Champion">Champion</option>
                <option value="RunnerUp">Runner-up</option>
                <option value="SemiFinalist">Semi-finalist</option>
              </select>
            </div>

            <Button
              type="button"
              onClick={ctx.awardBadgeToUser}
              disabled={ctx.awardingBadge || !ctx.achievementUserId || !ctx.achievementTournamentId}
              className="w-full bg-amber-500 text-black hover:bg-amber-400"
            >
              {ctx.awardingBadge ? "Awarding..." : "Award Badge"}
            </Button>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">Awarded Badges</h2>
              <p className="mt-1 text-sm text-slate-400">
                Track and revoke badges given to the selected manager.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-white/20 bg-transparent text-white hover:bg-white/10"
              onClick={() => ctx.fetchAchievements(ctx.achievementUserId)}
              disabled={ctx.achievementsLoading}
            >
              {ctx.achievementsLoading ? "Refreshing..." : "Refresh"}
            </Button>
          </div>

          {!ctx.achievementUserId ? (
            <p className="mt-4 text-slate-400">Showing badge history for all ctx.managers.</p>
          ) : null}

          {ctx.achievementsLoading ? (
            <p className="mt-4 text-slate-400">Loading badges...</p>
          ) : ctx.achievements.length === 0 ? (
            <p className="mt-4 text-slate-400">
              {ctx.achievementUserId
                ? "No badges awarded for this manager yet."
                : "No badges awarded yet."}
            </p>
          ) : (
            <div className="mt-5 space-y-3">
              {ctx.achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3"
                >
                  <div>
                    <p className="font-semibold text-white">{achievement.tournamentName}</p>
                    <p className="text-xs text-slate-400">
                      {achievement.badgeType} • {new Date(achievement.awardedAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-slate-500">
                      Awarded to: {achievement.userName}
                      {achievement.userEmail ? ` (${achievement.userEmail})` : ""}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="border-red-500/30 bg-transparent text-red-300 hover:bg-red-500/10"
                    onClick={() => ctx.revokeBadge(achievement.id)}
                    disabled={ctx.revokingBadgeId === achievement.id}
                  >
                    {ctx.revokingBadgeId === achievement.id ? "Revoking..." : "Revoke"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
  );
}
