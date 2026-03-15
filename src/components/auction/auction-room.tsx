"use client";

import { useEffect, useMemo, useState } from "react";
import { io, Socket } from "socket.io-client";
import { Button } from "@/components/ui/button";
import { AuctionRoomState, BidEntry } from "@/types/auction";

let socket: Socket | null = null;

type Props = {
  roomId: string;
  user: {
    id: string;
    name: string;
    role: "admin" | "manager";
  };
};

const initialState: AuctionRoomState = {
  roomId: "",
  status: "waiting",
  timer: 30,
  currentPlayer: null,
  currentBid: 0,
  highestBidderId: null,
  highestBidderName: null,
  bidHistory: [],
};

export function AuctionRoom({ roomId, user }: Props) {
  const [state, setState] = useState<AuctionRoomState>(initialState);
  const [bidAmount, setBidAmount] = useState("");
  const [error, setError] = useState("");

  const minNextBid = useMemo(() => state.currentBid + 10, [state.currentBid]);

  useEffect(() => {
    socket = io(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");

    socket.emit("auction:join", {
      roomId,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
      },
    });

    socket.on("auction:state", (payload: AuctionRoomState) => {
      setState(payload);
      setBidAmount(String((payload.currentBid ?? 0) + 10));
    });

    socket.on("auction:new-bid", (bid: BidEntry) => {
      setState((prev) => ({
        ...prev,
        bidHistory: [...prev.bidHistory, bid],
      }));
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
      setState((prev) => ({
        ...prev,
        status: payload.status,
        timer: payload.timer,
      }));
    });

    socket.on("auction:error", (payload) => {
      setError(payload.message ?? "Bid failed");
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

    socket?.emit("auction:bid", {
      roomId,
      userId: user.id,
      userName: user.name,
      amount,
    });
  }

  function startAuction() {
    socket?.emit("auction:start", { roomId });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400">Room</p>
            <h1 className="text-3xl font-black">Auction {roomId}</h1>
          </div>
          <span className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-bold text-black">
            {state.status.toUpperCase()}
          </span>
        </div>

        <div className="mt-8 rounded-3xl border border-white/10 bg-slate-900 p-6">
          <p className="text-sm text-slate-400">Current Player</p>
          {state.currentPlayer ? (
            <>
              <h2 className="mt-2 text-2xl font-black">
                {state.currentPlayer.name}
              </h2>
              <p className="mt-2 text-slate-300">
                {state.currentPlayer.position} • {state.currentPlayer.club} •{" "}
                {state.currentPlayer.nation}
              </p>
            </>
          ) : (
            <p className="mt-3 text-slate-300">
              Waiting for admin to load player...
            </p>
          )}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-slate-900 p-4">
            <p className="text-xs text-slate-400">Timer</p>
            <p className="mt-2 text-2xl font-black">{state.timer}s</p>
          </div>
          <div className="rounded-2xl bg-slate-900 p-4">
            <p className="text-xs text-slate-400">Current Bid</p>
            <p className="mt-2 text-2xl font-black">{state.currentBid}</p>
          </div>
          <div className="rounded-2xl bg-slate-900 p-4">
            <p className="text-xs text-slate-400">Leading</p>
            <p className="mt-2 text-2xl font-black">
              {state.highestBidderName ?? "None"}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <input
            aria-label="bidAmout"
            type="number"
            value={bidAmount}
            onChange={(e) => setBidAmount(e.target.value)}
            className="w-full max-w-xs rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 outline-none"
          />
          <Button
            onClick={submitBid}
            className="bg-emerald-500 text-black hover:bg-emerald-400"
          >
            Place Bid
          </Button>
          {user.role === "admin" ? (
            <Button
              onClick={startAuction}
              variant="outline"
              className="border-white/20 bg-transparent text-white hover:bg-white/10"
            >
              Start Auction
            </Button>
          ) : null}
        </div>

        {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-black">Live Bid Feed</h2>
        <div className="mt-4 space-y-3">
          {state.bidHistory.length === 0 ? (
            <p className="text-slate-400">No bids yet.</p>
          ) : (
            state.bidHistory
              .slice()
              .reverse()
              .map((bid, index) => (
                <div
                  key={`${bid.userId}-${bid.timestamp}-${index}`}
                  className="rounded-2xl bg-slate-900 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold">{bid.userName}</p>
                    <p className="font-bold text-emerald-400">{bid.amount}</p>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    {new Date(bid.timestamp).toLocaleString()}
                  </p>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
}