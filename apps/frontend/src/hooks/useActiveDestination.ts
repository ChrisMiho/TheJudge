import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { PORTAL_DESTINATIONS } from "../components/portal/destinationRegistry";
import { loadActiveDestinationId, saveActiveDestinationId } from "../lib/portal/activeDestinationPrefs";
import type { DestinationId } from "../lib/portal/types";

export interface UseActiveDestinationResult {
  activeDestinationId: DestinationId;
  setActiveDestinationId: (id: DestinationId) => void;
}

export function useActiveDestination(validIds: readonly DestinationId[]): UseActiveDestinationResult {
  const location = useLocation();
  const navigate = useNavigate();
  const matchedDestination = PORTAL_DESTINATIONS.find(
    (destination) => destination.path === location.pathname && validIds.includes(destination.id)
  );
  const fallbackDestinationId = loadActiveDestinationId(validIds);
  const activeDestinationId = matchedDestination?.id ?? fallbackDestinationId;
  const activeDestinationPath = PORTAL_DESTINATIONS.find(
    (destination) => destination.id === activeDestinationId
  )?.path;

  useEffect(() => {
    if (matchedDestination) {
      saveActiveDestinationId(matchedDestination.id);
      return;
    }

    if (location.pathname !== "/") {
      navigate("/", { replace: true });
      return;
    }

    if (activeDestinationPath) {
      navigate(activeDestinationPath, { replace: true });
    }
  }, [activeDestinationPath, location.pathname, matchedDestination, navigate]);

  function setActiveDestinationId(id: DestinationId): void {
    const nextDestination = PORTAL_DESTINATIONS.find(
      (destination) => destination.id === id && validIds.includes(destination.id)
    );
    if (nextDestination) navigate(nextDestination.path);
  }

  return { activeDestinationId, setActiveDestinationId };
}
