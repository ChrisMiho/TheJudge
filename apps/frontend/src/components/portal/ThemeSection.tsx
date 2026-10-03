import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { MOTIF_SYMBOLS } from "../../lib/theme/motifSymbols";
import { COLORLESS_PALETTE, PALETTES } from "../../lib/theme/palettes";
import type { Palette } from "../../lib/theme/palettes";
import { themeOrbStyle } from "../../lib/theme/themeBand";

export interface ThemeSectionProps {
  paletteId: string;
  onSelect: (id: string) => void;
  colorlessCustomHex: string | undefined;
  onColorlessCustomChange: (hex: string) => void;
  onColorlessReset: () => void;
}

/**
 * REQ-201: the colour's own symbol (the mockup's `motifs.js` picks, kept in
 * `lib/theme/motifSymbols.ts`), drawn in `currentColor` in a 100x100 box.
 * Purely decorative inside a themed cell: the cell's own `aria-label`/`title`
 * (REQ-131) carries the colour name, not this shape.
 */
export function MotifGlyph({ motif, className = "motif-ico" }: { motif: Palette["motif"]; className?: string }): JSX.Element {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: MOTIF_SYMBOLS[motif] }}
    />
  );
}

const CELL_MIN_WIDTH_PX = 40;

function ThemeBandCell({
  palette,
  isActive,
  onSelect
}: {
  palette: Palette;
  isActive: boolean;
  onSelect: (id: string) => void;
}): JSX.Element {
  return (
    <button
      type="button"
      className="theme-orb"
      aria-label={`Theme: ${palette.name}`}
      aria-pressed={isActive}
      data-current={isActive}
      title={palette.name}
      onClick={() => onSelect(palette.id)}
      style={themeOrbStyle(palette)}
    >
      <span className="orb" aria-hidden="true">
        <MotifGlyph motif={palette.motif} />
      </span>
    </button>
  );
}

/**
 * REQ-131 / REQ-207: the Theme section — the mockup's `.theme-band`: one pill
 * cut into six cells, one per colour (the symbol in the colour's light; the
 * chosen cell filled with the light and glowing), arrows at each end only when
 * six full-size cells no longer fit the tray, and Colorless's colour well and
 * reset while Colorless is the current colour.
 */
export function ThemeSection({
  paletteId,
  onSelect,
  colorlessCustomHex,
  onColorlessCustomChange,
  onColorlessReset
}: ThemeSectionProps): JSX.Element {
  const isColorlessActive = paletteId === "colorless";
  const bandRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  function updateBandState(): void {
    const band = bandRef.current;
    const track = trackRef.current;
    if (!band || !track) return;
    // "would six floor-width cells fit the band without the arrows?" — measured
    // against the band, not the track, so showing the arrows cannot re-trigger itself.
    const need = PALETTES.length * CELL_MIN_WIDTH_PX + (PALETTES.length - 1) * 2 + 8;
    // An unmeasured band (no layout yet, as in jsdom) never shows the arrows.
    setOverflow(band.clientWidth > 0 && need > band.clientWidth + 1);
    setCanScrollLeft(track.scrollLeft > 1);
    setCanScrollRight(track.scrollLeft + track.clientWidth < track.scrollWidth - 1);
  }

  useLayoutEffect(() => {
    updateBandState();
    const band = bandRef.current;
    if (!band || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(updateBandState);
    observer.observe(band);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // The chosen cell scrolls into view whenever the active palette changes
    // (REQ-207: also covers a palette switch made while the band is visible).
    const track = trackRef.current;
    if (!track) return;
    const activeCell = track.querySelector<HTMLElement>('[aria-pressed="true"]');
    activeCell?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
  }, [paletteId]);

  function nudge(direction: -1 | 1): void {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy?.({ left: direction * (CELL_MIN_WIDTH_PX + 2) * 2, behavior: "smooth" });
  }

  return (
    <>
      <div ref={bandRef} className="theme-band" data-overflow={overflow}>
        <button
          type="button"
          className="theme-step"
          data-dir="-1"
          data-off={!canScrollLeft}
          aria-label="Scroll Theme band left"
          onClick={() => nudge(-1)}
        >
          ‹
        </button>
        <div ref={trackRef} className="theme-orbs" role="group" aria-label="Theme palettes" onScroll={updateBandState}>
          {PALETTES.map((palette) => (
            <ThemeBandCell key={palette.id} palette={palette} isActive={palette.id === paletteId} onSelect={onSelect} />
          ))}
        </div>
        <button
          type="button"
          className="theme-step"
          data-dir="1"
          data-off={!canScrollRight}
          aria-label="Scroll Theme band right"
          onClick={() => nudge(1)}
        >
          ›
        </button>
      </div>

      <div className="theme-custom" data-show={isColorlessActive}>
        {isColorlessActive && (
          <>
            <input
              type="color"
              aria-label="Customize Colorless color"
              value={colorlessCustomHex ?? COLORLESS_PALETTE.swatch}
              onChange={(event) => onColorlessCustomChange(event.target.value)}
            />
            <span>Colorless colour</span>
            <button type="button" className="btn" aria-label="Reset to gray" onClick={onColorlessReset}>
              Reset to gray
            </button>
          </>
        )}
      </div>
    </>
  );
}
