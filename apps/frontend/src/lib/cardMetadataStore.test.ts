import { afterEach, describe, expect, it, vi } from "vitest";
import type { CardMetadataItem } from "../types";
import { loadCardMetadata, readCardMetadata, resetCardMetadataForTests } from "./cardMetadataStore";

const cards = [{ cardId: "c1", name: "Sol Ring" }] as unknown as CardMetadataItem[];

function okResponse(): Response {
  return { ok: true, status: 200, json: async () => cards } as unknown as Response;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("cardMetadataStore", () => {
  it("fetches once, shares the load, and hands back the finished list synchronously", async () => {
    const fetchMock = vi.fn(async () => okResponse());
    vi.stubGlobal("fetch", fetchMock);

    expect(readCardMetadata()).toBeUndefined();
    const [first, second] = await Promise.all([loadCardMetadata(), loadCardMetadata()]);
    const later = await loadCardMetadata();

    expect(first).toBe(cards);
    expect(second).toBe(cards);
    expect(later).toBe(cards);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("/data/cardMetadata.json");
    expect(readCardMetadata()).toBe(cards);
  });

  it("rejects every waiting caller on failure and fetches fresh on the next call", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 503 } as unknown as Response)
      .mockResolvedValueOnce(okResponse());
    vi.stubGlobal("fetch", fetchMock);

    const waiting = [loadCardMetadata(), loadCardMetadata()];
    const settled = await Promise.allSettled(waiting);
    expect(settled.map((result) => result.status)).toEqual(["rejected", "rejected"]);
    expect(readCardMetadata()).toBeUndefined();

    await expect(loadCardMetadata()).resolves.toBe(cards);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("rejects on a network error and clears the shared load", async () => {
    const fetchMock = vi.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce(okResponse());
    vi.stubGlobal("fetch", fetchMock);

    await expect(loadCardMetadata()).rejects.toThrow("offline");
    await expect(loadCardMetadata()).resolves.toBe(cards);
  });

  it("forgets the list on test reset", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => okResponse()));
    await loadCardMetadata();
    resetCardMetadataForTests();
    expect(readCardMetadata()).toBeUndefined();
  });
});
