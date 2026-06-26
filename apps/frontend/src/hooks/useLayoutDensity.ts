import { useEffect, useState } from "react";
import { applyLayoutDensity } from "../lib/theme/applyLayoutDensity";
import { DEFAULT_LAYOUT_DENSITY, type LayoutDensity } from "../lib/theme/layoutDensity";
import { loadLayoutDensity, saveLayoutDensity } from "../lib/theme/layoutDensityPrefs";

export interface UseLayoutDensityResult {
  density: LayoutDensity;
  setDensity: (density: LayoutDensity) => void;
}

export function useLayoutDensity(): UseLayoutDensityResult {
  const [density, setDensityState] = useState<LayoutDensity>(() => loadLayoutDensity());

  useEffect(() => {
    applyLayoutDensity(density);
    // Apply-on-mount only restores document-root attribute; it must never read
    // or mutate flow/scan/conversation state, so this intentionally runs once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setDensity(next: LayoutDensity): void {
    applyLayoutDensity(next);
    saveLayoutDensity(next);
    setDensityState(next);
  }

  return { density, setDensity };
}

export { DEFAULT_LAYOUT_DENSITY };
