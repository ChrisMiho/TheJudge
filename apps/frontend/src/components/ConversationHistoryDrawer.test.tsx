import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ConversationHistoryEntry } from "../lib/conversationHistory/persistence";
import { appCss } from "../test/appTestHelpers";
import { ConversationHistoryDrawer } from "./ConversationHistoryDrawer";

afterEach(cleanup);

function buildEntry(overrides: Partial<ConversationHistoryEntry> = {}): ConversationHistoryEntry {
  return {
    id: "entry-1",
    mode: "lookup",
    flowLabel: "Quick Question",
    frozenContext: { kind: "lookup", card: null },
    hiddenInitialQuestion: "How does hexproof work exactly against opposing spells and abilities?",
    visibleMessages: [{ role: "assistant", content: "Hexproof restricts opposing targets." }],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
    ...overrides
  };
}

function Harness({
  entries,
  activeConversationId,
  onSelectEntry
}: {
  entries: ConversationHistoryEntry[];
  activeConversationId?: string | null;
  onSelectEntry: (entry: ConversationHistoryEntry) => void;
}): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setIsOpen(true)}>
        Open history trigger
      </button>
      <ConversationHistoryDrawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        entries={entries}
        activeConversationId={activeConversationId}
        onSelectEntry={onSelectEntry}
      />
    </>
  );
}

