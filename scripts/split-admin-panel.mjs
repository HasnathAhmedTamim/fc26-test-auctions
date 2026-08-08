import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const src = fs.readFileSync(path.join(root, "src/components/admin/admin-panel.tsx"), "utf8");
const outDir = path.join(root, "src/components/features/admin");
fs.mkdirSync(outDir, { recursive: true });

const hookStart = src.indexOf("export function AdminPanel()");
const returnMatch = src.slice(hookStart).match(/\r?\n  return \(\r?\n    <Container/);
if (!returnMatch) throw new Error("AdminPanel return block not found");
const returnStart = hookStart + returnMatch.index;
const hookBody = src.slice(hookStart, returnStart);

const tabs = [
  { name: "rooms-tab", component: "RoomsTab", marker: '{activeAdminView === "rooms" && (' },
  { name: "roster-tab", component: "RosterTab", marker: '{activeAdminView === "roster" && (' },
  { name: "tournaments-tab", component: "TournamentsTab", marker: '{activeAdminView === "tournaments" && (' },
  { name: "badges-tab", component: "BadgesTab", marker: '{activeAdminView === "badges" && (' },
  { name: "users-tab", component: "UsersTab", marker: '{activeAdminView === "users" && (' },
];

function extractBlock(marker) {
  const start = src.indexOf(marker, returnStart);
  if (start < 0) throw new Error(`Missing ${marker}`);
  let depth = 0;
  let i = start + marker.length;
  for (; i < src.length; i++) {
    const ch = src[i];
    if (ch === "(") depth++;
    else if (ch === ")") {
      if (depth === 0) {
        return src.slice(start + marker.length, i).trim();
      }
      depth--;
    }
  }
  throw new Error(`Unclosed block for ${marker}`);
}

const typeSection = src.slice(0, src.indexOf("const STATUS_STYLES"));
const typesOnly = typeSection
  .replace(/^"use client";\r?\n\r?\n/, "")
  .replace(/^import[\s\S]*?from "@\/types\/tournament";\r?\n\r?\n/m, "")
  .trim();

fs.writeFileSync(
  path.join(outDir, "types.ts"),
  `import { Tournament, TournamentFixture, TournamentStanding } from "@/types/tournament";\n\n${typesOnly.replace(/^type /gm, "export type ")}\n`
);

const constantsMatch = src.match(/const STATUS_STYLES[\s\S]*?\};\r?\n/);
if (!constantsMatch) throw new Error("STATUS_STYLES not found");
fs.writeFileSync(
  path.join(outDir, "constants.ts"),
  constantsMatch[0].replace("const STATUS_STYLES", "export const STATUS_STYLES")
);

const hookImports = `"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
} from "./types";

`;

const hookReturn = `
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
    awardingBadge, revokingBadgeId, roomAccessManagers, roomAccessLoading, roomAccessUpdating, roomAccessBulkUpdating,
    activeAccessRoomId, setActiveAccessRoomId, managedTournaments, tournamentsLoading, tournamentError, savingTournament,
    deletingTournamentId, editingTournamentId, tournamentName, setTournamentName, tournamentStatus, setTournamentStatus,
    tournamentBudget, setTournamentBudget, tournamentMaxPlayers, setTournamentMaxPlayers, tournamentMinPlayers, setTournamentMinPlayers,
    tournamentParticipants, teamNamesInput, setTeamNamesInput, tournamentStandings, tournamentFixtures,
    roomStats, selectedPlayer, managerUsers, achievementTournamentOptions,
    fetchRooms, fetchPlayers, fetchUsers, fetchTournaments, fetchAchievements, fetchManagerRoster, fetchRoomAccess,
    handlePlayerChange, updateUserDraft, createUser, saveUser, deleteUser, endRoom, adjustBudget, createRoom,
    assignPlayerToManager, removePlayerFromManager, toggleRoomAccess, bulkToggleRoomAccess, deleteRoom,
    handleTournamentChange, resetTournamentForm, loadTournamentForEdit, buildStandingsFromTeams, generateRandomFixtures,
    updateStanding, addStandingRow, removeStandingRow, recalculateStandingsFromFixtures, updateFixture, addFixtureRow,
    removeFixtureRow, saveTournament, deleteTournament, awardBadgeToUser, revokeBadge,
  };
}
`;

