import { describe, expect, it } from "vitest"
import { detectCard, detectCardCorners } from "../detector"
import {
  loadDetectorFixtureManifest,
  loadDetectorRealFrameFixture
} from "../detectorFixtures"

describe("Frontend - Card Scan", () => {
describe("detector fixture corpus", () => {
  it("loads committed real PNG frames into RGB images that run through detector entry points", () => {
    const realEntries = loadDetectorFixtureManifest().fixtures.filter((entry) => entry.source === "real")
    expect(realEntries).toHaveLength(4)

    for (const entry of realEntries) {
      const fixture = loadDetectorRealFrameFixture(entry)

      expect(fixture.image.width, entry.id).toBeGreaterThan(0)
      expect(fixture.image.height, entry.id).toBeGreaterThan(0)
      expect(fixture.image.data, entry.id).toBeInstanceOf(Uint8Array)
      expect(fixture.image.data, entry.id).toHaveLength(fixture.image.width * fixture.image.height * 3)
      expect(() => detectCardCorners(fixture.image)).not.toThrow()
      expect(() => detectCard(fixture.image)).not.toThrow()
    }
  })
})
})
