"use client";

import { useCallback, useEffect, useMemo, useState, type DragEvent } from "react";
import { Button } from "@/components/ui/button";
import { LINEUP_FORMATIONS, type LineupFormation, type LineupStarter } from "@/types/auction";

const PRESET_FORMATIONS = [...LINEUP_FORMATIONS] as string[];

type SlotLayout = {
  slotId: string;
  label: string;
};

type FormationRow = {
  rowId: string;
  slots: SlotLayout[];
};

function parseFormation(value: string) {
  if (!/^\d(?:-\d){1,4}$/.test(value)) return null;
  const lines = value.split("-").map((part) => Number(part));
  const sum = lines.reduce((acc, line) => acc + line, 0);
  if (sum !== 10) return null;
  return lines;
}

function getFormationRows(formation: string): FormationRow[] {
  const parsed = parseFormation(formation) ?? [4, 3, 3];
  const rows: FormationRow[] = [];

  parsed.forEach((count, lineIndex) => {
    const row: FormationRow = {
      rowId: `line${lineIndex + 1}`,
      slots: [],
    };

    for (let i = 0; i < count; i += 1) {
      row.slots.push({
        slotId: `line${lineIndex + 1}-p${i + 1}`,
        label: `L${lineIndex + 1}`,
      });
    }

    rows.push(row);
  });

  rows.reverse();

  rows.push({
    rowId: "gk-row",
    slots: [{ slotId: "gk", label: "GK" }],
  });

  return rows;
}

type LineupPlayer = {
  playerId: string;
  playerName: string;
  amount: number;
};

type LineupResponse = {
  roomId: string | null;
  formation: string;
  starters: LineupStarter[];
  availablePlayers: LineupPlayer[];
};

export function LineupBuilder() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [roomId, setRoomId] = useState<string | null>(null);
  const [formation, setFormation] = useState<string>("4-3-3");
  const [formationInput, setFormationInput] = useState("4-3-3");
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
    setFormationInput(data.formation);
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

  const formationRows = useMemo(() => getFormationRows(formation), [formation]);
  const currentSlots = useMemo(() => formationRows.flatMap((row) => row.slots), [formationRows]);

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

  function applyFormation() {
    const normalized = formationInput.trim();
    const parsed = parseFormation(normalized);
    if (!parsed) {
      setError("Invalid formation. Use patterns like 4-3-3, 4-2-3-1, or 3-4-3.");
      return;
    }

    const nextSlots = getFormationRows(normalized).flatMap((row) => row.slots.map((slot) => slot.slotId));
    setFormation(normalized);
    setError("");

    setStarterMap((prev) => {
      const used = new Set<string>();
      const next: Record<string, string> = {};

      for (const slotId of nextSlots) {
        if (prev[slotId] && !used.has(prev[slotId])) {
          next[slotId] = prev[slotId];
          used.add(prev[slotId]);
        }
      }

      for (const playerId of Object.values(prev)) {
        if (used.has(playerId)) continue;
        const freeSlot = nextSlots.find((slotId) => !next[slotId]);
        if (!freeSlot) break;
        next[freeSlot] = playerId;
        used.add(playerId);
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
      .map((slot) => ({ slotId: slot.slotId, playerId: starterMap[slot.slotId] }))
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
        formation: formation as LineupFormation,
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
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
            <h2 className="text-lg font-black">Main Squad Builder</h2>
            <p className="text-xs text-slate-400">Room: {roomId}</p>
        </div>
          <p className="rounded-full border border-emerald-300/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
            Formation {formation}
          </p>
        </div>

        <div className="mt-3 grid gap-2 lg:grid-cols-[180px_1fr_100px_130px]">
          <select
            aria-label="Select lineup formation"
            value={formation}
            onChange={(event) => {
              const value = event.target.value;
              setFormationInput(value);
              setFormation(value);
            }}
            className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm"
          >
            {PRESET_FORMATIONS.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
          <input
            aria-label="Custom formation pattern"
            value={formationInput}
            onChange={(event) => setFormationInput(event.target.value)}
            className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm"
            placeholder="Custom formation e.g. 4-2-3-1"
          />
          <Button type="button" onClick={applyFormation} variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10">
            Apply
          </Button>
          <Button
            type="button"
            onClick={saveLineup}
            disabled={saving}
            className="bg-emerald-500 text-black hover:bg-emerald-400"
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-400">{message}</p> : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-3xl border border-emerald-400/20 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.25),transparent_45%),linear-gradient(180deg,#0d1f1b,#070f0d)] p-3 md:p-4">
        <div className="relative mx-auto aspect-5/3 w-full max-w-5xl overflow-hidden rounded-3xl border border-white/20 bg-[linear-gradient(180deg,#0e2c24,#102218)]">
          <div className="absolute inset-0 bg-[repeating-linear-gradient(180deg,rgba(255,255,255,0.04)_0,rgba(255,255,255,0.04)_7%,transparent_7%,transparent_14%)]" />
          <div className="absolute left-1/2 top-1/2 h-26 w-26 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/40" />
          <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/70" />
          <div className="absolute left-1/2 top-[86%] h-18 w-42 -translate-x-1/2 border border-white/40" />
          <div className="absolute left-1/2 top-[8%] h-18 w-42 -translate-x-1/2 border border-white/40" />

          <div className="relative z-10 flex h-full flex-col justify-between px-2 py-3 md:px-4 md:py-4">
            {formationRows.map((row) => (
              <div key={row.rowId} className="flex items-center justify-evenly gap-2">
                {row.slots.map((slot) => {
                  const playerId = starterMap[slot.slotId];
                  const player = playerId ? playersById.get(playerId) : null;

                  return (
                    <div
                      key={slot.slotId}
                      onDragOver={allowDrop}
                      onDrop={(event) => dropToSlot(event, slot.slotId)}
                      className="min-h-16"
                    >
                      {player ? (
                        <div
                          draggable
                          onDragStart={(event) => onDragStart(event, player.playerId, slot.slotId)}
                          className="w-20 cursor-move rounded-full border-2 border-emerald-300/90 bg-slate-950/75 p-2 text-center shadow-[0_0_0_3px_rgba(45,212,191,0.2)] md:w-24"
                        >
                          <p className="truncate text-[10px] font-semibold text-white">{slot.label}</p>
                          <p className="truncate text-[11px] font-bold text-emerald-200">{player.playerName}</p>
                        </div>
                      ) : (
                        <div className="w-16 rounded-full border-2 border-dashed border-emerald-300/70 bg-black/35 px-2 py-2 text-center text-[10px] font-semibold text-emerald-200 md:w-20 md:py-3">
                          {slot.label}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        </div>

        <div
          onDragOver={allowDrop}
          onDrop={dropToBench}
          className="rounded-2xl border border-white/10 bg-white/5 p-4"
        >
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-black">Bench Squad</h3>
            <span className="rounded-full border border-white/10 bg-black/30 px-2 py-1 text-xs text-slate-300">
              {benchPlayers.length} players
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">Drag to pitch, or drop starters here.</p>
          {benchPlayers.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No bench players available.</p>
          ) : (
            <div className="mt-3 grid max-h-130 gap-2 overflow-auto pr-1">
              {benchPlayers.map((player) => (
                <div
                  key={player.playerId}
                  draggable
                  onDragStart={(event) => onDragStart(event, player.playerId)}
                  className="cursor-move rounded-xl border border-white/10 bg-slate-900 px-3 py-2"
                >
                  <p className="text-sm font-semibold text-white">{player.playerName}</p>
                  <p className="text-xs text-slate-400">{player.amount} coins</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
