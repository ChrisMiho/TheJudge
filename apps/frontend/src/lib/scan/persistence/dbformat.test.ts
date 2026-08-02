import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { readDb, writeDb } from "../dbformat";

const fixturesDir = resolve(__dirname, "..", "__fixtures__");

describe("Frontend - Card Scan", () => {
describe("dbformat readDb", () => {
  it("parses the committed fixture DB (pure binary, decoder-independent)", () => {
    const bytes = readFileSync(resolve(fixturesDir, "fixture_db.bin"));
    const db = readDb(new Uint8Array(bytes));

    expect(db.count).toBe(3);
    expect(db.ids).toEqual(["card_10", "card_11", "card_12"]);
    expect(db.hashes.length).toBe(db.count * 96);
  });

  it("rejects a buffer with the wrong magic", () => {
    const bad = new Uint8Array(24);
    bad.set(new TextEncoder().encode("BADMAGIC"), 0);
    expect(() => readDb(bad)).toThrow(/bad magic/);
  });

  it("writes a byte-stable DB that readDb can parse", () => {
    const hashes = new Uint8Array(3 * 96);
    for (let i = 0; i < hashes.length; i++) hashes[i] = (i * 17) & 0xff;

    const bytes = writeDb({
      ids: ["front-id", "split-id__back", "_card_back"],
      hashes,
      count: 3
    });

    const db = readDb(bytes);
    expect(db.ids).toEqual(["front-id", "split-id__back", "_card_back"]);
    expect(db.count).toBe(3);
    expect(Array.from(db.hashes)).toEqual(Array.from(hashes));
    expect(Array.from(writeDb(db))).toEqual(Array.from(bytes));
  });
});
});
