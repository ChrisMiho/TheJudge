import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
let askAiResponseQueue: Array<{ status: number; body: unknown }> = [];
const submittedAskAiRequests: AskAiRequest[] = [];
const submittedAskAiHeaders: Array<Record<string, string>> = [];

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" }
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

function queueAskAiResponses(...responses: Array<{ status: number; body: unknown }>): void {
  askAiResponseQueue = responses;
}

async function waitForMetadataReady(): Promise<void> {
  await screen.findByPlaceholderText("Type to begin");
}

async function advanceToStackBuilder(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await user.click(screen.getByRole("button", { name: "Confirm game context" }));
  await user.click(screen.getByRole("button", { name: "Skip battlefield context" }));
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

describe("App MVP interaction flows", () => {
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
        submittedAskAiRequests.push(JSON.parse(String(init.body)) as AskAiRequest);
        submittedAskAiHeaders.push(normalizeHeaders(init.headers));

        const nextResponse = askAiResponseQueue.shift() ?? { status: 200, body: { answer: "Mock answer" } };
        return jsonResponse(nextResponse.body, nextResponse.status);
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

    await user.click(screen.getByRole("button", { name: "Confirm game context" }));

    const battlefieldSearchInput = screen.getByLabelText("Battlefield search input");
    await user.type(battlefieldSearchInput, "lig");
    expect(await screen.findByRole("button", { name: "Lightning Bolt" })).toBeInTheDocument();

    fireEvent.keyDown(battlefieldSearchInput, { key: "Escape" });
    expect(screen.queryByRole("button", { name: "Lightning Bolt" })).not.toBeInTheDocument();

    await user.type(battlefieldSearchInput, "h");
    expect(await screen.findByRole("button", { name: "Lightning Bolt" })).toBeInTheDocument();

    fireEvent.keyDown(battlefieldSearchInput, { key: "ArrowDown" });
    fireEvent.keyDown(battlefieldSearchInput, { key: "Enter" });

    expect(screen.getByLabelText("Battlefield item name")).toHaveTextContent("Lightning Bolt");
    expect(screen.getByLabelText("Battlefield item details")).toHaveValue(
      "Lightning Bolt deals 3 damage to any target."
    );
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
    await user.click(screen.getByRole("button", { name: "Confirm game context" }));
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
    await user.click(screen.getByRole("button", { name: "Confirm game context" }));
    const battlefieldInput = screen.getByLabelText("Battlefield search input");
    await user.type(battlefieldInput, "lig");
    await user.click(await screen.findByRole("button", { name: "Lightning Bolt" }));

    expect(screen.getByLabelText("Battlefield item name")).toHaveTextContent("Lightning Bolt");
    expect(screen.getByLabelText("Battlefield item details")).toHaveValue(
      "Lightning Bolt deals 3 damage to any target."
    );
  });

  it("uses first-add then subsequent-add button labels", async () => {
    const user = userEvent.setup();
    render(<App />);
    await openStackBuilder(user);

    await selectCard(user, "opt", "Opt");

    const firstAddButton = screen.getByRole("button", { name: "Begin stackening!" });
    expect(firstAddButton).toBeInTheDocument();

    await user.click(firstAddButton);

    expect(screen.getByRole("button", { name: "Add to Stack" })).toBeInTheDocument();
  });

  it("submits bottom-to-top stack payload after add/remove interactions", async () => {
    const user = userEvent.setup();
    render(<App />);
    await openStackBuilder(user);

    await addCardToStack(user, "opt", "Opt");
    await addCardToStack(user, "cou", "Counterspell");
    await addCardToStack(user, "lig", "Lightning Bolt");

    await user.click(screen.getByRole("button", { name: /^Stack/ }));
    const counterspellRow = screen.getByLabelText("Caster for Counterspell").closest("li");
    expect(counterspellRow).not.toBeNull();
    await user.click(within(counterspellRow as HTMLLIElement).getByRole("button", { name: "Remove" }));
    await user.click(screen.getByRole("button", { name: "Close" }));

    await user.click(screen.getByRole("button", { name: "Decrypt Stack" }));

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

  it("captures caster, typed targets, and notes when adding a stack entry", async () => {
    const user = userEvent.setup();
    render(<App />);

    await openStackBuilder(user);
    await selectCard(user, "opt", "Opt");

    await user.selectOptions(screen.getByLabelText("Entry caster"), "Player 4");
    await user.selectOptions(screen.getByLabelText("Entry target kind"), "player");
    await user.selectOptions(screen.getByLabelText("Entry player target"), "Player 3");
    await user.click(screen.getByRole("button", { name: "Add entry target" }));
    await user.type(screen.getByLabelText("Entry mana spent"), "4");
    await user.type(screen.getByLabelText("Entry context notes"), "Cast for alternate cost");
    await user.click(screen.getByRole("button", { name: /Begin stackening!|Add to Stack/ }));
    await user.click(screen.getByRole("button", { name: "Decrypt Stack" }));

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
    await user.selectOptions(screen.getByLabelText("Entry target kind"), "other");
    await user.type(screen.getByLabelText("Entry other target"), "Target defined by delayed trigger context");
    await user.click(screen.getByRole("button", { name: "Add entry target" }));
    await user.click(screen.getByRole("button", { name: /Begin stackening!|Add to Stack/ }));
    await user.click(screen.getByRole("button", { name: "Decrypt Stack" }));

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

    await openStackBuilder(user);
    await addCardToStack(user, "opt", "Opt");

    await user.click(screen.getByRole("button", { name: /^Stack/ }));
    await user.selectOptions(screen.getByLabelText("Caster for Opt"), "Player 3");
    await user.selectOptions(screen.getByLabelText("Target kind for Opt"), "player");
    await user.selectOptions(screen.getByLabelText("Player target for Opt"), "Player 4");
    await user.click(screen.getByRole("button", { name: "Add target for Opt" }));
    await user.type(screen.getByLabelText("Context notes for Opt"), "Copied from graveyard");
    await user.click(screen.getByRole("button", { name: "Close" }));
    await user.click(screen.getByRole("button", { name: "Decrypt Stack" }));

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
    await user.selectOptions(screen.getByLabelText("Entry target kind"), "none");
    await user.click(screen.getByRole("button", { name: "Add entry target" }));
    await user.click(screen.getByRole("button", { name: /Begin stackening!|Add to Stack/ }));
    await user.click(screen.getByRole("button", { name: "Decrypt Stack" }));

    const requestBody = await waitFor(() => {
      expect(submittedAskAiRequests.length).toBeGreaterThan(0);
      return submittedAskAiRequests[0];
    });

    expect(requestBody.stack[0]?.targets).toEqual([{ kind: "none" }]);
  });

  it("guards Decrypt Stack when stack is empty", async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    await openStackBuilder(user);

    const decryptButton = screen.getByRole("button", { name: "Decrypt Stack" });
    expect(decryptButton).toBeDisabled();
    await user.click(decryptButton);

    const form = container.querySelector("form");
    expect(form).not.toBeNull();
    fireEvent.submit(form as HTMLFormElement);

    expect(await screen.findByText("Add at least one card before decrypting.")).toBeInTheDocument();
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
    await user.click(screen.getByRole("button", { name: "Add to Stack" }));

    expect(await screen.findByText("Duplicate cards are not supported in MVP1.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Stack/ })).toHaveTextContent("1");
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

    expect(screen.getByRole("button", { name: /^Stack/ })).toHaveTextContent("10");

    await selectCard(user, manyCards[10].name, manyCards[10].name);
    await user.click(screen.getByRole("button", { name: "Add to Stack" }));

    expect(await screen.findByText("MVP stack limit reached (10 cards).")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Stack/ })).toHaveTextContent("10");

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

  it("preserves stack/question and keeps prior answer visible after subsequent failures", async () => {
    const user = userEvent.setup();
    queueAskAiResponses(
      { status: 200, body: { answer: "First success answer" } },
      { status: 502, body: { error: "Miho is working on it", retryAfterSeconds: 13 } },
      { status: 502, body: { error: "Miho is working on it", retryAfterSeconds: 13 } }
    );
    render(<App />);
    await openStackBuilder(user);
    await addCardToStack(user, "opt", "Opt");

    const questionInput = screen.getByPlaceholderText("How does this resolve?");
    await user.type(questionInput, "Will this resolve?");

    await user.click(screen.getByRole("button", { name: "Decrypt Stack" }));
    expect(await screen.findByText("First success answer")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Decrypt Stack" }));
    expect(await screen.findByText("Miho is working on it")).toBeInTheDocument();
    expect(screen.getByText("First success answer")).toBeInTheDocument();

    expect(screen.getByRole("button", { name: /^Stack/ })).toHaveTextContent("1");
    expect(questionInput).toHaveValue("Will this resolve?");
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

    await user.selectOptions(screen.getByLabelText("Number of players"), "3");
    await user.clear(screen.getByLabelText("Player 1 life total"));
    await user.type(screen.getByLabelText("Player 1 life total"), "38");
    await user.clear(screen.getByLabelText("Player 2 life total"));
    await user.type(screen.getByLabelText("Player 2 life total"), "24");
    await user.clear(screen.getByLabelText("Player 3 life total"));
    await user.type(screen.getByLabelText("Player 3 life total"), "17");
    await user.click(screen.getByRole("button", { name: "Confirm game context" }));

    await user.type(screen.getByLabelText("Battlefield search input"), "lig");
    await user.click(await screen.findByRole("button", { name: "Lightning Bolt" }));
    await user.selectOptions(screen.getByLabelText("Battlefield target kind"), "none");
    await user.click(screen.getByRole("button", { name: "Add battlefield target" }));
    await user.click(screen.getByRole("button", { name: "Add battlefield item" }));
    await user.click(screen.getByRole("button", { name: "Continue to stack" }));
    await waitForMetadataReady();

    await selectCard(user, "opt", "Opt");
    await user.type(screen.getByLabelText("Entry mana spent"), "4");
    await user.click(screen.getByRole("button", { name: /Begin stackening!|Add to Stack/ }));

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
          name: "Lightning Bolt",
          targets: [{ kind: "none" }]
        }
      ],
      stack: [{ name: "Opt", manaSpent: 4 }]
    });
  });

  it("requires game context before showing stack builder", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByRole("heading", { name: "Game context" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Confirm game context" }));
    expect(screen.getByRole("heading", { name: "Battlefield context (optional)" })).toBeInTheDocument();
  });

  it("captures battlefield context and submits it in ask-ai payload", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Confirm game context" }));
    await user.type(screen.getByLabelText("Battlefield search input"), "lig");
    await user.click(await screen.findByRole("button", { name: "Lightning Bolt" }));
    await user.selectOptions(screen.getByLabelText("Battlefield target kind"), "none");
    await user.click(screen.getByRole("button", { name: "Add battlefield target" }));
    expect(screen.getByRole("button", { name: "Skip battlefield context" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Add battlefield item" }));
    expect(screen.getByRole("button", { name: "Continue to stack" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Continue to stack" }));
    await waitForMetadataReady();

    await addCardToStack(user, "opt", "Opt");
    await user.click(screen.getByRole("button", { name: "Decrypt Stack" }));

    const requestBody = await waitFor(() => {
      expect(submittedAskAiRequests.length).toBeGreaterThan(0);
      return submittedAskAiRequests[0];
    });
    expect(requestBody.battlefieldContext).toEqual([
      {
        name: "Lightning Bolt",
        details: "Lightning Bolt deals 3 damage to any target.",
        targets: [{ kind: "none" }]
      }
    ]);
  });

  it("keeps battlefield name display-only while preserving linked and selected behavior", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Confirm game context" }));
    const battlefieldSearchInput = screen.getByLabelText("Battlefield search input");
    const battlefieldNameDisplay = screen.getByLabelText("Battlefield item name");

    expect(battlefieldNameDisplay.tagName).toBe("OUTPUT");

    await user.type(battlefieldSearchInput, "lig");
    expect(battlefieldNameDisplay).toHaveTextContent("lig");

    await user.click(await screen.findByRole("button", { name: "Lightning Bolt" }));
    await user.type(battlefieldSearchInput, "ht");

    expect(battlefieldSearchInput).toHaveValue("light");
    expect(battlefieldNameDisplay).toHaveTextContent("Lightning Bolt");
  });
});
