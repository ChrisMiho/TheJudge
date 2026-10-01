import { useEffect, useId, useState } from "react";
import type { ConversationHistoryEntry } from "../lib/conversationHistory/persistence";
import { ConfirmSheet } from "./ConfirmSheet";
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

function formatUpdatedAt(updatedAt: string): string {
  const parsed = new Date(updatedAt);
  return Number.isNaN(parsed.getTime()) ? updatedAt : parsed.toLocaleString();
}

function previewSnippet(text: string): string {
  return text.length > PREVIEW_MAX_CHARS ? `${text.slice(0, PREVIEW_MAX_CHARS)}…` : text;
}

type FanCard = { name: string; imageUrl?: string };

/** REQ-213: the cards a row's thumbnail fan draws from — a lookup entry's attached
 * cards, or a game entry's cards across every zone it used, in no particular order
 * (the fan is a glance, not a record of zone placement). */
function cardsFromFrozenContext(context: ConversationHistoryEntry["frozenContext"]): FanCard[] {
  if (context.kind === "lookup") {
    return context.cards.map((card) => ({ name: card.name, imageUrl: card.imageUrl }));
  }
  const zones = context.gameContext.zones ?? {};
  return Object.values(zones).flatMap(
    (zoneCards) => zoneCards?.map((card) => ({ name: card.name, imageUrl: card.imageUrl })) ?? []
  );
}

function firstRulingLine(entry: ConversationHistoryEntry): string | null {
  const firstAnswer = entry.visibleMessages.find((message) => message.role === "assistant");
  if (!firstAnswer) return null;
  const line = firstAnswer.content.split("\n")[0] ?? "";
  return previewSnippet(line);
}

function metaLine(entry: ConversationHistoryEntry, cardCount: number): string {
  const kindLabel = entry.mode === "lookup" ? "Ask a Question" : "In-depth details";
  const cardLabel = cardCount === 1 ? "1 card" : `${cardCount} cards`;
  const followUps = Math.max(0, entry.visibleMessages.filter((message) => message.role === "user").length - 1);
  const followUpLabel = followUps === 1 ? "1 follow-up" : `${followUps} follow-ups`;
  const gameSuffix =
    entry.mode === "game" && entry.frozenContext.kind === "game"
      ? ` · ${entry.frozenContext.gameContext.players?.length ?? 0} players`
      : "";
  return `${kindLabel}${gameSuffix} · ${cardLabel} · ${followUpLabel} · ${formatUpdatedAt(entry.updatedAt)}`;
}

/** REQ-213: a small fan of up to three thumbnails plus a "+n" badge; a dashed empty
 * frame when the entry carries no cards. Purely decorative (aria-hidden) — the row's
 * own accessible name carries the question text, not the card images. */
