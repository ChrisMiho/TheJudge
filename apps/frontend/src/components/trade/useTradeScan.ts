import { useCallback, useRef, useState } from "react";

import type { ScanCameraStatus } from "../ScanCameraSurface";
import { useScanCapture, type HeldScanEntry } from "../../hooks/useScanCapture";
import { loadScanMap } from "../../lib/scan/loadScanMap";
import type { CardScanMap } from "../../lib/scan/resolveScanCandidates";
import type { Candidate, IdentifyResult, RgbImage } from "../../lib/scan/types";
import type { TradeSideId } from "../../lib/trade/pricing";
import type { CardMetadataItem } from "../../types";

/** DEC-050 fallback: scanning is optional, manual search stays the full input path. */
export const SCAN_CAMERA_UNAVAILABLE_COPY =
  "Camera unavailable — check camera access. You can still add cards with search.";

export type TradeScanNotice = { sideId: TradeSideId; message: string };

export type TradeScan = {
  /** The side whose scan surface is open, or `null` when no camera is open. */
  activeSideId: TradeSideId | null;
  isLoading: boolean;
  error: string | null;
  notice: TradeScanNotice | null;
  openScan: (sideId: TradeSideId) => void;
  closeScan: () => void;
  identify: (image: RgbImage) => Promise<IdentifyResult>;
  setCameraStatus: (status: ScanCameraStatus) => void;
  recordAcquisitionDiagnostic: ReturnType<typeof useScanCapture>["recordAcquisitionDiagnostic"];
  convergence: ReturnType<typeof useScanCapture>["convergence"];
  addConfirmation: ReturnType<typeof useScanCapture>["addConfirmation"];
  scanDebug: ReturnType<typeof useScanCapture>["scanDebug"];
  /** REQ-214: the scanner's own holding list — not yet on either side's entries. */
  heldEntries: HeldScanEntry[];
  removeHeld: (id: number) => void;
};

/**
 * The scanned printing for a locked oracle identity (DEC-070): the closest
 * candidate printing whose scan-map entry resolves to that oracle id.
 */
export function scannedPrintingIdForOracle(
  candidates: Candidate[],
  scanMap: CardScanMap | null,
  oracleId: string
): string | null {
  if (!scanMap) return null;

  return (
    [...candidates]
      .sort((a, b) => a.distance - b.distance)
      .find((candidate) => scanMap[candidate.card_id]?.oracleId === oracleId)?.card_id ?? null
  );
}

/**
 * Scan input for trade entries (REQ-065 scan path, FLOW-009, FLOW-025). Wraps
 * the shared capture hook so a confident lock adds an entry to the scanning
 * side immediately, defaulting to the scanned printing (falling back to
 * whichever printing the on-add fetch resolves first when the scanned
 * printing isn't in the fetched list); the fetch itself, its loading state,
 * and its $0-plus-caution/retry degrade live in `TradeBalancer` (FLOW-025),
 * not here. Printing choice stays a pricing/display concern — nothing here
 * reaches a request payload.
 */
export function useTradeScan({
  cardMetadata,
  onAddByOracle
}: {
  cardMetadata: CardMetadataItem[];
  onAddByOracle: (sideId: TradeSideId, oracleId: string, name: string, preferredPrintingId?: string) => void;
}): TradeScan {
  const [activeSideId, setActiveSideId] = useState<TradeSideId | null>(null);
  const [notice, setNotice] = useState<TradeScanNotice | null>(null);
  const activeSideIdRef = useRef<TradeSideId | null>(null);
  const scanMapRef = useRef<CardScanMap | null>(null);
  const onAddByOracleRef = useRef(onAddByOracle);
  onAddByOracleRef.current = onAddByOracle;

  const addScannedEntry = useCallback(
    (oracleId: string, name: string, candidates: Candidate[]): void => {
      const sideId = activeSideIdRef.current;
      if (!sideId) return;

      const scannedPrintingId =
        scannedPrintingIdForOracle(candidates, scanMapRef.current, oracleId) ?? undefined;
      onAddByOracleRef.current(sideId, oracleId, name, scannedPrintingId);
    },
    []
  );

  const scanCapture = useScanCapture({
    cardMetadata,
    // REQ-214: invoked once per held card when the scanner closes, in hold
    // order — not on recognition. `candidates` is that card's own ranked
    // identify result from the moment it was held, carried by the holding
    // list so the printing resolution below works even long after that frame.
    onScanCandidateSelected: (card, _scanImageUrl, candidates) => {
      addScannedEntry(card.cardId, card.name, candidates);
      return { added: true };
    }
  });

  const { closeScan: closeCapture, identify, openScan: openCapture } = scanCapture;
  const captureSetCameraStatus = scanCapture.setCameraStatus;

  const closeScan = useCallback((): void => {
    // REQ-214: closeCapture() synchronously flushes the holding list through
    // onScanCandidateSelected -> addScannedEntry, which reads activeSideIdRef — so
    // the ref must still name the scanning side while that flush runs. Clear it
    // only after.
    closeCapture();
    activeSideIdRef.current = null;
    setActiveSideId(null);
  }, [closeCapture]);

  const openScan = useCallback(
    (sideId: TradeSideId): void => {
      activeSideIdRef.current = sideId;
      setActiveSideId(sideId);
      setNotice(null);
      void openCapture();
      // Same lazy, cached artifact the capture hook loads; needed here to map the
      // scanned printing id back to the oracle's preferred printing.
      void loadScanMap()
        .then((scanMap) => {
          scanMapRef.current = scanMap;
        })
        .catch(() => {
          scanMapRef.current = null;
        });
    },
    [openCapture]
  );

  const setCameraStatus = useCallback(
    (status: ScanCameraStatus): void => {
      if (status === "camera-error") {
        const sideId = activeSideIdRef.current;
        if (sideId) {
          setNotice({ sideId, message: SCAN_CAMERA_UNAVAILABLE_COPY });
        }
        closeScan();
        return;
      }

      captureSetCameraStatus(status);
    },
    [captureSetCameraStatus, closeScan]
  );

  return {
    activeSideId,
    isLoading: scanCapture.isLoading,
    error: scanCapture.error,
    notice,
    openScan,
    closeScan,
    identify,
    setCameraStatus,
    recordAcquisitionDiagnostic: scanCapture.recordAcquisitionDiagnostic,
    convergence: scanCapture.convergence,
    addConfirmation: scanCapture.addConfirmation,
    scanDebug: scanCapture.scanDebug,
    heldEntries: scanCapture.heldEntries,
    removeHeld: scanCapture.removeHeld
  };
}
