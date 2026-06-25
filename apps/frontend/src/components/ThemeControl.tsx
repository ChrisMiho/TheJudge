import { useState } from "react";
import { PALETTES } from "../lib/theme/palettes";

export interface ThemeControlProps {
  paletteId: string;
  onSelect: (id: string) => void;
}

export function ThemeControl({ paletteId, onSelect }: ThemeControlProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const activePalette = PALETTES.find((palette) => palette.id === paletteId) ?? PALETTES[0];

  function handleSelect(id: string): void {
    onSelect(id);
    setIsOpen(false);
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Theme"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
        className="flex h-11 w-11 items-center justify-center rounded-full border border-zinc-600 bg-zinc-800/80 transition hover:bg-zinc-700/80"
      >
        <span
          aria-hidden="true"
          className="h-5 w-5 rounded-full border border-white/40"
          style={{ backgroundColor: activePalette.swatch }}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 z-30 flex w-44 flex-col gap-1 rounded-2xl border border-zinc-700/80 bg-zinc-900/95 p-2 shadow-xl">
          {PALETTES.map((palette) => {
            const isActive = palette.id === paletteId;
            return (
              <button
                key={palette.id}
                type="button"
                aria-label={`Theme: ${palette.name}`}
                aria-pressed={isActive}
                onClick={() => handleSelect(palette.id)}
                className={`flex min-h-[2.75rem] items-center gap-3 rounded-xl border px-3 py-2 text-left text-sm font-medium transition ${
                  isActive
                    ? "border-accent-soft/70 bg-zinc-800 text-zinc-100"
                    : "border-zinc-700/80 bg-zinc-900/60 text-zinc-200 hover:bg-zinc-800/70"
                }`}
              >
                <span
                  aria-hidden="true"
                  className="h-5 w-5 shrink-0 rounded-full border border-white/40"
                  style={{ backgroundColor: palette.swatch }}
                />
                <span>{palette.name}</span>
                {isActive && <span className="ml-auto text-accent-soft">✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
