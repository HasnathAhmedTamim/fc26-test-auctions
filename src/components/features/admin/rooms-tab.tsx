"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AdminTabSkeleton } from "@/components/features/admin/admin-tab-skeleton";
import { useAdminPanelContext } from "./admin-panel-context";
import { STATUS_STYLES } from "./constants";

export function RoomsTab() {
  const ctx = useAdminPanelContext();
  return (
<div className="mt-10 grid gap-8 lg:grid-cols-[380px_1fr]">
        <div className="h-fit rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-bold">Create Auction Room</h2>
          <form onSubmit={ctx.createRoom} className="mt-5 space-y-4">
            <div>
              <label className="mb-1 block text-sm text-slate-300">Room Name</label>
              <input
                value={ctx.name}
                onChange={(e) => ctx.setName(e.target.value)}
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
                value={ctx.budget}
                onChange={(e) => ctx.setBudget(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-2 text-sm outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-300">Squad Limit</label>
              <input
                type="number"
                aria-label="Maximum squad size"
                value={ctx.maxPlayers}
                onChange={(e) => ctx.setMaxPlayers(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-2 text-sm outline-none"
              />
            </div>
            {ctx.error ? <p className="text-sm text-red-400">{ctx.error}</p> : null}
            <Button
              type="submit"
              disabled={ctx.loading}
              className="w-full bg-emerald-500 text-black hover:bg-emerald-400"
            >
              {ctx.loading ? "Creating..." : "Create Room"}
            </Button>
          </form>
        </div>

        <div>
          <h2 className="text-xl font-bold">Auction Rooms</h2>
          {ctx.rooms.length === 0 ? (
            <p className="mt-4 text-slate-400">
              No rooms yet. Create one to get started.
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              {ctx.rooms.map((room) => (
                <div
                  key={room.roomId}
                  className={`rounded-2xl border p-5 ${ctx.selectedRoomId === room.roomId ? "border-emerald-400/40 bg-emerald-500/5" : "border-white/10 bg-white/5"}`}
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
                        onClick={() => {
                          ctx.setSelectedRoomId(room.roomId);
                          ctx.setActiveAdminView("roster");
                        }}
                      >
                        Manage Roster
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="border-emerald-500/30 bg-transparent text-emerald-300 hover:bg-emerald-500/10"
                        onClick={() => {
                          if (ctx.activeAccessRoomId === room.roomId) {
                            ctx.setActiveAccessRoomId("");
                            ctx.setRoomAccessManagers([]);
                            return;
                          }

                          ctx.setActiveAccessRoomId(room.roomId);
                          void ctx.fetchRoomAccess(room.roomId);
                        }}
                      >
                        {ctx.activeAccessRoomId === room.roomId ? "Hide Access" : "Room Access"}
                      </Button>
                      {room.status !== "ended" ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="border-amber-500/30 bg-transparent text-amber-300 hover:bg-amber-500/10"
                          disabled={ctx.endingRoom === room.roomId + "end"}
                          onClick={() => ctx.endRoom(room.roomId, "end")}
                        >
                          {ctx.endingRoom === room.roomId + "end" ? "Ending…" : "End Room"}
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="border-slate-500/30 bg-transparent text-slate-400 hover:bg-slate-500/10"
                          disabled={ctx.endingRoom === room.roomId + "reset"}
                          onClick={() => ctx.endRoom(room.roomId, "reset")}
                        >
                          {ctx.endingRoom === room.roomId + "reset" ? "Resetting…" : "Reset"}
                        </Button>
                      )}
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="border-red-500/30 bg-transparent text-red-300 hover:bg-red-500/10"
                        onClick={() => ctx.deleteRoom(room.roomId)}
                        disabled={ctx.deletingRoomId === room.roomId}
                      >
                        {ctx.deletingRoomId === room.roomId ? "Deleting..." : "Delete Room"}
                      </Button>
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

                  {ctx.activeAccessRoomId === room.roomId ? (
                    <div className="mt-4 rounded-xl border border-white/10 bg-black/25 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="text-sm font-semibold text-slate-200">Room Access Permissions</h4>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="border-emerald-500/30 bg-transparent text-emerald-300 hover:bg-emerald-500/10"
                            disabled={ctx.roomAccessBulkUpdating !== "" || ctx.roomAccessLoading}
                            onClick={() => ctx.bulkToggleRoomAccess("grant-all", room.roomId)}
                          >
                            {ctx.roomAccessBulkUpdating === `${room.roomId}:grant-all` ? "Granting..." : "Grant All"}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="border-amber-500/30 bg-transparent text-amber-300 hover:bg-amber-500/10"
                            disabled={ctx.roomAccessBulkUpdating !== "" || ctx.roomAccessLoading}
                            onClick={() => ctx.bulkToggleRoomAccess("revoke-all", room.roomId)}
                          >
                            {ctx.roomAccessBulkUpdating === `${room.roomId}:revoke-all` ? "Revoking..." : "Revoke All"}
                          </Button>
                        </div>
                      </div>

                      {ctx.roomAccessLoading ? (
                        <AdminTabSkeleton rows={3} />
                      ) : ctx.roomAccessManagers.length === 0 ? (
                        <p className="mt-3 text-xs text-slate-500">No ctx.managers available.</p>
                      ) : (
                        <div className="mt-3 grid gap-2 md:grid-cols-2">
                          {ctx.roomAccessManagers.map((manager) => (
                            <div
                              key={manager.userId}
                              className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2"
                            >
                              <div>
                                <p className="text-sm font-semibold text-white">{manager.userName}</p>
                                <p className="text-xs text-slate-500">{manager.email || "No email"}</p>
                              </div>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className={manager.canJoin
                                  ? "border-amber-500/30 bg-transparent text-amber-300 hover:bg-amber-500/10"
                                  : "border-emerald-500/30 bg-transparent text-emerald-300 hover:bg-emerald-500/10"}
                                disabled={ctx.roomAccessUpdating === `${room.roomId}:${manager.userId}`}
                                onClick={() => ctx.toggleRoomAccess(manager.userId, !manager.canJoin, room.roomId)}
                              >
                                {ctx.roomAccessUpdating === `${room.roomId}:${manager.userId}`
                                  ? "Updating..."
                                  : manager.canJoin
                                    ? "Revoke"
                                    : "Grant"}
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
  );
}
