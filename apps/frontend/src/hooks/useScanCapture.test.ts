import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { CardScanMap } from "../lib/scan/resolveScanCandidates";
import type { HashDb, IdentifyResult, RgbImage } from "../lib/scan/types";
import type { CardMetadataItem } from "../types";
import { LOW_CONFIDENCE_ESCALATION_COUNT, useScanCapture } from "./useScanCapture";

function makeCard(cardId: string, name: string): CardMetadataItem {
  return {
    cardId,
    name,
    oracleText: `${name} text`,
    imageUrl: "",
    manaCost: "",
    manaValue: 0,
    typeLine: "Instant",
    colors: [],
    supertypes: [],
    subtypes: []
  };
}

const image: RgbImage = { width: 1, height: 1, data: new Uint8Array([0, 0, 0]) };
const db: HashDb = { ids: [], hashes: new Uint8Array(), count: 0 };
const scanMap: CardScanMap = {
  "printing-opt": { oracleId: "opt", name: "Opt" },
  "printing-bolt": { oracleId: "lightning-bolt", name: "Lightning Bolt" }
};
const cardMetadata = [makeCard("opt", "Opt"), makeCard("lightning-bolt", "Lightning Bolt")];

function makeIdentifier(result: IdentifyResult) {
  return {
    identify: vi.fn(() => result)
  };
}

