import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { autoLevels, CardIdentifier } from "./identify";
import { decodeRawImageFixture } from "./rawImageFixture";
import type { HashDb } from "./types";

const fixturesDir = resolve(__dirname, "__fixtures__");
const vectors = JSON.parse(readFileSync(resolve(fixturesDir, "vectors.json"), "utf8")) as {
  autoLevels: { input: string; expectedOutput: string };
  identify: {
    db: Array<{ id: string; hash: string }>;
    query: string;
    topN: number;
    expected: { matched: boolean; was_rotated: boolean; candidates: Array<{ card_id: string; distance: number }> };
  };
};

function loadFixtureImage(name: string) {
  return decodeRawImageFixture(new Uint8Array(readFileSync(resolve(fixturesDir, name))));
}

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

describe("identify autoLevels", () => {
  it("matches the regenerated expected output pixel-for-pixel", () => {
    const input = loadFixtureImage(vectors.autoLevels.input);
    const expectedOutput = loadFixtureImage(vectors.autoLevels.expectedOutput);

    const actual = autoLevels(input);

    expect(actual.width).toBe(expectedOutput.width);
    expect(actual.height).toBe(expectedOutput.height);
    expect(Array.from(actual.data)).toEqual(Array.from(expectedOutput.data));
  });
});

describe("CardIdentifier.identify", () => {
  it("matches candidate order, ids, distances, matched, and was_rotated", () => {
    const { db, query, topN, expected } = vectors.identify;
    const hashDb: HashDb = {
      ids: db.map((entry) => entry.id),
      hashes: (() => {
        const out = new Uint8Array(db.length * 96);
        db.forEach((entry, i) => out.set(hexToBytes(entry.hash), i * 96));
        return out;
      })(),
      count: db.length
    };

    const identifier = new CardIdentifier(hashDb);
    const queryImage = loadFixtureImage(query);
    const result = identifier.identify(queryImage, topN);

    expect(result.matched).toBe(expected.matched);
    expect(result.was_rotated).toBe(expected.was_rotated);
    expect(result.candidates.map((c) => c.card_id)).toEqual(
      expected.candidates.map((c) => c.card_id)
    );
    result.candidates.forEach((candidate, i) => {
      expect(candidate.distance).toBeCloseTo(expected.candidates[i].distance, 2);
    });
  });
});
