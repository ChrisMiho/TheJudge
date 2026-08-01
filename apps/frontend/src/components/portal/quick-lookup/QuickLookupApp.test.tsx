import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CardMetadataItem } from "../../../types";
import { NO_MATCH_COPY } from "../../../lib/search";
import { QuickLookupApp } from "./QuickLookupApp";

const lightningBolt: CardMetadataItem = {
  cardId: "oracle-lightning-bolt",
  name: "Lightning Bolt",
  oracleText: "Lightning Bolt deals 3 damage to any target.",
  imageUrl: "https://cards.example/lightning-bolt.jpg",
  manaCost: "{R}",
  manaValue: 1,
  typeLine: "Instant",
  colors: ["R"],
  supertypes: [],
  subtypes: []
};

const counterspell: CardMetadataItem = {
  cardId: "oracle-counterspell",
  name: "Counterspell",
  oracleText: "Counter target spell.",
  imageUrl: "https://cards.example/counterspell.jpg",
  manaCost: "{U}{U}",
  manaValue: 2,
  typeLine: "Instant",
  colors: ["U"],
  supertypes: [],
  subtypes: []
};

const coreTopics = [
  {
    id: "stack-and-priority",
    title: "Stack and Priority",
    ruleNumbers: ["117.1", "405.1"],
    excerpt: "Players use priority to add spells and abilities to the stack."
  }
];

vi.mock("../../../hooks/useScanCapture", () => ({
  useScanCapture: ({
    cardMetadata,
    onScanCandidateSelected
  }: {
    cardMetadata: CardMetadataItem[];
    onScanCandidateSelected: (card: CardMetadataItem, scanImageUrl: string) => unknown;
  }) => ({
    isOpen: false,
    isLoading: false,
    error: null,
    convergence: {
      phase: "searching",
      leaderName: null,
      votes: 0,
      votesNeeded: 3,
      conditionHint: null,
      detectorNudge: null,
      inZone: false
    },
    addConfirmation: null,
    scanDebug: null,
    openScan: async () => {
      const scannedCard = cardMetadata.find((card) => card.cardId === counterspell.cardId);
      if (scannedCard) {
        onScanCandidateSelected(scannedCard, "data:image/png;base64,scan-art");
      }
    },
    closeScan: vi.fn(),
    identify: vi.fn(),
    setCameraStatus: vi.fn(),
    recordAcquisitionDiagnostic: vi.fn()
  })
}));

function jsonResponse(payload: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: async () => payload
  } as Response;
}

function appFetchMock(answers: string[]): ReturnType<typeof vi.fn> {
  let answerIndex = 0;
  return vi.fn((input: RequestInfo | URL) => {
    const url = String(input);
    if (url === "/data/cardMetadata.json") {
      return Promise.resolve(jsonResponse([lightningBolt, counterspell]));
    }
    if (url === "/data/gameRulesCoreTopics.json") {
      return Promise.resolve(jsonResponse(coreTopics));
    }
    if (url === "http://localhost:3000/api/ask-ai") {
      const answer = answers[answerIndex] ?? answers.at(-1) ?? "Answer";
      answerIndex += 1;
      return Promise.resolve(
        new Response(JSON.stringify({ answer }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        })
      );
    }
    throw new Error(`Unexpected fetch: ${url}`);
  });
}

