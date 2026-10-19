import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Test-only switch: when true, the real submit hook's result is overlaid with a
// failed-request state that has nothing saved to resend (REQ-014 edge).
let forceUnsavedError = false;

vi.mock("../../hooks/useAskAiSubmitOrchestration", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../hooks/useAskAiSubmitOrchestration")>();
  return {
    ...actual,
    useAskAiSubmitOrchestration: (options: Parameters<typeof actual.useAskAiSubmitOrchestration>[0]) => {
      const result = actual.useAskAiSubmitOrchestration(options);
      return forceUnsavedError
        ? { ...result, error: "Miho is working on it", canRetry: true, hasPendingRetry: false }
        : result;
    }
  };
});

import App from "../../App";
import {
  baseCardMetadataFixture,
  getUrlFromRequest,
  installMemoryLocalStorage,
  installMemorySessionStorage,
  jsonResponse,
  openHistory,
  startOnInDepthQuestion,
  uninstallMemoryLocalStorage,
  uninstallMemorySessionStorage
} from "../../test/appTestHelpers";

const HISTORY_STORAGE_KEY = "thejudge.conversationHistory.entries";

let askAiBodies: Array<{ question: string }> = [];
let askAiResponses: Array<{ status: number; body: unknown }> = [];

function seedGameConversation(): void {
  localStorage.setItem(
    HISTORY_STORAGE_KEY,
    JSON.stringify([
      {
        id: "game-reopened",
        mode: "game",
        flowLabel: "In-Depth Question",
        frozenContext: { kind: "game", gameContext: { players: [] } },
        hiddenInitialQuestion: "Earlier game question",
        visibleMessages: [
          { role: "user", content: "Earlier game question" },
          { role: "assistant", content: "Earlier game answer" }
        ],
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z"
      }
    ])
  );
}

async function reopenSavedConversation(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await openHistory(user);
  await user.click(await screen.findByRole("button", { name: /Earlier game question$/ }));
  await user.click(screen.getByRole("button", { name: "Open conversation" }));
  expect(await screen.findByText("Earlier game answer")).toBeInTheDocument();
}

describe("Frontend - MTG Assistant", () => {
  describe("Retry on a reopened conversation (REQ-014)", () => {
    beforeEach(() => {
      installMemoryLocalStorage();
      installMemorySessionStorage();
      startOnInDepthQuestion();
      forceUnsavedError = false;
      askAiBodies = [];
      askAiResponses = [];
      vi.stubGlobal(
        "fetch",
        vi.fn(async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
          const url = getUrlFromRequest(input);
          if (url === "/data/cardMetadata.json") return jsonResponse(baseCardMetadataFixture);
          if (url === "/data/gameRulesCoreTopics.json") return jsonResponse([]);
          if (url.endsWith("/api/ask-ai") && init?.method === "POST") {
            askAiBodies.push(JSON.parse(String(init.body)) as { question: string });
            const next = askAiResponses.shift() ?? { status: 200, body: { answer: "Mock answer" } };
            return jsonResponse(next.body, next.status);
          }
          return jsonResponse({ error: "not found" }, 404);
        })
      );
    });

    afterEach(() => {
      forceUnsavedError = false;
      uninstallMemorySessionStorage();
      uninstallMemoryLocalStorage();
      vi.unstubAllGlobals();
    });

    it("resends the failed follow-up on Retry after the cooldown, with no staged game", async () => {
      seedGameConversation();
      askAiResponses = [
        { status: 502, body: { error: "Miho is working on it", retryAfterSeconds: 1 } },
        { status: 200, body: { answer: "Recovered answer" } }
      ];
      const user = userEvent.setup();
      render(<App />);

      await reopenSavedConversation(user);
      await user.type(screen.getByRole("textbox", { name: "Follow-up question" }), "And then?");
      await user.click(screen.getByRole("button", { name: "Send" }));

      const retry = await screen.findByRole("button", { name: "Retry" }, { timeout: 4000 });
      expect(askAiBodies).toHaveLength(1);
      await user.click(retry);

      expect(await screen.findByText("Recovered answer")).toBeInTheDocument();
      expect(askAiBodies).toHaveLength(2);
      expect(askAiBodies[1].question).toBe("And then?");
    });

    it("says to confirm game context when Retry has nothing saved and no game is staged", async () => {
      seedGameConversation();
      const user = userEvent.setup();
      render(<App />);

      forceUnsavedError = true;
      await reopenSavedConversation(user);
      await user.click(await screen.findByRole("button", { name: "Retry" }));

      expect(await screen.findByText("Confirm game context before decrypting.")).toBeInTheDocument();
      expect(askAiBodies).toHaveLength(0);
    });
  });
});
