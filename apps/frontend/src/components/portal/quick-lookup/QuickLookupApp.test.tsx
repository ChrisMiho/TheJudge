import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CardMetadataItem } from "../../../types";
import { NO_MATCH_COPY } from "../../../lib/search";
import { toCardDetail, toSlimMetadata, type CardFixture } from "../../../test/appTestHelpers";
import { QuickLookupApp } from "./QuickLookupApp";

const lightningBolt: CardFixture = {
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

const counterspell: CardFixture = {
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

function simpleCard(cardId: string, name: string): CardFixture {
  return {
    cardId,
    name,
    oracleText: `${name} oracle text.`,
    imageUrl: `https://cards.example/${cardId}.jpg`,
    manaCost: "{1}",
    manaValue: 1,
    typeLine: "Instant",
    colors: [],
    supertypes: [],
    subtypes: []
  };
}

// REQ-167: enough distinct cards to exercise the 5-card cap and a 6th blocked add.
const giantGrowth = simpleCard("oracle-giant-growth", "Giant Growth");
const doomBlade = simpleCard("oracle-doom-blade", "Doom Blade");
const brainstorm = simpleCard("oracle-brainstorm", "Brainstorm");
const wrathOfGod = simpleCard("oracle-wrath-of-god", "Wrath of God");
const allLookupCards = [lightningBolt, counterspell, giantGrowth, doomBlade, brainstorm, wrathOfGod];

const coreTopics = [
  {
    id: "stack-and-priority",
    title: "Stack and Priority",
    ruleNumbers: ["117.1", "405.1"],
    excerpt: "Players use priority to add spells and abilities to the stack."
  },
  {
    id: "combat",
    title: "Combat",
    ruleNumbers: ["506.1"],
    excerpt: "Combat proceeds through five steps."
  }
];

const scrollIntoView = vi.fn();

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

/** REQ-175/FLOW-024: the popup fetches a card's descriptive block by oracle id
 * from `GET /api/cards/:oracleId` — matched here against the same fixtures
 * used to seed `/data/cardMetadata.json`. */
function cardDetailResponseFor(
  url: string,
  cardMetadata: CardFixture[]
): Response | undefined {
  const match = url.match(/\/api\/cards\/([^/?]+)$/);
  if (!match) {
    return undefined;
  }
  const oracleId = decodeURIComponent(match[1]);
  const card = cardMetadata.find((candidate) => candidate.cardId === oracleId);
  if (!card) {
    return new Response(null, { status: 404 });
  }
  return jsonResponse(toCardDetail(card));
}

/** REQ-176: the wire request carries only identity + image now — the
 * descriptive block is resolved server-side by cardId. */
function toWireCard(card: CardMetadataItem): { cardId: string; name: string; imageUrl?: string } {
  return { cardId: card.cardId, name: card.name, imageUrl: card.imageUrl };
}

function appFetchMock(
  answers: string[],
  cardMetadata: CardFixture[] = [lightningBolt, counterspell]
): ReturnType<typeof vi.fn> {
  let answerIndex = 0;
  return vi.fn((input: RequestInfo | URL) => {
    const url = String(input);
    if (url === "/data/cardMetadata.json") {
      return Promise.resolve(jsonResponse(cardMetadata.map(toSlimMetadata)));
    }
    if (url === "/data/gameRulesCoreTopics.json") {
      return Promise.resolve(jsonResponse(coreTopics));
    }
    const cardDetailResponse = cardDetailResponseFor(url, cardMetadata);
    if (cardDetailResponse) {
      return Promise.resolve(cardDetailResponse);
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

async function openGeneralRulesTopics(
  user: ReturnType<typeof userEvent.setup>
): Promise<void> {
  await user.click(
    await screen.findByRole("heading", { name: "General rules topics" })
  );
}

describe("Frontend - Quick Lookup", () => {
describe("QuickLookupApp", () => {
  beforeEach(() => {
    scrollIntoView.mockClear();
    Object.defineProperty(Element.prototype, "scrollIntoView", {
      configurable: true,
      value: scrollIntoView
    });
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false })));
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input);
        if (url === "/data/cardMetadata.json") {
          return Promise.resolve(jsonResponse([lightningBolt, counterspell].map(toSlimMetadata)));
        }
        if (url === "/data/gameRulesCoreTopics.json") {
          return Promise.resolve(jsonResponse(coreTopics));
        }
        const cardDetailResponse = cardDetailResponseFor(url, [lightningBolt, counterspell]);
        if (cardDetailResponse) {
          return Promise.resolve(cardDetailResponse);
        }
        throw new Error(`Unexpected fetch: ${url}`);
      })
    );
  });

  it("renders the confirmed guidance and orders card, question, then collapsed general topics", async () => {
    const user = userEvent.setup();
    render(<QuickLookupApp />);

    expect(screen.queryByText("Browse core rules topics")).not.toBeInTheDocument();

    const cardLabel = screen.getByText("Optional cards").closest("label");
    expect(cardLabel).not.toBeNull();
    expect(cardLabel).toHaveTextContent(
      "Optional cards — Add up to 5 cards for context, or ask any Magic related question."
    );

    const cardSection = cardLabel!.closest("section");
    const questionForm = screen.getByRole("textbox", { name: "Magic question" }).closest("form");
    const topicsHeading = await screen.findByRole("heading", {
      name: "General rules topics"
    });
    const topicsDisclosure = topicsHeading.closest("details");

    expect(cardSection).not.toBeNull();
    expect(questionForm).not.toBeNull();
    expect(topicsDisclosure).not.toBeNull();
    expect(
      cardSection!.compareDocumentPosition(questionForm!) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(
      questionForm!.compareDocumentPosition(topicsDisclosure!) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(topicsDisclosure).not.toHaveAttribute("open");
    expect(screen.getByText("Choose a topic to start a question without calling the model.")).not.toBeVisible();

    await user.click(topicsHeading);

    expect(topicsDisclosure).toHaveAttribute("open");
    expect(screen.getByText("Choose a topic to start a question without calling the model.")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Stack and Priority" })).toBeVisible();
  });

  it("shows one topic excerpt at a time and keeps action clicks from toggling the row", async () => {
    const user = userEvent.setup();
    render(<QuickLookupApp />);
    await openGeneralRulesTopics(user);

    const stackHeading = await screen.findByRole("heading", { name: "Stack and Priority" });
    const combatHeading = screen.getByRole("heading", { name: "Combat" });
    const stackDisclosure = stackHeading.closest("details");
    const combatDisclosure = combatHeading.closest("details");
    const stackAction = screen.getByRole("button", { name: "Add Stack and Priority to question" });

    expect(stackHeading).toBeVisible();
    expect(stackHeading.closest("summary")).toBeVisible();
    expect(stackAction).toBeVisible();
    expect(stackDisclosure).not.toHaveAttribute("open");
    expect(combatDisclosure).not.toHaveAttribute("open");
    expect(screen.getByText(coreTopics[0].excerpt)).not.toBeVisible();
    expect(screen.getByText(coreTopics[1].excerpt)).not.toBeVisible();

    await user.click(stackAction);

    expect(stackDisclosure).not.toHaveAttribute("open");
    expect(fetch).toHaveBeenCalledTimes(2);

    await user.click(stackHeading);

    expect(stackDisclosure).toHaveAttribute("open");
    expect(screen.getByText(coreTopics[0].excerpt)).toBeVisible();

    await user.click(combatHeading);

    expect(stackDisclosure).not.toHaveAttribute("open");
    expect(combatDisclosure).toHaveAttribute("open");
    expect(screen.getByText(coreTopics[0].excerpt)).not.toBeVisible();
    expect(screen.getByText(coreTopics[1].excerpt)).toBeVisible();
  });

  it("locks, swaps, removes, and composes a topic without overwriting textarea text", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<QuickLookupApp onSubmit={onSubmit} />);
    await openGeneralRulesTopics(user);

    const questionInput = screen.getByRole("textbox", { name: "Magic question" });
    await user.type(questionInput, "Keep this detail");
    await user.click(
      await screen.findByRole("button", { name: "Add Stack and Priority to question" })
    );

    expect(screen.getByText("Tell me about Stack and Priority.")).toBeInTheDocument();
    expect(questionInput).toHaveValue("Keep this detail");
    expect(questionInput).toHaveAttribute(
      "placeholder",
      "Add anything specific — or leave this blank and just ask."
    );
    expect(document.activeElement).toBe(questionInput);
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "center" });

    await user.click(screen.getByRole("button", { name: "Add Combat to question" }));

    expect(screen.queryByText("Tell me about Stack and Priority.")).not.toBeInTheDocument();
    expect(screen.getByText("Tell me about Combat.")).toBeInTheDocument();
    expect(questionInput).toHaveValue("Keep this detail");

    await user.click(screen.getByRole("button", { name: "Ask TheJudge" }));
    expect(onSubmit).toHaveBeenLastCalledWith("Tell me about Combat. Keep this detail", []);

    await user.clear(questionInput);
    await user.click(screen.getByRole("button", { name: "Ask TheJudge" }));
    expect(onSubmit).toHaveBeenLastCalledWith("Tell me about Combat.", []);

    await user.click(screen.getByRole("button", { name: "Remove Combat topic" }));

    expect(screen.queryByText("Tell me about Combat.")).not.toBeInTheDocument();
    expect(questionInput).toHaveAttribute("placeholder", "What would you like to know?");
    expect(screen.getByRole("button", { name: "Ask TheJudge" })).toBeDisabled();
  });

  it("uses non-animated scrolling when reduced motion is preferred", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true })));
    render(<QuickLookupApp />);
    await openGeneralRulesTopics(user);

    await user.click(
      await screen.findByRole("button", { name: "Add Stack and Priority to question" })
    );

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "auto", block: "center" });
  });

  it("resolves one card from autocomplete and supports removal", async () => {
    const user = userEvent.setup();
    render(<QuickLookupApp />);

    const searchInput = screen.getByRole("textbox", { name: "Card search" });
    await user.type(searchInput, "lig");
    await user.click(await screen.findByRole("button", { name: "Lightning Bolt" }));

    // REQ-133/DEC-160: the staged card is the image itself — the duplicated name heading and
    // metadata panel beside it are gone, so nothing repeats what the popup already carries.
    expect(screen.getByRole("img", { name: "Lightning Bolt" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Lightning Bolt" })).not.toBeInTheDocument();
    // Oracle text is not stacked under the image by default (DEC-151) — it is reached via
    // the suite-wide corner detail popup.
    expect(screen.queryByText(lightningBolt.oracleText!)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Show details for Lightning Bolt" }));
    expect(await screen.findByText(lightningBolt.oracleText!)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Close details for Lightning Bolt" }));
    expect(screen.getByRole("heading", { name: "General rules topics" })).toBeVisible();
    await openGeneralRulesTopics(user);
    expect(screen.getByRole("heading", { name: "Stack and Priority" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Remove Lightning Bolt" }));

    expect(screen.queryByRole("img", { name: "Lightning Bolt" })).not.toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Stack and Priority" })).toBeInTheDocument();
  });

  it("shows the shared no-match copy for a three-character query", async () => {
    const user = userEvent.setup();
    render(<QuickLookupApp />);

    await user.type(screen.getByRole("textbox", { name: "Card search" }), "zzz");

    expect(await screen.findByText(NO_MATCH_COPY)).toBeInTheDocument();
  });

  it("uses accent palette tokens for the Scan and Ask controls, not a fixed hue", async () => {
    render(<QuickLookupApp />);

    const scanButton = screen.getByRole("button", { name: "Scan a card" });
    const askButton = screen.getByRole("button", { name: "Ask TheJudge" });
    expect(scanButton).toHaveClass("border-accent/70", "bg-accent/15", "text-accent-soft");
    expect(askButton).toHaveClass("from-accent", "to-accent-strong", "text-accent-contrast");
    expect(scanButton.className).not.toMatch(/emerald|green|sky|blue-[0-9]/);
    expect(askButton.className).not.toMatch(/emerald|green|sky|blue-[0-9]/);
  });

  it("uses the shared scan flow to resolve a single card", async () => {
    const user = userEvent.setup();
    render(<QuickLookupApp />);

    await waitFor(() => expect(fetch).toHaveBeenCalledWith("/data/cardMetadata.json", expect.anything()));
    await user.click(screen.getByRole("button", { name: "Scan a card" }));

    expect(await screen.findByRole("img", { name: "Counterspell" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Show details for Counterspell" }));
    expect(await screen.findByText(counterspell.oracleText!)).toBeInTheDocument();
  });

  it("caps the raw question at 300 characters and blocks blank submission", async () => {
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
    expect(screen.getByText("300/300")).toBeInTheDocument();
    expect(submitButton).toBeEnabled();
    await openGeneralRulesTopics(user);

    // The counter and the gate measure the editable textarea, so a locked topic neither
    // inflates the visible count nor blocks a full-length question. The submitted string
    // is still the composed pill phrase plus the trimmed text, and may exceed 300.
    await user.click(
      await screen.findByRole("button", { name: "Add Stack and Priority to question" })
    );
    expect(screen.getByText("300/300")).toBeInTheDocument();
    expect(submitButton).toBeEnabled();

    await user.click(submitButton);
    expect(onSubmit).toHaveBeenLastCalledWith(
      `Tell me about Stack and Priority. ${"a".repeat(300)}`,
      []
    );

    await user.click(screen.getByRole("button", { name: "Remove Stack and Priority topic" }));
    expect(screen.getByText("300/300")).toBeInTheDocument();
    expect(submitButton).toBeEnabled();

    await user.click(submitButton);
    expect(onSubmit).toHaveBeenLastCalledWith("a".repeat(300), []);
  });

  it("counts the editable text rather than the silent card fallback", async () => {
    const user = userEvent.setup();
    render(<QuickLookupApp />);

    await user.type(screen.getByRole("textbox", { name: "Card search" }), "lig");
    await user.click(await screen.findByRole("button", { name: "Lightning Bolt" }));

    const questionInput = screen.getByRole("textbox", { name: "Magic question" });
    expect(screen.getByText("0/300")).toBeInTheDocument();

    await user.type(questionInput, "x");
    expect(screen.getByText("1/300")).toBeInTheDocument();

    await user.clear(questionInput);
    expect(screen.getByText("0/300")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ask TheJudge" })).toBeEnabled();
  });

  it("keeps the visible count on raw text while topics are locked, swapped, and removed", async () => {
    const user = userEvent.setup();
    render(<QuickLookupApp />);
    await openGeneralRulesTopics(user);

    const questionInput = screen.getByRole("textbox", { name: "Magic question" });
    await user.click(
      await screen.findByRole("button", { name: "Add Stack and Priority to question" })
    );
    expect(screen.getByText("0/300")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ask TheJudge" })).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "Add Combat to question" }));
    expect(screen.getByText("0/300")).toBeInTheDocument();

    await user.type(questionInput, "Keep this detail");
    expect(screen.getByText("16/300")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Remove Combat topic" }));
    expect(screen.getByText("16/300")).toBeInTheDocument();
  });

  it("submits a silent card-name fallback when only a card is attached", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<QuickLookupApp onSubmit={onSubmit} />);

    await user.type(screen.getByRole("textbox", { name: "Card search" }), "lig");
    await user.click(await screen.findByRole("button", { name: "Lightning Bolt" }));

    const submitButton = screen.getByRole("button", { name: "Ask TheJudge" });
    expect(submitButton).toBeEnabled();
    await user.click(submitButton);

    expect(onSubmit).toHaveBeenCalledWith("Tell me about Lightning Bolt.", [toSlimMetadata(lightningBolt)]);
  });

  it("replaces the question form during the initial wait and restores it on error", async () => {
    const user = userEvent.setup();
    let resolveAskAi: ((response: Response) => void) | undefined;
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url === "/data/cardMetadata.json") {
        return Promise.resolve(jsonResponse([lightningBolt, counterspell].map(toSlimMetadata)));
      }
      if (url === "/data/gameRulesCoreTopics.json") {
        return Promise.resolve(jsonResponse(coreTopics));
      }
      if (url === "http://localhost:3000/api/ask-ai") {
        return new Promise<Response>((resolve) => {
          resolveAskAi = resolve;
        });
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<QuickLookupApp />);

    await user.type(
      screen.getByRole("textbox", { name: "Magic question" }),
      "How does priority work?"
    );
    await user.click(screen.getByRole("button", { name: "Ask TheJudge" }));

    expect(await screen.findByText("Consulting the stack…")).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Magic question" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ask TheJudge" })).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Card search" })).toBeEnabled();
    const topicsHeading = screen.getByRole("heading", { name: "General rules topics" });
    expect(topicsHeading).toBeVisible();

    await user.click(topicsHeading);
    expect(screen.getByRole("heading", { name: "Stack and Priority" })).toBeVisible();

    await act(async () => {
      resolveAskAi?.(
        new Response(
          JSON.stringify({
            code: "PROVIDER_UNAVAILABLE",
            message: "Miho is working on it",
            retryAfterSeconds: 13
          }),
          {
            status: 502,
            headers: { "Content-Type": "application/json" }
          }
        )
      );
    });

    expect(await screen.findByText("Miho is working on it")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Magic question" })).toHaveValue(
      "How does priority work?"
    );
    expect(screen.getByRole("button", { name: "Ask TheJudge" })).toBeInTheDocument();
    expect(screen.queryByText("Consulting the stack…")).not.toBeInTheDocument();
  });

  it("runs a cardless assistant-first conversation and restores core topics on start over", async () => {
    const user = userEvent.setup();
    const fetchMock = appFetchMock(["First lookup answer", "Follow-up lookup answer"]);
    vi.stubGlobal("fetch", fetchMock);
    render(<QuickLookupApp />);

    await user.type(screen.getByRole("textbox", { name: "Magic question" }), "How does priority work?");
    await user.click(screen.getByRole("button", { name: "Ask TheJudge" }));

    expect(await screen.findByText("First lookup answer")).toBeInTheDocument();
    expect(screen.getAllByTestId("conversation-workspace")).toHaveLength(1);
    expect(screen.getByRole("log")).toHaveAttribute("aria-relevant", "additions text");
    expect(screen.queryByText("How does priority work?")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /View context:/ })).not.toBeInTheDocument();
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
    expect(await screen.findByRole("heading", { name: "General rules topics" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Stack and Priority" })).not.toBeVisible();
  });

  it("freezes an attached card for the thread and follow-ups, then clears it on start over", async () => {
    const user = userEvent.setup();
    const fetchMock = appFetchMock(["Card lookup answer", "Card follow-up answer"]);
    vi.stubGlobal("fetch", fetchMock);
    render(<QuickLookupApp />);

    await user.type(screen.getByRole("textbox", { name: "Card search" }), "lig");
    await user.click(await screen.findByRole("button", { name: "Lightning Bolt" }));
    await openGeneralRulesTopics(user);
    await user.click(
      await screen.findByRole("button", { name: "Add Stack and Priority to question" })
    );
    await user.type(screen.getByRole("textbox", { name: "Magic question" }), "What can this target?");
    await user.click(screen.getByRole("button", { name: "Ask TheJudge" }));

    expect(await screen.findByText("Card lookup answer")).toBeInTheDocument();
    expect(screen.getAllByTestId("conversation-workspace")).toHaveLength(1);
    expect(screen.queryByRole("img", { name: "Lightning Bolt" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove Lightning Bolt" })).not.toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "View context: Lightning Bolt" })
    );
    const contextDialog = screen.getByRole("dialog", { name: "Card context" });
    // The frozen card inside View Context is the same consolidated shell-column image.
    expect(contextDialog).toContainElement(screen.getByRole("img", { name: "Lightning Bolt" }));
    expect(screen.queryByRole("button", { name: "Remove Lightning Bolt" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Close card context" }));
    const initialAskRequest = fetchMock.mock.calls.find(([input]) =>
      String(input).endsWith("/api/ask-ai")
    );
    expect(JSON.parse(initialAskRequest?.[1]?.body as string)).toEqual({
      mode: "lookup",
      question: "Tell me about Stack and Priority. What can this target?",
      cards: [toWireCard(lightningBolt)]
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
      cards: [toWireCard(lightningBolt)]
    });

    await user.click(screen.getByRole("button", { name: "Start Over" }));

    expect(screen.queryByText("Card lookup answer")).not.toBeInTheDocument();
    expect(screen.queryByRole("img", { name: "Lightning Bolt" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove Lightning Bolt" })).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Card search" })).toHaveValue("");
    expect(screen.getByRole("textbox", { name: "Magic question" })).toHaveValue("");
    expect(screen.queryByText("Tell me about Stack and Priority.")).not.toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "General rules topics" })).toBeVisible();
  });

  describe("multi-card lookup (REQ-167)", () => {
    async function addCardByName(user: ReturnType<typeof userEvent.setup>, query: string, name: string): Promise<void> {
      const searchInput = screen.getByRole("textbox", { name: "Card search" });
      await user.clear(searchInput);
      await user.type(searchInput, query);
      await user.click(await screen.findByRole("button", { name }));
    }

    it("adds, previews, and removes more than one card via typed search", async () => {
      const user = userEvent.setup();
      vi.stubGlobal("fetch", appFetchMock([], allLookupCards));
      render(<QuickLookupApp />);

      await addCardByName(user, "lig", "Lightning Bolt");
      await addCardByName(user, "cou", "Counterspell");

      expect(screen.getByRole("img", { name: "Lightning Bolt" })).toBeInTheDocument();
      expect(screen.getByRole("img", { name: "Counterspell" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Remove Lightning Bolt" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Remove Counterspell" })).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Remove Lightning Bolt" }));

      expect(screen.queryByRole("img", { name: "Lightning Bolt" })).not.toBeInTheDocument();
      expect(screen.getByRole("img", { name: "Counterspell" })).toBeInTheDocument();
    });

    it("blocks an add past the 5-card cap and states the limit to the player", async () => {
      const user = userEvent.setup();
      vi.stubGlobal("fetch", appFetchMock([], allLookupCards));
      render(<QuickLookupApp />);

      await addCardByName(user, "lig", "Lightning Bolt");
      await addCardByName(user, "cou", "Counterspell");
      await addCardByName(user, "gia", "Giant Growth");
      await addCardByName(user, "doo", "Doom Blade");
      await addCardByName(user, "bra", "Brainstorm");

      expect(screen.queryByText(/You've added 5 cards/)).not.toBeInTheDocument();

      const searchInput = screen.getByRole("textbox", { name: "Card search" });
      await user.clear(searchInput);
      await user.type(searchInput, "wra");
      await user.click(await screen.findByRole("button", { name: "Wrath of God" }));

      expect(
        screen.getByText("You've added 5 cards, the most one Quick Question can use. Remove a card below to add another.")
      ).toBeInTheDocument();
      expect(screen.queryByRole("img", { name: "Wrath of God" })).not.toBeInTheDocument();
      expect(screen.getAllByRole("button", { name: /^Remove / })).toHaveLength(5);
    });

    it("submits the full attached card list, freezes every card in context, and sends the frozen set on a follow-up", async () => {
      const user = userEvent.setup();
      const fetchMock = appFetchMock(["Multi-card answer", "Multi-card follow-up answer"], allLookupCards);
      vi.stubGlobal("fetch", fetchMock);
      render(<QuickLookupApp />);

      await addCardByName(user, "lig", "Lightning Bolt");
      await addCardByName(user, "cou", "Counterspell");
      await user.type(screen.getByRole("textbox", { name: "Magic question" }), "How do these interact?");
      await user.click(screen.getByRole("button", { name: "Ask TheJudge" }));

      expect(await screen.findByText("Multi-card answer")).toBeInTheDocument();
      const initialAskRequest = fetchMock.mock.calls.find(([input]) => String(input).endsWith("/api/ask-ai"));
      expect(JSON.parse(initialAskRequest?.[1]?.body as string)).toEqual({
        mode: "lookup",
        question: "How do these interact?",
        cards: [toWireCard(lightningBolt), toWireCard(counterspell)]
      });

      const contextTrigger = screen.getByRole("button", { name: "View context: 2 cards" });
      await user.click(contextTrigger);
      const contextDialog = screen.getByRole("dialog", { name: "Card context" });
      expect(contextDialog).toContainElement(screen.getByRole("img", { name: "Lightning Bolt" }));
      expect(contextDialog).toContainElement(screen.getByRole("img", { name: "Counterspell" }));
      await user.click(screen.getByRole("button", { name: "Close card context" }));

      await user.type(screen.getByRole("textbox", { name: "Follow-up question" }), "What if both resolve?");
      await user.click(screen.getByRole("button", { name: "Send" }));

      expect(await screen.findByText("Multi-card follow-up answer")).toBeInTheDocument();
      const askRequests = fetchMock.mock.calls.filter(([input]) => String(input).endsWith("/api/ask-ai"));
      expect(JSON.parse(askRequests[1]?.[1]?.body as string)).toMatchObject({
        mode: "lookup",
        question: "What if both resolve?",
        cards: [toWireCard(lightningBolt), toWireCard(counterspell)]
      });
    });
  });
});
});
