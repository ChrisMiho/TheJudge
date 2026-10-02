import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type PointerEvent as ReactPointerEvent
} from "react";
import type { PlayerLabel } from "../../../types";
import { useOutsideDismiss } from "../../../hooks/useOutsideDismiss";
import { NAMED_COUNTER_PALETTE, type NamedCounterId } from "../../../lib/lifeTracker/counters";
import type { SeatArrangementLayout } from "../../../lib/lifeTracker/seatArrangement";
import { buildSeatMapCells } from "../../../lib/lifeTracker/seatMap";
import type { TrackerPlayer } from "../../../lib/lifeTracker/types";
import { formatPlayerDisplayLabel } from "../../../lib/playerLabels";
import { OverlayCloseButton } from "../../OverlayCloseButton";

export interface CounterPanelProps {
  player: TrackerPlayer;
  players: TrackerPlayer[];
  /**
   * The full active seat arrangement (`seatArrangement` in grid mode, `listSeatArrangement` in
   * list mode) - so the commander-damage matrix can place every seat, not just a fixed roster
   * order (REQ-173). The panel itself is never rotated (DEC-139); the map it builds is an
   * absolute top-down replica of the table.
   */
  layout: SeatArrangementLayout;
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
    // Look-matching pass (slice Q), requirement 3: `.lt-tile`
    // (`life-tracker-menus.html:146-150`) — full-colour icons (no more
    // opacity/greyscale dimming when inactive), title-case labels (the
    // `uppercase` transform retired; `label` is already title case in
    // `NAMED_COUNTER_PALETTE`), and the ⋯ control moved to the tile's own
    // top-right corner instead of a second grid column beside the tap area.
    <div className="lt-tile" data-on={isActive ? "true" : "false"}>
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
        className="motion-focus lt-tile-main"
      >
        {icon && (
          <span aria-hidden="true" className="lt-tile-icon">
            {icon}
          </span>
        )}
        <span data-testid={labelTestId} className={`lt-tile-name ${isActive ? "text-accent-soft" : "text-zinc-300"}`}>
          {label}
        </span>
        <span className="lt-tile-n">{value}</span>
      </button>
      <button
        type="button"
        aria-label={`Options for ${label}`}
        aria-expanded={showOptions}
        onClick={() => setShowOptions((current) => !current)}
        className="motion-focus lt-tile-more"
      >
        ⋯
      </button>

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
  /** Seat-map grid placement (REQ-173) - `gridArea`/`gridRow`/`gridColumn` for this cell's own seat. */
  placement?: { gridArea: string; gridRow: string; gridColumn: string };
  onIncrement: () => void;
  onDecrement: () => void;
}

/** REQ-202: a single source's commander damage is lethal on its own at 21+. */
const LETHAL_COMMANDER_DAMAGE = 21;

/**
 * Look-matching pass (slice Q), requirement 2: the `.lt-seat` shape
 * (`life-tracker-menus.html:116-122`) — the source's name top-left (with a
 * LETHAL tag beside it, not a separate line under the value), the damage
 * total centred and large, then one joined −|+ pill at the foot in place of
 * the prior always-visible decrease/increase bands above and below. Marks
 * itself LETHAL (red edge + tag) at 21+ (REQ-202); behaviour (the two tap
 * targets, their aria-labels) is unchanged.
 */
function CommanderDamageCell({
  name,
  value,
  testId,
  placement,
  onIncrement,
  onDecrement
}: CommanderDamageCellProps): JSX.Element {
  const isLethal = value >= LETHAL_COMMANDER_DAMAGE;

  return (
    <div data-testid={testId} data-lethal={isLethal} style={placement} className="lt-seat">
      <span className="lt-seat-who">
        <span className="truncate">{name}</span>
        {isLethal && (
          <span data-testid={`commander-lethal-${name}`} className="lt-seat-tag">
            Lethal
          </span>
        )}
      </span>
      <span data-testid={`commander-value-${name}`} className="lt-seat-dmg" data-lethal={isLethal}>
        {value}
      </span>
      <span className="lt-seat-bands">
        <button
          type="button"
          aria-label={`Decrease commander damage from ${name}`}
          onClick={onDecrement}
          className="motion-focus"
        >
          <span aria-hidden="true">−</span>
        </button>
        <button
          type="button"
          aria-label={`Increase commander damage from ${name}`}
          onClick={onIncrement}
          className="motion-focus"
        >
          <span aria-hidden="true">+</span>
        </button>
      </span>
    </div>
  );
}

