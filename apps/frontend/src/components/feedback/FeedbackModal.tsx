import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent
} from "react";
import { useFeedbackForm, UNCONFIGURED_HINT } from "../../hooks/useFeedbackForm";
import { useOutsideDismiss } from "../../hooks/useOutsideDismiss";
import { summarizeFeedbackContext } from "../../lib/feedback/summarizeFeedbackContext";
import type { FeedbackCategory } from "../../lib/feedback/submitFeedback";
import type { FeedbackContext } from "../../lib/feedback/types";
import { OverlayCloseButton } from "../OverlayCloseButton";

const CATEGORY_OPTIONS: ReadonlyArray<{ value: FeedbackCategory; label: string }> = [
  { value: "bug", label: "Bug" },
  { value: "suggestion", label: "Suggestion" },
  { value: "other", label: "Other" }
];

const DISCLOSURE_LINE =
  "Your report includes a snapshot of the app's current state (screen, in-progress question, and browser info).";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])'
].join(", ");

export interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  getFeedbackContext: () => FeedbackContext;
  formspreeId: string | null;
}

/**
 * Accessible feedback modal (REQ-087, FLOW-014, NFR-001, NFR-006).
 *
 * The dialog body is a separate component mounted only while open, so the
 * snapshot `useFeedbackForm` captures on mount is the app state at *open* time
 * and every close discards the draft rather than resurrecting a stale one.
 */
export function FeedbackModal({
  isOpen,
  onClose,
  getFeedbackContext,
  formspreeId
}: FeedbackModalProps): JSX.Element | null {
  if (!isOpen) {
    return null;
  }

  return (
    <FeedbackDialog
      onClose={onClose}
      getFeedbackContext={getFeedbackContext}
      formspreeId={formspreeId}
    />
  );
}

type FeedbackDialogProps = Omit<FeedbackModalProps, "isOpen">;

