import { createContext, useContext } from "react";

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
export const BrandTapContext = createContext<BrandTaps | null>(null);

export function useBrandTaps(): BrandTaps | null {
  return useContext(BrandTapContext);
}
