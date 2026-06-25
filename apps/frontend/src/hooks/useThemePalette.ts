import { useEffect, useState } from "react";
import { applyPalette } from "../lib/theme/applyPalette";
import { DEFAULT_PALETTE, getPaletteById, type Palette } from "../lib/theme/palettes";
import { loadThemePaletteId, saveThemePaletteId } from "../lib/theme/themePrefs";

export interface UseThemePaletteResult {
  palette: Palette;
  paletteId: string;
  setPalette: (id: string) => void;
}

export function useThemePalette(): UseThemePaletteResult {
  const [paletteId, setPaletteId] = useState(() => loadThemePaletteId());

  useEffect(() => {
    applyPalette(getPaletteById(paletteId) ?? DEFAULT_PALETTE);
    // Apply-on-mount only restores document-root styling; it must never read
    // or mutate flow/scan/conversation state, so this intentionally runs once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setPalette(id: string): void {
    const palette = getPaletteById(id) ?? DEFAULT_PALETTE;
    applyPalette(palette);
    saveThemePaletteId(palette.id);
    setPaletteId(palette.id);
  }

  return {
    palette: getPaletteById(paletteId) ?? DEFAULT_PALETTE,
    paletteId,
    setPalette
  };
}
