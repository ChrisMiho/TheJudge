import { Fragment, useEffect, useId, useState } from "react";
import type { ConversationHistoryEntry } from "../lib/conversationHistory/persistence";
import { ConfirmSheet } from "./ConfirmSheet";
import { getCardIdentityRingStyle } from "../lib/cardIdentityRing";
import { SheetShell } from "./SheetShell";

export type ConversationHistoryDraftRow = {
  kind: "lookup" | "game";
  updatedAt: string;
  onResume: () => void;
};

type ConversationHistoryDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  /** Combined, most-recent-first, already capped at 20 across both kinds (REQ-213). */
  entries: ConversationHistoryEntry[];
  /** Each flow's mid-flight Draft (REQ-108), shown as its own row above the saved
   * conversations (FLOW-017). 0, 1, or 2 rows — one per flow, only when one exists. */
  draftRows?: ConversationHistoryDraftRow[];
  /** Closes the sheet and hands the entry to the caller, which switches to that
   * conversation's own flow and loads it live (REQ-213/FLOW-016). */
  onResumeEntry: (entry: ConversationHistoryEntry) => void;
  /** Deletes a completed entry from storage (DEC-143/REQ-118/FLOW-018). Called only
   * after this component's own confirm step. */
  onDeleteEntry: (entry: ConversationHistoryEntry) => void;
};

const PREVIEW_MAX_CHARS = 80;
/** REQ-207's sheet-family boundary (DEC-117/NFR-011) — matches `--sheet-breakpoint`
 * in index.css. CSS custom properties can't drive a JS branch, so this literal is the
 * canonical number that value must match. */
const SHEET_WIDE_BREAKPOINT_PX = 600;

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

/** The mockup's "2 min ago" / "1 h ago" / "yesterday" / "3 days ago" wording. */
function formatUpdatedAt(updatedAt: string, now: number = Date.now()): string {
  const parsed = new Date(updatedAt);
  if (Number.isNaN(parsed.getTime())) return updatedAt;
  const age = Math.max(0, now - parsed.getTime());
  if (age < MINUTE_MS) return "just now";
  if (age < HOUR_MS) return `${Math.floor(age / MINUTE_MS)} min ago`;
  if (age < DAY_MS) return `${Math.floor(age / HOUR_MS)} h ago`;
  if (age < 2 * DAY_MS) return "yesterday";
  if (age < 30 * DAY_MS) return `${Math.floor(age / DAY_MS)} days ago`;
  return parsed.toLocaleDateString();
}

function previewSnippet(text: string): string {
  return text.length > PREVIEW_MAX_CHARS ? `${text.slice(0, PREVIEW_MAX_CHARS)}…` : text;
}

type FanCard = { name: string; imageUrl?: string; colors?: string[] };

/** REQ-213: the cards a row's thumbnail fan draws from — a lookup entry's attached
 * cards, or a game entry's cards across every zone it used, in no particular order
 * (the fan is a glance, not a record of zone placement). */
function cardsFromFrozenContext(context: ConversationHistoryEntry["frozenContext"]): FanCard[] {
  if (context.kind === "lookup") {
    return context.cards.map((card) => ({ name: card.name, imageUrl: card.imageUrl }));
  }
  const zones = context.gameContext.zones ?? {};
  return Object.values(zones).flatMap(
    (zoneCards) =>
      zoneCards?.map((card) => ({ name: card.name, imageUrl: card.imageUrl, colors: card.colors })) ?? []
  );
}

function firstRulingLine(entry: ConversationHistoryEntry): string | null {
  const firstAnswer = entry.visibleMessages.find((message) => message.role === "assistant");
  if (!firstAnswer) return null;
  const line = firstAnswer.content.split("\n")[0] ?? "";
  return previewSnippet(line);
}

function followUpCount(entry: ConversationHistoryEntry): number {
  return Math.max(0, entry.visibleMessages.filter((message) => message.role === "user").length - 1);
}

function modeLabel(entry: ConversationHistoryEntry): string {
  return entry.mode === "lookup" ? "Quick" : "In-depth";
}

const PHASE_LABEL: Record<string, string> = {
  untap: "Untap",
  upkeep: "Upkeep",
  draw: "Draw",
  main_1: "Pre Combat Main",
  combat: "Combat",
  main_2: "Post Combat Main",
  end_step: "End Step",
  cleanup: "Cleanup"
};

function contextLabel(entry: ConversationHistoryEntry): string | null {
  if (entry.mode !== "game" || entry.frozenContext.kind !== "game") return null;
  const { turnPhase, players } = entry.frozenContext.gameContext;
  const phase = PHASE_LABEL[turnPhase];
  const playerLabel = `${players?.length ?? 0} players`;
  return phase ? `${phase} · ${playerLabel}` : playerLabel;
}

