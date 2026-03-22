import { beforeEach, describe, expect, it, vi } from "vitest";

const roomFindOneMock = vi.fn();
const statsFindOneMock = vi.fn();
const statsUpdateOneMock = vi.fn();
const playerFindOneMock = vi.fn();

vi.mock("@/lib/roles", () => ({
  requireAdmin: vi.fn(async () => ({
    ok: true,
    session: { user: { id: "admin-1", role: "admin" } },
  })),
}));

vi.mock("@/lib/player-edition", () => ({
  getActivePlayerEdition: vi.fn(async () => "fc26"),
}));

vi.mock("@/lib/mongodb", () => ({
  getDb: vi.fn(async () => ({
    collection: vi.fn((name: string) => {
      if (name === "auctionRooms") {
        return { findOne: roomFindOneMock };
      }

      if (name === "managerStats") {
        return {
          findOne: statsFindOneMock,
          updateOne: statsUpdateOneMock,
        };
      }

      if (name === "players") {
        return { findOne: playerFindOneMock };
      }

      return {
        insertOne: vi.fn(),
        find: vi.fn(() => ({ sort: vi.fn(() => ({ toArray: vi.fn(async () => []) })) })),
      };
    }),
  })),
}));

describe("POST /api/admin/manager-stats constraints", () => {
  beforeEach(() => {
    roomFindOneMock.mockReset();
    statsFindOneMock.mockReset();
    statsUpdateOneMock.mockReset();
    playerFindOneMock.mockReset();
  });

  it("rejects add when manager already hit maxPlayers", async () => {
    roomFindOneMock.mockResolvedValue({ roomId: "r1", budget: 2000, maxPlayers: 2 });
    statsFindOneMock.mockResolvedValue({
      roomId: "r1",
      userId: "u1",
      userName: "Manager One",
      budgetSpent: 100,
      playersBought: [
        { playerId: "p1", playerName: "A", amount: 50 },
        { playerId: "p2", playerName: "B", amount: 50 },
      ],
    });
    playerFindOneMock.mockResolvedValue({ playerId: "p3", name: "Player C", price: 200 });

    const { POST } = await import("@/app/api/admin/manager-stats/route");
    const req = new Request("http://localhost/api/admin/manager-stats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomId: "r1",
        userId: "u1",
        playerId: "p3",
        action: "add",
        amount: 200,
      }),
    });

    const res = await POST(req as never);
    const json = await res.json();

    expect(res.status).toBe(409);
    expect(json.error).toContain("squad limit");
    expect(statsUpdateOneMock).not.toHaveBeenCalled();
  });

  it("rejects budget adjustment above room budget", async () => {
    roomFindOneMock.mockResolvedValue({ roomId: "r1", budget: 500, maxPlayers: 24 });
    statsFindOneMock.mockResolvedValue({
      roomId: "r1",
      userId: "u1",
      userName: "Manager One",
      budgetSpent: 450,
      playersBought: [],
    });

    const { POST } = await import("@/app/api/admin/manager-stats/route");
    const req = new Request("http://localhost/api/admin/manager-stats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomId: "r1",
        userId: "u1",
        action: "adjust-budget",
        adjustment: 100,
      }),
    });

    const res = await POST(req as never);
    const json = await res.json();

    expect(res.status).toBe(409);
    expect(json.error).toContain("cannot exceed room budget");
    expect(statsUpdateOneMock).not.toHaveBeenCalled();
  });

  it("rejects add when resulting spent exceeds room budget", async () => {
    roomFindOneMock.mockResolvedValue({ roomId: "r1", budget: 500, maxPlayers: 24 });
    statsFindOneMock.mockResolvedValue({
      roomId: "r1",
      userId: "u1",
      userName: "Manager One",
      budgetSpent: 450,
      playersBought: [{ playerId: "p1", playerName: "A", amount: 450 }],
    });
    playerFindOneMock.mockResolvedValue({ playerId: "p2", name: "Player B", price: 100 });

    const { POST } = await import("@/app/api/admin/manager-stats/route");
    const req = new Request("http://localhost/api/admin/manager-stats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomId: "r1",
        userId: "u1",
        playerId: "p2",
        action: "add",
        amount: 100,
      }),
    });

    const res = await POST(req as never);
    const json = await res.json();

    expect(res.status).toBe(409);
    expect(json.error).toContain("exceed room budget");
    expect(statsUpdateOneMock).not.toHaveBeenCalled();
  });
});
