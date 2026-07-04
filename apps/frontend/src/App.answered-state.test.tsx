import { render, screen, within } from "@testing-library/react";
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
  normalizeHeaders,
  openStackBuilder,
  selectCard,
  addCardToStack,
  clickDecryptStack,
  advanceToContextEnrichment
} from "./test/appTestHelpers";

let fetchMock: ReturnType<typeof vi.fn>;
let metadataFixture: CardMetadataItem[] = [];
let askAiResponseQueue: Array<{ status: number; body: unknown; headers?: Record<string, string> }> = [];
const submittedAskAiRequests: ZoneAskAiPayload[] = [];
const submittedAskAiHeaders: Array<Record<string, string>> = [];

function queueAskAiResponses(...responses: Array<{ status: number; body: unknown; headers?: Record<string, string> }>): void {
  askAiResponseQueue = responses;
}

describe("Slice-A: frozen context summary in answered state", () => {
  beforeEach(() => {
    metadataFixture = [...baseCardMetadataFixture];
    askAiResponseQueue = [{ status: 200, body: { answer: "Mock answer" } }];
    submittedAskAiRequests.length = 0;
    submittedAskAiHeaders.length = 0;
    createCorrelationIdMock.mockClear();
    logFrontendDebugMock.mockClear();

    fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = getUrlFromRequest(input);

      if (url === "/data/cardMetadata.json") {
        return jsonResponse(metadataFixture);
      }

      if (url.endsWith("/api/ask-ai") && init?.method === "POST") {
        submittedAskAiRequests.push(JSON.parse(String(init.body)) as ZoneAskAiPayload);
        submittedAskAiHeaders.push(normalizeHeaders(init.headers));
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
  });

  async function reachAnsweredStateWithEnrichedStack(
    user: ReturnType<typeof userEvent.setup>
  ): Promise<void> {
    queueAskAiResponses({ status: 200, body: { answer: "Initial answer" } });
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Add player" }));
    await user.click(screen.getByRole("button", { name: "Add player" }));
    await openStackBuilder(user);
    await selectCard(user, "opt", "Opt");
    await user.click(screen.getByRole("button", { name: /Begin stackening!|Add to Stack/ }));
    await advanceToContextEnrichment(user);

    await user.selectOptions(screen.getByLabelText("Caster for Opt"), "Player 4");
    await user.type(screen.getByLabelText("Mana spent for Opt"), "4");
    await user.type(screen.getByLabelText("Context notes for Opt"), "Cast for alternate cost");

    await clickDecryptStack(user);
    expect(await screen.findByText("Initial answer")).toBeInTheDocument();
  }

  it("renders a compact frozen context with phase, active player, and zone card names", async () => {
    const user = userEvent.setup();
    await reachAnsweredStateWithEnrichedStack(user);

    const summary = screen.getByRole("region", { name: "Frozen game context" });
    expect(within(summary).getByText("Game context (frozen)")).toBeInTheDocument();
    expect(within(summary).getByText("Pre Combat Main Phase")).toBeInTheDocument();
    expect(within(summary).getByText("Player 1")).toBeInTheDocument();
    expect(within(summary).getByText("Stack:")).toBeInTheDocument();
    expect(within(summary).getByText("Opt")).toBeInTheDocument();

    const toggle = within(summary).getByRole("button", { name: "Show full game context" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  it("expands and collapses full frozen context with correct aria-expanded state", async () => {
    const user = userEvent.setup();
    await reachAnsweredStateWithEnrichedStack(user);

    const summary = screen.getByRole("region", { name: "Frozen game context" });
    expect(within(summary).queryByText("Caster: Player 4")).not.toBeInTheDocument();

    await user.click(within(summary).getByRole("button", { name: "Show full game context" }));

    const expandedToggle = within(summary).getByRole("button", { name: "Hide full game context" });
    expect(expandedToggle).toHaveAttribute("aria-expanded", "true");
    expect(within(summary).getByText("Caster: Player 4")).toBeInTheDocument();
    expect(within(summary).getByText("Mana spent: 4")).toBeInTheDocument();
    expect(within(summary).getByText("Notes: Cast for alternate cost")).toBeInTheDocument();

    await user.click(expandedToggle);
    expect(
      within(summary).getByRole("button", { name: "Show full game context" })
    ).toHaveAttribute("aria-expanded", "false");
    expect(within(summary).queryByText("Caster: Player 4")).not.toBeInTheDocument();
  });

  it("renders no edit controls in the frozen context summary", async () => {
    const user = userEvent.setup();
    await reachAnsweredStateWithEnrichedStack(user);

    const summary = screen.getByRole("region", { name: "Frozen game context" });
    await user.click(within(summary).getByRole("button", { name: "Show full game context" }));

    expect(within(summary).queryAllByRole("combobox")).toHaveLength(0);
    expect(within(summary).queryAllByRole("textbox")).toHaveLength(0);
    expect(screen.queryByLabelText("Caster for Opt")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Mana spent for Opt")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove Opt" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add target for Opt" })).not.toBeInTheDocument();

    const buttons = within(summary).getAllByRole("button");
    expect(buttons).toHaveLength(1);
    expect(buttons[0]).toHaveAttribute("aria-expanded");
  });

  it("does not crash when optional frozen fields are absent", async () => {
    const user = userEvent.setup();
    queueAskAiResponses({ status: 200, body: { answer: "Initial answer" } });
    render(<App />);
    await openStackBuilder(user);
    await addCardToStack(user, "opt", "Opt");
    await clickDecryptStack(user);
    expect(await screen.findByText("Initial answer")).toBeInTheDocument();

    const summary = screen.getByRole("region", { name: "Frozen game context" });
    await user.click(within(summary).getByRole("button", { name: "Show full game context" }));
    expect(within(summary).getAllByText("Opt").length).toBeGreaterThan(0);
    expect(
      within(summary).getByRole("button", { name: "Hide full game context" })
    ).toHaveAttribute("aria-expanded", "true");
  });
});
describe("Slice-B: answered-state layout integration", () => {
  beforeEach(() => {
    metadataFixture = [...baseCardMetadataFixture];
    askAiResponseQueue = [{ status: 200, body: { answer: "Mock answer" } }];
    submittedAskAiRequests.length = 0;
    submittedAskAiHeaders.length = 0;
    createCorrelationIdMock.mockClear();
    logFrontendDebugMock.mockClear();

    fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = getUrlFromRequest(input);

      if (url === "/data/cardMetadata.json") {
        return jsonResponse(metadataFixture);
      }

      if (url.endsWith("/api/ask-ai") && init?.method === "POST") {
        submittedAskAiRequests.push(JSON.parse(String(init.body)) as ZoneAskAiPayload);
        submittedAskAiHeaders.push(normalizeHeaders(init.headers));
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
  });

  async function reachAnsweredState(user: ReturnType<typeof userEvent.setup>): Promise<void> {
    queueAskAiResponses({ status: 200, body: { answer: "Initial answer" } });
    render(<App />);
    await openStackBuilder(user);
    await addCardToStack(user, "opt", "Opt");
    await clickDecryptStack(user);
    expect(await screen.findByText("Initial answer")).toBeInTheDocument();
  }

  it("shows only the TheJudge header without Stack Assistant or Conversation heading", async () => {
    const user = userEvent.setup();
    await reachAnsweredState(user);

    expect(screen.getByRole("heading", { name: "TheJudge" })).toBeInTheDocument();
    expect(screen.queryByText("Stack Assistant")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Conversation" })).not.toBeInTheDocument();
  });

  it("renders the frozen context summary before the conversation thread in DOM order", async () => {
    const user = userEvent.setup();
    await reachAnsweredState(user);

    const summary = screen.getByRole("region", { name: "Frozen game context" });
    const firstAnswer = screen.getByText("Initial answer");
    expect(summary.compareDocumentPosition(firstAnswer) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
    expect(within(summary).queryByText("Initial answer")).not.toBeInTheDocument();
  });

  it("appends follow-up bubbles below the frozen summary without a waiting panel", async () => {
    const user = userEvent.setup();
    await reachAnsweredState(user);
    queueAskAiResponses({ status: 200, body: { answer: "Follow-up answer" } });

    await user.type(screen.getByPlaceholderText("Ask a follow-up…"), "What about haste?");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByText("Follow-up answer")).toBeInTheDocument();
    expect(screen.getByText("What about haste?")).toBeInTheDocument();
    expect(document.querySelector("[aria-live='polite']")).not.toBeInTheDocument();

    const summary = screen.getByRole("region", { name: "Frozen game context" });
    const followUpAnswer = screen.getByText("Follow-up answer");
    expect(summary.compareDocumentPosition(followUpAnswer) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
  });

  it("keeps Start Over visible and enabled in the answered state", async () => {
    const user = userEvent.setup();
    await reachAnsweredState(user);

    const startOver = screen.getByRole("button", { name: "Start Over" });
    expect(startOver).toBeInTheDocument();
    expect(startOver).toBeEnabled();
  });
});
