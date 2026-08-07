import { describe, expect, it } from "vitest"
import {
  CARD_HEIGHT,
  CARD_WIDTH,
  detectCard,
  detectCardCorners
} from "../detector"
import { loadDetectorFixtures } from "../detectorFixtures"

describe("Frontend - Card Scan", () => {
describe("detectCard", () => {
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
})
})
