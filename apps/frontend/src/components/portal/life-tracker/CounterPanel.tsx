import { useEffect, useId, useRef, useState, type FormEvent, type PointerEvent as ReactPointerEvent } from "react";
import type { PlayerLabel } from "../../../types";
import { NAMED_COUNTER_PALETTE, type NamedCounterId } from "../../../lib/lifeTracker/counters";
import type { SeatArrangementLayout } from "../../../lib/lifeTracker/seatArrangement";
import { buildSeatMapCells } from "../../../lib/lifeTracker/seatMap";
import type { TrackerPlayer } from "../../../lib/lifeTracker/types";
import { formatPlayerDisplayLabel } from "../../../lib/playerLabels";
import { SheetShell } from "../../SheetShell";

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
  /** A custom counter's ✕: removes the counter (the tile then carries it instead of the ⋯). */
  onRemove?: () => void;
}

/** Icon-forward, ghosted-until-active tile for named/custom counters: tap to increment, hold for a Decrease/Set menu. */
function CounterControl({
  label,
  icon,
  value,
  labelTestId,
  onIncrement,
  onDecrement,
  onSet,
  onRemove
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
    // `life-tracker-menus.html`'s `.tile`: the icon, the name and the count, a tap adds one, and the ⋯
    // opens the tile's own options (take one away, set a number). A custom counter's ✕ sits in the
    // same corner (`.rm`); the ⋯ button and the ✕ keep their own accessible names.
    <div className={onRemove ? "tile custom" : "tile"} data-on={isActive ? "true" : "false"} data-open={showOptions ? "true" : "false"}>
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
        className="motion-focus tile-main"
      >
        <span aria-hidden="true" className="ico">
          {icon ?? "✦"}
        </span>
        <span data-testid={labelTestId} className="nm">
          {label}
        </span>
        <span className="n">{value}</span>
      </button>
      {onRemove && (
        <button type="button" aria-label={`Remove ${label}`} onClick={onRemove} className="motion-focus rm">
          ✕
        </button>
      )}
      <button
        type="button"
        aria-label={`Options for ${label}`}
        aria-expanded={showOptions}
        onClick={() => setShowOptions((current) => !current)}
        className="motion-focus more"
      >
        ⋯
      </button>

      {showOptions && (
        <div role="group" aria-label={`${label} options`} className="options">
          <button type="button" aria-label={`Decrease ${label}`} onClick={onDecrement} className="motion-focus btn">
            Decrease by 1
          </button>
          <form onSubmit={applySetValue}>
            <input
              type="number"
              min="0"
              step="1"
              aria-label={`Set ${label}`}
              value={draftValue}
              onChange={(event) => setDraftValue(event.target.value)}
              className="motion-focus field"
            />
            <button type="submit" aria-label={`Apply ${label} value`} className="motion-focus btn">
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
 * `life-tracker-menus.html`'s `.seat`: the source's name top-left (with a LETHAL tag beside it), the
 * damage total centred and large, then one joined − | + pill at the foot. Marks itself LETHAL (red edge
 * and tag) at 21+ (REQ-202); behaviour (the two tap targets, their aria-labels) is unchanged.
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
    <div data-testid={testId} data-lethal={isLethal} style={placement} className="seat">
      <span className="who">
        <span className="truncate">{name}</span>
        {isLethal && (
          <span data-testid={`commander-lethal-${name}`} className="tag">
            Lethal
          </span>
        )}
      </span>
      <span data-testid={`commander-value-${name}`} className="dmg" data-lethal={isLethal}>
        {value}
      </span>
      <span className="bands">
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
  const titleId = useId();
  const displayLabel = formatPlayerDisplayLabel(player.label, player.displayName);
  // The commander-damage matrix is an absolute top-down replica of the table (REQ-173): the
  // panel itself is never rotated (DEC-139), but every seat - including the opener's own "me"
  // cell - sits at its own gridRow/gridColumn/gridArea from the active layout, not a fixed
  // two-column roster loop.
  const seatMapCells = buildSeatMapCells(layout, players, player.label);

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
    // REQ-082 (as amended by ui-look-translation): the panel is the suite's shared sheet (REQ-208), sized to
    // its content — a bottom sheet below 600px, a floating card from it up, with only its body scrolling.
    // Focus trap, Escape, outside-dismiss and focus-restore come from `SheetShell`.
    <SheetShell
      isOpen
      onClose={onClose}
      closeLabel="Close counters"
      titleId={titleId}
      panelClassName="lt-sheet"
      testId="life-tracker-counter-panel"
    >
      <div className="lt-head">
        <small>Life Tracker</small>
        {/* "Counters · <player>" plus a muted "<life> life" caption; the literal space between the two spans
            keeps the dialog's `aria-labelledby` name readable. */}
        <h2 id={titleId}>
          <span>{`Counters · ${displayLabel}`}</span> <span className="life">{`${player.life} life`}</span>
        </h2>
      </div>

      <div className="lt-scope lt-body">
        {/* Glyph tabs, `.seg.full`: "⚔ Commander damage / ◈ Counters"; the glyphs are decorative, so each
            tab's own accessible name is still just its words. */}
        <div role="tablist" aria-label="Counter panel sections" className="seg full">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "player"}
            onClick={() => setActiveTab("player")}
          >
            <span aria-hidden="true" className="glyph">
              ⚔
            </span>
            Commander damage
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "counters"}
            onClick={() => setActiveTab("counters")}
          >
            <span aria-hidden="true" className="glyph">
              ◈
            </span>
            Counters
          </button>
        </div>

        {activeTab === "player" ? (
          <div role="tabpanel" aria-label="Player counters" className="lt-tab">
            <div className="lt-sec">
              <span className="lbl">
                Commander damage <small>lethal at 21</small>
              </span>
              <div
                role="group"
                aria-label="Commander damage by source"
                className="seat-map"
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
                    // "your own seat drawn like your card": shows the real life total, with
                    // "your seat · life total" beneath it.
                    return (
                      <div
                        key={cell.label}
                        data-testid={`commander-cell-${cell.label}`}
                        style={cellPlacement}
                        className="seat me"
                      >
                        <span className="who">{sourceName}</span>
                        <span className="dmg">{player.life}</span>
                        <span className="you">your seat · life total</span>
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
          </div>
        ) : (
          <div role="tabpanel" aria-label="Named and custom counters" className="lt-tab">
            <div className="lt-sec">
              <span className="lbl">
                Counters <small>tap to add one · ⋯ for more</small>
              </span>
              <div className="tiles">
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
            </div>

            {/* One always-present "Custom counters" section: any existing custom tiles plus the name field
                and "＋ Add". */}
            <section aria-label="Custom counters" className="lt-sec custom-section">
              <span className="lbl">Custom counters</span>
              <div className="tiles">
                {player.customCounters.length > 0 ? (
                  player.customCounters.map((counter) => (
                    <CounterControl
                      key={counter.id}
                      label={counter.name}
                      value={counter.amount}
                      onIncrement={() => onAdjustCustomCounter(player.label, counter.id, 1)}
                      onDecrement={() => onAdjustCustomCounter(player.label, counter.id, -1)}
                      onSet={(value) => onSetCustomCounter(player.label, counter.id, value)}
                      onRemove={() => onRemoveCustomCounter(player.label, counter.id)}
                    />
                  ))
                ) : (
                  <p className="hint" style={{ gridColumn: "1 / -1" }}>
                    None yet — name one below.
                  </p>
                )}
              </div>
              <form onSubmit={addCustom} className="add-counter">
                <input
                  className="field"
                  aria-label="Custom counter name"
                  aria-invalid={customNameError !== null}
                  placeholder="Custom counter name"
                  value={customName}
                  onChange={(event) => {
                    setCustomName(event.target.value);
                    setCustomNameError(null);
                  }}
                />
                <button type="submit" aria-label="Add custom counter" className="motion-focus btn">
                  <span aria-hidden="true">＋</span> Add
                </button>
              </form>
              {customNameError && (
                <p role="alert" className="add-err">
                  {customNameError}
                </p>
              )}
            </section>
          </div>
        )}
      </div>

      <button type="button" className="lt-foot" onClick={onClose}>
        <span>Done</span>
        <span className="chev" aria-hidden="true">
          ›
        </span>
      </button>
    </SheetShell>
  );
}
