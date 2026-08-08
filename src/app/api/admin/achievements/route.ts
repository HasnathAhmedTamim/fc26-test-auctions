import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/roles";
import { getDb } from "@/lib/mongodb";
import { awardBadgeSchema } from "@/lib/validations";
import {
  awardAchievement,
  listAchievements,
  revokeAchievement,
} from "@/services/achievement.service";

export async function GET(request: NextRequest) {
  const access = await requireAdmin();
  if (!access.ok) return access.response;

  const userId = request.nextUrl.searchParams.get("userId")?.trim();
  const db = await getDb();
  const achievements = await listAchievements(db, userId);

  return NextResponse.json({ achievements });
}

export async function POST(request: NextRequest) {
  const access = await requireAdmin();
  if (!access.ok) return access.response;

  const body = await request.json();
  const parsed = awardBadgeSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid payload" },
      { status: 400 }
    );
  }

  const db = await getDb();
  const result = await awardAchievement(db, {
    ...parsed.data,
    awardedBy: access.session.user.id,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true, message: result.message });
}

export async function DELETE(request: NextRequest) {
  const access = await requireAdmin();
  if (!access.ok) return access.response;

  const body = await request.json();
  const achievementId = String(body?.achievementId ?? "").trim();

  if (!achievementId) {
    return NextResponse.json({ error: "achievementId is required" }, { status: 400 });
  }

  const db = await getDb();
  const result = await revokeAchievement(db, achievementId);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true, message: result.message });
}
