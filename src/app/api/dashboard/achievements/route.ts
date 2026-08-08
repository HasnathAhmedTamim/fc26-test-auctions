import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/lib/mongodb";
import { listUserAchievements } from "@/services/achievement.service";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const achievements = await listUserAchievements(db, session.user.id);

  return NextResponse.json({ achievements });
}
