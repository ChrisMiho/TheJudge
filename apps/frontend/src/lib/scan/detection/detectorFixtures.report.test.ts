import { describe, expect, it } from "vitest"
import {
  evaluateDetectorFixtures,
  loadDetectorFixtureManifest,
  loadDetectorFixtures
} from "../detectorFixtures"

describe("Frontend - Card Scan", () => {
describe("detector fixture corpus", () => {
  it("reports per-fixture detector results and aggregate baseline detect rate", () => {
    const report = evaluateDetectorFixtures(loadDetectorFixtures())

    expect(report.total).toBe(9)
    expect(report.results.map((result) => result.id)).toEqual(loadDetectorFixtureManifest().fixtures.map((f) => f.id))
    expect(report.detected).toBeGreaterThan(0)
    expect(report.detectRate).toBe(report.detected / report.total)
    expect(report.results.find((result) => result.id === "synthetic-obvious-baseline")?.detected).toBe(true)
  })
})
})
