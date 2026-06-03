import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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
import { NO_MATCH_COPY } from "./lib/search";
import type { AskAiRequest, CardMetadataItem } from "./types";

const baseCardMetadataFixture: CardMetadataItem[] = [
  {
    cardId: "opt",
    name: "Opt",
    oracleText: "Scry 1, then draw a card.",
    imageUrl: "",
    manaCost: "{U}",
    manaValue: 1,
    typeLine: "Instant",
    colors: ["U"],
    supertypes: [],
    subtypes: []
  },
  {
    cardId: "counterspell",
    name: "Counterspell",
    oracleText: "Counter target spell.",
    imageUrl: "",
    manaCost: "{U}{U}",
    manaValue: 2,
    typeLine: "Instant",
    colors: ["U"],
    supertypes: [],
    subtypes: []
  },
  {
    cardId: "lightning-bolt",
    name: "Lightning Bolt",
    oracleText: "Lightning Bolt deals 3 damage to any target.",
    imageUrl: "https://example.com/lightning-bolt.jpg",
    manaCost: "{R}",
    manaValue: 1,
    typeLine: "Instant",
    colors: ["R"],
    supertypes: [],
    subtypes: []
  }
];

let fetchMock: ReturnType<typeof vi.fn>;
let metadataFixture: CardMetadataItem[] = [];
let askAiResponseQueue: Array<{ status: number; body: unknown; headers?: Record<string, string> }> = [];
const submittedAskAiRequests: AskAiRequest[] = [];
const submittedAskAiHeaders: Array<Record<string, string>> = [];

function jsonResponse(payload: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json", ...headers }
  });
}

