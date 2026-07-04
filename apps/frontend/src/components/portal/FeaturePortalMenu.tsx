import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { PortalSlotContext } from "../../lib/portal/slotContext";
import type { DestinationId, PortalDestination } from "../../lib/portal/types";

export interface FeaturePortalMenuProps {
  destinations: PortalDestination[];
  activeDestinationId: DestinationId;
  onSelect: (id: DestinationId) => void;
  /**
   * Rendered as this component's own children. When the active destination renders a
   * <PortalSlot />, the button portals into it (inline with that destination's own header,
   * no fixed-position clearance needed). When no slot is registered — a destination with no
   * header at all — this falls back to the fixed floating tab plus the clearance it needs,
   * so navigation is never lost.
   */
  children: ReactNode;
}

export function FeaturePortalMenu({ destinations, activeDestinationId, onSelect, children }: FeaturePortalMenuProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [slotNode, setSlotNode] = useState<HTMLDivElement | null>(null);
  const [isSlotVisible, setIsSlotVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // DestinationOutlet keeps inactive destinations mounted and hides them via the `hidden`
  // attribute (for in-session state preservation) instead of unmounting — so a registered slot
  // can still exist in the DOM after its destination becomes inactive. Re-check visibility
  // whenever the slot changes or the active destination changes, after the DOM has committed.
  useEffect(() => {
    if (!slotNode) {
      setIsSlotVisible(false);
      return;
    }
    setIsSlotVisible(slotNode.closest("[hidden]") === null);
  }, [slotNode, activeDestinationId]);

  const effectiveSlotNode = isSlotVisible ? slotNode : null;

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

  function handleSelect(id: DestinationId): void {
    onSelect(id);
    setIsOpen(false);
  }

  const trigger = (
    <div
      ref={containerRef}
      className={effectiveSlotNode ? "portal-slot-tab relative" : "fixed left-1/2 top-0 z-30 -translate-x-1/2"}
    >
      <button
        type="button"
        aria-label="Switch feature"
        aria-haspopup="true"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
        className="motion-hover motion-press motion-focus flex h-11 items-center gap-2 rounded-b-2xl border border-t-0 border-accent/55 bg-zinc-900/95 px-4 text-sm font-medium text-zinc-100 transition hover:bg-zinc-800/90"
      >
        <span aria-hidden="true">☰</span>
        <span>Menu</span>
      </button>

      {isOpen && (
        <div className="absolute left-1/2 top-full z-20 w-56 -translate-x-1/2 pt-2">
          {/* Animation lives on this inner box, not the positioned wrapper above — motion-enter's
              keyframe sets `transform` directly, which would otherwise clobber -translate-x-1/2. */}
          <div
            role="menu"
            aria-label="Feature destinations"
            className="portal-menu-motion flex flex-col gap-1 rounded-2xl border border-zinc-700/80 bg-zinc-900/95 p-2 shadow-xl"
          >
            {destinations.map((destination) => {
              const isActive = destination.id === activeDestinationId;
              return (
                <button
                  key={destination.id}
                  type="button"
                  role="menuitem"
                  aria-label={destination.label}
                  aria-current={isActive ? "true" : undefined}
                  onClick={() => handleSelect(destination.id)}
                  className={`flex min-h-[2.75rem] items-center gap-3 rounded-xl border px-3 py-2 text-left text-sm font-medium transition ${
                    isActive
                      ? "border-accent-soft/70 bg-zinc-800 text-zinc-100"
                      : "border-zinc-700/80 bg-zinc-900/60 text-zinc-200 hover:bg-zinc-800/70"
                  }`}
                >
                  <span>{destination.label}</span>
                  {isActive && <span aria-hidden="true" className="ml-auto text-accent-soft">✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <PortalSlotContext.Provider value={{ slotNode, registerSlot: setSlotNode }}>
      {effectiveSlotNode ? createPortal(trigger, effectiveSlotNode) : trigger}
      <div className={effectiveSlotNode ? undefined : "pt-14"}>{children}</div>
    </PortalSlotContext.Provider>
  );
}