fs.writeFileSync(
  path.join(outDir, "use-admin-panel.ts"),
  hookImports + hookBody.replace("export function AdminPanel()", "export function useAdminPanel()") + hookReturn
);

const ctxKeys = [
  "activeAdminView", "setActiveAdminView", "users", "userDrafts", "usersLoading", "usersError", "creatingUser",
  "updatingUserId", "deletingUserId", "newUserName", "setNewUserName", "newUserEmail", "setNewUserEmail",
  "newUserPassword", "setNewUserPassword", "newUserRole", "setNewUserRole", "rooms", "players", "managers", "name",
  "setName", "budget", "setBudget", "maxPlayers", "setMaxPlayers", "selectedRoomId", "setSelectedRoomId",
  "selectedManagerId", "setSelectedManagerId", "selectedPlayerId", "setSelectedPlayerId", "transferAmount",
  "setTransferAmount", "budgetManagerId", "setBudgetManagerId", "budgetAdjustment", "setBudgetAdjustment", "loading",
  "rosterLoading", "assigning", "adjustingBudget", "endingRoom", "deletingRoomId", "removingKey", "error",
  "rosterError", "adminMessage", "achievements", "achievementsLoading", "achievementUserId", "setAchievementUserId",
  "achievementTournamentId", "achievementTournamentName", "setAchievementTournamentName", "achievementBadgeType",
  "setAchievementBadgeType", "awardingBadge", "revokingBadgeId", "roomAccessManagers", "roomAccessLoading",
  "roomAccessUpdating", "roomAccessBulkUpdating", "activeAccessRoomId", "setActiveAccessRoomId", "managedTournaments",
  "tournamentsLoading", "tournamentError", "savingTournament", "deletingTournamentId", "editingTournamentId",
  "tournamentName", "setTournamentName", "tournamentStatus", "setTournamentStatus", "tournamentBudget",
  "setTournamentBudget", "tournamentMaxPlayers", "setTournamentMaxPlayers", "tournamentMinPlayers",
  "setTournamentMinPlayers", "tournamentParticipants", "teamNamesInput", "setTeamNamesInput", "tournamentStandings",
  "tournamentFixtures", "roomStats", "selectedPlayer", "managerUsers", "achievementTournamentOptions", "fetchRooms",
  "fetchPlayers", "fetchUsers", "fetchTournaments", "fetchAchievements", "fetchManagerRoster", "fetchRoomAccess",
  "handlePlayerChange", "updateUserDraft", "createUser", "saveUser", "deleteUser", "endRoom", "adjustBudget",
  "createRoom", "assignPlayerToManager", "removePlayerFromManager", "toggleRoomAccess", "bulkToggleRoomAccess",
  "deleteRoom", "handleTournamentChange", "resetTournamentForm", "loadTournamentForEdit", "buildStandingsFromTeams",
  "generateRandomFixtures", "updateStanding", "addStandingRow", "removeStandingRow", "recalculateStandingsFromFixtures",
  "updateFixture", "addFixtureRow", "removeFixtureRow", "saveTournament", "deleteTournament", "awardBadgeToUser",
  "revokeBadge", "STATUS_STYLES",
];

function prefixCtx(content) {
  let next = content;
  for (const key of [...ctxKeys].sort((a, b) => b.length - a.length)) {
    const re = new RegExp(`(?<![.\\w])${key}(?![.\\w])`, "g");
    next = next.replace(re, `ctx.${key}`);
  }
  return next;
}

for (const tab of tabs) {
  const content = prefixCtx(extractBlock(tab.marker));
  fs.writeFileSync(
    path.join(outDir, `${tab.name}.tsx`),
    `"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAdminPanelContext } from "./admin-panel-context";
import { STATUS_STYLES } from "./constants";

export function ${tab.component}() {
  const ctx = useAdminPanelContext();
  return (
${content}
  );
}
`
  );
}

console.log("Admin panel split complete");
