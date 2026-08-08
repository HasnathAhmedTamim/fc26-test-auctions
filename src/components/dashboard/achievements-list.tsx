"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { TournamentAchievement } from "@/types/tournament";

const BADGE_STYLES: Record<string, string> = {
  Champion: "bg-amber-400 text-black",
  RunnerUp: "bg-slate-300 text-slate-900",
  SemiFinalist: "bg-emerald-400 text-black",
};

export function AchievementsList() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [achievements, setAchievements] = useState<TournamentAchievement[]>([]);

  const loadAchievements = useCallback(async () => {
    setLoading(true);
    setError("");

    const res = await fetch("/api/dashboard/achievements", { cache: "no-store" });
    const data = (await res.json()) as {
      error?: string;
      achievements?: TournamentAchievement[];
    };

    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Failed to load achievements");
      return;
    }

    setAchievements(data.achievements ?? []);
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadAchievements();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [loadAchievements]);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5">
        <p className="text-red-300">{error}</p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="mt-3 border-white/20 bg-transparent text-white hover:bg-white/10"
          onClick={() => void loadAchievements()}
        >
          Retry
        </Button>
      </div>
    );
  }

  if (achievements.length === 0) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
        <p className="text-4xl">🏆</p>
        <h3 className="mt-4 text-xl font-black text-white">No badges yet</h3>
        <p className="mt-2 text-sm text-slate-400">
          Tournament badges are awarded by admins after competitions finish. Check back after your
          league&apos;s next tournament.
        </p>
        <Link href="/tournaments" className="mt-5 inline-block">
          <Button size="sm" variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10">
            View Tournaments
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {achievements.map((achievement) => (
        <div key={achievement.id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-bold text-white">{achievement.tournamentName}</h3>
              <p className="mt-1 text-xs text-slate-500">
                Awarded {new Date(achievement.awardedAt).toLocaleDateString()}
              </p>
            </div>
            <Badge className={BADGE_STYLES[achievement.badgeType] ?? "bg-slate-500 text-white"}>
              {achievement.badgeType}
            </Badge>
          </div>
          <Link
            href={`/tournaments/${achievement.tournamentId}`}
            className="mt-3 inline-block text-sm text-emerald-300 hover:text-emerald-200"
          >
            View tournament →
          </Link>
        </div>
      ))}
    </div>
  );
}
