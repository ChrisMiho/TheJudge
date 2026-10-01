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

const PILL_BASE =
  "motion-focus min-h-11 rounded-full border px-3 text-sm font-black tabular-nums transition";
const PILL_SELECTED = "border-accent-strong bg-accent-strong text-accent-contrast shadow-sm";
const PILL_UNSELECTED = "border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800";

function pillClassName(isSelected: boolean): string {
  return `${PILL_BASE} ${isSelected ? PILL_SELECTED : PILL_UNSELECTED}`;
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
      <div className="pb-4">
        {/* REQ-202, matching docs/design/ui-reimagining/direction-1/life-tracker-menus.html's
            `.lt-rows`: tray-style rows (glyph / title+description / chevron), not a solid
            filled button — New Game's glyph alone marks it as the more destructive of the
            two ("danger", mockup's `#ff8fa3` ~ rose-400 here). */}
        <button
          type="button"
          aria-label="Reset current game"
          onClick={() => setPendingAction("reset")}
          className="motion-focus grid min-h-[50px] w-full grid-cols-[1.75rem_1fr_auto] items-center gap-3 rounded-lg px-1 text-left transition hover:bg-zinc-800/70"
        >
          <span aria-hidden="true" className="flex h-7 w-7 items-center justify-center text-base text-accent-soft">
            ↺
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-bold text-zinc-100">Reset life totals</span>
            <span className="block text-xs font-normal text-zinc-500">
              Back to starting life, counters cleared. Names stay.
            </span>
          </span>
          <span aria-hidden="true" className="text-accent-soft">
            ›
          </span>
        </button>
        <button
          type="button"
          aria-label="Start new game"
          onClick={() => setPendingAction("new-game")}
          className="motion-focus grid min-h-[50px] w-full grid-cols-[1.75rem_1fr_auto] items-center gap-3 rounded-lg px-1 text-left transition hover:bg-zinc-800/70"
        >
          <span aria-hidden="true" className="flex h-7 w-7 items-center justify-center text-base text-rose-400">
            ✦
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-bold text-zinc-100">New game</span>
            <span className="block text-xs font-normal text-zinc-500">
              4 players at 40, names and counters cleared.
            </span>
          </span>
          <span aria-hidden="true" className="text-accent-soft">
            ›
          </span>
        </button>
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
        <div className="flex items-center gap-3" aria-label="Player count">
          <button
            type="button"
            aria-label="Decrease player count"
            onClick={() => onPlayerCountChange(playerCount - 1)}
            disabled={playerCount === MIN_PLAYER_COUNT}
            className="motion-focus inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-lg font-black text-zinc-100 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span aria-hidden="true">−</span>
          </button>
          <span className="min-w-8 text-center text-lg font-black tabular-nums text-zinc-100">{playerCount}</span>
          <button
            type="button"
            aria-label="Increase player count"
            onClick={() => onPlayerCountChange(playerCount + 1)}
            disabled={playerCount === MAX_PLAYER_COUNT}
            className="motion-focus inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-accent-strong bg-accent-strong text-lg font-black text-accent-contrast transition hover:bg-accent disabled:cursor-not-allowed disabled:border-zinc-700 disabled:bg-zinc-900 disabled:text-zinc-100 disabled:opacity-50"
          >
            <span aria-hidden="true">+</span>
          </button>
        </div>

        {/* REQ-202: name fields are always visible, two to a row, each carrying its seat
            number — superseding the former "Edit names" disclosure toggle. */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          {players.map((player) => (
            <label
              key={player.label}
              className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-2"
            >
              <span className="shrink-0 text-xs font-semibold uppercase tracking-[0.08em] text-zinc-400">
                {player.label.replace("Player ", "P")}
              </span>
              <input
                aria-label={`${player.label} display name`}
                value={player.displayName}
                onChange={(event) => onDisplayNameChange(player.label, event.target.value)}
                className="motion-focus min-h-9 w-full min-w-0 rounded-md border border-zinc-700 bg-zinc-950 px-2 text-sm text-zinc-100"
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
        <div className="flex flex-wrap gap-2" aria-label="Starting life presets">
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
                className={`${pillClassName(isSelected)} min-w-11`}
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
              className={`${pillClassName(isCustomStartingLife)} min-w-11`}
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

      <div className="py-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.08em] text-zinc-500">Layout</p>
            <div className="grid grid-cols-2 gap-2" aria-label="Layout mode">
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
                    className={`${pillClassName(isSelected)} inline-flex items-center justify-center gap-2`}
                  >
                    <span aria-hidden="true" className="text-base leading-none">
                      {mode === "grid" ? "▦" : "☷"}
                    </span>
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.08em] text-zinc-500">Card style</p>
            <div className="grid grid-cols-2 gap-2" aria-label="Card style">
              {(["gradient", "flat"] as const).map((style) => {
                const isSelected = cardStyle === style;
                return (
                  <button
                    key={style}
                    type="button"
                    aria-label={`Use ${style} card style`}
                    aria-pressed={isSelected}
                    onClick={() => onCardStyleChange(style)}
                    className={`${pillClassName(isSelected)} inline-flex items-center justify-center gap-2`}
                  >
                    <span aria-hidden="true" className="text-base leading-none">
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
