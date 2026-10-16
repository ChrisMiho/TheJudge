import { createContext, useContext } from "react";

export type LeftEdgeDrawerId = "menu" | "history";

export interface LeftEdgeDrawerContextValue {
  activeDrawer: LeftEdgeDrawerId | null;
  openDrawer: (id: LeftEdgeDrawerId) => void;
  closeDrawer: (id: LeftEdgeDrawerId) => void;
}

/** No-op default so a drawer can render and be tested in isolation, outside the provider, without crashing. */
const noopLeftEdgeDrawerContext: LeftEdgeDrawerContextValue = {
  activeDrawer: null,
  openDrawer: () => undefined,
  closeDrawer: () => undefined
};

export const LeftEdgeDrawerContext = createContext<LeftEdgeDrawerContextValue>(noopLeftEdgeDrawerContext);

export function useLeftEdgeDrawer(): LeftEdgeDrawerContextValue {
  return useContext(LeftEdgeDrawerContext);
}