function getUrlFromRequest(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

function createStackItem(name: string, index: number): CardMetadataItem {
  return {
    cardId: `card-${index}`,
    name,
    oracleText: `${name} oracle text.`,
    imageUrl: "",
    manaCost: "{1}",
    manaValue: 1,
    typeLine: "Instant",
    colors: [],
    supertypes: [],
    subtypes: []
  };
}

function normalizeHeaders(initHeaders: RequestInit["headers"]): Record<string, string> {
  if (!initHeaders) return {};
  if (initHeaders instanceof Headers) {
    return Object.fromEntries(initHeaders.entries());
  }

  if (Array.isArray(initHeaders)) {
    return Object.fromEntries(initHeaders);
  }

  return Object.fromEntries(
    Object.entries(initHeaders).map(([key, value]) => [key.toLowerCase(), String(value)])
  );
}

function queueAskAiResponses(...responses: Array<{ status: number; body: unknown; headers?: Record<string, string> }>): void {
  askAiResponseQueue = responses;
}

async function waitForMetadataReady(): Promise<void> {
  await screen.findByPlaceholderText("Type to begin");
}

async function advanceToStackBuilder(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await user.click(screen.getByRole("button", { name: "Confirm game context" }));
  await user.click(screen.getByLabelText("Zone: Stack"));
  await user.click(screen.getByRole("button", { name: "Continue" }));
}

async function advancePastZoneConfirm(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await user.click(screen.getByRole("button", { name: "Continue" }));
}

async function advanceToBattlefieldZoneCollection(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await user.click(screen.getByRole("button", { name: "Confirm game context" }));
  await user.click(screen.getByLabelText("Zone: Battlefield"));
  await advancePastZoneConfirm(user);
}

async function advancePastZoneCollection(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await user.click(screen.getByRole("button", { name: "Continue" }));
}

async function advanceToContextEnrichmentFromZones(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await advancePastZoneCollection(user);
  await user.click(screen.getByRole("button", { name: "Continue to enrichment" }));
}

async function advanceToZoneCollectionWithZones(
  user: ReturnType<typeof userEvent.setup>,
  zones: string[]
): Promise<void> {
  for (const zone of zones) {
    await user.click(screen.getByLabelText(`Zone: ${zone}`));
  }
  await advancePastZoneConfirm(user);
}

async function selectZoneTab(user: ReturnType<typeof userEvent.setup>, zone: string): Promise<void> {
  await user.click(screen.getByRole("button", { name: `Zone tab: ${zone}` }));
}

async function addCardToActiveZone(
  user: ReturnType<typeof userEvent.setup>,
  query: string,
  cardName: string
): Promise<void> {
  const searchInput = screen.getByPlaceholderText("Type to begin");
  await user.clear(searchInput);
  await user.type(searchInput, query);
  await user.click(await screen.findByRole("button", { name: cardName }));
  await user.click(screen.getByRole("button", { name: /Begin stackening!|Add to Stack|Add card/ }));
  await user.clear(searchInput);
}

async function openStackBuilder(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await advanceToStackBuilder(user);
  await waitForMetadataReady();
}

function readSuggestionNamesFromPanel(searchInput: HTMLElement): string[] {
  const searchLabel = searchInput.closest("label");
  const suggestionPanel = searchLabel?.nextElementSibling;
  if (!(suggestionPanel instanceof HTMLElement)) {
    return [];
  }
  const hasAutocompleteContent =
    within(suggestionPanel).queryByText("Loading cards...") !== null ||
    within(suggestionPanel).queryByText(NO_MATCH_COPY) !== null ||
    suggestionPanel.querySelector("ul") !== null;
  if (!hasAutocompleteContent) {
    return [];
  }

  if (within(suggestionPanel).queryByText(NO_MATCH_COPY)) {
    return [];
  }

  return within(suggestionPanel)
    .queryAllByRole("button")
    .map((button) => button.textContent?.trim() ?? "")
    .filter((name) => name.length > 0);
}

async function selectCard(user: ReturnType<typeof userEvent.setup>, query: string, cardName: string): Promise<void> {
  const searchInput = screen.getByPlaceholderText("Type to begin");
  await user.clear(searchInput);
  await user.type(searchInput, query);
  await user.click(await screen.findByRole("button", { name: cardName }));
}

async function addCardToStack(
  user: ReturnType<typeof userEvent.setup>,
  query: string,
  cardName: string
): Promise<void> {
  await selectCard(user, query, cardName);
  await user.click(screen.getByRole("button", { name: /Begin stackening!|Add to Stack/ }));
  await user.clear(screen.getByPlaceholderText("Type to begin"));
}

async function clickDecryptStack(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  if (screen.queryByRole("heading", { name: "Add cards to zones" })) {
    await advanceToContextEnrichmentFromZones(user);
  } else if (screen.queryByRole("button", { name: "Continue to enrichment" })) {
    await user.click(screen.getByRole("button", { name: "Continue to enrichment" }));
  }
  const continueButton = screen.queryByRole("button", { name: "Continue to context enrichment" });
  if (continueButton) {
    await user.click(continueButton);
  }
  await user.click(screen.getByRole("button", { name: "Decrypt Stack" }));
}

async function advanceToContextEnrichment(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await advanceToContextEnrichmentFromZones(user);
}

describe("App MVP interaction flows", () => {
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
        submittedAskAiRequests.push(JSON.parse(String(init.body)) as AskAiRequest);
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

  it("shows suggestions only at threshold and supports suggestion-to-preview selection", async () => {
    const user = userEvent.setup();
    render(<App />);
    await openStackBuilder(user);

    const searchInput = screen.getByPlaceholderText("Type to begin");
    await user.type(searchInput, "op");
    expect(screen.queryByRole("button", { name: "Opt" })).not.toBeInTheDocument();

    await user.type(searchInput, "t");
    await user.click(await screen.findByRole("button", { name: "Opt" }));

    expect(screen.getByRole("heading", { name: "Opt" })).toBeInTheDocument();
    expect(screen.getByText("Scry 1, then draw a card.")).toBeInTheDocument();
  });

  it("shows TheJudge title on first render", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: "TheJudge" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Game context" })).toBeInTheDocument();
  });

  it("defaults to 20 life for 2 players and 40 for 3+ players", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByLabelText("Player 1 life total")).toHaveValue("20");
    expect(screen.getByLabelText("Player 2 life total")).toHaveValue("20");
    expect(screen.queryByLabelText("Player 3 life total")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Add player" }));

    expect(screen.getByLabelText("Player 1 life total")).toHaveValue("40");
    expect(screen.getByLabelText("Player 2 life total")).toHaveValue("40");
    expect(screen.getByLabelText("Player 3 life total")).toHaveValue("40");

    await user.click(screen.getByRole("button", { name: "Remove last player" }));

    expect(screen.getByLabelText("Player 1 life total")).toHaveValue("20");
    expect(screen.getByLabelText("Player 2 life total")).toHaveValue("20");
    expect(screen.queryByLabelText("Player 3 life total")).not.toBeInTheDocument();
  });

  it("supports keyboard suggestion navigation and selection in stack builder search", async () => {
    const user = userEvent.setup();
    render(<App />);
    await openStackBuilder(user);

    const searchInput = screen.getByPlaceholderText("Type to begin");
    await user.type(searchInput, "lig");
    expect(await screen.findByRole("button", { name: "Lightning Bolt" })).toBeInTheDocument();

    fireEvent.keyDown(searchInput, { key: "ArrowDown" });
    fireEvent.keyDown(searchInput, { key: "Enter" });

    expect(screen.getByRole("heading", { name: "Lightning Bolt" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Lightning Bolt" })).not.toBeInTheDocument();
  });

  it("supports keyboard selection and escape-dismiss behavior in battlefield search", async () => {
    const user = userEvent.setup();
    render(<App />);

    await advanceToBattlefieldZoneCollection(user);

    const battlefieldSearchInput = screen.getByLabelText("Battlefield search input");
    await user.type(battlefieldSearchInput, "lig");
    expect(await screen.findByRole("button", { name: "Lightning Bolt" })).toBeInTheDocument();

    fireEvent.keyDown(battlefieldSearchInput, { key: "Escape" });
    expect(screen.queryByRole("button", { name: "Lightning Bolt" })).not.toBeInTheDocument();

    await user.type(battlefieldSearchInput, "h");
    expect(await screen.findByRole("button", { name: "Lightning Bolt" })).toBeInTheDocument();

    fireEvent.keyDown(battlefieldSearchInput, { key: "ArrowDown" });
    fireEvent.keyDown(battlefieldSearchInput, { key: "Enter" });

    expect(screen.getByRole("heading", { name: "Lightning Bolt" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Battlefield item details")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Lightning Bolt" })).not.toBeInTheDocument();
  });

  it("keeps ordered suggestions, threshold, and no-match behavior in parity across stack and battlefield flows", async () => {
    const parityFixture: CardMetadataItem[] = [
      {
        cardId: "swords-to-plowshares",
        name: "Swords to Plowshares",
        oracleText: "Exile target creature.",
        imageUrl: "",
        manaCost: "{W}",
        manaValue: 1,
        typeLine: "Instant",
        colors: ["W"],
        supertypes: [],
        subtypes: []
      },
      {
        cardId: "sword-of-fire-and-ice",
        name: "Sword of Fire and Ice",
        oracleText: "Equipped creature gets +2/+2 and has protection from red and from blue.",
        imageUrl: "",
        manaCost: "{3}",
        manaValue: 3,
        typeLine: "Artifact - Equipment",
        colors: [],
        supertypes: [],
        subtypes: ["Equipment"]
      },
      {
        cardId: "swiftfoot-boots",
        name: "Swiftfoot Boots",
        oracleText: "Equipped creature has hexproof and haste.",
        imageUrl: "",
        manaCost: "{2}",
        manaValue: 2,
        typeLine: "Artifact - Equipment",
        colors: [],
        supertypes: [],
        subtypes: ["Equipment"]
      }
    ];
    metadataFixture = parityFixture;
    const user = userEvent.setup();

    const stackView = render(<App />);
    await openStackBuilder(user);
    const stackInput = screen.getByPlaceholderText("Type to begin");

    await user.type(stackInput, "sw");
    expect(readSuggestionNamesFromPanel(stackInput)).toEqual([]);
    expect(screen.queryByText(NO_MATCH_COPY)).not.toBeInTheDocument();

    await user.type(stackInput, "o");
    const stackOrderedSuggestions = await waitFor(() => {
      const names = readSuggestionNamesFromPanel(stackInput);
      expect(names).toEqual(["Swords to Plowshares", "Sword of Fire and Ice"]);
      return names;
    });

    await user.clear(stackInput);
    await user.type(stackInput, "zzz");
    await waitFor(() => {
      expect(readSuggestionNamesFromPanel(stackInput)).toEqual([]);
      expect(screen.queryByRole("button", { name: "Swords to Plowshares" })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Sword of Fire and Ice" })).not.toBeInTheDocument();
    });

    stackView.unmount();

    const battlefieldView = render(<App />);
    await advanceToBattlefieldZoneCollection(user);
    const battlefieldInput = screen.getByLabelText("Battlefield search input");

    await user.type(battlefieldInput, "sw");
    expect(readSuggestionNamesFromPanel(battlefieldInput)).toEqual([]);
    expect(screen.queryByText(NO_MATCH_COPY)).not.toBeInTheDocument();

    await user.type(battlefieldInput, "o");
    await waitFor(() => {
      expect(readSuggestionNamesFromPanel(battlefieldInput)).toEqual(stackOrderedSuggestions);
    });

    await user.clear(battlefieldInput);
    await user.type(battlefieldInput, "zzz");
    await waitFor(() => {
      expect(readSuggestionNamesFromPanel(battlefieldInput)).toEqual([]);
      expect(screen.queryByRole("button", { name: "Swords to Plowshares" })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Sword of Fire and Ice" })).not.toBeInTheDocument();
    });

    battlefieldView.unmount();
  });

  it("keeps suggestion selection behavior in parity between stack and battlefield flows", async () => {
    const user = userEvent.setup();

    const stackView = render(<App />);
    await openStackBuilder(user);
    const stackInput = screen.getByPlaceholderText("Type to begin");
    await user.type(stackInput, "lig");
    await user.click(await screen.findByRole("button", { name: "Lightning Bolt" }));

    expect(screen.getByRole("heading", { name: "Lightning Bolt" })).toBeInTheDocument();
    expect(screen.getByText("Lightning Bolt deals 3 damage to any target.")).toBeInTheDocument();

    stackView.unmount();

    render(<App />);
    await advanceToBattlefieldZoneCollection(user);
    const battlefieldInput = screen.getByLabelText("Battlefield search input");
    await user.type(battlefieldInput, "lig");
    await user.click(await screen.findByRole("button", { name: "Lightning Bolt" }));

    expect(screen.getByRole("heading", { name: "Lightning Bolt" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Battlefield item details")).not.toBeInTheDocument();
  });

  it("keeps collection previews free of context-edit controls", async () => {
    const user = userEvent.setup();
    render(<App />);
    await openStackBuilder(user);

    await user.type(screen.getByPlaceholderText("Type to begin"), "opt");
    await user.click(await screen.findByRole("button", { name: "Opt" }));
    expect(screen.queryByLabelText("Entry target kind")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Entry context notes")).not.toBeInTheDocument();

    const firstView = screen.getByRole("heading", { name: "Opt" });
    expect(firstView).toBeInTheDocument();
  });

  it("keeps battlefield preview free of context-edit controls", async () => {
    const user = userEvent.setup();
    render(<App />);
    await advanceToBattlefieldZoneCollection(user);
    await user.type(screen.getByLabelText("Battlefield search input"), "opt");
    await user.click(await screen.findByRole("button", { name: "Opt" }));
    expect(screen.queryByLabelText("Battlefield target kind")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Battlefield item details")).not.toBeInTheDocument();
  });

  it("enables target editing after entering context enrichment", async () => {
    const user = userEvent.setup();
    render(<App />);
    await openStackBuilder(user);

    await user.type(screen.getByPlaceholderText("Type to begin"), "opt");
    await user.click(await screen.findByRole("button", { name: "Opt" }));
    await user.click(screen.getByRole("button", { name: /Begin stackening!|Add to Stack/ }));
    await advanceToContextEnrichment(user);
    await user.click(screen.getByRole("button", { name: /^Stack/ }));
    await user.selectOptions(screen.getByLabelText("Target kind for Opt"), "player");
    await user.selectOptions(screen.getByLabelText("Player target for Opt"), "Player 2");
    await user.click(screen.getByRole("button", { name: "Add target for Opt" }));
    expect(screen.getByText("Player: Player 2")).toBeInTheDocument();
  });

  it("keeps final context-enrichment chrome compact with only stack access at top", async () => {
    const user = userEvent.setup();
    render(<App />);
    await openStackBuilder(user);

    await addCardToStack(user, "opt", "Opt");
    await advanceToContextEnrichment(user);

    expect(screen.queryByRole("heading", { name: "TheJudge" })).not.toBeInTheDocument();
    expect(screen.queryByText("Game context: 2 players")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Context enrichment: review each card and add caster, target, mana, or notes before submitting.")
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Stack/ })).toBeInTheDocument();
  });

  it("uses first-add then subsequent-add button labels", async () => {
    const user = userEvent.setup();
    render(<App />);
    await openStackBuilder(user);

    await selectCard(user, "opt", "Opt");

    const firstAddButton = screen.getByRole("button", { name: "Begin stackening!" });
    expect(firstAddButton).toBeInTheDocument();

    await user.click(firstAddButton);
    await selectCard(user, "cou", "Counterspell");

    expect(screen.getByRole("button", { name: "Add to Stack" })).toBeInTheDocument();
  });

  it("submits bottom-to-top stack payload after add/remove interactions", async () => {
    const user = userEvent.setup();
    render(<App />);
    await openStackBuilder(user);

    await addCardToStack(user, "opt", "Opt");
    await addCardToStack(user, "cou", "Counterspell");
    await addCardToStack(user, "lig", "Lightning Bolt");

    await advanceToContextEnrichmentFromZones(user);
    await user.click(screen.getByRole("button", { name: /^Stack/ }));
    const counterspellRow = screen.getByLabelText("Caster for Counterspell").closest("li");
    expect(counterspellRow).not.toBeNull();
    await user.click(within(counterspellRow as HTMLLIElement).getByRole("button", { name: "Remove" }));
    await user.click(screen.getByRole("button", { name: "Close" }));

    await clickDecryptStack(user);

    const requestBody = await waitFor(() => {
      expect(submittedAskAiRequests.length).toBeGreaterThan(0);
      return submittedAskAiRequests[0];
    });

    expect(requestBody.question).toBe("Resolve the stack");
    expect(requestBody.gameContext.playerCount).toBe(2);
    expect(requestBody.battlefieldContext).toEqual([]);
    expect(requestBody.stack.map((card) => card.name)).toEqual(["Opt", "Lightning Bolt"]);
    expect(submittedAskAiHeaders[0]["x-correlation-id"]).toMatch(/\S+/);
  });

  it("emits staged-flow milestone logs for game-context confirmation", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Confirm game context" }));
    expect(logFrontendDebugMock).toHaveBeenCalledWith("game_context.confirmed", { playerCount: 2 });

    await user.click(screen.getByLabelText("Zone: Stack"));
    await advancePastZoneConfirm(user);
    expect(screen.getByRole("heading", { name: "Add cards to zones" })).toBeInTheDocument();
  });

  it("logs ask-ai success completion with httpStatus and response correlation id", async () => {
    const user = userEvent.setup();
    queueAskAiResponses({
      status: 200,
      body: { answer: "Done" },
      headers: { "X-Correlation-Id": "srv-corr-999" }
    });
    render(<App />);
    await openStackBuilder(user);
    await addCardToStack(user, "opt", "Opt");

    await clickDecryptStack(user);
    await waitFor(() => {
      expect(logFrontendDebugMock).toHaveBeenCalledWith(
        "ask_ai.request_succeeded",
        expect.objectContaining({
          correlationId: "corr-test-id",
          responseCorrelationId: "srv-corr-999",
          httpStatus: 200
        })
      );
    });

    expect(screen.queryByRole("button", { name: "Decrypt Stack" })).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("How does this resolve?")).not.toBeInTheDocument();
  });

  it("captures caster, typed targets, and notes when adding a stack entry", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Add player" }));
    await user.click(screen.getByRole("button", { name: "Add player" }));
    await openStackBuilder(user);
    await selectCard(user, "opt", "Opt");

    await user.click(screen.getByRole("button", { name: /Begin stackening!|Add to Stack/ }));
    await advanceToContextEnrichment(user);
    await user.click(screen.getByRole("button", { name: /^Stack/ }));
    await user.selectOptions(screen.getByLabelText("Caster for Opt"), "Player 4");
    await user.selectOptions(screen.getByLabelText("Target kind for Opt"), "player");
    await user.selectOptions(screen.getByLabelText("Player target for Opt"), "Player 3");
    await user.click(screen.getByRole("button", { name: "Add target for Opt" }));
    await user.type(screen.getByLabelText("Mana spent for Opt"), "4");
    await user.type(screen.getByLabelText("Context notes for Opt"), "Cast for alternate cost");
    await user.click(screen.getByRole("button", { name: "Close" }));
    await clickDecryptStack(user);

    const requestBody = await waitFor(() => {
      expect(submittedAskAiRequests.length).toBeGreaterThan(0);
      return submittedAskAiRequests[0];
    });

    expect(requestBody.stack[0]).toMatchObject({
      name: "Opt",
      caster: "Player 4",
      targets: [{ kind: "player", targetPlayer: "Player 3" }],
      contextNotes: "Cast for alternate cost",
      manaSpent: 4
    });
  });

  it("supports an other-target context option with freeform text", async () => {
    const user = userEvent.setup();
    render(<App />);

    await openStackBuilder(user);
    await selectCard(user, "opt", "Opt");
    await user.click(screen.getByRole("button", { name: /Begin stackening!|Add to Stack/ }));
    await advanceToContextEnrichment(user);
    await user.click(screen.getByRole("button", { name: /^Stack/ }));
    await user.selectOptions(screen.getByLabelText("Target kind for Opt"), "other");
    await user.type(screen.getByLabelText("Other target for Opt"), "Target defined by delayed trigger context");
    await user.click(screen.getByRole("button", { name: "Add target for Opt" }));
    await user.click(screen.getByRole("button", { name: "Close" }));
    await clickDecryptStack(user);

    const requestBody = await waitFor(() => {
      expect(submittedAskAiRequests.length).toBeGreaterThan(0);
      return submittedAskAiRequests[0];
    });

    expect(requestBody.stack[0]?.targets).toEqual([
      { kind: "other", targetDescription: "Target defined by delayed trigger context" }
    ]);
  });

  it("lets users edit caster and targeting context from stack details", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Add player" }));
    await user.click(screen.getByRole("button", { name: "Add player" }));
    await openStackBuilder(user);
    await addCardToStack(user, "opt", "Opt");

    await advanceToContextEnrichmentFromZones(user);
    await user.click(screen.getByRole("button", { name: /^Stack/ }));
    await user.selectOptions(screen.getByLabelText("Caster for Opt"), "Player 3");
    await user.selectOptions(screen.getByLabelText("Target kind for Opt"), "player");
    await user.selectOptions(screen.getByLabelText("Player target for Opt"), "Player 4");
    await user.click(screen.getByRole("button", { name: "Add target for Opt" }));
    await user.type(screen.getByLabelText("Context notes for Opt"), "Copied from graveyard");
    await user.click(screen.getByRole("button", { name: "Close" }));
    await clickDecryptStack(user);

    const requestBody = await waitFor(() => {
      expect(submittedAskAiRequests.length).toBeGreaterThan(0);
      return submittedAskAiRequests[0];
    });

    expect(requestBody.stack[0]).toMatchObject({
      caster: "Player 3",
      targets: [{ kind: "player", targetPlayer: "Player 4" }],
      contextNotes: "Copied from graveyard"
    });
  });

  it("supports a no-specific-target context option", async () => {
    const user = userEvent.setup();
    render(<App />);

    await openStackBuilder(user);
    await selectCard(user, "opt", "Opt");
    await user.click(screen.getByRole("button", { name: /Begin stackening!|Add to Stack/ }));
    await advanceToContextEnrichment(user);
    await user.click(screen.getByRole("button", { name: /^Stack/ }));
    await user.selectOptions(screen.getByLabelText("Target kind for Opt"), "none");
    await user.click(screen.getByRole("button", { name: "Add target for Opt" }));
    await user.click(screen.getByRole("button", { name: "Close" }));
    await clickDecryptStack(user);

    const requestBody = await waitFor(() => {
      expect(submittedAskAiRequests.length).toBeGreaterThan(0);
      return submittedAskAiRequests[0];
    });

    expect(requestBody.stack[0]?.targets).toEqual([{ kind: "none" }]);
  });

  it("guards Decrypt Stack when stack is empty", async () => {
    const user = userEvent.setup();
    render(<App />);
    await openStackBuilder(user);
    await advanceToContextEnrichmentFromZones(user);

    expect(screen.getByRole("button", { name: "Decrypt Stack" })).toBeDisabled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("shows bundled cat-wizard asset on game-context first screen with graceful fallback", async () => {
    render(<App />);

    const emptyStateImage = screen.getByRole("img", { name: "Cat wizard" });
    expect(emptyStateImage).toHaveAttribute("src", "/assets/cats-homescreen.png");
    expect(screen.getByRole("heading", { name: "Game context" })).toBeInTheDocument();

    fireEvent.error(emptyStateImage);
    expect(screen.getByText("Cat wizard")).toBeInTheDocument();
  });

  it("shows stack icon/count only when cards exist and updates count after removal", async () => {
    const user = userEvent.setup();
    render(<App />);
    await openStackBuilder(user);

    expect(screen.queryByRole("button", { name: /^Stack/ })).not.toBeInTheDocument();

    await addCardToStack(user, "opt", "Opt");
    await addCardToStack(user, "cou", "Counterspell");
    expect(screen.getByRole("button", { name: "Zone tab: Stack" })).toHaveTextContent("Stack (2)");

    await advanceToContextEnrichmentFromZones(user);
    const stackButton = screen.getByRole("button", { name: /^Stack/ });
    expect(stackButton).toHaveTextContent("Stack");
    expect(stackButton).toHaveTextContent("2");

    await user.click(stackButton);
    await user.click(
      within(screen.getByLabelText("Caster for Opt").closest("li") as HTMLLIElement).getByRole("button", {
        name: "Remove"
      })
    );
    expect(screen.getByRole("button", { name: /^Stack/ })).toHaveTextContent("1");
  });

  it("renders stack details bottom-to-top and rows stay usable on image load failure", async () => {
    const user = userEvent.setup();
    render(<App />);
    await openStackBuilder(user);

    await addCardToStack(user, "opt", "Opt");
    await addCardToStack(user, "lig", "Lightning Bolt");

    await advanceToContextEnrichmentFromZones(user);
    await user.click(screen.getByRole("button", { name: /^Stack/ }));

    const stackDetailsHeading = screen.getByRole("heading", { name: "Stack details" });
    const detailsContainer = stackDetailsHeading.closest("div")?.parentElement as HTMLElement;
    const detailsList = within(detailsContainer).getByRole("list");
    const rows = within(detailsList).getAllByRole("listitem");
    expect(within(rows[0]).getByText("Opt")).toBeInTheDocument();
    expect(within(rows[1]).getByText("Lightning Bolt")).toBeInTheDocument();

    const lightningBoltRow = screen.getByLabelText("Caster for Lightning Bolt").closest("li");
    expect(lightningBoltRow).not.toBeNull();

    const lightningImage = within(lightningBoltRow as HTMLLIElement).getByRole("img", { name: "Lightning Bolt" });
    fireEvent.error(lightningImage);
    await user.click(within(lightningBoltRow as HTMLLIElement).getByRole("button", { name: "Remove" }));

    expect(within(detailsList).queryByText("Lightning Bolt")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Stack/ })).toHaveTextContent("1");
  });

  it("blocks duplicate adds and preserves stack entries", async () => {
    const user = userEvent.setup();
    render(<App />);
    await openStackBuilder(user);

    await addCardToStack(user, "opt", "Opt");
    await selectCard(user, "opt", "Opt");
    await user.click(screen.getByRole("button", { name: "Add to Stack" }));

    expect(await screen.findByText("Duplicate cards are not supported in MVP1.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Zone tab: Stack" })).toHaveTextContent("Stack (1)");
  });

  it("clears stack search and preview after adding a card", async () => {
    const user = userEvent.setup();
    render(<App />);
    await openStackBuilder(user);

    const searchInput = screen.getByPlaceholderText("Type to begin");
    await user.type(searchInput, "opt");
    await user.click(await screen.findByRole("button", { name: "Opt" }));
    await user.click(screen.getByRole("button", { name: "Begin stackening!" }));

    expect(screen.getByPlaceholderText("Type to begin")).toHaveValue("");
    expect(screen.queryByRole("heading", { name: "Opt" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add to Stack" })).not.toBeInTheDocument();
  });

  it("blocks an 11th card and keeps existing ordered stack entries unchanged", async () => {
    const user = userEvent.setup();
    const uniqueCardNames = [
      "Alpha Pivot",
      "Bravo Scope",
      "Charlie Weave",
      "Delta Spark",
      "Echo Pulse",
      "Foxtrot Ward",
      "Gamma Sigil",
      "Helix Arc",
      "Ion Drift",
      "Jade Rune",
      "Kite Bloom"
    ];
    const manyCards = uniqueCardNames.map((name, index) => createStackItem(name, index));
    metadataFixture = manyCards;
    render(<App />);
    await openStackBuilder(user);

    for (const card of manyCards.slice(0, 10)) {
      await addCardToStack(user, card.name, card.name);
    }

    expect(screen.getByRole("button", { name: "Zone tab: Stack" })).toHaveTextContent("Stack (10)");

    await selectCard(user, manyCards[10].name, manyCards[10].name);
    await user.click(screen.getByRole("button", { name: "Add to Stack" }));

    expect(await screen.findByText("MVP stack limit reached (10 cards).")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Zone tab: Stack" })).toHaveTextContent("Stack (10)");

    await advanceToContextEnrichmentFromZones(user);
    await user.click(screen.getByRole("button", { name: /^Stack/ }));
    const stackDetailsHeading = screen.getByRole("heading", { name: "Stack details" });
    const detailsContainer = stackDetailsHeading.closest("div")?.parentElement as HTMLElement;
    const detailsList = within(detailsContainer).getByRole("list");
    const detailRows = within(detailsList).getAllByRole("listitem");
    expect(detailRows).toHaveLength(10);
    for (let index = 0; index < detailRows.length; index += 1) {
      expect(within(detailRows[index]).getByText(manyCards[index].name)).toBeInTheDocument();
    }
  });

  it("hides optional-question submit controls after response is received", async () => {
    const user = userEvent.setup();
    queueAskAiResponses({ status: 200, body: { answer: "First success answer" } });
    render(<App />);
    await openStackBuilder(user);
    await addCardToStack(user, "opt", "Opt");
    await advanceToContextEnrichment(user);

    const questionInput = screen.getByPlaceholderText("How does this resolve?");
    await user.type(questionInput, "Will this resolve?");

    await clickDecryptStack(user);
    expect(await screen.findByText("First success answer")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Decrypt Stack" })).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("How does this resolve?")).not.toBeInTheDocument();
    expect(screen.queryByText("Optional question")).not.toBeInTheDocument();

    expect(screen.getByRole("button", { name: /^Stack/ })).toHaveTextContent("1");
  });

  it("enforces retry cooldown and keeps context through repeated failures", async () => {
    const user = userEvent.setup();
    queueAskAiResponses(
      { status: 502, body: { error: "Miho is working on it", retryAfterSeconds: 13 } },
      { status: 502, body: { error: "Miho is working on it", retryAfterSeconds: 13 } }
    );
    render(<App />);
    await openStackBuilder(user);
    await addCardToStack(user, "opt", "Opt");
    await advanceToContextEnrichment(user);

    const questionInput = screen.getByPlaceholderText("How does this resolve?");
    await user.type(questionInput, "Retry this");
    vi.useFakeTimers();
    fireEvent.click(screen.getByRole("button", { name: "Decrypt Stack" }));

    await act(async () => {
      await Promise.resolve();
    });

    const retryButton = screen.getByRole("button", { name: "Retry in 13s" });
    expect(retryButton).toBeDisabled();
    expect(screen.getByText("Miho is working on it")).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(12000);
    });
    expect(screen.getByRole("button", { name: "Retry in 1s" })).toBeDisabled();

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    const enabledRetryButton = screen.getByRole("button", { name: "Retry" });
    expect(enabledRetryButton).toBeEnabled();
    fireEvent.click(enabledRetryButton);

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByRole("button", { name: "Retry in 13s" })).toBeDisabled();
    expect(screen.getByRole("button", { name: /^Stack/ })).toHaveTextContent("1");
    expect(questionInput).toHaveValue("Retry this");
    expect(submittedAskAiRequests).toHaveLength(2);

  });

  it("retries with identical staged context payload after failure", async () => {
    const user = userEvent.setup();
    queueAskAiResponses(
      { status: 502, body: { error: "Miho is working on it", retryAfterSeconds: 13 } },
      { status: 502, body: { error: "Miho is working on it", retryAfterSeconds: 13 } }
    );
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Add player" }));
    await user.clear(screen.getByLabelText("Player 1 life total"));
    await user.type(screen.getByLabelText("Player 1 life total"), "38");
    await user.clear(screen.getByLabelText("Player 2 life total"));
    await user.type(screen.getByLabelText("Player 2 life total"), "24");
    await user.clear(screen.getByLabelText("Player 3 life total"));
    await user.type(screen.getByLabelText("Player 3 life total"), "17");
    await user.click(screen.getByRole("button", { name: "Confirm game context" }));
    await advanceToZoneCollectionWithZones(user, ["Battlefield", "Stack"]);

    await selectZoneTab(user, "Battlefield");
    await addCardToActiveZone(user, "lig", "Lightning Bolt");
    await selectZoneTab(user, "Stack");
    await addCardToActiveZone(user, "opt", "Opt");
    await advanceToContextEnrichmentFromZones(user);

    vi.useFakeTimers();
    fireEvent.click(screen.getByRole("button", { name: "Decrypt Stack" }));
    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      vi.advanceTimersByTime(13000);
    });
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    await act(async () => {
      await Promise.resolve();
    });

    expect(submittedAskAiRequests).toHaveLength(2);
    expect(submittedAskAiRequests[1]).toEqual(submittedAskAiRequests[0]);
    expect(submittedAskAiRequests[0]).toMatchObject({
      gameContext: {
        playerCount: 3,
        players: [
          { label: "Player 1", lifeTotal: 38 },
          { label: "Player 2", lifeTotal: 24 },
          { label: "Player 3", lifeTotal: 17 }
        ]
      },
      battlefieldContext: [
        {
          name: "Lightning Bolt"
        }
      ],
      stack: [{ name: "Opt" }]
    });
  });

  it("requires game context before showing stack builder", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByRole("heading", { name: "Game context" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Confirm game context" }));
    expect(screen.getByRole("heading", { name: "Zone confirmation" })).toBeInTheDocument();
    await advancePastZoneConfirm(user);
    expect(screen.getByRole("heading", { name: "Add cards to zones" })).toBeInTheDocument();
  });

  it("captures battlefield context and submits it in ask-ai payload", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Confirm game context" }));
    await advanceToZoneCollectionWithZones(user, ["Battlefield", "Stack"]);

    await selectZoneTab(user, "Battlefield");
    await addCardToActiveZone(user, "lig", "Lightning Bolt");
    await selectZoneTab(user, "Stack");
    await addCardToActiveZone(user, "opt", "Opt");
    await clickDecryptStack(user);

    const requestBody = await waitFor(() => {
      expect(submittedAskAiRequests.length).toBeGreaterThan(0);
      return submittedAskAiRequests[0];
    });
    expect(requestBody.battlefieldContext).toEqual([
      {
        name: "Lightning Bolt",
        targets: []
      }
    ]);
  });

  it("allows battlefield context edits from final stack details menu", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Confirm game context" }));
    await advanceToZoneCollectionWithZones(user, ["Battlefield", "Stack"]);

    await selectZoneTab(user, "Battlefield");
    await addCardToActiveZone(user, "lig", "Lightning Bolt");
    await selectZoneTab(user, "Stack");
    await addCardToActiveZone(user, "opt", "Opt");
    await advanceToContextEnrichmentFromZones(user);

    await user.click(screen.getByRole("button", { name: /^Stack/ }));
    const battlefieldNameInput = screen.getByLabelText("Battlefield entry name 1");
    await user.clear(battlefieldNameInput);
    await user.type(battlefieldNameInput, "Lightning Bolt token");
    const battlefieldDetailsInput = screen.getByLabelText("Battlefield details for Lightning Bolt token");
    await user.clear(battlefieldDetailsInput);
    await user.type(battlefieldDetailsInput, "Created by Storm count");
    await user.selectOptions(screen.getByLabelText("Battlefield target kind for Lightning Bolt token"), "player");
    await user.selectOptions(screen.getByLabelText("Battlefield player target for Lightning Bolt token"), "Player 2");
    await user.click(screen.getByRole("button", { name: "Add target for battlefield Lightning Bolt token" }));
    await user.click(screen.getByRole("button", { name: "Close" }));

    await clickDecryptStack(user);
    const requestBody = await waitFor(() => {
      expect(submittedAskAiRequests.length).toBeGreaterThan(0);
      return submittedAskAiRequests[0];
    });

    expect(requestBody.battlefieldContext).toEqual([
      {
        name: "Lightning Bolt token",
        details: "Created by Storm count",
        targets: [{ kind: "player", targetPlayer: "Player 2" }]
      }
    ]);
  });

  it("keeps game context and battlefield review state in parity with submitted payload", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Add player" }));
    await user.clear(screen.getByLabelText("Player 1 life total"));
    await user.type(screen.getByLabelText("Player 1 life total"), "35");
    await user.clear(screen.getByLabelText("Player 2 life total"));
    await user.type(screen.getByLabelText("Player 2 life total"), "22");
    await user.clear(screen.getByLabelText("Player 3 life total"));
    await user.type(screen.getByLabelText("Player 3 life total"), "19");
    await user.click(screen.getByRole("button", { name: "Confirm game context" }));
    await advanceToZoneCollectionWithZones(user, ["Battlefield", "Stack"]);

    await selectZoneTab(user, "Battlefield");
    await addCardToActiveZone(user, "lig", "Lightning Bolt");
    await selectZoneTab(user, "Stack");
    await addCardToActiveZone(user, "opt", "Opt");
    await addCardToActiveZone(user, "cou", "Counterspell");
    await advanceToContextEnrichmentFromZones(user);

    await user.type(screen.getByPlaceholderText("How does this resolve?"), "Can this be countered now?");
    await user.click(screen.getByRole("button", { name: /^Stack/ }));

    const optRow = screen.getByLabelText("Caster for Opt").closest("li");
    expect(optRow).not.toBeNull();
    const counterspellRow = screen.getByLabelText("Caster for Counterspell").closest("li");
    expect(counterspellRow).not.toBeNull();

    expect(within(optRow as HTMLLIElement).getByLabelText("Caster for Opt")).toHaveValue("Player 1");
    expect(within(optRow as HTMLLIElement).getByLabelText("Mana spent for Opt")).toHaveValue("");
    expect(within(optRow as HTMLLIElement).getByLabelText("Context notes for Opt")).toHaveValue("");

    expect(within(counterspellRow as HTMLLIElement).getByLabelText("Caster for Counterspell")).toHaveValue("Player 1");
    expect(within(counterspellRow as HTMLLIElement).getByLabelText("Mana spent for Counterspell")).toHaveValue("");
    expect(within(counterspellRow as HTMLLIElement).getByLabelText("Context notes for Counterspell")).toHaveValue("");
    await user.click(screen.getByRole("button", { name: "Close" }));

    await clickDecryptStack(user);
    const requestBody = await waitFor(() => {
      expect(submittedAskAiRequests.length).toBeGreaterThan(0);
      return submittedAskAiRequests[0];
    });

    expect(requestBody).toMatchObject({
      question: "Can this be countered now?",
      gameContext: {
        playerCount: 3,
        players: [
          { label: "Player 1", lifeTotal: 35 },
          { label: "Player 2", lifeTotal: 22 },
          { label: "Player 3", lifeTotal: 19 }
        ]
      },
      battlefieldContext: [
        {
          name: "Lightning Bolt",
          targets: []
        }
      ],
      stack: [
        {
          name: "Opt"
        },
        {
          name: "Counterspell"
        }
      ]
    });
  });

  it("keeps reviewed stack order and question in parity with submitted payload", async () => {
    const user = userEvent.setup();
    render(<App />);

    await openStackBuilder(user);
    await addCardToStack(user, "lig", "Lightning Bolt");
    await addCardToStack(user, "opt", "Opt");
    await addCardToStack(user, "cou", "Counterspell");
    await advanceToContextEnrichment(user);

    await user.click(screen.getByRole("button", { name: /^Stack/ }));
    const stackDetailsHeading = screen.getByRole("heading", { name: "Stack details" });
    const detailsContainer = stackDetailsHeading.closest("div")?.parentElement as HTMLElement;
    const detailsList = within(detailsContainer).getByRole("list");
    const detailRows = within(detailsList).getAllByRole("listitem");

    expect(within(detailRows[0]).getByText("Lightning Bolt")).toBeInTheDocument();
    expect(within(detailRows[1]).getByText("Opt")).toBeInTheDocument();
    expect(within(detailRows[2]).getByText("Counterspell")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Close" }));

    const reviewedQuestion = "Does this ordering resolve correctly?";
    await user.type(screen.getByPlaceholderText("How does this resolve?"), reviewedQuestion);
    await clickDecryptStack(user);

    const requestBody = await waitFor(() => {
      expect(submittedAskAiRequests.length).toBeGreaterThan(0);
      return submittedAskAiRequests[0];
    });

    expect(requestBody.question).toBe(reviewedQuestion);
    expect(requestBody.stack.map((item) => item.name)).toEqual(["Lightning Bolt", "Opt", "Counterspell"]);
  });

  it("does not show battlefield item name before selection and shows preview after selection", async () => {
    const user = userEvent.setup();
    render(<App />);

    await advanceToBattlefieldZoneCollection(user);
    const battlefieldSearchInput = screen.getByLabelText("Battlefield search input");
    expect(screen.queryByLabelText("Battlefield item name")).not.toBeInTheDocument();

    await user.type(battlefieldSearchInput, "lig");
    expect(screen.queryByLabelText("Battlefield item name")).not.toBeInTheDocument();

    await user.click(await screen.findByRole("button", { name: "Lightning Bolt" }));
    expect(screen.queryByLabelText("Battlefield item name")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Lightning Bolt" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Battlefield item details")).not.toBeInTheDocument();
  });

  it("hides battlefield target controls until a card is selected", async () => {
    const user = userEvent.setup();
    render(<App />);

    await advanceToBattlefieldZoneCollection(user);

    expect(screen.queryByLabelText("Battlefield target kind")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add battlefield target" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add battlefield item" })).not.toBeInTheDocument();

    await user.type(screen.getByLabelText("Battlefield search input"), "lig");
    await user.click(await screen.findByRole("button", { name: "Lightning Bolt" }));

    expect(screen.queryByLabelText("Battlefield target kind")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add battlefield target" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add card" })).toBeInTheDocument();
  });
});