describe("useScanCapture", () => {
  it("lazily loads scan resources once when scan mode opens", async () => {
    const identifier = makeIdentifier({ matched: false, was_rotated: false, candidates: [] });
    const loadHashDb = vi.fn(async () => db);
    const loadScanMap = vi.fn(async () => scanMap);
    const createIdentifier = vi.fn(() => identifier);
    const { result } = renderHook(() =>
      useScanCapture({
        cardMetadata,
        onScanCandidateSelected: vi.fn(),
        dependencies: { loadHashDb, loadScanMap, createIdentifier }
      })
    );

    expect(loadHashDb).not.toHaveBeenCalled();
    expect(loadScanMap).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.openScan();
    });
    await act(async () => {
      await result.current.closeScan();
      await result.current.openScan();
    });

    expect(result.current.isOpen).toBe(true);
    expect(loadHashDb).toHaveBeenCalledTimes(1);
    expect(loadScanMap).toHaveBeenCalledTimes(1);
    expect(createIdentifier).toHaveBeenCalledTimes(1);
  });

  it("surfaces a confident match as a hint without auto-selecting on a single frame", async () => {
    const identifier = makeIdentifier({
      matched: true,
      was_rotated: false,
      candidates: [{ card_id: "printing-opt", distance: 7 }]
    });
    const onScanCandidateSelected = vi.fn();
    const { result } = renderHook(() =>
      useScanCapture({
        cardMetadata,
        onScanCandidateSelected,
        dependencies: {
          loadHashDb: vi.fn(async () => db),
          loadScanMap: vi.fn(async () => scanMap),
          createIdentifier: vi.fn(() => identifier)
        }
      })
    );

    await act(async () => {
      await result.current.openScan();
      await result.current.identify(image);
    });

    // One frame is a hint only -- lock-in requires sustained agreement.
    expect(result.current.resolvedCandidates.map((card) => card.name)).toEqual(["Opt"]);
    expect(result.current.scanPhase).toBe("searching");
    expect(result.current.lockedCandidate).toBeNull();
    expect(onScanCandidateSelected).not.toHaveBeenCalled();
    expect(result.current.showManualEntryPrompt).toBe(false);
  });

  it("keeps the last confident suggestion through a following weak frame", async () => {
    const identify = vi
      .fn()
      .mockReturnValueOnce({
        matched: true,
        was_rotated: false,
        candidates: [{ card_id: "printing-opt", distance: 7 }]
      })
      .mockReturnValueOnce({
        matched: false,
        was_rotated: false,
        candidates: [{ card_id: "printing-bolt", distance: 200 }]
      });
    const identifier = { identify };
    const { result } = renderHook(() =>
      useScanCapture({
        cardMetadata,
        onScanCandidateSelected: vi.fn(),
        dependencies: {
          loadHashDb: vi.fn(async () => db),
          loadScanMap: vi.fn(async () => scanMap),
          createIdentifier: vi.fn(() => identifier)
        }
      })
    );

    await act(async () => {
      await result.current.openScan();
      await result.current.identify(image); // confident -> surfaces Opt
      await result.current.identify(image); // weak -> must NOT wipe the suggestion
    });

    expect(result.current.resolvedCandidates.map((card) => card.name)).toEqual(["Opt"]);
    expect(result.current.scanPhase).toBe("searching");
  });

  it("locks in after sustained agreement and accepts on user confirm", async () => {
    const identifier = makeIdentifier({
      matched: true,
      was_rotated: false,
      candidates: [{ card_id: "printing-opt", distance: 7 }]
    });
    const onScanCandidateSelected = vi.fn();
    const { result } = renderHook(() =>
      useScanCapture({
        cardMetadata,
        onScanCandidateSelected,
        dependencies: {
          loadHashDb: vi.fn(async () => db),
          loadScanMap: vi.fn(async () => scanMap),
          createIdentifier: vi.fn(() => identifier)
        }
      })
    );

    await act(async () => {
      await result.current.openScan();
      for (let i = 0; i < 4; i++) {
        await result.current.identify(image);
      }
    });

    expect(result.current.scanPhase).toBe("locked");
    expect(result.current.lockedCandidate?.name).toBe("Opt");
    expect(result.current.resolvedCandidates).toEqual([]);
    // Lock-in does not auto-add: the user confirms.
    expect(onScanCandidateSelected).not.toHaveBeenCalled();

    act(() => {
      result.current.acceptCandidate(result.current.lockedCandidate as CardMetadataItem);
    });

    expect(onScanCandidateSelected).toHaveBeenCalledWith(cardMetadata[0]);
    expect(result.current.scanPhase).toBe("searching");
    expect(result.current.lockedCandidate).toBeNull();
  });

  it("rescan() clears a lock and resumes searching", async () => {
    const identifier = makeIdentifier({
      matched: true,
      was_rotated: false,
      candidates: [{ card_id: "printing-opt", distance: 7 }]
    });
    const { result } = renderHook(() =>
      useScanCapture({
        cardMetadata,
        onScanCandidateSelected: vi.fn(),
        dependencies: {
          loadHashDb: vi.fn(async () => db),
          loadScanMap: vi.fn(async () => scanMap),
          createIdentifier: vi.fn(() => identifier)
        }
      })
    );

    await act(async () => {
      await result.current.openScan();
      for (let i = 0; i < 4; i++) {
        await result.current.identify(image);
      }
    });
    expect(result.current.scanPhase).toBe("locked");

    act(() => {
      result.current.rescan();
    });

    expect(result.current.scanPhase).toBe("searching");
    expect(result.current.lockedCandidate).toBeNull();
  });

  it("keeps multiple resolved candidates for user selection before previewing", async () => {
    const identifier = makeIdentifier({
      matched: true,
      was_rotated: false,
      candidates: [
        { card_id: "printing-bolt", distance: 5 },
        { card_id: "printing-opt", distance: 8 }
      ]
    });
    const onScanCandidateSelected = vi.fn();
    const { result } = renderHook(() =>
      useScanCapture({
        cardMetadata,
        onScanCandidateSelected,
        dependencies: {
          loadHashDb: vi.fn(async () => db),
          loadScanMap: vi.fn(async () => scanMap),
          createIdentifier: vi.fn(() => identifier)
        }
      })
    );

    await act(async () => {
      await result.current.openScan();
      await result.current.identify(image);
    });

    expect(result.current.resolvedCandidates.map((card) => card.name)).toEqual(["Lightning Bolt", "Opt"]);
    expect(onScanCandidateSelected).not.toHaveBeenCalled();

    act(() => {
      result.current.acceptCandidate(cardMetadata[1]);
    });

    expect(onScanCandidateSelected).toHaveBeenCalledWith(cardMetadata[1]);
    expect(result.current.resolvedCandidates).toEqual([]);
  });

  it("shows the manual-entry prompt after consecutive low-confidence captures", async () => {
    const identifier = makeIdentifier({ matched: false, was_rotated: false, candidates: [] });
    const { result } = renderHook(() =>
      useScanCapture({
        cardMetadata,
        onScanCandidateSelected: vi.fn(),
        dependencies: {
          loadHashDb: vi.fn(async () => db),
          loadScanMap: vi.fn(async () => scanMap),
          createIdentifier: vi.fn(() => identifier)
        }
      })
    );

    await act(async () => {
      await result.current.openScan();
      for (let index = 0; index < LOW_CONFIDENCE_ESCALATION_COUNT; index++) {
        await result.current.identify(image);
      }
    });

    expect(result.current.showManualEntryPrompt).toBe(true);
    expect(result.current.isOpen).toBe(true);
  });
});
