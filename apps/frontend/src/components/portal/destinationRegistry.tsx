import { MtgAssistantApp } from "./MtgAssistantApp";
import { TradeBalancerPlaceholder } from "./TradeBalancerPlaceholder";
import type { PortalDestination } from "../../lib/portal/types";

export const PORTAL_DESTINATIONS: PortalDestination[] = [
  { id: "mtg-assistant", label: "MTG Assistant", render: () => <MtgAssistantApp /> },
  // card-trade-balancer swaps this render for the real <TradeBalancer /> view.
  { id: "trade-balancer", label: "Trade", render: () => <TradeBalancerPlaceholder /> }
];
