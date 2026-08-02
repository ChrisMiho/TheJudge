import { useState } from "react";
import { loadActiveDestinationId, saveActiveDestinationId } from "../lib/portal/activeDestinationPrefs";
import type { DestinationId } from "../lib/portal/types";

export interface UseActiveDestinationResult {
  activeDestinationId: DestinationId;
  setActiveDestinationId: (id: DestinationId) => void;
}

export function useActiveDestination(validIds: readonly DestinationId[]): UseActiveDestinationResult {
  const [activeDestinationId, setActiveDestinationIdState] = useState<DestinationId>(() =>
    loadActiveDestinationId(validIds)
  );

  function setActiveDestinationId(id: DestinationId): void {
    saveActiveDestinationId(id);
    setActiveDestinationIdState(id);
  }

  return { activeDestinationId, setActiveDestinationId };
}
