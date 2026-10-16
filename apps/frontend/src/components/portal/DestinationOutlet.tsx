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

export function DestinationOutlet({ destinations, activeDestinationId }: DestinationOutletProps): JSX.Element {
  const [mountedDestinationIds, setMountedDestinationIds] = useState<DestinationId[]>([activeDestinationId]);

  // NFR-014: once the landing destination has committed, download the other tools'
  // code and then the shared card list in the background. Once per page load; it
  // never mounts a destination.
  useEffect(() => {
    scheduleBackgroundDownload(activeDestinationId);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only the destination the page landed on matters; the scheduler runs once.
  }, []);

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
            </Suspense>
          </div>
        ))}
    </>
  );
}
