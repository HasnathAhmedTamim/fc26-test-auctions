"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { showConfirmAlert, showErrorAlert, showSuccessAlert } from "@/lib/alerts";
import { Tournament, TournamentFixture, TournamentStanding } from "@/types/tournament";

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

type TournamentStandingRow = TournamentStanding;
type TournamentFixtureRow = TournamentFixture;
type AdminView = "rooms" | "roster" | "tournaments" | "badges" | "users";

const STATUS_STYLES: Record<string, string> = {
  live: "bg-emerald-500 text-black",
  sold: "bg-yellow-500 text-black",
  waiting: "bg-slate-700 text-white",
  paused: "bg-amber-500 text-black",
  ended: "bg-slate-600 text-slate-300",
};

export function AdminPanel() {
  const [activeAdminView, setActiveAdminView] = useState<AdminView>("rooms");
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
  const [achievementTournamentId, setAchievementTournamentId] = useState("");
  const [achievementTournamentName, setAchievementTournamentName] = useState("");
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
  const [managedTournaments, setManagedTournaments] = useState<Tournament[]>([]);
  const [tournamentsLoading, setTournamentsLoading] = useState(false);
  const [tournamentError, setTournamentError] = useState("");
  const [savingTournament, setSavingTournament] = useState(false);
  const [deletingTournamentId, setDeletingTournamentId] = useState("");
  const [editingTournamentId, setEditingTournamentId] = useState("");
  const [tournamentName, setTournamentName] = useState("");
  const [tournamentStatus, setTournamentStatus] = useState<Tournament["status"]>("Upcoming");
  const [tournamentBudget, setTournamentBudget] = useState("2000");
  const [tournamentMaxPlayers, setTournamentMaxPlayers] = useState("24");
  const [tournamentMinPlayers, setTournamentMinPlayers] = useState("15");
  const [tournamentParticipants, setTournamentParticipants] = useState("0");
  const [teamNamesInput, setTeamNamesInput] = useState("");
  const [tournamentStandings, setTournamentStandings] = useState<TournamentStandingRow[]>([]);
  const [tournamentFixtures, setTournamentFixtures] = useState<TournamentFixtureRow[]>([]);

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

  const achievementTournamentOptions = useMemo(
    () => managedTournaments,
    [managedTournaments]
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

  const fetchTournaments = useCallback(async () => {
    setTournamentsLoading(true);
    setTournamentError("");

    const res = await fetch("/api/admin/tournaments", { cache: "no-store" });
    const data = await res.json();

    setTournamentsLoading(false);

    if (!res.ok) {
      setTournamentError(data.error ?? "Failed to load tournaments");
      return;
    }

    const nextTournaments = (data.tournaments ?? []) as Tournament[];
    setManagedTournaments(nextTournaments);

    if (!nextTournaments.length) {
      setAchievementTournamentId("");
      setAchievementTournamentName("");
      return;
    }
    setAchievementTournamentId((previousTournamentId) => {
      const selectedTournamentId = nextTournaments.some((t) => t.id === previousTournamentId)
        ? previousTournamentId
        : nextTournaments[0].id;

      const selectedTournament = nextTournaments.find((t) => t.id === selectedTournamentId);
      setAchievementTournamentName(selectedTournament?.name ?? "");

      return selectedTournamentId;
    });
  }, []);

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
      void fetchTournaments();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchTournaments]);

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
    const picked = achievementTournamentOptions.find((item) => item.id === value);
    setAchievementTournamentName(picked?.name ?? "Custom Tournament");
  }

  function resetTournamentForm() {
    setEditingTournamentId("");
    setTournamentName("");
    setTournamentStatus("Upcoming");
    setTournamentBudget("2000");
    setTournamentMaxPlayers("24");
    setTournamentMinPlayers("15");
    setTournamentParticipants("0");
    setTeamNamesInput("");
    setTournamentStandings([]);
    setTournamentFixtures([]);
  }

  function loadTournamentForEdit(tournament: Tournament) {
    setEditingTournamentId(tournament.id);
    setTournamentName(tournament.name);
    setTournamentStatus(tournament.status);
    setTournamentBudget(String(tournament.budget));
    setTournamentMaxPlayers(String(tournament.maxPlayers));
    setTournamentMinPlayers(String(tournament.minPlayers));
    setTournamentParticipants(String(tournament.participants));
    setTeamNamesInput((tournament.standings ?? []).map((entry) => entry.team).join("\n"));
    setTournamentStandings(tournament.standings ?? []);
    setTournamentFixtures(tournament.fixtures ?? []);
  }

  function normalizeTeamNames() {
    const unique = new Set<string>();
    const teamNames = teamNamesInput
      .split("\n")
      .map((line) => line.trim())
      .filter((name) => {
        if (!name) return false;
        const lowered = name.toLowerCase();
        if (unique.has(lowered)) return false;
        unique.add(lowered);
        return true;
      });

    return teamNames;
  }

  function buildStandingsFromTeams() {
    const teamNames = normalizeTeamNames();
    if (teamNames.length < 2) {
      setTournamentError("Enter at least 2 unique team names");
      return;
    }

    setTournamentError("");
    setTournamentParticipants(String(teamNames.length));
    setTournamentStandings(
      teamNames.map((team) => ({
        team,
        played: 0,
        won: 0,
        draw: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        points: 0,
      }))
    );
  }

  function shuffleList<T>(items: T[]) {
    const clone = [...items];
    for (let index = clone.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [clone[index], clone[swapIndex]] = [clone[swapIndex], clone[index]];
    }
    return clone;
  }

  function formatKickoff(baseDate: Date) {
    const year = baseDate.getFullYear();
    const month = String(baseDate.getMonth() + 1).padStart(2, "0");
    const day = String(baseDate.getDate()).padStart(2, "0");
    const hour = String(baseDate.getHours()).padStart(2, "0");
    const minute = String(baseDate.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day} ${hour}:${minute}`;
  }

  function generateRandomFixtures() {
    const teamNames = normalizeTeamNames();
    if (teamNames.length < 2) {
      setTournamentError("Enter at least 2 unique team names before generating fixtures");
      return;
    }

    const randomizedTeams = shuffleList(teamNames);
    const pairs: Array<{ homeTeam: string; awayTeam: string }> = [];

    for (let i = 0; i < randomizedTeams.length; i += 1) {
      for (let j = i + 1; j < randomizedTeams.length; j += 1) {
        const homeFirst = Math.random() > 0.5;
        pairs.push(
          homeFirst
            ? { homeTeam: randomizedTeams[i], awayTeam: randomizedTeams[j] }
            : { homeTeam: randomizedTeams[j], awayTeam: randomizedTeams[i] }
        );
      }
    }

    const randomizedPairs = shuffleList(pairs);
    const kickoffBase = new Date();

    const generatedFixtures: TournamentFixtureRow[] = randomizedPairs.map((pair, index) => {
      const kickoffDate = new Date(kickoffBase.getTime() + index * 60 * 60 * 1000);
      return {
        id: `fx-${Date.now()}-${index + 1}`,
        round: `Round ${Math.floor(index / Math.max(1, Math.floor(teamNames.length / 2))) + 1}`,
        homeTeam: pair.homeTeam,
        awayTeam: pair.awayTeam,
        kickoff: formatKickoff(kickoffDate),
        status: "Scheduled",
      };
    });

    setTournamentError("");
    setTournamentParticipants(String(teamNames.length));
    setTournamentFixtures(generatedFixtures);

    if (!tournamentStandings.length) {
      setTournamentStandings(
        teamNames.map((team) => ({
          team,
          played: 0,
          won: 0,
          draw: 0,
          lost: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          points: 0,
        }))
      );
    }
  }

  function updateStanding(index: number, field: keyof TournamentStandingRow, value: string) {
    setTournamentStandings((previous) =>
      previous.map((entry, rowIndex) => {
        if (rowIndex !== index) return entry;
        if (field === "team") return { ...entry, team: value };
        return { ...entry, [field]: Math.max(0, Number(value) || 0) };
      })
    );
  }

  function addStandingRow() {
    setTournamentStandings((previous) => [
      ...previous,
      {
        team: `Team ${previous.length + 1}`,
        played: 0,
        won: 0,
        draw: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        points: 0,
      },
    ]);
  }

  function removeStandingRow(index: number) {
    setTournamentStandings((previous) => previous.filter((_, rowIndex) => rowIndex !== index));
  }

  function recalculateStandingsFromFixtures() {
    const finishedFixtures = tournamentFixtures.filter(
      (fixture) =>
        fixture.status === "Finished" &&
        fixture.homeTeam.trim() &&
        fixture.awayTeam.trim() &&
        typeof fixture.homeScore === "number" &&
        typeof fixture.awayScore === "number"
    );

    if (!finishedFixtures.length) {
      setTournamentError("No finished fixtures with scores found to calculate table");
      return;
    }

    const teamSeed = new Set<string>();

    tournamentStandings.forEach((entry) => {
      if (entry.team.trim()) teamSeed.add(entry.team.trim());
    });

    finishedFixtures.forEach((fixture) => {
      teamSeed.add(fixture.homeTeam.trim());
      teamSeed.add(fixture.awayTeam.trim());
    });

    const tableMap = new Map<string, TournamentStandingRow>();

    teamSeed.forEach((team) => {
      tableMap.set(team, {
        team,
        played: 0,
        won: 0,
        draw: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        points: 0,
      });
    });

    finishedFixtures.forEach((fixture) => {
      const homeTeam = fixture.homeTeam.trim();
      const awayTeam = fixture.awayTeam.trim();
      const homeScore = Number(fixture.homeScore);
      const awayScore = Number(fixture.awayScore);

      const homeRow = tableMap.get(homeTeam);
      const awayRow = tableMap.get(awayTeam);
      if (!homeRow || !awayRow) return;

      homeRow.played += 1;
      awayRow.played += 1;
      homeRow.goalsFor += homeScore;
      homeRow.goalsAgainst += awayScore;
      awayRow.goalsFor += awayScore;
      awayRow.goalsAgainst += homeScore;

      if (homeScore > awayScore) {
        homeRow.won += 1;
        awayRow.lost += 1;
        homeRow.points += 3;
      } else if (awayScore > homeScore) {
        awayRow.won += 1;
        homeRow.lost += 1;
        awayRow.points += 3;
      } else {
        homeRow.draw += 1;
        awayRow.draw += 1;
        homeRow.points += 1;
        awayRow.points += 1;
      }
    });

    const sortedTable = [...tableMap.values()].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      const goalDiffA = a.goalsFor - a.goalsAgainst;
      const goalDiffB = b.goalsFor - b.goalsAgainst;
      if (goalDiffB !== goalDiffA) return goalDiffB - goalDiffA;
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      return a.team.localeCompare(b.team);
    });

    setTournamentError("");
    setTournamentStandings(sortedTable);
    setTeamNamesInput(sortedTable.map((entry) => entry.team).join("\n"));
    setTournamentParticipants(String(sortedTable.length));
  }

  function updateFixture(index: number, field: keyof TournamentFixtureRow, value: string) {
    setTournamentFixtures((previous) =>
      previous.map((entry, rowIndex) => {
        if (rowIndex !== index) return entry;
        if (field === "homeScore" || field === "awayScore") {
          if (value.trim() === "") {
            const updatedEntry = { ...entry } as Record<string, unknown>;
            delete updatedEntry[field];
            return updatedEntry as TournamentFixtureRow;
          }
          return { ...entry, [field]: Math.max(0, Number(value) || 0) };
        }
        return { ...entry, [field]: value };
      })
    );
  }

  function addFixtureRow() {
    setTournamentFixtures((previous) => [
      ...previous,
      {
        id: `fx-${Date.now()}-${previous.length + 1}`,
        round: `Round ${previous.length + 1}`,
        homeTeam: "",
        awayTeam: "",
        kickoff: formatKickoff(new Date()),
        status: "Scheduled",
      },
    ]);
  }

  function removeFixtureRow(index: number) {
    setTournamentFixtures((previous) => previous.filter((_, rowIndex) => rowIndex !== index));
  }

  async function saveTournament() {
    if (!tournamentName.trim()) {
      setTournamentError("Tournament name is required");
      return;
    }

    const sanitizedStandings = tournamentStandings
      .map((entry) => ({
        ...entry,
        team: entry.team.trim(),
      }))
      .filter((entry) => entry.team);

    const sanitizedFixtures = tournamentFixtures
      .map((entry, index) => ({
        ...entry,
        id: entry.id.trim() || `fx-${index + 1}`,
        round: entry.round.trim() || `Round ${index + 1}`,
        homeTeam: entry.homeTeam.trim(),
        awayTeam: entry.awayTeam.trim(),
        kickoff: entry.kickoff.trim(),
      }))
      .filter((entry) => entry.homeTeam && entry.awayTeam && entry.kickoff);

    if (!sanitizedStandings.length) {
      setTournamentError("Add at least one team in standings table");
      return;
    }

    if (!sanitizedFixtures.length) {
      setTournamentError("Add at least one fixture or generate fixtures");
      return;
    }

    setSavingTournament(true);
    setTournamentError("");

    const payload = {
      id: editingTournamentId,
      name: tournamentName.trim(),
      status: tournamentStatus,
      budget: Number(tournamentBudget),
      maxPlayers: Number(tournamentMaxPlayers),
      minPlayers: Number(tournamentMinPlayers),
      participants: sanitizedStandings.length,
      standings: sanitizedStandings,
      fixtures: sanitizedFixtures,
    };

    const isEdit = Boolean(editingTournamentId);
    const res = await fetch("/api/admin/tournaments", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    setSavingTournament(false);

    if (!res.ok) {
      const message = data.error ?? "Failed to save tournament";
      setTournamentError(message);
      await showErrorAlert("Tournament save failed", message);
      return;
    }

    await showSuccessAlert(
      isEdit ? "Tournament updated" : "Tournament created",
      data.message ?? "Tournament saved"
    );
    resetTournamentForm();
    await fetchTournaments();
  }

  async function deleteTournament(id: string) {
    const target = managedTournaments.find((t) => t.id === id);
    const confirmed = await showConfirmAlert(
      "Delete this tournament?",
      `This will permanently delete ${target?.name ?? "this tournament"}.`
    );

    if (!confirmed) return;

    setDeletingTournamentId(id);
    setTournamentError("");

    const res = await fetch("/api/admin/tournaments", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    const data = await res.json();
    setDeletingTournamentId("");

    if (!res.ok) {
      const message = data.error ?? "Failed to delete tournament";
      setTournamentError(message);
      await showErrorAlert("Delete failed", message);
      return;
    }

    await showSuccessAlert("Tournament deleted", data.message ?? "Tournament deleted");
    if (editingTournamentId === id) {
      resetTournamentForm();
    }
    await fetchTournaments();
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

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Control Center</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={activeAdminView === "rooms" ? "default" : "outline"}
            className={activeAdminView === "rooms" ? "bg-emerald-500 text-black hover:bg-emerald-400" : "border-white/20 bg-transparent text-white hover:bg-white/10"}
            onClick={() => setActiveAdminView("rooms")}
          >
            Rooms
          </Button>
          <Button
            type="button"
            size="sm"
            variant={activeAdminView === "roster" ? "default" : "outline"}
            className={activeAdminView === "roster" ? "bg-blue-500 text-white hover:bg-blue-400" : "border-white/20 bg-transparent text-white hover:bg-white/10"}
            onClick={() => setActiveAdminView("roster")}
          >
            Roster
          </Button>
          <Button
            type="button"
            size="sm"
            variant={activeAdminView === "tournaments" ? "default" : "outline"}
            className={activeAdminView === "tournaments" ? "bg-cyan-400 text-black hover:bg-cyan-300" : "border-white/20 bg-transparent text-white hover:bg-white/10"}
            onClick={() => setActiveAdminView("tournaments")}
          >
            Tournaments
          </Button>
          <Button
            type="button"
            size="sm"
            variant={activeAdminView === "badges" ? "default" : "outline"}
            className={activeAdminView === "badges" ? "bg-amber-500 text-black hover:bg-amber-400" : "border-white/20 bg-transparent text-white hover:bg-white/10"}
            onClick={() => setActiveAdminView("badges")}
          >
            Badges
          </Button>
          <Button
            type="button"
            size="sm"
            variant={activeAdminView === "users" ? "default" : "outline"}
            className={activeAdminView === "users" ? "bg-violet-500 text-white hover:bg-violet-400" : "border-white/20 bg-transparent text-white hover:bg-white/10"}
            onClick={() => setActiveAdminView("users")}
          >
            Users
          </Button>
        </div>
        <p className="mt-3 text-xs text-slate-500">Showing one section at a time to reduce admin overload.</p>
      </div>

      {activeAdminView === "rooms" && (
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
                        onClick={() => {
                          setSelectedRoomId(room.roomId);
                          setActiveAdminView("roster");
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
      )}

      {activeAdminView === "roster" && (
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
      )}

      {activeAdminView === "tournaments" && (
      <div className="mt-10 grid gap-8 xl:grid-cols-[460px_1fr]">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-bold">Tournament Management</h2>
          <p className="mt-1 text-sm text-slate-400">
            Create, customize, update, or delete a specific tournament.
          </p>

          <div className="mt-5 space-y-4">
            <div>
              <label className="mb-1 block text-sm text-slate-300">Tournament Name</label>
              <input
                value={tournamentName}
                onChange={(event) => setTournamentName(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-2 text-sm outline-none"
                placeholder="e.g. Weekend Elite Cup"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm text-slate-300">Status</label>
                <select
                  aria-label="Tournament status"
                  value={tournamentStatus}
                  onChange={(event) => setTournamentStatus(event.target.value as Tournament["status"])}
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-2 text-sm outline-none"
                >
                  <option value="Upcoming">Upcoming</option>
                  <option value="Live">Live</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-300">Participants</label>
                <input
                  type="number"
                  aria-label="Tournament participants"
                  value={tournamentParticipants}
                  readOnly
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-2 text-sm outline-none"
                />
                <p className="mt-1 text-xs text-slate-500">Auto-calculated from the points table teams.</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1 block text-sm text-slate-300">Budget</label>
                <input
                  type="number"
                  aria-label="Tournament budget"
                  value={tournamentBudget}
                  onChange={(event) => setTournamentBudget(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-2 text-sm outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-300">Max</label>
                <input
                  type="number"
                  aria-label="Tournament max players"
                  value={tournamentMaxPlayers}
                  onChange={(event) => setTournamentMaxPlayers(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-2 text-sm outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-300">Min</label>
                <input
                  type="number"
                  aria-label="Tournament min players"
                  value={tournamentMinPlayers}
                  onChange={(event) => setTournamentMinPlayers(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-2 text-sm outline-none"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/5 p-4">
              <label className="mb-1 block text-sm text-slate-200">Team Names</label>
              <p className="mb-2 text-xs text-slate-400">Add one team per line.</p>
              <textarea
                aria-label="Tournament team names"
                value={teamNamesInput}
                onChange={(event) => setTeamNamesInput(event.target.value)}
                rows={6}
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-2 text-sm outline-none"
                placeholder={"Arsenal\nManchester City\nLiverpool\nChelsea"}
              />

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <Button
                  type="button"
                  variant="outline"
                  className="border-cyan-500/30 bg-transparent text-cyan-200 hover:bg-cyan-500/10"
                  onClick={buildStandingsFromTeams}
                >
                  Build Table From Teams
                </Button>
                <Button
                  type="button"
                  className="bg-cyan-400 text-black hover:bg-cyan-300"
                  onClick={generateRandomFixtures}
                >
                  Generate Random Fixtures
                </Button>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm font-semibold text-slate-200">Points Table</label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="border-emerald-500/30 bg-transparent text-emerald-300 hover:bg-emerald-500/10"
                    onClick={recalculateStandingsFromFixtures}
                  >
                    Recalculate Table
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="border-white/20 bg-transparent text-white hover:bg-white/10"
                    onClick={addStandingRow}
                  >
                    Add Team Row
                  </Button>
                </div>
              </div>

              {tournamentStandings.length === 0 ? (
                <p className="mt-3 text-xs text-slate-500">No teams yet. Add team names and build table.</p>
              ) : (
                <div className="mt-3 overflow-x-auto">
                  <table className="min-w-[900px] w-full text-xs">
                    <thead>
                      <tr className="text-left text-slate-400">
                        <th className="px-2 py-2">Team</th>
                        <th className="px-2 py-2">P</th>
                        <th className="px-2 py-2">W</th>
                        <th className="px-2 py-2">D</th>
                        <th className="px-2 py-2">L</th>
                        <th className="px-2 py-2">GF</th>
                        <th className="px-2 py-2">GA</th>
                        <th className="px-2 py-2">Pts</th>
                        <th className="px-2 py-2">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tournamentStandings.map((row, index) => (
                        <tr key={`standing-${index}`} className="border-t border-white/10">
                          <td className="px-2 py-2">
                            <input
                              aria-label={`Standing team ${index + 1}`}
                              value={row.team}
                              onChange={(event) => updateStanding(index, "team", event.target.value)}
                              className="w-full rounded-md border border-white/10 bg-slate-900 px-2 py-1 text-xs"
                            />
                          </td>
                          {(["played", "won", "draw", "lost", "goalsFor", "goalsAgainst", "points"] as const).map((field) => (
                            <td key={field} className="px-2 py-2">
                              <input
                                type="number"
                                aria-label={`${field} for ${row.team || `team ${index + 1}`}`}
                                value={row[field]}
                                onChange={(event) => updateStanding(index, field, event.target.value)}
                                className="w-16 rounded-md border border-white/10 bg-slate-900 px-2 py-1 text-xs"
                              />
                            </td>
                          ))}
                          <td className="px-2 py-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="border-red-500/30 bg-transparent text-red-300 hover:bg-red-500/10"
                              onClick={() => removeStandingRow(index)}
                            >
                              Remove
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm font-semibold text-slate-200">Fixtures</label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="border-white/20 bg-transparent text-white hover:bg-white/10"
                    onClick={addFixtureRow}
                  >
                    Add Fixture
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="border-amber-500/30 bg-transparent text-amber-300 hover:bg-amber-500/10"
                    onClick={() => setTournamentFixtures([])}
                  >
                    Clear
                  </Button>
                </div>
              </div>

              {tournamentFixtures.length === 0 ? (
                <p className="mt-3 text-xs text-slate-500">No fixtures yet. Generate or add fixtures manually.</p>
              ) : (
                <div className="mt-3 overflow-x-auto">
                  <table className="min-w-[1180px] w-full text-xs">
                    <thead>
                      <tr className="text-left text-slate-400">
                        <th className="px-2 py-2">Round</th>
                        <th className="px-2 py-2">Home</th>
                        <th className="px-2 py-2">Away</th>
                        <th className="px-2 py-2">Kickoff</th>
                        <th className="px-2 py-2">Status</th>
                        <th className="px-2 py-2">Home Score</th>
                        <th className="px-2 py-2">Away Score</th>
                        <th className="px-2 py-2">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tournamentFixtures.map((fixture, index) => (
                        <tr key={fixture.id || `fixture-${index}`} className="border-t border-white/10">
                          <td className="px-2 py-2">
                            <input
                              aria-label={`Round for fixture ${index + 1}`}
                              value={fixture.round}
                              onChange={(event) => updateFixture(index, "round", event.target.value)}
                              className="w-28 rounded-md border border-white/10 bg-slate-900 px-2 py-1 text-xs"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              aria-label={`Home team for fixture ${index + 1}`}
                              value={fixture.homeTeam}
                              onChange={(event) => updateFixture(index, "homeTeam", event.target.value)}
                              className="w-40 rounded-md border border-white/10 bg-slate-900 px-2 py-1 text-xs"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              aria-label={`Away team for fixture ${index + 1}`}
                              value={fixture.awayTeam}
                              onChange={(event) => updateFixture(index, "awayTeam", event.target.value)}
                              className="w-40 rounded-md border border-white/10 bg-slate-900 px-2 py-1 text-xs"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              aria-label={`Kickoff for fixture ${index + 1}`}
                              value={fixture.kickoff}
                              onChange={(event) => updateFixture(index, "kickoff", event.target.value)}
                              className="w-40 rounded-md border border-white/10 bg-slate-900 px-2 py-1 text-xs"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <select
                              aria-label={`Status for fixture ${index + 1}`}
                              value={fixture.status}
                              onChange={(event) => updateFixture(index, "status", event.target.value)}
                              className="w-28 rounded-md border border-white/10 bg-slate-900 px-2 py-1 text-xs"
                            >
                              <option value="Scheduled">Scheduled</option>
                              <option value="Live">Live</option>
                              <option value="Finished">Finished</option>
                            </select>
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              aria-label={`Home score for fixture ${index + 1}`}
                              value={fixture.homeScore ?? ""}
                              onChange={(event) => updateFixture(index, "homeScore", event.target.value)}
                              className="w-24 rounded-md border border-white/10 bg-slate-900 px-2 py-1 text-xs"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              aria-label={`Away score for fixture ${index + 1}`}
                              value={fixture.awayScore ?? ""}
                              onChange={(event) => updateFixture(index, "awayScore", event.target.value)}
                              className="w-24 rounded-md border border-white/10 bg-slate-900 px-2 py-1 text-xs"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="border-red-500/30 bg-transparent text-red-300 hover:bg-red-500/10"
                              onClick={() => removeFixtureRow(index)}
                            >
                              Remove
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {tournamentError ? <p className="text-sm text-red-400">{tournamentError}</p> : null}

            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                disabled={savingTournament}
                className="w-full bg-cyan-400 text-black hover:bg-cyan-300"
                onClick={saveTournament}
              >
                {savingTournament ? "Saving..." : editingTournamentId ? "Update Tournament" : "Create Tournament"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full border-white/20 bg-transparent text-white hover:bg-white/10"
                onClick={resetTournamentForm}
              >
                Reset Form
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">Tournament List</h2>
              <p className="mt-1 text-sm text-slate-400">
                Select any tournament to customize or delete.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-white/20 bg-transparent text-white hover:bg-white/10"
              onClick={() => fetchTournaments()}
              disabled={tournamentsLoading}
            >
              {tournamentsLoading ? "Refreshing..." : "Refresh"}
            </Button>
          </div>

          {tournamentsLoading ? (
            <p className="mt-4 text-slate-400">Loading tournaments...</p>
          ) : managedTournaments.length === 0 ? (
            <p className="mt-4 text-slate-400">No custom tournaments found yet. Create one from the left panel.</p>
          ) : (
            <div className="mt-5 space-y-3">
              {managedTournaments.map((tournament) => (
                <div
                  key={tournament.id}
                  className={`rounded-xl border px-4 py-3 ${editingTournamentId === tournament.id ? "border-cyan-400/40 bg-cyan-500/10" : "border-white/10 bg-slate-950/60"}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{tournament.name}</p>
                      <p className="text-xs text-slate-500">
                        {tournament.status} • Participants: {tournament.participants} • Budget: {tournament.budget}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="border-cyan-500/30 bg-transparent text-cyan-300 hover:bg-cyan-500/10"
                        onClick={() => loadTournamentForEdit(tournament)}
                      >
                        Customize
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="border-red-500/30 bg-transparent text-red-300 hover:bg-red-500/10"
                        onClick={() => deleteTournament(tournament.id)}
                        disabled={deletingTournamentId === tournament.id}
                      >
                        {deletingTournamentId === tournament.id ? "Deleting..." : "Delete"}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      )}

      {activeAdminView === "badges" && (
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
                <option value="">Select a managed tournament...</option>
                {achievementTournamentOptions.map((tournament) => (
                  <option key={tournament.id} value={tournament.id}>
                    {tournament.name}
                  </option>
                ))}
              </select>
              {achievementTournamentOptions.length === 0 ? (
                <p className="mt-1 text-xs text-amber-300">Create a tournament first to award badges.</p>
              ) : null}
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
              disabled={awardingBadge || !achievementUserId || !achievementTournamentId}
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
      )}

      {activeAdminView === "users" && (
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
      )}
    </Container>
  );
}
