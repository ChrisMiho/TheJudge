import type { ReactNode } from "react";
import type { PlayerLabel } from "../types";

export const MIN_PLAYER_ROSTER_SIZE = 2;
export const MAX_PLAYER_ROSTER_SIZE = 8;

export type RosterPlayer = {
  label: PlayerLabel;
  displayName: string;
  lifeTotal?: string;
};

export type PlayerRosterEditorProps = {
  players: RosterPlayer[];
  playerCount: number;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onAddPlayer: () => void;
  onRemovePlayer: () => void;
  onDisplayNameChange: (player: PlayerLabel, value: string) => void;
  onLifeTotalChange?: (player: PlayerLabel, value: string) => void;
  showLifeTotals?: boolean;
  renderPlayerExtras?: (player: RosterPlayer) => ReactNode;
};

/**
 * Controlled roster disclosure: player-count controls plus an expandable list
 * of per-player display-name (and optionally life-total) editors. Presentation
 * only — callers own validation, default life transitions, and persistence.
 */
export function PlayerRosterEditor({
  players,
  playerCount,
  isExpanded,
  onToggleExpanded,
  onAddPlayer,
  onRemovePlayer,
  onDisplayNameChange,
  onLifeTotalChange,
  showLifeTotals = true,
  renderPlayerExtras
}: PlayerRosterEditorProps): JSX.Element {
  return (
    <>
      <div className="ambient-accent-surface ambient-accent-interactive flex items-center justify-between gap-3 rounded-xl border border-zinc-700/80 bg-zinc-950/40 px-3 py-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={isExpanded ? "Hide player details" : "Show player details"}
            aria-expanded={isExpanded}
            onClick={onToggleExpanded}
            className="motion-hover motion-press motion-focus inline-flex min-h-[2.75rem] min-w-[3.5rem] items-center justify-center rounded-lg border border-zinc-600 bg-zinc-800/70 px-3 py-1.5 text-xl leading-none text-zinc-200 transition hover:bg-zinc-700/80"
          >
            {isExpanded ? "▾" : "▸"}
          </button>
          <span className="text-sm font-semibold text-zinc-100">
            {playerCount} {playerCount === 1 ? "player" : "players"}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            aria-label="Remove last player"
            onClick={onRemovePlayer}
            disabled={playerCount <= MIN_PLAYER_ROSTER_SIZE}
            className="motion-hover motion-press motion-focus inline-flex min-h-[2.75rem] min-w-[3.5rem] items-center justify-center rounded-lg border border-zinc-500 bg-zinc-800/70 px-4 py-1.5 text-xs font-semibold text-zinc-100 transition hover:bg-zinc-700/80 disabled:cursor-not-allowed disabled:opacity-50"
          >
            −
          </button>
          <button
            type="button"
            aria-label="Add player"
            onClick={onAddPlayer}
            disabled={playerCount >= MAX_PLAYER_ROSTER_SIZE}
            className="motion-hover motion-press motion-focus inline-flex min-h-[2.75rem] min-w-[3.5rem] items-center justify-center rounded-lg border border-accent/50 bg-accent/10 px-4 py-1.5 text-xs font-semibold text-accent-soft transition hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            +
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-2">
          {players.map((player) => (
            <div
              key={player.label}
              className="space-y-2 rounded-xl border border-zinc-700/80 bg-zinc-950/40 px-3 py-2 text-sm"
            >
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-400">
                  {player.label} name
                </span>
                <input
                  aria-label={`${player.label} display name`}
                  value={player.displayName}
                  onChange={(event) => onDisplayNameChange(player.label, event.target.value)}
                  className="motion-focus rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-1.5 text-zinc-100"
                />
              </label>
              {showLifeTotals && (
                <label className="grid grid-cols-[1fr_auto] items-center gap-3">
                  <span className="font-medium text-zinc-100">Life total</span>
                  <input
                    aria-label={`${player.label} life total`}
                    value={player.lifeTotal ?? ""}
                    onChange={(event) => onLifeTotalChange?.(player.label, event.target.value)}
                    inputMode="numeric"
                    className="motion-focus w-28 rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-1.5 text-right font-semibold text-zinc-100"
                  />
                </label>
              )}
              {renderPlayerExtras?.(player)}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
