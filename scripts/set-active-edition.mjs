import "dotenv/config";
import { MongoClient } from "mongodb";

const editionArg = (process.argv[2] || "").trim().toLowerCase();
if (!editionArg) {
  console.error("Usage: npm run players:version -- <edition>");
  process.exit(1);
}

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI missing");
  process.exit(1);
}

const client = new MongoClient(uri);

try {
  await client.connect();
  const db = client.db("fc26-auction");

  const exists = await db.collection("players").countDocuments({ edition: editionArg }, { limit: 1 });
  if (!exists) {
    console.error(`No players found for edition '${editionArg}'`);
    process.exit(1);
  }

  await db.collection("settings").updateOne(
    { key: "activePlayerEdition" },
    {
      $set: {
        key: "activePlayerEdition",
        value: editionArg,
        updatedAt: new Date(),
      },
      $setOnInsert: {
        createdAt: new Date(),
      },
    },
    { upsert: true }
  );

  console.log(JSON.stringify({ activeEdition: editionArg }, null, 2));
} catch (error) {
  console.error(error);
  process.exit(1);
} finally {
  await client.close();
}
