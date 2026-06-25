import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CARD_HEIGHT, CARD_WIDTH } from "../lib/scan/identify";
import type { CardScanMap } from "../lib/scan/resolveScanCandidates";
import type { HashDb, IdentifyResult, RgbImage } from "../lib/scan/types";
import type { CardMetadataItem } from "../types";
import { SCAN_STABILIZER_CONFIG } from "../lib/scan/tuning";
import { DETECTOR_FAILURE_NUDGE_COUNT, LOW_CONFIDENCE_ESCALATION_COUNT, useScanCapture } from "./useScanCapture";

function makeImage(
  width: number,
  height: number,
  pixel: (x: number, y: number) => [number, number, number]
): RgbImage {
  const data = new Uint8Array(width * height * 3);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [r, g, b] = pixel(x, y);
      const p = (y * width + x) * 3;
      data[p] = r;
      data[p + 1] = g;
      data[p + 2] = b;
    }
  }
  return { width, height, data };
}

/** Deterministic per-pixel noise: a "crisp", well-lit, unoccluded frame for the frame selector. */
function noiseChannel(x: number, y: number, seed: number): number {
  let h = (x * 374761393 + y * 668265263 + seed * 2147483647) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  h = (h ^ (h >>> 16)) >>> 0;
  return 20 + (h % 200);
}

/** A frame-quality-acceptable image: hook tests below exercise stabilizer/voting plumbing, not frame quality. */
function makeGoodImage(): RgbImage {
  return makeImage(CARD_WIDTH, CARD_HEIGHT, (x, y) => [
    noiseChannel(x, y, 1),
    noiseChannel(x, y, 2),
    noiseChannel(x, y, 3)
  ]);
}

/** A flat, featureless frame: always below the frame-quality acceptance bar. */
function makePoorImage(): RgbImage {
  return makeImage(CARD_WIDTH, CARD_HEIGHT, () => [130, 130, 130]);
}

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

