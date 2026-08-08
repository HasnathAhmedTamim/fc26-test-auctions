"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Player } from "@/types/player";

type Props = {
  players: Player[];
  value: string;
  onChange: (playerId: string) => void;
  label?: string;
  placeholder?: string;
  id?: string;
  isPlayerDisabled?: (player: Player) => boolean;
  getDisabledReason?: (player: Player) => string | null;
};

function filterPlayers(players: Player[], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return players;

  return players.filter(
    (player) =>
      player.name.toLowerCase().includes(q) ||
      player.position?.toLowerCase().includes(q) ||
      player.club?.toLowerCase().includes(q) ||
      player.nation?.toLowerCase().includes(q) ||
      String(player.rating).includes(q)
  );
}

export function PlayerSearchPicker({
  players,
  value,
  onChange,
  label,
  placeholder = "Search by name, position, club, or rating…",
  id,
  isPlayerDisabled,
  getDisabledReason,
}: Props) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const listboxId = `${inputId}-listbox`;
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selected = players.find((player) => player.id === value);

  const filtered = useMemo(() => {
    const list = filterPlayers(players, query);

    return [...list].sort((a, b) => {
      const aDisabled = isPlayerDisabled?.(a) ?? false;
      const bDisabled = isPlayerDisabled?.(b) ?? false;
      if (aDisabled !== bDisabled) return aDisabled ? 1 : -1;
      return b.rating - a.rating || a.name.localeCompare(b.name);
    });
  }, [players, query, isPlayerDisabled]);

  const visibleOptions = filtered.slice(0, 80);

  useEffect(() => {
    setHighlightIndex(0);
  }, [query, open]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!open || !listRef.current) return;
    const option = listRef.current.querySelector<HTMLElement>(`[data-index="${highlightIndex}"]`);
    option?.scrollIntoView({ block: "nearest" });
  }, [highlightIndex, open]);

  function selectPlayer(player: Player) {
    if (isPlayerDisabled?.(player)) return;
    onChange(player.id);
    setQuery("");
    setOpen(false);
  }

  function moveHighlight(delta: number) {
    if (!visibleOptions.length) return;

    let next = highlightIndex;
    for (let attempt = 0; attempt < visibleOptions.length; attempt += 1) {
      next = (next + delta + visibleOptions.length) % visibleOptions.length;
      if (!isPlayerDisabled?.(visibleOptions[next])) break;
    }

    setHighlightIndex(next);
  }

  function handleInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      setOpen(true);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveHighlight(1);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      moveHighlight(-1);
      return;
    }

    if (event.key === "Enter" && open) {
      event.preventDefault();
      const player = visibleOptions[highlightIndex];
      if (player) selectPlayer(player);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
    }
  }

  const displayValue = open
    ? query
    : selected
      ? `${selected.name} (${selected.position}, ${selected.rating} OVR)`
      : query;

  return (
    <div ref={containerRef} className="relative w-full">
      {label ? (
        <label htmlFor={inputId} className="mb-1 block text-xs uppercase tracking-[0.18em] text-slate-400">
          {label}
        </label>
      ) : null}

      <input
        id={inputId}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={
          open && visibleOptions[highlightIndex]
            ? `${inputId}-option-${visibleOptions[highlightIndex].id}`
            : undefined
        }
        value={displayValue}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
          if (value) onChange("");
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleInputKeyDown}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-white/10 bg-slate-900 px-3 py-3 text-sm outline-none placeholder:text-slate-500 focus:border-emerald-400/60"
      />

      {open ? (
        <div
          id={listboxId}
          ref={listRef}
          role="listbox"
          aria-label={label ?? "Player options"}
          className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-white/10 bg-slate-900 shadow-xl"
        >
          {visibleOptions.length === 0 ? (
            <p className="px-3 py-4 text-sm text-slate-500">No players match your search.</p>
          ) : (
            visibleOptions.map((player, index) => {
              const disabled = isPlayerDisabled?.(player) ?? false;
              const disabledReason = getDisabledReason?.(player);
              const price = player.basePrice ?? player.price;
              const highlighted = index === highlightIndex;

              return (
                <button
                  key={player.id}
                  id={`${inputId}-option-${player.id}`}
                  data-index={index}
                  type="button"
                  role="option"
                  aria-selected={value === player.id}
                  disabled={disabled}
                  onMouseEnter={() => setHighlightIndex(index)}
                  onClick={() => selectPlayer(player)}
                  className={`flex w-full items-center justify-between gap-2 border-b border-white/5 px-3 py-2 text-left text-sm last:border-0 ${
                    disabled
                      ? "cursor-not-allowed bg-slate-950/50 text-slate-600"
                      : highlighted
                        ? "bg-emerald-500/15 text-emerald-200"
                        : value === player.id
                          ? "bg-emerald-500/10 text-emerald-200"
                          : "text-slate-200 hover:bg-white/5"
                  }`}
                >
                  <span>
                    {player.name}{" "}
                    <span className="text-slate-400">
                      ({player.position}, {player.rating} OVR)
                    </span>
                  </span>
                  <span className="shrink-0 text-xs">{disabledReason ?? `${price} coins`}</span>
                </button>
              );
            })
          )}
          {filtered.length > 80 ? (
            <p className="px-3 py-2 text-xs text-slate-500">
              Showing first 80 matches — refine your search to narrow results.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
