import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

/** REQ-203: ten taps on the brand title reveal the cat-wizard picture. */
export const BRAND_TAPS_TO_REVEAL = 10;

export type BrandTaps = {
  /** Counts one tap on the brand title. */
  onTap: () => void;
  /** True from the tenth tap until the page reloads. */
  revealed: boolean;
};

/**
 * `null` with no provider above: a header rendered on its own (a unit test, the
 * loading placeholder's plain heading) has no tap target and no picture.
 */
const BrandTapContext = createContext<BrandTaps | null>(null);

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

export function useBrandTaps(): BrandTaps | null {
  return useContext(BrandTapContext);
}
