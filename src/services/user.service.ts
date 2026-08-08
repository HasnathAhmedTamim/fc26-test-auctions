import { Db, ObjectId } from "mongodb";
import { toObjectId } from "@/lib/db/object-id";

export async function findUserById(db: Db, userId: string) {
  const userObjectId = toObjectId(userId);
  if (!userObjectId) return null;
  return db.collection("users").findOne({ _id: userObjectId });
}

export async function listUsers(db: Db) {
  const users = await db
    .collection("users")
    .find({}, { projection: { passwordHash: 0 } })
    .sort({ createdAt: -1 })
    .toArray();

  return users.map((user) => ({
    id: user._id.toString(),
    name: String(user.name ?? ""),
    email: String(user.email ?? ""),
    role: user.role === "admin" ? ("admin" as const) : ("manager" as const),
    createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : null,
  }));
}

export async function deleteUserById(db: Db, userId: string) {
  const userObjectId = toObjectId(userId);
  if (!userObjectId) return false;
  const result = await db.collection("users").deleteOne({ _id: userObjectId });
  return result.deletedCount === 1;
}

export async function userExistsByEmail(db: Db, email: string, excludeUserId?: string) {
  const query: Record<string, unknown> = { email };
  if (excludeUserId) {
    const excludeObjectId = toObjectId(excludeUserId);
    if (excludeObjectId) {
      query._id = { $ne: excludeObjectId };
    }
  }

  const existing = await db.collection("users").findOne(query, { projection: { _id: 1 } });
  return Boolean(existing);
}

export async function createUserRecord(
  db: Db,
  payload: { name: string; email: string; passwordHash: string; role: "admin" | "manager" }
) {
  const now = new Date();
  const result = await db.collection("users").insertOne({
    name: payload.name,
    email: payload.email,
    passwordHash: payload.passwordHash,
    role: payload.role,
    createdAt: now,
    updatedAt: now,
  });

  return result.insertedId.toString();
}

export async function updateUserRecord(
  db: Db,
  userId: string,
  patch: Partial<{ name: string; email: string; passwordHash: string; role: "admin" | "manager" }>
) {
  const userObjectId = toObjectId(userId);
  if (!userObjectId) return false;

  const result = await db.collection("users").updateOne(
    { _id: userObjectId },
    {
      $set: {
        ...patch,
        updatedAt: new Date(),
      },
    }
  );

  return result.matchedCount === 1;
}

export function asObjectId(value: string): ObjectId | null {
  return toObjectId(value);
}
