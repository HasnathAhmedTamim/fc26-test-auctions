"use client";

import { useEffect, useMemo, useState } from "react";
import { io, Socket } from "socket.io-client";
import { Button } from "@/components/ui/button";
import { AuctionRoomState, BidEntry } from "@/types/auction";
import { LiveFeed } from "./live-feed";
import { BidPanel } from "./bid-panel";
import { players } from "@/data/players";

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
  if (timer > 15) return "text-emerald-400";
  if (timer > 5) return "text-yellow-400";
  return "text-red-400 animate-pulse";
}

const STATUS_STYLES: Record<string, string> = {
  live: "bg-emerald-500 text-black",
  sold: "bg-yellow-500 text-black",
  waiting: "bg-slate-700 text-white",
  ended: "bg-slate-600 text-slate-300",
};

export function AuctionRoom({ roomId, user }: Props) {
  const [state, setState] = useState<AuctionRoomState>(initialState);
  const [bidAmount, setBidAmount] = useState("");
  const [error, setError] = useState("");
  const [notification, setNotification] = useState("");
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [hasOptedOut, setHasOptedOut] = useState(false);
  const [activityLog, setActivityLog] = useState<ActivityItem[]>([]);

  const isLive = state.status === "live";
  const minNextBid = useMemo(() => state.currentBid + 10, [state.currentBid]);

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

  useEffect(() => {
    socket = io(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");

    socket.emit("auction:join", {
      roomId,
      user: { id: user.id, name: user.name, role: user.role },
    });

    socket.on("auction:state", (payload: AuctionRoomState) => {
      setState(payload);
      setBidAmount(String((payload.currentBid ?? 0) + 10));
    });

    socket.on("auction:new-bid", (bid: BidEntry) => {
      setState((prev) => ({ ...prev, bidHistory: [...prev.bidHistory, bid] }));
    });

    socket.on("auction:bid-updated", (payload) => {
      setState((prev) => ({
        ...prev,
        currentBid: payload.currentBid,
        highestBidderId: payload.highestBidderId,
        highestBidderName: payload.highestBidderName,
      }));
      setBidAmount(String(payload.currentBid + 10));
    });

    socket.on("auction:started", (payload) => {
      setState((prev) => ({ ...prev, status: payload.status, timer: payload.timer }));
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
      showNotification(`${player.name} is up for auction — set a bid and start!`);
    });

    socket.on("auction:sold", ({ player, winnerName, amount }) => {
      setState((prev) => ({ ...prev, status: "sold" }));
      setHasOptedOut(false);
      pushActivity(`${winnerName} won ${player.name} for ${amount} coins.`, "success");
      showNotification(
        `🏆 ${player.name} sold to ${winnerName} for ${amount} coins!`,
        8000
      );
    });

    socket.on("auction:no-bid", ({ message }: { message: string }) => {
      setState((prev) => ({
        ...prev,
        status: "waiting",
        currentPlayer: null,
        timer: 120,
      }));
      setHasOptedOut(false);
      pushActivity("No one bid for this player. Player skipped.", "warn");
      showNotification(message);
    });

    socket.on("auction:skipped", () => {
      setState((prev) => ({
        ...prev,
        status: "waiting",
        currentPlayer: null,
        timer: 120,
      }));
      setHasOptedOut(false);
      pushActivity("Admin skipped the current player.", "warn");
      showNotification("Player skipped.");
    });

    socket.on("auction:you-opted-out", () => {
      setHasOptedOut(true);
      showNotification("You are out for this player. You can bid again on the next player.");
    });

    socket.on("auction:user-opted-out", ({ userName }) => {
      pushActivity(`${userName} is out for this player.`, "warn");
    });

    socket.on("auction:error", (payload) => {
      setError(payload.message ?? "Something went wrong");
      setTimeout(() => setError(""), 4000);
    });

    return () => {
      socket?.disconnect();
      socket = null;
    };
  }, [roomId, user.id, user.name, user.role]);

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

  function setPlayer() {
    if (!selectedPlayerId) return;
    const player = players.find((p) => p.id === selectedPlayerId);
    if (!player) return;
    socket?.emit("auction:set-player", {
      roomId,
      player: {
        id: player.id,
        name: player.name,
        rating: player.rating,
        position: player.position,
        club: player.club,
        nation: player.nation,
        image: player.image,
        basePrice: player.price,
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
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      {notification && (
        <div className="col-span-full rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-3 font-semibold text-emerald-300">
          {notification}
        </div>
      )}

      {/* Main panel */}
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
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

        {/* Current player card */}
        <div className="mt-8 rounded-3xl border border-white/10 bg-slate-900 p-6">
          <p className="text-sm text-slate-400">Current Player</p>
          {state.currentPlayer ? (
            <>
              <h2 className="mt-2 text-2xl font-black">{state.currentPlayer.name}</h2>
              <p className="mt-1 text-slate-300">
                {state.currentPlayer.position} &bull; {state.currentPlayer.club} &bull;{" "}
                {state.currentPlayer.nation}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-300">
                  {state.currentPlayer.rating} OVR
                </span>
                <span className="rounded-full border border-white/10 px-3 py-1 text-sm text-slate-300">
                  Base: {state.currentPlayer.basePrice} coins
                </span>
              </div>
            </>
          ) : (
            <p className="mt-3 text-slate-400">Waiting for admin to set a player...</p>
          )}
        </div>

        {/* Stats row */}
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
            <p className="mt-2 text-2xl font-black">
              {state.highestBidderName ?? "—"}
            </p>
          </div>
        </div>

        {/* Bid panel */}
        <div className="mt-6">
          <BidPanel
            bidAmount={bidAmount}
            setBidAmount={setBidAmount}
            minNextBid={minNextBid}
            onBid={submitBid}
            error={error}
            disabled={!isLive || !state.currentPlayer || hasOptedOut}
          />
          {hasOptedOut ? (
            <p className="mt-2 text-sm text-amber-300">
              You opted out for this player.
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

        {/* Admin controls */}
        {user.role === "admin" && (
          <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900 p-4">
            <p className="mb-3 text-sm font-semibold text-slate-300">Admin Controls</p>
            <div className="flex flex-wrap gap-3">
              <select
                value={selectedPlayerId}
                onChange={(e) => setSelectedPlayerId(e.target.value)}
                aria-label="Select player for auction"
                className="min-w-50 flex-1 rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-sm outline-none"
              >
                <option value="">Select a player...</option>
                {players.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.position}, {p.rating} OVR) — {p.price} coins
                  </option>
                ))}
              </select>
              <Button
                onClick={setPlayer}
                disabled={!selectedPlayerId}
                className="bg-blue-500 text-white hover:bg-blue-400"
              >
                Set Player
              </Button>
              <Button
                onClick={startAuction}
                disabled={!state.currentPlayer || isLive}
                variant="outline"
                className="border-white/20 bg-transparent text-white hover:bg-white/10"
              >
                Start
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
        )}
      </div>

      {/* Live feed */}
      <LiveFeed bidHistory={state.bidHistory} activityLog={activityLog} />
    </div>
  );
}