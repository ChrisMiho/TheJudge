import { useId, useState } from "react";
import { useFeedbackForm, UNCONFIGURED_HINT } from "../../hooks/useFeedbackForm";
import { summarizeFeedbackContext } from "../../lib/feedback/summarizeFeedbackContext";
import type { FeedbackCategory } from "../../lib/feedback/submitFeedback";
import type { FeedbackContext } from "../../lib/feedback/types";
import { BrandMark } from "../BrandMark";
import { SheetShell } from "../SheetShell";

const CATEGORY_OPTIONS: ReadonlyArray<{ value: FeedbackCategory; label: string }> = [
  { value: "bug", label: "Bug" },
  { value: "suggestion", label: "Suggestion" },
  { value: "other", label: "Other" }
];

const MESSAGE_HINT: Record<FeedbackCategory, string> = {
  bug: "What went wrong?",
  suggestion: "What would make this better?",
  other: "What's on your mind?"
};

const DISCLOSURE_LINE =
  "Your report includes a snapshot of the app's current state (screen, in-progress question, and browser info).";

export interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  getFeedbackContext: () => FeedbackContext;
  formspreeId: string | null;
}

/**
 * Accessible feedback sheet (REQ-087, REQ-208, FLOW-014, NFR-001, NFR-006), hosted on the
 * shared `SheetShell`. The feedback type is three pills, the app-state disclosure folds
 * behind one dashed row, and a successful send swaps the form for a thank-you under the
 * app's own mark.
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
    <FeedbackDialog onClose={onClose} getFeedbackContext={getFeedbackContext} formspreeId={formspreeId} />
  );
}

type FeedbackDialogProps = Omit<FeedbackModalProps, "isOpen">;

function FeedbackDialog({ onClose, getFeedbackContext, formspreeId }: FeedbackDialogProps): JSX.Element {
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  const form = useFeedbackForm({ getFeedbackContext, formspreeId });
  const summaryLines = summarizeFeedbackContext(form.snapshot);

  const baseId = useId();
  const titleId = `${baseId}-title`;
  const categoryGroupId = `${baseId}-category`;
  const messageId = `${baseId}-message`;
  const messageErrorId = `${baseId}-message-error`;
  const emailId = `${baseId}-email`;
  const emailErrorId = `${baseId}-email-error`;
  const summaryId = `${baseId}-summary`;
  const hintId = `${baseId}-hint`;

  const isSending = form.status === "sending";
  const isSuccess = form.status === "success";
  const submitDisabled = form.isUnconfigured || isSending || isSuccess;

  return (
    <SheetShell
      isOpen
      onClose={onClose}
      closeLabel="Close feedback"
      titleId={titleId}
      testId="feedback-sheet"
      head={
        <>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent-soft">Feedback</p>
          <h2 id={titleId} className="text-xl font-black text-zinc-100">
            Send feedback
          </h2>
        </>
      }
      foot={
        isSuccess ? undefined : (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                form={`${baseId}-form`}
                onClick={() => void form.submit()}
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
          </div>
        )
      }
    >
      {isSuccess ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center" data-testid="feedback-success">
          <BrandMark />
          <p role="status" aria-live="polite" className="text-base font-semibold text-zinc-100">
            {statusMessage(form.status, form.failureStatus)}
          </p>
        </div>
      ) : (
        <form
          id={`${baseId}-form`}
          className="flex flex-col gap-4"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void form.submit();
          }}
        >
          <div className="flex flex-col gap-1">
            <span id={categoryGroupId} className="text-sm font-semibold text-zinc-300">
              Feedback type
            </span>
            <div role="group" aria-labelledby={categoryGroupId} className="flex flex-wrap gap-2">
              {CATEGORY_OPTIONS.map((option) => {
                const selected = form.category === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => form.setCategory(option.value)}
                    className={[
                      "motion-focus motion-press min-h-[2.75rem] rounded-full border px-4 text-sm font-bold transition",
                      selected
                        ? "border-accent bg-accent-strong text-accent-contrast"
                        : "border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
                    ].join(" ")}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor={messageId} className="text-sm font-semibold text-zinc-300">
              What happened?
            </label>
            <textarea
              id={messageId}
              value={form.message}
              onChange={(event) => form.setMessage(event.target.value)}
              placeholder={MESSAGE_HINT[form.category]}
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

          <div
            data-testid="feedback-snapshot-row"
            className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/40 p-3"
          >
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
        </form>
      )}
    </SheetShell>
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
