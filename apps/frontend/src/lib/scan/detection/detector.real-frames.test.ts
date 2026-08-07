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
})
})
