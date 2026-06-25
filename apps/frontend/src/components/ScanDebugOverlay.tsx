// ScanDebugOverlay -- opt-in, read-only diagnostic layer for the card scanner
// (DEC-060 / REQ-041). It visualizes how the scanner perceives the current card:
// a live outline of the detected quad, a highlight of the art-crop region it
// actually reads/hashes, and the live match/convergence metrics. It draws ONLY
// from existing detector/stabilizer signals (no new identification, hashing, or
// distance logic) and degrades to text metrics when geometry is unavailable.

import { CARD_HEIGHT, CARD_WIDTH, type Point } from "../lib/scan/detector"
import { REGION_A } from "../lib/scan/identify"
import type { ScanDebugMetrics } from "../hooks/useScanCapture"

export type ScanDebugOverlayProps = {
  metrics: ScanDebugMetrics | null
  /** Canonical-oriented [TL, TR, BR, BL] quad in native frame pixels, or null. */
  corners: Point[] | null
  /** Native frame dimensions (= corner coordinate space), or null. */
  frameWidth: number | null
  frameHeight: number | null
}

/** Bilinear map of a normalized canonical point (u,v ∈ [0,1]) onto the frame quad. */
function mapToQuad(corners: Point[], u: number, v: number): Point {
  const [tl, tr, br, bl] = corners
  return {
    x: (1 - u) * (1 - v) * tl.x + u * (1 - v) * tr.x + u * v * br.x + (1 - u) * v * bl.x,
    y: (1 - u) * (1 - v) * tl.y + u * (1 - v) * tr.y + u * v * br.y + (1 - u) * v * bl.y
  }
}

function pointsAttr(points: Point[]): string {
  return points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")
}

function formatDistance(value: number | null): string {
  return value === null ? "—" : value.toFixed(0)
}

function formatPercent(value: number | null): string {
  return value === null ? "—" : `${Math.round(value * 100)}%`
}

function formatScore(value: number | null): string {
  return value === null ? "—" : value.toFixed(2)
}

function MetricRow({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-zinc-400">{label}</span>
      <span className="font-semibold tabular-nums text-zinc-100">{value}</span>
    </div>
  )
}

export function ScanDebugOverlay({
  metrics,
  corners,
  frameWidth,
  frameHeight
}: ScanDebugOverlayProps): JSX.Element | null {
  if (!metrics) return null

  // Geometry is optional (req 4): only when we have a full quad + frame dims.
  const hasGeometry = Boolean(corners && corners.length === 4 && frameWidth && frameHeight)

  const readRegion =
    hasGeometry && corners
      ? [
          mapToQuad(corners, REGION_A.x1 / CARD_WIDTH, REGION_A.y1 / CARD_HEIGHT),
          mapToQuad(corners, REGION_A.x2 / CARD_WIDTH, REGION_A.y1 / CARD_HEIGHT),
          mapToQuad(corners, REGION_A.x2 / CARD_WIDTH, REGION_A.y2 / CARD_HEIGHT),
          mapToQuad(corners, REGION_A.x1 / CARD_WIDTH, REGION_A.y2 / CARD_HEIGHT)
        ]
      : null

  return (
    <div className="pointer-events-none absolute inset-0" data-testid="scan-debug-overlay">
      {hasGeometry && corners && readRegion && (
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox={`0 0 ${frameWidth} ${frameHeight}`}
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
          data-testid="scan-debug-geometry"
        >
          {/* Detected-card outline the scanner is tracking (sky — distinct from the emerald template). */}
          <polygon
            points={pointsAttr(corners)}
            fill="none"
            stroke="#38bdf8"
            strokeWidth={2}
            vectorEffect="non-scaling-stroke"
          />
          {/* Art-crop region actually read/hashed (Region A mapped through the same quad). */}
          <polygon
            points={pointsAttr(readRegion)}
            fill="rgba(244,114,182,0.18)"
            stroke="#f472b6"
            strokeWidth={2}
            strokeDasharray="6 4"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      )}

      <div className="absolute left-3 bottom-3 max-w-[80%] space-y-1 rounded-xl bg-zinc-950/85 px-3 py-2 text-[11px] font-medium text-zinc-200 shadow-lg">
        <MetricRow label="phase" value={metrics.phase} />
        <MetricRow
          label="best"
          value={`${metrics.bestName ?? "—"} (${formatDistance(metrics.bestDistance)})`}
        />
        <MetricRow
          label="runner-up"
          value={`${metrics.runnerUpName ?? "—"} (${formatDistance(metrics.runnerUpDistance)})`}
        />
        <MetricRow label="margin" value={formatDistance(metrics.margin)} />
        <MetricRow label="votes" value={`${metrics.votes}/${metrics.votesNeeded}`} />
        <MetricRow label="lockDistance" value={`${metrics.lockDistance}`} />
        <MetricRow label="marginMin" value={`${metrics.marginMin}`} />
        {/* Frame-quality signals (Slice C, DEC-062/REQ-043): same per-frame metrics that drive best-frame selection and the searching hint. */}
        <MetricRow label="glare%" value={formatPercent(metrics.glareFraction)} />
        <MetricRow label="sharpness" value={formatScore(metrics.sharpness)} />
        <MetricRow label="quality" value={formatScore(metrics.frameQualityScore)} />
        <MetricRow label="reason" value={metrics.conditionReason ?? "—"} />
        {!hasGeometry && <p className="pt-0.5 text-[10px] italic text-zinc-400">no card geometry</p>}
      </div>
    </div>
  )
}
