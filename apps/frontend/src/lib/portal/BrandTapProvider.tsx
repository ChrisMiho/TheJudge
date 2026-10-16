import { useCallback, useMemo, useState, type ReactNode } from "react";
import { BRAND_TAPS_TO_REVEAL, BrandTapContext, type BrandTaps } from "./brandTapContext";

/**
 * REQ-203: the one session-wide tap count, held above every destination so
 * switching screens keeps it. In memory only — no storage key — so a reload
 * clears it.
 */
export function BrandTapProvider({ children }: { children: ReactNode }): JSX.Element {
  const [count, setCount] = useState(0);
  const onTap = useCallback(() => setCount((current) => current + 1), []);
  const value = useMemo<BrandTaps>(
    () => ({ onTap, revealed: count >= BRAND_TAPS_TO_REVEAL }),
    [onTap, count]
  );
  return <BrandTapContext.Provider value={value}>{children}</BrandTapContext.Provider>;
}
