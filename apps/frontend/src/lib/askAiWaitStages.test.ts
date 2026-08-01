import { describe, expect, it } from "vitest";
import { formatElapsed, selectStage, WAIT_STAGES } from "./askAiWaitStages";

describe("Frontend - MTG Assistant", () => {
describe("selectStage", () => {
  it("returns threshold-0 stage at 0s", () => {
    expect(selectStage(0, WAIT_STAGES).threshold).toBe(0);
  });

  it("returns threshold-0 stage at 2s", () => {
    expect(selectStage(2, WAIT_STAGES).threshold).toBe(0);
  });

  it("returns threshold-3 stage at exactly 3s", () => {
    expect(selectStage(3, WAIT_STAGES).threshold).toBe(3);
  });

  it("returns threshold-8 stage at exactly 8s", () => {
    expect(selectStage(8, WAIT_STAGES).threshold).toBe(8);
  });

  it("returns threshold-40 stage at exactly 40s", () => {
    expect(selectStage(40, WAIT_STAGES).threshold).toBe(40);
  });

  it("returns threshold-40 stage at 999s", () => {
    expect(selectStage(999, WAIT_STAGES).threshold).toBe(40);
  });
});

describe("formatElapsed", () => {
  it("formats 0 as 0:00", () => {
    expect(formatElapsed(0)).toBe("0:00");
  });

  it("formats 4 as 0:04", () => {
    expect(formatElapsed(4)).toBe("0:04");
  });

  it("formats 59 as 0:59", () => {
    expect(formatElapsed(59)).toBe("0:59");
  });

  it("formats 60 as 1:00", () => {
    expect(formatElapsed(60)).toBe("1:00");
  });

  it("formats 63 as 1:03", () => {
    expect(formatElapsed(63)).toBe("1:03");
  });
});
});
