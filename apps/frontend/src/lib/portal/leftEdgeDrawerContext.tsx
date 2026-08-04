import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

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

/**
 * Tracks which of the left-edge drawers (the feature-portal Menu, the conversation
 * history drawer) is open, so opening one closes the other. Each drawer keeps its
 * own local open/close state as before and only consults this to stay mutually
 * exclusive.
 */
export function LeftEdgeDrawerProvider({ children }: { children: ReactNode }): JSX.Element {
  const [activeDrawer, setActiveDrawer] = useState<LeftEdgeDrawerId | null>(null);

  const openDrawer = useCallback((id: LeftEdgeDrawerId) => {
    setActiveDrawer(id);
  }, []);

  const closeDrawer = useCallback((id: LeftEdgeDrawerId) => {
    setActiveDrawer((current) => (current === id ? null : current));
  }, []);

  const value = useMemo<LeftEdgeDrawerContextValue>(
    () => ({ activeDrawer, openDrawer, closeDrawer }),
    [activeDrawer, openDrawer, closeDrawer]
  );

  return <LeftEdgeDrawerContext.Provider value={value}>{children}</LeftEdgeDrawerContext.Provider>;
}

export function useLeftEdgeDrawer(): LeftEdgeDrawerContextValue {
  return useContext(LeftEdgeDrawerContext);
}
