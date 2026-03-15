"use client";

import { useEffect, useState } from "react";
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

const STATUS_STYLES: Record<string, string> = {
  live: "bg-emerald-500 text-black",
  sold: "bg-yellow-500 text-black",
  waiting: "bg-slate-700 text-white",
  ended: "bg-slate-600 text-slate-300",
};

export function AdminPanel() {
  const [rooms, setRooms] = useState<AuctionRoom[]>([]);
  const [name, setName] = useState("");
  const [budget, setBudget] = useState("2000");
  const [maxPlayers, setMaxPlayers] = useState("24");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function fetchRooms() {
    const res = await fetch("/api/auction/rooms");
    const data = await res.json();
    setRooms(data.rooms ?? []);
  }

  useEffect(() => {
    fetch("/api/auction/rooms")
      .then((res) => res.json())
      .then((data) => setRooms(data.rooms ?? []));
  }, []);

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
    fetchRooms();
  }

  return (
    <Container className="py-10">
      <h1 className="text-3xl font-black">Admin Panel</h1>
      <p className="mt-2 text-slate-400">
        Create and manage auction rooms. Enter a room to control the live auction.
      </p>

      <div className="mt-10 grid gap-8 lg:grid-cols-[380px_1fr]">
        {/* Create Room Form */}
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
            {error && <p className="text-sm text-red-400">{error}</p>}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 text-black hover:bg-emerald-400"
            >
              {loading ? "Creating..." : "Create Room"}
            </Button>
          </form>
        </div>

        {/* Rooms List */}
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
                  className="rounded-2xl border border-white/10 bg-white/5 p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold">{room.name}</h3>
                      <p className="mt-1 text-sm text-slate-400">
                        ID: {room.roomId} &bull; Budget: {room.budget} coins &bull; Squad
                        limit: {room.maxPlayers}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_STYLES[room.status] ?? "bg-slate-700 text-white"}`}
                      >
                        {room.status.toUpperCase()}
                      </span>
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
    </Container>
  );
}
