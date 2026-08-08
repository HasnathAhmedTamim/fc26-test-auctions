import { getDb } from "@/lib/mongodb";
import { getActivePlayerEdition } from "@/lib/player-edition";

export async function getHomeLiveStats() {
  const db = await getDb();
  const [rooms, soldCount, managers, playersInCatalog] = await Promise.all([
    db.collection("auctionRooms").countDocuments({}),
    db.collection("soldPlayers").countDocuments({}),
    db.collection("users").countDocuments({ role: "manager" }),
    db.collection("players").countDocuments({ edition: await getActivePlayerEdition(db) }),
  ]);

  const liveRooms = await db.collection("auctionRooms").countDocuments({ status: "live" });

  return {
    totalRooms: rooms,
    liveRooms,
    playersSold: soldCount,
    managers,
    playersInCatalog,
  };
}

export async function getFeaturedPlayers(limit = 6) {
  const db = await getDb();
  const edition = await getActivePlayerEdition(db);

  const players = await db
    .collection("players")
    .find({ edition })
    .sort({ rating: -1, name: 1 })
    .limit(limit)
    .project({
      playerId: 1,
      name: 1,
      rating: 1,
      position: 1,
      club: 1,
      price: 1,
      basePrice: 1,
      image: 1,
    })
    .toArray();

  return players.map((player) => ({
    id: String(player.playerId),
    name: String(player.name),
    rating: Number(player.rating),
    position: String(player.position),
    club: String(player.club),
    price: Number(player.basePrice ?? player.price ?? 0),
    image: String(player.image ?? ""),
  }));
}
