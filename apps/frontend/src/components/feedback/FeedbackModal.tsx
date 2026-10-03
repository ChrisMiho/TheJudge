import { Fragment, useId, useState } from "react";
import { useFeedbackForm, UNCONFIGURED_HINT } from "../../hooks/useFeedbackForm";
import { summarizeFeedbackContext } from "../../lib/feedback/summarizeFeedbackContext";
import type { FeedbackCategory } from "../../lib/feedback/submitFeedback";
import type { FeedbackContext } from "../../lib/feedback/types";
import { SheetShell } from "../SheetShell";

const CATEGORY_OPTIONS: ReadonlyArray<{ value: FeedbackCategory; label: string; glyph: string }> = [
  { value: "bug", label: "Bug", glyph: "✕" },
  { value: "suggestion", label: "Suggestion", glyph: "✦" },
  { value: "other", label: "Other", glyph: "…" }
];

const MESSAGE_HINT: Record<FeedbackCategory, string> = {
  bug: "What went wrong, and what did you expect to happen?",
  suggestion: "What would make TheJudge better?",
  other: "What's on your mind?"
};

const MESSAGE_LABEL: Record<FeedbackCategory, string> = {
  bug: "What happened?",
  suggestion: "What's your idea?",
  other: "What would you like to tell us?"
};

const DISCLOSURE_LINE = "Your report includes a snapshot of the app right now";

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
  const messageId = `${baseId}-message`;
  const messageErrorId = `${baseId}-message-error`;
  const emailId = `${baseId}-email`;
  const emailErrorId = `${baseId}-email-error`;
  const summaryId = `${baseId}-summary`;
  const hintId = `${baseId}-hint`;

  const isSending = form.status === "sending";
  const isSuccess = form.status === "success";
  const submitDisabled = form.isUnconfigured || isSending || isSuccess;

  const heading = isSuccess ? "Thanks — your feedback was sent." : "Send feedback";

  return (
    <SheetShell
      isOpen
      onClose={onClose}
      closeLabel="Close feedback"
      titleId={titleId}
      panelId="feedback-modal"
      panelClassName="feedback-panel"
      testId="feedback-sheet"
    >
      {isSuccess ? (
        <div className="fb-done" data-testid="feedback-success">
          <span className="seal" aria-hidden="true" />
          <h2 id={titleId} role="status" aria-live="polite">
            {heading}
          </h2>
          <p>The team reads every report. If you left an email, a reply comes there.</p>
          <button type="button" className="btn" onClick={onClose}>
            Done
          </button>
        </div>
      ) : (
        <form
          id={`${baseId}-form`}
          className="fb-form"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void form.submit();
          }}
        >
          <div className="fb-head">
            <small>Feedback</small>
            <h2 id={titleId}>{heading}</h2>
          </div>

          <div className="fb-kind" role="group" aria-label="Feedback type">
            {CATEGORY_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className="fb-pill"
                aria-pressed={form.category === option.value}
                onClick={() => form.setCategory(option.value)}
              >
                <span aria-hidden="true" className="glyph">
                  {option.glyph}
                </span>
                {option.label}
              </button>
            ))}
          </div>

          <div className="fb-field" data-invalid={form.messageError !== null ? "true" : undefined}>
            <label htmlFor={messageId} className="t">
              {MESSAGE_LABEL[form.category]}
            </label>
            <textarea
              id={messageId}
              className="field"
              data-autofocus=""
              value={form.message}
              onChange={(event) => form.setMessage(event.target.value)}
              placeholder={MESSAGE_HINT[form.category]}
              rows={4}
              maxLength={2000}
              required
              aria-required="true"
              aria-invalid={form.messageError !== null}
              aria-describedby={form.messageError ? messageErrorId : undefined}
            />
            {form.messageError && (
              <span id={messageErrorId} role="alert" className="fb-err">
                {form.messageError}
              </span>
            )}
          </div>

          <div className="fb-field" data-invalid={form.emailError !== null ? "true" : undefined}>
            <label htmlFor={emailId} className="t">
              Reply email <small>optional</small>
            </label>
            <input
              id={emailId}
              className="field"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              value={form.email}
              onChange={(event) => form.setEmail(event.target.value)}
              aria-invalid={form.emailError !== null}
              aria-describedby={form.emailError ? emailErrorId : undefined}
            />
            {form.emailError && (
              <span id={emailErrorId} role="alert" className="fb-err">
                {form.emailError}
              </span>
            )}
          </div>

          <div className="fb-snapshot" data-testid="feedback-snapshot-row">
            <button
              type="button"
              className="fb-snap-row"
              aria-expanded={isSummaryExpanded}
              aria-controls={summaryId}
              onClick={() => setIsSummaryExpanded((expanded) => !expanded)}
            >
              <span>
                <span aria-hidden="true" className="glyph">
                  ◈
                </span>{" "}
                {DISCLOSURE_LINE}
              </span>
              <span aria-hidden="true" className="chev">
                ▾
              </span>
              <span className="sr-only">
                {isSummaryExpanded ? "Hide app-state details" : "Show app-state details"}
              </span>
            </button>
            {isSummaryExpanded && (
              <dl id={summaryId} className="fb-snap-list" data-testid="feedback-app-state-summary">
                {summaryLines.map((line) => (
                  <Fragment key={line.label}>
                    <dt>{line.label}</dt>
                    <dd>{line.value}</dd>
                  </Fragment>
                ))}
              </dl>
            )}
          </div>

          {form.isUnconfigured && (
            <p id={hintId} className="fb-err">
              {UNCONFIGURED_HINT}
            </p>
          )}

          <div className="fb-foot">
            <span className="fb-note" role="status" aria-live="polite">
              {statusMessage(form.status, form.failureStatus) || "Sent to the team, not to a public board."}
            </span>
            <button
              type="submit"
              className="btn primary"
              disabled={submitDisabled}
              aria-describedby={form.isUnconfigured ? hintId : undefined}
            >
              {isSending ? "Sending…" : "Send feedback"}
            </button>
          </div>
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
