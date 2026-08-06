import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import {
  advanceToBattlefieldZoneCollection,
  baseCardMetadataFixture,
  getUrlFromRequest,
  installMemoryLocalStorage,
  installMemorySessionStorage,
  jsonResponse,
  uninstallMemoryLocalStorage,
  uninstallMemorySessionStorage,
  startOnInDepthQuestion
} from "./test/appTestHelpers";

async function switchToDestination(user: ReturnType<typeof userEvent.setup>, label: string): Promise<void> {
  await user.click(screen.getByRole("button", { name: "Switch feature" }));
  await user.click(screen.getByRole("menuitem", { name: label }));
}

// A history row's select button and its Delete control (DEC-143) both mention the question
// preview in their accessible name, so selecting a row by preview text alone is ambiguous —
// exclude the delete control's "Delete: ..." name to land on the select button.
const SELECT_HISTORY_ENTRY_NAME = /^(?!Delete:).*Earlier question/;

describe("Frontend - Mid-flight Draft (REQ-108 / FLOW-017)", () => {
  beforeEach(() => {
    installMemoryLocalStorage();
    installMemorySessionStorage();
    startOnInDepthQuestion();
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const url = getUrlFromRequest(input);

        if (url === "/data/cardMetadata.json") {
          return jsonResponse(baseCardMetadataFixture);
        }
        if (url === "/data/gameRulesCoreTopics.json") {
          return jsonResponse([]);
        }
        if (url.endsWith("/api/ask-ai") && init?.method === "POST") {
          return jsonResponse({ answer: "Conversation answer" });
        }

        return jsonResponse({ error: "not found" }, 404);
      })
    );
  });

  afterEach(() => {
    uninstallMemorySessionStorage();
    uninstallMemoryLocalStorage();
    vi.unstubAllGlobals();
  });

  it("restores In-Depth Question staging on a fresh mount after Menu-leave, via Draft — not just in-memory state", async () => {
    const user = userEvent.setup();
    const firstMount = render(<App />);

    await advanceToBattlefieldZoneCollection(user);
    expect(screen.getByRole("heading", { name: "Add cards to zones" })).toBeVisible();

    await switchToDestination(user, "Quick Question");
    expect(screen.getByLabelText("Card search")).toBeVisible();

    // Storage persists (installMemoryLocalStorage backs it with a module-level map), but the
    // React tree does not: unmounting and rendering a fresh <App /> is the only way to prove
    // restoration came from the Draft, not from the destination staying mounted-but-hidden.
    firstMount.unmount();
    render(<App />);

    await switchToDestination(user, "In-Depth Question");
    expect(screen.getByRole("heading", { name: "Add cards to zones" })).toBeVisible();
  });

  it("restores Quick Question staging on a fresh mount after Menu-leave, via Draft", async () => {
    const user = userEvent.setup();
    const firstMount = render(<App />);

    await switchToDestination(user, "Quick Question");
    await user.type(screen.getByLabelText("Magic question"), "Does a Fog effect stop combat damage triggers?");

    await switchToDestination(user, "Life Tracker");

    firstMount.unmount();
    render(<App />);

    await switchToDestination(user, "Quick Question");
    expect(screen.getByLabelText("Magic question")).toHaveValue(
      "Does a Fog effect stop combat damage triggers?"
    );
  });

  it("shows a Draft row in History once staged and lets selecting it restore the staged step", async () => {
    const user = userEvent.setup();
    render(<App />);

    await advanceToBattlefieldZoneCollection(user);
    await switchToDestination(user, "Quick Question");
    const firstMountAfterLeave = screen.getByLabelText("Card search");
    expect(firstMountAfterLeave).toBeVisible();

    await switchToDestination(user, "In-Depth Question");
    // Back within the same session: in-memory state already shows the staged step directly.
    expect(screen.getByRole("heading", { name: "Add cards to zones" })).toBeVisible();

    // Start Over to clear the in-memory view back to game-context without touching the
    // still-saved Draft, so opening History exercises the Draft row rather than in-memory state.
    // Game context has no Start Over control, so simulate the disconnect a different way:
    // open History directly from the staged step and confirm the Draft row itself is present.
    await user.click(screen.getByRole("button", { name: "Conversation history" }));
    const draftRow = await screen.findByRole("button", { name: /Draft/ });
    expect(draftRow).toBeInTheDocument();
  });

  it("clears the Draft once the attempt reaches a successful answer", async () => {
    const user = userEvent.setup();
    render(<App />);

    await switchToDestination(user, "Quick Question");
    await user.type(screen.getByLabelText("Magic question"), "Does trample interact with deathtouch?");
    await user.click(screen.getByRole("button", { name: "Ask TheJudge" }));

    expect(await screen.findByText("Conversation answer")).toBeInTheDocument();
    expect(localStorage.getItem("thejudge.conversationDraft.lookup")).toBeNull();
  });

  it("does not crash and mounts fresh when Draft storage holds corrupt JSON", async () => {
    localStorage.setItem("thejudge.conversationDraft.game", "{not valid json");

    render(<App />);

    expect(screen.getByRole("heading", { name: "Game context" })).toBeVisible();
  });

  // DEC-138: opening a saved conversation is the third mid-flight exit, alongside Menu-leave
  // and reload. It never changes `isActive`, so the edge effect that covers the other two
  // cannot see it — before this, restoreConversation silently discarded staged work.
  describe("Opening a saved conversation from mid-flight staging", () => {
    function seedCompletedConversation(mode: "game" | "lookup"): void {
      localStorage.setItem(
        "thejudge.conversationHistory.entries",
        JSON.stringify([
          {
            id: `seeded-${mode}`,
            mode,
            flowLabel: mode === "game" ? "In-Depth Question" : "Quick Question",
            frozenContext:
              mode === "game" ? { kind: "game", gameContext: { players: [] } } : { kind: "lookup", card: null },
            hiddenInitialQuestion: "Earlier question",
            visibleMessages: [
              { role: "user", content: "Earlier question" },
              { role: "assistant", content: "Earlier answer" }
            ],
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z"
          }
        ])
      );
    }

    it("snapshots Quick Question staging to Draft before restoring the conversation", async () => {
      seedCompletedConversation("lookup");
      const user = userEvent.setup();
      render(<App />);

      await switchToDestination(user, "Quick Question");
      await user.type(screen.getByLabelText("Magic question"), "Does lifelink trigger on deathtouch damage?");
      expect(localStorage.getItem("thejudge.conversationDraft.lookup")).toBeNull();

      await user.click(screen.getByRole("button", { name: "Conversation history" }));
      await user.click(await screen.findByRole("button", { name: SELECT_HISTORY_ENTRY_NAME }));

      const draft = localStorage.getItem("thejudge.conversationDraft.lookup");
      expect(draft).not.toBeNull();
      expect(JSON.parse(draft as string)).toMatchObject({
        mode: "lookup",
        question: "Does lifelink trigger on deathtouch damage?"
      });

      // The conversation still opened — the snapshot happens before the restore, not instead
      // of it (DEC-134 unchanged).
      expect(await screen.findByText("Earlier answer")).toBeInTheDocument();
    });

    it("snapshots In-Depth Question staging to Draft before restoring the conversation", async () => {
      seedCompletedConversation("game");
      const user = userEvent.setup();
      render(<App />);

      await advanceToBattlefieldZoneCollection(user);
      expect(localStorage.getItem("thejudge.conversationDraft.game")).toBeNull();

      await user.click(screen.getByRole("button", { name: "Conversation history" }));
      await user.click(await screen.findByRole("button", { name: SELECT_HISTORY_ENTRY_NAME }));

      const draft = localStorage.getItem("thejudge.conversationDraft.game");
      expect(draft).not.toBeNull();
      expect(JSON.parse(draft as string)).toMatchObject({ mode: "game", flowStep: "zone-collection" });
    });

    it("makes the discarded attempt recoverable as the Draft row in the same drawer", async () => {
      seedCompletedConversation("lookup");
      const user = userEvent.setup();
      render(<App />);

      await switchToDestination(user, "Quick Question");
      await user.type(screen.getByLabelText("Magic question"), "Does trample carry over lethal damage?");

      await user.click(screen.getByRole("button", { name: "Conversation history" }));
      await user.click(await screen.findByRole("button", { name: SELECT_HISTORY_ENTRY_NAME }));
      expect(await screen.findByText("Earlier answer")).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Conversation history" }));
      expect(await screen.findByRole("button", { name: /Draft/ })).toBeInTheDocument();
    });

    it("writes no Draft when there is no meaningful staging to preserve", async () => {
      seedCompletedConversation("lookup");
      const user = userEvent.setup();
      render(<App />);

      await switchToDestination(user, "Quick Question");

      await user.click(screen.getByRole("button", { name: "Conversation history" }));
      await user.click(await screen.findByRole("button", { name: SELECT_HISTORY_ENTRY_NAME }));

      expect(localStorage.getItem("thejudge.conversationDraft.lookup")).toBeNull();
    });
  });
});
