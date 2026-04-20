"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import type { TournamentAchievement } from "@/types/tournament";

export function AchievementsList() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [achievements, setAchievements] = useState<TournamentAchievement[]>([]);

  // Shared loader for the initial fetch and any future refresh action.
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
    return <p className="text-slate-400">Loading achievements...</p>;
  }

  if (error) {
    return <p className="text-red-400">{error}</p>;
  }

  if (achievements.length === 0) {
    return <p className="text-slate-400">No tournament badges yet.</p>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {achievements.map((achievement) => (
        <div key={achievement.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-bold text-white">{achievement.tournamentName}</h3>
            <Badge className="bg-amber-400 text-black">{achievement.badgeType}</Badge>
          </div>
          <p className="mt-2 text-sm text-slate-400">Tournament ID: {achievement.tournamentId}</p>
          <p className="mt-1 text-xs text-slate-500">
            Awarded on {new Date(achievement.awardedAt).toLocaleDateString()}
          </p>
        </div>
      ))}
    </div>
  );
}
