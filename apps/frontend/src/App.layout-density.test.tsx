import { render, screen, waitFor } from "@testing-library/react";
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
import type { ZoneAskAiPayload } from "./lib/contextFlow";
import type { CardMetadataItem } from "./types";
import {
  baseCardMetadataFixture,
  jsonResponse,
  getUrlFromRequest,
  installMemoryLocalStorage,
  uninstallMemoryLocalStorage,
  waitForMetadataReady,
  expandPlayerDetails,
  advanceToContextEnrichmentFromZones,
  setSelectedZones,
  addCardToActiveZone,
  openStackBuilder,
  addCardToStack,
  clickDecryptStack,
  appCss
} from "./test/appTestHelpers";

let fetchMock: ReturnType<typeof vi.fn>;
let metadataFixture: CardMetadataItem[] = [];
let askAiResponseQueue: Array<{ status: number; body: unknown; headers?: Record<string, string> }> = [];
const submittedAskAiRequests: ZoneAskAiPayload[] = [];
const submittedAskAiHeaders: Array<Record<string, string>> = [];

function queueAskAiResponses(...responses: Array<{ status: number; body: unknown; headers?: Record<string, string> }>): void {
  askAiResponseQueue = responses;
}

describe("Frontend - Theme", () => {
describe("Layout density toggle", () => {
  beforeEach(() => {
    metadataFixture = [...baseCardMetadataFixture];
    askAiResponseQueue = [{ status: 200, body: { answer: "Mock answer" } }];
    submittedAskAiRequests.length = 0;
    submittedAskAiHeaders.length = 0;
    installMemoryLocalStorage();

    fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = getUrlFromRequest(input);

      if (url === "/data/cardMetadata.json") {
        return jsonResponse(metadataFixture);
      }

      if (url.endsWith("/api/ask-ai") && init?.method === "POST") {
        submittedAskAiRequests.push(JSON.parse(String(init.body)) as ZoneAskAiPayload);
        const nextResponse = askAiResponseQueue.shift() ?? { status: 200, body: { answer: "Mock answer" } };
        return jsonResponse(nextResponse.body, nextResponse.status, nextResponse.headers);
      }

      return jsonResponse({ error: "not found" }, 404);
    });

    vi.stubGlobal("fetch", fetchMock);
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

  it("sets data-layout-density=slim on document root when Slim is selected", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Switch feature" }));
    await user.click(screen.getByRole("button", { name: "Layout: Slim" }));

    expect(document.documentElement.dataset.layoutDensity).toBe("slim");
  });

  it("restores the persisted Slim density on a fresh app mount", async () => {
    const user = userEvent.setup();
    const firstRender = render(<App />);

    await user.click(screen.getByRole("button", { name: "Switch feature" }));
    await user.click(screen.getByRole("button", { name: "Layout: Slim" }));
    await waitFor(() => {
      expect(globalThis.localStorage.getItem("thejudge.theme.layoutDensity")).toBe("slim");
      expect(document.documentElement.dataset.layoutDensity).toBe("slim");
    });
    firstRender.unmount();
    delete document.documentElement.dataset.layoutDensity;

    render(<App />);

    await waitFor(() => expect(document.documentElement.dataset.layoutDensity).toBe("slim"));
    await user.click(screen.getByRole("button", { name: "Switch feature" }));
    expect(screen.getByRole("button", { name: "Layout: Slim" })).toHaveAttribute("aria-pressed", "true");
  });

  it("indicates the active density in the theme panel", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Switch feature" }));

    expect(screen.getByRole("button", { name: "Layout: Chunky" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Layout: Slim" })).toHaveAttribute("aria-pressed", "false");
  });

  it("does not reset game setup, zones, cards, or conversation state when density changes", async () => {
    const user = userEvent.setup();
    render(<App />);

    await expandPlayerDetails(user);
    await user.clear(screen.getByLabelText("Player 1 life total"));
    await user.type(screen.getByLabelText("Player 1 life total"), "33");
    await user.click(screen.getByRole("button", { name: "Confirm game context" }));
    await setSelectedZones(user, ["Stack"]);
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await waitForMetadataReady();
    await addCardToActiveZone(user, "opt", "Opt");
    await advanceToContextEnrichmentFromZones(user);
    await user.type(screen.getByPlaceholderText("How does this resolve?"), "Will this resolve?");

    await user.click(screen.getByRole("button", { name: "Switch feature" }));
    await user.click(screen.getByRole("button", { name: "Layout: Slim" }));

    expect(screen.getByPlaceholderText("How does this resolve?")).toHaveValue("Will this resolve?");
    expect(screen.getByLabelText("Caster for Opt")).toBeInTheDocument();
  });

  it("preserves answered-state conversation data across a density switch", async () => {
    const user = userEvent.setup();
    queueAskAiResponses({ status: 200, body: { answer: "The stack resolves." } });
    render(<App />);
    await openStackBuilder(user);
    await addCardToStack(user, "opt", "Opt");
    await clickDecryptStack(user);
    await screen.findByText("The stack resolves.");

    await user.click(screen.getByRole("button", { name: "Switch feature" }));
    await user.click(screen.getByRole("button", { name: "Layout: Slim" }));

    expect(screen.getByText("The stack resolves.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start Over" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Ask a follow-up…")).toBeInTheDocument();
  });
});

describe("Slim density surfaces", () => {
  it("defines slim overrides for the high-scroll and camera surfaces", () => {
    expect(appCss).toContain('[data-layout-density="slim"] .staged-step-brand');
    expect(appCss).toContain('[data-layout-density="slim"] .staged-step-name');
    expect(appCss).toContain('[data-layout-density="slim"] .scroll-cap-4-enrichment');
    expect(appCss).toContain('[data-layout-density="slim"] .zone-card-grid');
    expect(appCss).toContain('[data-layout-density="slim"] .zone-card-tile');
    expect(appCss).toContain('[data-layout-density="slim"] .scan-video');
    expect(appCss).toContain("aspect-ratio: 4 / 5;");
    expect(appCss).toContain("max-height: 50dvh;");
    expect(appCss).toContain('[data-layout-density="slim"] .card-preview-placeholder');
    expect(appCss).toContain('[data-layout-density="slim"] .conversation-thread');
    expect(appCss).toContain('[data-layout-density="slim"] .frozen-context-summary');
  });

  it("keeps the zone card grid viewport-capped in both densities", () => {
    expect(appCss).toMatch(/\.zone-card-grid \{[^}]*max-height: 70dvh;/);
    expect(appCss).not.toContain("--zone-card-tile-height");
    expect(appCss).toContain("--zone-card-grid-gap: 0.375rem;");
  });
});
});
