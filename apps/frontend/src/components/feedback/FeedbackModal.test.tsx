import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FeedbackModal } from "./FeedbackModal";
import { summarizeFeedbackContext } from "../../lib/feedback/summarizeFeedbackContext";
import type { FeedbackContext } from "../../lib/feedback/types";
import type {
  FeedbackSubmissionPayload,
  FeedbackSubmissionResult,
  SubmitFeedbackOptions
} from "../../lib/feedback/submitFeedback";

const submitFeedbackMock = vi.hoisted(() =>
  vi.fn(
    async (
      _payload: FeedbackSubmissionPayload,
      _options: SubmitFeedbackOptions
    ): Promise<FeedbackSubmissionResult> => ({ status: "success" })
  )
);

vi.mock("../../lib/feedback/submitFeedback", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../lib/feedback/submitFeedback")>();
  return { ...actual, submitFeedback: submitFeedbackMock };
});

function createContext(): FeedbackContext {
  return {
    activeDestinationId: "mtg-assistant",
    providerMode: "mock",
    environment: {
      userAgent: "Mozilla/5.0 (Test Runner)",
      viewport: { width: 1280, height: 720 },
      route: "/",
      timestamp: 1_700_000_000_000,
      capturedAt: "2023-11-14T22:13:20.000Z",
      buildMode: "test",
      appVersion: "0.0.1"
    },
    flow: {
      screen: "MTG Assistant",
      flowStep: "enrichment",
      question: "Does the trigger still resolve?",
      selectedZones: ["stack"]
    }
  };
}

interface HarnessProps {
  formspreeId?: string | null;
  getFeedbackContext?: () => FeedbackContext;
}

function Harness({
  formspreeId = "abc123",
  getFeedbackContext = () => createContext()
}: HarnessProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setIsOpen(true)}>
        Send feedback
      </button>
      <FeedbackModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        getFeedbackContext={getFeedbackContext}
        formspreeId={formspreeId}
      />
    </>
  );
}

async function open(props: HarnessProps = {}) {
  const user = userEvent.setup();
  render(<Harness {...props} />);
  const opener = screen.getByRole("button", { name: "Send feedback" });
  await user.click(opener);
  return { user, opener, dialog: await screen.findByRole("dialog") };
}

async function fillMessage(user: ReturnType<typeof userEvent.setup>, text: string): Promise<void> {
  await user.type(screen.getByLabelText("What happened?"), text);
}

function submitButton(): HTMLElement {
  return within(screen.getByRole("dialog")).getByRole("button", { name: /^Send feedback$|^Sending/ });
}

