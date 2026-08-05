import { useRef, useState, type FormEvent } from "react";
import type { PlayerLabel } from "../../../types";
import type { SeatPlacement } from "../../../lib/lifeTracker/seatArrangement";
import type { CardStyle, LayoutMode, TrackerPlayer } from "../../../lib/lifeTracker/types";
import { formatPlayerDisplayLabel } from "../../../lib/playerLabels";

export interface PlayerLifeCardProps {
  player: TrackerPlayer;
  players: TrackerPlayer[];
  placement: SeatPlacement;
  /** List mode moves the life adjustment bands from top/bottom to the card's left/right edges. */
  layoutMode: LayoutMode;
  /** Surface treatment for the card: the original three-stop ombre, or a single solid tint. */
  cardStyle: CardStyle;
  /**
   * True when this seat spans the full row width (list mode's single head/foot rows) rather than
   * sharing a row with a paired seat. Only meaningful in list mode: wide, short rows want
   * left/right bands (natural side-to-side tap zones on a wide card), while list mode's narrower
   * paired rows - portrait-shaped like grid seats - keep the default top/bottom bands.
   */
  isWideSeat: boolean;
  onAdjustLife: (label: PlayerLabel, delta: number) => void;
  /** Commits an exact total from the inline numeric entry (the "I gained 100000 life" path). */
  onSetLife: (label: PlayerLabel, life: number) => void;
  onOpenCounters: (label: PlayerLabel) => void;
}

function lifeState(life: number): "dead" | "critical" | "healthy" {
  if (life <= 0) return "dead";
  if (life <= 10) return "critical";
  return "healthy";
}

/**
 * Both variants keep the same three life states and the same border/text colors; only the fill
 * changes. The gradient's bright `via-*-50` mid stop is the near-white the flat variant drops -
 * flat uses one solid 300-level tint per state instead, which is lower-luminance than that white
 * mid stop while staying light enough for the near-black state text to clear AA at any palette.
 */
const LIFE_TINTS = {
  gradient: {
    dead: "border-rose-400/70 bg-gradient-to-br from-rose-200/95 via-rose-50 to-rose-300/40 text-rose-950",
    critical: "border-amber-400/60 bg-gradient-to-br from-amber-200/95 via-amber-50 to-amber-300/40 text-amber-950",
    healthy: "border-accent/40 bg-gradient-to-br from-accent-soft/75 via-zinc-50 to-accent/35 text-zinc-900"
  },
  flat: {
    dead: "border-rose-400/70 bg-rose-300 text-rose-950",
    critical: "border-amber-400/60 bg-amber-300 text-amber-950",
    healthy: "border-accent/40 bg-accent-soft text-zinc-900"
  }
} as const;

/** Near-square column count for `count` preview tiles (2x2 for 4, matching the reference). */
function previewColumns(count: number): number {
  return Math.max(1, Math.ceil(Math.sqrt(count)));
}

type PreviewCell = { key: PlayerLabel; isSelf: boolean; value: number };

function commanderDamagePreviewCells(player: TrackerPlayer, players: TrackerPlayer[]): PreviewCell[] {
  return players.map((seat) => ({
    key: seat.label,
    isSelf: seat.label === player.label,
    value: player.commanderDamage[seat.label] ?? 0
  }));
}

/**
 * Parses typed life entry. Any finite number is legal - negative totals and totals far past the
 * usual range are both real game states - but empty/garbage input resolves to `null` so the caller
 * can cancel instead of writing a NaN into persisted state.
 */
function parseLifeDraft(draft: string): number | null {
  const trimmed = draft.trim();
  if (trimmed === "") return null;

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : null;
}

