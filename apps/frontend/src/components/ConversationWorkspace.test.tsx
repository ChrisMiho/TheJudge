import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ConversationWorkspace } from "./ConversationWorkspace";

afterEach(cleanup);

describe("Frontend - Conversation workspace", () => {
  it("owns the stable answered-state rows and preserves flow callbacks", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn(async () => undefined);
    const onFollowUp = vi.fn(async () => undefined);
    const onStartOver = vi.fn();

    render(
      <ConversationWorkspace
        messages={[{ role: "assistant", content: "Initial answer" }]}
        context={{
          triggerLabel: "Combat · 1 populated zone",
          dialogLabel: "Frozen game context",
          content: <p>Read-only context</p>
        }}
        pendingFeedback={<p>Consulting the stack…</p>}
        error="Provider unavailable"
        canRetry
        retryLabel="Retry"
        onRetry={onRetry}
        isFollowUpSubmitting={false}
        onFollowUp={onFollowUp}
        onStartOver={onStartOver}
        showStartOver
        newResponseControl={<button type="button">New response</button>}
        statusMessage="Ready for follow-ups"
      />
    );

    const workspace = screen.getByTestId("conversation-workspace");
    expect(workspace).toHaveClass("conversation-workspace");
    expect(
      within(workspace).getByRole("button", {
        name: "View context: Combat · 1 populated zone"
      })
    ).toBeInTheDocument();
    expect(within(workspace).getByText("Initial answer")).toBeInTheDocument();
    expect(within(workspace).getByText("Consulting the stack…")).toBeInTheDocument();
    expect(within(workspace).getByRole("button", { name: "New response" })).toBeInTheDocument();
    expect(within(workspace).getByText("Provider unavailable")).toBeInTheDocument();
    expect(within(workspace).getByText("Ready for follow-ups")).toBeInTheDocument();

    const composer = within(workspace).getByRole("textbox", { name: "Follow-up question" });
    expect(composer.closest("form")).not.toHaveClass("fixed");
    await user.type(composer, "What happens next?");
    await user.click(within(workspace).getByRole("button", { name: "Send" }));
    expect(onFollowUp).toHaveBeenCalledWith("What happens next?");

    await user.click(within(workspace).getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalledOnce();
    await user.click(within(workspace).getByRole("button", { name: "Start Over" }));
    expect(onStartOver).toHaveBeenCalledOnce();
  });

  it("omits optional context, feedback, history trigger, and Start Over rows without empty containers", () => {
    render(
      <ConversationWorkspace
        messages={[{ role: "assistant", content: "Cardless answer" }]}
        error={null}
        canRetry={false}
        retryLabel="Retry"
        onRetry={vi.fn(async () => undefined)}
        isFollowUpSubmitting={false}
        onFollowUp={vi.fn(async () => undefined)}
        onStartOver={vi.fn()}
        showStartOver={false}
      />
    );

    const workspace = screen.getByTestId("conversation-workspace");
    expect(within(workspace).queryByText("View context")).not.toBeInTheDocument();
    expect(within(workspace).queryByText("Conversation history")).not.toBeInTheDocument();
    expect(within(workspace).queryByRole("dialog")).not.toBeInTheDocument();
    expect(within(workspace).queryByRole("button", { name: "Start Over" })).not.toBeInTheDocument();
    expect(within(workspace).getByText("Cardless answer")).toBeInTheDocument();
  });

  it("renders a full-width history trigger above the context trigger when provided", async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();

    render(
      <ConversationWorkspace
        messages={[{ role: "assistant", content: "Cardless answer" }]}
        historyTrigger={{ label: "In-Depth Question", onOpen }}
        context={{
          triggerLabel: "Combat · 1 populated zone",
          dialogLabel: "Frozen game context",
          content: <p>Read-only context</p>
        }}
        error={null}
        canRetry={false}
        retryLabel="Retry"
        onRetry={vi.fn(async () => undefined)}
        isFollowUpSubmitting={false}
        onFollowUp={vi.fn(async () => undefined)}
        onStartOver={vi.fn()}
        showStartOver={false}
      />
    );

    const workspace = screen.getByTestId("conversation-workspace");
    const buttons = within(workspace).getAllByRole("button");
    const historyTriggerButton = within(workspace).getByRole("button", { name: /Conversation history/ });
    const contextTriggerButton = within(workspace).getByRole("button", {
      name: "View context: Combat · 1 populated zone"
    });

    expect(buttons.indexOf(historyTriggerButton)).toBeLessThan(buttons.indexOf(contextTriggerButton));

    await user.click(historyTriggerButton);
    expect(onOpen).toHaveBeenCalledOnce();
  });

  it("preserves a typed composer draft when New response focuses the latest assistant message", async () => {
    const user = userEvent.setup();
    const scrollMetrics = { scrollHeight: 640, clientHeight: 160 };
    const scrollTo = vi.fn(function (this: HTMLElement, options: ScrollToOptions): void {
      this.scrollTop = options.top ?? this.scrollTop;
    });
    const originalScrollHeight = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      "scrollHeight"
    );
    const originalClientHeight = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      "clientHeight"
    );
    const originalScrollTo = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollTo");

    Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
      configurable: true,
      get: () => scrollMetrics.scrollHeight
    });
    Object.defineProperty(HTMLElement.prototype, "clientHeight", {
      configurable: true,
      get: () => scrollMetrics.clientHeight
    });
    Object.defineProperty(HTMLElement.prototype, "scrollTo", {
      configurable: true,
      value: scrollTo
    });
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false })));

    try {
      const baseProps = {
        error: null,
        canRetry: false,
        retryLabel: "Retry",
        onRetry: vi.fn(async () => undefined),
        isFollowUpSubmitting: false,
        onFollowUp: vi.fn(async () => undefined),
        onStartOver: vi.fn(),
        showStartOver: true
      };
      const { rerender } = render(
        <ConversationWorkspace
          {...baseProps}
          messages={[{ role: "assistant", content: "Initial answer" }]}
        />
      );
      const workspace = screen.getByTestId("conversation-workspace");
      const composer = within(workspace).getByRole("textbox", { name: "Follow-up question" });
      await user.type(composer, "Keep this draft byte-for-byte.");

      const log = within(workspace).getByRole("log");
      log.scrollTop = 300;
      fireEvent.scroll(log);
      scrollMetrics.scrollHeight = 840;
      rerender(
        <ConversationWorkspace
          {...baseProps}
          messages={[
            { role: "assistant", content: "Initial answer" },
            { role: "user", content: "New question" },
            { role: "assistant", content: "Newest answer" }
          ]}
        />
      );

      await user.click(within(workspace).getByRole("button", { name: "New response" }));

      expect(composer).toHaveValue("Keep this draft byte-for-byte.");
      expect(
        within(workspace)
          .getByText("Newest answer")
          .closest("[data-conversation-message-index]")
      ).toHaveFocus();
    } finally {
      if (originalScrollHeight) {
        Object.defineProperty(HTMLElement.prototype, "scrollHeight", originalScrollHeight);
      }
      if (originalClientHeight) {
        Object.defineProperty(HTMLElement.prototype, "clientHeight", originalClientHeight);
      }
      if (originalScrollTo) {
        Object.defineProperty(HTMLElement.prototype, "scrollTo", originalScrollTo);
      } else {
        delete (HTMLElement.prototype as unknown as Record<string, unknown>).scrollTo;
      }
      vi.unstubAllGlobals();
    }
  });
});