describe("Frontend - Conversation history drawer", () => {
  it("renders nothing when closed", () => {
    render(
      <ConversationHistoryDrawer isOpen={false} onClose={vi.fn()} entries={[]} onSelectEntry={vi.fn()} />
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows an empty state when there are no saved conversations", () => {
    render(<ConversationHistoryDrawer isOpen onClose={vi.fn()} entries={[]} onSelectEntry={vi.fn()} />);

    expect(screen.getByRole("dialog", { name: "Conversation history" })).toBeInTheDocument();
    expect(screen.getByText("No saved conversations yet")).toBeInTheDocument();
  });

  it("lists entries with flow label, timestamp, and a truncated question preview", () => {
    const longQuestion =
      "How does hexproof interact with equipment auras and other opposing spells that try to target this creature across several turns?";
    render(
      <ConversationHistoryDrawer
        isOpen
        onClose={vi.fn()}
        entries={[buildEntry({ hiddenInitialQuestion: longQuestion })]}
        onSelectEntry={vi.fn()}
      />
    );

    expect(screen.getByText(/Quick Question/)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`^${longQuestion.slice(0, 80)}…$`))).toBeInTheDocument();
  });

  it("calls onSelectEntry for a non-active entry and no-ops for the active entry", async () => {
    const user = userEvent.setup();
    const onSelectEntry = vi.fn();
    const activeEntry = buildEntry({ id: "active-entry", hiddenInitialQuestion: "Active question" });
    const otherEntry = buildEntry({ id: "other-entry", hiddenInitialQuestion: "Other question" });

    render(
      <ConversationHistoryDrawer
        isOpen
        onClose={vi.fn()}
        entries={[activeEntry, otherEntry]}
        activeConversationId="active-entry"
        onSelectEntry={onSelectEntry}
      />
    );

    await user.click(screen.getByText("Active question"));
    expect(onSelectEntry).not.toHaveBeenCalled();

    await user.click(screen.getByText("Other question"));
    expect(onSelectEntry).toHaveBeenCalledWith(otherEntry);
  });

  it("traps focus, closes on Escape, and restores focus to whatever triggered it", async () => {
    const user = userEvent.setup();
    const onSelectEntry = vi.fn();

    render(<Harness entries={[buildEntry()]} onSelectEntry={onSelectEntry} />);

    const trigger = screen.getByRole("button", { name: "Open history trigger" });
    await user.click(trigger);

    const dialog = screen.getByRole("dialog", { name: "Conversation history" });
    const close = within(dialog).getByRole("button", { name: "Close conversation history" });
    const entryButton = within(dialog).getByRole("button", { name: /Quick Question/ });
    expect(close).toHaveFocus();

    entryButton.focus();
    await user.tab();
    expect(close).toHaveFocus();

    await user.tab({ shift: true });
    expect(entryButton).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Conversation history" })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("closes and restores focus when the dimmed scrim outside the panel is activated", async () => {
    const user = userEvent.setup();
    render(<Harness entries={[buildEntry()]} onSelectEntry={vi.fn()} />);

    const trigger = screen.getByRole("button", { name: "Open history trigger" });
    await user.click(trigger);

    expect(screen.getByRole("dialog", { name: "Conversation history" })).toBeInTheDocument();
    await user.click(screen.getByTestId("conversation-history-overlay"));

    expect(screen.queryByRole("dialog", { name: "Conversation history" })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("does not close when activating the panel surface itself", async () => {
    const user = userEvent.setup();
    render(<Harness entries={[buildEntry()]} onSelectEntry={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Open history trigger" }));
    const dialog = screen.getByRole("dialog", { name: "Conversation history" });

    await user.click(within(dialog).getByText("Conversation history"));
    expect(screen.getByRole("dialog", { name: "Conversation history" })).toBeInTheDocument();
  });

  it("shows a distinct Draft row above completed entries when a Draft exists", () => {
    const onSelect = vi.fn();
    render(
      <ConversationHistoryDrawer
        isOpen
        onClose={vi.fn()}
        entries={[buildEntry()]}
        onSelectEntry={vi.fn()}
        draft={{ updatedAt: "2026-01-03T00:00:00.000Z", onSelect }}
      />
    );

    expect(screen.getByRole("button", { name: /Draft/ })).toBeInTheDocument();
    expect(screen.queryByText("No saved conversations yet")).not.toBeInTheDocument();
  });

  it("calls the Draft's onSelect when the Draft row is clicked", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <ConversationHistoryDrawer
        isOpen
        onClose={vi.fn()}
        entries={[]}
        onSelectEntry={vi.fn()}
        draft={{ updatedAt: "2026-01-03T00:00:00.000Z", onSelect }}
      />
    );

    await user.click(screen.getByRole("button", { name: /Draft/ }));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("shows the Draft row instead of the empty state when there are no completed entries", () => {
    render(
      <ConversationHistoryDrawer
        isOpen
        onClose={vi.fn()}
        entries={[]}
        onSelectEntry={vi.fn()}
        draft={{ updatedAt: "2026-01-03T00:00:00.000Z", onSelect: vi.fn() }}
      />
    );

    expect(screen.getByRole("button", { name: /Draft/ })).toBeInTheDocument();
    expect(screen.queryByText("No saved conversations yet")).not.toBeInTheDocument();
  });

  it("renders no Draft row and the ordinary empty state when no Draft is passed", () => {
    render(<ConversationHistoryDrawer isOpen onClose={vi.fn()} entries={[]} onSelectEntry={vi.fn()} />);

    expect(screen.queryByRole("button", { name: /Draft/ })).not.toBeInTheDocument();
    expect(screen.getByText("No saved conversations yet")).toBeInTheDocument();
  });

  // DEC-134: a left-edge, full-height drawer at every viewport, not a bottom sheet below
  // 768px. Content-sized bottom sheets left a screen of empty scrim above a one-entry list.
  it("presents as a left-edge full-height drawer at every viewport", () => {
    expect(appCss).toMatch(
      /\.conversation-history-overlay \{[^}]*align-items: stretch;[^}]*justify-content: flex-start;[^}]*\}/
    );
    expect(appCss).toMatch(
      /\.conversation-history-surface \{[^}]*border-radius: 0 1rem 1rem 0;[^}]*\}/
    );
    // No max-height cap anywhere: `align-items: stretch` is what gives it full height.
    expect(appCss).not.toMatch(/\.conversation-history-surface \{[^}]*max-height:/);
    expect(appCss).toMatch(
      /@media \(prefers-reduced-motion: reduce\) \{[\s\S]*\.conversation-history-surface/
    );
  });
});
