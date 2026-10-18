import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CARD_HEIGHT, CARD_WIDTH } from "../lib/scan/identify";
import type { CardScanMap } from "../lib/scan/resolveScanCandidates";
import type { HashDb, IdentifyResult, RgbImage } from "../lib/scan/types";
import type { CardMetadataItem } from "../types";
import { SCAN_DATA_UNAVAILABLE_MESSAGE } from "../lib/scan/scanDataMessage";
import { SCAN_STABILIZER_CONFIG } from "../lib/scan/tuning";
import { DETECTOR_FAILURE_NUDGE_COUNT, useScanCapture } from "./useScanCapture";

// How many unmatched captures in a row the "stays open" test feeds the scanner.
const LOW_CONFIDENCE_ESCALATION_COUNT = 3;

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
    imageId: "",
    colors: [],
  };
}

const image: RgbImage = makeGoodImage();
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

describe("Frontend - Card Scan", () => {
  describe("Scan capture", () => {
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

    it("two scanners using the shared loader get the same resources object", async () => {
      const identifier = makeIdentifier({ matched: false, was_rotated: false, candidates: [] });
      const shared = Promise.resolve({ identifier, scanMap });
      const loadResources = vi.fn(() => shared);
      const mount = () =>
        renderHook(() =>
          useScanCapture({
            cardMetadata,
            onScanCandidateSelected: vi.fn(() => ({ added: true } as const)),
            dependencies: { loadResources }
          })
        );
      const a = mount();
      const b = mount();

      await act(async () => {
        await a.result.current.openScan();
        await b.result.current.openScan();
        await a.result.current.identify(image);
        await b.result.current.identify(image);
      });

      expect(loadResources).toHaveBeenCalledTimes(2);
      expect(identifier.identify).toHaveBeenCalledTimes(2);
    });

    it("REQ-249: a failed first open shows the plain sentence, and the next open retries and builds the identifier", async () => {
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
      const identifier = makeIdentifier({ matched: false, was_rotated: false, candidates: [] });
      const loadHashDb = vi
        .fn<() => Promise<HashDb>>()
        .mockRejectedValueOnce(new Error("Could not load card hash DB: 503 Service Unavailable"))
        .mockResolvedValue(db);
      const loadScanMap = vi.fn(async () => scanMap);
      const createIdentifier = vi.fn(() => identifier);
      const { result } = renderHook(() =>
        useScanCapture({
          cardMetadata,
          onScanCandidateSelected: vi.fn(() => ({ added: true } as const)),
          dependencies: { loadHashDb, loadScanMap, createIdentifier }
        })
      );

      await act(async () => {
        await result.current.openScan();
      });

      expect(result.current.error).toBe(SCAN_DATA_UNAVAILABLE_MESSAGE);
      expect(result.current.error).not.toMatch(/503|hash DB/);
      expect(consoleError).toHaveBeenCalled();
      expect(createIdentifier).not.toHaveBeenCalled();

      await act(async () => {
        result.current.closeScan();
        await result.current.openScan();
      });

      expect(result.current.error).toBeNull();
      expect(loadHashDb).toHaveBeenCalledTimes(2);
      expect(createIdentifier).toHaveBeenCalledTimes(1);

      await act(async () => {
        await result.current.identify(image);
      });
      expect(identifier.identify).toHaveBeenCalledTimes(1);
      consoleError.mockRestore();
    });

    it("REQ-249: camera frames after a failed load do not re-request scan data", async () => {
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
      const loadHashDb = vi.fn<() => Promise<HashDb>>().mockRejectedValue(new Error("offline"));
      const loadScanMap = vi.fn(async () => scanMap);
      const { result } = renderHook(() =>
        useScanCapture({
          cardMetadata,
          onScanCandidateSelected: vi.fn(() => ({ added: true } as const)),
          dependencies: {
            loadHashDb,
            loadScanMap,
            createIdentifier: () => makeIdentifier({ matched: false, was_rotated: false, candidates: [] })
          }
        })
      );

      await act(async () => {
        await result.current.openScan();
        await result.current.identify(image);
        await result.current.identify(image);
      });

      expect(loadHashDb).toHaveBeenCalledTimes(1);
      expect(result.current.error).toBe(SCAN_DATA_UNAVAILABLE_MESSAGE);
      consoleError.mockRestore();
    });

    it("REQ-214: a recognised card waits in the holding list, not the destination, and resumes searching", async () => {
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
        for (let i = 0; i < SCAN_STABILIZER_CONFIG.minVotes; i++) {
          await result.current.identify(image);
        }
      });

      expect(onScanCandidateSelected).not.toHaveBeenCalled();
      expect(result.current.heldEntries).toHaveLength(1);
      expect(result.current.heldEntries[0]).toMatchObject({
        card: cardMetadata[0],
        scanImageUrl: "https://cards.scryfall.io/normal/front/p/r/printing-opt.jpg"
      });
      expect(result.current.blockedNotice).toBeNull();
    });

    it("REQ-214: closing the scanner commits every held card to the destination, in hold order", async () => {
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
        for (let i = 0; i < SCAN_STABILIZER_CONFIG.minVotes; i++) {
          await result.current.identify(image);
        }
      });
      expect(onScanCandidateSelected).not.toHaveBeenCalled();

      act(() => {
        result.current.closeScan();
      });

      expect(onScanCandidateSelected).toHaveBeenCalledTimes(1);
      expect(onScanCandidateSelected).toHaveBeenCalledWith(cardMetadata[0], "https://cards.scryfall.io/normal/front/p/r/printing-opt.jpg", [
        { card_id: "opt", distance: 7 }
      ]);
      expect(result.current.heldEntries).toHaveLength(0);
      expect(result.current.isOpen).toBe(false);
    });

    it("REQ-214: removing a held card drops it from the list with nothing committed for it", async () => {
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
        for (let i = 0; i < SCAN_STABILIZER_CONFIG.minVotes; i++) {
          await result.current.identify(image);
        }
      });
      const heldId = result.current.heldEntries[0].id;

      act(() => {
        result.current.removeHeld(heldId);
      });
      expect(result.current.heldEntries).toHaveLength(0);

      act(() => {
        result.current.closeScan();
      });
      expect(onScanCandidateSelected).not.toHaveBeenCalled();
    });

    it("REQ-214: a held card the destination rejects on commit surfaces a non-blocking notice", async () => {
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
        for (let i = 0; i < SCAN_STABILIZER_CONFIG.minVotes; i++) {
          await result.current.identify(image);
        }
      });

      act(() => {
        result.current.closeScan();
      });

      expect(onScanCandidateSelected).toHaveBeenCalledTimes(1);
      expect(result.current.blockedNotice).toBe("Card already in stack");
    });

    it("REQ-214: opening the scanner starts at an empty holding list", async () => {
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
        for (let i = 0; i < SCAN_STABILIZER_CONFIG.minVotes; i++) {
          await result.current.identify(image);
        }
      });
      expect(result.current.heldEntries).toHaveLength(1);

      await act(async () => {
        await result.current.openScan();
      });
      expect(result.current.heldEntries).toHaveLength(0);
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
      expect(result.current.convergence.phase).toBe("locking");
      expect(result.current.convergence.leaderName).toBe("Opt");
      expect(result.current.convergence.votes).toBe(1);
      expect(result.current.convergence.votesNeeded).toBe(SCAN_STABILIZER_CONFIG.minVotes);
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

    it("remains open after consecutive low-confidence captures", async () => {
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

    it("does not let a stale detector-miss diagnostic hide a later close-to-voting identity state", async () => {
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
        result.current.recordAcquisitionDiagnostic({
          reason: "detector-miss",
          detector: { success: false, nativeWidth: 320, nativeHeight: 240, maxDetectDimension: 640 }
        });
        await result.current.identify(image);
      });

      expect(result.current.convergence.inZone).toBe(true);
    });
  });
});
