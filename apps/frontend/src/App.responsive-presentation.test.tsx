import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import App from "./App";
import {
  getUrlFromRequest,
  installMemoryLocalStorage,
  jsonResponse,
  uninstallMemoryLocalStorage
} from "./test/appTestHelpers";

const legacyDensityKey = "thejudge.theme.layoutDensity";

describe("Frontend - Automatic responsive presentation", () => {
  beforeEach(() => {
    installMemoryLocalStorage();
    globalThis.localStorage.setItem(legacyDensityKey, "chunky");
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL): Promise<Response> => {
        if (getUrlFromRequest(input) === "/data/cardMetadata.json") {
          return jsonResponse([]);
        }
        return jsonResponse({ error: "not found" }, 404);
      })
    );
  });

  afterEach(() => {
    uninstallMemoryLocalStorage();
    vi.unstubAllGlobals();
    delete document.documentElement.dataset.theme;
    delete document.documentElement.dataset.layoutDensity;
    document.documentElement.style.removeProperty("--accent");
    document.documentElement.style.removeProperty("--accent-strong");
    document.documentElement.style.removeProperty("--accent-soft");
    document.documentElement.style.removeProperty("--accent-contrast");
  });

  it("ignores the retired density preference while keeping palette selection healthy", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Switch feature" }));

    expect(screen.queryByText("Layout")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Layout: (Desktop|Mobile)/ })).not.toBeInTheDocument();
    expect(document.documentElement).not.toHaveAttribute("data-layout-density");
    expect(globalThis.localStorage.getItem(legacyDensityKey)).toBe("chunky");

    await user.click(screen.getByRole("button", { name: "Theme: Green" }));

    await waitFor(() => expect(document.documentElement.dataset.theme).toBe("green"));
    expect(globalThis.localStorage.getItem(legacyDensityKey)).toBe("chunky");
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("keeps staged state mounted when the viewport changes", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Show player details" }));
    const lifeInput = screen.getByLabelText("Player 1 life total");
    await user.clear(lifeInput);
    await user.type(lifeInput, "33");

    fireEvent(window, new Event("resize"));

    expect(screen.getByLabelText("Player 1 life total")).toBe(lifeInput);
    expect(lifeInput).toHaveValue("33");
    expect(screen.getByRole("button", { name: "Switch feature" })).toHaveClass("h-11");
  });
});
