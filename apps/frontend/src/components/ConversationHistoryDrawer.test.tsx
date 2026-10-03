import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ConversationHistoryEntry } from "../lib/conversationHistory/persistence";
import { ConversationHistoryDrawer, type ConversationHistoryDraftRow } from "./ConversationHistoryDrawer";

const DEFAULT_INNER_WIDTH = window.innerWidth;

/** jsdom defaults `innerWidth` to 1024 (wide/two-pane); set it explicitly for a test
 * that needs narrow/single-pane behavior, matching the sheet family's own 600px
 * boundary (REQ-207/REQ-213). */
function setViewportWidth(width: number): void {
  Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: width });
  window.dispatchEvent(new Event("resize"));
}

afterEach(() => {
  cleanup();
  setViewportWidth(DEFAULT_INNER_WIDTH);
});

function buildEntry(overrides: Partial<ConversationHistoryEntry> = {}): ConversationHistoryEntry {
  return {
    id: "entry-1",
    mode: "lookup",
    flowLabel: "Quick Question",
    frozenContext: { kind: "lookup", cards: [] },
    hiddenInitialQuestion: "How does hexproof work exactly against opposing spells and abilities?",
    visibleMessages: [{ role: "assistant", content: "Hexproof restricts opposing targets." }],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
    ...overrides
  };
}

