import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import type { AskAiRequest, StackItem } from "./types";

const baseCardMetadataFixture: StackItem[] = [
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
let metadataFixture: StackItem[] = [];
let askAiResponseQueue: Array<{ status: number; body: unknown }> = [];
const submittedAskAiRequests: AskAiRequest[] = [];

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

function createStackItem(name: string, index: number): StackItem {
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

function queueAskAiResponses(...responses: Array<{ status: number; body: unknown }>): void {
  askAiResponseQueue = responses;
}

async function waitForMetadataReady(): Promise<void> {
  await screen.findByText(/\d+ cards ready/);
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

    fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = getUrlFromRequest(input);

      if (url === "/data/cardMetadata.json") {
        return jsonResponse(metadataFixture);
      }

      if (url.endsWith("/api/ask-ai") && init?.method === "POST") {
        submittedAskAiRequests.push(JSON.parse(String(init.body)) as AskAiRequest);

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

    await waitForMetadataReady();

    const searchInput = screen.getByPlaceholderText("Type to begin");
    await user.type(searchInput, "op");
    expect(screen.queryByRole("button", { name: "Opt" })).not.toBeInTheDocument();

    await user.type(searchInput, "t");
    await user.click(await screen.findByRole("button", { name: "Opt" }));

    expect(screen.getByRole("heading", { name: "Opt" })).toBeInTheDocument();
    expect(screen.getByText("Scry 1, then draw a card.")).toBeInTheDocument();
  });

  it("uses first-add then subsequent-add button labels", async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitForMetadataReady();

    await selectCard(user, "opt", "Opt");

    const firstAddButton = screen.getByRole("button", { name: "Begin stackening!" });
    expect(firstAddButton).toBeInTheDocument();

    await user.click(firstAddButton);

    expect(screen.getByRole("button", { name: "Add to Stack" })).toBeInTheDocument();
  });

  it("submits bottom-to-top stack payload after add/remove interactions", async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitForMetadataReady();

    await addCardToStack(user, "opt", "Opt");
    await addCardToStack(user, "cou", "Counterspell");
    await addCardToStack(user, "lig", "Lightning Bolt");

    await user.click(screen.getByRole("button", { name: /^Stack/ }));
    const counterspellRow = screen.getByText("Counterspell").closest("li");
    expect(counterspellRow).not.toBeNull();
    await user.click(within(counterspellRow as HTMLLIElement).getByRole("button", { name: "Remove" }));
    await user.click(screen.getByRole("button", { name: "Close" }));

    await user.click(screen.getByRole("button", { name: "Decrypt Stack" }));

    const requestBody = await waitFor(() => {
      expect(submittedAskAiRequests.length).toBeGreaterThan(0);
      return submittedAskAiRequests[0];
    });

    expect(requestBody.question).toBe("Resolve the stack");
    expect(requestBody.stack.map((card) => card.name)).toEqual(["Opt", "Lightning Bolt"]);
  });

  it("guards Decrypt Stack when stack is empty", async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    await waitForMetadataReady();

    const decryptButton = screen.getByRole("button", { name: "Decrypt Stack" });
    expect(decryptButton).toBeDisabled();
    await user.click(decryptButton);

    const form = container.querySelector("form");
    expect(form).not.toBeNull();
    fireEvent.submit(form as HTMLFormElement);

    expect(await screen.findByText("Add at least one card before decrypting.")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("shows bundled empty-state cat-wizard asset with graceful fallback", async () => {
    render(<App />);
    await waitForMetadataReady();

    const emptyStateImage = screen.getByRole("img", { name: "Cat wizard" });
    expect(emptyStateImage).toHaveAttribute("src", "/assets/cat-wizard.svg");
    expect(screen.getByPlaceholderText("Type to begin")).toBeInTheDocument();

    fireEvent.error(emptyStateImage);
    expect(screen.getByText("Cat wizard")).toBeInTheDocument();
  });

  it("shows stack icon/count only when cards exist and updates count after removal", async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitForMetadataReady();

    expect(screen.queryByRole("button", { name: /^Stack/ })).not.toBeInTheDocument();

    await addCardToStack(user, "opt", "Opt");
    await addCardToStack(user, "cou", "Counterspell");

    const stackButton = screen.getByRole("button", { name: /^Stack/ });
    expect(stackButton).toHaveTextContent("Stack");
    expect(stackButton).toHaveTextContent("2");

    await user.click(stackButton);
    await user.click(within(screen.getByText("Opt").closest("li") as HTMLLIElement).getByRole("button", { name: "Remove" }));
    expect(screen.getByRole("button", { name: /^Stack/ })).toHaveTextContent("1");
  });

  it("renders stack details bottom-to-top and rows stay usable on image load failure", async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitForMetadataReady();

    await addCardToStack(user, "opt", "Opt");
    await addCardToStack(user, "lig", "Lightning Bolt");

    await user.click(screen.getByRole("button", { name: /^Stack/ }));

    const stackDetailsHeading = screen.getByRole("heading", { name: "Stack details" });
    const detailsContainer = stackDetailsHeading.closest("div")?.parentElement as HTMLElement;
    const detailsList = within(detailsContainer).getByRole("list");
    const rows = within(detailsList).getAllByRole("listitem");
    expect(within(rows[0]).getByText("Opt")).toBeInTheDocument();
    expect(within(rows[1]).getByText("Lightning Bolt")).toBeInTheDocument();

    const lightningBoltRow = within(detailsList).getByText("Lightning Bolt").closest("li");
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

    await waitForMetadataReady();

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

    await waitForMetadataReady();

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

    await waitForMetadataReady();
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

    await waitForMetadataReady();
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
});
