import { describe, expect, it } from "vitest"
import {
  evaluateDetectorFixtures,
  loadDetectorFixtures
} from "../detectorFixtures"

describe("Frontend - Card Scan", () => {
describe("detector fixture corpus", () => {
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
})
})
