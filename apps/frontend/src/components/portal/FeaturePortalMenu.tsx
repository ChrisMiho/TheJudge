import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { PortalSlotContext } from "../../lib/portal/slotContext";
import { isPortalActionEntry, type DestinationId, type PortalEntry } from "../../lib/portal/types";
import { ThemeSection } from "./ThemeSection";

export interface FeaturePortalMenuProps {
  /** Destination and action entries, rendered identically in array order (DEC-104). */
  entries: PortalEntry[];
  activeDestinationId: DestinationId;
  onSelect: (id: DestinationId) => void;
  paletteId: string;
  onPaletteSelect: (id: string) => void;
  colorlessCustomHex: string | undefined;
  onColorlessCustomChange: (hex: string) => void;
  onColorlessReset: () => void;
  /**
   * Rendered as this component's own children. When the active destination renders a
   * <PortalSlot />, the button portals into it (inline with that destination's own header,
   * no fixed-position clearance needed). When no slot is registered — a destination with no
   * header at all — this falls back to the fixed floating tab plus the clearance it needs,
   * so navigation is never lost.
   */
  children: ReactNode;
}

export function FeaturePortalMenu({
  entries,
  activeDestinationId,
  onSelect,
  paletteId,
  onPaletteSelect,
  colorlessCustomHex,
  onColorlessCustomChange,
  onColorlessReset,
  children
}: FeaturePortalMenuProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [slotNodes, setSlotNodes] = useState<HTMLDivElement[]>([]);
  const [visibleSlotNode, setVisibleSlotNode] = useState<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const registerSlot = useCallback((node: HTMLDivElement) => {
    setSlotNodes((current) => (current.includes(node) ? current : [...current, node]));
  }, []);

  const unregisterSlot = useCallback((node: HTMLDivElement) => {
    setSlotNodes((current) => current.filter((registered) => registered !== node));
  }, []);

  // DestinationOutlet keeps inactive destinations mounted and hides them via the `hidden`
  // attribute (for in-session state preservation) instead of unmounting — so a destination's
  // <PortalSlot /> registers once on mount and stays registered while hidden, and more than one
  // slot can be registered at a time once multiple destinations have been visited. Re-derive
  // which registered slot is actually visible whenever the registered set or the active
  // destination changes, after the DOM has committed.
  useEffect(() => {
    setVisibleSlotNode(slotNodes.find((node) => node.closest("[hidden]") === null) ?? null);
  }, [slotNodes, activeDestinationId]);

  const effectiveSlotNode = visibleSlotNode;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent): void {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  function handleSelect(entry: PortalEntry): void {
    // Action entries run their own handler and never switch the active destination.
    if (isPortalActionEntry(entry)) {
      entry.onSelect();
    } else {
      onSelect(entry.id);
    }
    setIsOpen(false);
  }

  function handlePaletteSelect(id: string): void {
    onPaletteSelect(id);
  }

  const trigger = (
    <div
      ref={containerRef}
      className={effectiveSlotNode ? "portal-slot-tab relative" : "fixed left-0 top-0 z-30"}
    >
      <button
        type="button"
        aria-label="Switch feature"
        aria-haspopup="true"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
        className="portal-menu-rail motion-focus border-none font-medium"
      >
        <span aria-hidden="true" className="portal-menu-rail-icon">☰</span>
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label="Feature destinations"
          className="portal-menu-drawer portal-menu-drawer-motion bg-zinc-900/95"
        >
          <div className="portal-menu-drawer-inner flex flex-col gap-1">
            {entries.map((entry) => {
              const isActive = !isPortalActionEntry(entry) && entry.id === activeDestinationId;
              return (
                <button
                  key={entry.id}
                  type="button"
                  role="menuitem"
                  aria-label={entry.label}
                  aria-current={isActive ? "true" : undefined}
                  onClick={() => handleSelect(entry)}
                  className={`flex min-h-[2.75rem] items-center gap-3 rounded-xl border px-3 py-2 text-left text-sm font-medium transition ${
                    isActive
                      ? "border-accent-soft/70 bg-zinc-800 text-zinc-100"
                      : "border-zinc-700/80 bg-zinc-900/60 text-zinc-200 hover:bg-zinc-800/70"
                  }`}
                >
                  <span>{entry.label}</span>
                  {isActive && <span aria-hidden="true" className="ml-auto text-accent-soft">✓</span>}
                </button>
              );
            })}
            <div className="mt-1 flex flex-col gap-1 border-t border-zinc-700/60 pt-2">
              <p className="px-1 pb-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-zinc-400">Theme</p>
              <ThemeSection
                paletteId={paletteId}
                onSelect={handlePaletteSelect}
                colorlessCustomHex={colorlessCustomHex}
                onColorlessCustomChange={onColorlessCustomChange}
                onColorlessReset={onColorlessReset}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <PortalSlotContext.Provider value={{ registerSlot, unregisterSlot }}>
      {effectiveSlotNode ? createPortal(trigger, effectiveSlotNode) : trigger}
      <div className={effectiveSlotNode ? undefined : "pt-44"}>{children}</div>
    </PortalSlotContext.Provider>
  );
}
