import type { ReactNode } from "react";
import type { PlayerLabel } from "../types";

export const MIN_PLAYER_ROSTER_SIZE = 2;
export const MAX_PLAYER_ROSTER_SIZE = 8;

export type RosterPlayer = {
  label: PlayerLabel;
  displayName: string;
  lifeTotal?: string;
};

/**
 * One disclosure treatment for every roster arrow: a full-size triangle whose painted
 * mass is the control, rotated rather than swapped for a second glyph. The previous
 * U+25B8/U+25BE text glyphs rendered as a few pixels of ink inside a wide boxed button,
 * so the box read as the control and the arrow was barely legible (REQ-135).
 */
function DisclosureTriangle({ isExpanded }: { isExpanded: boolean }): JSX.Element {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 16 16"
      className={`h-5 w-5 fill-current transition-transform${isExpanded ? " rotate-90" : ""}`}
    >
      <polygon points="4,1 14,8 4,15" />
    </svg>
  );
}

/**
 * Shared disclosure-button chrome: a 44px-minimum hit area with no border or fill, so the
 * triangle above is the only painted mass.
 */
const DISCLOSURE_CONTROL_CLASS =
  "motion-hover motion-press motion-focus inline-flex min-h-[2.75rem] items-center justify-center rounded-lg text-zinc-300 transition hover:text-zinc-50";

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
  /** Shared, controlled all-player secondary-details disclosure state. */
  secondaryDetailsExpanded?: boolean;
  /** Toggles the shared secondary-details state for every player card. */
  onToggleSecondaryDetails?: () => void;
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
  renderPlayerExtras,
  secondaryDetailsExpanded = false,
  onToggleSecondaryDetails
}: PlayerRosterEditorProps): JSX.Element {
  // Callers that have not migrated to the controlled secondary-details contract keep
  // their prior behavior: extras render inline with no nested arrow.
  const secondaryDisclosureControlled = onToggleSecondaryDetails !== undefined;
  const extrasVisible = secondaryDisclosureControlled ? secondaryDetailsExpanded : true;
  return (
    <>
      <div className="ambient-accent-surface ambient-accent-interactive flex items-center justify-between gap-3 rounded-xl border border-zinc-700/80 bg-zinc-950/40 px-3 py-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={isExpanded ? "Hide player details" : "Show player details"}
            aria-expanded={isExpanded}
            onClick={onToggleExpanded}
            className={`${DISCLOSURE_CONTROL_CLASS} min-w-[3.5rem]`}
          >
            <DisclosureTriangle isExpanded={isExpanded} />
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
          {players.map((player) => {
            const secondaryRegionId = `player-secondary-details-${player.label.replace(/\s+/g, "-").toLowerCase()}`;
            return (
              <div
                key={player.label}
                className="space-y-2 rounded-xl border border-zinc-700/80 bg-zinc-950/40 px-3 py-2 text-sm"
              >
                {/* `min-w-0` on the row and on the growing name column: a flex child defaults
                    to `min-width: auto`, so the name input's intrinsic width acted as a floor
                    and pushed the row wider than its panel at phone widths — the row measured
                    322px inside a 288px box and the disclosure control rendered past the
                    panel's right border (DEC-128, REQ-106). */}
                <div className="flex min-w-0 items-center gap-2">
                  <label className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-400">
                      {player.label} name
                    </span>
                    <input
                      aria-label={`${player.label} display name`}
                      value={player.displayName}
                      onChange={(event) => onDisplayNameChange(player.label, event.target.value)}
                      className="motion-focus w-full min-w-0 rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-1.5 text-zinc-100"
                    />
                  </label>
                  {showLifeTotals && (
                    <label className="flex flex-col items-end gap-1">
                      <span className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-400">
                        Life total
                      </span>
                      <input
                        aria-label={`${player.label} life total`}
                        value={player.lifeTotal ?? ""}
                        onChange={(event) => onLifeTotalChange?.(player.label, event.target.value)}
                        inputMode="numeric"
                        className="motion-focus w-20 rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-1.5 text-right font-semibold text-zinc-100"
                      />
                    </label>
                  )}
                  {renderPlayerExtras && secondaryDisclosureControlled && (
                    <button
                      type="button"
                      aria-expanded={secondaryDetailsExpanded}
                      aria-controls={secondaryRegionId}
                      aria-label={
                        secondaryDetailsExpanded
                          ? "Hide secondary details for all players"
                          : "Show secondary details for all players"
                      }
                      onClick={onToggleSecondaryDetails}
                      className={`${DISCLOSURE_CONTROL_CLASS} min-w-[2.75rem] shrink-0`}
                    >
                      <DisclosureTriangle isExpanded={secondaryDetailsExpanded} />
                    </button>
                  )}
                </div>
                {renderPlayerExtras && extrasVisible && (
                  <div id={secondaryRegionId} role="group" className="space-y-2">
                    {renderPlayerExtras(player)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
