import { useEffect, useState } from "react";
import { applyPalette } from "../lib/theme/applyPalette";
import { DEFAULT_PALETTE, getPaletteById, resolveColorlessPalette, type Palette } from "../lib/theme/palettes";
import {
  loadColorlessCustomRgb,
  loadThemePaletteId,
  removeColorlessCustomRgb,
  saveColorlessCustomRgb,
  saveThemePaletteId
} from "../lib/theme/themePrefs";

export interface UseThemePaletteResult {
  palette: Palette;
  paletteId: string;
  colorlessCustomHex: string | undefined;
  setPalette: (id: string) => void;
  setColorlessCustom: (hex: string) => void;
  resetColorlessCustom: () => void;
}

function resolveEffectivePalette(id: string, colorlessCustomHex: string | undefined): Palette {
  const resolved = getPaletteById(id) ?? DEFAULT_PALETTE;
  return resolved.id === "colorless" ? resolveColorlessPalette(colorlessCustomHex) : resolved;
}

export function useThemePalette(): UseThemePaletteResult {
  const [paletteId, setPaletteId] = useState(() => loadThemePaletteId());
  const [colorlessCustomHex, setColorlessCustomHex] = useState<string | undefined>(() =>
    loadColorlessCustomRgb()
  );

  useEffect(() => {
    applyPalette(resolveEffectivePalette(paletteId, colorlessCustomHex));
    // Apply-on-mount only restores document-root styling; it must never read
    // or mutate flow/scan/conversation state, so this intentionally runs once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setPalette(id: string): void {
    const resolved = getPaletteById(id) ?? DEFAULT_PALETTE;
    applyPalette(resolveEffectivePalette(resolved.id, colorlessCustomHex));
    saveThemePaletteId(resolved.id);
    setPaletteId(resolved.id);
  }

  function setColorlessCustom(hex: string): void {
    saveColorlessCustomRgb(hex);
    setColorlessCustomHex(hex);
    applyPalette(resolveColorlessPalette(hex));
  }

  function resetColorlessCustom(): void {
    removeColorlessCustomRgb();
    setColorlessCustomHex(undefined);
    applyPalette(resolveColorlessPalette(undefined));
  }

  return {
    palette: resolveEffectivePalette(paletteId, colorlessCustomHex),
    paletteId,
    colorlessCustomHex,
    setPalette,
    setColorlessCustom,
    resetColorlessCustom
  };
}
