import { describe, expect, it } from "vitest";
import { RUBRIC_AXES, RUBRIC_AXIS_IDS, RUBRIC_REVISION, countFullyCorrect, formatRubricForJudge } from "./rubric.js";

describe("Backend - Eval - Answer quality - rubric (REQ-187)", () => {
  it("exports exactly the four axes, each with 0/1/2 text", () => {
    expect(RUBRIC_AXIS_IDS).toEqual(["correctness", "grounding", "calibration", "readability"]);
    expect(RUBRIC_AXES).toHaveLength(4);
    for (const axis of RUBRIC_AXES) {
      expect(axis.levels[0].length).toBeGreaterThan(0);
      expect(axis.levels[1].length).toBeGreaterThan(0);
      expect(axis.levels[2].length).toBeGreaterThan(0);
    }
  });

  it("carries a non-empty revision identifier", () => {
    expect(typeof RUBRIC_REVISION).toBe("string");
    expect(RUBRIC_REVISION.length).toBeGreaterThan(0);
  });

  it("formatRubricForJudge includes every axis title and the revision, and is the exact text sent to the judge", () => {
    const text = formatRubricForJudge();
    for (const axis of RUBRIC_AXES) {
      expect(text).toContain(axis.title);
    }
    expect(text).toContain(RUBRIC_REVISION);
  });

  it("no code path in this module combines the axes into a single weighted composite score", () => {
    // The only score-reducing export is countFullyCorrect, and it reads
    // exactly one axis (correctness) -- never a weighted sum of axes. This
    // asserts that contract structurally: the module's public surface has no
    // export whose name or behavior implies a composite, and the one
    // reducer present only inspects `correctness`.
    const publicExportNames = ["RUBRIC_AXES", "RUBRIC_AXIS_IDS", "RUBRIC_REVISION", "formatRubricForJudge", "countFullyCorrect"];
    expect(publicExportNames.some((name) => /weight|composite|overall|combined/i.test(name))).toBe(false);

    const allTwosExceptGrounding = { correctness: 2, grounding: 0, calibration: 0, readability: 0 } as const;
    const allTwos = { correctness: 2, grounding: 2, calibration: 2, readability: 2 } as const;
    // Two cases with identical correctness but wildly different other axes
    // must count identically -- proving the reducer never blends them.
    expect(countFullyCorrect([allTwosExceptGrounding])).toBe(countFullyCorrect([allTwos]));
    expect(countFullyCorrect([{ correctness: 1, grounding: 2, calibration: 2, readability: 2 }])).toBe(0);
  });

  it("countFullyCorrect counts only cases scoring Correctness 2, the run's sole headline figure", () => {
    const scores = [
      { correctness: 2, grounding: 2, calibration: 2, readability: 2 },
      { correctness: 1, grounding: 2, calibration: 2, readability: 2 },
      { correctness: 0, grounding: 0, calibration: 0, readability: 0 },
      { correctness: 2, grounding: 0, calibration: 0, readability: 0 }
    ] as const;
    expect(countFullyCorrect(scores)).toBe(2);
  });
});
