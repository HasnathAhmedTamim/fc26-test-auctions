"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useLiveAuctionRoom } from "@/hooks/use-live-auction-room";

export function LiveAuctionBadge() {
  const { data: session } = useSession();
  const room = useLiveAuctionRoom(Boolean(session?.user));

  if (!room) return null;

  const isLive = room.status === "live";

  return (
    <Link
      href={`/auction/${room.roomId}`}
      className={`hidden items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition sm:inline-flex ${
        isLive
          ? "border border-emerald-400/40 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25"
          : "border border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${isLive ? "animate-pulse bg-emerald-400" : "bg-slate-400"}`} />
      {isLive ? "Live Auction" : "Auction Room"}
      <span className="max-w-[120px] truncate opacity-80">{room.name}</span>
    </Link>
  );
}

export function LiveAuctionSheetLink() {
  const { data: session } = useSession();
  const room = useLiveAuctionRoom(Boolean(session?.user));

  if (!room) return null;

  const isLive = room.status === "live";

  return (
    <Link
      href={`/auction/${room.roomId}`}
      className={`rounded-xl px-4 py-3 text-sm ${
        isLive
          ? "border border-emerald-400/30 bg-emerald-500/10 font-semibold text-emerald-300"
          : "text-slate-200 hover:bg-white/5"
      }`}
    >
      {isLive ? "Join Live Auction" : `Enter ${room.name}`}
    </Link>
  );
}
