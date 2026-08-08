"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAdminPanelContext } from "./admin-panel-context";
import { STATUS_STYLES } from "./constants";

export function UsersTab() {
  const ctx = useAdminPanelContext();
  return (
<div className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">User Management</h2>
            <p className="mt-1 text-sm text-slate-400">
              View registered ctx.users, create accounts, edit roles, and remove ctx.users.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="border-white/20 bg-transparent text-white hover:bg-white/10"
            onClick={() => ctx.fetchUsers()}
            disabled={ctx.usersLoading}
          >
            {ctx.usersLoading ? "Refreshing…" : "Refresh Users"}
          </Button>
        </div>

        <div className="mt-6 grid gap-8 lg:grid-cols-[340px_1fr]">
          <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-5">
            <h3 className="text-lg font-bold">Add User</h3>
            <div className="mt-4 space-y-3">
              <input
                type="text"
                placeholder="Full name"
                value={ctx.newUserName}
                onChange={(e) => ctx.setNewUserName(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-2 text-sm outline-none"
              />
              <input
                type="email"
                placeholder="Email"
                value={ctx.newUserEmail}
                onChange={(e) => ctx.setNewUserEmail(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-2 text-sm outline-none"
              />
              <input
                type="password"
                placeholder="Password"
                value={ctx.newUserPassword}
                onChange={(e) => ctx.setNewUserPassword(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-2 text-sm outline-none"
              />
              <select
                aria-label="Select role for new user"
                value={ctx.newUserRole}
                onChange={(e) => ctx.setNewUserRole((e.target.value === "admin" ? "admin" : "manager"))}
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-2 text-sm outline-none"
              >
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
              <Button
                type="button"
                disabled={ctx.creatingUser || !ctx.newUserName || !ctx.newUserEmail || !ctx.newUserPassword}
                className="w-full bg-emerald-500 text-black hover:bg-emerald-400"
                onClick={ctx.createUser}
              >
                {ctx.creatingUser ? "Creating…" : "Create User"}
              </Button>
            </div>
          </div>

          <div>
            {ctx.usersError ? <p className="mb-3 text-sm text-red-400">{ctx.usersError}</p> : null}
            {ctx.users.length === 0 ? (
              <p className="text-slate-400">No ctx.users found.</p>
            ) : (
              <div className="space-y-3">
                {ctx.users.map((user) => {
                  const draft = ctx.userDrafts[user.id] ?? {
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    password: "",
                  };

                  return (
                    <div
                      key={user.id}
                      className="rounded-2xl border border-white/10 bg-slate-950/60 p-4"
                    >
                      <div className="grid gap-3 lg:grid-cols-[1fr_1fr_180px_180px]">
                        <input
                          aria-label={`Edit name for ${user.email}`}
                          type="text"
                          value={draft.name}
                          onChange={(e) => ctx.updateUserDraft(user.id, { name: e.target.value })}
                          className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm outline-none"
                        />
                        <input
                          aria-label={`Edit email for ${user.name}`}
                          type="email"
                          value={draft.email}
                          onChange={(e) => ctx.updateUserDraft(user.id, { email: e.target.value })}
                          className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm outline-none"
                        />
                        <select
                          aria-label={`Edit role for ${user.email}`}
                          value={draft.role}
                          onChange={(e) => ctx.updateUserDraft(user.id, { role: e.target.value === "admin" ? "admin" : "manager" })}
                          className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm outline-none"
                        >
                          <option value="manager">Manager</option>
                          <option value="admin">Admin</option>
                        </select>
                        <input
                          type="password"
                          placeholder="New password (optional)"
                          value={draft.password}
                          onChange={(e) => ctx.updateUserDraft(user.id, { password: e.target.value })}
                          className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm outline-none"
                        />
                      </div>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                        <p className="text-xs text-slate-500">
                          User ID: {user.id}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            className="bg-blue-500 text-white hover:bg-blue-400"
                            onClick={() => ctx.saveUser(user.id)}
                            disabled={ctx.updatingUserId === user.id}
                          >
                            {ctx.updatingUserId === user.id ? "Saving…" : "Save"}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="border-red-500/30 bg-transparent text-red-300 hover:bg-red-500/10"
                            onClick={() => ctx.deleteUser(user.id)}
                            disabled={ctx.deletingUserId === user.id}
                          >
                            {ctx.deletingUserId === user.id ? "Deleting…" : "Delete"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
  );
}
