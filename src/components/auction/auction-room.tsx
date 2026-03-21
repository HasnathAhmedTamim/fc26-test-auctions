"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { io, Socket } from "socket.io-client";
import { Button } from "@/components/ui/button";
import { AuctionRoomState, BidEntry } from "@/types/auction";
import { LiveFeed } from "./live-feed";
import { BidPanel } from "./bid-panel";
import { AuctionPlayerDetails } from "./auction-player-details";
import { Player } from "@/types/player";

let socket: Socket | null = null;

type Props = {
  roomId: string;
  user: {
    id: string;
    name: string;
    role: "admin" | "manager";
  };
};

type ActivityItem = {
  id: string;
  message: string;
  tone?: "neutral" | "warn" | "success";
  timestamp: string;
};

type ManagerRoomState = {
  budgetLimit: number;
  budgetSpent: number;
  budgetLeft: number;
  maxPlayers: number;
  playersBought: number;
  squadSlotsLeft: number;
  auditEntries: Array<{
    id: string;
    message: string;
    timestamp: string;
  }>;
};

const initialState: AuctionRoomState = {
  roomId: "",
  status: "waiting",
  timer: 120,
  currentPlayer: null,
  currentBid: 0,
  highestBidderId: null,
  highestBidderName: null,
  bidHistory: [],
};

function timerColor(timer: number, isLive: boolean) {
  if (!isLive) return "text-slate-400";
  if (timer > 45) return "text-emerald-400";
  if (timer > 15) return "text-yellow-400";
  return "text-red-400 animate-pulse";
}

const STATUS_STYLES: Record<string, string> = {
  live: "bg-emerald-500 text-black",
  sold: "bg-yellow-500 text-black",
  waiting: "bg-slate-700 text-white",
  paused: "bg-amber-500 text-black",
  ended: "bg-slate-600 text-slate-300",
};

