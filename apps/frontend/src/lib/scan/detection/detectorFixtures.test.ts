import { describe, expect, it } from "vitest"
import baselineEval from "../__fixtures__/detector/baseline-eval.json"
import {
  generateDetectorFixtureImage,
  loadDetectorFixtureManifest
} from "../detectorFixtures"

describe("Frontend - Card Scan", () => {
describe("detector fixture corpus", () => {
  it("loads committed provenance for all required detector condition classes", () => {
    const manifest = loadDetectorFixtureManifest()

    expect(manifest.fixtures.filter((fixture) => fixture.source === "synthetic").map((fixture) => fixture.conditionClass).sort()).toEqual(
      [
        "foil-like/internal-edge distraction",
        "glare/specular highlight",
        "low-contrast border vs. surface",
        "obvious baseline card",
        "perspective skew"
      ].sort()
    )
    expect(manifest.fixtures.filter((fixture) => fixture.source === "synthetic")).toHaveLength(5)
    expect(manifest.notes).toContain("No entry depends on ignored Scryfall image caches")
    for (const fixture of manifest.fixtures) {
      expect(fixture.provenance).toContain("committed")
      if (fixture.source === "synthetic") {
        expect(fixture.generation.seed).toEqual(expect.any(Number))
      }
    }
  })

  it("records committed real-frame provenance and condition context", () => {
    const realFixtures = loadDetectorFixtureManifest().fixtures.filter((entry) => entry.source === "real")

    expect(realFixtures.map((entry) => entry.id).sort()).toEqual([
      "real-scan-frame-1782432138658",
      "real-scan-frame-1782432169082",
      "real-scan-frame-1782437902936",
      "real-scan-frame-1782437922190"
    ])
    for (const fixture of realFixtures) {
      expect(fixture.provenance).toContain("Owner on-device capture 2026-06-25")
      expect(fixture.conditionClass).toBeTruthy()
      expect(fixture.file).toMatch(/^real\/scan-frame-\d+\.png$/)
    }
  })

  it("generates fixture image bytes deterministically from committed parameters", () => {
    const fixture = loadDetectorFixtureManifest().fixtures.find(
      (entry) => entry.source === "synthetic" && entry.id === "synthetic-glare-specular"
    )
    expect(fixture).toBeDefined()
    if (fixture?.source !== "synthetic") throw new Error("Expected synthetic glare fixture")

    const first = generateDetectorFixtureImage(fixture)
    const second = generateDetectorFixtureImage(fixture)

    expect(first.width).toBe(fixture.generation.frameWidth)
    expect(first.height).toBe(fixture.generation.frameHeight)
    expect(Array.from(first.data)).toEqual(Array.from(second.data))
  })

  it("records distinct pre-tuning baselines for synthetic and real-frame fixtures", () => {
    expect(baselineEval.groups.synthetic.label).toBe("synthetic detector fixtures (necessary-but-not-sufficient)")
    expect(baselineEval.groups.synthetic.total).toBe(5)
    expect(baselineEval.groups.synthetic.detected).toBeGreaterThan(0)
    expect(baselineEval.groups.real.label).toBe("real owner-captured frames")
    expect(baselineEval.groups.real.total).toBe(2)
    expect(baselineEval.groups.real.detected).toBe(2)
    expect(baselineEval.groups.real.results).toEqual([
      expect.objectContaining({ id: "real-scan-frame-1782432138658", detected: true }),
      expect.objectContaining({ id: "real-scan-frame-1782432169082", detected: true })
    ])
  })
})
})
