import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { auth } from "@/auth";
import { getDb } from "@/lib/mongodb";

// Some achievements may still reference ObjectId-form userId values.
function toObjectId(value: string) {
  try {
    return new ObjectId(value);
  } catch {
    return null;
  }
}

function buildUserIdQuery(userId: string) {
  const objectId = toObjectId(userId);
  if (!objectId) {
    return { userId };
  }

  // Support both legacy ObjectId and string userId representations.
  return {
    $or: [
      { userId },
      { userId: objectId },
    ],
  };
}

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const achievements = await db.collection("userAchievements")
    .find(buildUserIdQuery(session.user.id))
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
