import { describe, expect, it } from "vitest"
import {
  CARD_HEIGHT,
  CARD_WIDTH,
  convexHull,
  minAreaRect,
  orderQuadCorners,
  polygonArea,
  warpPerspective
} from "../detector"
import { makeImage, fillRect } from "../../../test/detectorImageHelpers"

describe("Frontend - Card Scan", () => {
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
})
