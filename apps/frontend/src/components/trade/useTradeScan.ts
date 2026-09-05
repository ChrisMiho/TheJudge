import { useCallback, useMemo, useRef, useState } from "react";

import type { ScanCameraStatus } from "../ScanCameraSurface";
import { useScanCapture } from "../../hooks/useScanCapture";
import { loadScanMap } from "../../lib/scan/loadScanMap";
import type { CardScanMap } from "../../lib/scan/resolveScanCandidates";
import type { Candidate, IdentifyResult, RgbImage } from "../../lib/scan/types";
import type { CardPrices, CardPrintingPrice } from "../../lib/trade/loadCardPrices";
import type { TradeSideId } from "../../lib/trade/pricing";
import type { CardMetadataItem } from "../../types";

/** DEC-050 fallback: scanning is optional, manual search stays the full input path. */
export const SCAN_CAMERA_UNAVAILABLE_COPY =
  "Camera unavailable — check camera access. You can still add cards with search.";

export const SCAN_UNPRICED_CARD_COPY =
  "That card has no price in the current snapshot, so it was not added.";

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
};

/**
 * The scan engine votes on oracle identity (DEC-053) against `CardMetadataItem`
 * records. The balancer's card universe is the price artifact, so the metadata
 * list is synthesized from it: one row per oracle id. Only the identity fields
 * are meaningful here — the balancer never sends these anywhere, and rules text
 * plays no part in pricing.
 */
export function buildScanMetadataFromPrices(prices: CardPrices): CardMetadataItem[] {
  const metadata: CardMetadataItem[] = [];

  for (const [oracleId, printingIds] of Object.entries(prices.byOracleId)) {
    const firstPrinting = printingIds
      .map((printingId) => prices.printings[printingId] ?? null)
      .find((printing) => printing !== null);

    if (!firstPrinting) continue;

    metadata.push({
      cardId: oracleId,
      name: firstPrinting.name,
      imageUrl: firstPrinting.imageUrl,
      colors: []
    });
  }

  return metadata;
}

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
 * Scan input for trade entries (REQ-065 scan path, FLOW-009). Wraps the shared
 * capture hook so a confident lock adds an entry to the scanning side, defaulting
 * to the scanned printing and falling back to another printing of the same oracle
 * card when the scanned printing is absent from the price artifact. Printing
 * choice stays a pricing/display concern — nothing here reaches a request payload.
 */
export function useTradeScan({
  prices,
  onAddPrinting
}: {
  prices: CardPrices | null;
  onAddPrinting: (sideId: TradeSideId, printing: CardPrintingPrice) => void;
}): TradeScan {
  const [activeSideId, setActiveSideId] = useState<TradeSideId | null>(null);
  const [notice, setNotice] = useState<TradeScanNotice | null>(null);
  const activeSideIdRef = useRef<TradeSideId | null>(null);
  const scanMapRef = useRef<CardScanMap | null>(null);
  const pendingOracleIdRef = useRef<string | null>(null);
  const pricesRef = useRef(prices);
  pricesRef.current = prices;
  const onAddPrintingRef = useRef(onAddPrinting);
  onAddPrintingRef.current = onAddPrinting;

  const cardMetadata = useMemo(
    () => (prices ? buildScanMetadataFromPrices(prices) : []),
    [prices]
  );

  const scanCapture = useScanCapture({
    cardMetadata,
    // Runs synchronously inside `scanCapture.identify` on a confident lock. The
    // oracle id is stashed here and paired with the same frame's ranked printing
    // candidates once identify resolves.
    onScanCandidateSelected: (card) => {
      pendingOracleIdRef.current = card.cardId;
      return { added: true };
    }
  });

  const { closeScan: closeCapture, identify: captureIdentify, openScan: openCapture } = scanCapture;
  const captureSetCameraStatus = scanCapture.setCameraStatus;

  const addScannedEntry = useCallback((oracleId: string, candidates: Candidate[]): void => {
    const sideId = activeSideIdRef.current;
    const currentPrices = pricesRef.current;
    if (!sideId || !currentPrices) return;

    const scannedPrintingId = scannedPrintingIdForOracle(candidates, scanMapRef.current, oracleId);
    const scannedPrinting = scannedPrintingId
      ? currentPrices.getPrintingPrice(scannedPrintingId)
      : null;
    // DEC-070 default; when the scanned printing is missing from the artifact,
    // fall back to another printing of the same card (still changeable, and the
    // $0 + caution treatment applies when that printing has no price either).
    const printing = scannedPrinting ?? currentPrices.listPrintingsForOracle(oracleId)[0] ?? null;

    if (!printing) {
      setNotice({ sideId, message: SCAN_UNPRICED_CARD_COPY });
      return;
    }

    onAddPrintingRef.current(sideId, printing);
  }, []);

  const identify = useCallback(
    async (image: RgbImage): Promise<IdentifyResult> => {
      const result = await captureIdentify(image);
      const lockedOracleId = pendingOracleIdRef.current;

      if (lockedOracleId) {
        pendingOracleIdRef.current = null;
        addScannedEntry(lockedOracleId, result.candidates);
      }

      return result;
    },
    [addScannedEntry, captureIdentify]
  );

  const closeScan = useCallback((): void => {
    activeSideIdRef.current = null;
    pendingOracleIdRef.current = null;
    setActiveSideId(null);
    closeCapture();
  }, [closeCapture]);

  const openScan = useCallback(
    (sideId: TradeSideId): void => {
      activeSideIdRef.current = sideId;
      pendingOracleIdRef.current = null;
      setActiveSideId(sideId);
      setNotice(null);
      void openCapture();
      // Same lazy, cached artifact the capture hook loads; needed here to map the
      // scanned printing id back to a priced printing.
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
    scanDebug: scanCapture.scanDebug
  };
}