beforeEach(() => {
  submitFeedbackMock.mockReset();
  submitFeedbackMock.mockResolvedValue({ status: "success" });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("FeedbackModal", () => {
  it("renders nothing when closed", () => {
    render(
      <FeedbackModal
        isOpen={false}
        onClose={vi.fn()}
        getFeedbackContext={createContext}
        formspreeId="abc123"
      />
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders a labelled modal dialog with the three form controls", async () => {
    const { dialog } = await open();

    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(within(dialog).getByRole("heading", { name: "Send feedback" })).toBeInTheDocument();

    const category = screen.getByLabelText("Feedback type");
    expect(category).toBeInstanceOf(HTMLSelectElement);
    expect(
      Array.from((category as HTMLSelectElement).options).map((option) => option.text)
    ).toEqual(["Bug", "Suggestion", "Other"]);
    expect((category as HTMLSelectElement).value).toBe("bug");

    expect(screen.getByLabelText("What happened?")).toBeRequired();
    expect(screen.getByLabelText("Reply email (optional)")).toBeInTheDocument();
  });

  it("moves focus into the dialog on open and restores it to the opener on close", async () => {
    const { user, opener, dialog } = await open();

    expect(dialog.contains(document.activeElement)).toBe(true);

    await user.click(within(dialog).getByRole("button", { name: "Close feedback" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(document.activeElement).toBe(opener);
  });

  it("closes on Escape and restores focus", async () => {
    const { user, opener } = await open();

    await user.keyboard("{Escape}");

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(document.activeElement).toBe(opener);
  });

  it("traps Tab and Shift+Tab inside the dialog", async () => {
    const { user, dialog } = await open();

    const focusable = Array.from(
      dialog.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    );
    expect(focusable.length).toBeGreaterThan(1);
    const first = focusable[0]!;
    const last = focusable[focusable.length - 1]!;

    // Forward through every focusable element and one step past the end.
    for (let index = 0; index < focusable.length; index += 1) {
      expect(dialog.contains(document.activeElement)).toBe(true);
      await user.tab();
    }
    expect(document.activeElement).toBe(first);

    // Backwards off the first element wraps to the last.
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(last);
    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it("blocks submit with an inline error when the message is only whitespace", async () => {
    const { user } = await open();

    await fillMessage(user, "   ");
    await user.click(submitButton());

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Please describe what happened before sending."
    );
    expect(submitFeedbackMock).not.toHaveBeenCalled();
  });

  it("blocks submit for a malformed email and passes once it is valid", async () => {
    const { user } = await open();

    await fillMessage(user, "The stack resolved backwards.");
    await user.type(screen.getByLabelText("Reply email (optional)"), "nope");
    await user.click(submitButton());

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Enter a valid email address, or leave it blank."
    );
    expect(submitFeedbackMock).not.toHaveBeenCalled();

    await user.clear(screen.getByLabelText("Reply email (optional)"));
    await user.type(screen.getByLabelText("Reply email (optional)"), "player@example.com");
    await user.click(submitButton());

    await waitFor(() => expect(submitFeedbackMock).toHaveBeenCalledTimes(1));
  });

  it("submits with a blank email", async () => {
    const { user } = await open();

    await fillMessage(user, "The stack resolved backwards.");
    await user.click(submitButton());

    await waitFor(() => expect(submitFeedbackMock).toHaveBeenCalledTimes(1));
    expect(submitFeedbackMock.mock.calls[0]?.[0]).not.toHaveProperty("email");
  });

  it("always shows the disclosure line and reveals the summary on demand", async () => {
    const { user } = await open();

    expect(screen.getByText(/includes a snapshot of the app's current state/i)).toBeInTheDocument();
    expect(screen.queryByTestId("feedback-app-state-summary")).not.toBeInTheDocument();

    const toggle = screen.getByRole("button", { name: "Show app-state details" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    await user.click(toggle);

    const summary = screen.getByTestId("feedback-app-state-summary");
    for (const line of summarizeFeedbackContext(createContext())) {
      expect(within(summary).getByText(line.label)).toBeInTheDocument();
    }
    expect(screen.getByRole("button", { name: "Hide app-state details" })).toHaveAttribute(
      "aria-expanded",
      "true"
    );
  });

  it("shows the user exactly the snapshot it serializes into appState", async () => {
    const { user } = await open();

    await user.click(screen.getByRole("button", { name: "Show app-state details" }));
    const summary = screen.getByTestId("feedback-app-state-summary");
    const shownRows = Array.from(summary.querySelectorAll("div")).map((row) =>
      Array.from(row.children).map((cell) => cell.textContent)
    );

    await fillMessage(user, "The stack resolved backwards.");
    await user.click(submitButton());

    await waitFor(() => expect(submitFeedbackMock).toHaveBeenCalledTimes(1));

    const appState = submitFeedbackMock.mock.calls[0]?.[0]?.appState;
    expect(typeof appState).toBe("string");

    const deliveredRows = summarizeFeedbackContext(JSON.parse(appState as string)).map((line) => [
      line.label,
      line.value
    ]);
    expect(shownRows).toEqual(deliveredRows);
  });

  it("runs the idle → sending → success lifecycle", async () => {
    let resolveSubmit: ((result: FeedbackSubmissionResult) => void) | undefined;
    submitFeedbackMock.mockImplementation(
      () =>
        new Promise<FeedbackSubmissionResult>((resolve) => {
          resolveSubmit = resolve;
        })
    );

    const { user } = await open();
    await fillMessage(user, "The stack resolved backwards.");
    await user.click(submitButton());

    expect(await screen.findByText("Sending your feedback…")).toBeInTheDocument();
    expect(submitButton()).toBeDisabled();

    resolveSubmit?.({ status: "success" });

    expect(await screen.findByText("Thanks — your feedback was sent.")).toBeInTheDocument();
  });

  it("shows an inline error and preserves the draft when delivery fails", async () => {
    submitFeedbackMock.mockResolvedValue({ status: "network-error" });

    const { user } = await open();

    await user.selectOptions(screen.getByLabelText("Feedback type"), "suggestion");
    await fillMessage(user, "Everything is on fire.");
    await user.type(screen.getByLabelText("Reply email (optional)"), "player@example.com");
    await user.click(submitButton());

    expect(await screen.findByText(/We couldn't send that/)).toBeInTheDocument();
    expect(screen.getByLabelText("Feedback type")).toHaveValue("suggestion");
    expect(screen.getByLabelText("What happened?")).toHaveValue("Everything is on fire.");
    expect(screen.getByLabelText("Reply email (optional)")).toHaveValue("player@example.com");
    expect(submitButton()).toBeEnabled();
  });

  it("reports a rate-limit failure with its own message", async () => {
    submitFeedbackMock.mockResolvedValue({ status: "rate-limit" });

    const { user } = await open();
    await fillMessage(user, "Too fast.");
    await user.click(submitButton());

    expect(await screen.findByText(/Too many reports just now/)).toBeInTheDocument();
  });

  it("disables submit with a hint and never calls delivery when no form id is configured", async () => {
    const { user } = await open({ formspreeId: null });

    await fillMessage(user, "The stack resolved backwards.");

    expect(submitButton()).toBeDisabled();
    expect(screen.getByText(/isn’t configured in this build/)).toBeInTheDocument();

    await user.click(submitButton());

    expect(submitFeedbackMock).not.toHaveBeenCalled();
  });
});
