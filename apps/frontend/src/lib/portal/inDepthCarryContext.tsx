import { createContext, useContext } from "react";
import type { CardMetadataItem } from "../../types";

export interface InDepthCarryContextValue {
  /**
   * REQ-206: Ask a Question's "Add in-depth details" pill. Carries `cards` and the typed
   * `question` into In-depth details and switches the active destination to it — the one
   * live gesture that still reaches `mtg-assistant` now that the Menu carries no row of
   * its own for it. Implemented by `PortalShell` (`App.tsx`), which alone can see the
   * destination a quick-lookup visit was entered from, so it can also carry forward the
   * Life Tracker roster seed when that visit came directly from Life Tracker — narrowly
   * tied to this one explicit gesture, the same way the retired direct Menu transition was
   * (see `App.player-life-tracker-seed.test.tsx`'s negative tests).
   *
   * The no-op default lets Ask a Question render and be tested in isolation, outside
   * `PortalShell`, without crashing.
   */
  goToInDepthDetails: (cards: CardMetadataItem[], question: string) => void;
}

const noopInDepthCarryContext: InDepthCarryContextValue = {
  goToInDepthDetails: () => undefined
};

export const InDepthCarryContext = createContext<InDepthCarryContextValue>(noopInDepthCarryContext);

export function useInDepthCarry(): InDepthCarryContextValue {
  return useContext(InDepthCarryContext);
}
