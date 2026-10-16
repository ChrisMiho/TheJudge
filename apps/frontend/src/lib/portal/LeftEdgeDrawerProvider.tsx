import { useCallback, useMemo, useState, type ReactNode } from "react";
import {
  LeftEdgeDrawerContext,
  type LeftEdgeDrawerContextValue,
  type LeftEdgeDrawerId
} from "./leftEdgeDrawerContext";

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
