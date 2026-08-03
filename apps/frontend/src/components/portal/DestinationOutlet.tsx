import { useEffect, useState } from "react";
import type { DestinationId, PortalDestination } from "../../lib/portal/types";

export interface DestinationOutletProps {
  destinations: PortalDestination[];
  activeDestinationId: DestinationId;
}

export function DestinationOutlet({ destinations, activeDestinationId }: DestinationOutletProps): JSX.Element {
  const [mountedDestinationIds, setMountedDestinationIds] = useState<DestinationId[]>([activeDestinationId]);

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
            {destination.render(destination.id === activeDestinationId)}
          </div>
        ))}
    </>
  );
}
