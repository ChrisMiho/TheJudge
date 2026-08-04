import { MtgAssistantApp } from "./MtgAssistantApp";
import { QuickLookupApp } from "./quick-lookup/QuickLookupApp";
import { PlayerLifeTrackerApp } from "./life-tracker/PlayerLifeTrackerApp";
import type { PortalDestination } from "../../lib/portal/types";

// Trade is intentionally not registered here yet — card-trade-balancer is still a
// coming-soon placeholder (see TradeBalancerPlaceholder.tsx), so it stays out of the
// menu until that feature is ready to ship. Re-add its entry then.
export const PORTAL_DESTINATIONS: PortalDestination[] = [
  {
    kind: "destination",
    id: "mtg-assistant",
    label: "In-Depth Question",
    render: (isActive) => <MtgAssistantApp isActive={isActive} />
  },
  { kind: "destination", id: "quick-lookup", label: "Quick Question", render: () => <QuickLookupApp /> },
  { kind: "destination", id: "player-life-tracker", label: "Life Tracker", render: () => <PlayerLifeTrackerApp /> }
];
