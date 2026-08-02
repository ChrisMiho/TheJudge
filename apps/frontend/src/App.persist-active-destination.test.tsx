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

    it("opens In-Depth Question when the tab has no stored destination", () => {
      render(<App />);

      expect(screen.getByRole("heading", { name: "Game context" })).toBeVisible();
      expect(screen.queryByLabelText("Card search")).not.toBeInTheDocument();
    });

    it("restores Quick Question after the app remounts in the same tab", async () => {
      const user = userEvent.setup();
      const firstRender = render(<App />);

      await user.click(screen.getByRole("button", { name: "Switch feature" }));
      await user.click(screen.getByRole("menuitem", { name: "Quick Question" }));
      expect(screen.getByLabelText("Card search")).toBeVisible();
      firstRender.unmount();

      render(<App />);

      expect(screen.getByLabelText("Card search")).toBeVisible();
      expect(screen.queryByRole("heading", { name: "Game context" })).not.toBeInTheDocument();
    });

    it("falls back to In-Depth Question for an unregistered stored destination", () => {
      sessionStorage.setItem(storageKey, "deleted-destination");

      render(<App />);

      expect(screen.getByRole("heading", { name: "Game context" })).toBeVisible();
      expect(screen.queryByLabelText("Card search")).not.toBeInTheDocument();
    });
  });
});
