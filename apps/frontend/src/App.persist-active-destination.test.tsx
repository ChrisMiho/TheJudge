import { render, screen } from "@testing-library/react";
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

    it("opens Quick Question when the tab has no stored destination", () => {
      render(<App />);

      expect(screen.getByLabelText("Card search")).toBeVisible();
      expect(screen.queryByRole("heading", { name: "Game context" })).not.toBeInTheDocument();
    });

    it("lets a deep link override the stored destination", () => {
      sessionStorage.setItem(storageKey, "quick-lookup");
      window.history.replaceState(null, "", "/in-depth");

      render(<App />);

      expect(screen.getByRole("heading", { name: "Game context" })).toBeVisible();
      expect(screen.queryByLabelText("Card search")).not.toBeInTheDocument();
    });

    it("restores In-Depth Question after the app remounts in the same tab", async () => {
      const user = userEvent.setup();
      const firstRender = render(<App />);

      await user.click(screen.getByRole("button", { name: "Switch feature" }));
      await user.click(screen.getByRole("menuitem", { name: "In-Depth Question" }));
      expect(screen.getByRole("heading", { name: "Game context" })).toBeVisible();
      firstRender.unmount();

      render(<App />);

      expect(screen.getByRole("heading", { name: "Game context" })).toBeVisible();
      expect(screen.queryByLabelText("Card search")).not.toBeInTheDocument();
    });

    it("falls back to Quick Question for an unregistered stored destination", () => {
      sessionStorage.setItem(storageKey, "deleted-destination");

      render(<App />);

      expect(screen.getByLabelText("Card search")).toBeVisible();
      expect(screen.queryByRole("heading", { name: "Game context" })).not.toBeInTheDocument();
    });
  });
});
