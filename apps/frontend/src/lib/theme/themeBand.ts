import type { CSSProperties } from "react";
import { PALETTES, type Palette } from "./palettes";

function channelsToHex(channels: string): string {
  return `#${channels
    .split(" ")
    .map((part) => Number(part).toString(16).padStart(2, "0"))
    .join("")}`;
}

/**
 * The per-cell colours the Theme band's `.theme-orb` reads (`--orb` the
 * colour's fill, `--orb-soft` its light), taken from the built-in profile —
 * the mockup keeps Colorless's cell grey even while a custom colour is worn.
 */
export function themeOrbStyle(palette: Palette): CSSProperties {
  const builtIn = PALETTES.find((candidate) => candidate.id === palette.id) ?? palette;
  return {
    "--orb": channelsToHex(builtIn.accent),
    "--orb-soft": channelsToHex(builtIn.accentSoft)
  } as CSSProperties;
}
