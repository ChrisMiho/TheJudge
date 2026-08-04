import { useCallback, useMemo, useState } from "react";
import type { FeedbackContext } from "../lib/feedback/types";
import {
  submitFeedback as defaultSubmitFeedback,
  type FeedbackCategory,
  type FeedbackSubmissionStatus
} from "../lib/feedback/submitFeedback";

/**
 * Deliberately permissive: this gate exists to catch obvious typos in an
 * *optional* reply address, not to adjudicate RFC 5322. Anything stricter risks
 * rejecting a real address and losing the feedback entirely.
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const MESSAGE_REQUIRED_ERROR = "Please describe what happened before sending.";
export const EMAIL_FORMAT_ERROR = "Enter a valid email address, or leave it blank.";
export const UNCONFIGURED_HINT =
  "Feedback delivery isn’t configured in this build, so sending is unavailable right now.";

export type FeedbackFormStatus = "idle" | "sending" | "success" | "error";

export type FeedbackSubmitFn = typeof defaultSubmitFeedback;

export interface UseFeedbackFormOptions {
  /**
   * Reader for the app-state snapshot. Called exactly once, on mount, so the
   * summary the user expands and the `appState` string that is delivered come
   * from the same capture (REQ-087/REQ-088).
   */
  getFeedbackContext: () => FeedbackContext;
  /** `null` when no Formspree form id is configured for this build. */
  formspreeId: string | null;
  /** Injection seam for tests; defaults to the real Slice C delivery function. */
  submitImpl?: FeedbackSubmitFn;
}

export interface UseFeedbackFormResult {
  category: FeedbackCategory;
  setCategory: (category: FeedbackCategory) => void;
  message: string;
  setMessage: (message: string) => void;
  email: string;
  setEmail: (email: string) => void;
  status: FeedbackFormStatus;
  /** Delivery status behind an `error` form status, for a specific inline message. */
  failureStatus: FeedbackSubmissionStatus | null;
  messageError: string | null;
  emailError: string | null;
  /** True when no form id is configured — submit is disabled with a hint instead. */
  isUnconfigured: boolean;
  canSubmit: boolean;
  /** The one snapshot backing both the disclosure summary and `appState`. */
  snapshot: FeedbackContext;
  /** `JSON.stringify(snapshot)` — exactly what is sent as `appState`. */
  serializedAppState: string;
  submit: () => Promise<void>;
}

/**
 * Field state, validation, and the submit lifecycle for the feedback modal
 * (REQ-087). Validation messages stay hidden until the first submit attempt so
 * an untouched form never greets the user with errors.
 *
 * On a failed delivery the draft is left completely untouched — category,
 * message, and email survive so the user can retry without retyping.
 */
export function useFeedbackForm({
  getFeedbackContext,
  formspreeId,
  submitImpl = defaultSubmitFeedback
}: UseFeedbackFormOptions): UseFeedbackFormResult {
  const [category, setCategory] = useState<FeedbackCategory>("bug");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<FeedbackFormStatus>("idle");
  const [failureStatus, setFailureStatus] = useState<FeedbackSubmissionStatus | null>(null);
  const [hasAttempted, setHasAttempted] = useState(false);

  // Captured once, lazily, on mount: the modal mounts this hook when it opens,
  // so the snapshot is the app state at open time and cannot drift between the
  // summary the user reads and the payload that is delivered.
  const [snapshot] = useState<FeedbackContext>(getFeedbackContext);
  const serializedAppState = useMemo(() => JSON.stringify(snapshot), [snapshot]);

  const trimmedMessage = message.trim();
  const trimmedEmail = email.trim();

  const messageProblem = trimmedMessage.length === 0 ? MESSAGE_REQUIRED_ERROR : null;
  const emailProblem =
    trimmedEmail.length > 0 && !EMAIL_PATTERN.test(trimmedEmail) ? EMAIL_FORMAT_ERROR : null;

  const isUnconfigured = formspreeId === null;
  const canSubmit = !isUnconfigured && status !== "sending" && status !== "success";

  const submit = useCallback(async () => {
    setHasAttempted(true);

    if (isUnconfigured || status === "sending") {
      return;
    }

    if (trimmedMessage.length === 0) {
      return;
    }

    if (trimmedEmail.length > 0 && !EMAIL_PATTERN.test(trimmedEmail)) {
      return;
    }

    setStatus("sending");
    setFailureStatus(null);

    const result = await submitImpl(
      {
        category,
        message: trimmedMessage,
        ...(trimmedEmail.length > 0 ? { email: trimmedEmail } : {}),
        appState: serializedAppState
      },
      { formspreeId }
    );

    if (result.status === "success") {
      setStatus("success");
      return;
    }

    // Draft is intentionally left as-is so the user can retry.
    setFailureStatus(result.status);
    setStatus("error");
  }, [
    category,
    formspreeId,
    isUnconfigured,
    serializedAppState,
    status,
    submitImpl,
    trimmedEmail,
    trimmedMessage
  ]);

  return {
    category,
    setCategory,
    message,
    setMessage,
    email,
    setEmail,
    status,
    failureStatus,
    messageError: hasAttempted ? messageProblem : null,
    emailError: hasAttempted ? emailProblem : null,
    isUnconfigured,
    canSubmit,
    snapshot,
    serializedAppState,
    submit
  };
}
