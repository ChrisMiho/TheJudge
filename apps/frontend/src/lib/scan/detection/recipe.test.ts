import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { phashRegionHex } from "../recipe";
import { decodeRawImageFixture } from "../rawImageFixture";

const fixturesDir = resolve(__dirname, "..", "__fixtures__");
const vectors = JSON.parse(readFileSync(resolve(fixturesDir, "vectors.json"), "utf8")) as {
  phash: Array<{ input: string; r: string; g: string; b: string }>;
};

describe("Frontend - Card Scan", () => {
describe("recipe phashRegionHex", () => {
  it.each(vectors.phash)(
    "matches the regenerated packed hash byte-for-byte ($input)",
    ({ input, r, g, b }) => {
      const bytes = readFileSync(resolve(fixturesDir, input));
      const region = decodeRawImageFixture(new Uint8Array(bytes));

      const [hexR, hexG, hexB] = phashRegionHex(region);

      expect(hexR).toBe(r);
      expect(hexG).toBe(g);
      expect(hexB).toBe(b);
    }
  );
});
});
