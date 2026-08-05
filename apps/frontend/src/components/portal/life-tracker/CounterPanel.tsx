import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type PointerEvent as ReactPointerEvent
} from "react";
import type { PlayerLabel } from "../../../types";
import { NAMED_COUNTER_PALETTE, type NamedCounterId } from "../../../lib/lifeTracker/counters";
import type { TrackerPlayer } from "../../../lib/lifeTracker/types";
import { formatPlayerDisplayLabel } from "../../../lib/playerLabels";

export interface CounterPanelProps {
  player: TrackerPlayer;
  players: TrackerPlayer[];
  onClose: () => void;
  onAdjustNamedCounter: (label: PlayerLabel, counterId: NamedCounterId, delta: number) => void;
  onSetNamedCounter: (label: PlayerLabel, counterId: NamedCounterId, value: number) => void;
  onAddCustomCounter: (label: PlayerLabel, name: string) => void;
  onAdjustCustomCounter: (label: PlayerLabel, counterId: string, delta: number) => void;
  onSetCustomCounter: (label: PlayerLabel, counterId: string, value: number) => void;
  onRemoveCustomCounter: (label: PlayerLabel, counterId: string) => void;
  onAdjustCommanderDamage: (target: PlayerLabel, source: PlayerLabel, delta: number) => void;
}

const LONG_PRESS_MS = 500;
const LONG_PRESS_MOVE_TOLERANCE = 8;

interface CounterControlProps {
  label: string;
  icon?: string;
  value: number;
  labelTestId?: string;
  onIncrement: () => void;
  onDecrement: () => void;
  onSet: (value: number) => void;
}

