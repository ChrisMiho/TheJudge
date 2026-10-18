import { ScanCameraSurface } from "./ScanCameraSurface";
import { ScanReviewBubble } from "./ScanReviewBubble";
import type { HeldScanEntry, ScanAddConfirmation, ScanConvergence, ScanDebugMetrics } from "../hooks/useScanCapture";
import type { AcquisitionFrameDiagnostic } from "../lib/scan/acquisitionDiagnostics";
import type { IdentifyResult, RgbImage, ScanCameraStatus } from "../lib/scan/types";

type ScanPanelProps = {
  /** The host's scanner title, shown at the left of the row above the camera; none on In-Depth (REQ-056). */
  title?: string;
  /** Where held cards land, for the review list ("your question", "Side A", ...). */
  destinationLabel: string;
  isLoading: boolean;
  error: string | null;
  convergence: ScanConvergence;
  addConfirmation: ScanAddConfirmation | null;
  scanDebug: ScanDebugMetrics | null;
  heldEntries: HeldScanEntry[];
  onRemoveHeld: (id: number) => void;
  /** The "Exit scan" box; closing commits the holding list to the destination. */
  onExit: () => void;
  identify: (image: RgbImage) => IdentifyResult | Promise<IdentifyResult>;
  onCameraStatusChange: (status: ScanCameraStatus) => void;
  onAcquisitionDiagnostic?: (diagnostic: AcquisitionFrameDiagnostic) => void;
};

/**
 * REQ-214: the one scanner panel all three hosts render (In-Depth, Quick Question,
 * Trade Balancer). A slim row sits directly above the camera frame: the host's
 * title at its left where it has one, and the 44px square "Exit scan" box at its
 * right — never inside or over the camera frame. Below it: the loading line, the
 * camera surface with the holding-list review bubble, and the scan-data failure
 * line (REQ-249, announced with `role="alert"`).
 */
export function ScanPanel({
  title,
  destinationLabel,
  isLoading,
  error,
  convergence,
  addConfirmation,
  scanDebug,
  heldEntries,
  onRemoveHeld,
  onExit,
  identify,
  onCameraStatusChange,
  onAcquisitionDiagnostic
}: ScanPanelProps) {
  return (
    <div className="scan-panel">
      <div className="scan-head" data-has-title={title ? "true" : "false"}>
        {title && <p className="scan-title">{title}</p>}
        <button type="button" aria-label="Exit scan" onClick={onExit} className="scan-exit">
          <span aria-hidden="true">✕</span>
        </button>
      </div>
      {isLoading ? (
        <p className="tb-note">Loading scan data...</p>
      ) : (
        <div className="relative">
          <ScanCameraSurface
            onCapture={() => undefined}
            identify={identify}
            onStatusChange={onCameraStatusChange}
            onAcquisitionDiagnostic={onAcquisitionDiagnostic}
            convergence={convergence}
            confirmation={addConfirmation}
            debug={scanDebug}
            autoScanFps={3}
          />
          <ScanReviewBubble
            entries={heldEntries.map((entry) => ({
              id: entry.id,
              card: { cardId: entry.card.cardId, name: entry.card.name, imageUrl: entry.scanImageUrl },
              colors: entry.card.colors
            }))}
            onRemove={onRemoveHeld}
            destinationLabel={destinationLabel}
          />
        </div>
      )}
      {error && (
        <p role="alert" className="motion-error idq-error">
          {error}
        </p>
      )}
    </div>
  );
}
