import { useCallback, useRef, useState } from "react";
import { CardIdentifier } from "../lib/scan/identify";
import { loadHashDb } from "../lib/scan/loadHashDb";
import { loadScanMap } from "../lib/scan/loadScanMap";
import { resolveScanCandidates, type CardScanMap } from "../lib/scan/resolveScanCandidates";
import type { HashDb, IdentifyResult, RgbImage } from "../lib/scan/types";
import type { ScanCameraStatus } from "../components/ScanCameraSurface";
import type { CardMetadataItem } from "../types";

export const LOW_CONFIDENCE_ESCALATION_COUNT = 3;

type ScanIdentifier = Pick<CardIdentifier, "identify" | "isCardBack">;

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
  const [isCardBack, setIsCardBack] = useState(false);
  const [resolvedCandidates, setResolvedCandidates] = useState<CardMetadataItem[]>([]);
  const [lowConfidenceCount, setLowConfidenceCount] = useState(0);
  const resourcesRef = useRef<ScanResources | null>(null);
  const resourcesPromiseRef = useRef<Promise<ScanResources> | null>(null);

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

  const openScan = useCallback(async (): Promise<void> => {
    setIsOpen(true);
    setIsLoading(true);
    setError(null);
    try {
      await ensureResources();
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Could not load scan resources";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [ensureResources]);

  const closeScan = useCallback((): void => {
    setIsOpen(false);
    setIsCardBack(false);
    setResolvedCandidates([]);
    setLowConfidenceCount(0);
    setCameraStatus("idle");
  }, []);

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

      const backResult = resources.identifier.isCardBack(image);
      if (backResult.isBack) {
        setIsCardBack(true);
        setResolvedCandidates([]);
        return EMPTY_IDENTIFY_RESULT;
      }

      setIsCardBack(false);
      const result = resources.identifier.identify(image);
      if (!result.matched) {
        setResolvedCandidates([]);
        setLowConfidenceCount((count) => count + 1);
        return result;
      }

      const resolved = resolveScanCandidates(result.candidates, resources.scanMap, cardMetadata);
      setResolvedCandidates(resolved);
      setLowConfidenceCount(0);

      if (resolved.length === 1) {
        onScanCandidateSelected(resolved[0]);
      }

      return result;
    },
    [cardMetadata, ensureResources, onScanCandidateSelected]
  );

  const acceptCandidate = useCallback(
    (card: CardMetadataItem): void => {
      onScanCandidateSelected(card);
      setResolvedCandidates([]);
      setLowConfidenceCount(0);
      setIsCardBack(false);
    },
    [onScanCandidateSelected]
  );

  return {
    isOpen,
    isLoading,
    error,
    cameraStatus,
    setCameraStatus,
    isCardBack,
    resolvedCandidates,
    showManualEntryPrompt: lowConfidenceCount >= LOW_CONFIDENCE_ESCALATION_COUNT,
    openScan,
    closeScan,
    identify,
    acceptCandidate
  };
}
