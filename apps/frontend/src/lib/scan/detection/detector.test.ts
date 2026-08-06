import { describe, expect, it } from "vitest"
import {
  CARD_HEIGHT,
  CARD_WIDTH,
  detectCard,
  detectCardCorners,
  polygonArea
} from "../detector"
import { loadDetectorFixtures } from "../detectorFixtures"
import { makeImage, fillRect, quadCentroid } from "../../../test/detectorImageHelpers"

describe("Frontend - Card Scan", () => {
describe("detectCard", () => {
  it("finds and warps an obvious bordered card in a synthetic frame", () => {
    const frame = makeImage(320, 420, [25, 25, 25])
    fillRect(frame, 80, 40, 160, 280, [235, 235, 235])
    fillRect(frame, 92, 55, 136, 250, [180, 40, 90])

    const card = detectCard(frame)

    expect(card).not.toBeNull()
    expect(card?.width).toBe(CARD_WIDTH)
    expect(card?.height).toBe(CARD_HEIGHT)
  })

  it("detects via the downscale path and still warps to canonical dimensions", () => {
    const frame = makeImage(320, 420, [25, 25, 25])
    fillRect(frame, 80, 40, 160, 280, [235, 235, 235])
    fillRect(frame, 92, 55, 136, 250, [180, 40, 90])

    // Force the downscale branch (longest side 420 > 200): corners are detected
    // on the shrunk copy, scaled back, and warped from the full-res frame.
    const card = detectCard(frame, { maxDetectDimension: 200 })

    expect(card).not.toBeNull()
    expect(card?.width).toBe(CARD_WIDTH)
    expect(card?.height).toBe(CARD_HEIGHT)
  })

  it("reports fallback usage only after primary detection misses", () => {
    const fixtures = loadDetectorFixtures()
    const baseline = fixtures.find((fixture) => fixture.id === "synthetic-obvious-baseline")
    const lowContrast = fixtures.find((fixture) => fixture.id === "synthetic-low-contrast-border")
    expect(baseline).toBeDefined()
    expect(lowContrast).toBeDefined()

    const primaryOnly: boolean[] = []
    const fallbackAfterMiss: boolean[] = []

    expect(detectCardCorners(baseline!.image, { onFallback: (used) => primaryOnly.push(used) })).not.toBeNull()
    expect(primaryOnly).toEqual([false])

    expect(detectCardCorners(lowContrast!.image, { onFallback: (used) => fallbackAfterMiss.push(used) })).not.toBeNull()
    expect(fallbackAfterMiss).toEqual([true])
  })

  it("prefers the centered card over a larger off-card rectangular background edge", () => {
    const frame = makeImage(560, 520, [35, 35, 35])
    fillRect(frame, 190, 76, 150, 210, [210, 210, 210])
    fillRect(frame, 202, 90, 126, 182, [44, 65, 150])

    // A larger card-aspect picture frame in the background should not win just
    // because it has the largest gate-passing contour.
    fillRect(frame, 360, 64, 172, 240, [225, 225, 225])
    fillRect(frame, 374, 80, 144, 208, [38, 38, 38])

    const corners = detectCardCorners(frame)

    expect(corners).not.toBeNull()
    expect(quadCentroid(corners!).x).toBeLessThan(340)
  })

  it("keeps the largest multi-channel candidate when smaller channel-only clutter skews the median area", () => {
    const frame = makeImage(520, 620, [24, 24, 24])
    fillRect(frame, 190, 80, 160, 224, [225, 225, 225])
    fillRect(frame, 202, 96, 136, 192, [120, 36, 120])

    // Red-only, card-aspect distractions provide valid channel candidates that
    // are smaller than the card. The real card should not be filtered out by a
    // median-area cap before final selection.
    for (const [x, y, width, height] of [
      [18, 56, 78, 110],
      [410, 70, 74, 104]
    ]) {
      fillRect(frame, x, y, width, height, [160, 24, 24])
      fillRect(frame, x + 7, y + 9, width - 14, height - 18, [24, 24, 24])
    }

    const corners = detectCardCorners(frame)

    expect(corners).not.toBeNull()
    expect(polygonArea(corners!)).toBeGreaterThan(30000)
  })

  it("uses an optional guide prior to prefer an in-guide card over larger off-guide clutter", () => {
    const frame = makeImage(560, 520, [35, 35, 35])
    fillRect(frame, 112, 74, 132, 184, [210, 210, 210])
    fillRect(frame, 124, 90, 108, 152, [44, 65, 150])
    fillRect(frame, 298, 70, 176, 246, [225, 225, 225])
    fillRect(frame, 312, 86, 148, 214, [38, 38, 38])

    const noGuide = detectCardCorners(frame)
    const withGuide = detectCardCorners(frame, { guide: { x: 90, y: 50, width: 190, height: 260 } })

    expect(noGuide).not.toBeNull()
    expect(withGuide).not.toBeNull()
    expect(quadCentroid(noGuide!).x).toBeGreaterThan(300)
    expect(quadCentroid(withGuide!).x).toBeLessThan(280)
  })

  it("keeps detecting a partly misaligned card when a guide prior is present", () => {
    const frame = makeImage(420, 520, [35, 35, 35])
    fillRect(frame, 66, 48, 152, 214, [210, 210, 210])
    fillRect(frame, 78, 64, 128, 182, [44, 65, 150])

    const corners = detectCardCorners(frame, { guide: { x: 110, y: 80, width: 180, height: 250 } })

    expect(corners).not.toBeNull()
    expect(detectCard(frame, { guide: { x: 110, y: 80, width: 180, height: 250 } })?.width).toBe(CARD_WIDTH)
  })
})
})
