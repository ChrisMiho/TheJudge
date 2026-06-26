import { describe, expect, it } from "vitest"
import {
  CARD_HEIGHT,
  CARD_WIDTH,
  convexHull,
  detectCard,
  detectCardCorners,
  minAreaRect,
  orderQuadCorners,
  polygonArea,
  warpPerspective
} from "./detector"
import { loadDetectorFixtures } from "./detectorFixtures"
import type { RgbImage } from "./types"

function makeImage(width: number, height: number, fill: [number, number, number]): RgbImage {
  const data = new Uint8Array(width * height * 3)
  for (let i = 0; i < data.length; i += 3) {
    data[i] = fill[0]
    data[i + 1] = fill[1]
    data[i + 2] = fill[2]
  }
  return { width, height, data }
}

function setPixel(img: RgbImage, x: number, y: number, rgb: [number, number, number]): void {
  const off = (y * img.width + x) * 3
  img.data[off] = rgb[0]
  img.data[off + 1] = rgb[1]
  img.data[off + 2] = rgb[2]
}

function fillRect(
  img: RgbImage,
  x0: number,
  y0: number,
  width: number,
  height: number,
  rgb: [number, number, number]
): void {
  for (let y = y0; y < y0 + height; y++) {
    for (let x = x0; x < x0 + width; x++) setPixel(img, x, y, rgb)
  }
}

function quadCentroid(points: { x: number; y: number }[]): { x: number; y: number } {
  return {
    x: points.reduce((sum, p) => sum + p.x, 0) / points.length,
    y: points.reduce((sum, p) => sum + p.y, 0) / points.length
  }
}

describe("orderQuadCorners", () => {
  it("orders upright points as top-left, top-right, bottom-right, bottom-left", () => {
    const ordered = orderQuadCorners([
      { x: 80, y: 240 },
      { x: 40, y: 20 },
      { x: 160, y: 30 },
      { x: 140, y: 250 }
    ])

    expect(ordered).toEqual([
      { x: 40, y: 20 },
      { x: 160, y: 30 },
      { x: 140, y: 250 },
      { x: 80, y: 240 }
    ])
  })

  it("orders rotated and landscape quads using screen-space top and left edges", () => {
    const rotated = orderQuadCorners([
      { x: 140, y: 30 },
      { x: 250, y: 120 },
      { x: 160, y: 260 },
      { x: 40, y: 170 }
    ])
    expect(rotated[0]).toEqual({ x: 140, y: 30 })
    expect(rotated[1]).toEqual({ x: 250, y: 120 })
    expect(rotated[2]).toEqual({ x: 160, y: 260 })
    expect(rotated[3]).toEqual({ x: 40, y: 170 })

    const landscape = orderQuadCorners([
      { x: 40, y: 70 },
      { x: 250, y: 60 },
      { x: 260, y: 180 },
      { x: 50, y: 190 }
    ])
    expect(landscape).toEqual([
      { x: 40, y: 70 },
      { x: 250, y: 60 },
      { x: 260, y: 180 },
      { x: 50, y: 190 }
    ])
  })
})

describe("convexHull and polygonArea", () => {
  it("finds the outer hull and computes shoelace area", () => {
    const hull = convexHull([
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 4, y: 3 },
      { x: 0, y: 3 },
      { x: 2, y: 1 }
    ])

    expect(hull).toEqual([
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 4, y: 3 },
      { x: 0, y: 3 }
    ])
    expect(polygonArea(hull)).toBe(12)
  })
})

describe("minAreaRect", () => {
  it("reports the expected aspect ratio for axis-aligned and rotated rectangles", () => {
    const axisAligned = minAreaRect([
      { x: 10, y: 20 },
      { x: 50, y: 20 },
      { x: 50, y: 100 },
      { x: 10, y: 100 }
    ])
    expect(
      Math.max(axisAligned.width, axisAligned.height) / Math.min(axisAligned.width, axisAligned.height)
    ).toBeCloseTo(2, 5)

    const rotated = minAreaRect([
      { x: 20, y: 0 },
      { x: 90, y: 70 },
      { x: 50, y: 110 },
      { x: -20, y: 40 }
    ])
    expect(Math.max(rotated.width, rotated.height) / Math.min(rotated.width, rotated.height)).toBeCloseTo(1.75, 5)
  })
})

describe("warpPerspective", () => {
  it("warps a synthetic quad into the canonical dimensions and samples the source center", () => {
    const frame = makeImage(180, 220, [10, 20, 30])
    fillRect(frame, 40, 30, 100, 160, [200, 30, 60])

    const warped = warpPerspective(frame, [
      { x: 40, y: 30 },
      { x: 139, y: 30 },
      { x: 139, y: 189 },
      { x: 40, y: 189 }
    ])

    expect(warped.width).toBe(CARD_WIDTH)
    expect(warped.height).toBe(CARD_HEIGHT)
    const center = (Math.floor(CARD_HEIGHT / 2) * CARD_WIDTH + Math.floor(CARD_WIDTH / 2)) * 3
    expect(Array.from(warped.data.slice(center, center + 3))).toEqual([200, 30, 60])
  })
})

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

  it("runs committed detector fixtures through corner detection and card warping", () => {
    const fixtures = loadDetectorFixtures()
    const baseline = fixtures.find((fixture) => fixture.id === "synthetic-obvious-baseline")
    expect(baseline).toBeDefined()

    const corners = detectCardCorners(baseline!.image)
    const card = detectCard(baseline!.image)

    expect(corners).not.toBeNull()
    expect(corners).toHaveLength(4)
    expect(card?.width).toBe(CARD_WIDTH)
    expect(card?.height).toBe(CARD_HEIGHT)
  })

  it("detects committed glare, foil, and low-contrast detector fixtures", () => {
    const fixtures = loadDetectorFixtures()
    const hardFixtureIds = [
      "synthetic-glare-specular",
      "synthetic-foil-internal-edge-distraction",
      "synthetic-low-contrast-border"
    ]

    for (const id of hardFixtureIds) {
      const fixture = fixtures.find((entry) => entry.id === id)
      expect(fixture, id).toBeDefined()
      expect(detectCardCorners(fixture!.image), id).not.toBeNull()
      const card = detectCard(fixture!.image)
      expect(card?.width, id).toBe(CARD_WIDTH)
      expect(card?.height, id).toBe(CARD_HEIGHT)
    }
  })

  it("detects and warps committed real hand-held detector fixtures", () => {
    const fixtures = loadDetectorFixtures().filter((fixture) => fixture.source === "real")
    expect(fixtures.map((fixture) => fixture.id).sort()).toEqual([
      "real-scan-frame-1782432138658",
      "real-scan-frame-1782432169082",
      "real-scan-frame-1782437902936",
      "real-scan-frame-1782437922190"
    ])

    for (const fixture of fixtures) {
      expect(detectCardCorners(fixture.image), fixture.id).not.toBeNull()
      const card = detectCard(fixture.image)
      expect(card?.width, fixture.id).toBe(CARD_WIDTH)
      expect(card?.height, fixture.id).toBe(CARD_HEIGHT)
    }
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
