"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { showConfirmAlert, showErrorAlert, showSuccessAlert } from "@/lib/alerts";
import { tournaments } from "@/data/tournaments";

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

type RoomAccessManager = {
  userId: string;
  userName: string;
  email: string;
  canJoin: boolean;
};

type PlayerOption = {
  id: string;
  name: string;
  position: string;
  rating: number;
  price: number;
  club: string;
};

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "manager";
  createdAt: string | null;
};

type UserDraft = {
  name: string;
  email: string;
  role: "admin" | "manager";
  password: string;
};

type AdminAchievement = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  tournamentId: string;
  tournamentName: string;
  badgeType: "Champion" | "RunnerUp" | "SemiFinalist";
  awardedAt: string;
};

const STATUS_STYLES: Record<string, string> = {
  live: "bg-emerald-500 text-black",
  sold: "bg-yellow-500 text-black",
  waiting: "bg-slate-700 text-white",
  paused: "bg-amber-500 text-black",
  ended: "bg-slate-600 text-slate-300",
};

export function AdminPanel() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userDrafts, setUserDrafts] = useState<Record<string, UserDraft>>({});
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState("");
  const [creatingUser, setCreatingUser] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState("");
  const [deletingUserId, setDeletingUserId] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<"admin" | "manager">("manager");

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
  const [deletingRoomId, setDeletingRoomId] = useState("");
  const [removingKey, setRemovingKey] = useState("");
  const [error, setError] = useState("");
  const [rosterError, setRosterError] = useState("");
  const [adminMessage, setAdminMessage] = useState("");
  const [achievements, setAchievements] = useState<AdminAchievement[]>([]);
  const [achievementsLoading, setAchievementsLoading] = useState(false);
  const [achievementUserId, setAchievementUserId] = useState("");
  const [achievementTournamentId, setAchievementTournamentId] = useState(
    tournaments[0]?.id ?? ""
  );
  const [achievementTournamentName, setAchievementTournamentName] = useState(
    tournaments[0]?.name ?? ""
  );
  const [achievementBadgeType, setAchievementBadgeType] = useState<
    "Champion" | "RunnerUp" | "SemiFinalist"
  >("Champion");
  const [awardingBadge, setAwardingBadge] = useState(false);
  const [revokingBadgeId, setRevokingBadgeId] = useState("");
  const [roomAccessManagers, setRoomAccessManagers] = useState<RoomAccessManager[]>([]);
  const [roomAccessLoading, setRoomAccessLoading] = useState(false);
  const [roomAccessUpdating, setRoomAccessUpdating] = useState("");
  const [roomAccessBulkUpdating, setRoomAccessBulkUpdating] = useState("");
  const [activeAccessRoomId, setActiveAccessRoomId] = useState("");

  const roomStats = useMemo(() => {
    const totalSpent = managers.reduce((sum, m) => sum + m.budgetSpent, 0);
    const totalPlayers = managers.reduce((sum, m) => sum + m.playersBought.length, 0);
    return { totalSpent, totalPlayers };
  }, [managers]);

  const selectedPlayer = useMemo(
    () => players.find((player) => player.id === selectedPlayerId) ?? null,
    [players, selectedPlayerId]
  );

  const managerUsers = useMemo(
    () => users.filter((user) => user.role === "manager"),
    [users]
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

  async function fetchUsers() {
    setUsersLoading(true);
    setUsersError("");

    const res = await fetch("/api/admin/users", { cache: "no-store" });
    const data = await res.json();

    setUsersLoading(false);

    if (!res.ok) {
      setUsersError(data.error ?? "Failed to load users");
      return;
    }

    const nextUsers: AdminUser[] = data.users ?? [];
    setUsers(nextUsers);
    setUserDrafts(
      Object.fromEntries(
        nextUsers.map((user) => [
          user.id,
          {
            name: user.name,
            email: user.email,
            role: user.role,
            password: "",
          },
        ])
      )
    );

    setAchievementUserId((prev) => {
      if (prev && nextUsers.some((user) => user.id === prev && user.role === "manager")) {
        return prev;
      }
      return nextUsers.find((user) => user.role === "manager")?.id ?? "";
    });
  }

  const fetchAchievements = useCallback(async (userId?: string) => {
    const targetUserId = (userId ?? achievementUserId).trim();

    setAchievementsLoading(true);

    const query = targetUserId ? `?userId=${encodeURIComponent(targetUserId)}` : "";
    const res = await fetch(`/api/admin/achievements${query}`, {
      cache: "no-store",
    });
    const data = await res.json();

    setAchievementsLoading(false);

    if (!res.ok) {
      setRosterError(data.error ?? "Failed to load achievements");
      return;
    }

    setAchievements((data.achievements ?? []) as AdminAchievement[]);
  }, [achievementUserId]);

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

  async function fetchRoomAccess(roomId: string) {
    if (!roomId) {
      setRoomAccessManagers([]);
      return;
    }

    setRoomAccessLoading(true);
    const res = await fetch(`/api/admin/room-access?roomId=${encodeURIComponent(roomId)}`, {
      cache: "no-store",
    });
    const data = await res.json();
    setRoomAccessLoading(false);

    if (!res.ok) {
      setRosterError(data.error ?? "Failed to load room access permissions");
      return;
    }

    setRoomAccessManagers((data.managers ?? []) as RoomAccessManager[]);
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchRooms();
      void fetchPlayers();
      void fetchUsers();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchManagerRoster(selectedRoomId);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [selectedRoomId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchAchievements(achievementUserId);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [achievementUserId, fetchAchievements]);

  function handlePlayerChange(playerId: string) {
    setSelectedPlayerId(playerId);
    const player = players.find((entry) => entry.id === playerId);
    if (player) {
      setTransferAmount(String(player.price ?? 0));
    }
  }

  function updateUserDraft(userId: string, patch: Partial<UserDraft>) {
    setUserDrafts((prev) => ({
      ...prev,
      [userId]: {
        name: patch.name ?? prev[userId]?.name ?? "",
        email: patch.email ?? prev[userId]?.email ?? "",
        role: patch.role ?? prev[userId]?.role ?? "manager",
        password: patch.password ?? prev[userId]?.password ?? "",
      },
    }));
  }

  async function createUser() {
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim()) return;

    setCreatingUser(true);
    setUsersError("");
    setAdminMessage("");

    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newUserName,
        email: newUserEmail,
        password: newUserPassword,
        role: newUserRole,
      }),
    });

    const data = await res.json();
    setCreatingUser(false);

    if (!res.ok) {
      const message = data.error ?? "Failed to create user";
      setUsersError(message);
      await showErrorAlert("Create user failed", message);
      return;
    }

    const message = data.message ?? "User created";
    setAdminMessage(message);
    await showSuccessAlert("User created", message);
    setNewUserName("");
    setNewUserEmail("");
    setNewUserPassword("");
    setNewUserRole("manager");
    await fetchUsers();
  }

  async function saveUser(userId: string) {
    const draft = userDrafts[userId];
    if (!draft) return;

    setUpdatingUserId(userId);
    setUsersError("");
    setAdminMessage("");

    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        name: draft.name,
        email: draft.email,
        role: draft.role,
        password: draft.password,
      }),
    });

    const data = await res.json();
    setUpdatingUserId("");

    if (!res.ok) {
      const message = data.error ?? "Failed to update user";
      setUsersError(message);
      await showErrorAlert("Update user failed", message);
      return;
    }

    const message = data.message ?? "User updated";
    setAdminMessage(message);
    await showSuccessAlert("User updated", message);
    await fetchUsers();
  }

  async function deleteUser(userId: string) {
    const targetUser = users.find((u) => u.id === userId);
    const confirmed = await showConfirmAlert(
      "Delete this user?",
      `This will permanently remove ${targetUser?.name ?? "this user"} and cannot be undone.`
    );

    if (!confirmed) return;

    setDeletingUserId(userId);
    setUsersError("");
    setAdminMessage("");

    const res = await fetch("/api/admin/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });

    const data = await res.json();
    setDeletingUserId("");

    if (!res.ok) {
      const message = data.error ?? "Failed to delete user";
      setUsersError(message);
      await showErrorAlert("Delete failed", message);
      return;
    }

    const message = data.message ?? "User deleted";
    setAdminMessage(message);
    await showSuccessAlert("User deleted", message);
    await fetchUsers();
  }

  async function endRoom(roomId: string, action: "end" | "reset") {
    const room = rooms.find((r) => r.roomId === roomId);
    const confirmed = await showConfirmAlert(
      action === "end" ? "End this room?" : "Reset this room?",
      action === "end"
        ? `Room ${room?.name ?? roomId} will be marked ended.`
        : `Room ${room?.name ?? roomId} will be reset to waiting state.`
    );

    if (!confirmed) return;

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
      const message = data.error ?? "Failed to update room";
      setError(message);
      await showErrorAlert("Room update failed", message);
      return;
    }

    const message = data.message ?? "Done.";
    setAdminMessage(message);
    await showSuccessAlert(action === "end" ? "Room ended" : "Room reset", message);
    await fetchRooms();
  }

  async function adjustBudget() {
    if (!selectedRoomId || !budgetManagerId || budgetAdjustment === "") return;

    const manager = managers.find((m) => m.userId === budgetManagerId);
    const confirmed = await showConfirmAlert(
      "Apply budget adjustment?",
      `Apply ${budgetAdjustment} coins adjustment for ${manager?.userName ?? "selected manager"}?`
    );

    if (!confirmed) return;

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
      const message = data.error ?? "Failed to adjust budget";
      setRosterError(message);
      await showErrorAlert("Budget adjustment failed", message);
      return;
    }

    const message = data.message ?? "Budget adjusted.";
    setAdminMessage(message);
    await showSuccessAlert("Budget updated", message);
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
      const message = data.error ?? "Failed to create room";
      setError(message);
      await showErrorAlert("Create room failed", message);
      return;
    }

    await showSuccessAlert("Room created", "Auction room is ready.");
    setName("");
    setAdminMessage("Room created successfully.");
    await fetchRooms();
  }

  async function assignPlayerToManager() {
    if (!selectedRoomId || !selectedManagerId || !selectedPlayerId) return;

    const manager = managers.find((m) => m.userId === selectedManagerId);
    const player = players.find((p) => p.id === selectedPlayerId);
    const confirmed = await showConfirmAlert(
      "Assign player to manager?",
      `Assign ${player?.name ?? "selected player"} to ${manager?.userName ?? "selected manager"} for ${transferAmount || player?.price || 0} coins?`
    );

    if (!confirmed) return;

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
      const message = data.error ?? "Failed to assign player";
      setRosterError(message);
      await showErrorAlert("Assign failed", message);
      return;
    }

    const message = data.message ?? "Player assigned successfully.";
    setAdminMessage(message);
    await showSuccessAlert("Player assigned", message);
    await fetchManagerRoster(selectedRoomId);
  }

  async function removePlayerFromManager(userId: string, playerId: string) {
    const manager = managers.find((m) => m.userId === userId);
    const player = manager?.playersBought.find((p) => p.playerId === playerId);
    const confirmed = await showConfirmAlert(
      "Remove player from manager?",
      `Remove ${player?.playerName ?? "this player"} from ${manager?.userName ?? "this manager"}?`
    );

    if (!confirmed) return;

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
      const message = data.error ?? "Failed to remove player";
      setRosterError(message);
      await showErrorAlert("Remove failed", message);
      return;
    }

    const message = data.message ?? "Player removed successfully.";
    setAdminMessage(message);
    await showSuccessAlert("Player removed", message);
    await fetchManagerRoster(selectedRoomId);
  }

  async function toggleRoomAccess(userId: string, canJoin: boolean, roomId?: string) {
    const targetRoomId = (roomId ?? selectedRoomId).trim();
    if (!targetRoomId) return;

    setRoomAccessUpdating(`${targetRoomId}:${userId}`);
    setRosterError("");

    const res = await fetch("/api/admin/room-access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomId: targetRoomId,
        userId,
        canJoin,
      }),
    });

    const data = await res.json();
    setRoomAccessUpdating("");

    if (!res.ok) {
      const message = data.error ?? "Failed to update room access";
      setRosterError(message);
      await showErrorAlert("Room access update failed", message);
      return;
    }

    await fetchRoomAccess(targetRoomId);
  }

  async function bulkToggleRoomAccess(action: "grant-all" | "revoke-all", roomId?: string) {
    const targetRoomId = (roomId ?? selectedRoomId).trim();
    if (!targetRoomId) return;

    const confirmed = await showConfirmAlert(
      action === "grant-all" ? "Grant all managers?" : "Revoke all managers?",
      action === "grant-all"
        ? "This will allow every manager to join the selected room."
        : "This will block every manager from joining the selected room until granted again."
    );

    if (!confirmed) return;

    setRoomAccessBulkUpdating(`${targetRoomId}:${action}`);
    setRosterError("");

    const res = await fetch("/api/admin/room-access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomId: targetRoomId,
        action,
      }),
    });

    const data = await res.json();
    setRoomAccessBulkUpdating("");

    if (!res.ok) {
      const message = data.error ?? "Failed to update room access";
      setRosterError(message);
      await showErrorAlert("Room access bulk update failed", message);
      return;
    }

    await fetchRoomAccess(targetRoomId);
  }

  async function deleteRoom(roomId: string) {
    const room = rooms.find((entry) => entry.roomId === roomId);
    const confirmed = await showConfirmAlert(
      "Delete this room?",
      `This will permanently delete ${room?.name ?? roomId} and all related bids, sold players, manager stats, and access permissions.`
    );

    if (!confirmed) return;

    setDeletingRoomId(roomId);
    setError("");

    const res = await fetch("/api/auction/rooms", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId }),
    });

    const data = await res.json();
    setDeletingRoomId("");

    if (!res.ok) {
      const message = data.error ?? "Failed to delete room";
      setError(message);
      await showErrorAlert("Delete room failed", message);
      return;
    }

    await showSuccessAlert("Room deleted", data.message ?? "Room deleted successfully.");
    await fetchRooms();
    setSelectedRoomId("");
    if (activeAccessRoomId === roomId) {
      setActiveAccessRoomId("");
    }
    setManagers([]);
    setRoomAccessManagers([]);
  }

  function handleTournamentChange(value: string) {
    setAchievementTournamentId(value);
    const picked = tournaments.find((item) => item.id === value);
    setAchievementTournamentName(picked?.name ?? "Custom Tournament");
  }

  async function awardBadgeToUser() {
    if (!achievementUserId || !achievementTournamentId || !achievementTournamentName) return;

    const target = managerUsers.find((user) => user.id === achievementUserId);
    const confirmed = await showConfirmAlert(
      "Award tournament badge?",
      `Award ${achievementBadgeType} badge to ${target?.name ?? "selected manager"} for ${achievementTournamentName}?`
    );

    if (!confirmed) return;

    setAwardingBadge(true);
    setRosterError("");
    setAdminMessage("");

    const res = await fetch("/api/admin/achievements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: achievementUserId,
        tournamentId: achievementTournamentId,
        tournamentName: achievementTournamentName,
        badgeType: achievementBadgeType,
      }),
    });

    const data = await res.json();
    setAwardingBadge(false);

    if (!res.ok) {
      const message = data.error ?? "Failed to award badge";
      setRosterError(message);
      await showErrorAlert("Badge award failed", message);
      return;
    }

    const message = data.message ?? "Badge awarded";
    setAdminMessage(message);
    await showSuccessAlert("Badge awarded", message);
    await fetchAchievements(achievementUserId);
  }

  async function revokeBadge(achievementId: string) {
    const confirmed = await showConfirmAlert(
      "Revoke this badge?",
      "This will remove the selected achievement from the manager profile."
    );

    if (!confirmed) return;

    setRevokingBadgeId(achievementId);
    setRosterError("");

    const res = await fetch("/api/admin/achievements", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ achievementId }),
    });

    const data = await res.json();
    setRevokingBadgeId("");

    if (!res.ok) {
      const message = data.error ?? "Failed to revoke badge";
      setRosterError(message);
      await showErrorAlert("Badge revoke failed", message);
      return;
    }

    const message = data.message ?? "Badge revoked";
    setAdminMessage(message);
    await showSuccessAlert("Badge revoked", message);
    await fetchAchievements(achievementUserId);
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
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="border-emerald-500/30 bg-transparent text-emerald-300 hover:bg-emerald-500/10"
                        onClick={() => {
                          if (activeAccessRoomId === room.roomId) {
                            setActiveAccessRoomId("");
                            setRoomAccessManagers([]);
                            return;
                          }

                          setActiveAccessRoomId(room.roomId);
                          void fetchRoomAccess(room.roomId);
                        }}
                      >
                        {activeAccessRoomId === room.roomId ? "Hide Access" : "Room Access"}
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
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="border-red-500/30 bg-transparent text-red-300 hover:bg-red-500/10"
                        onClick={() => deleteRoom(room.roomId)}
                        disabled={deletingRoomId === room.roomId}
                      >
                        {deletingRoomId === room.roomId ? "Deleting..." : "Delete Room"}
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

                  {activeAccessRoomId === room.roomId ? (
                    <div className="mt-4 rounded-xl border border-white/10 bg-black/25 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="text-sm font-semibold text-slate-200">Room Access Permissions</h4>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="border-emerald-500/30 bg-transparent text-emerald-300 hover:bg-emerald-500/10"
                            disabled={roomAccessBulkUpdating !== "" || roomAccessLoading}
                            onClick={() => bulkToggleRoomAccess("grant-all", room.roomId)}
                          >
                            {roomAccessBulkUpdating === `${room.roomId}:grant-all` ? "Granting..." : "Grant All"}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="border-amber-500/30 bg-transparent text-amber-300 hover:bg-amber-500/10"
                            disabled={roomAccessBulkUpdating !== "" || roomAccessLoading}
                            onClick={() => bulkToggleRoomAccess("revoke-all", room.roomId)}
                          >
                            {roomAccessBulkUpdating === `${room.roomId}:revoke-all` ? "Revoking..." : "Revoke All"}
                          </Button>
                        </div>
                      </div>

                      {roomAccessLoading ? (
                        <p className="mt-3 text-xs text-slate-500">Loading access list...</p>
                      ) : roomAccessManagers.length === 0 ? (
                        <p className="mt-3 text-xs text-slate-500">No managers available.</p>
                      ) : (
                        <div className="mt-3 grid gap-2 md:grid-cols-2">
                          {roomAccessManagers.map((manager) => (
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
                                disabled={roomAccessUpdating === `${room.roomId}:${manager.userId}`}
                                onClick={() => toggleRoomAccess(manager.userId, !manager.canJoin, room.roomId)}
                              >
                                {roomAccessUpdating === `${room.roomId}:${manager.userId}`
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

      <div className="mt-10 grid gap-8 xl:grid-cols-[420px_1fr]">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-bold">Tournament Badges</h2>
          <p className="mt-1 text-sm text-slate-400">
            Award achievement badges to managers who win tournaments.
          </p>

          <div className="mt-5 space-y-4">
            <div>
              <label className="mb-1 block text-sm text-slate-300">Manager</label>
              <select
                aria-label="Select manager for badge award"
                value={achievementUserId}
                onChange={(event) => setAchievementUserId(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-2 text-sm outline-none"
              >
                <option value="">All managers (history)</option>
                {managerUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-300">Tournament</label>
              <select
                aria-label="Select tournament for badge award"
                value={achievementTournamentId}
                onChange={(event) => handleTournamentChange(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-2 text-sm outline-none"
              >
                {tournaments.map((tournament) => (
                  <option key={tournament.id} value={tournament.id}>
                    {tournament.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-300">Tournament Name</label>
              <input
                aria-label="Tournament name for badge award"
                value={achievementTournamentName}
                onChange={(event) => setAchievementTournamentName(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-2 text-sm outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-300">Badge Type</label>
              <select
                aria-label="Select badge type"
                value={achievementBadgeType}
                onChange={(event) => setAchievementBadgeType(event.target.value as "Champion" | "RunnerUp" | "SemiFinalist")}
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-2 text-sm outline-none"
              >
                <option value="Champion">Champion</option>
                <option value="RunnerUp">Runner-up</option>
                <option value="SemiFinalist">Semi-finalist</option>
              </select>
            </div>

            <Button
              type="button"
              onClick={awardBadgeToUser}
              disabled={awardingBadge || !achievementUserId}
              className="w-full bg-amber-500 text-black hover:bg-amber-400"
            >
              {awardingBadge ? "Awarding..." : "Award Badge"}
            </Button>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">Awarded Badges</h2>
              <p className="mt-1 text-sm text-slate-400">
                Track and revoke badges given to the selected manager.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-white/20 bg-transparent text-white hover:bg-white/10"
              onClick={() => fetchAchievements(achievementUserId)}
              disabled={achievementsLoading}
            >
              {achievementsLoading ? "Refreshing..." : "Refresh"}
            </Button>
          </div>

          {!achievementUserId ? (
            <p className="mt-4 text-slate-400">Showing badge history for all managers.</p>
          ) : null}

          {achievementsLoading ? (
            <p className="mt-4 text-slate-400">Loading badges...</p>
          ) : achievements.length === 0 ? (
            <p className="mt-4 text-slate-400">
              {achievementUserId
                ? "No badges awarded for this manager yet."
                : "No badges awarded yet."}
            </p>
          ) : (
            <div className="mt-5 space-y-3">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3"
                >
                  <div>
                    <p className="font-semibold text-white">{achievement.tournamentName}</p>
                    <p className="text-xs text-slate-400">
                      {achievement.badgeType} • {new Date(achievement.awardedAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-slate-500">
                      Awarded to: {achievement.userName}
                      {achievement.userEmail ? ` (${achievement.userEmail})` : ""}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="border-red-500/30 bg-transparent text-red-300 hover:bg-red-500/10"
                    onClick={() => revokeBadge(achievement.id)}
                    disabled={revokingBadgeId === achievement.id}
                  >
                    {revokingBadgeId === achievement.id ? "Revoking..." : "Revoke"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">User Management</h2>
            <p className="mt-1 text-sm text-slate-400">
              View registered users, create accounts, edit roles, and remove users.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="border-white/20 bg-transparent text-white hover:bg-white/10"
            onClick={() => fetchUsers()}
            disabled={usersLoading}
          >
            {usersLoading ? "Refreshing…" : "Refresh Users"}
          </Button>
        </div>

        <div className="mt-6 grid gap-8 lg:grid-cols-[340px_1fr]">
          <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-5">
            <h3 className="text-lg font-bold">Add User</h3>
            <div className="mt-4 space-y-3">
              <input
                type="text"
                placeholder="Full name"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-2 text-sm outline-none"
              />
              <input
                type="email"
                placeholder="Email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-2 text-sm outline-none"
              />
              <input
                type="password"
                placeholder="Password"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-2 text-sm outline-none"
              />
              <select
                aria-label="Select role for new user"
                value={newUserRole}
                onChange={(e) => setNewUserRole((e.target.value === "admin" ? "admin" : "manager"))}
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-2 text-sm outline-none"
              >
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
              <Button
                type="button"
                disabled={creatingUser || !newUserName || !newUserEmail || !newUserPassword}
                className="w-full bg-emerald-500 text-black hover:bg-emerald-400"
                onClick={createUser}
              >
                {creatingUser ? "Creating…" : "Create User"}
              </Button>
            </div>
          </div>

          <div>
            {usersError ? <p className="mb-3 text-sm text-red-400">{usersError}</p> : null}
            {users.length === 0 ? (
              <p className="text-slate-400">No users found.</p>
            ) : (
              <div className="space-y-3">
                {users.map((user) => {
                  const draft = userDrafts[user.id] ?? {
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
                          onChange={(e) => updateUserDraft(user.id, { name: e.target.value })}
                          className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm outline-none"
                        />
                        <input
                          aria-label={`Edit email for ${user.name}`}
                          type="email"
                          value={draft.email}
                          onChange={(e) => updateUserDraft(user.id, { email: e.target.value })}
                          className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm outline-none"
                        />
                        <select
                          aria-label={`Edit role for ${user.email}`}
                          value={draft.role}
                          onChange={(e) => updateUserDraft(user.id, { role: e.target.value === "admin" ? "admin" : "manager" })}
                          className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm outline-none"
                        >
                          <option value="manager">Manager</option>
                          <option value="admin">Admin</option>
                        </select>
                        <input
                          type="password"
                          placeholder="New password (optional)"
                          value={draft.password}
                          onChange={(e) => updateUserDraft(user.id, { password: e.target.value })}
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
                            onClick={() => saveUser(user.id)}
                            disabled={updatingUserId === user.id}
                          >
                            {updatingUserId === user.id ? "Saving…" : "Save"}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="border-red-500/30 bg-transparent text-red-300 hover:bg-red-500/10"
                            onClick={() => deleteUser(user.id)}
                            disabled={deletingUserId === user.id}
                          >
                            {deletingUserId === user.id ? "Deleting…" : "Delete"}
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
    </Container>
  );
}