const image: RgbImage = makeGoodImage();
const db: HashDb = { ids: [], hashes: new Uint8Array(), count: 0 };
const scanMap: CardScanMap = {
  "printing-opt": { oracleId: "opt", name: "Opt", imageUrl: "https://img/opt-print.jpg" },
  "printing-bolt": { oracleId: "lightning-bolt", name: "Lightning Bolt", imageUrl: "https://img/bolt-print.jpg" }
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
        onScanCandidateSelected: vi.fn(() => ({ added: true } as const)),
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

  it("auto-adds the locked card via the add path and resumes searching", async () => {
    const identifier = makeIdentifier({
      matched: true,
      was_rotated: false,
      candidates: [{ card_id: "printing-opt", distance: 7 }]
    });
    const onScanCandidateSelected = vi.fn(() => ({ added: true } as const));
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
      for (let i = 0; i < 6; i++) {
        await result.current.identify(image);
      }
    });

    expect(onScanCandidateSelected).toHaveBeenCalledTimes(1);
    expect(onScanCandidateSelected).toHaveBeenCalledWith(cardMetadata[0], "https://img/opt-print.jpg");
    expect(result.current.scanPhase).toBe("searching");
    expect(result.current.lockedCandidate).toBeNull();
    expect(result.current.blockedNotice).toBeNull();
  });

  it("a blocked add surfaces a non-blocking notice and keeps scanning", async () => {
    const identifier = makeIdentifier({
      matched: true,
      was_rotated: false,
      candidates: [{ card_id: "printing-opt", distance: 7 }]
    });
    const onScanCandidateSelected = vi.fn(() => ({ added: false, message: "Card already in stack" } as const));
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
      for (let i = 0; i < 6; i++) {
        await result.current.identify(image);
      }
    });

    expect(onScanCandidateSelected).toHaveBeenCalledTimes(1);
    expect(result.current.scanPhase).toBe("searching");
    expect(result.current.lockedCandidate).toBeNull();
    expect(result.current.blockedNotice).toBe("Card already in stack");
  });

  it("ambiguous frames never auto-add", async () => {
    const identifier = makeIdentifier({
      matched: true,
      was_rotated: false,
      candidates: [
        { card_id: "printing-bolt", distance: 50 },
        { card_id: "printing-opt", distance: 55 }
      ]
    });
    const onScanCandidateSelected = vi.fn(() => ({ added: true } as const));
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
      for (let i = 0; i < 8; i++) {
        await result.current.identify(image);
      }
    });

    expect(onScanCandidateSelected).not.toHaveBeenCalled();
    expect(result.current.scanPhase).toBe("searching");
  });

  it("single confident frame converges (locking) without auto-adding", async () => {
    const identifier = makeIdentifier({
      matched: true,
      was_rotated: false,
      candidates: [{ card_id: "printing-opt", distance: 7 }]
    });
    const onScanCandidateSelected = vi.fn(() => ({ added: true } as const));
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

    expect(onScanCandidateSelected).not.toHaveBeenCalled();
    expect(result.current.scanPhase).toBe("searching");
    expect(result.current.convergence.phase).toBe("locking");
    expect(result.current.convergence.leaderName).toBe("Opt");
    expect(result.current.convergence.votes).toBe(1);
    expect(result.current.convergence.votesNeeded).toBe(SCAN_STABILIZER_CONFIG.minVotes);
  });

  it("rescan() resets convergence and notice to a clean searching state", async () => {
    const identifier = makeIdentifier({
      matched: true,
      was_rotated: false,
      candidates: [{ card_id: "printing-opt", distance: 7 }]
    });
    const onScanCandidateSelected = vi.fn(() => ({ added: true } as const));
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
      for (let i = 0; i < 2; i++) {
        await result.current.identify(image);
      }
    });

    act(() => {
      result.current.rescan();
    });

    expect(result.current.convergence.phase).toBe("searching");
    expect(result.current.convergence.leaderName).toBeNull();
    expect(result.current.blockedNotice).toBeNull();
    expect(result.current.scanPhase).toBe("searching");
  });

  it("surfaces and resets a detector nudge after sustained no-card statuses", async () => {
    const identifier = makeIdentifier({ matched: false, was_rotated: false, candidates: [] });
    const { result } = renderHook(() =>
      useScanCapture({
        cardMetadata,
        onScanCandidateSelected: vi.fn(() => ({ added: true } as const)),
        dependencies: {
          loadHashDb: vi.fn(async () => db),
          loadScanMap: vi.fn(async () => scanMap),
          createIdentifier: vi.fn(() => identifier)
        }
      })
    );

    await act(async () => {
      await result.current.openScan();
    });

    act(() => {
      for (let index = 0; index < DETECTOR_FAILURE_NUDGE_COUNT - 1; index++) {
        result.current.setCameraStatus("no-card");
      }
    });
    expect(result.current.convergence.detectorNudge).toBeNull();

    act(() => {
      result.current.setCameraStatus("no-card");
    });
    expect(result.current.convergence.detectorNudge).toBe("card-outline");

    act(() => {
      result.current.setCameraStatus("captured");
    });
    expect(result.current.convergence.detectorNudge).toBeNull();

    act(() => {
      for (let index = 0; index < DETECTOR_FAILURE_NUDGE_COUNT; index++) {
        result.current.setCameraStatus("no-card");
      }
      result.current.closeScan();
    });
    expect(result.current.convergence.detectorNudge).toBeNull();
  });

  it("replaces stale locking copy with the detector nudge after sustained no-card statuses", async () => {
    const identifier = makeIdentifier({
      matched: true,
      was_rotated: false,
      candidates: [{ card_id: "printing-opt", distance: 7 }]
    });
    const { result } = renderHook(() =>
      useScanCapture({
        cardMetadata,
        onScanCandidateSelected: vi.fn(() => ({ added: true } as const)),
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
    expect(result.current.convergence.phase).toBe("locking");
    expect(result.current.convergence.leaderName).toBe("Opt");

    act(() => {
      for (let index = 0; index < DETECTOR_FAILURE_NUDGE_COUNT; index++) {
        result.current.setCameraStatus("no-card");
      }
    });

    expect(result.current.convergence.phase).toBe("searching");
    expect(result.current.convergence.leaderName).toBeNull();
    expect(result.current.convergence.detectorNudge).toBe("card-outline");
  });

  it("shows the manual-entry prompt after consecutive low-confidence captures", async () => {
    const identifier = makeIdentifier({ matched: false, was_rotated: false, candidates: [] });
    const { result } = renderHook(() =>
      useScanCapture({
        cardMetadata,
        onScanCandidateSelected: vi.fn(() => ({ added: true } as const)),
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

  it("does not call identify() or auto-add for a poor-quality (frame-selector abstaining) frame", async () => {
    const identifier = makeIdentifier({
      matched: true,
      was_rotated: false,
      candidates: [{ card_id: "printing-opt", distance: 7 }]
    });
    const onScanCandidateSelected = vi.fn(() => ({ added: true } as const));
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

    const poorImage = makePoorImage();
    await act(async () => {
      await result.current.openScan();
      for (let i = 0; i < 6; i++) {
        await result.current.identify(poorImage);
      }
    });

    expect(identifier.identify).not.toHaveBeenCalled();
    expect(onScanCandidateSelected).not.toHaveBeenCalled();
    expect(result.current.scanPhase).toBe("searching");
    expect(result.current.convergence.conditionHint).toBe("blur");
  });

  it("resumes identifying once a good frame follows poor frames within the selector window", async () => {
    const identifier = makeIdentifier({
      matched: true,
      was_rotated: false,
      candidates: [{ card_id: "printing-opt", distance: 7 }]
    });
    const onScanCandidateSelected = vi.fn(() => ({ added: true } as const));
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

    const poorImage = makePoorImage();
    await act(async () => {
      await result.current.openScan();
      await result.current.identify(poorImage);
      await result.current.identify(image);
    });

    expect(identifier.identify).toHaveBeenCalledTimes(1);
    expect(result.current.convergence.conditionHint).toBeNull();
  });
});
