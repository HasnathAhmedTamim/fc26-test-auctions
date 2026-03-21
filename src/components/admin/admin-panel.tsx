"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";

type AuctionRoom = {
  roomId: string;
  name: string;
  status: string;
  budget: number;
  maxPlayers: number;
};

type ManagerRosterPlayer = {
  playerId: string;
  playerName: string;
  amount: number;
};

type ManagerRoster = {
  userId: string;
  userName: string;
  email: string;
  budgetSpent: number;
  playersBought: ManagerRosterPlayer[];
};

type PlayerOption = {
  id: string;
  name: string;
  position: string;
  rating: number;
  price: number;
  club: string;
};

const STATUS_STYLES: Record<string, string> = {
  live: "bg-emerald-500 text-black",
  sold: "bg-yellow-500 text-black",
  waiting: "bg-slate-700 text-white",
  paused: "bg-amber-500 text-black",
  ended: "bg-slate-600 text-slate-300",
};

export function AdminPanel() {
  const [rooms, setRooms] = useState<AuctionRoom[]>([]);
  const [players, setPlayers] = useState<PlayerOption[]>([]);
  const [managers, setManagers] = useState<ManagerRoster[]>([]);
  const [name, setName] = useState("");
  const [budget, setBudget] = useState("2000");
  const [maxPlayers, setMaxPlayers] = useState("24");
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [selectedManagerId, setSelectedManagerId] = useState("");
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [budgetManagerId, setBudgetManagerId] = useState("");
  const [budgetAdjustment, setBudgetAdjustment] = useState("");
  const [loading, setLoading] = useState(false);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [adjustingBudget, setAdjustingBudget] = useState(false);
  const [endingRoom, setEndingRoom] = useState("");
  const [removingKey, setRemovingKey] = useState("");
  const [error, setError] = useState("");
  const [rosterError, setRosterError] = useState("");
  const [adminMessage, setAdminMessage] = useState("");

  const roomStats = useMemo(() => {
    const totalSpent = managers.reduce((sum, m) => sum + m.budgetSpent, 0);
    const totalPlayers = managers.reduce((sum, m) => sum + m.playersBought.length, 0);
    return { totalSpent, totalPlayers };
  }, [managers]);

  const selectedPlayer = useMemo(
    () => players.find((player) => player.id === selectedPlayerId) ?? null,
    [players, selectedPlayerId]
  );

  async function fetchRooms() {
    const res = await fetch("/api/auction/rooms", { cache: "no-store" });
    const data = await res.json();
    const nextRooms = data.rooms ?? [];
    setRooms(nextRooms);
    setSelectedRoomId((prev) => {
      if (prev && nextRooms.some((room: AuctionRoom) => room.roomId === prev)) {
        return prev;
      }
      return nextRooms[0]?.roomId ?? "";
    });
  }

  async function fetchPlayers() {
    const res = await fetch("/api/players", { cache: "no-store" });
    const data = await res.json();
    setPlayers(data.players ?? []);
    setSelectedPlayerId((prev) => {
      if (prev && (data.players ?? []).some((player: PlayerOption) => player.id === prev)) {
        return prev;
      }
      return data.players?.[0]?.id ?? "";
    });
  }

  async function fetchManagerRoster(roomId: string) {
    if (!roomId) {
      setManagers([]);
      return;
    }

    setRosterLoading(true);
    setRosterError("");

    const res = await fetch(`/api/admin/manager-stats?roomId=${encodeURIComponent(roomId)}`, {
      cache: "no-store",
    });
    const data = await res.json();

    setRosterLoading(false);

    if (!res.ok) {
      setRosterError(data.error ?? "Failed to load manager rosters");
      return;
    }

    const nextManagers = data.managers ?? [];
    setManagers(nextManagers);
    setSelectedManagerId((prev) => {
      if (prev && nextManagers.some((manager: ManagerRoster) => manager.userId === prev)) {
        return prev;
      }
      return nextManagers[0]?.userId ?? "";
    });
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchRooms();
      void fetchPlayers();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchManagerRoster(selectedRoomId);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [selectedRoomId]);

  function handlePlayerChange(playerId: string) {
    setSelectedPlayerId(playerId);
    const player = players.find((entry) => entry.id === playerId);
    if (player) {
      setTransferAmount(String(player.price ?? 0));
    }
  }

  async function endRoom(roomId: string, action: "end" | "reset") {
    setEndingRoom(roomId + action);
    setAdminMessage("");
    const res = await fetch("/api/admin/manager-stats", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId, action }),
    });
    const data = await res.json();
    setEndingRoom("");
    if (!res.ok) {
      setError(data.error ?? "Failed to update room");
      return;
    }
    setAdminMessage(data.message ?? "Done.");
    fetchRooms();
  }

  async function adjustBudget() {
    if (!selectedRoomId || !budgetManagerId || budgetAdjustment === "") return;
    setAdjustingBudget(true);
    setRosterError("");
    setAdminMessage("");
    const res = await fetch("/api/admin/manager-stats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomId: selectedRoomId,
        userId: budgetManagerId,
        action: "adjust-budget",
        adjustment: Number(budgetAdjustment),
      }),
    });
    const data = await res.json();
    setAdjustingBudget(false);
    if (!res.ok) {
      setRosterError(data.error ?? "Failed to adjust budget");
      return;
    }
    setAdminMessage(data.message ?? "Budget adjusted.");
    setBudgetAdjustment("");
    await fetchManagerRoster(selectedRoomId);
  }

  async function createRoom(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auction/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        budget: Number(budget),
        maxPlayers: Number(maxPlayers),
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to create room");
      return;
    }

    setName("");
    setAdminMessage("Room created successfully.");
    fetchRooms();
  }

  async function assignPlayerToManager() {
    if (!selectedRoomId || !selectedManagerId || !selectedPlayerId) return;

    setAssigning(true);
    setRosterError("");
    setAdminMessage("");

    const res = await fetch("/api/admin/manager-stats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomId: selectedRoomId,
        userId: selectedManagerId,
        playerId: selectedPlayerId,
        action: "add",
        amount: Number(transferAmount),
      }),
    });

    const data = await res.json();
    setAssigning(false);

    if (!res.ok) {
      setRosterError(data.error ?? "Failed to assign player");
      return;
    }

    setAdminMessage(data.message ?? "Player assigned successfully.");
    await fetchManagerRoster(selectedRoomId);
  }

  async function removePlayerFromManager(userId: string, playerId: string) {
    setRemovingKey(`${userId}:${playerId}`);
    setRosterError("");
    setAdminMessage("");

    const res = await fetch("/api/admin/manager-stats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomId: selectedRoomId,
        userId,
        playerId,
        action: "remove",
      }),
    });

    const data = await res.json();
    setRemovingKey("");

    if (!res.ok) {
      setRosterError(data.error ?? "Failed to remove player");
      return;
    }

    setAdminMessage(data.message ?? "Player removed successfully.");
    await fetchManagerRoster(selectedRoomId);
  }

  return (
    <Container className="py-10">
      <h1 className="text-3xl font-black">Admin Panel</h1>
      <p className="mt-2 text-slate-400">
        Create rooms, control live auctions, and manually fix any squad ownership issue.
      </p>

      <div className="mt-10 grid gap-8 lg:grid-cols-[380px_1fr]">
        <div className="h-fit rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-bold">Create Auction Room</h2>
          <form onSubmit={createRoom} className="mt-5 space-y-4">
            <div>
              <label className="mb-1 block text-sm text-slate-300">Room Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-2 text-sm outline-none"
                placeholder="e.g. Elite Cup Room 1"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-300">
                Starting Budget (coins)
              </label>
              <input
                type="number"
                aria-label="Starting budget in coins"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-2 text-sm outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-300">Squad Limit</label>
              <input
                type="number"
                aria-label="Maximum squad size"
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-2 text-sm outline-none"
              />
            </div>
            {error ? <p className="text-sm text-red-400">{error}</p> : null}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 text-black hover:bg-emerald-400"
            >
              {loading ? "Creating..." : "Create Room"}
            </Button>
          </form>
        </div>

        <div>
          <h2 className="text-xl font-bold">Auction Rooms</h2>
          {rooms.length === 0 ? (
            <p className="mt-4 text-slate-400">
              No rooms yet. Create one to get started.
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              {rooms.map((room) => (
                <div
                  key={room.roomId}
                  className={`rounded-2xl border p-5 ${selectedRoomId === room.roomId ? "border-emerald-400/40 bg-emerald-500/5" : "border-white/10 bg-white/5"}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold">{room.name}</h3>
                      <p className="mt-1 text-sm text-slate-400">
                        ID: {room.roomId} &bull; Budget: {room.budget} coins &bull; Squad
                        limit: {room.maxPlayers}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_STYLES[room.status] ?? "bg-slate-700 text-white"}`}
                      >
                        {room.status.toUpperCase()}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="border-white/20 bg-transparent text-white hover:bg-white/10"
                        onClick={() => setSelectedRoomId(room.roomId)}
                      >
                        Manage Roster
                      </Button>
                      {room.status !== "ended" ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="border-amber-500/30 bg-transparent text-amber-300 hover:bg-amber-500/10"
                          disabled={endingRoom === room.roomId + "end"}
                          onClick={() => endRoom(room.roomId, "end")}
                        >
                          {endingRoom === room.roomId + "end" ? "Ending…" : "End Room"}
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="border-slate-500/30 bg-transparent text-slate-400 hover:bg-slate-500/10"
                          disabled={endingRoom === room.roomId + "reset"}
                          onClick={() => endRoom(room.roomId, "reset")}
                        >
                          {endingRoom === room.roomId + "reset" ? "Resetting…" : "Reset"}
                        </Button>
                      )}
                      <Link href={`/auction/${room.roomId}`}>
                        <Button
                          size="sm"
                          className="bg-emerald-500 text-black hover:bg-emerald-400"
                        >
                          Enter Room
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-10 grid gap-8 xl:grid-cols-[420px_1fr]">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">Roster Control</h2>
              <p className="mt-1 text-sm text-slate-400">
                Add a player to any manager if you need to correct an auction issue.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-white/20 bg-transparent text-white hover:bg-white/10"
              onClick={() => fetchManagerRoster(selectedRoomId)}
              disabled={!selectedRoomId || rosterLoading}
            >
              Refresh
            </Button>
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <label className="mb-1 block text-sm text-slate-300">Room</label>
              <select
                aria-label="Select room for roster management"
                value={selectedRoomId}
                onChange={(e) => setSelectedRoomId(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-2 text-sm outline-none"
              >
                <option value="">Select a room...</option>
                {rooms.map((room) => (
                  <option key={room.roomId} value={room.roomId}>
                    {room.name} ({room.roomId})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-300">Manager</label>
              <select
                aria-label="Select manager to update"
                value={selectedManagerId}
                onChange={(e) => setSelectedManagerId(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-2 text-sm outline-none"
                disabled={!selectedRoomId || managers.length === 0}
              >
                <option value="">Select a manager...</option>
                {managers.map((manager) => (
                  <option key={manager.userId} value={manager.userId}>
                    {manager.userName} {manager.email ? `(${manager.email})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-300">Player</label>
              <select
                aria-label="Select player to assign"
                value={selectedPlayerId}
                onChange={(e) => handlePlayerChange(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-2 text-sm outline-none"
                disabled={players.length === 0}
              >
                <option value="">Select a player...</option>
                {players.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.name} ({player.position}, {player.rating} OVR) - {player.price} coins
                  </option>
                ))}
              </select>
              {selectedPlayer ? (
                <p className="mt-2 text-xs text-slate-500">
                  {selectedPlayer.club} • default amount {selectedPlayer.price} coins
                </p>
              ) : null}
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-300">Transfer Amount</label>
              <input
                type="number"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-2 text-sm outline-none"
                placeholder="Enter the amount to add to spent budget"
              />
            </div>

            {adminMessage ? <p className="text-sm text-emerald-300">{adminMessage}</p> : null}
            {rosterError ? <p className="text-sm text-red-400">{rosterError}</p> : null}

            <Button
              type="button"
              disabled={assigning || !selectedRoomId || !selectedManagerId || !selectedPlayerId}
              className="w-full bg-blue-500 text-white hover:bg-blue-400"
              onClick={assignPlayerToManager}
            >
              {assigning ? "Assigning..." : "Add Player To Manager"}
            </Button>
          </div>

          <div className="mt-6 border-t border-white/10 pt-6">
            <h3 className="text-sm font-semibold text-slate-300">Adjust Budget</h3>
            <p className="mt-1 text-xs text-slate-500">
              Positive = add coins back, negative = deduct. Applies to spent budget.
            </p>
            <div className="mt-3 space-y-3">
              <select
                aria-label="Select manager to adjust budget"
                value={budgetManagerId}
                onChange={(e) => setBudgetManagerId(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-2 text-sm outline-none"
                disabled={!selectedRoomId || managers.length === 0}
              >
                <option value="">Select a manager…</option>
                {managers.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.userName} (spent: {m.budgetSpent})
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={budgetAdjustment}
                onChange={(e) => setBudgetAdjustment(e.target.value)}
                placeholder="e.g. -50 or 100"
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-2 text-sm outline-none"
              />
              <Button
                type="button"
                disabled={adjustingBudget || !selectedRoomId || !budgetManagerId || budgetAdjustment === ""}
                className="w-full bg-amber-500 text-black hover:bg-amber-400"
                onClick={adjustBudget}
              >
                {adjustingBudget ? "Adjusting…" : "Apply Budget Adjustment"}
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-bold">Manager Rosters</h2>
          <p className="mt-1 text-sm text-slate-400">
            Remove any player directly from a user if an auction result needs manual correction.
          </p>

          {selectedRoomId && managers.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-3">
              <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Total Spent</p>
                <p className="mt-1 text-lg font-black text-white">{roomStats.totalSpent} <span className="text-xs font-normal text-slate-400">coins</span></p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Players Sold</p>
                <p className="mt-1 text-lg font-black text-white">{roomStats.totalPlayers}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Managers</p>
                <p className="mt-1 text-lg font-black text-white">{managers.length}</p>
              </div>
            </div>
          ) : null}

          {!selectedRoomId ? (
            <p className="mt-4 text-slate-400">Select a room to manage its users.</p>
          ) : rosterLoading ? (
            <p className="mt-4 text-slate-400">Loading manager rosters...</p>
          ) : managers.length === 0 ? (
            <p className="mt-4 text-slate-400">No managers found for this room yet.</p>
          ) : (
            <div className="mt-6 space-y-4">
              {managers.map((manager) => (
                <div key={manager.userId} className="rounded-2xl border border-white/10 bg-slate-950/60 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-white">{manager.userName}</h3>
                      <p className="mt-1 text-sm text-slate-400">
                        {manager.email || "No email available"}
                      </p>
                    </div>
                    <div className="grid gap-2 text-right sm:grid-cols-2 sm:text-left">
                      <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Spent</p>
                        <p className="mt-1 text-lg font-black text-white">{manager.budgetSpent}</p>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Players</p>
                        <p className="mt-1 text-lg font-black text-white">{manager.playersBought.length}</p>
                      </div>
                    </div>
                  </div>

                  {manager.playersBought.length === 0 ? (
                    <p className="mt-4 text-sm text-slate-500">No players assigned to this manager.</p>
                  ) : (
                    <div className="mt-4 space-y-2">
                      {manager.playersBought.map((player) => {
                        const key = `${manager.userId}:${player.playerId}`;

                        return (
                          <div
                            key={key}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                          >
                            <div>
                              <p className="font-semibold text-white">{player.playerName}</p>
                              <p className="text-sm text-slate-400">{player.amount} coins</p>
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="border-red-500/30 bg-transparent text-red-300 hover:bg-red-500/10"
                              onClick={() => removePlayerFromManager(manager.userId, player.playerId)}
                              disabled={removingKey === key}
                            >
                              {removingKey === key ? "Removing..." : "Remove"}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Container>
  );
}
