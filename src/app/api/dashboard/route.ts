import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/lib/mongodb";
import { getDashboardSummary } from "@/services/dashboard.service";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const summary = await getDashboardSummary(db, session.user.id);

  return NextResponse.json(summary);
}
