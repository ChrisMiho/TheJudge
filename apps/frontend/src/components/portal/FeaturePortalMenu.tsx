import { Fragment, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { BrandMark } from "../BrandMark";
import type { ConversationHistoryTriggerDescriptor } from "../ConversationWorkspace";
import { useOutsideDismiss } from "../../hooks/useOutsideDismiss";
import { useLeftEdgeDrawer } from "../../lib/portal/leftEdgeDrawerContext";
import { PortalSlotContext } from "../../lib/portal/slotContext";
import { isPortalActionEntry, type DestinationId, type PortalEntry } from "../../lib/portal/types";
import { ThemeSection } from "./ThemeSection";

type SlotEntry = {
  node: HTMLDivElement;
  getHistoryTrigger: () => ConversationHistoryTriggerDescriptor | undefined;
};

/** REQ-213 placeholder History glyph for the Menu's "Question History" row. */
function HistoryRowIcon(): JSX.Element {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="portal-menu-drawer-row-icon"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}

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

export interface FeaturePortalMenuProps {
  /** Destination and action entries, rendered identically in array order (DEC-104). */
  entries: PortalEntry[];
  activeDestinationId: DestinationId;
  /**
   * REQ-067: a destination with no row of its own (`in-depth`, while open) reads
   * another entry (`quick-lookup`'s "Ask a Question") as current instead. Kept
   * distinct from `activeDestinationId` itself — which drives slot/shell-bounds
   * visibility resolution via the `[hidden]`-ancestor check below — so aliasing
   * the "current" row never masks a real destination switch from that check.
   */
  activeDestinationAliasId?: DestinationId;
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
  activeDestinationAliasId,
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

  // The drawer may be portaled into a shell-bounds node elsewhere in the DOM (not a
  // descendant of containerRef), so a click landing inside it must not read as "outside".
  useOutsideDismiss([containerRef, drawerRef], () => setIsOpen(false), isOpen);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
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
        {entries.map((entry, index) => {
          const isActive =
            !isPortalActionEntry(entry) &&
            (entry.id === activeDestinationId || entry.id === activeDestinationAliasId);
          return (
            <Fragment key={entry.id}>
              <button
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
              {/* REQ-067: Question History sits right after Ask a Question, ahead of Life
                  Tracker and Trade Balancer. Fixed at this position rather than modeled as
                  a `PortalEntry` because its handler depends on `historyTrigger` — the
                  currently-visible destination's own history descriptor — which only
                  FeaturePortalMenu computes; App.tsx's entries array has no access to it.
                  Slice I rebuilds this row's destination (REQ-213's one-list sheet); for
                  now it opens whatever history affordance the active destination already
                  registers, same as the former rail History icon did. */}
              {index === 0 && (
                <button
                  type="button"
                  role="menuitem"
                  aria-label="Question History"
                  onClick={() => {
                    setIsOpen(false);
                    historyTrigger?.onOpen();
                  }}
                  disabled={!historyTrigger}
                  className="portal-menu-drawer-row flex min-h-[2.75rem] items-center gap-3 border-b border-zinc-700/60 text-left text-sm font-medium text-zinc-200 transition hover:bg-zinc-800/70 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  <HistoryRowIcon />
                  <span>Question History</span>
                </button>
              )}
            </Fragment>
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
  // DEC-150: while the tray is open, the rail's Menu/History trigger(s) are not visible and
  // not clickable. This amends DEC-140's "trigger stays interactive so the user can close it"
  // clause: closing now goes exclusively through the outside-click/Escape handlers above.
  // The rail stays mounted (same DOM node identity) rather than being conditionally
  // unmounted: `visibility: hidden` on `.portal-menu-rail-inert` removes it from paint and
  // from `elementFromPoint` hit-testing (browsers exclude invisible elements from hit-testing
  // and the tab order automatically), `pointer-events: none` is belt-and-suspenders, and
  // `aria-hidden`/`tabIndex={-1}` on each interactive button are a further explicit guard —
  // the same proven pattern this package's own prior DEC-140 History-inert treatment used.
  // Keeping the same node mounted (instead of `isOpen ? null : ...`) matters beyond DEC-150
  // itself: other app chrome (e.g. the feedback modal opened via this same Menu) restores
  // keyboard focus to "the portal trigger" by DOM reference after closing, which only works
  // if that reference survives the open/close cycle.
  const railInertAttrs = isOpen ? { "aria-hidden": "true" as const, tabIndex: -1 } : {};

  // REQ-114/REQ-115/REQ-116/REQ-207: the split Menu+History rail retires — there is
  // one ☰ trigger (the banner header's REQ-207 Menu button) at every width, on every
  // destination. History access moves into the drawer's own "Question History" row
  // above; `historyTrigger` is still read (for that row), it just no longer selects
  // between two rendered trigger shapes here.
  const railTrigger = (
    <button
      type="button"
      aria-label="Switch feature"
      aria-haspopup="true"
      aria-expanded={false}
      onClick={isOpen ? undefined : () => setIsOpen(true)}
      className={`portal-menu-rail motion-focus border-none font-medium${
        isOpen ? " portal-menu-rail-inert" : ""
      }`}
      {...railInertAttrs}
    >
      <MenuIcon />
    </button>
  );

  const trigger = (
    <div
      ref={containerRef}
      className={effectiveSlotNode ? "portal-slot-tab relative" : "fixed left-0 top-0 z-30"}
    >
      {railTrigger}

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
