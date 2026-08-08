"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAdminPanelContext } from "./admin-panel-context";
import { STATUS_STYLES } from "./constants";

export function RosterTab() {
  const ctx = useAdminPanelContext();
  return (
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
              onClick={() => ctx.fetchManagerRoster(ctx.selectedRoomId)}
              disabled={!ctx.selectedRoomId || ctx.rosterLoading}
            >
              Refresh
            </Button>
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <label className="mb-1 block text-sm text-slate-300">Room</label>
              <select
                aria-label="Select room for roster management"
                value={ctx.selectedRoomId}
                onChange={(e) => ctx.setSelectedRoomId(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-2 text-sm outline-none"
              >
                <option value="">Select a room...</option>
                {ctx.rooms.map((room) => (
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
                value={ctx.selectedManagerId}
                onChange={(e) => ctx.setSelectedManagerId(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-2 text-sm outline-none"
                disabled={!ctx.selectedRoomId || ctx.managers.length === 0}
              >
                <option value="">Select a manager...</option>
                {ctx.managers.map((manager) => (
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
                value={ctx.selectedPlayerId}
                onChange={(e) => ctx.handlePlayerChange(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-2 text-sm outline-none"
                disabled={ctx.players.length === 0}
              >
                <option value="">Select a player...</option>
                {ctx.players.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.name} ({player.position}, {player.rating} OVR) - {player.price} coins
                  </option>
                ))}
              </select>
              {ctx.selectedPlayer ? (
                <p className="mt-2 text-xs text-slate-500">
                  {ctx.selectedPlayer.club} • default amount {ctx.selectedPlayer.price} coins
                </p>
              ) : null}
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-300">Transfer Amount</label>
              <input
                type="number"
                value={ctx.transferAmount}
                onChange={(e) => ctx.setTransferAmount(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-2 text-sm outline-none"
                placeholder="Enter the amount to add to spent budget"
              />
            </div>

            {ctx.adminMessage ? <p className="text-sm text-emerald-300">{ctx.adminMessage}</p> : null}
            {ctx.rosterError ? <p className="text-sm text-red-400">{ctx.rosterError}</p> : null}

            <Button
              type="button"
              disabled={ctx.assigning || !ctx.selectedRoomId || !ctx.selectedManagerId || !ctx.selectedPlayerId}
              className="w-full bg-blue-500 text-white hover:bg-blue-400"
              onClick={ctx.assignPlayerToManager}
            >
              {ctx.assigning ? "Assigning..." : "Add Player To Manager"}
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
                value={ctx.budgetManagerId}
                onChange={(e) => ctx.setBudgetManagerId(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-2 text-sm outline-none"
                disabled={!ctx.selectedRoomId || ctx.managers.length === 0}
              >
                <option value="">Select a manager…</option>
                {ctx.managers.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.userName} (spent: {m.budgetSpent})
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={ctx.budgetAdjustment}
                onChange={(e) => ctx.setBudgetAdjustment(e.target.value)}
                placeholder="e.g. -50 or 100"
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-2 text-sm outline-none"
              />
              <Button
                type="button"
                disabled={ctx.adjustingBudget || !ctx.selectedRoomId || !ctx.budgetManagerId || ctx.budgetAdjustment === ""}
                className="w-full bg-amber-500 text-black hover:bg-amber-400"
                onClick={ctx.adjustBudget}
              >
                {ctx.adjustingBudget ? "Adjusting…" : "Apply Budget Adjustment"}
              </Button>
            </div>
          </div>

        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-bold">Manager Rosters</h2>
          <p className="mt-1 text-sm text-slate-400">
            Remove any player directly from a user if an auction result needs manual correction.
          </p>

          {ctx.selectedRoomId && ctx.managers.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-3">
              <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Total Spent</p>
                <p className="mt-1 text-lg font-black text-white">{ctx.roomStats.totalSpent} <span className="text-xs font-normal text-slate-400">coins</span></p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Players Sold</p>
                <p className="mt-1 text-lg font-black text-white">{ctx.roomStats.totalPlayers}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Managers</p>
                <p className="mt-1 text-lg font-black text-white">{ctx.managers.length}</p>
              </div>
            </div>
          ) : null}

          {!ctx.selectedRoomId ? (
            <p className="mt-4 text-slate-400">Select a room to manage its ctx.users.</p>
          ) : ctx.rosterLoading ? (
            <p className="mt-4 text-slate-400">Loading manager rosters...</p>
          ) : ctx.managers.length === 0 ? (
            <p className="mt-4 text-slate-400">No ctx.managers found for this room yet.</p>
          ) : (
            <div className="mt-6 space-y-4">
              {ctx.managers.map((manager) => (
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
                    <p className="mt-4 text-sm text-slate-500">No ctx.players assigned to this manager.</p>
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
                              onClick={() => ctx.removePlayerFromManager(manager.userId, player.playerId)}
                              disabled={ctx.removingKey === key}
                            >
                              {ctx.removingKey === key ? "Removing..." : "Remove"}
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
  );
}
