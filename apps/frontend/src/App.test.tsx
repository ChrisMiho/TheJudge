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
import type { ZoneAskAiPayload } from "./lib/contextFlow";
import type { CardMetadataItem } from "./types";

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
const submittedAskAiRequests: ZoneAskAiPayload[] = [];
const submittedAskAiHeaders: Array<Record<string, string>> = [];
const ZONE_LABELS_FOR_TESTS = ["Stack", "Battlefield", "Hand", "Graveyard", "Exile", "Library", "Command Zone"];

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
  await setSelectedZones(user, ["Stack"]);
  await user.click(screen.getByRole("button", { name: "Continue" }));
}

async function expandPlayerDetails(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await user.click(screen.getByRole("button", { name: "Show player details" }));
}

async function selectTurnPhase(user: ReturnType<typeof userEvent.setup>, phaseValue: string): Promise<void> {
  await user.selectOptions(screen.getByLabelText("Turn phase"), phaseValue);
}

async function advancePastZoneConfirm(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  const continueButton = screen.getByRole("button", { name: "Continue" });
  if (continueButton.hasAttribute("disabled")) {
    await user.click(screen.getByLabelText("Zone: Stack"));
  }
  await user.click(continueButton);
}

async function openEnrichmentListView(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  const viewAllButton = screen.queryByRole("button", { name: "View all cards" });
  if (viewAllButton) {
    await user.click(viewAllButton);
  }
}

async function advanceToBattlefieldZoneCollection(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await user.click(screen.getByRole("button", { name: "Confirm game context" }));
  await setSelectedZones(user, ["Battlefield"]);
  await advancePastZoneConfirm(user);
}

async function advancePastZoneCollection(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await user.click(screen.getByRole("button", { name: "Continue" }));
}

async function finishEnrichmentWizard(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  for (;;) {
    const finishButton = screen.queryByRole("button", { name: "OK — finish enrichment" });
    if (finishButton) {
      await user.click(finishButton);
      break;
    }
    const nextButton = screen.queryByRole("button", { name: "OK — next card" });
    if (nextButton) {
      await user.click(nextButton);
      continue;
    }
    break;
  }
}

async function advanceToContextEnrichmentFromZones(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await advancePastZoneCollection(user);
  await openEnrichmentListView(user);
}

async function advanceToZoneCollectionWithZones(
  user: ReturnType<typeof userEvent.setup>,
  zones: string[]
): Promise<void> {
  await setSelectedZones(user, zones);
  await advancePastZoneConfirm(user);
}