export function PlayerLifeCard({
  player,
  players,
  placement,
  layoutMode,
  cardStyle,
  isWideSeat,
  onAdjustLife,
  onSetLife,
  onOpenCounters
}: PlayerLifeCardProps): JSX.Element {
  const [lifeDraft, setLifeDraft] = useState<string | null>(null);
  // Escape unmounts the input, which also fires blur; without this the blur handler would then
  // commit the very draft Escape just discarded.
  const isCancellingRef = useRef(false);
  const displayLabel = formatPlayerDisplayLabel(player.label, player.displayName);
  const status = lifeState(player.life);
  const rotation = `rotate(${placement.rotation}deg)`;
  const previewCells = commanderDamagePreviewCells(player, players);
  const previewCols = previewColumns(previewCells.length);
  // A 90/270 rotation swaps the content's effective width and height. Cards are rarely square,
  // so sizing the rotated box off the card's own (un-rotated) dimensions overflows the shorter
  // axis and gets silently clipped by the card's `overflow-hidden`. Container query units size
  // the box off the *card's* width/height directly (swapped for sideways seats), so the rotated
  // content always ends up exactly card-sized regardless of aspect ratio or rotation.
  const isSideways = placement.rotation === 90 || placement.rotation === 270;
  const contentSize = isSideways ? { width: "100cqh", height: "100cqw" } : { width: "100cqw", height: "100cqh" };
  const isListLayout = layoutMode === "list" && isWideSeat;
  const decreaseBandClassName = isListLayout
    ? "absolute inset-y-0 left-0 z-20 flex w-[67px] items-center justify-center text-3xl font-light opacity-60 hover:bg-black/5 hover:opacity-100 active:bg-black/10"
    : "absolute inset-x-0 top-0 z-20 flex h-[67px] items-center justify-center text-3xl font-light opacity-60 hover:bg-black/5 hover:opacity-100 active:bg-black/10";
  const increaseBandClassName = isListLayout
    ? "absolute inset-y-0 right-0 z-20 flex w-[67px] items-center justify-center text-3xl font-light opacity-60 hover:bg-black/5 hover:opacity-100 active:bg-black/10"
    : "absolute inset-x-0 bottom-0 z-20 flex h-[67px] items-center justify-center text-3xl font-light opacity-60 hover:bg-black/5 hover:opacity-100 active:bg-black/10";
  const isEditingLife = lifeDraft !== null;

  function commitLifeDraft(): void {
    if (lifeDraft === null) return;

    const parsed = parseLifeDraft(lifeDraft);
    setLifeDraft(null);
    if (parsed !== null && parsed !== player.life) {
      onSetLife(player.label, parsed);
    }
  }

  function cancelLifeDraft(): void {
    isCancellingRef.current = true;
    setLifeDraft(null);
  }

  function submitLifeDraft(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    commitLifeDraft();
  }

  return (
    <article
      data-testid={`life-card-${player.label}`}
      data-life-state={status}
      data-card-style={cardStyle}
      data-side={placement.side}
      aria-label={`${displayLabel}, ${player.life} life`}
      style={{
        gridArea: placement.gridArea,
        gridRow: placement.gridRow,
        gridColumn: placement.gridColumn,
        containerType: "size"
      }}
      className={`relative isolate min-h-60 overflow-hidden rounded-3xl border shadow-lg shadow-black/20 ${LIFE_TINTS[cardStyle][status]}`}
    >
      <button
        type="button"
        aria-label={`Decrease life for ${displayLabel}`}
        onClick={() => onAdjustLife(player.label, -1)}
        className={`motion-focus ${decreaseBandClassName}`}
      >
        <span aria-hidden="true" style={{ transform: rotation }}>
          −
        </span>
      </button>

      <div
        data-testid={`life-card-content-${player.label}`}
        style={{ transform: `translate(-50%, -50%) ${rotation}`, ...contentSize }}
        className="absolute left-1/2 top-1/2 z-10 flex flex-col items-center justify-center gap-2 p-6 text-center"
      >
        <span className="rounded-full border border-black/10 bg-white/50 px-3 py-1 text-sm font-semibold shadow-sm">
          {displayLabel}
        </span>
        {isEditingLife ? (
          <form noValidate onSubmit={submitLifeDraft} className="w-full">
            <input
              autoFocus
              type="text"
              inputMode="numeric"
              aria-label={`Set life for ${displayLabel}`}
              value={lifeDraft ?? ""}
              onChange={(event) => setLifeDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.preventDefault();
                  event.stopPropagation();
                  cancelLifeDraft();
                }
              }}
              onBlur={() => {
                if (isCancellingRef.current) {
                  isCancellingRef.current = false;
                  return;
                }
                commitLifeDraft();
              }}
              className="motion-focus w-full min-w-0 rounded-xl border border-black/20 bg-white/70 px-2 text-center text-5xl font-black tabular-nums tracking-tight sm:text-6xl"
            />
          </form>
        ) : (
          <button
            type="button"
            data-testid={`life-value-${player.label}`}
            aria-label={`Set life for ${displayLabel}`}
            onClick={() => {
              isCancellingRef.current = false;
              setLifeDraft(String(player.life));
            }}
            className="motion-focus relative rounded-xl px-2 text-6xl font-black tabular-nums tracking-tight sm:text-7xl"
          >
            {player.life}
            {player.life <= 0 && (
              <span
                role="img"
                aria-label={`${displayLabel} is at zero or less life`}
                className="absolute inset-0 flex items-center justify-center text-7xl opacity-70 drop-shadow-lg"
              >
                ☠
              </span>
            )}
          </button>
        )}
        <button
          type="button"
          data-testid={`commander-preview-${player.label}`}
          aria-label={`Open counters for ${displayLabel}`}
          onClick={() => onOpenCounters(player.label)}
          className="motion-focus grid gap-1 rounded-xl border border-black/10 bg-white/40 p-1.5 shadow-sm hover:bg-white/65"
          style={{ gridTemplateColumns: `repeat(${previewCols}, minmax(0, 1fr))` }}
        >
          {previewCells.map((cell) => (
            <span
              key={cell.key}
              aria-hidden="true"
              data-testid={`commander-preview-cell-${cell.key}`}
              className={`flex min-h-6 min-w-6 items-center justify-center rounded-md text-[0.65rem] font-black tabular-nums ${
                cell.isSelf ? "bg-black/10 opacity-80" : "bg-white/50"
              }`}
            >
              {cell.isSelf ? "me" : cell.value}
            </span>
          ))}
        </button>
      </div>

      <button
        type="button"
        aria-label={`Increase life for ${displayLabel}`}
        onClick={() => onAdjustLife(player.label, 1)}
        className={`motion-focus ${increaseBandClassName}`}
      >
        <span aria-hidden="true" style={{ transform: rotation }}>
          +
        </span>
      </button>
    </article>
  );
}
