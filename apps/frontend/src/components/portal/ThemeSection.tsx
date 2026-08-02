import type { LayoutDensity } from "../../lib/theme/layoutDensity";
import { PALETTES } from "../../lib/theme/palettes";

export interface ThemeSectionProps {
  paletteId: string;
  onSelect: (id: string) => void;
  density: LayoutDensity;
  onDensityChange: (density: LayoutDensity) => void;
}

const DENSITY_OPTIONS: Array<{ value: LayoutDensity; label: string }> = [
  { value: "chunky", label: "Desktop" },
  { value: "slim", label: "Mobile" }
];

export function ThemeSection({ paletteId, onSelect, density, onDensityChange }: ThemeSectionProps): JSX.Element {
  return (
    <>
      <div role="group" aria-label="Theme palettes" className="grid grid-cols-5 gap-0.5">
        {PALETTES.map((palette) => {
          const isActive = palette.id === paletteId;
          return (
            <button
              key={palette.id}
              type="button"
              aria-label={`Theme: ${palette.name}`}
              aria-pressed={isActive}
              title={palette.name}
              onClick={() => onSelect(palette.id)}
              className="motion-hover motion-press motion-focus grid h-10 w-10 place-items-center justify-self-center rounded-full transition"
            >
              <span
                aria-hidden="true"
                className={`grid h-8 w-8 place-items-center rounded-full border text-sm font-black text-white shadow-sm ${
                  isActive ? "border-white ring-2 ring-accent-soft" : "border-white/40"
                }`}
                style={{ backgroundColor: palette.swatch }}
              >
                {isActive ? "✓" : ""}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-1 border-t border-zinc-700/60 pt-2">
        <p className="px-1 pb-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-zinc-400">Layout</p>
        <div className="flex gap-1">
          {DENSITY_OPTIONS.map((option) => {
            const isActive = density === option.value;
            return (
              <button
                key={option.value}
                type="button"
                aria-label={`Layout: ${option.label}`}
                aria-pressed={isActive}
                onClick={() => onDensityChange(option.value)}
                className={`flex-1 min-h-[2.75rem] rounded-xl border px-2 py-2 text-sm font-medium transition ${
                  isActive
                    ? "border-accent-soft/70 bg-zinc-800 text-zinc-100"
                    : "border-zinc-700/80 bg-zinc-900/60 text-zinc-200 hover:bg-zinc-800/70"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
