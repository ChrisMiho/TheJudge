import { MtgAssistantApp } from "./MtgAssistantApp";
import { QuickLookupApp } from "./quick-lookup/QuickLookupApp";
import { PlayerLifeTrackerApp } from "./life-tracker/PlayerLifeTrackerApp";
import { TradeBalancer } from "../trade/TradeBalancer";
import type { PortalDestination } from "../../lib/portal/types";

// Order is the menu's rendered order (DEC-104) *and* the source of the default active
// destination — `loadActiveDestinationId` falls back to the first id when nothing is
// stored for the session. Quick Question leads because it is the fastest path to an
// answer and the most common entry point; In-Depth Question follows.
export const PORTAL_DESTINATIONS: PortalDestination[] = [
  {
    kind: "destination",
    id: "quick-lookup",
    label: "Quick Question",
    render: (isActive) => <QuickLookupApp isActive={isActive} />
  },
  {
    kind: "destination",
    id: "mtg-assistant",
    label: "In-Depth Question",
    render: (isActive) => <MtgAssistantApp isActive={isActive} />
  },
  { kind: "destination", id: "player-life-tracker", label: "Life Tracker", render: () => <PlayerLifeTrackerApp /> },
  { kind: "destination", id: "trade-balancer", label: "Trade Balancer", render: () => <TradeBalancer /> }
];
