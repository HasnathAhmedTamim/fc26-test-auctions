import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/roles";
import {
  getActivePlayerEdition,
  listAvailablePlayerEditions,
  setActivePlayerEdition,
} from "@/lib/player-edition";

export async function GET() {
  const db = await getDb();
  const activeEdition = await getActivePlayerEdition(db);
  const editions = await listAvailablePlayerEditions(db);

  // Expose both active and available editions for admin/client selector UIs.
  return NextResponse.json({ activeEdition, editions });
}

export async function POST(req: Request) {
  const access = await requireAdmin();
  if (!access.ok) return access.response;

  const body = await req.json();
  const edition = String(body?.edition ?? "").trim().toLowerCase();
  if (!edition) {
    return NextResponse.json({ error: "Edition is required" }, { status: 400 });
  }

  const db = await getDb();
  const exists = await db.collection("players").countDocuments({ edition }, { limit: 1 });
  if (!exists) {
    return NextResponse.json({ error: `No players found for edition '${edition}'` }, { status: 404 });
  }

  // Persist the switch only when the target edition has data.
  await setActivePlayerEdition(db, edition);
  return NextResponse.json({ message: "Active player edition updated", activeEdition: edition });
}
