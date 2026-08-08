"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AuctionRoomState, BidEntry } from "@/types/auction";
import { useAuctionSocket, type SocketConnectionStatus } from "@/hooks/use-auction-socket";
import { LiveFeed } from "./live-feed";
import { BidPanel } from "./bid-panel";
import { AuctionPlayerDetails } from "./auction-player-details";
import { AuctionPlayerPicker } from "./auction-player-picker";
import { Player } from "@/types/player";
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
  // Visual urgency tiers for active countdown: safe -> warning -> critical.
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

const SOCKET_STATUS_STYLES: Record<SocketConnectionStatus, string> = {
  connecting: "bg-amber-500/20 text-amber-300",
  connected: "bg-emerald-500/20 text-emerald-300",
  disconnected: "bg-red-500/20 text-red-300",
  error: "bg-red-500/20 text-red-300",
};

const SOCKET_STATUS_LABELS: Record<SocketConnectionStatus, string> = {
  connecting: "Connecting…",
  connected: "Live",
  disconnected: "Offline",
  error: "Connection error",
};
export function AuctionRoom({ roomId, user }: Props) {
  const [state, setState] = useState<AuctionRoomState>(initialState);
  const [bidAmount, setBidAmount] = useState("");
  const [error, setError] = useState("");
  const [notification, setNotification] = useState("");
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [playerPool, setPlayerPool] = useState<Player[]>([]);
  const [hasOptedOut, setHasOptedOut] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [soldPlayerIds, setSoldPlayerIds] = useState<Set<string>>(new Set());
  const [soldPlayerNames, setSoldPlayerNames] = useState<Set<string>>(new Set());
  const [activityLog, setActivityLog] = useState<ActivityItem[]>([]);  const [soldPlayers, setSoldPlayers] = useState<
    Array<{ playerName: string; winnerName: string; amount: number; timestamp: string }>
  >([]);
  const [autoPauseAlert, setAutoPauseAlert] = useState<{
    leadingBidder: string;
    amount: number;
  } | null>(null);
  const [managerRoomState, setManagerRoomState] = useState<ManagerRoomState | null>(null);

  const isLive = state.status === "live";
  // UI minimum uses the current fixed increment configured in realtime guards.
  const minNextBid = useMemo(() => state.currentBid + 10, [state.currentBid]);
  const maxAllowedBid = user.role === "manager" ? Math.max(0, managerRoomState?.budgetLeft ?? 0) : null;
  function showNotification(msg: string, duration = 5000) {
    // Ephemeral banner for action confirmations and room events.
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

    setRoomName(String(data.room?.name ?? roomId));
    setSoldPlayers(
      (data.soldPlayers ?? []).map(
        (item: { playerName: string; winnerName: string; amount: number; timestamp: string }) => ({
          playerName: item.playerName,
          winnerName: item.winnerName,
          amount: item.amount,
          timestamp: item.timestamp,
        })
      )
    );
    setSoldPlayerIds(new Set((data.soldPlayerIds ?? []) as string[]));
    setSoldPlayerNames(new Set((data.soldPlayerNames ?? []) as string[]));
  }, [roomId]);
  useEffect(() => {
    let cancelled = false;

    async function loadPlayers() {
      const all: Player[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const res = await fetch(`/api/players?limit=200&page=${page}`, { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) break;

        all.push(...(data.players ?? []));
        hasMore = Boolean(data.hasMore);
        page += 1;
      }

      if (!cancelled) {
        setPlayerPool(all);
      }
    }

    const timeoutId = window.setTimeout(() => {
      // Defer initial network calls to avoid synchronous setState-in-effect lint violations.
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

    // Polling keeps budget/slot counters fresh between websocket events.
    const interval = window.setInterval(() => {
      void loadManagerRoomState();
    }, 4000);

    return () => window.clearInterval(interval);
  }, [roomId, user.role, loadManagerRoomState]);

  const socketActions = useAuctionSocket(roomId, user, {    onState: (payload) => {
      setState(payload);
      setBidAmount(String((payload.currentBid ?? 0) + 10));
      loadRoomHistory();
      loadManagerRoomState();
    },
    onNewBid: (bid) => {
      setState((prev) => ({ ...prev, bidHistory: [...prev.bidHistory, bid] }));
      loadManagerRoomState();
    },
    onBidUpdated: (payload) => {
      setState((prev) => ({
        ...prev,
        currentBid: payload.currentBid,
        highestBidderId: payload.highestBidderId,
        highestBidderName: payload.highestBidderName,
      }));
      setBidAmount(String(payload.currentBid + 10));
      loadManagerRoomState();
    },
    onStarted: (payload) => {
      setState((prev) => ({ ...prev, status: payload.status as AuctionRoomState["status"], timer: payload.timer }));
      pushActivity("Auction is live.");
      loadManagerRoomState();
    },
    onPaused: (payload) => {
      setState((prev) => ({ ...prev, status: payload.status as AuctionRoomState["status"], timer: payload.timer }));
      pushActivity("Auction paused by admin.", "warn");
      loadManagerRoomState();
    },
    onTimerTick: ({ timer }) => {
      setState((prev) => ({ ...prev, timer }));
    },
    onPlayerSet: ({ player, currentBid }) => {
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
      if (player) {
        pushActivity(`${player.name} is up for auction. Starting bid: ${currentBid + 10} coins.`);
        showNotification(`${player.name} is up for auction — set a bid and start!`);
      }
      setAutoPauseAlert(null);
      loadManagerRoomState();
    },
    onSold: ({ player, winnerName, amount }) => {
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
      setSoldPlayerIds((prev) => new Set([...prev, String(player.id)]));
      setSoldPlayerNames((prev) => new Set([...prev, player.name.trim().toLowerCase()]));      pushActivity(`${winnerName} won ${player.name} for ${amount} coins.`, "success");
      loadManagerRoomState();
      loadRoomHistory();
      showNotification(`${player.name} sold to ${winnerName} for ${amount} coins!`, 8000);
    },
    onNoBid: ({ message }) => {
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
    },
    onSkipped: () => {
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
    },
    onYouOptedOut: () => {
      setHasOptedOut(true);
      showNotification("You are out for this player. You can bid again on the next player.");
    },
    onUserOptedOut: ({ userName }) => {
      pushActivity(`${userName} is out for this player.`, "warn");
    },
    onAutoPaused: (payload) => {
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
    },
    onError: (payload) => {
      setError(payload.message ?? "Something went wrong");
      setTimeout(() => setError(""), 4000);
    },
  });

  function submitBid() {
    setError("");
    const amount = Number(bidAmount);
    if (!amount || amount < minNextBid) {
      setError(`Minimum next bid is ${minNextBid}`);
      return;
    }
    socketActions.emitBid(amount);
  }

  function startAuction() {
    socketActions.emitStart();
  }

  function pauseAuction() {
    socketActions.emitPause();
  }

  function soldNow() {
    socketActions.emitSoldNow();
  }

  function setPlayer() {
    if (!selectedPlayerId) return;
    const player = playerPool.find((p) => p.id === selectedPlayerId);
    if (!player) return;

    socketActions.emitSetPlayer({
      id: player.id,
      name: player.name,
      rating: player.rating,
      position: player.position,
      altPositions: player.position === "ST" ? ["CF"] : [player.position],
      club: player.club,
      league: player.league ?? "Unknown League",
      nation: player.nation,      age: 27,
      preferredFoot: player.position.includes("L") ? "Left" : "Right",
      weakFoot: 4,
      skillMoves: 4,
      height: "178cm / 5'10\"",
      weight: "74kg / 163lb",
      image: player.image,
      basePrice: player.basePrice ?? player.price,
      pace: player.pace,
      shooting: player.shooting,
      passing: player.passing,
      dribbling: player.dribbling,
      defending: player.defending,
      physicality: player.physical,
    });
    setSelectedPlayerId("");
  }

  function skipPlayer() {
    socketActions.emitSkip();
  }

  function optOutCurrentPlayer() {
    socketActions.emitOptOut();
  }

  return (
    <div className="grid gap-6 xl:grid-cols-12">
      <div className="col-span-full flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/dashboard"
          className="text-sm text-slate-400 transition hover:text-emerald-300"
        >
          ← Back to dashboard
        </Link>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${SOCKET_STATUS_STYLES[socketActions.connectionStatus]}`}
        >
          {SOCKET_STATUS_LABELS[socketActions.connectionStatus]}
        </span>
      </div>

      {socketActions.connectionStatus === "error" || socketActions.connectionStatus === "disconnected" ? (
        <div className="col-span-full rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-3 text-sm text-red-200">
          Real-time auction updates are unavailable. Refresh the page or confirm the server is running with{" "}
          <code className="rounded bg-black/30 px-1">npm run dev</code>.
        </div>
      ) : null}

      {notification ? (
        <div className="col-span-full rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-3 font-semibold text-emerald-300">
          {notification}
        </div>
      ) : null}

      <div className="order-2 xl:order-none xl:col-span-5">
        <AuctionPlayerDetails player={state.currentPlayer} />
      </div>

      <div className="order-1 rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-6 xl:order-none xl:col-span-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm text-slate-400">Room</p>
            <h1 className="truncate text-2xl font-black sm:text-3xl">{roomName || `Auction ${roomId}`}</h1>
            <p className="mt-1 text-xs text-slate-500">ID: {roomId}</p>
          </div>
          <span
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${STATUS_STYLES[state.status] ?? "bg-slate-700 text-white"}`}
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

        <div className="mt-6 grid gap-3 sm:grid-cols-3 sm:gap-4">
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
          <div className="mt-4 grid gap-3 sm:grid-cols-3 sm:gap-4">
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
            maxBid={maxAllowedBid}
            onBid={submitBid}
            error={error}
            disabled={              !isLive ||
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
            <div className="flex flex-wrap items-end gap-3">
              <AuctionPlayerPicker
                players={playerPool}
                soldPlayerIds={soldPlayerIds}
                soldPlayerNames={soldPlayerNames}
                value={selectedPlayerId}
                onChange={setSelectedPlayerId}
              />
              <Button                onClick={setPlayer}
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

      <div className="order-3 xl:col-span-3">
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