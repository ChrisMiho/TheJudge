import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { COLORLESS_PALETTE, PALETTES } from "../../lib/theme/palettes";
import type { Palette } from "../../lib/theme/palettes";

export interface ThemeSectionProps {
  paletteId: string;
  onSelect: (id: string) => void;
  colorlessCustomHex: string | undefined;
  onColorlessCustomChange: (hex: string) => void;
  onColorlessReset: () => void;
}

/** REQ-201 motif glyph, one simple original shape per profile — never a Wizards of the
    Coast mana symbol or icon font. Purely decorative inside a themed cell: the cell's own
    `aria-label`/`title` (REQ-131) carries the colour name, not this shape. */
/** Exported so `BrandMark` (slice L) can draw the same shape inside its orb —
 * one glyph source for both, no duplicated SVG paths. */
export function MotifGlyph({ motif }: { motif: Palette["motif"] }): JSX.Element {
  const common = {
    viewBox: "0 0 24 24",
    "aria-hidden": "true" as const,
    className: "h-4 w-4"
  };
  switch (motif) {
    case "beams":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
          <circle cx="12" cy="12" r="3.5" />
          <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" />
        </svg>
      );
    case "runes":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round">
          <path d="M12 3l7 9-7 9-7-9 7-9z" />
        </svg>
      );
    case "fog":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
          <path d="M4 10h16M3 14h14M5 18h12" />
        </svg>
      );
    case "embers":
      return (
        <svg {...common} fill="currentColor">
          <path d="M12 2c2 4-2 5-2 8a3 3 0 1 0 6 0c0-1-1-2-1-2 2 1 3 3 3 5a6 6 0 1 1-12 0c0-5 4-7 6-11z" />
        </svg>
      );
    case "leaves":
      return (
        <svg {...common} fill="currentColor">
          <path d="M20 4c-9 0-16 6-16 15 9 0 16-6 16-15zM5 19c3-5 7-8 13-11" stroke="currentColor" strokeWidth={1} fill="none" />
        </svg>
      );
    case "geometry":
    default:
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth={1.75}>
          <circle cx="8" cy="9" r="3" />
          <path d="M14 18l5-9h-5z" />
        </svg>
      );
  }
}

const CELL_MIN_WIDTH_PX = 40;
/** Look-matching pass (slice L): cells are 46px tall (`shell.css:614-657`'s
 * `.theme-orb`), slightly taller than they are wide — only the height changed,
 * the 40px width/touch-target floor (REQ-131/REQ-207) is unchanged. */
const CELL_HEIGHT_PX = 46;

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
      aria-label={`Theme: ${palette.name}`}
      aria-pressed={isActive}
      title={palette.name}
      onClick={() => onSelect(palette.id)}
      // REQ-131/REQ-207: a square-ish band cell, never narrower than 40px, not a round
      // orb — an unchosen cell is a faint wash of its colour with its symbol in the
      // colour's light; the chosen cell is filled with the colour's light, the symbol
      // dark on it, with a small glow. No colour name or blurb renders in the cell
      // itself — the hover title and this aria-label are what name the colour.
      className={`motion-hover motion-press motion-focus flex shrink-0 snap-start items-center justify-center rounded-lg border transition ${
        isActive
          ? "border-transparent shadow-[0_0_0.5rem_rgb(var(--accent-soft)/0.6)]"
          : "border-white/10"
      }`}
      style={{
        minWidth: CELL_MIN_WIDTH_PX,
        width: CELL_MIN_WIDTH_PX,
        height: CELL_HEIGHT_PX,
        backgroundColor: isActive ? palette.swatch : `${palette.swatch}26` /* ~15% wash */,
        color: isActive ? undefined : palette.swatch
      }}
    >
      {isActive ? (
        <span aria-hidden="true" className="text-sm font-black text-accent-contrast">
          ✓
        </span>
      ) : (
        <span aria-hidden="true" className="grid place-items-center">
          <MotifGlyph motif={palette.motif} />
        </span>
      )}
    </button>
  );
}

