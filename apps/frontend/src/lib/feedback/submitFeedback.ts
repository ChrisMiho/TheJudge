const FORMSPREE_ENDPOINT_PREFIX = "https://formspree.io/f/";
const RATE_LIMIT_STATUS = 429;

export type FeedbackCategory = "bug" | "suggestion" | "other";

export interface FeedbackSubmissionPayload {
  category: FeedbackCategory;
  message: string;
  email?: string;
  /** JSON-stringified app-state snapshot, already serialized by the caller. */
  appState: string;
}

export interface SubmitFeedbackOptions {
  formspreeId: string | null;
  fetchImpl?: typeof fetch;
}

export type FeedbackSubmissionStatus = "success" | "network-error" | "rate-limit" | "unconfigured";

export interface FeedbackSubmissionResult {
  status: FeedbackSubmissionStatus;
}

/**
 * Delivers a feedback submission to Formspree (DEC-105, REQ-088).
 *
 * Never throws: transport failures and non-ok responses are folded into the returned
 * status. When no form id is configured the call is a graceful no-op and performs zero
 * network requests.
 */
export async function submitFeedback(
  payload: FeedbackSubmissionPayload,
  options: SubmitFeedbackOptions
): Promise<FeedbackSubmissionResult> {
  const { formspreeId, fetchImpl } = options;

  if (!formspreeId) {
    return { status: "unconfigured" };
  }

  const body: Record<string, string> = {
    category: payload.category,
    message: payload.message,
    appState: payload.appState,
  };

  const email = payload.email?.trim();
  if (email) {
    body.email = email;
  }

  const doFetch = fetchImpl ?? globalThis.fetch;

  try {
    const response = await doFetch(`${FORMSPREE_ENDPOINT_PREFIX}${formspreeId}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (response.ok) {
      return { status: "success" };
    }

    if (response.status === RATE_LIMIT_STATUS) {
      return { status: "rate-limit" };
    }

    return { status: "network-error" };
  } catch {
    return { status: "network-error" };
  }
}