/** REQ-213: a small ringed thumbnail (the card's colour-identity ring, REQ-058). */
function Thumb({ card, className }: { card: FanCard; className?: string }): JSX.Element {
  return (
    <span
      className={className ? `thumb card-identity-ring ${className}` : "thumb card-identity-ring"}
      style={getCardIdentityRingStyle(card.colors)}
    >
      <img src={card.imageUrl || undefined} alt="" />
    </span>
  );
}

/** REQ-213: a small fan of up to three thumbnails plus a "+n" tab; a dashed empty
 * frame when the entry carries no cards. Purely decorative (aria-hidden) — the row's
 * own accessible name carries the question text, not the card images. */
function CardFan({ cards }: { cards: FanCard[] }): JSX.Element {
  if (cards.length === 0) {
    return (
      <span aria-hidden="true" className="h-fan">
        <span className="none">—</span>
      </span>
    );
  }

  const overflow = cards.length - 3;

  return (
    <span aria-hidden="true" className="h-fan">
      {cards.slice(0, 3).map((card, index) => (
        <Thumb key={`${card.name}-${index}`} card={card} />
      ))}
      {overflow > 0 && <span className="more">{`+${overflow}`}</span>}
    </span>
  );
}

/** REQ-207/REQ-213: the sheet family's two-pane boundary is behavioral here, not just
 * visual — below it a tap resumes immediately, from it a tap only selects into the
 * reading pane — so it is read via `innerWidth`/`resize` rather than a CSS media query.
 * jsdom has no `matchMedia`; `innerWidth` is always present (default 1024, i.e. wide),
 * which is also why this hook, not a CSS class, is what the two-pane tests drive. */