describe("Slice-04: game setup + zone confirmation", () => {
  beforeEach(() => {
    fetchMock = vi.fn(async (input: RequestInfo | URL): Promise<Response> => {
      const url = getUrlFromRequest(input);
      if (url === "/data/cardMetadata.json") {
        return jsonResponse(baseCardMetadataFixture);
      }
      return jsonResponse({ answer: "ok" });
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows zone confirmation step after confirming game context", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Confirm game context" }));

    expect(screen.getByRole("heading", { name: "Zone confirmation" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back" })).toBeInTheDocument();
  });

  it("pre-checks battlefield, library, hand when Draw phase is selected", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Draw" }));
    await user.click(screen.getByRole("button", { name: "Confirm game context" }));

    expect(screen.getByLabelText("Zone: Battlefield")).toBeChecked();
    expect(screen.getByLabelText("Zone: Library")).toBeChecked();
    expect(screen.getByLabelText("Zone: Hand")).toBeChecked();
    expect(screen.getByLabelText("Zone: Stack")).not.toBeChecked();
  });

  it("additive merge: unchecking hand, going back to Combat does not restore hand but adds stack", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Draw" }));
    await user.click(screen.getByRole("button", { name: "Confirm game context" }));

    expect(screen.getByLabelText("Zone: Hand")).toBeChecked();
    await user.click(screen.getByLabelText("Zone: Hand"));
    expect(screen.getByLabelText("Zone: Hand")).not.toBeChecked();

    await user.click(screen.getByRole("button", { name: "Back" }));
    await user.click(screen.getByRole("button", { name: "Draw" }));
    await user.click(screen.getByRole("button", { name: "Combat" }));
    await user.click(screen.getByRole("button", { name: "Confirm game context" }));

    expect(screen.getByLabelText("Zone: Stack")).toBeChecked();
    expect(screen.getByLabelText("Zone: Hand")).not.toBeChecked();
  });

  it("life totals unchanged after navigating back from zone confirm", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.clear(screen.getByLabelText("Player 1 life total"));
    await user.type(screen.getByLabelText("Player 1 life total"), "33");
    await user.clear(screen.getByLabelText("Player 2 life total"));
    await user.type(screen.getByLabelText("Player 2 life total"), "27");

    await user.click(screen.getByRole("button", { name: "Confirm game context" }));
    await user.click(screen.getByRole("button", { name: "Back" }));

    expect(screen.getByLabelText("Player 1 life total")).toHaveValue("33");
    expect(screen.getByLabelText("Player 2 life total")).toHaveValue("27");
  });

  it("zone confirm allows continuing with empty zone selection", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Confirm game context" }));

    const continueButton = screen.getByRole("button", { name: "Continue" });
    expect(continueButton).not.toBeDisabled();
    await user.click(continueButton);

    expect(screen.getByRole("heading", { name: "Add cards to zones" })).toBeInTheDocument();
  });

  it("shows active player select on game context step", () => {
    render(<App />);
    expect(screen.getByLabelText("Active player")).toBeInTheDocument();
  });

  it("shows all turn phase options on game context step", () => {
    render(<App />);
    expect(screen.getByRole("button", { name: "Draw" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Combat" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Main 1" })).toBeInTheDocument();
  });

  it("shows combat sub-step hint when Combat phase is selected", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.queryByText(/Specify combat sub-step/)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Combat" }));
    expect(screen.getByText(/Specify combat sub-step/)).toBeInTheDocument();
  });

  it("toggles turn phase off when the same phase button is clicked again", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Draw" }));
    const drawButton = screen.getByRole("button", { name: "Draw" });
    expect(drawButton).toHaveAttribute("aria-pressed", "true");

    await user.click(drawButton);
    expect(screen.getByRole("button", { name: "Draw" })).toHaveAttribute("aria-pressed", "false");
  });
});

