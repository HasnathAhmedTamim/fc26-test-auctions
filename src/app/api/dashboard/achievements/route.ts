import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/lib/mongodb";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const achievements = await db.collection("userAchievements")
    .find({ userId: session.user.id })
    .sort({ awardedAt: -1, createdAt: -1 })
    .toArray();

  return NextResponse.json({
    achievements: achievements.map((item) => ({
      id: String(item._id),
      userId: String(item.userId ?? ""),
      tournamentId: String(item.tournamentId ?? ""),
      tournamentName: String(item.tournamentName ?? "Unknown Tournament"),
      badgeType: String(item.badgeType ?? "Champion"),
      awardedBy: String(item.awardedBy ?? ""),
      awardedAt: String(item.awardedAt ?? ""),
    })),
  });
}
