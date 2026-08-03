import { PALETTES } from "../../lib/theme/palettes";

export interface ThemeSectionProps {
  paletteId: string;
  onSelect: (id: string) => void;
}

export function ThemeSection({ paletteId, onSelect }: ThemeSectionProps): JSX.Element {
  return (
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
  );
}
