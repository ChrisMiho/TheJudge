import { useState, type FormEvent } from "react";
import { MAX_PLAYER_COUNT, MIN_PLAYER_COUNT } from "../../../lib/lifeTracker/state";
import type { LayoutMode } from "../../../lib/lifeTracker/types";

export interface GameSetupPanelProps {
  playerCount: number;
  layoutMode: LayoutMode;
  startingLife: number;
  onPlayerCountChange: (count: number) => void;
  onLayoutModeChange: (mode: LayoutMode) => void;
  onStartingLifeChange: (startingLife: number) => void;
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

export function GameSetupPanel({
  playerCount,
  layoutMode,
  startingLife,
  onPlayerCountChange,
  onLayoutModeChange,
  onStartingLifeChange,
  onReset,
  onNewGame
}: GameSetupPanelProps): JSX.Element {
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
    setStartingLifeDraft(isCustomStartingLife ? String(startingLife) : "");
    setCustomError(null);
    setIsEditingStartingLifeCustom(true);
  }

  function cancelCustomLifeEdit(): void {
    setCustomError(null);
    setIsEditingStartingLifeCustom(false);
  }

  return (
    <section
      aria-labelledby="life-tracker-game-setup-title"
      className="rounded-2xl border border-zinc-800 bg-black/40 p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent-soft">Table settings</p>
          <h2 id="life-tracker-game-setup-title" className="text-lg font-black text-zinc-100">
            Game setup
          </h2>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            aria-label="Reset current game"
            onClick={onReset}
            className="motion-focus min-h-11 rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-sm font-bold text-zinc-100 hover:bg-zinc-800"
          >
            Reset
          </button>
          <button
            type="button"
            aria-label="Start new game"
            onClick={onNewGame}
            className="motion-focus min-h-11 rounded-xl border border-accent/50 bg-accent/15 px-3 text-sm font-bold text-accent-soft hover:bg-accent/25"
          >
            New Game
          </button>
        </div>
      </div>

      <div className="border-b border-zinc-800 py-3">
        <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-zinc-300">
          <span aria-hidden="true" className="text-base leading-none">
            👥
          </span>
          Players
        </p>
        <div className="grid grid-cols-7 gap-2" aria-label="Player count">
          {PLAYER_COUNTS.map((count) => {
            const isSelected = playerCount === count;
            return (
              <button
                key={count}
                type="button"
                aria-label={`Set player count to ${count}`}
                aria-pressed={isSelected}
                onClick={() => onPlayerCountChange(count)}
                className={`motion-focus min-h-11 rounded-full border px-2 text-sm font-black tabular-nums transition ${
                  isSelected
                    ? "border-accent bg-accent/20 text-accent-soft ring-2 ring-accent/25"
                    : "border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800"
                }`}
              >
                {count}
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-b border-zinc-800 py-3">
        <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-zinc-300">
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
                className={`motion-focus inline-flex min-h-11 items-center justify-center gap-2 rounded-full border px-3 text-sm font-black transition ${
                  isSelected
                    ? "border-accent bg-accent/20 text-accent-soft ring-2 ring-accent/25"
                    : "border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800"
                }`}
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

      <div className="border-b border-zinc-800 py-3">
        <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-zinc-300">
          <span aria-hidden="true" className="text-base leading-none">
            ♥
          </span>
          Starting life
        </p>
        <div className="grid grid-cols-5 gap-2" aria-label="Starting life presets">
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
                className={`motion-focus min-h-11 rounded-full border px-2 text-sm font-black tabular-nums transition ${
                  isSelected
                    ? "border-accent bg-accent/20 text-accent-soft ring-2 ring-accent/25"
                    : "border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800"
                }`}
              >
                {preset}
              </button>
            );
          })}
          {isEditingStartingLifeCustom ? (
            <form
              noValidate
              onSubmit={applyCustomLife}
              className="relative min-h-11 min-w-0"
            >
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
                className="motion-focus min-h-11 w-full min-w-0 rounded-full border border-accent bg-zinc-900 px-2 pr-8 text-center text-sm font-black tabular-nums text-zinc-100 ring-2 ring-accent/25"
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
              className={`motion-focus min-h-11 rounded-full border px-2 text-sm font-black tabular-nums transition ${
                isCustomStartingLife
                  ? "border-accent bg-accent/20 text-accent-soft ring-2 ring-accent/25"
                  : "border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800"
              }`}
            >
              {isCustomStartingLife ? startingLife : "Custom"}
            </button>
          )}
        </div>
        {customError && (
          <p id="custom-starting-life-error" role="alert" className="mt-2 text-sm text-rose-300">
            {customError}
          </p>
        )}
      </div>
    </section>
  );
}
