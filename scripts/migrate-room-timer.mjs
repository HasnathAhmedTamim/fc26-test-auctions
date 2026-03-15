import "dotenv/config";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("MONGODB_URI missing");
}

const client = new MongoClient(uri);

try {
  await client.connect();
  const db = client.db("fc26-auction");

  const result = await db.collection("auctionRooms").updateMany(
    { timer: { $lt: 120 } },
    { $set: { timer: 120, updatedAt: new Date() } }
  );

  console.log(
    JSON.stringify({
      matched: result.matchedCount,
      modified: result.modifiedCount,
    })
  );
} finally {
  await client.close();
}
