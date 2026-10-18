import { describe, expect, it } from "vitest";
import { buildScanMapEntry } from "../../../../../../scripts/build-card-scan-map.mjs";

describe("Frontend - Card Scan", () => {
describe("buildScanMapEntry", () => {
  it("returns only oracleId and name, with no image address (REQ-048)", () => {
    const card = {
      id: "printing-a",
      oracle_id: "oracle-opt",
      name: "Opt",
      image_uris: { normal: "https://img/opt-normal.jpg", small: "https://img/opt-small.jpg" }
    };

    const entry = buildScanMapEntry(card);

    expect(entry).toEqual({ oracleId: "oracle-opt", name: "Opt" });
    expect(Object.keys(entry)).toEqual(["oracleId", "name"]);
  });

  it("returns the same two-field shape for a card with no image", () => {
    const card = {
      id: "printing-c",
      oracle_id: "oracle-no-image",
      name: "No Image Card"
    };

    expect(buildScanMapEntry(card)).toEqual({ oracleId: "oracle-no-image", name: "No Image Card" });
  });

  it("trims whitespace from card name", () => {
    const card = {
      id: "printing-d",
      oracle_id: "oracle-spaced",
      name: "  Brainstorm  ",
      image_uris: { normal: "https://img/brainstorm.jpg" }
    };

    const entry = buildScanMapEntry(card);

    expect(entry.name).toBe("Brainstorm");
  });
});
});
