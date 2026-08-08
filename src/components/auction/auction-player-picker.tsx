"use client";

import { useMemo } from "react";
import { PlayerSearchPicker } from "@/components/players/player-search-picker";
import { Player } from "@/types/player";

type Props = {
  players: Player[];
  soldPlayerIds: Set<string>;
  soldPlayerNames: Set<string>;
  value: string;
  onChange: (playerId: string) => void;
};

function isPlayerSold(player: Player, soldPlayerIds: Set<string>, soldPlayerNames: Set<string>) {
  return soldPlayerIds.has(player.id) || soldPlayerNames.has(player.name.trim().toLowerCase());
}

export function AuctionPlayerPicker({
  players,
  soldPlayerIds,
  soldPlayerNames,
  value,
  onChange,
}: Props) {
  const availableCount = useMemo(
    () => players.filter((player) => !isPlayerSold(player, soldPlayerIds, soldPlayerNames)).length,
    [players, soldPlayerIds, soldPlayerNames]
  );

  return (
    <div className="min-w-60 flex-1">
      <PlayerSearchPicker
        players={players}
        value={value}
        onChange={onChange}
        label={`Select player (${availableCount} available, ${soldPlayerIds.size} sold)`}
        isPlayerDisabled={(player) => isPlayerSold(player, soldPlayerIds, soldPlayerNames)}
        getDisabledReason={(player) =>
          isPlayerSold(player, soldPlayerIds, soldPlayerNames) ? "SOLD" : null
        }
      />
    </div>
  );
}
