import { MtgAssistantApp } from "./MtgAssistantApp";
import { QuickLookupApp } from "./quick-lookup/QuickLookupApp";
import { PlayerLifeTrackerApp } from "./life-tracker/PlayerLifeTrackerApp";
import { TradeBalancer } from "../trade/TradeBalancer";
import type { PortalDestination } from "../../lib/portal/types";

export const PORTAL_DESTINATIONS: PortalDestination[] = [
  {
    kind: "destination",
    id: "mtg-assistant",
    label: "In-Depth Question",
    render: (isActive) => <MtgAssistantApp isActive={isActive} />
  },
  {
    kind: "destination",
    id: "quick-lookup",
    label: "Quick Question",
    render: (isActive) => <QuickLookupApp isActive={isActive} />
  },
  { kind: "destination", id: "player-life-tracker", label: "Life Tracker", render: () => <PlayerLifeTrackerApp /> },
  { kind: "destination", id: "trade-balancer", label: "Trade Balancer", render: () => <TradeBalancer /> }
];
