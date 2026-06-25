import { describe, expect, it } from "vitest"
import {
  evaluateDetectorFixtures,
  generateDetectorFixtureImage,
  loadDetectorFixtureManifest,
  loadDetectorFixtures
} from "./detectorFixtures"

describe("detector fixture corpus", () => {
  it("loads committed provenance for all required detector condition classes", () => {
    const manifest = loadDetectorFixtureManifest()

    expect(manifest.fixtures.map((fixture) => fixture.conditionClass).sort()).toEqual(
      [
        "foil-like/internal-edge distraction",
        "glare/specular highlight",
        "low-contrast border vs. surface",
        "obvious baseline card",
        "perspective skew"
      ].sort()
    )
    expect(manifest.fixtures).toHaveLength(5)
    expect(manifest.notes).toContain("No entry depends on ignored Scryfall image caches")
    for (const fixture of manifest.fixtures) {
      expect(fixture.provenance).toContain("committed")
      expect(fixture.generation.seed).toEqual(expect.any(Number))
    }
  })

  it("generates fixture image bytes deterministically from committed parameters", () => {
    const fixture = loadDetectorFixtureManifest().fixtures.find((entry) => entry.id === "synthetic-glare-specular")
    expect(fixture).toBeDefined()

    const first = generateDetectorFixtureImage(fixture!)
    const second = generateDetectorFixtureImage(fixture!)

    expect(first.width).toBe(fixture!.generation.frameWidth)
    expect(first.height).toBe(fixture!.generation.frameHeight)
    expect(Array.from(first.data)).toEqual(Array.from(second.data))
  })

  it("reports per-fixture detector results and aggregate baseline detect rate", () => {
    const report = evaluateDetectorFixtures(loadDetectorFixtures())

    expect(report.total).toBe(5)
    expect(report.results.map((result) => result.id)).toEqual(loadDetectorFixtureManifest().fixtures.map((f) => f.id))
    expect(report.detected).toBeGreaterThan(0)
    expect(report.detectRate).toBe(report.detected / report.total)
    expect(report.results.find((result) => result.id === "synthetic-obvious-baseline")?.detected).toBe(true)
  })
})
