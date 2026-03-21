import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getActivePlayerEdition } from "@/lib/player-edition";

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
  const skip = (page - 1) * limit;

  const db = await getDb();
  const activeEdition = await getActivePlayerEdition(db);
  const edition = queryEdition || activeEdition;

  const filter: Record<string, unknown> = { edition };
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { club: { $regex: search, $options: "i" } },
      { nation: { $regex: search, $options: "i" } },
      { position: { $regex: search, $options: "i" } },
    ];
  }

  const docs = await db
    .collection("players")
    .find(filter)
    .sort({ rating: -1, name: 1 })
    .skip(skip)
    .limit(limit)
    .toArray();

  const total = await db.collection("players").countDocuments(filter);

  const players = docs.map((doc) => ({
    id: doc.playerId,
    name: doc.name,
    rating: doc.rating,
    position: doc.position,
    club: doc.club,
    league: doc.league,
    nation: doc.nation,
    price: doc.price,
    pace: doc.pace,
    shooting: doc.shooting,
    passing: doc.passing,
    dribbling: doc.dribbling,
    defending: doc.defending,
    physical: doc.physical,
    image: doc.image,
    age: doc.age,
    preferredFoot: doc.preferredFoot,
    height: doc.height,
    weight: doc.weight,
    playstyles: doc.playstyles ?? [],
    attributes: doc.attributes ?? {},
    edition: doc.edition,
  }));

  return NextResponse.json({
    edition,
    activeEdition,
    page,
    limit,
    total,
    hasMore: skip + players.length < total,
    count: players.length,
    players,
  });
}
