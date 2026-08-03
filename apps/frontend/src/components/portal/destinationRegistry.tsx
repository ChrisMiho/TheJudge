import { MtgAssistantApp } from "./MtgAssistantApp";
import { QuickLookupApp } from "./quick-lookup/QuickLookupApp";
import { PlayerLifeTrackerApp } from "./life-tracker/PlayerLifeTrackerApp";
import type { PortalDestination } from "../../lib/portal/types";

// Trade is intentionally not registered here yet — card-trade-balancer is still a
// coming-soon placeholder (see TradeBalancerPlaceholder.tsx), so it stays out of the
// menu until that feature is ready to ship. Re-add its entry then.
export const PORTAL_DESTINATIONS: PortalDestination[] = [
  { id: "mtg-assistant", label: "In-Depth Question", render: () => <MtgAssistantApp /> },
  { id: "quick-lookup", label: "Quick Question", render: () => <QuickLookupApp /> },
  { id: "player-life-tracker", label: "Life Tracker", render: () => <PlayerLifeTrackerApp /> }
];
