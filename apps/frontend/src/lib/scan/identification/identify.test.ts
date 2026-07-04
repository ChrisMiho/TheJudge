import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  autoLevels,
  CardIdentifier,
  conditionQueryImage,
  suppressQueryGlare,
  whiteBalanceQueryImage
} from "../identify";
import { decodeRawImageFixture } from "../rawImageFixture";
import type { HashDb, RgbImage } from "../types";

const fixturesDir = resolve(__dirname, "..", "__fixtures__");
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

function makeImage(width: number, height: number, pixel: (index: number) => [number, number, number]): RgbImage {
  const data = new Uint8Array(width * height * 3);
  for (let i = 0; i < width * height; i++) {
    const [r, g, b] = pixel(i);
    data[i * 3] = r;
    data[i * 3 + 1] = g;
    data[i * 3 + 2] = b;
  }
  return { width, height, data };
}

function pixelAt(img: RgbImage, index: number): [number, number, number] {
  const p = index * 3;
  return [img.data[p], img.data[p + 1], img.data[p + 2]];
}

function expectImageDataEqual(actual: Uint8Array, expected: Uint8Array) {
  expect(actual.length).toBe(expected.length);
  const mismatch = actual.findIndex((value, index) => value !== expected[index]);
  expect(mismatch).toBe(-1);
}

describe("identify autoLevels", () => {
  it("matches the regenerated expected output pixel-for-pixel", () => {
    const input = loadFixtureImage(vectors.autoLevels.input);
    const expectedOutput = loadFixtureImage(vectors.autoLevels.expectedOutput);

    const actual = autoLevels(input);

    expect(actual.width).toBe(expectedOutput.width);
    expect(actual.height).toBe(expectedOutput.height);
    expectImageDataEqual(actual.data, expectedOutput.data);
  });

  it("stretches both black and white points per channel", () => {
    const input = makeImage(100, 1, (index) => {
      if (index < 5) return [10, 20, 30];
      if (index >= 95) return [220, 230, 240];
      return [120, 125, 130];
    });

    const actual = autoLevels(input);

    expect(pixelAt(actual, 0)).toEqual([0, 0, 0]);
    expect(pixelAt(actual, 99)).toEqual([255, 255, 255]);
    expect(pixelAt(actual, 50)[0]).toBeGreaterThan(125);
    expect(pixelAt(actual, 50)[0]).toBeLessThan(140);
  });
});

describe("query conditioning", () => {
  it("normalizes a red color cast before hashing", () => {
    const input = makeImage(4, 1, () => [180, 90, 90]);

    const actual = whiteBalanceQueryImage(input);

    const [r, g, b] = pixelAt(actual, 0);
    expect(r).toBeLessThan(150);
    expect(g).toBeGreaterThan(110);
    expect(b).toBeGreaterThan(110);
    expect(Math.abs(r - g)).toBeLessThanOrEqual(15);
    expect(Math.abs(r - b)).toBeLessThanOrEqual(15);
  });

  it("compresses neutral specular highlights without dimming saturated bright art", () => {
    const input = makeImage(4, 1, (index) => {
      if (index === 0) return [252, 250, 248];
      if (index === 1) return [236, 235, 234];
      if (index === 2) return [250, 120, 60];
      return [100, 100, 100];
    });

    const actual = suppressQueryGlare(input);

    expect(pixelAt(actual, 0)).toEqual([228, 227, 227]);
    expect(pixelAt(actual, 1)).toEqual([224, 223, 223]);
    expect(pixelAt(actual, 2)).toEqual([250, 120, 60]);
    expect(pixelAt(actual, 3)).toEqual([100, 100, 100]);
  });

  it("runs white balance, full auto-contrast, and glare suppression in the query path", () => {
    const input = makeImage(100, 1, (index) => {
      if (index < 5) return [25, 35, 35];
      if (index >= 95) return [252, 250, 248];
      return [185, 95, 95];
    });

    const actual = conditionQueryImage(input);
    const mid = pixelAt(actual, 50);
    const high = pixelAt(actual, 99);

    expect(mid[0]).toBeLessThan(205);
    expect(mid[1]).toBeGreaterThan(85);
    expect(mid[2]).toBeGreaterThan(85);
    expect(high[0]).toBeLessThan(255);
    expect(high[1]).toBeLessThan(255);
    expect(high[2]).toBeLessThan(255);
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
