import { useState, type FormEvent } from "react";

export interface GameSetupPanelProps {
  startingLife: number;
  commanderDamageToLife: boolean;
  onStartingLifeChange: (startingLife: number) => void;
  onCommanderDamageToLifeChange: (enabled: boolean) => void;
  onReset: () => void;
  onNewGame: () => void;
}

const STARTING_LIFE_PRESETS = [20, 25, 30, 40, 60] as const;
const MIN_CUSTOM_STARTING_LIFE = 1;
const MAX_CUSTOM_STARTING_LIFE = 999;

export function GameSetupPanel({
  startingLife,
  commanderDamageToLife,
  onStartingLifeChange,
  onCommanderDamageToLifeChange,
  onReset,
  onNewGame
}: GameSetupPanelProps): JSX.Element {
  const [customLife, setCustomLife] = useState("");
  const [customError, setCustomError] = useState<string | null>(null);

  function applyCustomLife(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const isIntegerText = /^\d+$/.test(customLife);
    const parsed = Number(customLife);

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
        </div>
      </div>

      <label className="flex min-h-11 cursor-pointer items-center justify-between gap-4 border-b border-zinc-800 py-3">
        <span className="flex items-start gap-2">
          <span aria-hidden="true" className="mt-0.5 text-base leading-none">
            🛡
          </span>
          <span>
            <span className="block text-sm font-bold text-zinc-100">Commander damage also reduces life</span>
            <span className="block text-xs text-zinc-400">Only positive opponent damage is linked.</span>
          </span>
        </span>
        <span className="relative inline-flex h-7 w-12 shrink-0 items-center">
          <input
            type="checkbox"
            aria-label="Commander damage also reduces life"
            checked={commanderDamageToLife}
            onChange={(event) => onCommanderDamageToLifeChange(event.target.checked)}
            className="peer absolute inset-0 z-10 h-full w-full cursor-pointer appearance-none bg-transparent"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-full bg-zinc-700 transition-colors peer-checked:bg-accent-strong peer-focus-visible:ring-2 peer-focus-visible:ring-accent-soft peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-zinc-950"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-1 h-5 w-5 rounded-full bg-white transition-transform peer-checked:translate-x-5"
          />
        </span>
      </label>

      <form onSubmit={applyCustomLife} className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-zinc-400">Custom starting life</span>
          <input
            aria-label="Custom starting life"
            aria-invalid={customError !== null}
            aria-describedby={customError ? "custom-starting-life-error" : undefined}
            value={customLife}
            onChange={(event) => {
              setCustomLife(event.target.value);
              setCustomError(null);
            }}
            inputMode="numeric"
            className="motion-focus min-h-11 rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-zinc-100"
            placeholder={`${MIN_CUSTOM_STARTING_LIFE}–${MAX_CUSTOM_STARTING_LIFE}`}
          />
        </label>
        <button
          type="submit"
          aria-label="Apply custom starting life"
          className="motion-focus mt-auto min-h-11 rounded-xl border border-zinc-700 bg-zinc-900 px-4 text-sm font-bold text-zinc-100 hover:bg-zinc-800"
        >
          Apply
        </button>
        {customError && (
          <p id="custom-starting-life-error" role="alert" className="col-span-2 text-sm text-rose-300">
            {customError}
          </p>
        )}
      </form>
    </section>
  );
}
