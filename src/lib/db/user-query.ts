import { toObjectId } from "@/lib/db/object-id";

export function buildUserIdQuery(userId: string) {
  const objectId = toObjectId(userId);
  if (!objectId) {
    return { userId };
  }

  return {
    $or: [{ userId }, { userId: objectId }],
  };
}
