export const BID_INCREMENT = 10;
export const BID_COOLDOWN_MS = 500;

export function isAdminUser(user) {
  // Admin-only gate used by privileged realtime actions.
  return Boolean(user && user.role === "admin");
}

export function canPlaceBid(user) {
  // Only manager accounts are allowed to participate in bidding.
  return Boolean(user && user.role === "manager");
}

export function resolveSocketIdentity(socketUser) {
  if (!socketUser || !socketUser.id) {
    return null;
  }

  // Always derive bid identity from authenticated socket context, never from client payload.
  return {
    userId: String(socketUser.id),
    userName: String(socketUser.name ?? "Unknown"),
    role: socketUser.role === "admin" ? "admin" : "manager",
  };
}

export function isBidIdentitySpoofAttempt(socketUser, payload) {
  if (!socketUser || !payload) return false;

  // Reject attempts to override server-trusted identity fields in bid events.
  if (payload.userId !== undefined && String(payload.userId) !== String(socketUser.id)) {
    return true;
  }

  if (payload.userName !== undefined && String(payload.userName) !== String(socketUser.name ?? "Unknown")) {
    return true;
  }

  return false;
}

export function validateBidAmount(amount, currentBid, increment = BID_INCREMENT) {
  if (!Number.isFinite(amount)) {
    return {
      ok: false,
      message: "Bid amount must be a valid number",
    };
  }

  const expectedCurrentBid = Number(currentBid ?? 0);
  const minimumAllowedBid = expectedCurrentBid + increment;
  // Enforce monotonic bids with fixed increments so all clients see a consistent ladder.
  if (amount < minimumAllowedBid) {
    return {
      ok: false,
      message: `Minimum next bid is ${minimumAllowedBid}`,
    };
  }

  if ((amount - expectedCurrentBid) % increment !== 0) {
    return {
      ok: false,
      message: `Bid must increase in steps of ${increment}`,
    };
  }

  return {
    ok: true,
    expectedCurrentBid,
    minimumAllowedBid,
  };
}

export function buildAtomicBidFilter(roomId, expectedCurrentBid) {
  // Optimistic concurrency guard: update succeeds only if currentBid is unchanged.
  return {
    roomId,
    status: "live",
    currentBid: Number(expectedCurrentBid ?? 0),
    currentPlayer: { $ne: null },
  };
}

export function getBidCooldownState(lastBidAt, now = Date.now(), cooldownMs = BID_COOLDOWN_MS) {
  if (!Number.isFinite(lastBidAt)) {
    return { limited: false, retryAfterMs: 0 };
  }

  const elapsed = Math.max(0, now - Number(lastBidAt));
  // Simple per-room throttle that smooths bursts and reduces race-prone bid storms.
  if (elapsed >= cooldownMs) {
    return { limited: false, retryAfterMs: 0 };
  }

  return {
    limited: true,
    retryAfterMs: cooldownMs - elapsed,
  };
}
