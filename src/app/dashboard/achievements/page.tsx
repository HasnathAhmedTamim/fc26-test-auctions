import { AchievementsList } from "@/components/dashboard/achievements-list";

export default function DashboardAchievementsPage() {
  return (
    <div>
      <h1 className="text-3xl font-black">Achievements</h1>
      <p className="mt-2 text-slate-400">
        Tournament badges awarded by admins are listed here.
      </p>

      <div className="mt-8">
        <AchievementsList />
      </div>
    </div>
  );
}
