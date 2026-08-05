import { useState, type FormEvent } from "react";
import { MAX_PLAYER_COUNT, MIN_PLAYER_COUNT } from "../../../lib/lifeTracker/state";
import type { PlayerLabel } from "../../../types";
import type { CardStyle, LayoutMode } from "../../../lib/lifeTracker/types";

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

/**
 * Reset and New Game both destroy work with no undo, so each is a two-step in-place confirm rather
 * than an immediate action: the first press swaps that button for a confirm/cancel pair and names
 * exactly what is about to be lost, the second press commits. Only one can be pending at a time -
 * starting the other confirm cancels the first - and closing Game Setup unmounts this panel, which
 * drops any pending confirm with it.
 */
type PendingAction = "reset" | "new-game";

const PENDING_MESSAGES: Record<PendingAction, string> = {
  reset: "Reset this game? Every life total goes back to the starting life and all counters clear. Players, names, and settings stay.",
  "new-game": "Start a new game? This game is discarded: back to 4 players at 40 life, with names and counters cleared. Layout and card style stay."
};

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
  const [isEditingNames, setIsEditingNames] = useState(false);
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
        <div className="flex gap-2">
          {pendingAction === "reset" ? (
            <div className="flex flex-1 gap-2">
              <button
                type="button"
                aria-label="Confirm reset current game"
                onClick={() => {
                  setPendingAction(null);
                  onReset();
                }}
                className="motion-focus min-h-11 flex-1 rounded-xl border border-rose-400 bg-rose-500 px-3 text-sm font-bold text-white hover:bg-rose-400"
              >
                Confirm
              </button>
              <button
                type="button"
                aria-label="Cancel reset current game"
                onClick={() => setPendingAction(null)}
                className="motion-focus min-h-11 rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-sm font-bold text-zinc-300 hover:bg-zinc-800"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              aria-label="Reset current game"
              onClick={() => setPendingAction("reset")}
              className="motion-focus min-h-11 flex-1 rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-sm font-bold text-zinc-100 hover:bg-zinc-800"
            >
              Reset
            </button>
          )}

          {pendingAction === "new-game" ? (
            <div className="flex flex-1 gap-2">
              <button
                type="button"
                aria-label="Confirm start new game"
                onClick={() => {
                  setPendingAction(null);
                  onNewGame();
                }}
                className="motion-focus min-h-11 flex-1 rounded-xl border border-accent-strong bg-accent-strong px-3 text-sm font-bold text-accent-contrast hover:bg-accent"
              >
                Confirm
              </button>
              <button
                type="button"
                aria-label="Cancel start new game"
                onClick={() => setPendingAction(null)}
                className="motion-focus min-h-11 rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-sm font-bold text-zinc-300 hover:bg-zinc-800"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              aria-label="Start new game"
              onClick={() => setPendingAction("new-game")}
              className="motion-focus min-h-11 flex-1 rounded-xl border border-accent-strong bg-accent-strong px-3 text-sm font-bold text-accent-contrast hover:bg-accent"
            >
              New Game
            </button>
          )}
        </div>
        <p role="status" className={`text-xs font-semibold text-zinc-400 ${pendingAction ? "mt-2" : "sr-only"}`}>
          {pendingAction ? PENDING_MESSAGES[pendingAction] : ""}
        </p>
      </div>

      <div className="py-4">
        <p className="mb-2 flex items-center gap-2 text-sm font-bold text-zinc-400">
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

        <button
          type="button"
          aria-label={isEditingNames ? "Hide player names" : "Edit player names"}
          aria-expanded={isEditingNames}
          onClick={() => setIsEditingNames((current) => !current)}
          className="motion-focus mt-3 inline-flex items-center gap-1 rounded-md text-xs font-bold text-accent-soft hover:underline"
        >
          <span aria-hidden="true">{isEditingNames ? "▾" : "▸"}</span>
          Edit names
        </button>

        {isEditingNames && (
          <div className="mt-2 space-y-2">
            {players.map((player) => (
              <label
                key={player.label}
                className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2"
              >
                <span className="w-24 shrink-0 text-xs font-semibold uppercase tracking-[0.08em] text-zinc-400">
                  {player.label}
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
        )}
      </div>

      <div className="py-4">
        <p className="mb-2 flex items-center gap-2 text-sm font-bold text-zinc-400">
          <span aria-hidden="true" className="text-base leading-none">
            ▤
          </span>
          Layout
        </p>
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

        <p className="mb-2 mt-3 text-xs font-bold uppercase tracking-[0.08em] text-zinc-500">Card style</p>
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
        {customError && (
          <p id="custom-starting-life-error" role="alert" className="mt-2 text-sm text-rose-400">
            {customError}
          </p>
        )}
      </div>
    </section>
  );
}
