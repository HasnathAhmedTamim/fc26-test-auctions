import { beforeEach, describe, expect, it, vi } from "vitest";

const findOneMock = vi.fn();
const insertOneMock = vi.fn();

vi.mock("@/lib/mongodb", () => ({
  getDb: vi.fn(async () => ({
    collection: vi.fn(() => ({
      findOne: findOneMock,
      insertOne: insertOneMock,
    })),
  })),
}));

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn(async () => "hashed-password"),
  },
}));

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    findOneMock.mockReset();
    insertOneMock.mockReset();
  });

  it("returns 409 if user already exists", async () => {
    findOneMock.mockResolvedValue({ _id: "existing" });

    const { POST } = await import("@/app/api/auth/register/route");
    const req = new Request("http://localhost/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: "Manager One",
        email: "Manager@Example.com",
        password: "secret123",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(409);
    expect(json.error).toBe("User already exists");
    expect(findOneMock).toHaveBeenCalledWith({ email: "manager@example.com" });
  });

  it("creates user and returns inserted id", async () => {
    findOneMock.mockResolvedValue(null);
    insertOneMock.mockResolvedValue({ insertedId: { toString: () => "abc123" } });

    const { POST } = await import("@/app/api/auth/register/route");
    const req = new Request("http://localhost/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: " Manager Two ",
        email: "Manager2@Example.com",
        password: "secret123",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.userId).toBe("abc123");
    expect(insertOneMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Manager Two",
        email: "manager2@example.com",
        passwordHash: "hashed-password",
        role: "manager",
      })
    );
  });
});
