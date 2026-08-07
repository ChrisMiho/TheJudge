import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import {
  getUrlFromRequest,
  installMemoryLocalStorage,
  installMemorySessionStorage,
  jsonResponse,
  uninstallMemoryLocalStorage,
  uninstallMemorySessionStorage
} from "./test/appTestHelpers";

const storageKey = "thejudge.portal.activeDestinationId";

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
      await user.click(screen.getByRole("button", { name: "Switch feature" }));
      await user.click(screen.getByRole("menuitem", { name: "In-Depth Question" }));
      await user.click(screen.getByRole("button", { name: "Switch feature" }));
      await user.click(screen.getByRole("menuitem", { name: "Quick Question" }));

      expect(screen.getByLabelText("Card search")).toBe(searchInput);
      expect(searchInput).toHaveValue("lightning");
    });
  });
});
