export function slugifyPlayerName(value: string) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function playerProfilePath(playerId?: string | null, playerName?: string) {
  const slug = String(playerId ?? "").trim() || slugifyPlayerName(playerName ?? "");
  return slug ? `/players/${encodeURIComponent(slug)}` : "/players";
}
