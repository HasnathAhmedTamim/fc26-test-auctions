export function buildCompareUrl(playerIds: string[]) {
  const params = new URLSearchParams();
  playerIds
    .filter(Boolean)
    .slice(0, 4)
    .forEach((id, index) => {
      params.set(`p${index + 1}`, id);
    });

  const query = params.toString();
  return query ? `/players/compare?${query}` : "/players/compare";
}