/** Icon-forward, ghosted-until-active tile for named/custom counters: tap to increment, hold for a Decrease/Set menu. */
function CounterControl({
  label,
  icon,
  value,
  labelTestId,
  onIncrement,
  onDecrement,
  onSet
}: CounterControlProps): JSX.Element {
  const [showOptions, setShowOptions] = useState(false);
  const [draftValue, setDraftValue] = useState(String(value));
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const suppressNextClickRef = useRef(false);

  useEffect(() => {
    setDraftValue(String(value));
  }, [value]);

  useEffect(
    () => () => {
      if (longPressTimerRef.current !== null) {
        clearTimeout(longPressTimerRef.current);
      }
    },
    []
  );

  function cancelLongPress(): void {
    if (longPressTimerRef.current !== null) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    pointerStartRef.current = null;
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLButtonElement>): void {
    if (event.button !== 0) return;
    cancelLongPress();
    pointerStartRef.current = { x: event.clientX, y: event.clientY };
    longPressTimerRef.current = setTimeout(() => {
      suppressNextClickRef.current = true;
      setShowOptions(true);
      longPressTimerRef.current = null;
    }, LONG_PRESS_MS);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLButtonElement>): void {
    const start = pointerStartRef.current;
    if (!start) return;
    if (
      Math.abs(event.clientX - start.x) > LONG_PRESS_MOVE_TOLERANCE ||
      Math.abs(event.clientY - start.y) > LONG_PRESS_MOVE_TOLERANCE
    ) {
      cancelLongPress();
    }
  }

  function applySetValue(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!/^\d+$/.test(draftValue)) return;
    const parsed = Number(draftValue);
    if (!Number.isSafeInteger(parsed) || parsed < 0) return;
    onSet(parsed);
    setShowOptions(false);
  }

  const isActive = value > 0;

  return (
    <div
      className={`rounded-xl border p-2 transition-colors ${
        isActive ? "border-accent/40 bg-accent/10" : "border-zinc-700 bg-zinc-900"
      }`}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-1">
        <button
          type="button"
          aria-label={`Increment ${label}`}
          onClick={() => {
            if (suppressNextClickRef.current) {
              suppressNextClickRef.current = false;
              return;
            }
            onIncrement();
          }}
          onContextMenu={(event) => {
            event.preventDefault();
            cancelLongPress();
            setShowOptions(true);
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={cancelLongPress}
          onPointerCancel={cancelLongPress}
          onPointerLeave={cancelLongPress}
          className="motion-focus flex min-h-20 min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1 text-center hover:bg-accent/10 active:bg-accent/15"
        >
          {icon && (
            <span
              aria-hidden="true"
              className={`text-2xl leading-none transition-opacity ${isActive ? "opacity-100" : "opacity-35 grayscale"}`}
            >
              {icon}
            </span>
          )}
          <span
            data-testid={labelTestId}
            className={`truncate text-[0.65rem] font-bold uppercase tracking-wide ${
              isActive ? "text-accent-soft" : "text-zinc-400"
            }`}
          >
            {label}
          </span>
          <span className={`text-sm font-black tabular-nums ${isActive ? "text-zinc-100" : "text-zinc-500"}`}>
            {value}
          </span>
        </button>
        <button
          type="button"
          aria-label={`Options for ${label}`}
          aria-expanded={showOptions}
          onClick={() => setShowOptions((current) => !current)}
          className="motion-focus min-h-11 min-w-11 rounded-lg text-xl text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
        >
          ⋯
        </button>
      </div>

      {showOptions && (
        <div role="group" aria-label={`${label} options`} className="mt-2 space-y-2 border-t border-zinc-700/70 pt-2">
          <button
            type="button"
            aria-label={`Decrease ${label}`}
            onClick={onDecrement}
            className="motion-focus min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-900 text-sm font-bold text-zinc-100 hover:bg-zinc-800"
          >
            Decrease by 1
          </button>
          <form onSubmit={applySetValue} className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
            <input
              type="number"
              min="0"
              step="1"
              aria-label={`Set ${label}`}
              value={draftValue}
              onChange={(event) => setDraftValue(event.target.value)}
              className="motion-focus min-w-0 rounded-lg border border-zinc-700 bg-zinc-900 px-2 text-zinc-100"
            />
            <button
              type="submit"
              aria-label={`Apply ${label} value`}
              className="motion-focus min-h-11 rounded-lg border border-accent/50 bg-accent/10 px-3 text-sm font-bold text-accent-soft"
            >
              Set
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

interface CommanderDamageCellProps {
  name: string;
  value: number;
  testId?: string;
  onIncrement: () => void;
  onDecrement: () => void;
}

/**
 * Mirrors the life card's own +/- bands: an always-visible decrease band on top and increase band
 * on bottom, both real tap targets, no hold gesture and no options menu.
 */
function CommanderDamageCell({
  name,
  value,
  testId,
  onIncrement,
  onDecrement
}: CommanderDamageCellProps): JSX.Element {
  return (
    <div
      data-testid={testId}
      className="flex flex-col overflow-hidden rounded-xl border border-accent/25 bg-accent/10"
    >
      <button
        type="button"
        aria-label={`Decrease commander damage from ${name}`}
        onClick={onDecrement}
        className="motion-focus flex min-h-[53px] items-center justify-center text-xl font-light text-zinc-400 hover:bg-black/10 hover:text-zinc-100 active:bg-black/15"
      >
        <span aria-hidden="true">−</span>
      </button>
      <div className="flex flex-col items-center gap-0.5 px-2 py-1">
        <span className="truncate text-xs font-bold text-zinc-400">{name}</span>
        <span data-testid={`commander-value-${name}`} className="text-2xl font-black tabular-nums text-zinc-100">
          {value}
        </span>
      </div>
      <button
        type="button"
        aria-label={`Increase commander damage from ${name}`}
        onClick={onIncrement}
        className="motion-focus flex min-h-[53px] items-center justify-center text-xl font-light text-zinc-400 hover:bg-black/10 hover:text-zinc-100 active:bg-black/15"
      >
        <span aria-hidden="true">+</span>
      </button>
    </div>
  );
}

export function CounterPanel({
  player,
  players,
  onClose,
  onAdjustNamedCounter,
  onSetNamedCounter,
  onAddCustomCounter,
  onAdjustCustomCounter,
  onSetCustomCounter,
  onRemoveCustomCounter,
  onAdjustCommanderDamage
}: CounterPanelProps): JSX.Element {
  const [activeTab, setActiveTab] = useState<"player" | "counters">("player");
  const [customName, setCustomName] = useState("");
  const [customNameError, setCustomNameError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const displayLabel = formatPlayerDisplayLabel(player.label, player.displayName);

  useEffect(() => {
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialogRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      returnFocusRef.current?.focus();
    };
  }, [onClose]);

  function addCustom(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const trimmed = customName.trim();
    const normalized = trimmed.toLocaleLowerCase();

    if (trimmed.length === 0) {
      setCustomNameError("Enter a counter name.");
      return;
    }
    if (trimmed.length > 40) {
      setCustomNameError("Use 40 characters or fewer.");
      return;
    }

    const existingNames = [
      ...NAMED_COUNTER_PALETTE.map((definition) => definition.label.toLocaleLowerCase()),
      ...player.customCounters.map((counter) => counter.name.trim().toLocaleLowerCase())
    ];
    if (existingNames.includes(normalized)) {
      setCustomNameError("A counter with that name already exists.");
      return;
    }

    onAddCustomCounter(player.label, trimmed);
    setCustomName("");
    setCustomNameError(null);
  }

  return (
    // DEC-139: the panel belongs to the same overlay family as the Menu tray (DEC-133) and the
    // history drawer (DEC-134), so its surface fills the available height instead of sizing to
    // its content. `items-end` + a content height previously left a 358px dead scrim band above
    // the panel at 430x900 with 4 players — 40% of the viewport — which is the exact shape
    // DEC-134 retired for the history drawer, in the product owner's own words. `items-stretch`
    // at every viewport mirrors that decision; unused lower space is acceptable per DEC-133.
    // The existing overflow-y-auto is retained, not introduced: the panel already scrolled.
    <div className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/70 p-2 sm:p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="counter-panel-title"
        tabIndex={-1}
        className="h-full w-full max-w-xl overflow-y-auto rounded-3xl border border-zinc-700 bg-zinc-950 p-4 text-zinc-100 shadow-2xl shadow-black/40"
      >
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent-soft">Life Tracker</p>
            <h2 id="counter-panel-title" className="text-xl font-black text-zinc-100">
              Counters for {displayLabel}
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close counters"
            onClick={onClose}
            className="motion-focus min-h-11 min-w-11 rounded-full border border-zinc-700 bg-zinc-800 text-2xl text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100"
          >
            ×
          </button>
        </header>

        <div role="tablist" aria-label="Counter panel sections" className="mt-4 grid grid-cols-2 rounded-xl bg-zinc-900 p-1">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "player"}
            onClick={() => setActiveTab("player")}
            className={`motion-focus min-h-11 rounded-lg text-sm font-black ${
              activeTab === "player" ? "bg-zinc-950 text-accent-soft shadow-sm" : "text-zinc-400"
            }`}
          >
            Player
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "counters"}
            onClick={() => setActiveTab("counters")}
            className={`motion-focus min-h-11 rounded-lg text-sm font-black ${
              activeTab === "counters" ? "bg-zinc-950 text-accent-soft shadow-sm" : "text-zinc-400"
            }`}
          >
            Counters
          </button>
        </div>

        {activeTab === "player" ? (
          <div role="tabpanel" aria-label="Player counters" className="mt-4">
            <h3 className="mb-3 text-sm font-black text-zinc-200">Commander damage</h3>
            <div role="group" aria-label="Commander damage by source" className="grid grid-cols-2 gap-2">
              {players.map((source) => {
                const sourceName = formatPlayerDisplayLabel(source.label, source.displayName);
                if (source.label === player.label) {
                  return (
                    <div
                      key={source.label}
                      data-testid={`commander-cell-${source.label}`}
                      className="flex min-h-36 flex-col items-center justify-center rounded-xl border border-accent/25 bg-accent/10 p-2"
                    >
                      <span className="text-xs font-bold text-zinc-400">{sourceName}</span>
                      <span className="text-2xl font-black text-zinc-100">me</span>
                    </div>
                  );
                }

                return (
                  <CommanderDamageCell
                    key={source.label}
                    testId={`commander-cell-${source.label}`}
                    name={sourceName}
                    value={player.commanderDamage[source.label] ?? 0}
                    onIncrement={() => onAdjustCommanderDamage(player.label, source.label, 1)}
                    onDecrement={() => onAdjustCommanderDamage(player.label, source.label, -1)}
                  />
                );
              })}
            </div>
          </div>
        ) : (
          <div role="tabpanel" aria-label="Named and custom counters" className="mt-4 space-y-4">
            <p className="text-sm text-zinc-400">Tap to increment. Hold for more options.</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {NAMED_COUNTER_PALETTE.map((definition) => (
                <CounterControl
                  key={definition.id}
                  label={definition.label}
                  icon={definition.icon}
                  labelTestId={`counter-label-${definition.id}`}
                  value={player.namedCounters[definition.id]}
                  onIncrement={() => onAdjustNamedCounter(player.label, definition.id, 1)}
                  onDecrement={() => onAdjustNamedCounter(player.label, definition.id, -1)}
                  onSet={(value) => onSetNamedCounter(player.label, definition.id, value)}
                />
              ))}
            </div>

            {player.customCounters.length > 0 && (
              <section aria-label="Custom counters" className="space-y-2 border-t border-zinc-700/70 pt-4">
                <h3 className="text-sm font-black text-zinc-200">Custom counters</h3>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {player.customCounters.map((counter) => (
                    <div key={counter.id} className="space-y-1">
                      <CounterControl
                        label={counter.name}
                        value={counter.amount}
                        onIncrement={() => onAdjustCustomCounter(player.label, counter.id, 1)}
                        onDecrement={() => onAdjustCustomCounter(player.label, counter.id, -1)}
                        onSet={(value) => onSetCustomCounter(player.label, counter.id, value)}
                      />
                      <button
                        type="button"
                        aria-label={`Remove ${counter.name}`}
                        onClick={() => onRemoveCustomCounter(player.label, counter.id)}
                        className="motion-focus min-h-11 w-full rounded-lg text-xs font-bold text-rose-400 hover:bg-rose-950/40"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <form onSubmit={addCustom} className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 border-t border-zinc-700/70 pt-4">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-bold text-zinc-400">Custom counter name</span>
                <input
                  aria-label="Custom counter name"
                  aria-invalid={customNameError !== null}
                  value={customName}
                  onChange={(event) => {
                    setCustomName(event.target.value);
                    setCustomNameError(null);
                  }}
                  className="motion-focus min-h-11 rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-zinc-100"
                />
              </label>
              <button
                type="submit"
                aria-label="Add custom counter"
                className="motion-focus mt-auto min-h-11 rounded-xl border border-accent/50 bg-accent/10 px-4 text-sm font-black text-accent-soft"
              >
                Add
              </button>
              {customNameError && (
                <p role="alert" className="col-span-2 text-sm text-rose-400">
                  {customNameError}
                </p>
              )}
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
