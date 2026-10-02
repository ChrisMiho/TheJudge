import { useState, type FormEvent } from "react";
import { MAX_PLAYER_COUNT, MIN_PLAYER_COUNT } from "../../../lib/lifeTracker/state";
import type { PlayerLabel } from "../../../types";
import type { CardStyle, LayoutMode } from "../../../lib/lifeTracker/types";
import { ConfirmSheet } from "../../ConfirmSheet";

export interface GameSetupPanelPlayer {
  label: PlayerLabel;
  displayName: string;
}

export interface GameSetupPanelProps {
  playerCount: number;
  layoutMode: LayoutMode;
  cardStyle: CardStyle;
  startingLife: number;
  players: GameSetupPanelPlayer[];
  onPlayerCountChange: (count: number) => void;
  onLayoutModeChange: (mode: LayoutMode) => void;
  onCardStyleChange: (cardStyle: CardStyle) => void;
  onStartingLifeChange: (startingLife: number) => void;
  onDisplayNameChange: (label: PlayerLabel, value: string) => void;
  onReset: () => void;
  onNewGame: () => void;
}

/** REQ-202: Reset and New game each ask first through the shared confirm sheet
 * (REQ-208) rather than an in-place two-step confirm — today's confirmation
 * copy is unchanged, only where it is asked. At most one can be open at a
 * time; closing Game Setup unmounts this panel, which drops a pending one
 * with it. */
type PendingAction = "reset" | "new-game";

const STARTING_LIFE_PRESETS = [20, 25, 30, 40] as const;
const MIN_CUSTOM_STARTING_LIFE = 1;
const MAX_CUSTOM_STARTING_LIFE = 999;

// Look-matching pass (slice Q), requirement 1: the starting-life pills take
// `life-tracker-menus.html:102-107`'s `.life-pills button` look — an
// outline glow (border/fill/text all accent-soft) in place of the old solid
// `accent-strong` fill.
function lifePillClassName(isSelected: boolean): string {
  return `motion-focus min-h-11 min-w-11 rounded-full border px-3 text-sm font-black tabular-nums transition ${
    isSelected
      ? "border-accent-soft bg-accent/24 text-accent-soft shadow-[0_0_14px_-5px_rgb(var(--accent)/0.8)]"
      : "border-zinc-700 bg-zinc-900 text-zinc-100 hover:border-accent-soft"
  }`;
}

