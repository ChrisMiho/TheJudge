import { describe, expect, it } from "vitest";
import { ZONE_LABELS } from "./zoneLabels";

describe("zoneLabels", () => {
  it("labels every supported zone", () => {
    expect(ZONE_LABELS.stack).toBe("Stack");
    expect(ZONE_LABELS.battlefield).toBe("Battlefield");
    expect(ZONE_LABELS.command).toBe("Command Zone");
  });
});