async function setSelectedZones(user: ReturnType<typeof userEvent.setup>, zones: string[]): Promise<void> {
  for (const zone of ZONE_LABELS_FOR_TESTS) {
    const checkbox = screen.getByLabelText(`Zone: ${zone}`) as HTMLInputElement;
    if (checkbox.checked !== zones.includes(zone)) {
      await user.click(checkbox);
    }
  }
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
    await advancePastZoneCollection(user);
  }
  if (!screen.queryByRole("button", { name: "Decrypt Stack" })) {
    await finishEnrichmentWizard(user);
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
    await expandPlayerDetails(user);

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

    await user.selectOptions(screen.getByLabelText("Target kind for Opt"), "player");
    await user.selectOptions(screen.getByLabelText("Player target for Opt"), "Player 2");
    await user.click(screen.getByRole("button", { name: "Add target for Opt" }));
    expect(screen.getByText("Player: Player 2")).toBeInTheDocument();
  });

  it("shows enrichment step with context enrichment heading after zone collection", async () => {
    const user = userEvent.setup();
    render(<App />);
    await openStackBuilder(user);

    await addCardToStack(user, "opt", "Opt");
    await advanceToContextEnrichment(user);

    expect(screen.getByRole("heading", { name: "Context enrichment" })).toBeInTheDocument();
    expect(screen.getByLabelText("Target kind for Opt")).toBeInTheDocument();
    expect(screen.getByLabelText("Caster for Opt")).toBeInTheDocument();

    await finishEnrichmentWizard(user);
    expect(screen.getByRole("button", { name: "Decrypt Stack" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("How does this resolve?")).toBeInTheDocument();
  });

  it("shows the optional question immediately after finishing the card-by-card enrichment wizard", async () => {
    const user = userEvent.setup();
    render(<App />);
    await openStackBuilder(user);

    await addCardToStack(user, "opt", "Opt");
    await addCardToStack(user, "lig", "Lightning Bolt");
    await advancePastZoneCollection(user);

    expect(screen.getByText("Card 1 of 2")).toBeInTheDocument();
    await finishEnrichmentWizard(user);

    expect(screen.getByText("Ready to decrypt.")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("How does this resolve?")).toBeInTheDocument();
    expect(screen.queryByLabelText("Caster for Opt")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Caster for Lightning Bolt")).not.toBeInTheDocument();
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

    const counterspellRow = screen.getByLabelText("Caster for Counterspell").closest("li");
    expect(counterspellRow).not.toBeNull();
    await user.click(within(counterspellRow as HTMLLIElement).getByRole("button", { name: "Remove Counterspell" }));

    await clickDecryptStack(user);

    const requestBody = await waitFor(() => {
      expect(submittedAskAiRequests.length).toBeGreaterThan(0);
      return submittedAskAiRequests[0];
    });

    expect(requestBody.question).toBe("Resolve the stack");
    expect(requestBody.gameContext.playerCount).toBe(2);
    expect(requestBody.gameContext.zones?.stack?.map((card) => card.name)).toEqual(["Opt", "Lightning Bolt"]);
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

    await user.selectOptions(screen.getByLabelText("Caster for Opt"), "Player 4");
    await user.selectOptions(screen.getByLabelText("Target kind for Opt"), "player");
    await user.selectOptions(screen.getByLabelText("Player target for Opt"), "Player 3");
    await user.click(screen.getByRole("button", { name: "Add target for Opt" }));
    await user.type(screen.getByLabelText("Mana spent for Opt"), "4");
    await user.type(screen.getByLabelText("Context notes for Opt"), "Cast for alternate cost");

    await clickDecryptStack(user);

    const requestBody = await waitFor(() => {
      expect(submittedAskAiRequests.length).toBeGreaterThan(0);
      return submittedAskAiRequests[0];
    });

    expect(requestBody.gameContext.zones?.stack?.[0]).toMatchObject({
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

    await user.selectOptions(screen.getByLabelText("Target kind for Opt"), "other");
    await user.type(screen.getByLabelText("Other target for Opt"), "Target defined by delayed trigger context");
    await user.click(screen.getByRole("button", { name: "Add target for Opt" }));

    await clickDecryptStack(user);

    const requestBody = await waitFor(() => {
      expect(submittedAskAiRequests.length).toBeGreaterThan(0);
      return submittedAskAiRequests[0];
    });

    expect(requestBody.gameContext.zones?.stack?.[0]?.targets).toEqual([
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

    await user.selectOptions(screen.getByLabelText("Caster for Opt"), "Player 3");
    await user.selectOptions(screen.getByLabelText("Target kind for Opt"), "player");
    await user.selectOptions(screen.getByLabelText("Player target for Opt"), "Player 4");
    await user.click(screen.getByRole("button", { name: "Add target for Opt" }));
    await user.type(screen.getByLabelText("Context notes for Opt"), "Copied from graveyard");

    await clickDecryptStack(user);

    const requestBody = await waitFor(() => {
      expect(submittedAskAiRequests.length).toBeGreaterThan(0);
      return submittedAskAiRequests[0];
    });

    expect(requestBody.gameContext.zones?.stack?.[0]).toMatchObject({
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

    await user.selectOptions(screen.getByLabelText("Target kind for Opt"), "none");
    await user.click(screen.getByRole("button", { name: "Add target for Opt" }));

    await clickDecryptStack(user);

    const requestBody = await waitFor(() => {
      expect(submittedAskAiRequests.length).toBeGreaterThan(0);
      return submittedAskAiRequests[0];
    });

    expect(requestBody.gameContext.zones?.stack?.[0]?.targets).toEqual([{ kind: "none" }]);
  });

  it("blocks Continue from zone collection until a selected zone has a card", async () => {
    const user = userEvent.setup();
    render(<App />);
    await openStackBuilder(user);

    const continueButton = screen.getByRole("button", { name: "Continue" });
    expect(continueButton).toBeDisabled();
    expect(screen.getByText("Add at least one card in a selected zone before continuing.")).toBeInTheDocument();

    await addCardToStack(user, "opt", "Opt");
    expect(continueButton).toBeEnabled();
  });

  it("nudges on selected empty stack but continues to enrichment when another zone has cards", async () => {
    const user = userEvent.setup();
    render(<App />);

    await selectTurnPhase(user, "main_1");
    await user.click(screen.getByRole("button", { name: "Confirm game context" }));
    await user.click(screen.getByLabelText("Zone: Stack"));
    await advancePastZoneConfirm(user);
    await waitForMetadataReady();

    await selectZoneTab(user, "Battlefield");
    await addCardToActiveZone(user, "lig", "Lightning Bolt");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(screen.getByRole("heading", { name: "Context enrichment" })).toBeInTheDocument();
    expect(screen.getByText(/Stack zone is selected but empty/)).toBeInTheDocument();
  });

  it("summarizes battlefield-only send context and submits board-state fallback for blank main phase questions", async () => {
    const user = userEvent.setup();
    render(<App />);

    await selectTurnPhase(user, "main_1");
    await user.click(screen.getByRole("button", { name: "Confirm game context" }));
    await user.click(screen.getByLabelText("Zone: Stack"));
    await advancePastZoneConfirm(user);
    await waitForMetadataReady();

    await selectZoneTab(user, "Battlefield");
    await addCardToActiveZone(user, "lig", "Lightning Bolt");
    await advancePastZoneCollection(user);
    await finishEnrichmentWizard(user);

    expect(screen.getByText("Sending to TheJudge")).toBeInTheDocument();
    expect(screen.getByText("Battlefield: 1 card")).toBeInTheDocument();
    expect(screen.getByText("Stack: selected, no cards added")).toBeInTheDocument();
    expect(screen.getByText(/Explain the interaction with the provided game state/)).toBeInTheDocument();
    expect(screen.queryByText(/No question\? Uses fallback: “Resolve the stack”/)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Decrypt Stack" }));

    const requestBody = await waitFor(() => {
      expect(submittedAskAiRequests.length).toBeGreaterThan(0);
      return submittedAskAiRequests[0];
    });

    expect(requestBody.question).toBe("Explain the interaction with the provided game state");
    expect(requestBody.gameContext.zones?.stack).toBeUndefined();
    expect(requestBody.gameContext.zones?.battlefield?.map((card) => card.name)).toEqual(["Lightning Bolt"]);
  });

  it("blocks Decrypt Stack after all cards are removed in enrichment", async () => {
    const user = userEvent.setup();
    render(<App />);
    await openStackBuilder(user);
    await addCardToStack(user, "opt", "Opt");
    await advanceToContextEnrichmentFromZones(user);

    await user.click(screen.getByRole("button", { name: "Remove Opt" }));

    const decryptButton = screen.getByRole("button", { name: "Decrypt Stack" });
    expect(decryptButton).toBeDisabled();
    expect(screen.getByText("Add at least one card in a selected zone before decrypting.")).toBeInTheDocument();

    await user.click(decryptButton);
    expect(submittedAskAiRequests).toHaveLength(0);
  });

  it("shows bundled cat-wizard asset on game-context first screen with graceful fallback", async () => {
    render(<App />);

    const emptyStateImage = screen.getByRole("img", { name: "Cat wizard" });
    expect(emptyStateImage).toHaveAttribute("src", "/assets/cats-homescreen.png");
    expect(screen.getByRole("heading", { name: "Game context" })).toBeInTheDocument();

    fireEvent.error(emptyStateImage);
    expect(screen.getByText("Cat wizard")).toBeInTheDocument();
  });

  it("shows zone cards in enrichment step and removal works", async () => {
    const user = userEvent.setup();
    render(<App />);
    await openStackBuilder(user);

    await addCardToStack(user, "opt", "Opt");
    await addCardToStack(user, "cou", "Counterspell");

    expect(screen.getByRole("button", { name: "Zone tab: Stack" })).toHaveTextContent("Stack (2)");

    await advanceToContextEnrichmentFromZones(user);
    expect(screen.getByLabelText("Caster for Opt")).toBeInTheDocument();
    expect(screen.getByLabelText("Caster for Counterspell")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Remove Opt" }));
    expect(screen.queryByLabelText("Caster for Opt")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Caster for Counterspell")).toBeInTheDocument();
  });

  it("shows zone cards in enrichment order (bottom-to-top) and removal is usable", async () => {
    const user = userEvent.setup();
    render(<App />);
    await openStackBuilder(user);

    await addCardToStack(user, "opt", "Opt");
    await addCardToStack(user, "lig", "Lightning Bolt");

    await advanceToContextEnrichmentFromZones(user);

    expect(screen.getByLabelText("Caster for Opt")).toBeInTheDocument();
    expect(screen.getByLabelText("Caster for Lightning Bolt")).toBeInTheDocument();

    const optRow = screen.getByLabelText("Caster for Opt").closest("li") as HTMLElement;
    const boltRow = screen.getByLabelText("Caster for Lightning Bolt").closest("li") as HTMLElement;
    expect(optRow.compareDocumentPosition(boltRow) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );

    await user.click(screen.getByRole("button", { name: "Remove Lightning Bolt" }));
    expect(screen.queryByLabelText("Caster for Lightning Bolt")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Caster for Opt")).toBeInTheDocument();
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

    await advanceToContextEnrichmentFromZones(user);
    expect(screen.queryAllByLabelText(/^Caster for /)).toHaveLength(1);
    expect(screen.getByLabelText("Caster for Opt")).toBeInTheDocument();
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
    const casterLabels = screen.queryAllByLabelText(/^Caster for /);
    expect(casterLabels).toHaveLength(10);
    for (let index = 0; index < 10; index += 1) {
      expect(screen.getByLabelText(`Caster for ${manyCards[index].name}`)).toBeInTheDocument();
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

    expect(screen.getByRole("heading", { name: "Conversation" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Ask a follow-up…")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start Over" })).toBeInTheDocument();
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
    await expandPlayerDetails(user);
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
    await finishEnrichmentWizard(user);
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
        ],
        zones: {
          battlefield: expect.arrayContaining([expect.objectContaining({ name: "Lightning Bolt" })]),
          stack: expect.arrayContaining([expect.objectContaining({ name: "Opt" })])
        }
      }
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

    expect(requestBody.gameContext.zones?.battlefield).toBeDefined();
    expect(requestBody.gameContext.zones?.battlefield?.[0]).toMatchObject({ name: "Lightning Bolt" });
  });

  it("allows battlefield context edits in enrichment step", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Confirm game context" }));
    await advanceToZoneCollectionWithZones(user, ["Battlefield", "Stack"]);

    await selectZoneTab(user, "Battlefield");
    await addCardToActiveZone(user, "lig", "Lightning Bolt");
    await selectZoneTab(user, "Stack");
    await addCardToActiveZone(user, "opt", "Opt");
    await advanceToContextEnrichmentFromZones(user);

    await user.type(screen.getByLabelText("Context notes for Lightning Bolt"), "Created by Storm count");
    await user.selectOptions(screen.getByLabelText("Target kind for Lightning Bolt"), "player");
    await user.selectOptions(screen.getByLabelText("Player target for Lightning Bolt"), "Player 2");
    await user.click(screen.getByRole("button", { name: "Add target for Lightning Bolt" }));

    await clickDecryptStack(user);
    const requestBody = await waitFor(() => {
      expect(submittedAskAiRequests.length).toBeGreaterThan(0);
      return submittedAskAiRequests[0];
    });

    const battlefieldCard = requestBody.gameContext.zones?.battlefield?.[0];
    expect(battlefieldCard?.name).toBe("Lightning Bolt");
    expect(battlefieldCard?.contextNotes).toBe("Created by Storm count");
    expect(battlefieldCard?.targets).toEqual([{ kind: "player", targetPlayer: "Player 2" }]);
  });

  it("edits command card ownership separately from zone-card targets in enrichment", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Confirm game context" }));
    await advanceToZoneCollectionWithZones(user, ["Battlefield", "Command Zone"]);

    await selectZoneTab(user, "Battlefield");
    await addCardToActiveZone(user, "lig", "Lightning Bolt");
    await selectZoneTab(user, "Command Zone");
    await addCardToActiveZone(user, "opt", "Opt");
    await advanceToContextEnrichmentFromZones(user);

    await user.selectOptions(screen.getByLabelText("Owner for Opt"), "Player 2");
    await user.selectOptions(screen.getByLabelText("Target kind for Opt"), "card");
    await user.selectOptions(screen.getByLabelText("Card target for Opt"), "lightning-bolt");
    await user.click(screen.getByRole("button", { name: "Add target for Opt" }));

    await clickDecryptStack(user);
    const requestBody = await waitFor(() => {
      expect(submittedAskAiRequests.length).toBeGreaterThan(0);
      return submittedAskAiRequests[0];
    });

    const commandCard = requestBody.gameContext.zones?.command?.[0];
    expect(commandCard?.owner).toBe("Player 2");
    expect(commandCard?.targets).toEqual([
      {
        kind: "card",
        zone: "battlefield",
        cardId: "lightning-bolt",
        cardName: "Lightning Bolt"
      }
    ]);
  });

  it("keeps game context and zone card review state in parity with submitted payload", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Add player" }));
    await expandPlayerDetails(user);
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

    const optRow = screen.getByLabelText("Caster for Opt").closest("li");
    const counterspellRow = screen.getByLabelText("Caster for Counterspell").closest("li");
    expect(optRow).not.toBeNull();
    expect(counterspellRow).not.toBeNull();

    expect(within(optRow as HTMLLIElement).getByLabelText("Caster for Opt")).toHaveValue("Player 1");
    expect(within(optRow as HTMLLIElement).getByLabelText("Mana spent for Opt")).toHaveValue("");
    expect(within(optRow as HTMLLIElement).getByLabelText("Context notes for Opt")).toHaveValue("");

    expect(within(counterspellRow as HTMLLIElement).getByLabelText("Caster for Counterspell")).toHaveValue("Player 1");
    expect(within(counterspellRow as HTMLLIElement).getByLabelText("Mana spent for Counterspell")).toHaveValue("");
    expect(within(counterspellRow as HTMLLIElement).getByLabelText("Context notes for Counterspell")).toHaveValue("");

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
        ],
        zones: {
          battlefield: expect.arrayContaining([expect.objectContaining({ name: "Lightning Bolt" })]),
          stack: expect.arrayContaining([
            expect.objectContaining({ name: "Opt" }),
            expect.objectContaining({ name: "Counterspell" })
          ])
        }
      }
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

    const boltRow = screen.getByLabelText("Caster for Lightning Bolt").closest("li") as HTMLElement;
    const optRow = screen.getByLabelText("Caster for Opt").closest("li") as HTMLElement;
    const counterspellRow = screen.getByLabelText("Caster for Counterspell").closest("li") as HTMLElement;
    expect(boltRow.compareDocumentPosition(optRow) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
    expect(optRow.compareDocumentPosition(counterspellRow) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );

    const reviewedQuestion = "Does this ordering resolve correctly?";
    await user.type(screen.getByPlaceholderText("How does this resolve?"), reviewedQuestion);
    await clickDecryptStack(user);

    const requestBody = await waitFor(() => {
      expect(submittedAskAiRequests.length).toBeGreaterThan(0);
      return submittedAskAiRequests[0];
    });

    expect(requestBody.question).toBe(reviewedQuestion);
    expect(requestBody.gameContext.zones?.stack?.map((item) => item.name)).toEqual([
      "Lightning Bolt",
      "Opt",
      "Counterspell"
    ]);
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
    submittedAskAiRequests.length = 0;
    fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = getUrlFromRequest(input);
      if (url === "/data/cardMetadata.json") {
        return jsonResponse(baseCardMetadataFixture);
      }
      if (url.endsWith("/api/ask-ai")) {
        submittedAskAiRequests.push(JSON.parse(String(init?.body)) as ZoneAskAiPayload);
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

  it("pre-checks hand and library when Draw phase is selected", async () => {
    const user = userEvent.setup();
    render(<App />);

    await selectTurnPhase(user, "draw");
    await user.click(screen.getByRole("button", { name: "Confirm game context" }));

    expect(screen.getByLabelText("Zone: Hand")).toBeChecked();
    expect(screen.getByLabelText("Zone: Library")).toBeChecked();
    expect(screen.getByLabelText("Zone: Battlefield")).not.toBeChecked();
    expect(screen.getByLabelText("Zone: Stack")).not.toBeChecked();
  });

  it("additive merge: unchecking hand, going back to Combat does not restore hand but adds stack", async () => {
    const user = userEvent.setup();
    render(<App />);

    await selectTurnPhase(user, "draw");
    await user.click(screen.getByRole("button", { name: "Confirm game context" }));

    expect(screen.getByLabelText("Zone: Hand")).toBeChecked();
    await user.click(screen.getByLabelText("Zone: Hand"));
    expect(screen.getByLabelText("Zone: Hand")).not.toBeChecked();

    await user.click(screen.getByRole("button", { name: "Back" }));
    await selectTurnPhase(user, "combat");
    await user.click(screen.getByRole("button", { name: "Confirm game context" }));

    expect(screen.getByLabelText("Zone: Stack")).toBeChecked();
    expect(screen.getByLabelText("Zone: Hand")).not.toBeChecked();
  });

  it("life totals unchanged after navigating back from zone confirm", async () => {
    const user = userEvent.setup();
    render(<App />);

    await expandPlayerDetails(user);
    await user.clear(screen.getByLabelText("Player 1 life total"));
    await user.type(screen.getByLabelText("Player 1 life total"), "33");
    await user.clear(screen.getByLabelText("Player 2 life total"));
    await user.type(screen.getByLabelText("Player 2 life total"), "27");

    await user.click(screen.getByRole("button", { name: "Confirm game context" }));
    await user.click(screen.getByRole("button", { name: "Back" }));

    expect(screen.getByLabelText("Player 1 life total")).toHaveValue("33");
    expect(screen.getByLabelText("Player 2 life total")).toHaveValue("27");
  });

  it("blocks continuing from zone confirm when no zones are selected", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Confirm game context" }));
    await setSelectedZones(user, []);

    const continueButton = screen.getByRole("button", { name: "Continue" });
    expect(continueButton).toBeDisabled();
    expect(screen.getByText(/Select at least one zone/i)).toBeInTheDocument();
  });

  it("shows active player select on game context step", () => {
    render(<App />);
    expect(screen.getByLabelText("Active player")).toBeInTheDocument();
  });

  it("shows player display names in selects while keeping submitted player labels canonical", async () => {
    const user = userEvent.setup();
    render(<App />);

    await expandPlayerDetails(user);
    await user.clear(screen.getByLabelText("Player 1 display name"));
    await user.type(screen.getByLabelText("Player 1 display name"), "Alice");
    await user.clear(screen.getByLabelText("Player 2 display name"));
    await user.type(screen.getByLabelText("Player 2 display name"), "Bob");

    const activePlayerSelect = screen.getByLabelText("Active player");
    expect(within(activePlayerSelect).getByRole("option", { name: "Player 1 (Alice)" })).toHaveValue("Player 1");
    expect(within(activePlayerSelect).getByRole("option", { name: "Player 2 (Bob)" })).toHaveValue("Player 2");

    await user.click(screen.getByRole("button", { name: "Confirm game context" }));
    await advanceToZoneCollectionWithZones(user, ["Battlefield", "Stack"]);

    await selectZoneTab(user, "Battlefield");
    await selectCard(user, "lig", "Lightning Bolt");
    const collectionOwnerSelect = screen.getByLabelText("Owner for Lightning Bolt");
    expect(within(collectionOwnerSelect).getByRole("option", { name: "Player 1 (Alice)" })).toHaveValue("Player 1");
    await user.selectOptions(collectionOwnerSelect, "Player 2");
    await user.click(screen.getByRole("button", { name: "Add card" }));

    await selectZoneTab(user, "Stack");
    await addCardToActiveZone(user, "opt", "Opt");
    await advanceToContextEnrichmentFromZones(user);

    const casterSelect = screen.getByLabelText("Caster for Opt");
    expect(within(casterSelect).getByRole("option", { name: "Player 1 (Alice)" })).toHaveValue("Player 1");
    await user.selectOptions(casterSelect, "Player 2");

    await user.selectOptions(screen.getByLabelText("Target kind for Opt"), "player");
    const targetSelect = screen.getByLabelText("Player target for Opt");
    expect(within(targetSelect).getByRole("option", { name: "Player 2 (Bob)" })).toHaveValue("Player 2");
    await user.selectOptions(targetSelect, "Player 1");
    await user.click(screen.getByRole("button", { name: "Add target for Opt" }));
    expect(screen.getByText("Player: Player 1 (Alice)")).toBeInTheDocument();

    await clickDecryptStack(user);
    await waitFor(() => expect(submittedAskAiRequests).toHaveLength(1));
    expect(submittedAskAiRequests[0]?.gameContext.players).toEqual([
      { label: "Player 1", lifeTotal: 20, displayName: "Alice" },
      { label: "Player 2", lifeTotal: 20, displayName: "Bob" }
    ]);
    expect(submittedAskAiRequests[0]?.gameContext.activePlayer).toBe("Player 1");
    expect(submittedAskAiRequests[0]?.gameContext.zones?.battlefield?.[0]?.owner).toBe("Player 2");
    expect(submittedAskAiRequests[0]?.gameContext.zones?.stack?.[0]).toMatchObject({
      caster: "Player 2",
      targets: [{ kind: "player", targetPlayer: "Player 1" }]
    });
  });

  it("shows all turn phase options on game context step", () => {
    render(<App />);
    const turnPhaseSelect = screen.getByLabelText("Turn phase");
    expect(turnPhaseSelect).toHaveValue("main_1");
    expect(within(turnPhaseSelect).queryByRole("option", { name: "None" })).not.toBeInTheDocument();
    expect(within(turnPhaseSelect).queryByRole("option", { name: "Stack Resolving" })).not.toBeInTheDocument();
    expect(within(turnPhaseSelect).getByRole("option", { name: "Draw" })).toBeInTheDocument();
    expect(within(turnPhaseSelect).getByRole("option", { name: "Combat" })).toBeInTheDocument();
    expect(within(turnPhaseSelect).getByRole("option", { name: "Pre Combat Main Phase" })).toBeInTheDocument();
  });

  it("shows combat step selector when Combat phase is selected and hides it otherwise", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.queryByLabelText("Combat step")).not.toBeInTheDocument();
    await selectTurnPhase(user, "combat");
    const combatStepSelect = screen.getByLabelText("Combat step");
    expect(combatStepSelect).toBeInTheDocument();
    expect(combatStepSelect).toHaveValue("declare_blockers");
    expect(within(combatStepSelect as HTMLSelectElement).getByRole("option", { name: "Beginning of Combat" })).toBeInTheDocument();
    expect(within(combatStepSelect as HTMLSelectElement).getByRole("option", { name: "Declare Attackers" })).toBeInTheDocument();
    expect(within(combatStepSelect as HTMLSelectElement).getByRole("option", { name: "Declare Blockers" })).toBeInTheDocument();
    expect(within(combatStepSelect as HTMLSelectElement).getByRole("option", { name: "Combat Damage" })).toBeInTheDocument();
    expect(within(combatStepSelect as HTMLSelectElement).getByRole("option", { name: "End of Combat" })).toBeInTheDocument();

    await selectTurnPhase(user, "draw");
    expect(screen.queryByLabelText("Combat step")).not.toBeInTheDocument();
  });

  it("submits the default main_1 turn phase", async () => {
    const user = userEvent.setup();
    render(<App />);

    await advanceToStackBuilder(user);
    await waitForMetadataReady();
    await addCardToStack(user, "opt", "Opt");
    await clickDecryptStack(user);

    await waitFor(() => expect(submittedAskAiRequests).toHaveLength(1));
    expect(submittedAskAiRequests[0]?.gameContext.turnPhase).toBe("main_1");
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
    await openEnrichmentListView(user);
    expect(screen.getByRole("heading", { name: "Context enrichment" })).toBeInTheDocument();
    expect(screen.getByLabelText("Caster for Opt")).toBeInTheDocument();
    expect(screen.getByLabelText("Caster for Lightning Bolt")).toBeInTheDocument();
  });

  it("retains zone card data when backing out and unchecking a zone", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Confirm game context" }));
    await advanceToZoneCollectionWithZones(user, ["Hand"]);

    await addCardToActiveZone(user, "opt", "Opt");
    await user.click(screen.getByRole("button", { name: "Back" }));
    await user.click(screen.getByLabelText("Zone: Hand"));
    await user.click(screen.getByLabelText("Zone: Stack"));
    await advancePastZoneConfirm(user);
    await user.click(screen.getByRole("button", { name: "Back" }));
    await user.click(screen.getByLabelText("Zone: Hand"));
    await advancePastZoneConfirm(user);

    await selectZoneTab(user, "Hand");
    expect(screen.getByText("1. Opt")).toBeInTheDocument();
  });

  it("shows waiting panel while submitting and hides the submit form", async () => {
    let resolveAskAi!: (value: Response) => void;
    fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = getUrlFromRequest(input);
      if (url === "/data/cardMetadata.json") return jsonResponse(metadataFixture);
      if (url.endsWith("/api/ask-ai") && init?.method === "POST") {
        return new Promise<Response>((resolve) => { resolveAskAi = resolve; });
      }
      return jsonResponse({ error: "not found" }, 404);
    });
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();
    render(<App />);
    await openStackBuilder(user);
    await addCardToStack(user, "opt", "Opt");
    await clickDecryptStack(user);

    expect(document.querySelector("[aria-live='polite']")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Decrypt Stack" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Context enrichment" })).toBeInTheDocument();

    resolveAskAi(jsonResponse({ answer: "Mock answer" }));
    await screen.findByText("Mock answer");
    expect(document.querySelector("[aria-live='polite']")).not.toBeInTheDocument();
  });
});
