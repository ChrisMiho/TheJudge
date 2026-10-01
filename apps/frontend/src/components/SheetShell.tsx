import {
  useCallback,
  useEffect,
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode
} from "react";
import { createPortal } from "react-dom";
import { useOutsideDismiss } from "../hooks/useOutsideDismiss";
import { OverlayCloseButton } from "./OverlayCloseButton";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])'
].join(", ");

export interface SheetShellProps {
  /** Mount-gate: SheetShell renders nothing while closed, matching the suite's other
   * overlay adopters (FeedbackModal, AdaptiveContextDialog) — a fresh mount each open
   * means any per-open state inside `children` starts clean. */
  isOpen: boolean;
  onClose: () => void;
  /** Accessible name for the fixed ✕ control, e.g. "Close feedback". */
  closeLabel: string;
  /** Id placed on the element inside `head` that carries the visible title, wired to
   * `aria-labelledby` here so the caller never repeats the id wiring. */
  titleId: string;
  /** Fixed head region content (to the left of the ✕), e.g. an eyebrow + heading. */
  head?: ReactNode;
  /** Scrolling body content. */
  children: ReactNode;
  /** Fixed foot region content (actions). Omitted entirely when not supplied — no
   * empty foot band renders. */
  foot?: ReactNode;
  testId?: string;
}

/**
 * The suite's one shared pop-up shell (REQ-208): a bottom sheet below the
 * `--sheet-breakpoint` token (600px) and a floating card centred in the viewport from
 * it up, with a fixed head and foot and a scrolling body. Hosts card detail (REQ-128),
 * Question History (REQ-213), the printing picker (REQ-065), Send feedback (REQ-087)
 * and the confirm sheet (`ConfirmSheet`) — one component, no per-overlay fork.
 *
 * Portaled to `document.body`, like the overlay family it replaces (REQ-142's close
 * control, REQ-143's focus trap/outside-dismiss/Escape/focus-restore, all reused here
 * rather than re-implemented per adopter).
 */
export function SheetShell(props: SheetShellProps): JSX.Element | null {
  if (!props.isOpen) {
    return null;
  }

  return <SheetShellDialog {...props} />;
}

type SheetShellDialogProps = Omit<SheetShellProps, "isOpen">;

function SheetShellDialog({
  onClose,
  closeLabel,
  titleId,
  head,
  children,
  foot,
  testId
}: SheetShellDialogProps): JSX.Element {
  const dialogRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    returnFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const firstFocusable = dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    (firstFocusable ?? dialogRef.current)?.focus();

    return () => {
      returnFocusRef.current?.focus();
    };
    // Open-once mount effect, matching FeedbackModal: intentionally runs only on mount/unmount.
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useOutsideDismiss([dialogRef], onClose, true);

  const handleTrapKeyDown = useCallback((event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Tab") {
      return;
    }

    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
    if (focusable.length === 0) {
      event.preventDefault();
      dialog.focus();
      return;
    }

    const first = focusable[0]!;
    const last = focusable[focusable.length - 1]!;
    const active = document.activeElement;
    const isInside = active instanceof HTMLElement && dialog.contains(active);

    if (event.shiftKey) {
      if (!isInside || active === first) {
        event.preventDefault();
        last.focus();
      }
      return;
    }

    if (!isInside || active === last) {
      event.preventDefault();
      first.focus();
    }
  }, []);

  return createPortal(
    <div className="sheet-shell-overlay" data-testid={testId ? `${testId}-overlay` : "sheet-shell-overlay"}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={handleTrapKeyDown}
        data-testid={testId ?? "sheet-shell"}
        className="sheet-shell-surface ambient-accent-surface border border-zinc-700 bg-zinc-950 text-zinc-100 shadow-2xl"
      >
        <div className="sheet-shell-head" data-testid={testId ? `${testId}-head` : "sheet-shell-head"}>
          <div className="min-w-0 flex-1">{head}</div>
          <OverlayCloseButton label={closeLabel} onClick={onClose} />
        </div>
        <div className="sheet-shell-body" data-testid={testId ? `${testId}-body` : "sheet-shell-body"}>
          {children}
        </div>
        {foot ? (
          <div className="sheet-shell-foot" data-testid={testId ? `${testId}-foot` : "sheet-shell-foot"}>
            {foot}
          </div>
        ) : null}
      </div>
    </div>,
    document.body
  );
}