export function GameSetupPanel({
  playerCount,
  layoutMode,
  cardStyle,
  startingLife,
  players,
  onPlayerCountChange,
  onLayoutModeChange,
  onCardStyleChange,
  onStartingLifeChange,
  onDisplayNameChange,
  onReset,
  onNewGame
}: GameSetupPanelProps): JSX.Element {
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [isEditingStartingLifeCustom, setIsEditingStartingLifeCustom] = useState(false);
  const [startingLifeDraft, setStartingLifeDraft] = useState("");
  const [customError, setCustomError] = useState<string | null>(null);
  const isCustomStartingLife = !(STARTING_LIFE_PRESETS as readonly number[]).includes(startingLife);

  function applyCustomLife(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const isIntegerText = /^\d+$/.test(startingLifeDraft);
    const parsed = Number(startingLifeDraft);

    if (
      !isIntegerText ||
      !Number.isInteger(parsed) ||
      parsed < MIN_CUSTOM_STARTING_LIFE ||
      parsed > MAX_CUSTOM_STARTING_LIFE
    ) {
      setCustomError(
        `Enter a whole number from ${MIN_CUSTOM_STARTING_LIFE} to ${MAX_CUSTOM_STARTING_LIFE}.`
      );
      return;
    }

    setCustomError(null);
    onStartingLifeChange(parsed);
    setIsEditingStartingLifeCustom(false);
  }

  function beginCustomLifeEdit(): void {
    setStartingLifeDraft(isCustomStartingLife ? String(startingLife) : "60");
    setCustomError(null);
    setIsEditingStartingLifeCustom(true);
  }

  function cancelCustomLifeEdit(): void {
    setCustomError(null);
    setIsEditingStartingLifeCustom(false);
  }

  return (
    <section aria-label="Game setup controls" className="divide-y divide-zinc-700/70">
      {/* Look-matching pass (slice Q), requirement 1: rows take
          `life-tracker-menus.html:213-214`'s `.lt-rows` grid (30px glyph
          column / words / chevron) in place of the prior ad hoc grid —
          wording, the "THIS GAME" grouping below, and the danger-glyph
          marking are unchanged from the existing look. */}
      <div className="pb-4">
        <p className="mb-1 px-1 text-[0.68rem] font-bold uppercase tracking-[0.1em] text-zinc-500">This game</p>
        <div className="lt-rows">
          <button type="button" aria-label="Reset current game" onClick={() => setPendingAction("reset")}>
            <span aria-hidden="true" className="glyph text-accent-soft">
              ↺
            </span>
            <span className="words min-w-0">
              <span className="block text-sm font-bold text-zinc-100">Reset life totals</span>
              <small className="block text-zinc-500">Back to starting life, counters cleared. Names stay.</small>
            </span>
            <span aria-hidden="true" className="chev">
              ›
            </span>
          </button>
          <button type="button" aria-label="Start new game" className="danger" onClick={() => setPendingAction("new-game")}>
            <span aria-hidden="true" className="glyph text-rose-400">
              ✦
            </span>
            <span className="words min-w-0">
              <span className="block text-sm font-bold text-zinc-100">New game</span>
              <small className="block text-zinc-500">4 players at 40, names and counters cleared.</small>
            </span>
            <span aria-hidden="true" className="chev">
              ›
            </span>
          </button>
        </div>
      </div>

      <div className="py-4">
        <p
          data-testid="game-setup-section-players"
          className="mb-2 flex items-center gap-2 text-sm font-bold text-accent-soft"
        >
          <span aria-hidden="true" className="text-base leading-none">
            👥
          </span>
          Players
        </p>
        {/* Requirement 1: one joined stepper pill (`.stepper`,
            `life-tracker-menus.html:70-75`) in place of the separate −/+
            circles. The mockup pairs this with an "Edit names ▾" toggle that
            collapses the name fields; per the owner question below (Q4,
            carried from LOOK-GAPS), that toggle is not adopted — slice J's
            own reading is that it is a leftover from an earlier mockup
            round, so the fields below stay unconditionally visible and no
            toggle control is added here. */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="lt-stepper" aria-label="Player count">
            <button
              type="button"
              aria-label="Decrease player count"
              onClick={() => onPlayerCountChange(playerCount - 1)}
              disabled={playerCount === MIN_PLAYER_COUNT}
            >
              <span aria-hidden="true">−</span>
            </button>
            <span className="val">
              <span>{playerCount}</span>
              <small>players</small>
            </span>
            <button
              type="button"
              aria-label="Increase player count"
              onClick={() => onPlayerCountChange(playerCount + 1)}
              disabled={playerCount === MAX_PLAYER_COUNT}
            >
              <span aria-hidden="true">+</span>
            </button>
          </div>
        </div>

        {/* REQ-202: name fields are always visible, two to a row, each carrying its seat
            number — superseding the former "Edit names" disclosure toggle. Restyled per
            `life-tracker-menus.html:83-84`'s `.names` (requirement 4: the owner question's
            "Edit names ▾" toggle is not adopted — these never collapse). */}
        <div className="lt-names mt-3">
          {players.map((player) => (
            <label key={player.label}>
              <span aria-hidden="true" className="num">
                {player.label.replace("Player ", "")}
              </span>
              <input
                aria-label={`${player.label} display name`}
                value={player.displayName}
                onChange={(event) => onDisplayNameChange(player.label, event.target.value)}
              />
            </label>
          ))}
        </div>
      </div>

      <div className="py-4">
        <p className="mb-2 flex items-center gap-2 text-sm font-bold text-zinc-400">
          <span aria-hidden="true" className="text-base leading-none">
            ♥
          </span>
          Starting life
        </p>
        <div className="lt-life-pills" aria-label="Starting life presets">
          {STARTING_LIFE_PRESETS.map((preset) => {
            const isSelected = startingLife === preset;
            return (
              <button
                key={preset}
                type="button"
                aria-label={`Set starting life to ${preset}`}
                aria-pressed={isSelected}
                onClick={() => {
                  setCustomError(null);
                  setIsEditingStartingLifeCustom(false);
                  onStartingLifeChange(preset);
                }}
                className={lifePillClassName(isSelected)}
              >
                {preset}
              </button>
            );
          })}
          {isEditingStartingLifeCustom ? (
            <form noValidate onSubmit={applyCustomLife} className="relative min-h-11 min-w-20">
              <input
                autoFocus
                type="number"
                min={MIN_CUSTOM_STARTING_LIFE}
                max={MAX_CUSTOM_STARTING_LIFE}
                step="1"
                aria-label="Custom starting life"
                aria-invalid={customError !== null}
                aria-describedby={customError ? "custom-starting-life-error" : undefined}
                value={startingLifeDraft}
                onChange={(event) => {
                  setStartingLifeDraft(event.target.value);
                  setCustomError(null);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    event.preventDefault();
                    event.stopPropagation();
                    cancelCustomLifeEdit();
                  }
                }}
                onBlur={cancelCustomLifeEdit}
                inputMode="numeric"
                className="motion-focus min-h-11 w-full min-w-0 rounded-full border border-accent-strong bg-zinc-950 px-2 pr-8 text-center text-sm font-black tabular-nums text-zinc-100 ring-2 ring-accent/25"
              />
              <button
                type="submit"
                aria-label="Apply custom starting life"
                onPointerDown={(event) => event.preventDefault()}
                className="motion-focus absolute right-1 top-1/2 flex min-h-8 min-w-8 -translate-y-1/2 items-center justify-center rounded-full text-sm font-black text-accent-soft hover:bg-zinc-800"
              >
                <span aria-hidden="true">✓</span>
              </button>
            </form>
          ) : (
            <button
              type="button"
              aria-label="Set custom starting life"
              aria-pressed={isCustomStartingLife}
              onClick={beginCustomLifeEdit}
              className={lifePillClassName(isCustomStartingLife)}
            >
              {isCustomStartingLife ? startingLife : "Custom"}
            </button>
          )}
        </div>
        {customError ? (
          <p id="custom-starting-life-error" role="alert" className="mt-2 text-sm text-rose-400">
            {customError}
          </p>
        ) : (
          <p className="mt-2 text-xs text-zinc-500">2 players start at 20; 3 or more start at 40.</p>
        )}
      </div>

      {/* Requirement 1: joined segmented controls (`.seg.full`,
          `life-tracker-menus.html:237-238`) in place of the separate pill
          pair — one label per control, no group label above both (matching
          the mockup's own round-13 note). */}
      <div className="py-4">
        <div className="lt-pair">
          <div className="lt-pair-sub">
            <small>Layout</small>
            <div className="lt-seg full" aria-label="Layout">
              {(["grid", "list"] as const).map((mode) => {
                const isSelected = layoutMode === mode;
                const label = mode === "grid" ? "Grid" : "List";
                return (
                  <button
                    key={mode}
                    type="button"
                    aria-label={`Use ${mode} layout`}
                    aria-pressed={isSelected}
                    onClick={() => onLayoutModeChange(mode)}
                  >
                    <span aria-hidden="true" className="glyph">
                      {mode === "grid" ? "▦" : "☷"}
                    </span>
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="lt-pair-sub">
            <small>Card style</small>
            <div className="lt-seg full" aria-label="Card style">
              {(["gradient", "flat"] as const).map((style) => {
                const isSelected = cardStyle === style;
                return (
                  <button
                    key={style}
                    type="button"
                    aria-label={`Use ${style} card style`}
                    aria-pressed={isSelected}
                    onClick={() => onCardStyleChange(style)}
                  >
                    <span aria-hidden="true" className="glyph">
                      {style === "gradient" ? "◐" : "●"}
                    </span>
                    {style === "gradient" ? "Ombre" : "Flat"}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <ConfirmSheet
        isOpen={pendingAction === "reset"}
        onKeep={() => setPendingAction(null)}
        onConfirm={() => {
          setPendingAction(null);
          onReset();
        }}
        question="Reset this game?"
        detail="Every life total goes back to the starting life and all counters clear. Players, names, and settings stay."
        confirmLabel="Reset"
        testId="life-tracker-reset-confirm"
      />
      <ConfirmSheet
        isOpen={pendingAction === "new-game"}
        onKeep={() => setPendingAction(null)}
        onConfirm={() => {
          setPendingAction(null);
          onNewGame();
        }}
        question="Start a new game?"
        detail="This game is discarded: back to 4 players at 40 life, with names and counters cleared. Layout and card style stay."
        confirmLabel="New game"
        testId="life-tracker-new-game-confirm"
      />
    </section>
  );
}
