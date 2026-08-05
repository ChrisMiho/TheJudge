import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import {
  baseCardMetadataFixture,
  getUrlFromRequest,
  installMemoryLocalStorage,
  installMemorySessionStorage,
  jsonResponse,
  startOnInDepthQuestion,
  uninstallMemoryLocalStorage,
  uninstallMemorySessionStorage
} from "./test/appTestHelpers";

const HISTORY_STORAGE_KEY = "thejudge.conversationHistory.entries";

async function switchToDestination(user: ReturnType<typeof userEvent.setup>, label: string): Promise<void> {
  await user.click(screen.getByRole("button", { name: "Switch feature" }));
  await user.click(screen.getByRole("menuitem", { name: label }));
}

function seedCompletedConversation(
  mode: "game" | "lookup",
  overrides: { id: string; hiddenInitialQuestion: string; answer: string }
): void {
  const existingRaw = localStorage.getItem(HISTORY_STORAGE_KEY);
  const existing: unknown[] = existingRaw ? JSON.parse(existingRaw) : [];
  localStorage.setItem(
    HISTORY_STORAGE_KEY,
    JSON.stringify([
      ...existing,
      {
        id: overrides.id,
        mode,
        flowLabel: mode === "game" ? "In-Depth Question" : "Quick Question",
        frozenContext: mode === "game" ? { kind: "game", gameContext: { players: [] } } : { kind: "lookup", card: null },
        hiddenInitialQuestion: overrides.hiddenInitialQuestion,
        visibleMessages: [
          { role: "user", content: overrides.hiddenInitialQuestion },
          { role: "assistant", content: overrides.answer }
        ],
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z"
      }
    ])
  );
}

function storedEntryIds(): string[] {
  const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
  if (!raw) return [];
  return (JSON.parse(raw) as { id: string }[]).map((entry) => entry.id);
}

// The row's select button and its Delete control both mention the question preview in their
// accessible name (DEC-143), so selecting a row by preview text needs to exclude the delete
// family's "Delete:"/"Confirm delete:"/"Cancel delete:" prefixes to stay unambiguous.
function selectEntryMatcher(preview: string): (name: string) => boolean {
  return (name: string) => name.includes(preview) && !/^(Delete|Confirm delete|Cancel delete):/.test(name);
}

