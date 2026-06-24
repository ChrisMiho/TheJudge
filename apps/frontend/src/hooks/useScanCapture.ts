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

export type ScanAddOutcome = { added: true } | { added: false; message: string };

export type ScanConvergence = {
  phase: "searching" | "locking" | "locked";
  leaderName: string | null;
  votes: number;
  votesNeeded: number;
};

/**
 * Read-only per-frame diagnostics for the opt-in debug overlay (DEC-060 /
 * REQ-041). Derived from the same stabilizer signals as `convergence`; plays no
 * part in gating. `null` when not searching (locked / reset). The geometry
 * (card outline + read region) is owned by the camera surface, not here.
 */
export type ScanDebugMetrics = {
  phase: "searching" | "locking";
  bestName: string | null;
  bestDistance: number | null;
  runnerUpName: string | null;
  runnerUpDistance: number | null;
  margin: number | null;
  votes: number;
  votesNeeded: number;
  lockDistance: number;
  marginMin: number;
};

/**
 * One-shot signal emitted on each successful auto-add so the UI can fire a
 * momentary confirmation (thumbs-up popup). `id` is monotonic so the same card
 * added twice still re-triggers the effect.
 */
export type ScanAddConfirmation = { id: number; cardName: string };

const INITIAL_CONVERGENCE: ScanConvergence = {
  phase: "searching",
  leaderName: null,
  votes: 0,
  votesNeeded: SCAN_STABILIZER_CONFIG.minVotes
};

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
  onScanCandidateSelected: (card: CardMetadataItem) => ScanAddOutcome;
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
  const [convergence, setConvergence] = useState<ScanConvergence>(INITIAL_CONVERGENCE);
  const [scanDebug, setScanDebug] = useState<ScanDebugMetrics | null>(null);
  const [blockedNotice, setBlockedNotice] = useState<string | null>(null);
  const [addConfirmation, setAddConfirmation] = useState<ScanAddConfirmation | null>(null);
  const [lowConfidenceCount, setLowConfidenceCount] = useState(0);
  const addCounterRef = useRef(0);
  const resourcesRef = useRef<ScanResources | null>(null);
  const resourcesPromiseRef = useRef<Promise<ScanResources> | null>(null);
  const stabilizerRef = useRef<ScanStabilizer>(new ScanStabilizer(SCAN_STABILIZER_CONFIG));
  const onSelectRef = useRef(onScanCandidateSelected);
  onSelectRef.current = onScanCandidateSelected;

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
    setConvergence(INITIAL_CONVERGENCE);
    setScanDebug(null);
    setBlockedNotice(null);
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
        if (locked) {
          const outcome = onSelectRef.current(locked);
          resetScanState();
          if (outcome && outcome.added === false) {
            setBlockedNotice(outcome.message);
          } else {
            addCounterRef.current += 1;
            setAddConfirmation({ id: addCounterRef.current, cardName: locked.name });
          }
        } else {
          resetScanState();
        }
        return result;
      }

      // Still searching: surface only confident hints, capped, so the picker
      // no longer floods with near-random names.
      const surfaced = ranked
        .filter((entry) => entry.distance <= SURFACE_DISTANCE)
        .slice(0, MAX_SURFACED_CANDIDATES)
        .map((entry) => entry.card);

      setResolvedCandidates([]);
      if (surfaced.length > 0) {
        setLowConfidenceCount(0);
      } else {
        setLowConfidenceCount((count) => count + 1);
      }
      const nameOf = (cardId: string | null): string | null =>
        cardId ? (ranked.find((entry) => entry.card.cardId === cardId)?.card.name ?? null) : null;
      const leaderName = nameOf(state.topCardId);
      const phase: ScanConvergence["phase"] = state.votes > 0 ? "locking" : "searching";
      setConvergence({
        phase,
        leaderName,
        votes: state.votes,
        votesNeeded: state.votesNeeded
      });
      setScanDebug({
        phase,
        bestName: nameOf(state.bestCardId),
        bestDistance: state.bestDistance,
        runnerUpName: nameOf(state.runnerUpCardId),
        runnerUpDistance: state.runnerUpDistance,
        margin: state.margin,
        votes: state.votes,
        votesNeeded: state.votesNeeded,
        lockDistance: SCAN_STABILIZER_CONFIG.lockDistance,
        marginMin: SCAN_STABILIZER_CONFIG.marginMin
      });

      return result;
    },
    [cardMetadata, ensureResources, resetScanState]
  );

  const acceptCandidate = useCallback(
    (card: CardMetadataItem): void => {
      onSelectRef.current(card);
      resetScanState();
    },
    [resetScanState]
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
    convergence,
    scanDebug,
    blockedNotice,
    addConfirmation,
    showManualEntryPrompt: lowConfidenceCount >= LOW_CONFIDENCE_ESCALATION_COUNT,
    openScan,
    closeScan,
    rescan,
    identify,
    acceptCandidate
  };
}
