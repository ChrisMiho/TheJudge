import { describe, expect, it } from "vitest";
import { buildScanMapEntry } from "../../../../../../scripts/build-card-scan-map.mjs";

describe("Frontend - Card Scan", () => {
describe("buildScanMapEntry", () => {
  it("returns oracleId, name, and imageUrl from image_uris.normal", () => {
    const card = {
      id: "printing-a",
      oracle_id: "oracle-opt",
      name: "Opt",
      image_uris: { normal: "https://img/opt-normal.jpg", small: "https://img/opt-small.jpg" }
    };

    const entry = buildScanMapEntry(card);

    expect(entry).toEqual({
      oracleId: "oracle-opt",
      name: "Opt",
      imageUrl: "https://img/opt-normal.jpg"
    });
  });

  it("falls back to image_uris.small when normal is absent", () => {
    const card = {
      id: "printing-b",
      oracle_id: "oracle-bolt",
      name: "Lightning Bolt",
      image_uris: { small: "https://img/bolt-small.jpg" }
    };

    const entry = buildScanMapEntry(card);

    expect(entry.imageUrl).toBe("https://img/bolt-small.jpg");
  });

  it("falls back to card_face image_uris when top-level image_uris is absent", () => {
    const card = {
      id: "printing-dfc",
      oracle_id: "oracle-dfc",
      name: "Delver of Secrets",
      card_faces: [
        { image_uris: { normal: "https://img/delver-front.jpg" } },
        { image_uris: { normal: "https://img/insectile.jpg" } }
      ]
    };

    const entry = buildScanMapEntry(card);

    expect(entry.imageUrl).toBe("https://img/delver-front.jpg");
  });

  it("returns empty string imageUrl when no image exists", () => {
    const card = {
      id: "printing-c",
      oracle_id: "oracle-no-image",
      name: "No Image Card"
    };

    const entry = buildScanMapEntry(card);

    expect(entry).toEqual({
      oracleId: "oracle-no-image",
      name: "No Image Card",
      imageUrl: ""
    });
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