describe("Frontend - Conversation history drawer (REQ-213)", () => {
  describe("Shared shape", () => {
    it("renders nothing when closed", () => {
      render(
        <ConversationHistoryDrawer isOpen={false} onClose={vi.fn()} entries={[]} onResumeEntry={vi.fn()} onDeleteEntry={vi.fn()} />
      );
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("shows an empty state and the n-of-20 head when there are no saved conversations or drafts", () => {
      render(<ConversationHistoryDrawer isOpen onClose={vi.fn()} entries={[]} onResumeEntry={vi.fn()} onDeleteEntry={vi.fn()} />);

      expect(screen.getByRole("dialog", { name: "Question History 0 of 20" })).toBeInTheDocument();
      expect(screen.getByText("No saved conversations yet")).toBeInTheDocument();
    });

    it("heads with the combined count, both kinds included", () => {
      render(
        <ConversationHistoryDrawer
          isOpen
          onClose={vi.fn()}
          entries={[
            buildEntry({ id: "a" }),
            buildEntry({
              id: "b",
              mode: "game",
              frozenContext: { kind: "game", gameContext: { playerCount: 2, players: [], turnPhase: "main_1" } }
            })
          ]}
          onResumeEntry={vi.fn()}
          onDeleteEntry={vi.fn()}
        />
      );

      expect(screen.getByRole("dialog", { name: "Question History 2 of 20" })).toBeInTheDocument();
    });

    it("shows each row's meta line, truncated question preview, and first ruling line", () => {
      const longQuestion =
        "How does hexproof interact with equipment auras and other opposing spells that try to target this creature across several turns?";
      render(
        <ConversationHistoryDrawer
          isOpen
          onClose={vi.fn()}
          entries={[buildEntry({ hiddenInitialQuestion: longQuestion })]}
          onResumeEntry={vi.fn()}
          onDeleteEntry={vi.fn()}
        />
      );

      expect(screen.getByText(new RegExp(`^${longQuestion.slice(0, 80)}…$`))).toBeInTheDocument();
      expect(screen.getByText("Hexproof restricts opposing targets.")).toBeInTheDocument();
      // the row's meta line (the mockup's `.h-meta`): a mode chip, the card count, when
      expect(screen.getByText("no cards")).toBeInTheDocument();
    });

    it("draws a dashed empty frame when an entry carries no cards, and a +n badge past three", () => {
      const noCards = buildEntry({ id: "no-cards" });
      const manyCards = buildEntry({
        id: "many-cards",
        hiddenInitialQuestion: "A card-heavy question",
        frozenContext: {
          kind: "lookup",
          cards: [
            { cardId: "a", name: "Opt", imageUrl: "https://img/opt.jpg" },
            { cardId: "b", name: "Bolt", imageUrl: "https://img/bolt.jpg" },
            { cardId: "c", name: "Ponder", imageUrl: "https://img/ponder.jpg" },
            { cardId: "d", name: "Shock", imageUrl: "https://img/shock.jpg" }
          ]
        }
      });
      render(
        <ConversationHistoryDrawer isOpen onClose={vi.fn()} entries={[noCards, manyCards]} onResumeEntry={vi.fn()} onDeleteEntry={vi.fn()} />
      );

      // SheetShell portals to document.body, outside the local render container.
      expect(document.querySelector(".h-fan .none")).toBeInTheDocument();
      expect(screen.getByText("+1")).toBeInTheDocument();
      expect(document.querySelectorAll("img").length).toBe(3);
    });
  });

  describe("Narrow (<600px): a tap resumes immediately", () => {
    beforeEach(() => setViewportWidth(390));

    it("tapping a row resumes that entry and closes the sheet", async () => {
      const user = userEvent.setup();
      const onResumeEntry = vi.fn();
      const onClose = vi.fn();
      const entry = buildEntry();
      render(
        <ConversationHistoryDrawer isOpen onClose={onClose} entries={[entry]} onResumeEntry={onResumeEntry} onDeleteEntry={vi.fn()} />
      );

      await user.click(screen.getByText(/^How does hexproof/));

      expect(onResumeEntry).toHaveBeenCalledWith(entry);
      expect(onClose).toHaveBeenCalledOnce();
    });

    it("keeps a per-row Delete control; confirming deletes, cancelling leaves it", async () => {
      const user = userEvent.setup();
      const onDeleteEntry = vi.fn();
      const entry = buildEntry();
      render(
        <ConversationHistoryDrawer isOpen onClose={vi.fn()} entries={[entry]} onResumeEntry={vi.fn()} onDeleteEntry={onDeleteEntry} />
      );

      await user.click(screen.getByRole("button", { name: /^Delete: Ask a Question/ }));
      const confirmSheet = screen.getByTestId("history-delete-confirm");
      expect(within(confirmSheet).getByText(/How does hexproof/)).toBeInTheDocument();

      await user.click(within(confirmSheet).getByRole("button", { name: "Keep" }));
      expect(onDeleteEntry).not.toHaveBeenCalled();
      expect(screen.getByText(/^How does hexproof/)).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: /^Delete: Ask a Question/ }));
      await user.click(within(screen.getByTestId("history-delete-confirm")).getByRole("button", { name: "Delete" }));
      expect(onDeleteEntry).toHaveBeenCalledWith(entry);
    });

    it("does not render the wide reading pane or Open conversation/Delete this question", () => {
      render(
        <ConversationHistoryDrawer isOpen onClose={vi.fn()} entries={[buildEntry()]} onResumeEntry={vi.fn()} onDeleteEntry={vi.fn()} />
      );

      expect(screen.queryByRole("button", { name: "Open conversation" })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Delete this question" })).not.toBeInTheDocument();
    });
  });

  describe("From 600px: two panes — select, then act", () => {
    beforeEach(() => setViewportWidth(1024));

    it("tapping a row only selects it; the full conversation reads in the pane without resuming", async () => {
      const user = userEvent.setup();
      const onResumeEntry = vi.fn();
      const onClose = vi.fn();
      const entry = buildEntry();
      render(
        <ConversationHistoryDrawer isOpen onClose={onClose} entries={[entry]} onResumeEntry={onResumeEntry} onDeleteEntry={vi.fn()} />
      );

      await user.click(screen.getByText(/^How does hexproof/));

      expect(onResumeEntry).not.toHaveBeenCalled();
      expect(onClose).not.toHaveBeenCalled();
      // The ruling line now appears twice — once in the row's own preview, once in the
      // pane's full read — so assert via the pane's own action buttons instead.
      expect(screen.getAllByText("Hexproof restricts opposing targets.")).toHaveLength(2);
      expect(screen.getByRole("button", { name: "Open conversation" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Delete this question" })).toBeInTheDocument();
    });

    it("no per-row Delete control at this width — only the pane's Delete this question", async () => {
      const user = userEvent.setup();
      render(
        <ConversationHistoryDrawer isOpen onClose={vi.fn()} entries={[buildEntry()]} onResumeEntry={vi.fn()} onDeleteEntry={vi.fn()} />
      );

      expect(screen.queryByRole("button", { name: /^Delete: Ask a Question/ })).not.toBeInTheDocument();

      await user.click(screen.getByText(/^How does hexproof/));
      expect(screen.getByRole("button", { name: "Delete this question" })).toBeInTheDocument();
    });

    it("Open conversation resumes the selected entry and closes the sheet", async () => {
      const user = userEvent.setup();
      const onResumeEntry = vi.fn();
      const onClose = vi.fn();
      const entry = buildEntry();
      render(
        <ConversationHistoryDrawer isOpen onClose={onClose} entries={[entry]} onResumeEntry={onResumeEntry} onDeleteEntry={vi.fn()} />
      );

      await user.click(screen.getByText(/^How does hexproof/));
      await user.click(screen.getByRole("button", { name: "Open conversation" }));

      expect(onResumeEntry).toHaveBeenCalledWith(entry);
      expect(onClose).toHaveBeenCalledOnce();
    });

    it("Delete this question confirms, then deletes the selected entry", async () => {
      const user = userEvent.setup();
      const onDeleteEntry = vi.fn();
      const entry = buildEntry();
      render(
        <ConversationHistoryDrawer isOpen onClose={vi.fn()} entries={[entry]} onResumeEntry={vi.fn()} onDeleteEntry={onDeleteEntry} />
      );

      await user.click(screen.getByText(/^How does hexproof/));
      await user.click(screen.getByRole("button", { name: "Delete this question" }));
      await user.click(within(screen.getByTestId("history-delete-confirm")).getByRole("button", { name: "Delete" }));

      expect(onDeleteEntry).toHaveBeenCalledWith(entry);
    });

    it("shows a placeholder in the pane until a row is selected", () => {
      render(
        <ConversationHistoryDrawer isOpen onClose={vi.fn()} entries={[buildEntry()]} onResumeEntry={vi.fn()} onDeleteEntry={vi.fn()} />
      );

      expect(screen.getByText(/Pick a question to read it here\./)).toBeInTheDocument();
    });
  });

  describe("Draft rows (FLOW-017)", () => {
    it("shows up to one row per flow above the saved conversations, and resumes immediately at any width", async () => {
      const user = userEvent.setup();
      const onResumeLookup = vi.fn();
      const onResumeGame = vi.fn();
      const draftRows: ConversationHistoryDraftRow[] = [
        { kind: "game", updatedAt: "2026-01-03T00:00:00.000Z", onResume: onResumeGame },
        { kind: "lookup", updatedAt: "2026-01-04T00:00:00.000Z", onResume: onResumeLookup }
      ];
      render(
        <ConversationHistoryDrawer
          isOpen
          onClose={vi.fn()}
          entries={[buildEntry()]}
          draftRows={draftRows}
          onResumeEntry={vi.fn()}
          onDeleteEntry={vi.fn()}
        />
      );

      const rows = screen.getAllByRole("button", { name: /Draft/ });
      expect(rows).toHaveLength(2);

      await user.click(rows.find((row) => /Ask a Question/.test(row.textContent ?? "")) as HTMLElement);
      expect(onResumeLookup).toHaveBeenCalledOnce();
    });

    it("shows a Draft row instead of the empty state when there are no completed entries", () => {
      render(
        <ConversationHistoryDrawer
          isOpen
          onClose={vi.fn()}
          entries={[]}
          draftRows={[{ kind: "lookup", updatedAt: "2026-01-03T00:00:00.000Z", onResume: vi.fn() }]}
          onResumeEntry={vi.fn()}
          onDeleteEntry={vi.fn()}
        />
      );

      expect(screen.getByRole("button", { name: /Draft/ })).toBeInTheDocument();
      expect(screen.queryByText("No saved conversations yet")).not.toBeInTheDocument();
    });

    it("renders no Draft row when none is passed", () => {
      render(<ConversationHistoryDrawer isOpen onClose={vi.fn()} entries={[]} onResumeEntry={vi.fn()} onDeleteEntry={vi.fn()} />);

      expect(screen.queryByRole("button", { name: /Draft/ })).not.toBeInTheDocument();
    });
  });

  describe("Sheet lifecycle", () => {
    it("closes on Escape via the shared SheetShell", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<ConversationHistoryDrawer isOpen onClose={onClose} entries={[]} onResumeEntry={vi.fn()} onDeleteEntry={vi.fn()} />);

      await user.keyboard("{Escape}");
      expect(onClose).toHaveBeenCalledOnce();
    });

    it("forgets the selected row and any pending delete confirm the next time it opens", () => {
      setViewportWidth(1024);
      const entry = buildEntry();
      const { rerender } = render(
        <ConversationHistoryDrawer isOpen onClose={vi.fn()} entries={[entry]} onResumeEntry={vi.fn()} onDeleteEntry={vi.fn()} />
      );

      fireEvent.click(screen.getByText(/^How does hexproof/));
      expect(screen.getByRole("button", { name: "Open conversation" })).toBeInTheDocument();

      rerender(<ConversationHistoryDrawer isOpen={false} onClose={vi.fn()} entries={[entry]} onResumeEntry={vi.fn()} onDeleteEntry={vi.fn()} />);
      rerender(<ConversationHistoryDrawer isOpen onClose={vi.fn()} entries={[entry]} onResumeEntry={vi.fn()} onDeleteEntry={vi.fn()} />);

      expect(screen.getByText(/Pick a question to read it here\./)).toBeInTheDocument();
    });
  });
});
