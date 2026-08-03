import { useState, type FormEvent } from "react";
import { MAX_PLAYER_COUNT, MIN_PLAYER_COUNT } from "../../../lib/lifeTracker/state";
import type { PlayerLabel } from "../../../types";
import type { LayoutMode } from "../../../lib/lifeTracker/types";

export interface GameSetupPanelPlayer {
  label: PlayerLabel;
  displayName: string;
}

export interface GameSetupPanelProps {
  playerCount: number;
  layoutMode: LayoutMode;
  startingLife: number;
  players: GameSetupPanelPlayer[];
  onPlayerCountChange: (count: number) => void;
  onLayoutModeChange: (mode: LayoutMode) => void;
  onStartingLifeChange: (startingLife: number) => void;
  onDisplayNameChange: (label: PlayerLabel, value: string) => void;
  onReset: () => void;
  onNewGame: () => void;
}

const STARTING_LIFE_PRESETS = [20, 25, 30, 40] as const;
const PLAYER_COUNTS = Array.from(
  { length: MAX_PLAYER_COUNT - MIN_PLAYER_COUNT + 1 },
  (_, index) => MIN_PLAYER_COUNT + index
);
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
  startingLife,
  players,
  onPlayerCountChange,
  onLayoutModeChange,
  onStartingLifeChange,
  onDisplayNameChange,
  onReset,
  onNewGame
}: GameSetupPanelProps): JSX.Element {
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
    setStartingLifeDraft(isCustomStartingLife ? String(startingLife) : "");
    setCustomError(null);
    setIsEditingStartingLifeCustom(true);
  }

  function cancelCustomLifeEdit(): void {
    setCustomError(null);
    setIsEditingStartingLifeCustom(false);
  }

  return (
    <section aria-label="Game setup controls" className="divide-y divide-zinc-700/70">
      <div className="flex gap-2 pb-4">
        <button
          type="button"
          aria-label="Reset current game"
          onClick={onReset}
          className="motion-focus min-h-11 flex-1 rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-sm font-bold text-zinc-100 hover:bg-zinc-800"
        >
          Reset
        </button>
        <button
          type="button"
          aria-label="Start new game"
          onClick={onNewGame}
          className="motion-focus min-h-11 flex-1 rounded-xl border border-accent-strong bg-accent-strong px-3 text-sm font-bold text-accent-contrast hover:bg-accent"
        >
          New Game
        </button>
      </div>

      <div className="py-4">
        <p className="mb-2 flex items-center gap-2 text-sm font-bold text-zinc-400">
          <span aria-hidden="true" className="text-base leading-none">
            👥
          </span>
          Players
        </p>
        <div className="flex flex-wrap gap-2" aria-label="Player count">
          {PLAYER_COUNTS.map((count) => {
            const isSelected = playerCount === count;
            return (
              <button
                key={count}
                type="button"
                aria-label={`Set player count to ${count}`}
                aria-pressed={isSelected}
                onClick={() => onPlayerCountChange(count)}
                className={`${pillClassName(isSelected)} min-w-11`}
              >
                {count}
              </button>
            );
          })}
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
      </div>

      <div className="pt-4">
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
