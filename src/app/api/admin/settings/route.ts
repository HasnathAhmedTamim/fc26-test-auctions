import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/roles";
import {
  AUCTION_ROUND_TIME_KEY,
  BID_COOLDOWN_KEY,
  BID_INCREMENT_KEY,
  getAuctionRuntimeSettings,
  setAuctionRuntimeSetting,
} from "@/lib/auction-settings";
import {
  getActivePlayerEdition,
  listAvailablePlayerEditions,
  setActivePlayerEdition,
} from "@/lib/player-edition";

// Treat blank inputs as 'not provided' while preserving integer-only semantics.
function parseOptionalInt(value: unknown) {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return NaN;
  return parsed;
}

export async function GET() {
  try {
    const access = await requireAdmin();
    if (!access.ok) return access.response;

    const db = await getDb();
    const runtime = await getAuctionRuntimeSettings(db);
    const activeEdition = await getActivePlayerEdition(db);
    const editions = await listAvailablePlayerEditions(db);

    return NextResponse.json({
      settings: {
        ...runtime,
        activeEdition,
      },
      editions: editions.length ? editions : [activeEdition],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load settings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const access = await requireAdmin();
    if (!access.ok) return access.response;

    const body = await req.json();

    const roundTimeSeconds = parseOptionalInt(body?.roundTimeSeconds);
    const bidIncrement = parseOptionalInt(body?.bidIncrement);
    const bidCooldownMs = parseOptionalInt(body?.bidCooldownMs);
    const activeEdition = String(body?.activeEdition ?? "").trim().toLowerCase();

    if (roundTimeSeconds !== null && (!Number.isFinite(roundTimeSeconds) || roundTimeSeconds < 15 || roundTimeSeconds > 600)) {
      return NextResponse.json({ error: "roundTimeSeconds must be an integer between 15 and 600" }, { status: 400 });
    }

    if (bidIncrement !== null && (!Number.isFinite(bidIncrement) || bidIncrement < 1 || bidIncrement > 1000)) {
      return NextResponse.json({ error: "bidIncrement must be an integer between 1 and 1000" }, { status: 400 });
    }

    if (bidCooldownMs !== null && (!Number.isFinite(bidCooldownMs) || bidCooldownMs < 0 || bidCooldownMs > 10000)) {
      return NextResponse.json({ error: "bidCooldownMs must be an integer between 0 and 10000" }, { status: 400 });
    }

    const db = await getDb();

    if (activeEdition) {
      // Guard against switching to an edition that has no backing player dataset.
      const exists = await db.collection("players").countDocuments({ edition: activeEdition }, { limit: 1 });
      if (!exists) {
        return NextResponse.json({ error: `No players found for edition '${activeEdition}'` }, { status: 404 });
      }
    }

    const updates: Promise<unknown>[] = [];

    if (roundTimeSeconds !== null) {
      updates.push(setAuctionRuntimeSetting(db, AUCTION_ROUND_TIME_KEY, roundTimeSeconds));
    }

    if (bidIncrement !== null) {
      updates.push(setAuctionRuntimeSetting(db, BID_INCREMENT_KEY, bidIncrement));
    }

    if (bidCooldownMs !== null) {
      updates.push(setAuctionRuntimeSetting(db, BID_COOLDOWN_KEY, bidCooldownMs));
    }

    if (activeEdition) {
      updates.push(setActivePlayerEdition(db, activeEdition));
    }

    if (!updates.length) {
      return NextResponse.json({ error: "No settings provided" }, { status: 400 });
    }

    // Commit independent setting writes concurrently for lower admin API latency.
    await Promise.all(updates);

    const runtime = await getAuctionRuntimeSettings(db);
    const nextActiveEdition = await getActivePlayerEdition(db);

    return NextResponse.json({
      message: "Settings updated",
      settings: {
        ...runtime,
        activeEdition: nextActiveEdition,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update settings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}