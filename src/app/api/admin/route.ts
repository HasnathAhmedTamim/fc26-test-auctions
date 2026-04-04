import { requireAdmin } from "@/lib/roles";
import { NextResponse } from "next/server";

export async function GET() {
  const access = await requireAdmin();
  if (!access.ok) return access.response;

  // Echo authenticated admin identity for dashboard bootstrap checks.
  return NextResponse.json({
    message: "Welcome admin",
    user: access.session.user,
  });
}