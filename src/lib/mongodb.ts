import { MongoClient, ServerApiVersion } from "mongodb";
import { DB_NAME } from "@/lib/db/constants";
import { configureMongoDns } from "@/lib/dns-bootstrap";

configureMongoDns();

const uri = process.env.MONGODB_URI;

const globalForMongo = global as typeof globalThis & {
  _mongoClient?: MongoClient;
};

function getClient() {
  if (!uri) {
    throw new Error("Please add MONGODB_URI to .env.local");
  }

  if (!globalForMongo._mongoClient) {
    globalForMongo._mongoClient = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    });
  }

  return globalForMongo._mongoClient;
}

export async function getDb() {
  const client = getClient();
  await client.connect();
  return client.db(DB_NAME);
}

export { DB_NAME };