function FeedbackDialog({
  onClose,
  getFeedbackContext,
  formspreeId
}: FeedbackDialogProps): JSX.Element {
  const dialogRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  const form = useFeedbackForm({ getFeedbackContext, formspreeId });
  const summaryLines = summarizeFeedbackContext(form.snapshot);

  const baseId = useId();
  const titleId = `${baseId}-title`;
  const categoryId = `${baseId}-category`;
  const messageId = `${baseId}-message`;
  const messageErrorId = `${baseId}-message-error`;
  const emailId = `${baseId}-email`;
  const emailErrorId = `${baseId}-email-error`;
  const summaryId = `${baseId}-summary`;
  const hintId = `${baseId}-hint`;

  // Focus moves into the dialog on open and returns to whatever opened it on
  // close — the unmount cleanup is the single restore path, so it covers Escape,
  // the close button, and the backdrop alike.
  useEffect(() => {
    returnFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const firstFocusable = dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    (firstFocusable ?? dialogRef.current)?.focus();

    return () => {
      returnFocusRef.current?.focus();
    };
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

  /**
   * Focus trap: Tab off the last focusable element wraps to the first and
   * Shift+Tab off the first wraps to the last, so focus can never escape the
   * dialog while it is open. Anything in between keeps native tab order.
   */
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

  const isSending = form.status === "sending";
  const submitDisabled = form.isUnconfigured || isSending || form.status === "success";

  return (
    <div
      data-testid="feedback-modal-backdrop"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-2 sm:items-center sm:p-4"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={handleTrapKeyDown}
        className="motion-enter max-h-[94dvh] w-full max-w-xl overflow-y-auto rounded-3xl border border-zinc-700 bg-zinc-950 p-4 text-zinc-100 shadow-2xl shadow-black/40"
      >
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent-soft">Feedback</p>
            <h2 id={titleId} className="text-xl font-black text-zinc-100">
              Send feedback
            </h2>
          </div>
          <OverlayCloseButton label="Close feedback" onClick={onClose} />
        </header>

        <form
          className="mt-4 flex flex-col gap-4"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void form.submit();
          }}
        >
          <div className="flex flex-col gap-1">
            <label htmlFor={categoryId} className="text-sm font-semibold text-zinc-300">
              Feedback type
            </label>
            <select
              id={categoryId}
              value={form.category}
              onChange={(event) => form.setCategory(event.target.value as FeedbackCategory)}
              className="motion-focus min-h-[2.75rem] rounded-2xl border border-zinc-700 bg-zinc-900 px-3 text-zinc-100"
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor={messageId} className="text-sm font-semibold text-zinc-300">
              What happened?
            </label>
            <textarea
              id={messageId}
              value={form.message}
              onChange={(event) => form.setMessage(event.target.value)}
              rows={5}
              required
              aria-required="true"
              aria-invalid={form.messageError !== null}
              aria-describedby={form.messageError ? messageErrorId : undefined}
              className="motion-focus min-h-[2.75rem] rounded-2xl border border-zinc-700 bg-zinc-900 p-3 text-zinc-100"
            />
            {form.messageError && (
              <p id={messageErrorId} role="alert" className="text-sm text-red-400">
                {form.messageError}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor={emailId} className="text-sm font-semibold text-zinc-300">
              Reply email (optional)
            </label>
            <input
              id={emailId}
              type="email"
              value={form.email}
              onChange={(event) => form.setEmail(event.target.value)}
              aria-invalid={form.emailError !== null}
              aria-describedby={form.emailError ? emailErrorId : undefined}
              className="motion-focus min-h-[2.75rem] rounded-2xl border border-zinc-700 bg-zinc-900 px-3 text-zinc-100"
            />
            {form.emailError && (
              <p id={emailErrorId} role="alert" className="text-sm text-red-400">
                {form.emailError}
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3">
            <p className="text-sm text-zinc-400">{DISCLOSURE_LINE}</p>
            <button
              type="button"
              aria-expanded={isSummaryExpanded}
              aria-controls={summaryId}
              onClick={() => setIsSummaryExpanded((expanded) => !expanded)}
              className="motion-focus mt-2 min-h-[2.75rem] rounded-2xl border border-zinc-700 bg-zinc-800 px-3 text-sm font-semibold text-zinc-200 hover:bg-zinc-700"
            >
              {isSummaryExpanded ? "Hide app-state details" : "Show app-state details"}
            </button>
            {isSummaryExpanded && (
              <dl id={summaryId} data-testid="feedback-app-state-summary" className="mt-3 grid gap-1 text-sm">
                {summaryLines.map((line) => (
                  <div key={line.label} className="flex flex-wrap gap-2">
                    <dt className="font-semibold text-zinc-400">{line.label}</dt>
                    <dd className="text-zinc-200">{line.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>

          {form.isUnconfigured && (
            <p id={hintId} className="text-sm text-amber-300">
              {UNCONFIGURED_HINT}
            </p>
          )}

          <div className="flex items-center justify-end gap-3">
            <button
              type="submit"
              disabled={submitDisabled}
              aria-describedby={form.isUnconfigured ? hintId : undefined}
              className="motion-press motion-focus min-h-[2.75rem] rounded-2xl bg-accent-strong px-4 font-bold text-accent-contrast disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSending ? "Sending…" : "Send feedback"}
            </button>
          </div>

          <p role="status" aria-live="polite" className="min-h-[1.25rem] text-sm text-zinc-300">
            {statusMessage(form.status, form.failureStatus)}
          </p>
        </form>
      </div>
    </div>
  );
}

function statusMessage(
  status: ReturnType<typeof useFeedbackForm>["status"],
  failureStatus: ReturnType<typeof useFeedbackForm>["failureStatus"]
): string {
  if (status === "sending") {
    return "Sending your feedback…";
  }

  if (status === "success") {
    return "Thanks — your feedback was sent.";
  }

  if (status === "error") {
    return failureStatus === "rate-limit"
      ? "Too many reports just now. Give it a minute and try again — your draft is saved."
      : "We couldn't send that. Check your connection and try again — your draft is saved.";
  }

  return "";
}
