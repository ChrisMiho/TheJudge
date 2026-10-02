import { Fragment, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AmbientScene } from "../AmbientScene";
import { BrandMark } from "../BrandMark";
import { ConversationHistoryDrawer, type ConversationHistoryDraftRow } from "../ConversationHistoryDrawer";
import type { ConversationHistoryTriggerDescriptor } from "../ConversationWorkspace";
import { useOutsideDismiss } from "../../hooks/useOutsideDismiss";
import {
  deleteHistoryEntry,
  loadDraft,
  loadHistoryEntries,
  type ConversationHistoryEntry
} from "../../lib/conversationHistory/persistence";
import { useLeftEdgeDrawer } from "../../lib/portal/leftEdgeDrawerContext";
import { useAssistantSeed } from "../../lib/portal/seedContext";
import { PortalSlotContext } from "../../lib/portal/slotContext";
import { isPortalActionEntry, type DestinationId, type PortalEntry } from "../../lib/portal/types";
import { DEFAULT_PALETTE, getPaletteById } from "../../lib/theme/palettes";
import { ThemeSection } from "./ThemeSection";

type SlotEntry = {
  node: HTMLDivElement;
  getHistoryTrigger: () => ConversationHistoryTriggerDescriptor | undefined;
};

/** The mockup's card silhouette, worn by the Ask a Question row (`flow.js`'s CARD_GLYPH). */
function CardGlyph(): JSX.Element {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <rect x="4" y="2" width="12" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <rect x="6.5" y="4.5" width="7" height="5" rx="1" fill="currentColor" opacity="0.85" />
      <path d="M6.5 12.5 h7 M6.5 15 h4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

/** The glyph in front of each Menu row, by destination id (the mockup's `dest` table). */
const ROW_GLYPHS: Record<string, JSX.Element | string> = {
  "quick-lookup": <CardGlyph />,
  "player-life-tracker": "♥",
  "trade-balancer": "⚖"
};

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
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyEntries, setHistoryEntries] = useState<ConversationHistoryEntry[]>([]);
  const [slotEntries, setSlotEntries] = useState<SlotEntry[]>([]);
  const [visibleSlotEntry, setVisibleSlotEntry] = useState<SlotEntry | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const { activeDrawer, openDrawer, closeDrawer } = useLeftEdgeDrawer();
  const { queueHistoryResume, queueHistoryDeletion, queueDraftResume } = useAssistantSeed();

  function openHistory(): void {
    setHistoryEntries(loadHistoryEntries());
    setIsHistoryOpen(true);
  }

  // REQ-213/FLOW-016: hands the entry to the owning flow's own resume mailbox and
  // switches to its destination — `mtg-assistant` has no Menu row of its own
  // (REQ-067/REQ-206), so an In-depth entry is routed there directly rather than
  // through `onSelect`'s normal destination-id path.
  function handleResumeHistoryEntry(entry: ConversationHistoryEntry): void {
    queueHistoryResume(entry);
    onSelect(entry.mode === "lookup" ? "quick-lookup" : "mtg-assistant");
  }

  // DEC-143/REQ-118/FLOW-018: deletes from storage, refreshes this sheet's own list, and
  // notifies the owning flow in case the deleted entry was its active conversation — that
  // flow clears its view without re-saving the deleted thread (its own onConversationUpdated
  // path never fires for a clear, only for a fresh/followed-up submit).
  function handleDeleteHistoryEntry(entry: ConversationHistoryEntry): void {
    deleteHistoryEntry(entry.id);
    setHistoryEntries(loadHistoryEntries());
    queueHistoryDeletion({ id: entry.id, mode: entry.mode });
  }

  const lookupDraft = loadDraft("lookup");
  const gameDraft = loadDraft("game");
  const historyDraftRows: ConversationHistoryDraftRow[] = [
    ...(gameDraft
      ? [{ kind: "game" as const, updatedAt: gameDraft.updatedAt, onResume: () => handleResumeGameDraft() }]
      : []),
    ...(lookupDraft
      ? [{ kind: "lookup" as const, updatedAt: lookupDraft.updatedAt, onResume: () => handleResumeLookupDraft() }]
      : [])
  ];

  // Drafts have no saved `ConversationHistoryEntry` id to queue through the same
  // resume mailbox as a completed entry — `queueDraftResume` just tells the owning
  // flow "re-read your own Draft now" (REQ-108/FLOW-017's existing `loadDraft`/
  // hydrate pair already does the rest); switching destination alone would miss the
  // case where the player opened History from the flow that already owns the Draft.
  function handleResumeGameDraft(): void {
    setIsHistoryOpen(false);
    queueDraftResume("game");
    onSelect("mtg-assistant");
  }

  function handleResumeLookupDraft(): void {
    setIsHistoryOpen(false);
    queueDraftResume("lookup");
    onSelect("quick-lookup");
  }

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

  // DestinationOutlet keeps inactive destinations mounted and hides them via the `hidden`
  // attribute (for in-session state preservation) instead of unmounting — so a destination's
  // <PortalSlot /> registers once on mount and stays registered while hidden, and more than one
  // slot can be registered at a time once multiple destinations have been visited. Re-derive
  // which registered slot is actually visible whenever the registered set or the active
  // destination changes, after the DOM has committed.
  useEffect(() => {
    setVisibleSlotEntry(slotEntries.find((entry) => entry.node.closest("[hidden]") === null) ?? null);
  }, [slotEntries, activeDestinationId]);

  const effectiveSlotNode = visibleSlotEntry?.node ?? null;
  const paletteMotif = (getPaletteById(paletteId) ?? DEFAULT_PALETTE).motif;

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

  // The tray slides in once mounted: `shell.css` keys its transform and its
  // backdrop's fade on `[data-tray-open="true"]`, so the host flips from "false"
  // to "true" one frame after mount.
  const [isTrayShown, setIsTrayShown] = useState(false);
  useEffect(() => {
    if (!isOpen) {
      setIsTrayShown(false);
      return;
    }
    const frame = requestAnimationFrame(() => setIsTrayShown(true));
    return () => cancelAnimationFrame(frame);
  }, [isOpen]);

  const drawer = isOpen ? (
    <div className="menu-tray-host" data-tray-open={isTrayShown}>
      <div aria-hidden="true" className="menu-tray-backdrop" />
      <nav ref={drawerRef} role="menu" aria-label="Feature destinations" className="menu-tray">
        <div className="tray-brand">
          <BrandMark decorative />
          <button type="button" className="icon-btn" aria-label="Close menu" onClick={() => setIsOpen(false)}>
            ✕
          </button>
        </div>
        <ul className="tray-nav-list" role="presentation">
          {entries.map((entry, index) => {
            const isActive =
              !isPortalActionEntry(entry) &&
              (entry.id === activeDestinationId || entry.id === activeDestinationAliasId);
            return (
              <Fragment key={entry.id}>
                {/* The divider ahead of the Menu's one action entry (Send feedback). */}
                {isPortalActionEntry(entry) && (
                  <li role="presentation">
                    <div aria-hidden="true" className="tray-divider" />
                  </li>
                )}
                <li role="presentation">
                  <button
                    type="button"
                    role="menuitem"
                    aria-label={entry.label}
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => handleSelect(entry)}
                  >
                    <span aria-hidden="true" className="glyph">
                      {isPortalActionEntry(entry) ? "✎" : (ROW_GLYPHS[entry.id] ?? "")}
                    </span>
                    <span>{entry.label}</span>
                    {isActive && (
                      <span aria-hidden="true" className="here">
                        ✓
                      </span>
                    )}
                  </button>
                </li>
                {/* REQ-067/REQ-213: Question History sits right after Ask a Question, ahead of
                    Life Tracker and Trade Balancer. Fixed at this position rather than modeled
                    as a `PortalEntry` because it opens this component's own sheet state, not a
                    destination switch. Always enabled — the combined list (REQ-103/REQ-107)
                    no longer depends on the currently-visible destination registering a
                    history trigger of its own. */}
                {index === 0 && (
                  <li role="presentation">
                    <button
                      type="button"
                      role="menuitem"
                      aria-label="Question History"
                      onClick={() => {
                        setIsOpen(false);
                        openHistory();
                      }}
                    >
                      <span aria-hidden="true" className="glyph">
                        ◷
                      </span>
                      <span>Question History</span>
                    </button>
                  </li>
                )}
              </Fragment>
            );
          })}
        </ul>
        <h3>Theme</h3>
        <ThemeSection
          paletteId={paletteId}
          onSelect={handlePaletteSelect}
          colorlessCustomHex={colorlessCustomHex}
          onColorlessCustomChange={onColorlessCustomChange}
          onColorlessReset={onColorlessReset}
        />
        {/* The colour's own element plays at a whisper behind the rows (REQ-207): the
            mockup's `.tray-flair`, the same renderer as the page scene at low density. */}
        <AmbientScene motif={paletteMotif} variant="tray" />
      </nav>
    </div>
  ) : null;

  // REQ-114/REQ-115/REQ-116/REQ-207: there is one ☰ trigger (the banner header's
  // Menu button, `.menu-toggle`) at every width, on every destination. History
  // access is the tray's own "Question History" row, which opens this
  // component's combined-list sheet (REQ-213). DEC-150: while the tray is open
  // the trigger is not visible and not clickable (`aria-hidden`/`tabIndex` are a
  // guard; the open tray's backdrop covers it); it stays mounted — same DOM node —
  // so keyboard focus can be restored to it by reference after closing.
  const railInertAttrs = isOpen ? { "aria-hidden": "true" as const, tabIndex: -1 } : {};

  const railTrigger = (
    <button
      type="button"
      className="menu-toggle motion-focus"
      aria-label="Switch feature"
      aria-haspopup="true"
      aria-expanded={false}
      onClick={isOpen ? undefined : () => setIsOpen(true)}
      {...railInertAttrs}
    >
      ☰
    </button>
  );

  const trigger = (
    <div ref={containerRef} className={effectiveSlotNode ? "portal-slot-tab" : "fixed left-0 top-0 z-30"}>
      {railTrigger}
    </div>
  );

  return (
    <PortalSlotContext.Provider
      value={{ registerSlot, unregisterSlot }}
    >
      {effectiveSlotNode ? createPortal(trigger, effectiveSlotNode) : trigger}
      {drawer ? createPortal(drawer, document.body) : null}
      <div className={effectiveSlotNode ? undefined : "pt-44"}>{children}</div>
      <ConversationHistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        entries={historyEntries}
        draftRows={historyDraftRows}
        onResumeEntry={handleResumeHistoryEntry}
        onDeleteEntry={handleDeleteHistoryEntry}
      />
    </PortalSlotContext.Provider>
  );
}
