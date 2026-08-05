import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ConversationMessage } from "../types";
import { ConversationThread } from "./ConversationThread";

const initialMessages: ConversationMessage[] = [
  { role: "assistant", content: "The stack resolves." }
];

const scrollMetrics = {
  scrollHeight: 640,
  clientHeight: 160
};

const originalScrollHeight = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  "scrollHeight"
);
const originalClientHeight = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  "clientHeight"
);
const originalScrollTo = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollTo");

const scrollToMock = vi.fn(function (
  this: HTMLElement,
  options: ScrollToOptions | number,
  y?: number
): void {
  this.scrollTop =
    typeof options === "number" ? (y ?? 0) : (options.top ?? this.scrollTop);
});

function restorePrototypeProperty(
  property: "scrollHeight" | "clientHeight" | "scrollTo",
  descriptor: PropertyDescriptor | undefined
): void {
  if (descriptor) {
    Object.defineProperty(HTMLElement.prototype, property, descriptor);
    return;
  }

  delete (HTMLElement.prototype as unknown as Record<string, unknown>)[property];
}

beforeEach(() => {
  scrollMetrics.scrollHeight = 640;
  scrollMetrics.clientHeight = 160;
  scrollToMock.mockClear();
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
    value: scrollToMock
  });
  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false })));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  restorePrototypeProperty("scrollHeight", originalScrollHeight);
  restorePrototypeProperty("clientHeight", originalClientHeight);
  restorePrototypeProperty("scrollTo", originalScrollTo);
});

