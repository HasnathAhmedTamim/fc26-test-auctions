"use client";

import { useCallback, useEffect, useMemo, useState, type DragEvent } from "react";
import { Button } from "@/components/ui/button";
import type { LineupFormation, LineupSlotId, LineupStarter } from "@/types/auction";

const FORMATION_SLOTS: Record<LineupFormation, LineupSlotId[]> = {
  "4-3-3": ["gk", "lb", "lcb", "rcb", "rb", "lcm", "cm", "rcm", "lw", "st", "rw"],
  "4-4-2": ["gk", "lb", "lcb", "rcb", "rb", "lcm", "rcm", "lw", "rw", "ls", "rs"],
  "3-5-2": ["gk", "lcb", "cb", "rcb", "lwb", "cdm", "cm", "cam", "rwb", "ls", "rs"],
};

const SLOT_LABELS: Record<LineupSlotId, string> = {
  gk: "GK",
  lb: "LB",
  lcb: "LCB",
  cb: "CB",
  rcb: "RCB",
  rb: "RB",
  lwb: "LWB",
  rwb: "RWB",
  cdm: "CDM",
  lcm: "LCM",
  cm: "CM",
  rcm: "RCM",
  cam: "CAM",
  lw: "LW",
  rw: "RW",
  lf: "LF",
  rf: "RF",
  st: "ST",
  ls: "LS",
  rs: "RS",
};

type LineupPlayer = {
  playerId: string;
  playerName: string;
  amount: number;
};

type LineupResponse = {
  roomId: string | null;
  formation: LineupFormation;
  starters: LineupStarter[];
  availablePlayers: LineupPlayer[];
};