function useIsWideSheet(): boolean {
  const [isWide, setIsWide] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth >= SHEET_WIDE_BREAKPOINT_PX : true
  );

  useEffect(() => {
    function handleResize(): void {
      setIsWide(window.innerWidth >= SHEET_WIDE_BREAKPOINT_PX);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isWide;
}

/**
 * REQ-213: Question History as one combined list for both question kinds, hosted on
 * the shared sheet (REQ-208) in the mockup's DOM order (`.h-head`, `.h-panes` with the
 * list and the preview pane, `.history-foot`). Below `--sheet-breakpoint` a tap closes
 * the sheet and resumes that conversation live, in its own flow; from it the sheet is
 * two panes — the list (tap only selects) and the selected conversation read in full,
 * with **Open conversation** (resumes, same as a narrow tap) and **Delete this
 * question**. Below the breakpoint each row keeps its own Delete control instead.
 * Either path confirms through the shared `ConfirmSheet` before deleting
 * (DEC-143/REQ-118).
 */
export function ConversationHistoryDrawer({
  isOpen,
  onClose,
  entries,
  draftRows = [],
  onResumeEntry,
  onDeleteEntry
}: ConversationHistoryDrawerProps): JSX.Element | null {
  const titleId = useId();
  const isWide = useIsWideSheet();
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [pendingDeleteEntry, setPendingDeleteEntry] = useState<ConversationHistoryEntry | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setSelectedEntryId(null);
      setPendingDeleteEntry(null);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const selectedEntry = entries.find((entry) => entry.id === selectedEntryId) ?? null;

  function resume(entry: ConversationHistoryEntry): void {
    onResumeEntry(entry);
    onClose();
  }

  function handleRowActivate(entry: ConversationHistoryEntry): void {
    if (isWide) {
      setSelectedEntryId(entry.id);
    } else {
      resume(entry);
    }
  }

  function handleConfirmDelete(): void {
    if (!pendingDeleteEntry) return;
    onDeleteEntry(pendingDeleteEntry);
    if (selectedEntryId === pendingDeleteEntry.id) {
      setSelectedEntryId(null);
    }
    setPendingDeleteEntry(null);
  }

  const selectedCards = selectedEntry ? cardsFromFrozenContext(selectedEntry.frozenContext) : [];

  return (
    <>
      <SheetShell
        isOpen={isOpen}
        onClose={onClose}
        closeLabel="Close Question History"
        titleId={titleId}
        panelId="history-drawer"
        panelClassName="history-panel"
        testId="history-sheet"
      >
        <div className="h-head" id={titleId}>
          <h2>Question History</h2>
          <span className="n">{`${entries.length} of 20`}</span>
        </div>
        <div className="h-panes">
          <div className="history-list" role="list">
            {draftRows.map((draft) => (
              <div key={draft.kind} className="history-item" role="listitem">
              <button type="button" className="history-row" onClick={draft.onResume}>
                <span aria-hidden="true" className="h-fan">
                  <span className="none">✎</span>
                </span>
                <span className="h-main">
                  <span className="h-q">Resume where you left off</span>
                  <span className="h-meta">
                    <span className="mode-chip">Draft</span>
                    <span className="sep" />
                    <span>{draft.kind === "lookup" ? "Ask a Question" : "In-depth details"}</span>
                    <span className="sep" />
                    <span>{formatUpdatedAt(draft.updatedAt)}</span>
                  </span>
                </span>
                <span aria-hidden="true" className="h-chev">
                  ›
                </span>
              </button>
              </div>
            ))}

            {entries.length === 0 && draftRows.length === 0 ? (
              <div className="history-empty">No saved conversations yet</div>
            ) : (
              entries.map((entry) => {
                const cards = cardsFromFrozenContext(entry.frozenContext);
                const ruling = firstRulingLine(entry);
                const followUps = followUpCount(entry);
                const context = contextLabel(entry);
                const isSelected = isWide && entry.id === selectedEntryId;
                const previewLabel = `${entry.mode === "lookup" ? "Ask a Question" : "In-depth"}: ${previewSnippet(entry.hiddenInitialQuestion)}`;
                return (
                  <div key={entry.id} className="history-item" role="listitem">
                    <button
                      type="button"
                      className="history-row"
                      onClick={() => handleRowActivate(entry)}
                      aria-current={isSelected ? "true" : "false"}
                      aria-label={previewLabel}
                    >
                      <CardFan cards={cards} />
                      <span className="h-main">
                        <span className="h-q">{previewSnippet(entry.hiddenInitialQuestion)}</span>
                        {ruling && <span className="h-a">{ruling}</span>}
                        <span className="h-meta">
                          <span aria-hidden="true" className="mode-chip">
                            {modeLabel(entry)}
                          </span>
                          <span className="sep" />
                          <span>{cards.length === 0 ? "no cards" : cards.length === 1 ? "1 card" : `${cards.length} cards`}</span>
                          {context && (
                            <>
                              <span className="sep" />
                              <span>{context}</span>
                            </>
                          )}
                          {followUps > 0 && (
                            <>
                              <span className="sep" />
                              <span>{followUps === 1 ? "1 follow-up" : `${followUps} follow-ups`}</span>
                            </>
                          )}
                          <span className="sep" />
                          <span>{formatUpdatedAt(entry.updatedAt)}</span>
                        </span>
                      </span>
                      <span aria-hidden="true" className="h-chev">
                        ›
                      </span>
                    </button>
                    {!isWide && (
                      <button
                        type="button"
                        className="history-item-delete"
                        aria-label={`Delete: ${previewLabel}`}
                        onClick={() => setPendingDeleteEntry(entry)}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="h-preview">
            {isWide &&
              (selectedEntry ? (
                <>
                  <div className="pv-scroll">
                    <div className="pv-when">
                      <span className="mode-chip">{modeLabel(selectedEntry)}</span>
                      <span>{`asked ${formatUpdatedAt(selectedEntry.updatedAt)}`}</span>
                      {contextLabel(selectedEntry) && (
                        <>
                          <span>·</span>
                          <span>{contextLabel(selectedEntry)}</span>
                        </>
                      )}
                    </div>
                    <div className="chat-cards">
                      {selectedCards.length > 0 ? (
                        <>
                          <span className="lbl">Cards</span>
                          {selectedCards.map((card, index) => (
                            <Thumb key={`${card.name}-${index}`} card={card} className="tap" />
                          ))}
                        </>
                      ) : (
                        <span className="lbl">No cards attached</span>
                      )}
                    </div>
                    <div className="thread">
                      {selectedEntry.visibleMessages.map((message, index) =>
                        message.role === "user" ? (
                          <div key={index} className="msg you">
                            {message.content}
                          </div>
                        ) : (
                          <div key={index} className="msg judge">
                            <span className="seal" aria-hidden="true" />
                            <div>
                              <span className="who">TheJudge</span>
                              {message.content.split("\n").map((paragraph, paragraphIndex) => (
                                <Fragment key={paragraphIndex}>
                                  <p>{paragraph}</p>
                                </Fragment>
                              ))}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                  <div className="pv-foot">
                    <button type="button" className="link" onClick={() => setPendingDeleteEntry(selectedEntry)}>
                      Delete this question
                    </button>
                    <button type="button" className="btn primary" onClick={() => resume(selectedEntry)}>
                      Open conversation <span aria-hidden="true">›</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="pv-empty">
                  <span>
                    Pick a question to read it here.
                    <br />
                    Open puts you back in the conversation.
                  </span>
                </div>
              ))}
          </div>
        </div>
        <div className="history-foot">
          Your last 20 answered questions are kept on this device. Open one to keep the conversation going.
        </div>
      </SheetShell>

      <ConfirmSheet
        isOpen={pendingDeleteEntry !== null}
        onKeep={() => setPendingDeleteEntry(null)}
        onConfirm={handleConfirmDelete}
        question={
          pendingDeleteEntry ? `Delete "${previewSnippet(pendingDeleteEntry.hiddenInitialQuestion)}"?` : "Delete this question?"
        }
        detail="This removes it from Question History for good."
        confirmLabel="Delete"
        testId="history-delete-confirm"
      />
    </>
  );
}