describe("Slice-05: zone collection UI", () => {
  beforeEach(() => {
    fetchMock = vi.fn(async (input: RequestInfo | URL): Promise<Response> => {
      const url = getUrlFromRequest(input);
      if (url === "/data/cardMetadata.json") {
        return jsonResponse(baseCardMetadataFixture);
      }
      return jsonResponse({ answer: "ok" });
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows zone collection after zone confirmation", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Confirm game context" }));
    await advancePastZoneConfirm(user);

    expect(screen.getByRole("heading", { name: "Add cards to zones" })).toBeInTheDocument();
  });

  it("preserves stack order bottom-to-top and shows enrichment counts", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Confirm game context" }));
    await advanceToZoneCollectionWithZones(user, ["Stack", "Hand", "Battlefield"]);

    await addCardToActiveZone(user, "opt", "Opt");
    await addCardToActiveZone(user, "lig", "Lightning Bolt");
    await selectZoneTab(user, "Stack");
    expect(screen.getByText("bottom")).toBeInTheDocument();
    expect(screen.getByText("top")).toBeInTheDocument();

    await selectZoneTab(user, "Hand");
    await selectZoneTab(user, "Battlefield");
    await addCardToActiveZone(user, "lig", "Lightning Bolt");

    await advancePastZoneCollection(user);
    expect(screen.getByText("Stack: 2")).toBeInTheDocument();
    expect(screen.getByText("Hand: 0")).toBeInTheDocument();
    expect(screen.getByText("Battlefield: 1")).toBeInTheDocument();
  });

  it("retains zone card data when backing out and unchecking a zone", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Confirm game context" }));
    await advanceToZoneCollectionWithZones(user, ["Hand"]);

    await addCardToActiveZone(user, "opt", "Opt");
    await user.click(screen.getByRole("button", { name: "Back" }));
    await user.click(screen.getByLabelText("Zone: Hand"));
    await advancePastZoneConfirm(user);
    await user.click(screen.getByRole("button", { name: "Back" }));
    await user.click(screen.getByLabelText("Zone: Hand"));
    await advancePastZoneConfirm(user);

    expect(screen.getByText("1. Opt")).toBeInTheDocument();
  });
});
