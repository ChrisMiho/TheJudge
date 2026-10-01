import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import {
  baseCardMetadataFixture,
  getUrlFromRequest,
  installMemoryLocalStorage,
  installMemorySessionStorage,
  jsonResponse,
  navigateToPath,
  uninstallMemoryLocalStorage,
  uninstallMemorySessionStorage
} from "./test/appTestHelpers";

const storageKey = "thejudge.portal.activeDestinationId";
const HISTORY_STORAGE_KEY = "thejudge.conversationHistory.entries";

describe("Frontend - Portal", () => {
  describe("active destination persistence", () => {
    beforeEach(() => {
      installMemoryLocalStorage();
      installMemorySessionStorage();
      vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL): Promise<Response> => {
        if (getUrlFromRequest(input) === "/data/cardMetadata.json") {
          return jsonResponse([]);
        }
        return jsonResponse({ error: "not found" }, 404);
      }));
    });

    afterEach(() => {
      uninstallMemorySessionStorage();
      uninstallMemoryLocalStorage();
      vi.unstubAllGlobals();
    });

    it("opens registry-first Quick Question when bare root has no stored destination", async () => {
      render(<App />);

      expect(screen.getByLabelText("Card search")).toBeVisible();
      expect(screen.queryByRole("heading", { name: "Game context" })).not.toBeInTheDocument();
      await waitFor(() => expect(window.location.pathname).toBe("/quick-lookup"));
    });

    it("lets a deep link override the stored destination", () => {
      sessionStorage.setItem(storageKey, "quick-lookup");
      window.history.replaceState(null, "", "/in-depth");

      render(<App />);

      expect(screen.getByRole("heading", { name: "Game context" })).toBeVisible();
      expect(screen.queryByLabelText("Card search")).not.toBeInTheDocument();
    });

    it("uses the valid stored destination when the URL is bare root", async () => {
      sessionStorage.setItem(storageKey, "mtg-assistant");

      render(<App />);

      expect(screen.getByRole("heading", { name: "Game context" })).toBeVisible();
      expect(screen.queryByLabelText("Card search")).not.toBeInTheDocument();
      await waitFor(() => expect(window.location.pathname).toBe("/in-depth"));
    });

    it("falls back to registry order for an unregistered stored destination", async () => {
      sessionStorage.setItem(storageKey, "deleted-destination");

      render(<App />);

      expect(screen.getByLabelText("Card search")).toBeVisible();
      expect(screen.queryByRole("heading", { name: "Game context" })).not.toBeInTheDocument();
      await waitFor(() => expect(window.location.pathname).toBe("/quick-lookup"));
    });

    it("redirects an unknown path through bare root to its stored fallback", async () => {
      sessionStorage.setItem(storageKey, "trade-balancer");
      window.history.replaceState(null, "", "/removed-feature");

      render(<App />);

      await waitFor(() => expect(window.location.pathname).toBe("/trade-balancer"));
      expect(sessionStorage.getItem(storageKey)).toBe("trade-balancer");
    });

    it("keeps a visited destination mounted with the same in-session state", async () => {
      const user = userEvent.setup();
      render(<App />);

      const searchInput = screen.getByLabelText("Card search");
      await user.type(searchInput, "lightning");
      // REQ-067/REQ-206: `in-depth` has no Menu row of its own — reached by direct
      // navigation instead of a menu click.
      await navigateToPath("/in-depth");
      await user.click(screen.getByRole("button", { name: "Switch feature" }));
      await user.click(screen.getByRole("menuitem", { name: "Ask a Question" }));

      expect(await screen.findByLabelText("Card search")).toBe(searchInput);
      expect(searchInput).toHaveValue("lightning");
    });
  });

  // REQ-213/FLOW-016: Question History resumes a saved conversation live, in its own
  // flow — switching destination when the entry belongs to the other one, not just
  // restoring state in place.
  describe("Question History resumes live in its own flow (FLOW-016)", () => {
    beforeEach(() => {
      installMemoryLocalStorage();
      installMemorySessionStorage();
      vi.stubGlobal(
        "fetch",
        vi.fn(async (input: RequestInfo | URL): Promise<Response> => {
          const url = getUrlFromRequest(input);
          if (url === "/data/cardMetadata.json") return jsonResponse(baseCardMetadataFixture);
          if (url === "/data/gameRulesCoreTopics.json") return jsonResponse([]);
          return jsonResponse({ error: "not found" }, 404);
        })
      );
    });

    afterEach(() => {
      uninstallMemorySessionStorage();
      uninstallMemoryLocalStorage();
      vi.unstubAllGlobals();
    });

    it("resuming an In-depth entry from Ask a Question switches destination and shows that conversation", async () => {
      localStorage.setItem(
        HISTORY_STORAGE_KEY,
        JSON.stringify([
          {
            id: "game-entry",
            mode: "game",
            flowLabel: "In-Depth Question",
            frozenContext: { kind: "game", gameContext: { players: [] } },
            hiddenInitialQuestion: "Does this creature survive combat?",
            visibleMessages: [
              { role: "user", content: "Does this creature survive combat?" },
              { role: "assistant", content: "Yes, it survives." }
            ],
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z"
          }
        ])
      );
      const user = userEvent.setup();
      render(<App />);

      // Starts on Ask a Question (the registry-first default), not In-depth.
      expect(await screen.findByLabelText("Card search")).toBeVisible();

      await user.click(screen.getByRole("button", { name: "Switch feature" }));
      await user.click(screen.getByRole("menuitem", { name: "Question History" }));
      await user.click(
        await screen.findByRole("button", { name: /Does this creature survive combat\?$/ })
      );
      // jsdom's default innerWidth (1024) is the sheet family's wide side of its 600px
      // boundary (REQ-207/REQ-213): a row tap selects into the reading pane first.
      await user.click(screen.getByRole("button", { name: "Open conversation" }));

      expect(await screen.findByText("Yes, it survives.")).toBeInTheDocument();
      expect(window.location.pathname).toBe("/in-depth");
    });
  });
});
