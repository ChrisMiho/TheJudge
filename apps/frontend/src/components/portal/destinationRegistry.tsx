import { MtgAssistantApp } from "./MtgAssistantApp";
import { QuickLookupApp } from "./quick-lookup/QuickLookupApp";
import { TradeBalancerPlaceholder } from "./TradeBalancerPlaceholder";
import type { PortalDestination } from "../../lib/portal/types";

export const PORTAL_DESTINATIONS: PortalDestination[] = [
  { id: "mtg-assistant", label: "MTG Assistant", render: () => <MtgAssistantApp /> },
  { id: "quick-lookup", label: "Quick Lookup", render: () => <QuickLookupApp /> },
  // card-trade-balancer swaps this render for the real <TradeBalancer /> view.
  { id: "trade-balancer", label: "Trade", render: () => <TradeBalancerPlaceholder /> }
];
