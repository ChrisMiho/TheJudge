// ScanCardOutline -- shared presentational SVG outline for the detected-card
// quad. Reused by the opt-in debug overlay (DEC-060) for its sky-colored
// diagnostic outline and by the always-on locking cue (DEC-083) for its
// affirmative treatment. Pure geometry-in, polygon-out: no detection, hashing,
// or distance logic lives here.

import type { Point } from "../lib/scan/detector"

export type ScanCardOutlineVariant = "debug" | "affirmative"

export type ScanCardOutlineProps = {
  /** Canonical-oriented [TL, TR, BR, BL] quad in native frame pixels, or null. */
  corners: Point[] | null
  /** Native frame dimensions (= corner coordinate space), or null. */
  frameWidth: number | null
  frameHeight: number | null
  variant: ScanCardOutlineVariant
}

function pointsAttr(points: Point[]): string {
  return points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")
}

const STROKE_BY_VARIANT: Record<ScanCardOutlineVariant, string> = {
  debug: "#38bdf8",
  affirmative: "#34d399"
}

export function ScanCardOutline({ corners, frameWidth, frameHeight, variant }: ScanCardOutlineProps): JSX.Element | null {
  if (!corners || corners.length !== 4 || !frameWidth || !frameHeight) return null

  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox={`0 0 ${frameWidth} ${frameHeight}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      data-testid="scan-card-outline"
    >
      <polygon
        points={pointsAttr(corners)}
        fill="none"
        stroke={STROKE_BY_VARIANT[variant]}
        strokeWidth={2}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