export function CounterPanel({
  player,
  players,
  layout,
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
  // The commander-damage matrix is an absolute top-down replica of the table (REQ-173): the
  // panel itself is never rotated (DEC-139), but every seat - including the opener's own "me"
  // cell - sits at its own gridRow/gridColumn/gridArea from the active layout, not a fixed
  // two-column roster loop.
  const seatMapCells = buildSeatMapCells(layout, players, player.label);

  useOutsideDismiss([dialogRef], onClose, true);

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
            {/* Look-matching pass (slice Q), requirement 2: the title becomes
                "Counters · <player>" plus a muted "<life> life" caption
                (`life-tracker-menus.html:249` `#ctr-name`/`#ctr-life`). The
                literal space between the two spans keeps the dialog's
                `aria-labelledby` name readable. */}
            <h2 id="counter-panel-title" className="text-xl font-black text-zinc-100">
              <span>{`Counters · ${displayLabel}`}</span> <span className="text-sm font-medium text-zinc-400">{`${player.life} life`}</span>
            </h2>
          </div>
          <OverlayCloseButton label="Close counters" onClick={onClose} />
        </header>

        {/* Requirement 2: glyph tabs, `.seg.full`
            (`life-tracker-menus.html:251`'s "⚔ Commander damage / ◈
            Counters") in place of the plain "Player"/"Counters" labels —
            the glyphs are decorative (`aria-hidden`), so each tab's own
            accessible name is still just its words. */}
        <div role="tablist" aria-label="Counter panel sections" className="lt-seg full mt-4">
          <button type="button" role="tab" aria-selected={activeTab === "player"} onClick={() => setActiveTab("player")}>
            <span aria-hidden="true" className="glyph">
              ⚔
            </span>
            Commander damage
          </button>
          <button type="button" role="tab" aria-selected={activeTab === "counters"} onClick={() => setActiveTab("counters")}>
            <span aria-hidden="true" className="glyph">
              ◈
            </span>
            Counters
          </button>
        </div>

        {activeTab === "player" ? (
          <div role="tabpanel" aria-label="Player counters" className="mt-4">
            {/* Requirement 2: a "lethal at 21" note beside the eyebrow
                (`life-tracker-menus.html:255` `.lbl small`), replacing the
                separate "Commander damage" heading alone. */}
            <h3 className="mb-3 flex items-baseline gap-2 text-sm font-black text-zinc-200">
              Commander damage
              <small className="text-xs font-medium normal-case text-zinc-500">lethal at 21</small>
            </h3>
            <div
              role="group"
              aria-label="Commander damage by source"
              className="lt-seat-map"
              style={{
                gridTemplateColumns: `repeat(${layout.columns}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${layout.rows}, minmax(0, 1fr))`
              }}
            >
              {seatMapCells.map((cell) => {
                const source = players.find((candidate) => candidate.label === cell.label);
                if (!source) return null;
                const sourceName = formatPlayerDisplayLabel(source.label, source.displayName);
                const cellPlacement = { gridArea: cell.gridArea, gridRow: cell.gridRow, gridColumn: cell.gridColumn };

                if (cell.isSelf) {
                  // Requirement 2: "your own seat drawn like your card" —
                  // shows the real life total, with "your seat · life total"
                  // replacing the old bare "me" caption
                  // (`life-tracker-menus.html:357` `.seat.me .you`).
                  return (
                    <div key={cell.label} data-testid={`commander-cell-${cell.label}`} style={cellPlacement} className="lt-seat lt-seat-me">
                      <span className="lt-seat-who">{sourceName}</span>
                      <span className="lt-seat-dmg">{player.life}</span>
                      <span className="lt-seat-you">your seat · life total</span>
                    </div>
                  );
                }

                return (
                  <CommanderDamageCell
                    key={cell.label}
                    testId={`commander-cell-${cell.label}`}
                    name={sourceName}
                    value={player.commanderDamage[cell.label] ?? 0}
                    placement={cellPlacement}
                    onIncrement={() => onAdjustCommanderDamage(player.label, cell.label, 1)}
                    onDecrement={() => onAdjustCommanderDamage(player.label, cell.label, -1)}
                  />
                );
              })}
            </div>
          </div>
        ) : (
          <div role="tabpanel" aria-label="Named and custom counters" className="mt-4 space-y-4">
            {/* Requirement 3: the hint reads "tap to add one · ⋯ for more"
                (`life-tracker-menus.html:264`), and the grid is 3 columns on
                phone, 4 at desktop (`.tiles`), replacing the old 2/3 split. */}
            <p className="text-sm text-zinc-400">tap to add one · ⋯ for more</p>
            <div className="lt-tiles">
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

            {/* Requirement 3: one always-present "Custom counters" section
                (`life-tracker-menus.html:267` `.lt-sec`) holding any existing
                custom tiles plus the name field and "＋ Add" — replacing the
                prior split (a conditional heading+grid, then a separate
                bordered add-row below). */}
            <section aria-label="Custom counters" className="space-y-2 border-t border-zinc-700/70 pt-4">
              <h3 className="text-sm font-black text-zinc-200">Custom counters</h3>
              {player.customCounters.length > 0 && (
                <div className="lt-tiles">
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
              )}

              <form onSubmit={addCustom} className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
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
                  <span aria-hidden="true">＋</span> Add
                </button>
                {customNameError && (
                  <p role="alert" className="col-span-2 text-sm text-rose-400">
                    {customNameError}
                  </p>
                )}
              </form>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