describe("Frontend - Quick Lookup", () => {
describe("QuickLookupApp", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input);
        if (url === "/data/cardMetadata.json") {
          return Promise.resolve(jsonResponse([lightningBolt, counterspell]));
        }
        if (url === "/data/gameRulesCoreTopics.json") {
          return Promise.resolve(jsonResponse(coreTopics));
        }
        throw new Error(`Unexpected fetch: ${url}`);
      })
    );
  });

  it("keeps core topics collapsed until opened and pre-fills a question without calling Ask AI", async () => {
    const user = userEvent.setup();
    render(<QuickLookupApp />);

    const disclosureLabel = await screen.findByText("Browse core rules topics");
    const disclosure = disclosureLabel.closest("details");
    expect(disclosure).not.toHaveAttribute("open");
    expect(screen.getByText(coreTopics[0].excerpt)).not.toBeVisible();

    await user.click(disclosureLabel);

    expect(disclosure).toHaveAttribute("open");
    expect(screen.getByRole("heading", { name: "Stack and Priority" })).toBeVisible();
    expect(screen.getByText(coreTopics[0].excerpt)).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Ask about Stack and Priority" }));

    expect(screen.getByRole("textbox", { name: "Magic question" })).toHaveValue("Tell me about Stack and Priority.");
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole("heading", { name: "Stack and Priority" })).not.toBeInTheDocument();
  });

  it("resolves one card from autocomplete and supports removal", async () => {
    const user = userEvent.setup();
    render(<QuickLookupApp />);

    const searchInput = screen.getByRole("textbox", { name: "Card search" });
    await user.type(searchInput, "lig");
    await user.click(await screen.findByRole("button", { name: "Lightning Bolt" }));

    expect(screen.getByRole("heading", { name: "Lightning Bolt" })).toBeInTheDocument();
    expect(screen.getByText(lightningBolt.oracleText)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Stack and Priority" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Remove Lightning Bolt" }));

    expect(screen.queryByRole("heading", { name: "Lightning Bolt" })).not.toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Stack and Priority" })).toBeInTheDocument();
  });

  it("shows the shared no-match copy for a three-character query", async () => {
    const user = userEvent.setup();
    render(<QuickLookupApp />);

    await user.type(screen.getByRole("textbox", { name: "Card search" }), "zzz");

    expect(await screen.findByText(NO_MATCH_COPY)).toBeInTheDocument();
  });

  it("uses the shared scan flow to resolve a single card", async () => {
    const user = userEvent.setup();
    render(<QuickLookupApp />);

    await waitFor(() => expect(fetch).toHaveBeenCalledWith("/data/cardMetadata.json", expect.anything()));
    await user.click(screen.getByRole("button", { name: "Scan a card" }));

    expect(await screen.findByRole("heading", { name: "Counterspell" })).toBeInTheDocument();
    expect(screen.getByText(counterspell.oracleText)).toBeInTheDocument();
  });

  it("caps questions at 300 characters and blocks blank submission", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<QuickLookupApp onSubmit={onSubmit} />);

    const questionInput = screen.getByRole("textbox", { name: "Magic question" });
    const submitButton = screen.getByRole("button", { name: "Ask TheJudge" });
    expect(questionInput).toHaveAttribute("maxLength", "300");
    expect(submitButton).toBeDisabled();

    await user.type(questionInput, "   ");
    expect(submitButton).toBeDisabled();
    await user.clear(questionInput);
    await user.type(questionInput, "a".repeat(301));
    expect(questionInput).toHaveValue("a".repeat(300));
    expect(submitButton).toBeEnabled();

    await user.click(submitButton);
    expect(onSubmit).toHaveBeenCalledWith("a".repeat(300), null);
  });

  it("runs a cardless assistant-first conversation and restores core topics on start over", async () => {
    const user = userEvent.setup();
    const fetchMock = appFetchMock(["First lookup answer", "Follow-up lookup answer"]);
    vi.stubGlobal("fetch", fetchMock);
    render(<QuickLookupApp />);

    await user.type(screen.getByRole("textbox", { name: "Magic question" }), "How does priority work?");
    await user.click(screen.getByRole("button", { name: "Ask TheJudge" }));

    expect(await screen.findByText("First lookup answer")).toBeInTheDocument();
    expect(screen.queryByText("How does priority work?")).not.toBeInTheDocument();
    expect(screen.queryByText("Lookup card")).not.toBeInTheDocument();
    const initialAskRequest = fetchMock.mock.calls.find(([input]) =>
      String(input).endsWith("/api/ask-ai")
    );
    expect(JSON.parse(initialAskRequest?.[1]?.body as string)).toEqual({
      mode: "lookup",
      question: "How does priority work?"
    });

    await user.type(screen.getByRole("textbox", { name: "Follow-up question" }), "Can you give an example?");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByText("Follow-up lookup answer")).toBeInTheDocument();
    const askRequests = fetchMock.mock.calls.filter(([input]) =>
      String(input).endsWith("/api/ask-ai")
    );
    expect(JSON.parse(askRequests[1]?.[1]?.body as string)).toEqual({
      mode: "lookup",
      question: "Can you give an example?",
      conversationHistory: [
        { role: "user", content: "How does priority work?" },
        { role: "assistant", content: "First lookup answer" }
      ]
    });

    await user.click(screen.getByRole("button", { name: "Start Over" }));

    expect(screen.queryByText("First lookup answer")).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Magic question" })).toHaveValue("");
    expect(await screen.findByRole("heading", { name: "Stack and Priority" })).toBeInTheDocument();
  });

  it("freezes an attached card for the thread and follow-ups, then preserves it on start over", async () => {
    const user = userEvent.setup();
    const fetchMock = appFetchMock(["Card lookup answer", "Card follow-up answer"]);
    vi.stubGlobal("fetch", fetchMock);
    render(<QuickLookupApp />);

    await user.type(screen.getByRole("textbox", { name: "Card search" }), "lig");
    await user.click(await screen.findByRole("button", { name: "Lightning Bolt" }));
    await user.type(screen.getByRole("textbox", { name: "Magic question" }), "What can this target?");
    await user.click(screen.getByRole("button", { name: "Ask TheJudge" }));

    expect(await screen.findByText("Card lookup answer")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Lightning Bolt" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove Lightning Bolt" })).not.toBeInTheDocument();
    const initialAskRequest = fetchMock.mock.calls.find(([input]) =>
      String(input).endsWith("/api/ask-ai")
    );
    expect(JSON.parse(initialAskRequest?.[1]?.body as string)).toEqual({
      mode: "lookup",
      question: "What can this target?",
      card: lightningBolt
    });

    await user.type(screen.getByRole("textbox", { name: "Follow-up question" }), "What if I copy it?");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByText("Card follow-up answer")).toBeInTheDocument();
    const askRequests = fetchMock.mock.calls.filter(([input]) =>
      String(input).endsWith("/api/ask-ai")
    );
    expect(JSON.parse(askRequests[1]?.[1]?.body as string)).toMatchObject({
      mode: "lookup",
      question: "What if I copy it?",
      card: lightningBolt
    });

    await user.click(screen.getByRole("button", { name: "Start Over" }));

    expect(screen.queryByText("Card lookup answer")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Lightning Bolt" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove Lightning Bolt" })).toBeInTheDocument();
  });
});
});