describe("Frontend - Quick Lookup", () => {
  describe("Delete completed history entries (DEC-143 / REQ-118 / FLOW-018)", () => {
    beforeEach(() => {
      installMemoryLocalStorage();
      installMemorySessionStorage();
      vi.stubGlobal(
        "fetch",
        vi.fn(async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
          const url = getUrlFromRequest(input);
          if (url === "/data/cardMetadata.json") return jsonResponse(baseCardMetadataFixture);
          if (url === "/data/gameRulesCoreTopics.json") return jsonResponse([]);
          if (url.endsWith("/api/ask-ai") && init?.method === "POST") return jsonResponse({ answer: "New answer" });
          return jsonResponse({ error: "not found" }, 404);
        })
      );
    });

    afterEach(() => {
      uninstallMemorySessionStorage();
      uninstallMemoryLocalStorage();
      vi.unstubAllGlobals();
    });

    it("removes a non-active entry from storage and the drawer without touching the active conversation", async () => {
      seedCompletedConversation("lookup", {
        id: "lookup-active",
        hiddenInitialQuestion: "Active question",
        answer: "Active answer"
      });
      seedCompletedConversation("lookup", {
        id: "lookup-other",
        hiddenInitialQuestion: "Other question",
        answer: "Other answer"
      });
      const user = userEvent.setup();
      render(<App />);

      await switchToDestination(user, "Quick Question");
      await user.click(screen.getByRole("button", { name: "Conversation history" }));
      await user.click(await screen.findByRole("button", { name: selectEntryMatcher("Active question") }));
      expect(await screen.findByText("Active answer")).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Conversation history" }));
      await user.click(await screen.findByRole("button", { name: /^Delete:.*Other question/ }));
      await user.click(screen.getByRole("button", { name: /^Confirm delete:.*Other question/ }));

      expect(screen.queryByText(/Other question/)).not.toBeInTheDocument();
      expect(storedEntryIds()).toEqual(["lookup-active"]);
      // The active conversation is untouched by deleting a different entry.
      expect(screen.getByText("Active answer")).toBeInTheDocument();
    });

    it("clears the workspace to a clean pre-answer state and does not re-save the deleted thread when deleting the active conversation", async () => {
      seedCompletedConversation("lookup", {
        id: "lookup-active",
        hiddenInitialQuestion: "Earlier question",
        answer: "Earlier answer"
      });
      const user = userEvent.setup();
      render(<App />);

      await switchToDestination(user, "Quick Question");
      await user.click(screen.getByRole("button", { name: "Conversation history" }));
      await user.click(await screen.findByRole("button", { name: selectEntryMatcher("Earlier question") }));
      expect(await screen.findByText("Earlier answer")).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Conversation history" }));
      await user.click(await screen.findByRole("button", { name: /^Delete:.*Earlier question/ }));
      await user.click(screen.getByRole("button", { name: /^Confirm delete:.*Earlier question/ }));

      expect(screen.queryByText("Earlier answer")).not.toBeInTheDocument();
      expect(screen.getByRole("textbox", { name: "Magic question" })).toHaveValue("");
      // Deleted, not silently rewritten back by any effect this teardown triggers.
      expect(storedEntryIds()).toEqual([]);
    });

    it("leaves storage and the drawer unchanged when a delete is cancelled", async () => {
      seedCompletedConversation("lookup", {
        id: "lookup-kept",
        hiddenInitialQuestion: "Kept question",
        answer: "Kept answer"
      });
      const user = userEvent.setup();
      render(<App />);

      await switchToDestination(user, "Quick Question");
      await user.click(screen.getByRole("button", { name: "Conversation history" }));
      await user.click(await screen.findByRole("button", { name: /^Delete:.*Kept question/ }));
      await user.click(screen.getByRole("button", { name: /^Cancel delete:.*Kept question/ }));

      expect(screen.getByText("Kept question")).toBeInTheDocument();
      expect(storedEntryIds()).toEqual(["lookup-kept"]);
    });
  });
});

describe("Frontend - MTG Assistant", () => {
  describe("Delete completed history entries (DEC-143 / REQ-118 / FLOW-018)", () => {
    beforeEach(() => {
      installMemoryLocalStorage();
      installMemorySessionStorage();
      startOnInDepthQuestion();
      vi.stubGlobal(
        "fetch",
        vi.fn(async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
          const url = getUrlFromRequest(input);
          if (url === "/data/cardMetadata.json") return jsonResponse(baseCardMetadataFixture);
          if (url === "/data/gameRulesCoreTopics.json") return jsonResponse([]);
          if (url.endsWith("/api/ask-ai") && init?.method === "POST") return jsonResponse({ answer: "New answer" });
          return jsonResponse({ error: "not found" }, 404);
        })
      );
    });

    afterEach(() => {
      uninstallMemorySessionStorage();
      uninstallMemoryLocalStorage();
      vi.unstubAllGlobals();
    });

    it("clears the workspace back to game context and does not re-save the deleted thread when deleting the active conversation", async () => {
      seedCompletedConversation("game", {
        id: "game-active",
        hiddenInitialQuestion: "Earlier game question",
        answer: "Earlier game answer"
      });
      const user = userEvent.setup();
      render(<App />);

      await user.click(screen.getByRole("button", { name: "Conversation history" }));
      await user.click(await screen.findByRole("button", { name: selectEntryMatcher("Earlier game question") }));
      expect(await screen.findByText("Earlier game answer")).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Conversation history" }));
      await user.click(await screen.findByRole("button", { name: /^Delete:.*Earlier game question/ }));
      await user.click(screen.getByRole("button", { name: /^Confirm delete:.*Earlier game question/ }));

      expect(screen.queryByText("Earlier game answer")).not.toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Game context" })).toBeVisible();
      expect(storedEntryIds()).toEqual([]);
    });
  });
});
