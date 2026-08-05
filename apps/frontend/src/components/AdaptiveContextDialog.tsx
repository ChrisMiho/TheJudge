import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";

type AdaptiveContextDialogProps = {
  triggerLabel: string;
  dialogLabel: string;
  children: ReactNode;
};

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])'
].join(",");

export function AdaptiveContextDialog({
  triggerLabel,
  dialogLabel,
  children
}: AdaptiveContextDialogProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const titleId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      closeRef.current?.focus();
      return;
    }

    restoreFocusRef.current?.focus();
    restoreFocusRef.current = null;
  }, [isOpen]);

  function openDialog(): void {
    restoreFocusRef.current = triggerRef.current;
    setIsOpen(true);
  }

  function closeDialog(): void {
    setIsOpen(false);
  }

  function handleDialogKeyDown(event: KeyboardEvent<HTMLElement>): void {
    if (event.key === "Escape") {
      event.preventDefault();
      closeDialog();
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

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={`View context: ${triggerLabel}`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={openDialog}
        className="adaptive-context-trigger ambient-accent-surface ambient-accent-interactive w-full rounded-xl border border-zinc-700/70 bg-zinc-900/55 px-4 py-3 text-left text-sm font-semibold text-zinc-100"
      >
        <span className="block text-xs font-semibold uppercase tracking-[0.08em] text-zinc-400">
          View context
        </span>
        <span className="mt-1 block">{triggerLabel}</span>
      </button>

      {isOpen &&
        createPortal(
          // DEC-142/REQ-117: activating the dimmed scrim (this root, outside the panel
          // surface) closes the dialog via the same closeDialog path as Close/Escape.
          // The surface below stops propagation so clicks inside it never reach this handler.
          <div
            className="adaptive-context-overlay"
            data-testid="adaptive-context-overlay"
            onClick={closeDialog}
          >
            <section
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              tabIndex={-1}
              data-accent-current="true"
              onKeyDown={handleDialogKeyDown}
              onClick={(event) => event.stopPropagation()}
              className="adaptive-context-surface ambient-accent-surface border border-zinc-700 bg-zinc-950 text-zinc-100 shadow-2xl"
            >
              <div className="adaptive-context-header flex items-center justify-between gap-3 border-b border-zinc-700/70">
                <h2 id={titleId} className="text-base font-semibold text-zinc-100">
                  {dialogLabel}
                </h2>
                <button
                  ref={closeRef}
                  type="button"
                  aria-label={`Close ${dialogLabel.toLocaleLowerCase()}`}
                  onClick={closeDialog}
                  className="adaptive-context-close rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm font-semibold text-zinc-100 transition hover:bg-zinc-700"
                >
                  Close
                </button>
              </div>
              <div className="adaptive-context-content">{children}</div>
            </section>
          </div>,
          document.body
        )}
    </>
  );
}
