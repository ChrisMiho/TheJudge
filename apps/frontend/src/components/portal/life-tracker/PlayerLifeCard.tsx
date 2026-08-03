import type { PlayerLabel } from "../../../types";
import type { SeatPlacement } from "../../../lib/lifeTracker/seatArrangement";
import type { TrackerPlayer } from "../../../lib/lifeTracker/types";
import { formatPlayerDisplayLabel } from "../../../lib/playerLabels";

export interface PlayerLifeCardProps {
  player: TrackerPlayer;
  players: TrackerPlayer[];
  placement: SeatPlacement;
  onAdjustLife: (label: PlayerLabel, delta: number) => void;
  onOpenCounters: (label: PlayerLabel) => void;
}

function lifeState(life: number): "dead" | "critical" | "healthy" {
  if (life <= 0) return "dead";
  if (life <= 10) return "critical";
  return "healthy";
}

const LIFE_TINTS = {
  dead: "border-rose-400/70 bg-gradient-to-br from-rose-200/95 via-rose-50 to-rose-300/40 text-rose-950",
  critical: "border-amber-400/60 bg-gradient-to-br from-amber-200/95 via-amber-50 to-amber-300/40 text-amber-950",
  healthy: "border-accent/40 bg-gradient-to-br from-accent-soft/75 via-zinc-50 to-accent/35 text-zinc-900"
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

export function PlayerLifeCard({
  player,
  players,
  placement,
  onAdjustLife,
  onOpenCounters
}: PlayerLifeCardProps): JSX.Element {
  const displayLabel = formatPlayerDisplayLabel(player.label, player.displayName);
  const status = lifeState(player.life);
  const rotation = `rotate(${placement.rotation}deg)`;
  const previewCells = commanderDamagePreviewCells(player, players);
  const previewCols = previewColumns(previewCells.length);

  return (
    <article
      data-testid={`life-card-${player.label}`}
      data-life-state={status}
      data-side={placement.side}
      aria-label={`${displayLabel}, ${player.life} life`}
      style={{
        gridArea: placement.gridArea,
        gridRow: placement.gridRow,
        gridColumn: placement.gridColumn
      }}
      className={`relative isolate min-h-60 overflow-hidden rounded-3xl border shadow-lg shadow-black/20 ${LIFE_TINTS[status]}`}
    >
      <button
        type="button"
        aria-label={`Decrease life for ${displayLabel}`}
        onClick={() => onAdjustLife(player.label, -1)}
        className="motion-focus absolute inset-x-0 top-0 z-20 flex h-12 items-center justify-center text-3xl font-light opacity-60 hover:bg-black/5 hover:opacity-100 active:bg-black/10"
      >
        <span aria-hidden="true" style={{ transform: rotation }}>
          −
        </span>
      </button>

      <div
        data-testid={`life-card-content-${player.label}`}
        style={{ transform: rotation }}
        className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 p-6 text-center"
      >
        <span className="rounded-full border border-black/10 bg-white/50 px-3 py-1 text-sm font-semibold shadow-sm">
          {displayLabel}
        </span>
        <span className="relative text-6xl font-black tabular-nums tracking-tight sm:text-7xl">
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
        </span>
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
        className="motion-focus absolute inset-x-0 bottom-0 z-20 flex h-12 items-center justify-center text-3xl font-light opacity-60 hover:bg-black/5 hover:opacity-100 active:bg-black/10"
      >
        <span aria-hidden="true" style={{ transform: rotation }}>
          +
        </span>
      </button>
    </article>
  );
}
