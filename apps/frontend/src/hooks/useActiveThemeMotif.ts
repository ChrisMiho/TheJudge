import { useEffect, useState } from "react";
import { DEFAULT_PALETTE, type Palette } from "../lib/theme/palettes";

function readMotif(): Palette["motif"] {
  const value = document.documentElement.dataset.themeMotif;
  return (value as Palette["motif"] | undefined) ?? DEFAULT_PALETTE.motif;
}

/**
 * Reads the active profile's REQ-201 motif id from `document.documentElement`'s
 * `data-theme-motif` attribute (set by `applyPalette.ts`) and stays in sync
 * with it via a `MutationObserver`, so every `PageShell`'s `AmbientScene`
 * (REQ-207) re-renders with the new element art the instant the Theme band
 * changes it — with no prop threading from `PortalShell` (where
 * `useThemePalette` lives) through every destination down to its `PageShell`.
 * Mirrors `applyPalette.ts`'s own document-root side channel rather than
 * adding a second source of theme truth.
 */
export function useActiveThemeMotif(): Palette["motif"] {
  const [motif, setMotif] = useState<Palette["motif"]>(() => readMotif());

  useEffect(() => {
    const observer = new MutationObserver(() => setMotif(readMotif()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme-motif"]
    });
    return () => observer.disconnect();
  }, []);

  return motif;
}
