import { describe, expect, it } from "vitest";
import { toObjectId } from "@/lib/db/object-id";
import { buildUserIdQuery } from "@/lib/db/user-query";
import { coerceSettingInt } from "@/lib/auction/runtime-settings.mjs";

describe("toObjectId", () => {
  it("returns ObjectId for valid hex strings", () => {
    const id = toObjectId("507f1f77bcf86cd799439011");
    expect(id?.toString()).toBe("507f1f77bcf86cd799439011");
  });

  it("returns null for invalid ids", () => {
    expect(toObjectId("not-an-object-id")).toBeNull();
  });
});

describe("buildUserIdQuery", () => {
  it("supports string-only lookup when id is invalid", () => {
    expect(buildUserIdQuery("manager-1")).toEqual({ userId: "manager-1" });
  });

  it("supports legacy ObjectId and string user ids", () => {
    const query = buildUserIdQuery("507f1f77bcf86cd799439011");
    expect(query).toHaveProperty("$or");
  });
});

describe("coerceSettingInt", () => {
  it("clamps invalid values to fallback", () => {
    expect(coerceSettingInt("abc", 120, 15, 600)).toBe(120);
    expect(coerceSettingInt(9999, 120, 15, 600)).toBe(120);
  });

  it("accepts valid integers in range", () => {
    expect(coerceSettingInt("180", 120, 15, 600)).toBe(180);
  });
});
