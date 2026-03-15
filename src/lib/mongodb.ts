import { MongoClient, ServerApiVersion } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("Please add MONGODB_URI to .env.local");
}

const globalForMongo = global as typeof globalThis & {
  _mongoClient?: MongoClient;
};

const client =
  globalForMongo._mongoClient ??
  new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForMongo._mongoClient = client;
}

export async function getDb() {
  await client.connect();
  return client.db("fc26-auction");
}