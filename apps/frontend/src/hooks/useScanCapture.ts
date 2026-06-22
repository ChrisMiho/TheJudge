import { useCallback, useRef, useState } from "react";
import { CardIdentifier } from "../lib/scan/identify";
import { loadHashDb } from "../lib/scan/loadHashDb";
import { loadScanMap } from "../lib/scan/loadScanMap";
import {
  resolveScanCandidatesRanked,
  type CardScanMap
} from "../lib/scan/resolveScanCandidates";
import { ScanStabilizer } from "../lib/scan/stabilizer";
import { MAX_SURFACED_CANDIDATES, SCAN_STABILIZER_CONFIG, SURFACE_DISTANCE } from "../lib/scan/tuning";
import type { Candidate, HashDb, IdentifyResult, RgbImage } from "../lib/scan/types";
import type { ScanCameraStatus } from "../components/ScanCameraSurface";
import type { CardMetadataItem } from "../types";

export const LOW_CONFIDENCE_ESCALATION_COUNT = 3;

export type ScanPhase = "searching" | "locked";

type ScanIdentifier = Pick<CardIdentifier, "identify">;

type ScanResources = {
  identifier: ScanIdentifier;
  scanMap: CardScanMap;
};

export type UseScanCaptureDependencies = {
  loadHashDb: () => Promise<HashDb>;
  loadScanMap: () => Promise<CardScanMap>;
  createIdentifier: (db: HashDb) => ScanIdentifier;
};

type UseScanCaptureOptions = {
  cardMetadata: CardMetadataItem[];
  onScanCandidateSelected: (card: CardMetadataItem) => void;
  dependencies?: UseScanCaptureDependencies;
};

const defaultDependencies: UseScanCaptureDependencies = {
  loadHashDb,
  loadScanMap,
  createIdentifier: (db) => new CardIdentifier(db)
};

const EMPTY_IDENTIFY_RESULT: IdentifyResult = {
  matched: false,
  was_rotated: false,
  candidates: []
};

export function useScanCapture({
  cardMetadata,
  onScanCandidateSelected,
  dependencies = defaultDependencies
}: UseScanCaptureOptions) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraStatus, setCameraStatus] = useState<ScanCameraStatus>("idle");
  const [resolvedCandidates, setResolvedCandidates] = useState<CardMetadataItem[]>([]);
  const [lockedCandidate, setLockedCandidate] = useState<CardMetadataItem | null>(null);
  const [scanPhase, setScanPhase] = useState<ScanPhase>("searching");
  const [lowConfidenceCount, setLowConfidenceCount] = useState(0);
  const resourcesRef = useRef<ScanResources | null>(null);
  const resourcesPromiseRef = useRef<Promise<ScanResources> | null>(null);
  const stabilizerRef = useRef<ScanStabilizer>(new ScanStabilizer(SCAN_STABILIZER_CONFIG));

  const ensureResources = useCallback(async (): Promise<ScanResources> => {
    if (resourcesRef.current) {
      return resourcesRef.current;
    }

    if (!resourcesPromiseRef.current) {
      // Lazy static scan assets only; real-device NFR-010 size/latency/memory metrics stay at the manual validation gate.
      resourcesPromiseRef.current = Promise.all([dependencies.loadHashDb(), dependencies.loadScanMap()]).then(
        ([db, scanMap]) => {
          const resources = {
            identifier: dependencies.createIdentifier(db),
            scanMap
          };
          resourcesRef.current = resources;
          return resources;
        }
      );
    }

    return resourcesPromiseRef.current;
  }, [dependencies]);

  const resetScanState = useCallback((): void => {
    stabilizerRef.current.reset();
    setResolvedCandidates([]);
    setLockedCandidate(null);
    setScanPhase("searching");
    setLowConfidenceCount(0);
  }, []);

  const openScan = useCallback(async (): Promise<void> => {
    setIsOpen(true);
    setIsLoading(true);
    setError(null);
    resetScanState();
    try {
      await ensureResources();
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Could not load scan resources";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [ensureResources, resetScanState]);

  const closeScan = useCallback((): void => {
    setIsOpen(false);
    setCameraStatus("idle");
    resetScanState();
  }, [resetScanState]);

  /** Discard the current lock-in and resume the auto-scan loop. */
  const rescan = useCallback((): void => {
    resetScanState();
  }, [resetScanState]);

  const identify = useCallback(
    async (image: RgbImage): Promise<IdentifyResult> => {
      let resources: ScanResources;
      try {
        resources = await ensureResources();
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : "Could not load scan resources";
        setError(message);
        return EMPTY_IDENTIFY_RESULT;
      }

      // Already locked in: ignore further frames until accept / rescan / close.
      if (stabilizerRef.current.isLocked()) {
        return EMPTY_IDENTIFY_RESULT;
      }

      const result = resources.identifier.identify(image);

      // Vote on the resolved ORACLE identity, not printing ids -- different
      // printings of one card must not split a vote. Distances are preserved.
      const ranked = resolveScanCandidatesRanked(result.candidates, resources.scanMap, cardMetadata);
      const votingCandidates: Candidate[] = ranked.map((entry) => ({
        card_id: entry.card.cardId,
        distance: entry.distance
      }));

      const state = stabilizerRef.current.push(votingCandidates);

      if (state.phase === "locked") {
        const locked = ranked.find((entry) => entry.card.cardId === state.cardId)?.card ?? null;
        setLockedCandidate(locked);
        setScanPhase("locked");
        setResolvedCandidates([]);
        setLowConfidenceCount(0);
        return result;
      }

      // Still searching: surface only confident hints, capped, so the picker
      // no longer floods with near-random names.
      const surfaced = ranked
        .filter((entry) => entry.distance <= SURFACE_DISTANCE)
        .slice(0, MAX_SURFACED_CANDIDATES)
        .map((entry) => entry.card);

      if (surfaced.length > 0) {
        // A confident frame refreshes the suggestion.
        setResolvedCandidates(surfaced);
        setLowConfidenceCount(0);
      } else {
        // Weak / blurry frame (e.g. the card is mid-move). Keep the last good
        // suggestion on screen so it stays tappable instead of flickering away;
        // no-card frames never reach here (identify is skipped when no card is
        // detected), so the suggestion also persists when the card leaves frame.
        // Still track low confidence for the manual-entry escalation.
        setLowConfidenceCount((count) => count + 1);
      }

      return result;
    },
    [cardMetadata, ensureResources]
  );

  const acceptCandidate = useCallback(
    (card: CardMetadataItem): void => {
      onScanCandidateSelected(card);
      resetScanState();
    },
    [onScanCandidateSelected, resetScanState]
  );

  return {
    isOpen,
    isLoading,
    error,
    cameraStatus,
    setCameraStatus,
    resolvedCandidates,
    lockedCandidate,
    scanPhase,
    showManualEntryPrompt: lowConfidenceCount >= LOW_CONFIDENCE_ESCALATION_COUNT,
    openScan,
    closeScan,
    rescan,
    identify,
    acceptCandidate
  };
}
