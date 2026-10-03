import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
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

const SheetCloseContext = createContext<(() => void) | null>(null);

/** The close handler of the sheet this component renders inside, or `null` outside a sheet — so a foot
 * bar written by a sheet's body (Life Tracker's Done) can close it without the host passing it down. */
export function useSheetClose(): (() => void) | null {
  return useContext(SheetCloseContext);
}

export interface SheetShellProps {
  /** Mount-gate: SheetShell renders nothing while closed, matching the suite's other
   * overlay adopters (FeedbackModal, AdaptiveContextDialog) — a fresh mount each open
   * means any per-open state inside `children` starts clean. */
  isOpen: boolean;
  onClose: () => void;
  /** Accessible name for the fixed ✕ control, e.g. "Close feedback". */
  closeLabel: string;
  /** Id of the element inside the sheet that carries the visible title, wired to
   * `aria-labelledby` here so the caller never repeats the id wiring. */
  titleId: string;
  /** The ported stylesheet keys some sheets by id (`#feedback-modal`, `#history-drawer`). */
  panelId?: string;
  /** The ✕ close control (default true). The confirm sheet has none: Keep, Esc and the backdrop dismiss it. */
  showCloseButton?: boolean;
  /** The sheet's modifier class beside `drawer-panel` (`feedback-panel`, `history-panel`,
   * `detail-panel`, `confirm-panel`) — a variant extends the shared sheet, never forks it. */
  panelClassName?: string;
  /** The sheet's own inner markup, in the mockup's DOM order. */
  children: ReactNode;
  /** Legacy head/foot regions (pre-port callers still composing a head + body + foot):
   * rendered above and below `children`. Ported sheets leave both unset. */
  head?: ReactNode;
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
 *
 * Look-matching pass (slice L): `.sheet-shell-overlay`/`.sheet-shell-surface`
 * (index.css) take the mockup's glass shell — backdrop blur, a corner accent
 * glow, an accent-soft hairline border, and a mobile grab handle — with no
 * markup change here; every adopter (`CardDetailPopup`, `FeedbackModal`,
 * `ConversationHistoryDrawer`, `ConfirmSheet`) inherits it for free.
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
  panelId,
  showCloseButton = true,
  panelClassName,
  head,
  children,
  foot,
  testId
}: SheetShellDialogProps): JSX.Element {
  const dialogRef = useRef<HTMLElement>(null);
  // The ported stylesheet slides/fades a sheet in on `data-open`; it flips to true one frame after mount.
  const [isShown, setIsShown] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsShown(true));
    return () => cancelAnimationFrame(frame);
  }, []);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    returnFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    // A control marked `data-autofocus` (the feedback message box) takes focus first,
    // as the mockup's sheets do; otherwise the first focusable control does.
    const firstFocusable =
      dialogRef.current?.querySelector<HTMLElement>("[data-autofocus]") ??
      dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
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

  const handleTrapKeyDown = useCallback((event: ReactKeyboardEvent<HTMLElement>) => {
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
    <SheetCloseContext.Provider value={onClose}>
      <div
        aria-hidden="true"
        className="sheet-backdrop"
        data-open={isShown}
        data-testid={testId ? `${testId}-overlay` : "sheet-shell-overlay"}
      />
      <aside
        ref={dialogRef}
        id={panelId}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={handleTrapKeyDown}
        data-testid={testId ?? "sheet-shell"}
        data-open={isShown}
        className={panelClassName ? `drawer-panel ${panelClassName}` : "drawer-panel"}
      >
        {showCloseButton ? <OverlayCloseButton label={closeLabel} onClick={onClose} /> : null}
        {head ? <div className="sheet-legacy-head">{head}</div> : null}
        {head || foot ? <div className="sheet-legacy-body">{children}</div> : children}
        {foot ? <div className="sheet-legacy-foot">{foot}</div> : null}
      </aside>
    </SheetCloseContext.Provider>,
    document.body
  );
}
