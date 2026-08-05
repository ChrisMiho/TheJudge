import { useRef, useState, type FormEvent } from "react";
import type { PlayerLabel } from "../../../types";
import type { SeatPlacement } from "../../../lib/lifeTracker/seatArrangement";
import type { CardStyle, TrackerPlayer } from "../../../lib/lifeTracker/types";
import { formatPlayerDisplayLabel } from "../../../lib/playerLabels";

export interface PlayerLifeCardProps {
  player: TrackerPlayer;
  players: TrackerPlayer[];
  /**
   * Placement *and* the seat's rotation, which is now the sole input to where the `−` / `+`
   * halves sit. Layout mode and seat width no longer participate: what a player needs is `−`
   * on their left and `+` on their right, and the rotation already says which way they face.
   */
  placement: SeatPlacement;
  /** Surface treatment for the card: the original three-stop ombre, or a single solid tint. */
  cardStyle: CardStyle;
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

/**
 * Life adjustment splits the whole card in half - every pixel that is not one of the three
 * inner controls (life total, commander preview, the life input) adjusts life - instead of
 * reserving a 67px strip at two edges. Which half is which follows the seat's own rotation,
 * so `−` is always on that player's left and `+` on their right no matter which table edge
 * they face: at 180deg the halves mirror horizontally, and at 90/270deg the split runs
 * horizontally because the player's left-right axis maps to the card's top-bottom axis.
 *
 * The glyph stays pinned to its half's outer edge (rather than centred in the half) so the
 * card reads exactly as it did when the bands were edge strips.
 */
const HALF_CLASSES = {
  left: "inset-y-0 left-0 w-1/2 justify-start pl-5",
  right: "inset-y-0 right-0 w-1/2 justify-end pr-5",
  top: "inset-x-0 top-0 h-1/2 items-start justify-center pt-5",
  bottom: "inset-x-0 bottom-0 h-1/2 items-end justify-center pb-5"
} as const;

type LifeHalves = { decrease: keyof typeof HALF_CLASSES; increase: keyof typeof HALF_CLASSES };

function lifeHalvesForRotation(rotation: number): LifeHalves {
  switch (rotation) {
    case 180:
      return { decrease: "right", increase: "left" };
    case 90:
      return { decrease: "top", increase: "bottom" };
    case 270:
      return { decrease: "bottom", increase: "top" };
    default:
      return { decrease: "left", increase: "right" };
  }
}

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
  cardStyle,
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
  const halves = lifeHalvesForRotation(placement.rotation);
  const halfBaseClassName =
    "absolute z-0 flex items-center text-3xl font-light opacity-60 hover:bg-black/5 hover:opacity-100 active:bg-black/10";
  const decreaseBandClassName = `${halfBaseClassName} ${HALF_CLASSES[halves.decrease]}`;
  const increaseBandClassName = `${halfBaseClassName} ${HALF_CLASSES[halves.increase]}`;
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
      // No `min-h`: the table sizes its rows to the viewport (see PlayerLifeTrackerApp), so a
      // per-card floor is what used to push a 5-8 player table past the bottom of the screen.
      // Everything inside is sized in container-query units, so a shorter card scales rather
      // than clipping.
      className={`relative isolate min-h-0 overflow-hidden rounded-3xl border shadow-lg shadow-black/20 ${LIFE_TINTS[cardStyle][status]}`}
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
        // `pointer-events-none` on the box, re-enabled per control below: the box covers the
        // whole card, so leaving it interactive would swallow every tap meant for the two
        // life halves underneath it. Sizes are container-query units so the same content
        // composes in a tall 2-player card and a short 8-player one.
        className="pointer-events-none absolute left-1/2 top-1/2 z-10 flex flex-col items-center justify-center gap-[2cqmin] p-[4cqmin] text-center"
      >
        <span className="rounded-full border border-black/10 bg-white/50 px-3 py-1 text-[clamp(0.6rem,5cqmin,0.875rem)] font-semibold shadow-sm">
          {displayLabel}
        </span>
        {isEditingLife ? (
          <form noValidate onSubmit={submitLifeDraft} className="pointer-events-auto w-full">
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
              className="motion-focus w-full min-w-0 rounded-xl border border-black/20 bg-white/70 px-2 text-center text-[clamp(1.75rem,26cqmin,4rem)] font-black tabular-nums tracking-tight"
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
            className="motion-focus pointer-events-auto relative rounded-xl px-2 text-[clamp(2rem,32cqmin,4.5rem)] font-black tabular-nums tracking-tight"
          >
            {player.life}
            {player.life <= 0 && (
              <span
                role="img"
                aria-label={`${displayLabel} is at zero or less life`}
                className="absolute inset-0 flex items-center justify-center text-[clamp(2rem,32cqmin,4.5rem)] opacity-70 drop-shadow-lg"
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
          className="motion-focus pointer-events-auto grid gap-1 rounded-xl border border-black/10 bg-white/40 p-1.5 shadow-sm hover:bg-white/65"
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
