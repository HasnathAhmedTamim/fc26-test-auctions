"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { showConfirmAlert, showErrorAlert, showSuccessAlert } from "@/lib/alerts";
import { Tournament } from "@/types/tournament";
import type {
  AdminAchievement,
  AdminUser,
  AdminView,
  AuctionRoom,
  ManagerRoster,
  PlayerOption,
  RoomAccessManager,
  UserDraft,
  TournamentStandingRow,
  TournamentFixtureRow,
} from "./types";

export function useAdminPanel() {
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

  async function createRoom(e: FormEvent) {
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

  return {
    activeAdminView, setActiveAdminView,
    users, userDrafts, usersLoading, usersError, creatingUser, updatingUserId, deletingUserId,
    newUserName, setNewUserName, newUserEmail, setNewUserEmail, newUserPassword, setNewUserPassword, newUserRole, setNewUserRole,
    rooms, players, managers, name, setName, budget, setBudget, maxPlayers, setMaxPlayers,
    selectedRoomId, setSelectedRoomId, selectedManagerId, setSelectedManagerId, selectedPlayerId, setSelectedPlayerId,
    transferAmount, setTransferAmount, budgetManagerId, setBudgetManagerId, budgetAdjustment, setBudgetAdjustment,
    loading, rosterLoading, assigning, adjustingBudget, endingRoom, deletingRoomId, removingKey,
    error, rosterError, adminMessage, achievements, achievementsLoading, achievementUserId, setAchievementUserId,
    achievementTournamentId, achievementTournamentName, setAchievementTournamentName, achievementBadgeType, setAchievementBadgeType,
    awardingBadge, revokingBadgeId, roomAccessManagers, setRoomAccessManagers, roomAccessLoading, roomAccessUpdating, roomAccessBulkUpdating,
    activeAccessRoomId, setActiveAccessRoomId, managedTournaments, tournamentsLoading, tournamentError, savingTournament,
    deletingTournamentId, editingTournamentId, tournamentName, setTournamentName, tournamentStatus, setTournamentStatus,
    tournamentBudget, setTournamentBudget, tournamentMaxPlayers, setTournamentMaxPlayers, tournamentMinPlayers, setTournamentMinPlayers,
    tournamentParticipants, teamNamesInput, setTeamNamesInput, tournamentStandings, tournamentFixtures, setTournamentFixtures,
    roomStats, selectedPlayer, managerUsers, achievementTournamentOptions,
    fetchRooms, fetchPlayers, fetchUsers, fetchTournaments, fetchAchievements, fetchManagerRoster, fetchRoomAccess,
    handlePlayerChange, updateUserDraft, createUser, saveUser, deleteUser, endRoom, adjustBudget, createRoom,
    assignPlayerToManager, removePlayerFromManager, toggleRoomAccess, bulkToggleRoomAccess, deleteRoom,
    handleTournamentChange, resetTournamentForm, loadTournamentForEdit, buildStandingsFromTeams, generateRandomFixtures,
    updateStanding, addStandingRow, removeStandingRow, recalculateStandingsFromFixtures, updateFixture, addFixtureRow,
    removeFixtureRow, saveTournament, deleteTournament, awardBadgeToUser, revokeBadge,
  };
}
