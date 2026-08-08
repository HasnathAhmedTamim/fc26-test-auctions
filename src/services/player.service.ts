import { Db } from "mongodb";
import { getActivePlayerEdition } from "@/lib/player-edition";

export function mapPlayerDocument(doc: Record<string, unknown>) {
  return {
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
  };
}

export async function listPlayers(
  db: Db,
  options: {
    page?: number;
    limit?: number;
    search?: string;
    edition?: string;
  } = {}
) {
  const page = Math.max(1, Number(options.page) || 1);
  const limit = Math.min(200, Math.max(1, Number(options.limit) || 24));
  const skip = (page - 1) * limit;
  const search = options.search?.trim() ?? "";

  const activeEdition = await getActivePlayerEdition(db);
  const edition = options.edition?.toLowerCase() || activeEdition;
  const filter: Record<string, unknown> = { edition };

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { club: { $regex: search, $options: "i" } },
      { nation: { $regex: search, $options: "i" } },
      { position: { $regex: search, $options: "i" } },
    ];
  }

  const collection = db.collection("players");
  const [docs, total] = await Promise.all([
    collection.find(filter).sort({ rating: -1, name: 1 }).skip(skip).limit(limit).toArray(),
    collection.countDocuments(filter),
  ]);

  return {
    edition,
    activeEdition,
    players: docs.map((doc) => mapPlayerDocument(doc as Record<string, unknown>)),
    total,
    page,
    limit,
    hasMore: skip + docs.length < total,
    count: docs.length,
  };
}

export async function findPlayerById(db: Db, playerId: string, edition?: string) {
  const activeEdition = edition ?? (await getActivePlayerEdition(db));
  return db.collection("players").findOne({
    edition: activeEdition,
    $or: [{ playerId }, { slug: playerId }, { id: playerId }],
  });
}

export async function editionHasPlayers(db: Db, edition: string) {
  const count = await db.collection("players").countDocuments({ edition }, { limit: 1 });
  return count > 0;
}
