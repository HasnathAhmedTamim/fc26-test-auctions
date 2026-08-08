"use client";

import { useEffect, useRef, useState } from "react";

export type SocketConnectionStatus = "connecting" | "connected" | "disconnected" | "error";
import { io, Socket } from "socket.io-client";
import { AuctionRoomState, BidEntry } from "@/types/auction";
import { AUCTION_SOCKET_EVENTS as E } from "@/lib/auction/constants";
import { getSocketServerUrl } from "@/lib/auction/socket-url";

type AuctionSocketUser = {
  id: string;
  name: string;
  role: "admin" | "manager";
};

type AuctionSocketHandlers = {
  onState: (payload: AuctionRoomState) => void;
  onNewBid: (bid: BidEntry) => void;
  onBidUpdated: (payload: {
    currentBid: number;
    highestBidderId: string;
    highestBidderName: string;
  }) => void;
  onStarted: (payload: { status: string; timer: number }) => void;
  onPaused: (payload: { status: string; timer: number }) => void;
  onTimerTick: (payload: { timer: number }) => void;
  onPlayerSet: (payload: { player: AuctionRoomState["currentPlayer"]; currentBid: number }) => void;
  onSold: (payload: {
    player: NonNullable<AuctionRoomState["currentPlayer"]>;
    winnerId: string;
    winnerName: string;
    amount: number;
  }) => void;
  onNoBid: (payload: { message: string }) => void;
  onSkipped: () => void;
  onYouOptedOut: () => void;
  onUserOptedOut: (payload: { userId: string; userName: string }) => void;
  onAutoPaused: (payload: {
    status: string;
    timer: number;
    leadingBidder: string;
    amount: number;
  }) => void;
  onError: (payload: { message?: string }) => void;
};

export function useAuctionSocket(
  roomId: string,
  user: AuctionSocketUser,
  handlers: AuctionSocketHandlers
) {
  const socketRef = useRef<Socket | null>(null);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;
  const [connectionStatus, setConnectionStatus] = useState<SocketConnectionStatus>("connecting");

  useEffect(() => {
    setConnectionStatus("connecting");
    const socket = io(getSocketServerUrl(), {
      transports: ["websocket", "polling"],
      withCredentials: true,
    });
    socketRef.current = socket;

    socket.on("connect", () => setConnectionStatus("connected"));
    socket.on("disconnect", () => setConnectionStatus("disconnected"));
    socket.on("connect_error", () => setConnectionStatus("error"));

    socket.emit(E.JOIN, {
      roomId,
      user: { id: user.id, name: user.name, role: user.role },
    });

    socket.on(E.STATE, (payload) => handlersRef.current.onState(payload));
    socket.on(E.NEW_BID, (bid) => handlersRef.current.onNewBid(bid));
    socket.on(E.BID_UPDATED, (payload) => handlersRef.current.onBidUpdated(payload));
    socket.on(E.STARTED, (payload) => handlersRef.current.onStarted(payload));
    socket.on(E.PAUSED, (payload) => handlersRef.current.onPaused(payload));
    socket.on(E.TIMER_TICK, (payload) => handlersRef.current.onTimerTick(payload));
    socket.on(E.PLAYER_SET, (payload) => handlersRef.current.onPlayerSet(payload));
    socket.on(E.SOLD, (payload) => handlersRef.current.onSold(payload));
    socket.on(E.NO_BID, (payload) => handlersRef.current.onNoBid(payload));
    socket.on(E.SKIPPED, () => handlersRef.current.onSkipped());
    socket.on(E.YOU_OPTED_OUT, () => handlersRef.current.onYouOptedOut());
    socket.on(E.USER_OPTED_OUT, (payload) => handlersRef.current.onUserOptedOut(payload));
    socket.on(E.AUTO_PAUSED, (payload) => handlersRef.current.onAutoPaused(payload));
    socket.on(E.ERROR, (payload) => handlersRef.current.onError(payload));

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [roomId, user.id, user.name, user.role]);

  function emit<EventPayload>(event: string, payload?: EventPayload) {
    socketRef.current?.emit(event, payload);
  }

  return {
    connectionStatus,
    emitBid: (amount: number) => emit(E.BID, { roomId, userId: user.id, userName: user.name, amount }),
    emitStart: () => emit(E.START, { roomId }),
    emitPause: () => emit(E.PAUSE, { roomId }),
    emitSoldNow: () => emit(E.SOLD_NOW, { roomId }),
    emitSetPlayer: (player: Record<string, unknown>) => emit(E.SET_PLAYER, { roomId, player }),
    emitSkip: () => emit(E.SKIP, { roomId }),
    emitOptOut: () => emit(E.OPT_OUT, { roomId, userId: user.id, userName: user.name }),
  };
}
