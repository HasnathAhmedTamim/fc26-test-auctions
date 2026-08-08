"use client";

import { useEffect, useState } from "react";

export type LiveAuctionRoom = {
  roomId: string;
  name: string;
  status: string;
};

export function useLiveAuctionRoom(enabled: boolean) {
  const [room, setRoom] = useState<LiveAuctionRoom | null>(null);

  useEffect(() => {
    if (!enabled) {
      setRoom(null);
      return;
    }

    let cancelled = false;

    async function pollRooms() {
      try {
        const res = await fetch("/api/auction/rooms", { cache: "no-store" });
        if (!res.ok) return;

        const data = await res.json();
        const rooms = Array.isArray(data.rooms) ? data.rooms : [];
        const match =
          rooms.find((entry: LiveAuctionRoom) => entry.status === "live") ??
          rooms.find((entry: LiveAuctionRoom) =>
            ["waiting", "paused", "sold"].includes(String(entry.status))
          ) ??
          null;

        if (!cancelled) setRoom(match);
      } catch {
        if (!cancelled) setRoom(null);
      }
    }

    void pollRooms();
    const interval = window.setInterval(pollRooms, 15000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [enabled]);

  return room;
}