describe("Frontend - MTG Assistant", () => {
  describe("ConversationThread", () => {
    it("exposes a non-atomic polite live log and positions the first answer at the latest message", () => {
      render(<ConversationThread messages={initialMessages} />);

      const log = screen.getByRole("log");
      expect(log).toHaveAttribute("aria-live", "polite");
      expect(log).toHaveAttribute("aria-relevant", "additions text");
      expect(log).toHaveAttribute("aria-atomic", "false");
      expect(scrollToMock).toHaveBeenLastCalledWith({ top: 640, behavior: "smooth" });
      expect(log.scrollTop).toBe(640);
    });

    it("follows an append when the reader is exactly 64px from the bottom", () => {
      const { rerender } = render(<ConversationThread messages={initialMessages} />);
      const log = screen.getByRole("log");
      scrollToMock.mockClear();

      log.scrollTop = 416;
      fireEvent.scroll(log);
      scrollMetrics.scrollHeight = 840;
      rerender(
        <ConversationThread
          messages={[
            ...initialMessages,
            { role: "user", content: "What about hexproof?" },
            { role: "assistant", content: "Hexproof restricts opposing targets." }
          ]}
        />
      );

      expect(scrollToMock).toHaveBeenLastCalledWith({ top: 840, behavior: "smooth" });
      expect(screen.queryByRole("button", { name: "New response" })).not.toBeInTheDocument();
    });

    it("preserves the exact position above 64px, reuses one affordance, and dismisses it on manual return", () => {
      const secondMessages: ConversationMessage[] = [
        ...initialMessages,
        { role: "user", content: "What about hexproof?" },
        { role: "assistant", content: "Hexproof restricts opposing targets." }
      ];
      const { rerender } = render(<ConversationThread messages={initialMessages} />);
      const log = screen.getByRole("log");

      log.scrollTop = 415;
      fireEvent.scroll(log);
      scrollMetrics.scrollHeight = 840;
      rerender(<ConversationThread messages={secondMessages} />);

      expect(log.scrollTop).toBe(415);
      expect(screen.getAllByRole("button", { name: "New response" })).toHaveLength(1);

      scrollMetrics.scrollHeight = 1040;
      rerender(
        <ConversationThread
          messages={[
            ...secondMessages,
            { role: "user", content: "And ward?" },
            { role: "assistant", content: "Ward adds a countering cost." }
          ]}
        />
      );

      expect(log.scrollTop).toBe(415);
      expect(screen.getAllByRole("button", { name: "New response" })).toHaveLength(1);

      log.scrollTop = 816;
      fireEvent.scroll(log);
      expect(screen.queryByRole("button", { name: "New response" })).not.toBeInTheDocument();
    });

    it("scrolls to and focuses only the newest assistant message when New response is activated", () => {
      const { rerender } = render(<ConversationThread messages={initialMessages} />);
      const log = screen.getByRole("log");

      log.scrollTop = 300;
      fireEvent.scroll(log);
      scrollMetrics.scrollHeight = 840;
      rerender(
        <ConversationThread
          messages={[
            ...initialMessages,
            { role: "user", content: "What about hexproof?" },
            { role: "assistant", content: "Hexproof restricts opposing targets." }
          ]}
        />
      );

      fireEvent.click(screen.getByRole("button", { name: "New response" }));

      const firstAssistant = screen
        .getByText("The stack resolves.")
        .closest("[data-conversation-message-index]");
      const newestAssistant = screen
        .getByText("Hexproof restricts opposing targets.")
        .closest("[data-conversation-message-index]");
      expect(firstAssistant).not.toHaveAttribute("tabindex");
      expect(newestAssistant).toHaveAttribute("tabindex", "-1");
      expect(newestAssistant).toHaveFocus();
      expect(scrollToMock).toHaveBeenLastCalledWith({ top: 840, behavior: "smooth" });
      expect(screen.queryByRole("button", { name: "New response" })).not.toBeInTheDocument();
    });

    it("marks only appended messages for entrance motion across unrelated rerenders", () => {
      const { rerender } = render(<ConversationThread messages={initialMessages} />);
      const firstAssistant = screen
        .getByText("The stack resolves.")
        .closest("[data-conversation-message-index]");
      expect(firstAssistant).toHaveClass("conversation-message-enter");

      const appendedMessages: ConversationMessage[] = [
        ...initialMessages,
        { role: "user", content: "What about hexproof?" }
      ];
      rerender(<ConversationThread messages={appendedMessages} />);

      expect(firstAssistant).not.toHaveClass("conversation-message-enter");
      const appended = screen.getByText("What about hexproof?").parentElement;
      expect(appended).toHaveClass("conversation-message-enter");

      rerender(<ConversationThread messages={[...appendedMessages]} />);
      expect(firstAssistant).not.toHaveClass("conversation-message-enter");
      expect(appended).toHaveClass("conversation-message-enter");
    });

    it("uses immediate scrolling when reduced motion is preferred", () => {
      vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true })));

      render(<ConversationThread messages={initialMessages} />);

      expect(scrollToMock).toHaveBeenLastCalledWith({ top: 640, behavior: "auto" });
    });

    it("renders a solid, high-contrast user bubble and plain flowing assistant text with no bubble background", () => {
      render(
        <ConversationThread
          messages={[
            ...initialMessages,
            { role: "user", content: "What about hexproof?" }
          ]}
        />
      );

      const assistantBubble = screen
        .getByText("The stack resolves.")
        .closest("[data-conversation-message-index]");
      const userBubble = screen.getByText("What about hexproof?").parentElement;
      expect(userBubble).toHaveClass("bg-accent-strong", "text-accent-contrast");
      expect(userBubble?.className).not.toContain("bg-accent-strong/30");
      expect(userBubble?.className).not.toContain("border");
      expect(assistantBubble?.className).not.toMatch(/\bbg-/);
      expect(assistantBubble).not.toHaveClass("text-accent-contrast");
    });

    it("renders assistant markdown syntax as structured elements", () => {
      const markdownMessages: ConversationMessage[] = [
        {
          role: "assistant",
          content:
            "# Heading\n\n- one\n- two\n\n**bold** and `code`\n\n[link](https://example.com)"
        }
      ];
      render(<ConversationThread messages={markdownMessages} />);

      expect(screen.getByRole("heading", { level: 1, name: "Heading" })).toBeInTheDocument();
      expect(screen.getAllByRole("listitem")).toHaveLength(2);
      expect(screen.getByText("bold").tagName).toBe("STRONG");
      expect(screen.getByText("code").tagName).toBe("CODE");
      const link = screen.getByRole("link", { name: "link" });
      expect(link).toHaveAttribute("href", "https://example.com");
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("never parses markdown syntax in a user message", () => {
      const userMarkdownMessages: ConversationMessage[] = [
        { role: "user", content: "**not bold**" }
      ];
      render(<ConversationThread messages={userMarkdownMessages} />);

      expect(screen.getByText("**not bold**")).toBeInTheDocument();
      expect(document.querySelector("strong")).toBeNull();
    });

    it("renders a plain-text assistant answer unchanged", () => {
      const plainMessages: ConversationMessage[] = [
        { role: "assistant", content: "Hexproof restricts opposing targets." }
      ];
      render(<ConversationThread messages={plainMessages} />);

      expect(screen.getByText("Hexproof restricts opposing targets.")).toBeInTheDocument();
    });

    it("renders raw HTML in an assistant message as literal text, not a live DOM node", () => {
      const scriptMessages: ConversationMessage[] = [
        { role: "assistant", content: "before <script>window.pwned = true;</script> after" }
      ];
      render(<ConversationThread messages={scriptMessages} />);

      expect(document.querySelector("script[data-testid], .conversation-thread script")).toBeNull();
      expect(screen.getByText(/window\.pwned = true/)).toBeInTheDocument();
    });

    it("wraps markdown tables in a horizontally scrollable container", () => {
      const tableMessages: ConversationMessage[] = [
        {
          role: "assistant",
          content: "| A | B |\n| --- | --- |\n| 1 | 2 |"
        }
      ];
      render(<ConversationThread messages={tableMessages} />);

      const table = screen.getByRole("table");
      expect(table.parentElement).toHaveClass("conversation-markdown-table-scroll");
    });
  });
});
