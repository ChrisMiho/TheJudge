import { describe, expect, it } from "vitest";
import { stackPositionTag } from "./stackTags";

describe("stackPositionTag", () => {
  it("tags a single card TOP", () => {
    expect(stackPositionTag(0, 1)).toBe("TOP");
  });

  it("tags two cards BOTTOM / TOP", () => {
    expect(stackPositionTag(0, 2)).toBe("BOTTOM");
    expect(stackPositionTag(1, 2)).toBe("TOP");
  });

  it("tags three cards BOTTOM, 2ND, TOP, counting down from the top", () => {
    expect(stackPositionTag(0, 3)).toBe("BOTTOM");
    expect(stackPositionTag(1, 3)).toBe("2ND");
    expect(stackPositionTag(2, 3)).toBe("TOP");
  });

  it("tags five cards with 2ND/3RD/4TH between the ends", () => {
    expect(stackPositionTag(0, 5)).toBe("BOTTOM");
    expect(stackPositionTag(1, 5)).toBe("4TH");
    expect(stackPositionTag(2, 5)).toBe("3RD");
    expect(stackPositionTag(3, 5)).toBe("2ND");
    expect(stackPositionTag(4, 5)).toBe("TOP");
  });

  it("returns an empty tag for an empty zone", () => {
    expect(stackPositionTag(0, 0)).toBe("");
  });
});
