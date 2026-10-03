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
 * so the box read as the control and the arrow was barely legible (REQ-135). The mockup's
 * `.chev` (`in-depth-question.html`'s `.players-row .expander .chev`) rotates the same way.
 */
function DisclosureTriangle({ isExpanded }: { isExpanded: boolean }): JSX.Element {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 16 16"
      className={`chev h-3 w-3 fill-current transition-transform${isExpanded ? " rotate-90" : ""}`}
    >
      <polygon points="4,1 14,8 4,15" />
    </svg>
  );
}

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
  /** Shared, controlled all-player secondary-details disclosure state — REQ-100's one
   * "More details for all players" toggle (REQ-209's Game station names it that in
   * product terms); every player's arrow drives this same synchronized state. */
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
      <div className="players-row ambient-accent-surface ambient-accent-interactive">
        <button
          type="button"
          aria-label={isExpanded ? "Hide player details" : "Show player details"}
          aria-expanded={isExpanded}
          onClick={onToggleExpanded}
          className="btn expander motion-hover motion-press motion-focus"
        >
          <DisclosureTriangle isExpanded={isExpanded} />
          <strong>
            {playerCount} {playerCount === 1 ? "player" : "players"}
          </strong>
        </button>
        <button
          type="button"
          aria-label="Remove last player"
          onClick={onRemovePlayer}
          disabled={playerCount <= MIN_PLAYER_ROSTER_SIZE}
          className="btn stepper motion-hover motion-press motion-focus"
        >
          −
        </button>
        <button
          type="button"
          aria-label="Add player"
          onClick={onAddPlayer}
          disabled={playerCount >= MAX_PLAYER_ROSTER_SIZE}
          className="btn stepper add motion-hover motion-press motion-focus"
        >
          +
        </button>
      </div>

      {isExpanded && (
        <div className="roster" data-open="true" data-more={secondaryDetailsExpanded}>
          {players.map((player) => {
            const secondaryRegionId = `player-secondary-details-${player.label.replace(/\s+/g, "-").toLowerCase()}`;
            return (
              <div key={player.label} className="player-card">
                {/* `min-w-0` on the row and on the growing name column: a flex child defaults
                    to `min-width: auto`, so the name input's intrinsic width acted as a floor
                    and pushed the row wider than its panel at phone widths — the row measured
                    322px inside a 288px box and the disclosure control rendered past the
                    panel's right border (DEC-128, REQ-106). */}
                <div className="player min-w-0">
                  <label className="min-w-0">
                    {player.label} name
                    <input
                      aria-label={`${player.label} display name`}
                      value={player.displayName}
                      onChange={(event) => onDisplayNameChange(player.label, event.target.value)}
                      placeholder={player.label}
                      className="field name w-full min-w-0"
                    />
                  </label>
                  {showLifeTotals && (
                    <label>
                      Life
                      <input
                        aria-label={`${player.label} life total`}
                        value={player.lifeTotal ?? ""}
                        onChange={(event) => onLifeTotalChange?.(player.label, event.target.value)}
                        inputMode="numeric"
                        className="field life"
                      />
                    </label>
                  )}
                </div>
                {renderPlayerExtras && secondaryDisclosureControlled && (
                  <div className="player-more">
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
                      className="link motion-focus"
                    >
                      <DisclosureTriangle isExpanded={secondaryDetailsExpanded} />
                    </button>
                  </div>
                )}
                {renderPlayerExtras && extrasVisible && (
                  <div id={secondaryRegionId} role="group" className="extras">
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
