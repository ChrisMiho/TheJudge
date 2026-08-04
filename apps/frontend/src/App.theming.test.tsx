import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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
import { PALETTES } from "./lib/theme/palettes";
import type { CardMetadataItem } from "./types";
import {
  baseCardMetadataFixture,
  jsonResponse,
  getUrlFromRequest,
  waitForMetadataReady,
  expandPlayerDetails,
  selectTurnPhase,
  advancePastZoneCollection,
  finishEnrichmentWizard,
  advanceToContextEnrichmentFromZones,
  advanceToZoneCollectionWithZones,
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
describe("Theme palette changes preserve workflow state", () => {
  beforeEach(() => {
    metadataFixture = [...baseCardMetadataFixture];
    askAiResponseQueue = [{ status: 200, body: { answer: "Mock answer" } }];
    submittedAskAiRequests.length = 0;
    submittedAskAiHeaders.length = 0;

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
    vi.unstubAllGlobals();
    delete document.documentElement.dataset.theme;
    document.documentElement.style.removeProperty("--accent");
    document.documentElement.style.removeProperty("--accent-strong");
    document.documentElement.style.removeProperty("--accent-soft");
    document.documentElement.style.removeProperty("--accent-contrast");
  });

  it("applies a non-default palette's resolved accent variable to a themed control", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Switch feature" }));
    await user.click(screen.getByRole("button", { name: "Theme: White" }));

    expect(document.documentElement.dataset.theme).toBe("white");
    expect(document.documentElement.style.getPropertyValue("--accent")).toBe("237 231 214");
    expect(screen.getByRole("button", { name: "Confirm game context" }).className).toContain("from-accent");
  });

  it("does not reset game setup, zones, cards, question, or conversation state when the palette changes", async () => {
    const user = userEvent.setup();
    render(<App />);

    await expandPlayerDetails(user);
    await user.clear(screen.getByLabelText("Player 1 life total"));
    await user.type(screen.getByLabelText("Player 1 life total"), "33");
    await user.click(screen.getByRole("button", { name: "Confirm game context" }));
    await advanceToZoneCollectionWithZones(user, ["Stack"]);
    await waitForMetadataReady();
    await addCardToActiveZone(user, "opt", "Opt");
    await advanceToContextEnrichmentFromZones(user);
    await user.type(screen.getByPlaceholderText("How does this resolve?"), "Will this resolve?");

    await user.click(screen.getByRole("button", { name: "Switch feature" }));
    await user.click(screen.getByRole("button", { name: "Theme: Green" }));

    expect(screen.getByPlaceholderText("How does this resolve?")).toHaveValue("Will this resolve?");
    expect(screen.getByLabelText("Caster for Opt")).toBeInTheDocument();

    await clickDecryptStack(user);
    const requestBody = await waitFor(() => {
      expect(submittedAskAiRequests.length).toBeGreaterThan(0);
      return submittedAskAiRequests[0];
    });
    expect(requestBody.gameContext.players[0]).toMatchObject({ lifeTotal: 33 });
    expect(requestBody.gameContext.zones?.stack?.[0]).toMatchObject({ name: "Opt" });
    expect(requestBody.question).toBe("Will this resolve?");

    await screen.findByText("Mock answer");

    await user.click(screen.getByRole("button", { name: "Switch feature" }));
    await user.click(screen.getByRole("button", { name: "Theme: Blue" }));

    expect(screen.getByText("Mock answer")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start Over" })).toBeInTheDocument();
  });

  it("retints all six palettes without changing an in-progress flow or its current surfaces", async () => {
    const user = userEvent.setup();
    render(<App />);

    await selectTurnPhase(user, "combat");
    await user.selectOptions(screen.getByLabelText("Combat step"), "declare_attackers");
    await user.click(screen.getByRole("button", { name: "Confirm game context" }));
    await advanceToZoneCollectionWithZones(user, ["Stack"]);
    await waitForMetadataReady();
    await addCardToActiveZone(user, "opt", "Opt");
    await advanceToContextEnrichmentFromZones(user);
    await user.type(screen.getByPlaceholderText("How does this resolve?"), "Does Opt resolve?");

    const cardSurface = document.querySelector<HTMLElement>(".enrichment-card-surface");
    const questionSurface = document.querySelector<HTMLElement>(".enrichment-question-surface");
    expect(cardSurface).toHaveAttribute("data-accent-current", "true");
    expect(questionSurface).toHaveAttribute("data-accent-current", "true");

    await user.click(screen.getByRole("button", { name: "Switch feature" }));
    for (const palette of PALETTES) {
      await user.click(screen.getByRole("button", { name: `Theme: ${palette.name}` }));

      expect(document.documentElement.dataset.theme).toBe(palette.id);
      expect(document.documentElement.style.getPropertyValue("--accent")).toBe(palette.accent);
      expect(document.documentElement.style.getPropertyValue("--accent-strong")).toBe(
        palette.accentStrong
      );
      expect(document.documentElement.style.getPropertyValue("--accent-soft")).toBe(
        palette.accentSoft
      );
      expect(document.documentElement.style.getPropertyValue("--accent-contrast")).toBe(
        palette.accentContrast
      );
      expect(screen.getByRole("heading", { name: "Context enrichment" })).toBeInTheDocument();
      expect(screen.getByText("Opt")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("How does this resolve?")).toHaveValue(
        "Does Opt resolve?"
      );
      expect(cardSurface).toHaveAttribute("data-accent-current", "true");
      expect(questionSurface).toHaveAttribute("data-accent-current", "true");
    }

    await clickDecryptStack(user);
    const requestBody = await waitFor(() => {
      expect(submittedAskAiRequests.length).toBeGreaterThan(0);
      return submittedAskAiRequests[0];
    });
    expect(requestBody.gameContext.turnPhase).toBe("combat");
    expect(requestBody.gameContext.combatStep).toBe("declare_attackers");
    expect(requestBody.gameContext.selectedZones).toEqual(["stack"]);
    expect(requestBody.gameContext.zones?.stack?.[0]).toMatchObject({ name: "Opt" });
    expect(requestBody.question).toBe("Does Opt resolve?");
  });

  it("selects, customizes, restores, and resets Colorless without losing staged or conversation state", async () => {
    const user = userEvent.setup();
    render(<App />);

    await openStackBuilder(user);
    await addCardToStack(user, "opt", "Opt");
    await clickDecryptStack(user);
    await screen.findByText("Mock answer");

    await user.click(screen.getByRole("button", { name: "Switch feature" }));
    await user.click(screen.getByRole("button", { name: "Theme: Colorless" }));

    expect(document.documentElement.dataset.theme).toBe("colorless");
    expect(document.documentElement.style.getPropertyValue("--accent")).toBe("82 82 91");

    fireEvent.change(screen.getByLabelText("Customize Colorless color"), {
      target: { value: "#123456" }
    });

    expect(document.documentElement.style.getPropertyValue("--accent")).toBe("18 52 86");
    expect(document.documentElement.style.getPropertyValue("--accent-strong")).toBe("18 52 86");
    expect(document.documentElement.style.getPropertyValue("--accent-soft")).toBe("18 52 86");
    expect(document.documentElement.style.getPropertyValue("--accent-contrast")).toBe("255 255 255");
    expect(screen.getByText("Mock answer")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Theme: Green" }));
    expect(document.documentElement.style.getPropertyValue("--accent")).toBe("10 122 66");

    await user.click(screen.getByRole("button", { name: "Theme: Colorless" }));
    expect(document.documentElement.style.getPropertyValue("--accent")).toBe("18 52 86");

    await user.click(screen.getByRole("button", { name: "Reset to gray" }));
    expect(document.documentElement.style.getPropertyValue("--accent")).toBe("82 82 91");
    expect(screen.getByText("Mock answer")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start Over" })).toBeInTheDocument();
  });
});
describe("Neutral palette backdrop", () => {
  it("does not leave the app shell background biased toward blue-950", () => {
    expect(appCss).not.toContain("#172554");
    expect(appCss).toContain("background: linear-gradient(135deg, #09090b 0%, #18181b 45%, #09090b 100%);");
  });
});

describe("Accent token coverage for staged and answered semantic surfaces", () => {
  beforeEach(() => {
    metadataFixture = [...baseCardMetadataFixture];
    askAiResponseQueue = [{ status: 200, body: { answer: "The stack resolves." } }];
    submittedAskAiRequests.length = 0;
    submittedAskAiHeaders.length = 0;

    fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = getUrlFromRequest(input);
      if (url === "/data/cardMetadata.json") return jsonResponse(metadataFixture);
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
    vi.useRealTimers();
    vi.unstubAllGlobals();
    delete document.documentElement.dataset.theme;
    document.documentElement.style.removeProperty("--accent");
    document.documentElement.style.removeProperty("--accent-strong");
    document.documentElement.style.removeProperty("--accent-soft");
    document.documentElement.style.removeProperty("--accent-contrast");
  });

  it("uses accent tokens for the Ready to decrypt panel, not a hardcoded hue", async () => {
    const user = userEvent.setup();
    render(<App />);
    await openStackBuilder(user);
    await addCardToStack(user, "opt", "Opt");
    await addCardToStack(user, "cou", "Counterspell");
    await advancePastZoneCollection(user);
    await finishEnrichmentWizard(user);

    const readyText = screen.getByText("Ready to decrypt.");
    const panel = readyText.closest("div");
    expect(panel).not.toBeNull();
    expect(panel!.className).toContain("border-accent");
    expect(panel!.className).toContain("bg-accent");
    expect(readyText.className).toContain("text-accent-soft");
    expect(panel!.className).not.toMatch(/emerald|green|sky|blue-[0-9]/);
  });

  it("uses accent-strong tokens for user message bubbles in the conversation thread, not a hardcoded hue", async () => {
    const user = userEvent.setup();
    queueAskAiResponses(
      { status: 200, body: { answer: "The stack resolves." } },
      { status: 200, body: { answer: "Follow-up answer." } }
    );
    render(<App />);
    await openStackBuilder(user);
    await addCardToStack(user, "opt", "Opt");
    await clickDecryptStack(user);
    await screen.findByText("The stack resolves.");

    await user.type(screen.getByPlaceholderText("Ask a follow-up…"), "What about hexproof?");
    await user.click(screen.getByRole("button", { name: "Send" }));
    const userMessage = await screen.findByText("What about hexproof?");

    const bubble = userMessage.closest("div");
    expect(bubble).not.toBeNull();
    expect(bubble!.className).toContain("border-accent-strong");
    expect(bubble!.className).toContain("bg-accent-strong");
    expect(bubble!.className).toContain("text-accent-contrast");
    expect(bubble!.className).not.toMatch(/emerald|green|sky|blue-[0-9]/);
  });

  it("preserves answered-state conversation data across a palette switch", async () => {
    const user = userEvent.setup();
    render(<App />);
    await openStackBuilder(user);
    await addCardToStack(user, "opt", "Opt");
    await clickDecryptStack(user);
    await screen.findByText("The stack resolves.");

    await user.click(screen.getByRole("button", { name: "Switch feature" }));
    await user.click(screen.getByRole("button", { name: "Theme: Green" }));

    expect(screen.getByText("The stack resolves.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start Over" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Ask a follow-up…")).toBeInTheDocument();
  });
});
});
