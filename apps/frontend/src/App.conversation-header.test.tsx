import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { createCorrelationIdMock, logFrontendDebugMock } = vi.hoisted(() => ({
  createCorrelationIdMock: vi.fn(() => "corr-test-id"),
  logFrontendDebugMock: vi.fn()
}));

vi.mock("./lib/debugLogger", () => ({
  createCorrelationId: createCorrelationIdMock,
  logFrontendDebug: logFrontendDebugMock
}));

import App from "./App";
import {
  addCardToStack,
  baseCardMetadataFixture,
  clickDecryptStack,
  getUrlFromRequest,
  installMemoryLocalStorage,
  jsonResponse,
  openStackBuilder,
  uninstallMemoryLocalStorage
} from "./test/appTestHelpers";

describe("Frontend - Conversation header docking", () => {
  beforeEach(() => {
    installMemoryLocalStorage();
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const url = getUrlFromRequest(input);

        if (url === "/data/cardMetadata.json") {
          return jsonResponse(baseCardMetadataFixture);
        }

        if (url.endsWith("/api/ask-ai") && init?.method === "POST") {
          return jsonResponse({ answer: "Conversation answer" });
        }

        return jsonResponse({ error: "not found" }, 404);
      })
    );
  });

  afterEach(() => {
    uninstallMemoryLocalStorage();
    vi.unstubAllGlobals();
  });

  it("docks the Menu inline in the answered conversation header", async () => {
    const user = userEvent.setup();
    render(<App />);

    await openStackBuilder(user);
    await addCardToStack(user, "opt", "Opt");
    await clickDecryptStack(user);
    expect(await screen.findByText("Conversation answer")).toBeInTheDocument();

    const menuTrigger = screen.getByRole("button", { name: "Switch feature" });
    const menuContainerClassName = menuTrigger.closest("div")?.className ?? "";

    expect(menuContainerClassName).toContain("portal-slot-tab");
    expect(menuContainerClassName).not.toContain("fixed");
    expect(screen.getByRole("heading", { name: "TheJudge" })).toBeInTheDocument();
  });
});
