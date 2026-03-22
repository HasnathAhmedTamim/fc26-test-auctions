export const BID_INCREMENT = 10;
export const BID_COOLDOWN_MS = 500;

export function isAdminUser(user) {
  return Boolean(user && user.role === "admin");
}

export function canPlaceBid(user) {
  return Boolean(user && user.role === "manager");
}

export function resolveSocketIdentity(socketUser) {
  if (!socketUser || !socketUser.id) {
    return null;
  }

  return {
    userId: String(socketUser.id),
    userName: String(socketUser.name ?? "Unknown"),
    role: socketUser.role === "admin" ? "admin" : "manager",
  };
}

export function isBidIdentitySpoofAttempt(socketUser, payload) {
  if (!socketUser || !payload) return false;

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
  if (elapsed >= cooldownMs) {
    return { limited: false, retryAfterMs: 0 };
  }

  return {
    limited: true,
    retryAfterMs: cooldownMs - elapsed,
  };
}
