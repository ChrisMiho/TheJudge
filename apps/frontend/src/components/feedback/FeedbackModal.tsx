import { useId, useState } from "react";
import { useFeedbackForm, UNCONFIGURED_HINT } from "../../hooks/useFeedbackForm";
import { summarizeFeedbackContext } from "../../lib/feedback/summarizeFeedbackContext";
import type { FeedbackCategory } from "../../lib/feedback/submitFeedback";
import type { FeedbackContext } from "../../lib/feedback/types";
import { BrandMark } from "../BrandMark";
import { SheetShell } from "../SheetShell";

const CATEGORY_OPTIONS: ReadonlyArray<{ value: FeedbackCategory; label: string; glyph: string }> = [
  { value: "bug", label: "Bug", glyph: "✕" },
  { value: "suggestion", label: "Suggestion", glyph: "✦" },
  { value: "other", label: "Other", glyph: "…" }
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
            <span
              id={categoryGroupId}
              className="text-xs font-semibold uppercase tracking-[0.1em] text-zinc-400"
            >
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
                    // Look-matching pass (slice L): a glyph per type (shell.css:707's
                    // `.fb-pill`) and an outlined/glowing selected state in place of the
                    // previous solid fill, matching the mockup's unfilled, lit pills.
                    className={[
                      "motion-focus motion-press flex min-h-[2.75rem] items-center gap-1.5 rounded-full border px-4 text-sm font-bold transition",
                      selected
                        ? "border-accent-soft bg-accent/15 text-zinc-100 shadow-[0_0_0.875rem_-0.3125rem_rgb(var(--accent)/0.8)]"
                        : "border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
                    ].join(" ")}
                  >
                    <span aria-hidden="true" className="text-accent-soft">{option.glyph}</span>
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            {/* Look-matching pass (slice L, review 1 fix — finding 6): uppercase eyebrow
                label (shell.css's `.fb-field .t`), same accessible text as before. */}
            <label
              htmlFor={messageId}
              className="text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-zinc-400"
            >
              What happened?
            </label>
            <textarea
              id={messageId}
              value={form.message}
              onChange={(event) => form.setMessage(event.target.value)}
              placeholder={MESSAGE_HINT[form.category]}
              rows={4}
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
            {/* Look-matching pass (slice L, review 1 fix — finding 6): uppercase eyebrow
                label (shell.css's `.fb-field .t`), same accessible text as before. */}
            <label
              htmlFor={emailId}
              className="text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-zinc-400"
            >
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
            {/* Look-matching pass (slice L, review 1 fix — finding 6): one true
                single-line row (shell.css:721's `.fb-snap-row`) — the disclosure
                text truncates to one line (`min-w-0 truncate`, the flex item needs
                `min-w-0` for `truncate` to shrink below its content width) and the
                toggle shrinks to a bare chevron, matching the mockup's "◈ … ▾"
                row. The toggle keeps its existing accessible name exactly
                ("Show/Hide app-state details") as a visually-hidden (`sr-only`)
                span — no behaviour change, only the painted row. */}
            <div className="flex items-center justify-between gap-2">
              <p className="min-w-0 flex-1 truncate text-sm text-zinc-400">
                <span aria-hidden="true" className="text-accent-soft">◈</span> {DISCLOSURE_LINE}
              </p>
              <button
                type="button"
                aria-expanded={isSummaryExpanded}
                aria-controls={summaryId}
                onClick={() => setIsSummaryExpanded((expanded) => !expanded)}
                className="motion-focus flex min-h-[2.75rem] shrink-0 items-center justify-center rounded-lg px-2 text-accent-soft hover:bg-zinc-800"
              >
                <span className="sr-only">
                  {isSummaryExpanded ? "Hide app-state details" : "Show app-state details"}
                </span>
                <span aria-hidden="true" className={isSummaryExpanded ? "rotate-180 transition" : "transition"}>
                  ▾
                </span>
              </button>
            </div>
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
