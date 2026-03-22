import { describe, expect, it } from "vitest";

import {
  BID_COOLDOWN_MS,
  BID_INCREMENT,
  buildAtomicBidFilter,
  canPlaceBid,
  getBidCooldownState,
  isAdminUser,
  isBidIdentitySpoofAttempt,
  resolveSocketIdentity,
  validateBidAmount,
} from "@/lib/auction-realtime-guards.mjs";

describe("auction realtime guards", () => {
  it("denies non-admin users for admin actions", () => {
    expect(isAdminUser(null)).toBe(false);
    expect(isAdminUser({ role: "manager" })).toBe(false);
    expect(isAdminUser({ role: "admin" })).toBe(true);
  });

  it("allows only managers to place bids", () => {
    expect(canPlaceBid(null)).toBe(false);
    expect(canPlaceBid({ role: "admin" })).toBe(false);
    expect(canPlaceBid({ role: "manager" })).toBe(true);
  });

  it("detects bid identity spoof attempts", () => {
    const socketUser = { id: "u1", name: "Alice", role: "manager" };

    expect(isBidIdentitySpoofAttempt(socketUser, { userId: "u2", userName: "Alice" })).toBe(true);
    expect(isBidIdentitySpoofAttempt(socketUser, { userId: "u1", userName: "Mallory" })).toBe(true);
    expect(isBidIdentitySpoofAttempt(socketUser, { userId: "u1", userName: "Alice" })).toBe(false);
    expect(isBidIdentitySpoofAttempt(socketUser, {})).toBe(false);
  });

  it("uses socket identity as source of truth", () => {
    const identity = resolveSocketIdentity({ id: "u10", name: "Manager One", role: "manager" });

    expect(identity).toEqual({
      userId: "u10",
      userName: "Manager One",
      role: "manager",
    });

    expect(resolveSocketIdentity({})).toBeNull();
  });

  it("enforces minimum increment and numeric bid amount", () => {
    const invalidType = validateBidAmount(Number.NaN, 100);
    expect(invalidType.ok).toBe(false);

    const tooLow = validateBidAmount(109, 100, BID_INCREMENT);
    expect(tooLow.ok).toBe(false);
    expect(tooLow.message).toContain("Minimum next bid is 110");

    const valid = validateBidAmount(110, 100, BID_INCREMENT);
    expect(valid.ok).toBe(true);
    expect(valid.expectedCurrentBid).toBe(100);

    const invalidStep = validateBidAmount(115, 100, BID_INCREMENT);
    expect(invalidStep.ok).toBe(false);
    expect(invalidStep.message).toContain("steps of 10");
  });

  it("builds atomic filter used for race-safe bids", () => {
    const filter = buildAtomicBidFilter("room-1", 250);

    expect(filter).toEqual({
      roomId: "room-1",
      status: "live",
      currentBid: 250,
      currentPlayer: { $ne: null },
    });
  });

  it("returns bid cooldown state correctly", () => {
    const base = 1_000;

    const firstBid = getBidCooldownState(undefined, base, BID_COOLDOWN_MS);
    expect(firstBid).toEqual({ limited: false, retryAfterMs: 0 });

    const limited = getBidCooldownState(base, base + 100, BID_COOLDOWN_MS);
    expect(limited.limited).toBe(true);
    expect(limited.retryAfterMs).toBe(BID_COOLDOWN_MS - 100);

    const expired = getBidCooldownState(base, base + BID_COOLDOWN_MS + 1, BID_COOLDOWN_MS);
    expect(expired).toEqual({ limited: false, retryAfterMs: 0 });
  });
});
