import type { PlayerLabel } from "../../../types";
import type { SeatPlacement } from "../../../lib/lifeTracker/seatArrangement";
import type { TrackerPlayer } from "../../../lib/lifeTracker/types";
import { formatPlayerDisplayLabel } from "../../../lib/playerLabels";

export interface PlayerLifeCardProps {
  player: TrackerPlayer;
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
  dead: "border-rose-400/70 bg-rose-950/65",
  critical: "border-amber-400/60 bg-amber-950/55",
  healthy: "border-accent/45 bg-accent/10"
} as const;

export function PlayerLifeCard({
  player,
  placement,
  onAdjustLife,
  onOpenCounters
}: PlayerLifeCardProps): JSX.Element {
  const displayLabel = formatPlayerDisplayLabel(player.label, player.displayName);
  const status = lifeState(player.life);
  const rotation = `rotate(${placement.rotation}deg)`;

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
      className={`relative isolate min-h-48 overflow-hidden rounded-3xl border shadow-lg shadow-black/25 ${LIFE_TINTS[status]}`}
    >
      <button
        type="button"
        aria-label={`Decrease life for ${displayLabel}`}
        onClick={() => onAdjustLife(player.label, -1)}
        className="motion-focus absolute inset-y-0 left-0 z-20 flex min-w-14 w-[30%] items-center justify-start px-4 text-4xl font-light text-zinc-100/80 hover:bg-black/10 active:bg-black/20"
      >
        <span aria-hidden="true" style={{ transform: rotation }}>
          −
        </span>
      </button>

      <div
        data-testid={`life-card-content-${player.label}`}
        style={{ transform: rotation }}
        className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 p-12 text-center"
      >
        <span className="rounded-full border border-white/15 bg-zinc-950/45 px-3 py-1 text-sm font-semibold text-zinc-100">
          {displayLabel}
        </span>
        <span className="text-7xl font-black tabular-nums tracking-tight text-zinc-50 sm:text-8xl">
          {player.life}
        </span>
        {player.life <= 0 && (
          <span
            role="img"
            aria-label={`${displayLabel} is at zero or less life`}
            className="absolute text-8xl text-rose-100/80 drop-shadow-lg"
          >
            ☠
          </span>
        )}
      </div>

      <button
        type="button"
        aria-label={`Open counters for ${displayLabel}`}
        onClick={() => onOpenCounters(player.label)}
        className="motion-focus absolute bottom-3 left-1/2 z-30 min-h-11 -translate-x-1/2 rounded-full border border-white/20 bg-zinc-950/55 px-4 text-xs font-bold uppercase tracking-[0.12em] text-zinc-100 hover:bg-zinc-900/80"
      >
        Counters
      </button>

      <button
        type="button"
        aria-label={`Increase life for ${displayLabel}`}
        onClick={() => onAdjustLife(player.label, 1)}
        className="motion-focus absolute inset-y-0 right-0 z-20 flex min-w-14 w-[30%] items-center justify-end px-4 text-4xl font-light text-zinc-100/80 hover:bg-white/5 active:bg-white/10"
      >
        <span aria-hidden="true" style={{ transform: rotation }}>
          +
        </span>
      </button>
    </article>
  );
}
