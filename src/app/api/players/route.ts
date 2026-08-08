import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { listPlayers } from "@/services/player.service";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const queryEdition = url.searchParams.get("edition")?.toLowerCase();
  const search = url.searchParams.get("search")?.trim();
  const pageParam = Number(url.searchParams.get("page") ?? "1");
  const limitParam = Number(url.searchParams.get("limit") ?? "120");
  const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;
  const limit = Number.isInteger(limitParam)
    ? Math.max(1, Math.min(limitParam, 200))
    : 120;

  const db = await getDb();
  const result = await listPlayers(db, {
    page,
    limit,
    search,
    edition: queryEdition,
  });

  return NextResponse.json(result);
}
