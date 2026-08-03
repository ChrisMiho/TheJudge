import { COLORLESS_PALETTE, PALETTES } from "../../lib/theme/palettes";
import type { Palette } from "../../lib/theme/palettes";

export interface ThemeSectionProps {
  paletteId: string;
  onSelect: (id: string) => void;
  colorlessCustomHex: string | undefined;
  onColorlessCustomChange: (hex: string) => void;
  onColorlessReset: () => void;
}

function PaletteSwatchButton({
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
      className="motion-hover motion-press motion-focus grid h-10 w-10 shrink-0 place-items-center justify-self-center rounded-full transition"
    >
      <span
        aria-hidden="true"
        className={`grid h-8 w-8 place-items-center rounded-full border text-sm font-black text-accent-contrast shadow-sm ${
          isActive ? "border-white ring-2 ring-accent-soft" : "border-white/40"
        }`}
        style={{ backgroundColor: palette.swatch }}
      >
        {isActive ? "✓" : ""}
      </span>
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
  const fixedPalettes = PALETTES.filter((palette) => palette.id !== "colorless");
  const isColorlessActive = paletteId === "colorless";

  return (
    <div className="flex flex-col gap-2">
      <div role="group" aria-label="Theme palettes" className="grid grid-cols-5 gap-0.5">
        {fixedPalettes.map((palette) => (
          <PaletteSwatchButton
            key={palette.id}
            palette={palette}
            isActive={palette.id === paletteId}
            onSelect={onSelect}
          />
        ))}
      </div>

      <div className="flex items-center gap-2 px-1">
        <PaletteSwatchButton
          palette={COLORLESS_PALETTE}
          isActive={isColorlessActive}
          onSelect={onSelect}
        />

        {isColorlessActive && (
          <>
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
              className="motion-hover motion-press motion-focus min-h-[2.75rem] flex-1 rounded-lg border border-zinc-700/80 px-3 text-xs font-medium text-zinc-200 transition hover:bg-zinc-800/70"
            >
              Reset to gray
            </button>
          </>
        )}
      </div>
    </div>
  );
}
