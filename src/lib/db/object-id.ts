import { ObjectId } from "mongodb";

export function toObjectId(value: string) {
  try {
    return new ObjectId(value);
  } catch {
    return null;
  }
}
