import fs from "node:fs";
import path from "node:path";

const tabDir = path.join(process.cwd(), "src/components/features/admin");
const tabFiles = fs.readdirSync(tabDir).filter((file) => file.endsWith("-tab.tsx"));

const stringFixes = [
  ["No ctx.rooms yet", "No rooms yet"],
  ["No ctx.players assigned", "No players assigned"],
  ["No ctx.users found", "No users found"],
  ["No ctx.managers available", "No managers available"],
  ["registered ctx.users", "registered users"],
  ["Tournament max ctx.players", "Tournament max players"],
  ["Tournament min ctx.players", "Tournament min players"],
  ["Tournament ctx.budget", "Tournament budget"],
  ["Tournament ctx.name for badge award", "Tournament name for badge award"],
  ["Edit ctx.name for", "Edit name for"],
  ["Full ctx.name", "Full name"],
  ["Starting ctx.budget in coins", "Starting budget in coins"],
  ["Enter the amount to add to spent ctx.budget", "Enter the amount to add to spent budget"],
  ["Select manager to adjust ctx.budget", "Select manager to adjust budget"],
  ["Award achievement badges to ctx.managers who win tournaments.", "Award achievement badges to managers who win tournaments."],
  ["All ctx.managers (history)", "All managers (history)"],
];

const ctxKeys = [
  "achievements",
  "users",
  "rooms",
  "players",
  "managers",
  "managedTournaments",
  "tournamentStandings",
  "tournamentFixtures",
  "achievementTournamentOptions",
  "managerUsers",
  "roomAccessManagers",
  "userDrafts",
];

for (const file of tabFiles) {
  const filePath = path.join(tabDir, file);
  let content = fs.readFileSync(filePath, "utf8");

  for (const [from, to] of stringFixes) {
    content = content.replaceAll(from, to);
  }

  for (const key of [...ctxKeys].sort((a, b) => b.length - a.length)) {
    const re = new RegExp(`(?<![.\\w])${key}\\b`, "g");
    content = content.replace(re, (match, offset) => {
      const before = content.slice(Math.max(0, offset - 4), offset);
      if (before.endsWith("ctx.")) return match;
      return `ctx.${match}`;
    });
  }

  content = content.replaceAll("ctx.ctx.", "ctx.");

  fs.writeFileSync(filePath, content);
  console.log(`Fixed ${file}`);
}
