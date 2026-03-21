import { beforeEach, describe, expect, it, vi } from "vitest";

const toArrayMock = vi.fn();
const limitMock = vi.fn(() => ({ toArray: toArrayMock }));
const skipMock = vi.fn(() => ({ limit: limitMock }));
const sortMock = vi.fn(() => ({ skip: skipMock }));
const findMock = vi.fn(() => ({ sort: sortMock }));
const countDocumentsMock = vi.fn();

vi.mock("@/lib/player-edition", () => ({
  getActivePlayerEdition: vi.fn(async () => "fc26"),
}));

vi.mock("@/lib/mongodb", () => ({
  getDb: vi.fn(async () => ({
    collection: vi.fn(() => ({
      find: findMock,
      countDocuments: countDocumentsMock,
    })),
  })),
}));

describe("GET /api/players", () => {
  beforeEach(() => {
    findMock.mockClear();
    sortMock.mockClear();
    skipMock.mockClear();
    limitMock.mockClear();
    toArrayMock.mockReset();
    countDocumentsMock.mockReset();
  });

  it("applies pagination and returns hasMore", async () => {
    toArrayMock.mockResolvedValue([
      {
        playerId: "kylian-mbappe",
        name: "Kylian Mbappe",
        rating: 91,
        position: "ST",
        club: "PSG",
        league: "Ligue 1",
        nation: "France",
        price: 410,
        pace: 97,
        shooting: 90,
        passing: 80,
        dribbling: 92,
        defending: 36,
        physical: 76,
        image: "https://example.com/mbappe.png",
        edition: "fc26",
      },
    ]);
    countDocumentsMock.mockResolvedValue(500);

    const { GET } = await import("@/app/api/players/route");
    const req = new Request(
      "http://localhost/api/players?search=mbappe&page=2&limit=100"
    );

    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(skipMock).toHaveBeenCalledWith(100);
    expect(limitMock).toHaveBeenCalledWith(100);
    expect(json.page).toBe(2);
    expect(json.limit).toBe(100);
    expect(json.total).toBe(500);
    expect(json.hasMore).toBe(true);
    expect(json.players).toHaveLength(1);
  });

  it("caps invalid limit values", async () => {
    toArrayMock.mockResolvedValue([]);
    countDocumentsMock.mockResolvedValue(0);

    const { GET } = await import("@/app/api/players/route");
    const req = new Request("http://localhost/api/players?page=-1&limit=9999");

    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.page).toBe(1);
    expect(json.limit).toBe(200);
    expect(skipMock).toHaveBeenCalledWith(0);
  });
});
