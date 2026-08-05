import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { BrandMark } from "../BrandMark";
import type { ConversationHistoryTriggerDescriptor } from "../ConversationWorkspace";
import { useLeftEdgeDrawer } from "../../lib/portal/leftEdgeDrawerContext";
import { PortalSlotContext } from "../../lib/portal/slotContext";
import { isPortalActionEntry, type DestinationId, type PortalEntry } from "../../lib/portal/types";
import { ThemeSection } from "./ThemeSection";

type SlotEntry = {
  node: HTMLDivElement;
  getHistoryTrigger: () => ConversationHistoryTriggerDescriptor | undefined;
};

/** Three-line hamburger, matching History's stroke weight/style (DEC-126) — replaces the
    previous ☰ text glyph + scaleX stretch hack. */
function MenuIcon(): JSX.Element {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="portal-menu-rail-icon"
    >
      <line x1="4" y1="7" x2="20" y2="7" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="17" x2="20" y2="17" />
    </svg>
  );
}

function HistoryIcon(): JSX.Element {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="portal-menu-rail-icon"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}

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
  const [slotEntries, setSlotEntries] = useState<SlotEntry[]>([]);
  const [visibleSlotEntry, setVisibleSlotEntry] = useState<SlotEntry | null>(null);
  const [shellBoundsEntries, setShellBoundsEntries] = useState<HTMLDivElement[]>([]);
  const [visibleShellBoundsNode, setVisibleShellBoundsNode] = useState<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const { activeDrawer, openDrawer, closeDrawer } = useLeftEdgeDrawer();

  useEffect(() => {
    if (isOpen) {
      openDrawer("menu");
    } else {
      closeDrawer("menu");
    }
  }, [isOpen, openDrawer, closeDrawer]);

  useEffect(() => {
    // null means "nothing has claimed the shared slot yet" (e.g. this menu's own
    // openDrawer("menu") call hasn't round-tripped through the provider yet) — only
    // a different drawer actually claiming the slot should force this one closed.
    if (activeDrawer !== null && activeDrawer !== "menu") {
      setIsOpen(false);
    }
  }, [activeDrawer]);

  const registerSlot = useCallback(
    (node: HTMLDivElement, getHistoryTrigger: () => ConversationHistoryTriggerDescriptor | undefined) => {
      setSlotEntries((current) =>
        current.some((entry) => entry.node === node) ? current : [...current, { node, getHistoryTrigger }]
      );
    },
    []
  );

  const unregisterSlot = useCallback((node: HTMLDivElement) => {
    setSlotEntries((current) => current.filter((entry) => entry.node !== node));
  }, []);

  const registerShellBounds = useCallback((node: HTMLDivElement) => {
    setShellBoundsEntries((current) => (current.includes(node) ? current : [...current, node]));
  }, []);

  const unregisterShellBounds = useCallback((node: HTMLDivElement) => {
    setShellBoundsEntries((current) => current.filter((entry) => entry !== node));
  }, []);

  // DestinationOutlet keeps inactive destinations mounted and hides them via the `hidden`
  // attribute (for in-session state preservation) instead of unmounting — so a destination's
  // <PortalSlot /> registers once on mount and stays registered while hidden, and more than one
  // slot can be registered at a time once multiple destinations have been visited. Re-derive
  // which registered slot is actually visible whenever the registered set or the active
  // destination changes, after the DOM has committed.
  useEffect(() => {
    setVisibleSlotEntry(slotEntries.find((entry) => entry.node.closest("[hidden]") === null) ?? null);
  }, [slotEntries, activeDestinationId]);

  // Same visibility resolution as slots (each PageShell's ShellBounds node registers once
  // and stays registered while its destination is hidden-but-mounted) — more than one can be
  // registered once multiple destinations have been visited.
  useEffect(() => {
    setVisibleShellBoundsNode(shellBoundsEntries.find((node) => node.closest("[hidden]") === null) ?? null);
  }, [shellBoundsEntries, activeDestinationId]);

  const effectiveSlotNode = visibleSlotEntry?.node ?? null;
  // Read at render time (not cached in state) — the visible slot's own render already
  // committed its latest historyTrigger into the ref this getter reads.
  const historyTrigger = visibleSlotEntry?.getHistoryTrigger();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent): void {
      const target = event.target as Node;
      // The drawer may be portaled into a shell-bounds node elsewhere in the DOM (not a
      // descendant of containerRef), so a click landing inside it must not read as "outside".
      const insideContainer = containerRef.current?.contains(target) ?? false;
      const insideDrawer = drawerRef.current?.contains(target) ?? false;
      if (!insideContainer && !insideDrawer) {
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

  const drawer = isOpen ? (
    <div
      ref={drawerRef}
      role="menu"
      aria-label="Feature destinations"
      className="portal-menu-drawer portal-menu-drawer-motion bg-zinc-900"
    >
      <div className="portal-menu-drawer-inner flex flex-col">
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
              // Full-bleed row, not an inset pill: the separator rule under each entry runs
              // edge to edge across the drawer (the row itself carries the drawer's left
              // text inset via `.portal-menu-drawer-row`), so the horizontal lines meet the
              // drawer's left wall instead of stopping short of it.
              className={`portal-menu-drawer-row flex min-h-[2.75rem] items-center gap-3 border-b border-zinc-700/60 text-left text-sm font-medium transition ${
                isActive ? "bg-zinc-800 text-zinc-100" : "text-zinc-200 hover:bg-zinc-800/70"
              }`}
            >
              <span>{entry.label}</span>
              {isActive && <span aria-hidden="true" className="ml-auto text-accent-soft">✓</span>}
            </button>
          );
        })}
        <div className="portal-menu-drawer-section flex flex-col gap-1">
          <p className="pb-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-zinc-400">Theme</p>
          <ThemeSection
            paletteId={paletteId}
            onSelect={handlePaletteSelect}
            colorlessCustomHex={colorlessCustomHex}
            onColorlessCustomChange={onColorlessCustomChange}
            onColorlessReset={onColorlessReset}
          />
        </div>
        {/* Quiet decorative brand mark (REQ-113 item 4): pinned toward the bottom of any
            leftover vertical space via `mt-auto` in this flex column (drawer-inner stretches
            to the drawer's full height, see .portal-menu-drawer-inner's min-height: 100%) —
            not immediately after the last entry. `aria-hidden` and no onClick (plain BrandMark,
            not the header's button variant) keep it out of the drawer's own `role="menu"`
            semantics entirely: it isn't a menuitem and doesn't affect menuitem queries.
            `.portal-menu-drawer-brand`'s `pointer-events: none` (index.css) means it never
            intercepts clicks meant for entries/Theme/scroll above it. No height-detection
            logic decides whether this renders — a shell too short to host it cleanly is
            handled by the same `.portal-shell-bounds` overflow: hidden clip that produces the
            matching bottom-left radius (slice A), which simply clips this off along with the
            rest of the drawer's excess height. */}
        <div aria-hidden="true" className="portal-menu-drawer-brand mt-auto pt-3">
          <BrandMark />
        </div>
      </div>
    </div>
  ) : null;

  // The drawer portals into the resolved shell-bounds node (REQ-113's full-height/visible-bounds
  // tray) when one is registered and visible. When none is registered — isolated component
  // tests, a hypothetical headerless/shell-less destination — it falls back to rendering inline
  // here, exactly as it always has, so every existing case without a PageShell/ShellBounds
  // ancestor keeps passing unmodified.
  const trigger = (
    <div
      ref={containerRef}
      className={effectiveSlotNode ? "portal-slot-tab relative" : "fixed left-0 top-0 z-30"}
    >
      {historyTrigger ? (
        <div className="portal-menu-rail portal-menu-rail-split motion-focus font-medium">
          <button
            type="button"
            aria-label="Switch feature"
            aria-haspopup="true"
            aria-expanded={isOpen}
            onClick={() => setIsOpen((current) => !current)}
            className="portal-menu-rail-zone motion-focus border-none font-medium"
          >
            <MenuIcon />
          </button>
          <button
            type="button"
            aria-label="Conversation history"
            onClick={historyTrigger.onOpen}
            className="portal-menu-rail-zone motion-focus border-none font-medium"
          >
            <HistoryIcon />
          </button>
        </div>
      ) : (
        <button
          type="button"
          aria-label="Switch feature"
          aria-haspopup="true"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((current) => !current)}
          className="portal-menu-rail motion-focus border-none font-medium"
        >
          <MenuIcon />
        </button>
      )}

      {!visibleShellBoundsNode && drawer}
    </div>
  );

  return (
    <PortalSlotContext.Provider
      value={{ registerSlot, unregisterSlot, registerShellBounds, unregisterShellBounds }}
    >
      {effectiveSlotNode ? createPortal(trigger, effectiveSlotNode) : trigger}
      {visibleShellBoundsNode && drawer ? createPortal(drawer, visibleShellBoundsNode) : null}
      <div className={effectiveSlotNode ? undefined : "pt-44"}>{children}</div>
    </PortalSlotContext.Provider>
  );
}