export function AuctionRoom({ roomId, user }: Props) {
  const [state, setState] = useState<AuctionRoomState>(initialState);
  const [bidAmount, setBidAmount] = useState("");
  const [error, setError] = useState("");
  const [notification, setNotification] = useState("");
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [playerPool, setPlayerPool] = useState<Player[]>([]);
  const [hasOptedOut, setHasOptedOut] = useState(false);
  const [playerSearch, setPlayerSearch] = useState("");
  const [activityLog, setActivityLog] = useState<ActivityItem[]>([]);
  const [soldPlayers, setSoldPlayers] = useState<
    Array<{ playerName: string; winnerName: string; amount: number; timestamp: string }>
  >([]);
  const [autoPauseAlert, setAutoPauseAlert] = useState<{
    leadingBidder: string;
    amount: number;
  } | null>(null);
  const [managerRoomState, setManagerRoomState] = useState<ManagerRoomState | null>(null);

  const isLive = state.status === "live";
  const minNextBid = useMemo(() => state.currentBid + 10, [state.currentBid]);
  const filteredPlayerPool = useMemo(() => {
    if (!playerSearch.trim()) return playerPool;
    const q = playerSearch.toLowerCase();
    return playerPool.filter(
      (p) => p.name.toLowerCase().includes(q) || p.position?.toLowerCase().includes(q)
    );
  }, [playerPool, playerSearch]);
  const maxAllowedBid = user.role === "manager" ? Math.max(0, managerRoomState?.budgetLeft ?? 0) : null;

  function showNotification(msg: string, duration = 5000) {
    setNotification(msg);
    setTimeout(() => setNotification(""), duration);
  }

  function pushActivity(message: string, tone: ActivityItem["tone"] = "neutral") {
    setActivityLog((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        message,
        tone,
        timestamp: new Date().toISOString(),
      },
    ]);
  }

  const loadManagerRoomState = useCallback(async () => {
    if (user.role !== "manager") return;

    const res = await fetch(`/api/auction/room/${encodeURIComponent(roomId)}/manager-state`, {
      cache: "no-store",
    });
    const data = await res.json();

    if (!res.ok) {
      return;
    }

    setManagerRoomState(data);
  }, [roomId, user.role]);

  const loadRoomHistory = useCallback(async () => {
    const res = await fetch(`/api/auction/room/${encodeURIComponent(roomId)}/state`, {
      cache: "no-store",
    });
    const data = await res.json();

    if (!res.ok) {
      return;
    }

    setSoldPlayers(data.soldPlayers ?? []);
  }, [roomId]);

  useEffect(() => {
    let cancelled = false;

    async function loadPlayers() {
      const res = await fetch("/api/players", { cache: "no-store" });
      const data = await res.json();
      if (!cancelled) {
        setPlayerPool(data.players ?? []);
      }
    }

    const timeoutId = window.setTimeout(() => {
      void loadPlayers();
      void loadManagerRoomState();
      void loadRoomHistory();
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [roomId, user.role, loadManagerRoomState, loadRoomHistory]);

  useEffect(() => {
    if (user.role !== "manager") return;

    const interval = window.setInterval(() => {
      void loadManagerRoomState();
    }, 4000);

    return () => window.clearInterval(interval);
  }, [roomId, user.role, loadManagerRoomState]);

  useEffect(() => {
    socket = io(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");

    socket.emit("auction:join", {
      roomId,
      user: { id: user.id, name: user.name, role: user.role },
    });

    socket.on("auction:state", (payload: AuctionRoomState) => {
      setState(payload);
      setBidAmount(String((payload.currentBid ?? 0) + 10));
      loadRoomHistory();
      loadManagerRoomState();
    });

    socket.on("auction:new-bid", (bid: BidEntry) => {
      setState((prev) => ({ ...prev, bidHistory: [...prev.bidHistory, bid] }));
      loadManagerRoomState();
    });

    socket.on("auction:bid-updated", (payload) => {
      setState((prev) => ({
        ...prev,
        currentBid: payload.currentBid,
        highestBidderId: payload.highestBidderId,
        highestBidderName: payload.highestBidderName,
      }));
      setBidAmount(String(payload.currentBid + 10));
      loadManagerRoomState();
    });

    socket.on("auction:started", (payload) => {
      setState((prev) => ({ ...prev, status: payload.status, timer: payload.timer }));
      pushActivity("Auction is live.");
      loadManagerRoomState();
    });

    socket.on("auction:paused", (payload) => {
      setState((prev) => ({ ...prev, status: payload.status, timer: payload.timer }));
      pushActivity("Auction paused by admin.", "warn");
      loadManagerRoomState();
    });

    socket.on("auction:timer-tick", ({ timer }: { timer: number }) => {
      setState((prev) => ({ ...prev, timer }));
    });

    socket.on("auction:player-set", ({ player, currentBid }) => {
      setState((prev) => ({
        ...prev,
        currentPlayer: player,
        currentBid,
        highestBidderId: null,
        highestBidderName: null,
        status: "waiting",
        timer: 120,
        bidHistory: [],
      }));
      setHasOptedOut(false);
      setBidAmount(String(currentBid + 10));
      pushActivity(`${player.name} is up for auction. Starting bid: ${currentBid + 10} coins.`);
      setAutoPauseAlert(null);
      loadManagerRoomState();
      showNotification(`${player.name} is up for auction — set a bid and start!`);
    });

    socket.on("auction:sold", ({ player, winnerName, amount }) => {
      setState((prev) => ({ ...prev, status: "sold" }));
      setAutoPauseAlert(null);
      setHasOptedOut(false);
      setSoldPlayers((prev) => [
        ...prev,
        {
          playerName: player.name,
          winnerName,
          amount,
          timestamp: new Date().toISOString(),
        },
      ]);
      pushActivity(`${winnerName} won ${player.name} for ${amount} coins.`, "success");
      loadManagerRoomState();
      loadRoomHistory();
      showNotification(
        `${player.name} sold to ${winnerName} for ${amount} coins!`,
        8000
      );
    });

    socket.on("auction:no-bid", ({ message }: { message: string }) => {
      setAutoPauseAlert(null);
      setState((prev) => ({
        ...prev,
        status: "waiting",
        currentPlayer: null,
        timer: 120,
      }));
      setHasOptedOut(false);
      pushActivity("No one bid for this player. Player skipped.", "warn");
      loadManagerRoomState();
      showNotification(message);
    });

    socket.on("auction:skipped", () => {
      setAutoPauseAlert(null);
      setState((prev) => ({
        ...prev,
        status: "waiting",
        currentPlayer: null,
        timer: 120,
      }));
      setHasOptedOut(false);
      pushActivity("Admin skipped the current player.", "warn");
      loadManagerRoomState();
      showNotification("Player skipped.");
    });

    socket.on("auction:you-opted-out", () => {
      setHasOptedOut(true);
      showNotification("You are out for this player. You can bid again on the next player.");
    });

    socket.on("auction:user-opted-out", ({ userName }) => {
      pushActivity(`${userName} is out for this player.`, "warn");
    });

    socket.on("auction:auto-paused", (payload: { status: string; timer: number; leadingBidder: string; amount: number }) => {
      setState((prev) => ({ ...prev, status: "paused", timer: payload.timer }));
      setAutoPauseAlert({ leadingBidder: payload.leadingBidder, amount: payload.amount });
      pushActivity(
        `All managers passed! ${payload.leadingBidder} leads at ${payload.amount} coins. Admin: sell now.`,
        "success"
      );
      loadManagerRoomState();
      if (user.role !== "admin") {
        showNotification(
          `All managers are out — ${payload.leadingBidder} is the only bidder. Waiting for admin to confirm.`,
          8000
        );
      }
    });

    socket.on("auction:error", (payload) => {
      setError(payload.message ?? "Something went wrong");
      setTimeout(() => setError(""), 4000);
    });

    return () => {
      socket?.disconnect();
      socket = null;
    };
  }, [roomId, user.id, user.name, user.role, loadManagerRoomState, loadRoomHistory]);

  function submitBid() {
    setError("");
    const amount = Number(bidAmount);
    if (!amount || amount < minNextBid) {
      setError(`Minimum next bid is ${minNextBid}`);
      return;
    }
    socket?.emit("auction:bid", { roomId, userId: user.id, userName: user.name, amount });
  }

  function startAuction() {
    socket?.emit("auction:start", { roomId });
  }

  function pauseAuction() {
    socket?.emit("auction:pause", { roomId });
  }

  function soldNow() {
    socket?.emit("auction:sold-now", { roomId });
  }

  function setPlayer() {
    if (!selectedPlayerId) return;
    const player = playerPool.find((p) => p.id === selectedPlayerId);
    if (!player) return;

    socket?.emit("auction:set-player", {
      roomId,
      player: {
        id: player.id,
        name: player.name,
        rating: player.rating,
        position: player.position,
        altPositions: player.position === "ST" ? ["CF"] : [player.position],
        club: player.club,
        league:
          player.club === "Real Madrid"
            ? "LALIGA EA SPORTS"
            : "Premier League",
        nation: player.nation,
        age: 27,
        preferredFoot: player.position.includes("L") ? "Left" : "Right",
        weakFoot: 4,
        skillMoves: 4,
        height: "178cm / 5'10\"",
        weight: "74kg / 163lb",
        image: player.image,
        basePrice: player.price,
        pace: player.pace,
        shooting: player.shooting,
        passing: player.passing,
        dribbling: player.dribbling,
        defending: player.defending,
        physicality: player.physical,
      },
    });
    setSelectedPlayerId("");
  }

  function skipPlayer() {
    socket?.emit("auction:skip", { roomId });
  }

  function optOutCurrentPlayer() {
    socket?.emit("auction:opt-out", {
      roomId,
      userId: user.id,
      userName: user.name,
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-12">
      {notification ? (
        <div className="col-span-full rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-3 font-semibold text-emerald-300">
          {notification}
        </div>
      ) : null}

      <div className="xl:col-span-5">
        <AuctionPlayerDetails player={state.currentPlayer} />
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 xl:col-span-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400">Room</p>
            <h1 className="text-3xl font-black">Auction {roomId}</h1>
          </div>
          <span
            className={`rounded-full px-4 py-2 text-sm font-bold ${STATUS_STYLES[state.status] ?? "bg-slate-700 text-white"}`}
          >
            {state.status.toUpperCase()}
          </span>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900 p-4">
          <p className="text-sm text-slate-400">Current Player</p>
          <p className="mt-1 text-xl font-bold text-white">
            {state.currentPlayer?.name ?? "No active player"}
          </p>
          <p className="text-sm text-slate-300">
            {state.currentPlayer
              ? `${state.currentPlayer.position} | ${state.currentPlayer.club}`
              : "Admin needs to set a player"}
          </p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-slate-900 p-4">
            <p className="text-xs text-slate-400">Timer</p>
            <p className={`mt-2 text-2xl font-black ${timerColor(state.timer, isLive)}`}>
              {state.timer}s
            </p>
          </div>
          <div className="rounded-2xl bg-slate-900 p-4">
            <p className="text-xs text-slate-400">Current Bid</p>
            <p className="mt-2 text-2xl font-black">{state.currentBid} coins</p>
          </div>
          <div className="rounded-2xl bg-slate-900 p-4">
            <p className="text-xs text-slate-400">Leading</p>
            <p className="mt-2 text-2xl font-black">{state.highestBidderName ?? "-"}</p>
          </div>
        </div>

        {user.role === "manager" && managerRoomState ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">Budget Left</p>
              <p className="mt-2 text-2xl font-black text-white">{managerRoomState.budgetLeft}</p>
              <p className="mt-1 text-xs text-emerald-100/80">
                {managerRoomState.budgetSpent} spent of {managerRoomState.budgetLimit}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Squad Slots</p>
              <p className="mt-2 text-2xl font-black text-white">{managerRoomState.squadSlotsLeft}</p>
              <p className="mt-1 text-xs text-slate-400">
                {managerRoomState.playersBought} used of {managerRoomState.maxPlayers}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Max Allowed Bid</p>
              <p className="mt-2 text-2xl font-black text-white">{maxAllowedBid}</p>
              <p className="mt-1 text-xs text-slate-400">Based on your remaining room budget</p>
            </div>
          </div>
        ) : null}

        <div className="mt-4 rounded-2xl border border-white/10 bg-slate-900/70 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Auction State</p>
          <p className="mt-2 text-lg font-bold text-white">
            {state.status === "live"
              ? "Bidding Live"
              : state.status === "paused"
                ? "Paused"
                : state.status === "sold"
                  ? "Sold"
                  : "Waiting"}
          </p>

          {user.role === "admin" && autoPauseAlert ? (
            <div className="mt-4 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">
                Auto Paused
              </p>
              <p className="mt-2 text-lg font-bold text-white">
                {autoPauseAlert.leadingBidder} is the last bidder standing.
              </p>
              <p className="mt-1 text-sm text-emerald-100/80">
                All other managers are out. Use Sold Now to award the player for {autoPauseAlert.amount} coins.
              </p>
            </div>
          ) : null}
        </div>

        <div className="mt-6">
          <BidPanel
            bidAmount={bidAmount}
            setBidAmount={setBidAmount}
            minNextBid={minNextBid}
            onBid={submitBid}
            error={error}
            disabled={
              !isLive ||
              !state.currentPlayer ||
              hasOptedOut ||
              (user.role === "manager" && (managerRoomState?.squadSlotsLeft ?? 0) <= 0)
            }
          />
          {user.role === "manager" && managerRoomState ? (
            <p className="mt-2 text-sm text-slate-400">
              Minimum next bid: {minNextBid} coins. Maximum you can bid right now: {maxAllowedBid} coins.
            </p>
          ) : null}
          {hasOptedOut ? (
            <p className="mt-2 text-sm text-amber-300">You opted out for this player.</p>
          ) : null}
          {user.role === "manager" && managerRoomState && managerRoomState.squadSlotsLeft <= 0 ? (
            <p className="mt-2 text-sm text-amber-300">
              Your squad is full for this room. You cannot place more bids.
            </p>
          ) : null}
        </div>

        {user.role !== "admin" && state.currentPlayer ? (
          <div className="mt-4">
            <Button
              onClick={optOutCurrentPlayer}
              disabled={!isLive || hasOptedOut}
              variant="outline"
              className="border-amber-500/30 bg-transparent text-amber-300 hover:bg-amber-500/10"
            >
              I am Out For This Player
            </Button>
          </div>
        ) : null}

        {user.role === "admin" ? (
          <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900 p-4">
            <p className="mb-3 text-sm font-semibold text-slate-300">Admin Controls</p>
            <div className="flex flex-wrap gap-3">
              <div className="flex min-w-60 flex-1 flex-col gap-1">
                <input
                  type="text"
                  value={playerSearch}
                  onChange={(e) => setPlayerSearch(e.target.value)}
                  placeholder="Search player by name or position…"
                  className="rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-sm outline-none placeholder:text-slate-500"
                />
                <select
                  value={selectedPlayerId}
                  onChange={(e) => setSelectedPlayerId(e.target.value)}
                  aria-label="Select player for auction"
                  className="rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-sm outline-none"
                >
                  <option value="">
                    {filteredPlayerPool.length === 0 ? "No matches" : `Select a player… (${filteredPlayerPool.length})`}
                  </option>
                  {filteredPlayerPool.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.position}, {p.rating} OVR) - {p.price} coins
                    </option>
                  ))}
                </select>
              </div>
              <Button
                onClick={setPlayer}
                disabled={!selectedPlayerId}
                className="bg-blue-500 text-white hover:bg-blue-400"
              >
                Set Player
              </Button>
              <Button
                onClick={startAuction}
                disabled={!state.currentPlayer || state.status === "live"}
                variant="outline"
                className="border-white/20 bg-transparent text-white hover:bg-white/10"
              >
                {state.status === "paused" ? "Resume" : "Start"}
              </Button>
              <Button
                onClick={pauseAuction}
                disabled={state.status !== "live"}
                variant="outline"
                className="border-amber-500/30 bg-transparent text-amber-300 hover:bg-amber-500/10"
              >
                Pause
              </Button>
              <Button
                onClick={soldNow}
                disabled={!(["live", "paused"].includes(state.status)) || !state.highestBidderId}
                variant="outline"
                className="border-emerald-500/30 bg-transparent text-emerald-300 hover:bg-emerald-500/10"
              >
                Sold Now
              </Button>
              <Button
                onClick={skipPlayer}
                disabled={!state.currentPlayer}
                variant="outline"
                className="border-red-500/30 bg-transparent text-red-400 hover:bg-red-500/10"
              >
                Skip
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="xl:col-span-3">
        <LiveFeed
          bidHistory={state.bidHistory}
          activityLog={activityLog}
          soldPlayers={soldPlayers}
          auditEntries={managerRoomState?.auditEntries}
        />
      </div>
    </div>
  );
}