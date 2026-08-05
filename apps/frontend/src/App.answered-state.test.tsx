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
  advanceToContextEnrichment,
  startOnInDepthQuestion
} from "./test/appTestHelpers";

let fetchMock: ReturnType<typeof vi.fn>;
let metadataFixture: CardMetadataItem[] = [];
let askAiResponseQueue: Array<{ status: number; body: unknown; headers?: Record<string, string> }> = [];
const submittedAskAiRequests: ZoneAskAiPayload[] = [];
const submittedAskAiHeaders: Array<Record<string, string>> = [];

function queueAskAiResponses(...responses: Array<{ status: number; body: unknown; headers?: Record<string, string> }>): void {
  askAiResponseQueue = responses;
}

describe("Frontend - MTG Assistant", () => {
describe("Adaptive frozen context in answered state", () => {
  beforeEach(() => {
    startOnInDepthQuestion();
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

  it("renders the shared workspace with a phase and populated-zone context trigger", async () => {
    const user = userEvent.setup();
    await reachAnsweredStateWithEnrichedStack(user);

    expect(screen.getAllByTestId("conversation-workspace")).toHaveLength(1);
    const trigger = screen.getByRole("button", {
      name: "View context: Pre Combat Main Phase · 1 populated zone"
    });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("dialog", { name: "Frozen game context" })).not.toBeInTheDocument();
  });

  it("opens the complete frozen context in the adaptive dialog and closes explicitly", async () => {
    const user = userEvent.setup();
    await reachAnsweredStateWithEnrichedStack(user);

    const trigger = screen.getByRole("button", {
      name: "View context: Pre Combat Main Phase · 1 populated zone"
    });
    await user.click(trigger);

    const dialog = screen.getByRole("dialog", { name: "Frozen game context" });
    expect(within(dialog).getByText("Setup")).toBeInTheDocument();
    expect(within(dialog).getByText("Pre Combat Main Phase")).toBeInTheDocument();
    expect(within(dialog).getByText("Caster: Player 4")).toBeInTheDocument();
    expect(within(dialog).getByText("Mana spent: 4")).toBeInTheDocument();
    expect(within(dialog).getByText("Notes: Cast for alternate cost")).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Close frozen game context" }));
    expect(screen.queryByRole("dialog", { name: "Frozen game context" })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("renders no edit controls in the frozen context dialog", async () => {
    const user = userEvent.setup();
    await reachAnsweredStateWithEnrichedStack(user);

    await user.click(
      screen.getByRole("button", {
        name: "View context: Pre Combat Main Phase · 1 populated zone"
      })
    );
    const dialog = screen.getByRole("dialog", { name: "Frozen game context" });

    expect(within(dialog).queryAllByRole("combobox")).toHaveLength(0);
    expect(within(dialog).queryAllByRole("textbox")).toHaveLength(0);
    expect(screen.queryByLabelText("Caster for Opt")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Mana spent for Opt")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove Opt" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add target for Opt" })).not.toBeInTheDocument();
    expect(within(dialog).getAllByRole("button")).toHaveLength(1);
  });

  it("does not crash when optional frozen fields are absent", async () => {
    const user = userEvent.setup();
    queueAskAiResponses({ status: 200, body: { answer: "Initial answer" } });
    render(<App />);
    await openStackBuilder(user);
    await addCardToStack(user, "opt", "Opt");
    await clickDecryptStack(user);
    expect(await screen.findByText("Initial answer")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "View context: Pre Combat Main Phase · 1 populated zone"
      })
    );
    const dialog = screen.getByRole("dialog", { name: "Frozen game context" });
    expect(within(dialog).getByText("Opt")).toBeInTheDocument();
  });
});
describe("Answered-state layout integration", () => {
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

  it("shows only the TheJudge header without MTG Assistant or Conversation heading", async () => {
    const user = userEvent.setup();
    await reachAnsweredState(user);

    expect(screen.getByRole("heading", { name: "TheJudge" })).toBeInTheDocument();
    expect(screen.queryByText("MTG Assistant")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Conversation" })).not.toBeInTheDocument();
  });

  it("renders the context trigger before the conversation thread in one shared workspace", async () => {
    const user = userEvent.setup();
    await reachAnsweredState(user);

    const workspace = screen.getByTestId("conversation-workspace");
    const trigger = within(workspace).getByRole("button", { name: /View context:/ });
    const firstAnswer = screen.getByText("Initial answer");
    expect(trigger.compareDocumentPosition(firstAnswer) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
    expect(within(workspace).getAllByRole("textbox", { name: "Follow-up question" })).toHaveLength(1);
    expect(within(workspace).getAllByRole("button", { name: "Start Over" })).toHaveLength(1);
  });

  it("appends follow-up bubbles below the context trigger without a waiting panel", async () => {
    const user = userEvent.setup();
    await reachAnsweredState(user);
    queueAskAiResponses({ status: 200, body: { answer: "Follow-up answer" } });

    await user.type(screen.getByPlaceholderText("Ask a follow-up…"), "What about haste?");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByText("Follow-up answer")).toBeInTheDocument();
    expect(screen.getByText("What about haste?")).toBeInTheDocument();
    const log = screen.getByRole("log");
    expect(log).toHaveAttribute("aria-live", "polite");
    expect(log).toHaveAttribute("aria-relevant", "additions text");
    expect(log).toHaveAttribute("aria-atomic", "false");

    const trigger = screen.getByRole("button", { name: /View context:/ });
    const followUpAnswer = screen.getByText("Follow-up answer");
    expect(trigger.compareDocumentPosition(followUpAnswer) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
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
});
