import { useEffect, useId, useRef, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import type { ConversationHistoryEntry } from "../lib/conversationHistory/persistence";
import { useLeftEdgeDrawer } from "../lib/portal/leftEdgeDrawerContext";

type ConversationHistoryDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  entries: ConversationHistoryEntry[];
  activeConversationId?: string | null;
  onSelectEntry: (entry: ConversationHistoryEntry) => void;
};

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])'
].join(",");

const PREVIEW_MAX_CHARS = 80;

function formatUpdatedAt(updatedAt: string): string {
  const parsed = new Date(updatedAt);
  return Number.isNaN(parsed.getTime()) ? updatedAt : parsed.toLocaleString();
}

function previewSnippet(hiddenInitialQuestion: string): string {
  return hiddenInitialQuestion.length > PREVIEW_MAX_CHARS
    ? `${hiddenInitialQuestion.slice(0, PREVIEW_MAX_CHARS)}…`
    : hiddenInitialQuestion;
}

export function ConversationHistoryDrawer({
  isOpen,
  onClose,
  entries,
  activeConversationId,
  onSelectEntry
}: ConversationHistoryDrawerProps): JSX.Element | null {
  const titleId = useId();
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const { activeDrawer, openDrawer, closeDrawer } = useLeftEdgeDrawer();

  useEffect(() => {
    if (isOpen) {
      openDrawer("history");
    } else {
      closeDrawer("history");
    }
  }, [isOpen, openDrawer, closeDrawer]);

  useEffect(() => {
    // null means "nothing has claimed the shared slot yet" (e.g. this drawer's own
    // openDrawer("history") call hasn't round-tripped through the provider yet) — only
    // a different drawer actually claiming the slot should force this one closed.
    if (activeDrawer !== null && activeDrawer !== "history" && isOpen) {
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reacts only to the shared drawer signal; onClose/isOpen are read at fire time.
  }, [activeDrawer]);

  useEffect(() => {
    if (isOpen) {
      restoreFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      closeRef.current?.focus();
      return;
    }

    restoreFocusRef.current?.focus();
    restoreFocusRef.current = null;
  }, [isOpen]);

  function handleSelectEntry(entry: ConversationHistoryEntry): void {
    if (entry.id === activeConversationId) return;
    onSelectEntry(entry);
  }

  function handleDialogKeyDown(event: KeyboardEvent<HTMLElement>): void {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }

    if (event.key !== "Tab") return;

    const focusableElements = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? []
    );
    if (focusableElements.length === 0) {
      event.preventDefault();
      dialogRef.current?.focus();
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    const activeElement = document.activeElement;

    if (event.shiftKey && (activeElement === firstElement || !dialogRef.current?.contains(activeElement))) {
      event.preventDefault();
      lastElement.focus();
      return;
    }

    if (!event.shiftKey && (activeElement === lastElement || !dialogRef.current?.contains(activeElement))) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  if (!isOpen) return null;

  return createPortal(
    <div className="conversation-history-overlay" data-testid="conversation-history-overlay">
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={handleDialogKeyDown}
        className="conversation-history-surface ambient-accent-surface border border-zinc-700 bg-zinc-950 text-zinc-100 shadow-2xl"
      >
        <div className="adaptive-context-header flex items-center justify-between gap-3 border-b border-zinc-700/70">
          <h2 id={titleId} className="text-base font-semibold text-zinc-100">
            Conversation history
          </h2>
          <button
            ref={closeRef}
            type="button"
            aria-label="Close conversation history"
            onClick={onClose}
            className="adaptive-context-close rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm font-semibold text-zinc-100 transition hover:bg-zinc-700"
          >
            Close
          </button>
        </div>

        <div className="adaptive-context-content">
          {entries.length === 0 ? (
            <p className="rounded-xl border border-zinc-700/70 bg-zinc-900/55 px-3 py-3 text-sm text-zinc-300">
              No saved conversations yet
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {entries.map((entry) => {
                const isActive = entry.id === activeConversationId;
                return (
                  <li key={entry.id}>
                    <button
                      type="button"
                      onClick={() => handleSelectEntry(entry)}
                      aria-current={isActive ? "true" : undefined}
                      className={`w-full rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                        isActive
                          ? "border-accent-soft/70 bg-zinc-800 text-zinc-100"
                          : "border-zinc-700/70 bg-zinc-900/55 text-zinc-200 hover:bg-zinc-800/70"
                      }`}
                    >
                      <span className="block text-xs font-semibold uppercase tracking-[0.08em] text-zinc-400">
                        {entry.flowLabel} · {formatUpdatedAt(entry.updatedAt)}
                      </span>
                      <span className="mt-1 block truncate">{previewSnippet(entry.hiddenInitialQuestion)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </div>,
    document.body
  );
}
