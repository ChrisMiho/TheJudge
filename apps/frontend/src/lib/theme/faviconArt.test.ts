import { describe, expect, it } from "vitest";

import { buildFaviconHref } from "./faviconArt";
import { MOTIF_SYMBOLS } from "./motifSymbols";
import { PALETTES } from "./palettes";

const PREFIX = "data:image/svg+xml,";

function decode(href: string): string {
  return decodeURIComponent(href.slice(PREFIX.length));
}

describe("Frontend - Theme", () => {
  describe("buildFaviconHref (REQ-219)", () => {
    it.each(Object.keys(MOTIF_SYMBOLS) as (keyof typeof MOTIF_SYMBOLS)[])("draws the %s motif in the accent with no currentColor", (motif) => {
      const href = buildFaviconHref(motif, "#123abc");
      const svg = decode(href);
      expect(href.startsWith(PREFIX)).toBe(true);
      expect(svg).toContain(MOTIF_SYMBOLS[motif].split("currentColor").join("#123abc"));
      expect(svg).toContain("#123abc");
      expect(svg).not.toContain("currentColor");
      expect(svg).toContain('viewBox="0 0 100 100"');
    });

    it("is local-only: no http URL beyond the SVG namespace", () => {
      for (const palette of PALETTES) {
        const svg = decode(buildFaviconHref(palette.motif, "#123abc"));
        expect(svg.replace("http://www.w3.org/2000/svg", "")).not.toMatch(/https?:/);
      }
    });
  });
});