function CardFan({ cards }: { cards: FanCard[] }): JSX.Element {
  if (cards.length === 0) {
    return (
      <span
        aria-hidden="true"
        className="h-10 w-7 shrink-0 rounded-md border border-dashed border-zinc-600"
      />
    );
  }

  const shown = cards.slice(0, 3);
  const overflow = cards.length - shown.length;

  return (
    <span aria-hidden="true" className="flex shrink-0 items-center">
      {shown.map((card, index) => (
        <img
          key={`${card.name}-${index}`}
          src={card.imageUrl || undefined}
          alt=""
          className="h-10 w-7 rounded border border-zinc-700 bg-zinc-800 object-cover"
          style={{ marginLeft: index === 0 ? 0 : "-0.6rem", zIndex: index }}
        />
      ))}
      {overflow > 0 && (
        <span className="ml-1 rounded-full bg-zinc-800 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-300">
          {`+${overflow}`}
        </span>
      )}
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
 * the shared sheet (REQ-208). Below `--sheet-breakpoint` a tap closes the sheet and
 * resumes that conversation live, in its own flow; from it the sheet is two panes —
 * the list (tap only selects) and the selected conversation read in full, with
 * **Open conversation** (resumes, same as a narrow tap) and **Delete this question**.
 * Below the breakpoint each row keeps its own Delete control instead. Either path
 * confirms through the shared `ConfirmSheet` before deleting (DEC-143/REQ-118).
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
    // A stale selection or pre-armed delete confirm must not reappear the next time
    // this sheet opens.
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

  return (
    <>
      <SheetShell
        isOpen={isOpen}
        onClose={onClose}
        closeLabel="Close Question History"
        titleId={titleId}
        testId="history-sheet"
        head={
          <h2 id={titleId} className="text-lg font-black text-zinc-100">
            {`Question History — ${entries.length} of 20`}
          </h2>
        }
      >
        <div className={isWide ? "flex h-full min-h-0 gap-4" : "flex flex-col gap-2"}>
          <div
            className={
              isWide
                ? "flex w-full max-w-[16rem] shrink-0 flex-col gap-2 overflow-y-auto"
                : "flex flex-col gap-2"
            }
          >
            {draftRows.map((draft) => (
              <button
                key={draft.kind}
                type="button"
                onClick={draft.onResume}
                className="w-full shrink-0 rounded-lg border border-accent/50 bg-accent/10 px-3 py-2.5 text-left text-sm text-zinc-100 transition hover:bg-accent/20"
              >
                <span className="block text-xs font-semibold uppercase tracking-[0.08em] text-accent-soft">
                  {`${draft.kind === "lookup" ? "Ask a Question" : "In-depth details"} Draft · ${formatUpdatedAt(draft.updatedAt)}`}
                </span>
                <span className="mt-1 block text-zinc-300">Resume where you left off</span>
              </button>
            ))}

            {entries.length === 0 && draftRows.length === 0 ? (
              <p className="rounded-xl border border-zinc-700/70 bg-zinc-900/55 px-3 py-3 text-sm text-zinc-300">
                No saved conversations yet
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {entries.map((entry) => {
                  const cards = cardsFromFrozenContext(entry.frozenContext);
                  const ruling = firstRulingLine(entry);
                  const isSelected = isWide && entry.id === selectedEntryId;
                  const previewLabel = `${entry.mode === "lookup" ? "Ask a Question" : "In-depth"}: ${previewSnippet(entry.hiddenInitialQuestion)}`;
                  return (
                    <li key={entry.id} className="flex items-stretch gap-2">
                      <button
                        type="button"
                        onClick={() => handleRowActivate(entry)}
                        aria-current={isSelected ? "true" : undefined}
                        aria-label={previewLabel}
                        className={`flex flex-1 items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                          isSelected ? "bg-zinc-800 text-zinc-100" : "text-zinc-200 hover:bg-zinc-800/70"
                        }`}
                      >
                        <CardFan cards={cards} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold">
                            {previewSnippet(entry.hiddenInitialQuestion)}
                          </span>
                          {ruling && <span className="mt-0.5 block truncate text-zinc-400">{ruling}</span>}
                          <span className="mt-0.5 block text-xs text-zinc-500">{metaLine(entry, cards.length)}</span>
                        </span>
                      </button>
                      {!isWide && (
                        <button
                          type="button"
                          aria-label={`Delete: ${previewLabel}`}
                          onClick={() => setPendingDeleteEntry(entry)}
                          className="self-center rounded-lg border border-zinc-600 bg-zinc-800 px-2 py-1 text-xs font-semibold text-zinc-300 transition hover:bg-zinc-700"
                        >
                          Delete
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {isWide && (
            <div className="flex min-w-0 flex-1 flex-col gap-3 border-l border-zinc-700/60 pl-4">
              {selectedEntry ? (
                <>
                  <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
                    <p className="text-sm font-semibold text-zinc-100">{selectedEntry.hiddenInitialQuestion}</p>
                    {selectedEntry.visibleMessages.map((message, index) => (
                      <p
                        key={index}
                        className={message.role === "user" ? "text-sm text-zinc-300" : "text-sm text-zinc-100"}
                      >
                        {message.content}
                      </p>
                    ))}
                  </div>
                  <div className="flex items-center justify-end gap-3 border-t border-zinc-700/60 pt-3">
                    <button
                      type="button"
                      onClick={() => setPendingDeleteEntry(selectedEntry)}
                      className="rounded-lg border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm font-semibold text-zinc-200 hover:bg-zinc-800"
                    >
                      Delete this question
                    </button>
                    <button
                      type="button"
                      onClick={() => resume(selectedEntry)}
                      className="rounded-lg bg-accent-strong px-3 py-2 text-sm font-semibold text-accent-contrast"
                    >
                      Open conversation
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-zinc-400">Select a question to read it here.</p>
              )}
            </div>
          )}
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
