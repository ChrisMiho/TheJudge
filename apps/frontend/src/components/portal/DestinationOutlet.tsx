import { Suspense, useEffect, useState } from "react";
import { PageShell } from "../PageShell";
import { StagedStepHeader } from "../StagedStepHeader";
import { scheduleBackgroundDownload } from "./destinationRegistry";
import type { DestinationId, PortalDestination } from "../../lib/portal/types";

export interface DestinationOutletProps {
  destinations: PortalDestination[];
  activeDestinationId: DestinationId;
}

function DestinationLoadFallback(): JSX.Element {
  return (
    <PageShell>
      <StagedStepHeader plainBrand />
      <div
        className="destination-load-fallback text-sm text-zinc-400"
        role="status"
        aria-label="Loading destination"
      >
        Loading…
      </div>
    </PageShell>
  );
}

/**
 * NFR-014: rendered inside the landing destination's Suspense boundary, so its effect
 * runs only once the landing destination has actually committed (a suspended landing
 * commits no siblings). It then schedules the background download — other tools' code,
 * then the shared card list — once per page load. It renders nothing and mounts nothing.
 */
function BackgroundDownloadStart({ landingDestinationId }: { landingDestinationId: DestinationId }): null {
  useEffect(() => {
    scheduleBackgroundDownload(landingDestinationId);
  }, [landingDestinationId]);
  return null;
}

export function DestinationOutlet({ destinations, activeDestinationId }: DestinationOutletProps): JSX.Element {
  const [mountedDestinationIds, setMountedDestinationIds] = useState<DestinationId[]>([activeDestinationId]);

  const [landingDestinationId] = useState<DestinationId>(activeDestinationId);

  useEffect(() => {
    setMountedDestinationIds((current) =>
      current.includes(activeDestinationId) ? current : [...current, activeDestinationId]
    );
  }, [activeDestinationId]);

  return (
    <>
      {destinations
        .filter((destination) => mountedDestinationIds.includes(destination.id))
        .map((destination) => (
          <div key={destination.id} hidden={destination.id !== activeDestinationId}>
            <Suspense fallback={<DestinationLoadFallback />}>
              {destination.render(destination.id === activeDestinationId)}
              {destination.id === landingDestinationId && <BackgroundDownloadStart landingDestinationId={landingDestinationId} />}
            </Suspense>
          </div>
        ))}
    </>
  );
}
