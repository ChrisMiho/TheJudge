import { describe, expect, it } from "vitest";
import {
  classifyVoteReason,
  type AcquisitionThresholds,
  type VoteReasonInput
} from "./acquisitionDiagnostics";

const THRESHOLDS: AcquisitionThresholds = { lockDistance: 78, marginMin: 14 };

// A fully satisfied frame: detector hit, quality accepted, resolved, distance and margin pass.
const ACCEPTED: VoteReasonInput = {
  detectorHit: true,
  qualityAbstain: false,
  resolved: true,
  bestDistance: 60,
  margin: 20
};

describe("classifyVoteReason", () => {
  it("returns detector-miss when no card outline was found", () => {
    expect(classifyVoteReason({ ...ACCEPTED, detectorHit: false }, THRESHOLDS)).toBe("detector-miss");
  });

  it("returns quality-abstain when frame selector abstained", () => {
    expect(classifyVoteReason({ ...ACCEPTED, qualityAbstain: true }, THRESHOLDS)).toBe("quality-abstain");
  });

  it("returns unresolved-candidate when resolved flag is false after detection and quality pass", () => {
    expect(
      classifyVoteReason({ ...ACCEPTED, resolved: false, bestDistance: null, margin: null }, THRESHOLDS)
    ).toBe("unresolved-candidate");
  });

  it("returns unresolved-candidate when bestDistance is null even if resolved is true", () => {
    expect(classifyVoteReason({ ...ACCEPTED, bestDistance: null }, THRESHOLDS)).toBe("unresolved-candidate");
  });

  it("returns distance-above-lock when best distance exceeds lockDistance", () => {
    expect(classifyVoteReason({ ...ACCEPTED, bestDistance: 79 }, THRESHOLDS)).toBe("distance-above-lock");
  });

  it("returns accepted-vote when best distance equals lockDistance exactly (boundary is strict >)", () => {
    expect(classifyVoteReason({ ...ACCEPTED, bestDistance: 78 }, THRESHOLDS)).toBe("accepted-vote");
  });

  it("returns margin-below-min when runner-up margin is too narrow", () => {
    expect(classifyVoteReason({ ...ACCEPTED, margin: 13 }, THRESHOLDS)).toBe("margin-below-min");
  });

  it("returns accepted-vote when all conditions pass", () => {
    expect(classifyVoteReason(ACCEPTED, THRESHOLDS)).toBe("accepted-vote");
  });

  it("returns accepted-vote when margin is null (single distinct candidate) and distance passes", () => {
    expect(classifyVoteReason({ ...ACCEPTED, margin: null }, THRESHOLDS)).toBe("accepted-vote");
  });

  it("evaluates detector-miss before quality-abstain", () => {
    expect(classifyVoteReason({ ...ACCEPTED, detectorHit: false, qualityAbstain: true }, THRESHOLDS)).toBe(
      "detector-miss"
    );
  });

  it("evaluates quality-abstain before unresolved-candidate", () => {
    expect(
      classifyVoteReason(
        { ...ACCEPTED, qualityAbstain: true, resolved: false, bestDistance: null, margin: null },
        THRESHOLDS
      )
    ).toBe("quality-abstain");
  });

  it("evaluates distance-above-lock before margin-below-min", () => {
    expect(classifyVoteReason({ ...ACCEPTED, bestDistance: 90, margin: 5 }, THRESHOLDS)).toBe("distance-above-lock");
  });

  it("uses caller-supplied thresholds, not hidden config values", () => {
    const tight: AcquisitionThresholds = { lockDistance: 50, marginMin: 30 };
    // bestDistance=60 passes the default threshold but fails the tight one
    expect(classifyVoteReason(ACCEPTED, tight)).toBe("distance-above-lock");
  });
});
