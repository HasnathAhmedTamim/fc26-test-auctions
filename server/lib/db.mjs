import { MongoClient, ObjectId } from "mongodb";

export const DB_NAME = "fc26-auction";

export function toObjectId(value) {
  try {
    return new ObjectId(value);
  } catch {
    return null;
  }
}

export async function connectDb(mongoUri) {
  const client = new MongoClient(mongoUri);
  await client.connect();
  return { client, db: client.db(DB_NAME) };
}