export function LineupBuilder() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [roomId, setRoomId] = useState<string | null>(null);
  const [formation, setFormation] = useState<LineupFormation>("4-3-3");
  const [availablePlayers, setAvailablePlayers] = useState<LineupPlayer[]>([]);
  const [starterMap, setStarterMap] = useState<Record<string, string>>({});

  const loadLineup = useCallback(async () => {
    setLoading(true);
    setError("");

    const res = await fetch("/api/dashboard/lineup", { cache: "no-store" });
    const data = (await res.json()) as LineupResponse & { error?: string };
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Failed to load lineup");
      return;
    }

    setRoomId(data.roomId);
    setFormation(data.formation);
    setAvailablePlayers(Array.isArray(data.availablePlayers) ? data.availablePlayers : []);

    const nextMap: Record<string, string> = {};
    for (const starter of data.starters ?? []) {
      nextMap[starter.slotId] = starter.playerId;
    }
    setStarterMap(nextMap);
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadLineup();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [loadLineup]);

  const currentSlots = FORMATION_SLOTS[formation];

  const usedPlayerIds = useMemo(() => new Set(Object.values(starterMap).filter(Boolean)), [starterMap]);

  const benchPlayers = useMemo(
    () => availablePlayers.filter((player) => !usedPlayerIds.has(player.playerId)),
    [availablePlayers, usedPlayerIds]
  );

  const playersById = useMemo(() => new Map(availablePlayers.map((p) => [p.playerId, p])), [availablePlayers]);

  function onDragStart(event: DragEvent<HTMLDivElement>, playerId: string, fromSlot?: string) {
    event.dataTransfer.setData("playerId", playerId);
    event.dataTransfer.setData("fromSlot", fromSlot ?? "");
  }

  function allowDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
  }

  function dropToSlot(event: DragEvent<HTMLDivElement>, slotId: string) {
    event.preventDefault();
    const playerId = event.dataTransfer.getData("playerId");
    const fromSlot = event.dataTransfer.getData("fromSlot");
    if (!playerId) return;

    setStarterMap((prev) => {
      const next = { ...prev };
      const targetPlayer = next[slotId];

      for (const slot of Object.keys(next)) {
        if (next[slot] === playerId) {
          delete next[slot];
        }
      }

      next[slotId] = playerId;

      if (fromSlot && fromSlot !== slotId && targetPlayer) {
        next[fromSlot] = targetPlayer;
      }

      return next;
    });
  }

  function dropToBench(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const fromSlot = event.dataTransfer.getData("fromSlot");
    if (!fromSlot) return;

    setStarterMap((prev) => {
      const next = { ...prev };
      delete next[fromSlot];
      return next;
    });
  }

  async function saveLineup() {
    if (!roomId) {
      setError("No room found for your profile yet.");
      return;
    }

    const starters = currentSlots
      .map((slotId) => ({ slotId, playerId: starterMap[slotId] }))
      .filter((entry) => Boolean(entry.playerId));

    if (starters.length !== 11) {
      setError("You must set exactly 11 players on the pitch.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    const res = await fetch("/api/dashboard/lineup", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomId,
        formation,
        starters,
      }),
    });

    const data = (await res.json()) as { error?: string; message?: string };
    setSaving(false);

    if (!res.ok) {
      setError(data.error ?? "Failed to save lineup");
      return;
    }

    setMessage(data.message ?? "Lineup saved");
  }

  if (loading) {
    return <p className="text-slate-400">Loading lineup...</p>;
  }

  if (!roomId) {
    return <p className="text-slate-400">No purchased players found yet. Buy players to build your lineup.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div>
          <h2 className="text-xl font-bold">Your Lineup</h2>
          <p className="text-sm text-slate-400">Room: {roomId}</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            aria-label="Select lineup formation"
            value={formation}
            onChange={(event) => setFormation(event.target.value as LineupFormation)}
            className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm"
          >
            <option value="4-3-3">4-3-3</option>
            <option value="4-4-2">4-4-2</option>
            <option value="3-5-2">3-5-2</option>
          </select>
          <Button
            type="button"
            onClick={saveLineup}
            disabled={saving}
            className="bg-emerald-500 text-black hover:bg-emerald-400"
          >
            {saving ? "Saving..." : "Save Lineup"}
          </Button>
        </div>
      </div>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-400">{message}</p> : null}

      <div className="rounded-3xl border border-emerald-400/20 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.18),transparent_50%),linear-gradient(180deg,#062c1d,#04150f)] p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {currentSlots.map((slotId) => {
            const playerId = starterMap[slotId];
            const player = playerId ? playersById.get(playerId) : null;

            return (
              <div
                key={slotId}
                onDragOver={allowDrop}
                onDrop={(event) => dropToSlot(event, slotId)}
                className="min-h-24 rounded-xl border border-white/20 bg-black/25 p-3"
              >
                <p className="text-xs font-semibold tracking-[0.15em] text-emerald-300">{SLOT_LABELS[slotId]}</p>
                {player ? (
                  <div
                    draggable
                    onDragStart={(event) => onDragStart(event, player.playerId, slotId)}
                    className="mt-2 cursor-move rounded-lg border border-white/15 bg-white/10 px-3 py-2"
                  >
                    <p className="text-sm font-semibold">{player.playerName}</p>
                    <p className="text-xs text-slate-300">{player.amount} coins</p>
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-slate-400">Drop player here</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div
        onDragOver={allowDrop}
        onDrop={dropToBench}
        className="rounded-2xl border border-white/10 bg-white/5 p-4"
      >
        <h3 className="text-lg font-bold">Bench</h3>
        <p className="text-sm text-slate-400">Drag from bench to pitch, or drag starters here to bench them.</p>
        {benchPlayers.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No bench players available.</p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {benchPlayers.map((player) => (
              <div
                key={player.playerId}
                draggable
                onDragStart={(event) => onDragStart(event, player.playerId)}
                className="cursor-move rounded-xl border border-white/10 bg-slate-900 px-4 py-3"
              >
                <p className="font-semibold text-white">{player.playerName}</p>
                <p className="text-xs text-slate-400">{player.amount} coins</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