export function ThemeSection({
  paletteId,
  onSelect,
  colorlessCustomHex,
  onColorlessCustomChange,
  onColorlessReset
}: ThemeSectionProps): JSX.Element {
  const isColorlessActive = paletteId === "colorless";
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  function updateArrowState(): void {
    const track = trackRef.current;
    if (!track) return;
    setCanScrollLeft(track.scrollLeft > 1);
    setCanScrollRight(track.scrollLeft + track.clientWidth < track.scrollWidth - 1);
  }

  // REQ-131/REQ-207: "from 320px up all six fit and no arrow shows" — arrows appear only
  // when the band's six 40px cells (plus gaps) no longer fit its own width, never on a
  // fixed breakpoint. Re-checked on mount, on resize, and whenever the track's own content
  // width could change (ResizeObserver covers a font/zoom change without a window resize).
  useLayoutEffect(() => {
    updateArrowState();
    const track = trackRef.current;
    if (!track || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(updateArrowState);
    observer.observe(track);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // The chosen cell scrolls into view whenever the active palette changes (REQ-207:
    // "the chosen cell is scrolled into view when the Menu opens" — this also covers a
    // palette switch made while the band is already visible).
    const track = trackRef.current;
    if (!track) return;
    const activeCell = track.querySelector<HTMLElement>('[aria-pressed="true"]');
    activeCell?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [paletteId]);

  function nudge(direction: -1 | 1): void {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * CELL_MIN_WIDTH_PX * 2, behavior: "smooth" });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Scroll Theme band left"
          onClick={() => nudge(-1)}
          hidden={!canScrollLeft}
          // Look-matching pass (slice L, review 1 fix — finding 2): the `hidden`
          // attribute alone does not hide this element — Tailwind's `grid`
          // utility (an author rule) sits later in the generated stylesheet
          // than preflight's `[hidden] { display: none }` at the same
          // specificity, so it wins and the arrow stayed painted (and sized)
          // even when there was nothing to scroll, stealing width from the
          // track and causing a real overflow (the clipped sixth cell the
          // reviewer saw). The inline `style` always wins over any class, so
          // it hides the box for real while the `hidden` attribute stays for
          // the existing "stays mounted, just inert" test contract.
          style={{ display: canScrollLeft ? "grid" : "none" }}
          className="motion-focus grid h-6 w-5 shrink-0 place-items-center text-zinc-400 hover:text-zinc-200"
        >
          <span aria-hidden="true">‹</span>
        </button>
        <div
          ref={trackRef}
          role="group"
          aria-label="Theme palettes"
          onScroll={updateArrowState}
          // Look-matching pass (slice L): the mockup's pill container
          // (`theme-band-track`, shell.css:571-592's `.theme-orbs`) — the
          // scroll/snap mechanics are unchanged; review 1 fix (finding 2)
          // tightens the gap from 4px to the mockup's 2px
          // (`shell.css:571-592`'s `.theme-orbs` gap) now that the arrows
          // above/below genuinely stop taking space when hidden, so all six
          // cells fit the 320px tray with room to spare.
          className="theme-band-track flex flex-1 snap-x gap-[2px] overflow-x-auto scroll-smooth"
        >
          {PALETTES.map((palette) => (
            <ThemeBandCell
              key={palette.id}
              palette={palette}
              isActive={palette.id === paletteId}
              onSelect={onSelect}
            />
          ))}
        </div>
        <button
          type="button"
          aria-label="Scroll Theme band right"
          onClick={() => nudge(1)}
          hidden={!canScrollRight}
          style={{ display: canScrollRight ? "grid" : "none" }}
          className="motion-focus grid h-6 w-5 shrink-0 place-items-center text-zinc-400 hover:text-zinc-200"
        >
          <span aria-hidden="true">›</span>
        </button>
      </div>

      {isColorlessActive && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <input
            type="color"
            aria-label="Customize Colorless color"
            value={colorlessCustomHex ?? COLORLESS_PALETTE.swatch}
            onChange={(event) => onColorlessCustomChange(event.target.value)}
            className="motion-focus h-9 w-9 shrink-0 cursor-pointer rounded border border-zinc-700/80 bg-transparent p-0"
          />
          <button
            type="button"
            aria-label="Reset to gray"
            onClick={onColorlessReset}
            className="motion-hover motion-press motion-focus min-h-[2.75rem] rounded-lg border border-zinc-700/80 px-3 text-xs font-medium text-zinc-200 transition hover:bg-zinc-800/70"
          >
            Reset to gray
          </button>
        </div>
      )}
    </div>
  );
}
