import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readDb, writeDb } from "../dbformat";

function makeDbBytes(): Uint8Array {
  const hashes = new Uint8Array(2 * 96);
  for (let i = 0; i < hashes.length; i++) hashes[i] = (i * 31) & 0xff;
  return writeDb({
    ids: ["test-front", "test-back__back"],
    hashes,
    count: 2
  });
}

describe("Frontend - Card Scan", () => {
describe("loadHashDb", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does not fetch the hash DB until invoked", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await import("../loadHashDb");

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fetches once across repeated calls and parses the DB bytes", async () => {
    const bytes = makeDbBytes();
    const responseBody = new ArrayBuffer(bytes.byteLength);
    new Uint8Array(responseBody).set(bytes);
    const fetchMock = vi.fn(async () => new Response(responseBody));
    vi.stubGlobal("fetch", fetchMock);
    const { loadHashDb } = await import("../loadHashDb");

    const first = loadHashDb();
    const second = loadHashDb();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("/data/cardhashes.bin");

    const [firstDb, secondDb] = await Promise.all([first, second]);
    expect(secondDb).toBe(firstDb);
    expect(firstDb.ids).toEqual(["test-front", "test-back__back"]);
    expect(firstDb.count).toBe(2);
    expect(Array.from(firstDb.hashes)).toEqual(Array.from(readDb(bytes).hashes));
  });
});
});
