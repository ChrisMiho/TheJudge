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
  onSetCommanderDamage: (target: PlayerLabel, source: PlayerLabel, value: number) => void;
}

const LONG_PRESS_MS = 500;
const LONG_PRESS_MOVE_TOLERANCE = 8;

interface CounterControlProps {
  label: string;
  icon?: string;
  value: number;
  testId?: string;
  labelTestId?: string;
  /** "commander" keeps the value-forward tile used by the damage matrix; "named" is the icon-forward, ghosted-until-active tile matching the counters reference. */
  variant?: "commander" | "named";
  onIncrement: () => void;
  onDecrement: () => void;
  onSet: (value: number) => void;
}

function CounterControl({
  label,
  icon,
  value,
  testId,
  labelTestId,
  variant = "commander",
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

  const isNamed = variant === "named";
  const isActive = value > 0;

  return (
    <div
      data-testid={testId}
      className={
        isNamed
          ? `rounded-xl border p-2 transition-colors ${
              isActive ? "border-accent/40 bg-accent/10" : "border-zinc-200 bg-zinc-50"
            }`
          : "rounded-xl border border-accent/25 bg-accent/10 p-2"
      }
    >
      <div className={isNamed ? "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-1" : "grid grid-cols-[minmax(0,1fr)_auto] gap-1"}>
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
          className={
            isNamed
              ? "motion-focus flex min-h-20 min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1 text-center hover:bg-accent/10 active:bg-accent/15"
              : "motion-focus flex min-h-16 min-w-0 flex-col items-start justify-center rounded-lg px-2 text-left hover:bg-white/40 active:bg-white/60"
          }
        >
          {isNamed ? (
            <>
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
                  isActive ? "text-accent-strong" : "text-zinc-400"
                }`}
              >
                {label}
              </span>
              <span
                className={`text-sm font-black tabular-nums ${isActive ? "text-zinc-900" : "text-zinc-300"}`}
              >
                {value}
              </span>
            </>
          ) : (
            <>
              <span data-testid={labelTestId} className="flex items-center gap-1 truncate text-xs font-bold text-zinc-600">
                {icon && (
                  <span aria-hidden="true" className="text-sm leading-none">
                    {icon}
                  </span>
                )}
                {label}
              </span>
              <span className="text-2xl font-black tabular-nums text-zinc-900">{value}</span>
            </>
          )}
        </button>
        <button
          type="button"
          aria-label={`Options for ${label}`}
          aria-expanded={showOptions}
          onClick={() => setShowOptions((current) => !current)}
          className="motion-focus min-h-11 min-w-11 rounded-lg text-xl text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700"
        >
          ⋯
        </button>
      </div>

      {showOptions && (
        <div role="group" aria-label={`${label} options`} className="mt-2 space-y-2 border-t border-zinc-200 pt-2">
          <button
            type="button"
            aria-label={`Decrease ${label}`}
            onClick={onDecrement}
            className="motion-focus min-h-11 w-full rounded-lg border border-zinc-300 bg-white text-sm font-bold text-zinc-800 hover:bg-zinc-50"
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
              className="motion-focus min-w-0 rounded-lg border border-zinc-300 bg-white px-2 text-zinc-900"
            />
            <button
              type="submit"
              aria-label={`Apply ${label} value`}
              className="motion-focus min-h-11 rounded-lg border border-accent/50 bg-accent/10 px-3 text-sm font-bold text-accent-strong"
            >
              Set
            </button>
          </form>
        </div>
      )}
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
  onAdjustCommanderDamage,
  onSetCommanderDamage
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-2 sm:items-center sm:p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="counter-panel-title"
        tabIndex={-1}
        className="max-h-[94dvh] w-full max-w-xl overflow-y-auto rounded-3xl border border-zinc-200 bg-white p-4 text-zinc-900 shadow-2xl shadow-black/40"
      >
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent-strong">Life Tracker</p>
            <h2 id="counter-panel-title" className="text-xl font-black text-zinc-900">
              Counters for {displayLabel}
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close counters"
            onClick={onClose}
            className="motion-focus min-h-11 min-w-11 rounded-full border border-zinc-200 bg-zinc-100 text-2xl text-zinc-600 hover:bg-zinc-200"
          >
            ×
          </button>
        </header>

        <div role="tablist" aria-label="Counter panel sections" className="mt-4 grid grid-cols-2 rounded-xl bg-zinc-100 p-1">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "player"}
            onClick={() => setActiveTab("player")}
            className={`motion-focus min-h-11 rounded-lg text-sm font-black ${
              activeTab === "player" ? "bg-white text-accent-strong shadow-sm" : "text-zinc-500"
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
              activeTab === "counters" ? "bg-white text-accent-strong shadow-sm" : "text-zinc-500"
            }`}
          >
            Counters
          </button>
        </div>

        {activeTab === "player" ? (
          <div role="tabpanel" aria-label="Player counters" className="mt-4">
            <p className="mb-3 text-sm text-zinc-500">Tap to increment. Hold for additional options.</p>
            <div role="group" aria-label="Commander damage by source" className="grid grid-cols-2 gap-2">
              {players.map((source) => {
                const sourceName = formatPlayerDisplayLabel(source.label, source.displayName);
                if (source.label === player.label) {
                  return (
                    <div
                      key={source.label}
                      data-testid={`commander-cell-${source.label}`}
                      className="flex min-h-20 flex-col items-center justify-center rounded-xl border border-accent/25 bg-accent/10 p-2"
                    >
                      <span className="text-xs font-bold text-zinc-500">{sourceName}</span>
                      <span className="text-2xl font-black text-zinc-900">me</span>
                    </div>
                  );
                }

                const controlLabel = `Commander damage from ${sourceName}`;
                return (
                  <CounterControl
                    key={source.label}
                    testId={`commander-cell-${source.label}`}
                    label={controlLabel}
                    value={player.commanderDamage[source.label] ?? 0}
                    onIncrement={() => onAdjustCommanderDamage(player.label, source.label, 1)}
                    onDecrement={() => onAdjustCommanderDamage(player.label, source.label, -1)}
                    onSet={(value) => onSetCommanderDamage(player.label, source.label, value)}
                  />
                );
              })}
            </div>
          </div>
        ) : (
          <div role="tabpanel" aria-label="Named and custom counters" className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {NAMED_COUNTER_PALETTE.map((definition) => (
                <CounterControl
                  key={definition.id}
                  variant="named"
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
              <section aria-label="Custom counters" className="space-y-2 border-t border-zinc-200 pt-4">
                <h3 className="text-sm font-black text-zinc-700">Custom counters</h3>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {player.customCounters.map((counter) => (
                    <div key={counter.id} className="space-y-1">
                      <CounterControl
                        variant="named"
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
                        className="motion-focus min-h-11 w-full rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <form onSubmit={addCustom} className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 border-t border-zinc-200 pt-4">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-bold text-zinc-500">Custom counter name</span>
                <input
                  aria-label="Custom counter name"
                  aria-invalid={customNameError !== null}
                  value={customName}
                  onChange={(event) => {
                    setCustomName(event.target.value);
                    setCustomNameError(null);
                  }}
                  className="motion-focus min-h-11 rounded-xl border border-zinc-300 bg-white px-3 text-zinc-900"
                />
              </label>
              <button
                type="submit"
                aria-label="Add custom counter"
                className="motion-focus mt-auto min-h-11 rounded-xl border border-accent/50 bg-accent/10 px-4 text-sm font-black text-accent-strong"
              >
                Add
              </button>
              {customNameError && (
                <p role="alert" className="col-span-2 text-sm text-rose-600">
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
