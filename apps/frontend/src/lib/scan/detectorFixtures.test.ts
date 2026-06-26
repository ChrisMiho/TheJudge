import { describe, expect, it } from "vitest"
import baselineEval from "./__fixtures__/detector/baseline-eval.json"
import { detectCard, detectCardCorners } from "./detector"
import {
  evaluateDetectorFixtures,
  generateDetectorFixtureImage,
  loadDetectorFixtureManifest,
  loadDetectorFixtures,
  loadDetectorRealFrameFixture
} from "./detectorFixtures"

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

  it("reports per-fixture detector results and aggregate baseline detect rate", () => {
    const report = evaluateDetectorFixtures(loadDetectorFixtures())

    expect(report.total).toBe(9)
    expect(report.results.map((result) => result.id)).toEqual(loadDetectorFixtureManifest().fixtures.map((f) => f.id))
    expect(report.detected).toBeGreaterThan(0)
    expect(report.detectRate).toBe(report.detected / report.total)
    expect(report.results.find((result) => result.id === "synthetic-obvious-baseline")?.detected).toBe(true)
  })

  it("separates synthetic and real-frame evaluation groups in the report", () => {
    const report = evaluateDetectorFixtures(loadDetectorFixtures())

    expect(report.groups.synthetic.label).toBe("synthetic detector fixtures (necessary-but-not-sufficient)")
    expect(report.groups.synthetic.total).toBe(5)
    expect(report.groups.synthetic.detectRate).toBe(report.groups.synthetic.detected / report.groups.synthetic.total)
    expect(report.groups.real.label).toBe("real owner-captured frames")
    expect(report.groups.real.total).toBe(4)
    expect(report.groups.real.detectRate).toBe(report.groups.real.detected / report.groups.real.total)
    expect(report.results.filter((result) => result.source === "real")).toHaveLength(4)
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
