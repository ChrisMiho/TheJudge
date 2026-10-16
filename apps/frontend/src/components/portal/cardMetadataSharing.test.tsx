import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { loadCardMetadata } from "../../lib/cardMetadataStore";
import { AssistantSeedContext } from "../../lib/portal/seedContext";
import { baseCardMetadataFixture, getUrlFromRequest, jsonResponse } from "../../test/appTestHelpers";
import type { CardMetadataItem } from "../../types";
import { TradeBalancer } from "../trade/TradeBalancer";
import { MtgAssistantApp } from "./MtgAssistantApp";
import { QuickLookupApp } from "./quick-lookup/QuickLookupApp";

const cards: CardMetadataItem[] = [
  { cardId: "oracle-bolt", name: "Lightning Bolt", imageId: "bolt-img", colors: ["R"] }
];

function failingFetch(): ReturnType<typeof vi.fn> {
  return vi.fn(async (input: RequestInfo | URL): Promise<Response> => {
    const url = getUrlFromRequest(input);
    if (url === "/data/cardMetadata.json") return jsonResponse({ error: "down" }, 503);
    return jsonResponse({ ok: true });
  });
}

function renderInDepth(): void {
  render(
    <MemoryRouter initialEntries={["/in-depth"]}>
      <AssistantSeedContext.Provider
        value={{
          queueSeed: vi.fn(),
          consumeSeed: () => null,
          queueLookupCarry: vi.fn(),
          consumeLookupCarry: () => null,
          queueHistoryResume: vi.fn(),
          consumeHistoryResume: () => null,
          queueHistoryDeletion: vi.fn(),
          consumeHistoryDeletion: () => null,
          queueDraftResume: vi.fn(),
          consumeDraftResume: () => false,
          historyResumeVersion: 0
        }}
      >
        <MtgAssistantApp />
      </AssistantSeedContext.Provider>
    </MemoryRouter>
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("Shared card list across screens (NFR-014 tier 3)", () => {
  it("Quick Question shows the unavailable copy after a failed list, and the question box still works", async () => {
    vi.stubGlobal("fetch", failingFetch());
    const user = userEvent.setup();
    render(<QuickLookupApp />);

    await user.click(screen.getByRole("button", { name: "Add card" }));
    expect(await screen.findByText("Card search is unavailable. You can still ask without a card.")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /question/i })).toBeEnabled();
  });

  it("In-Depth shows no message and logs the error after a failed list", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.stubGlobal("fetch", failingFetch());
    renderInDepth();

    await waitFor(() => expect(errorSpy).toHaveBeenCalled());
    expect(screen.queryByText(/unavailable/i)).not.toBeInTheDocument();
  });

  it("a screen that unmounts mid-download does not cancel it for another screen still waiting", async () => {
    let release: (response: Response) => void = () => undefined;
    const fetchMock = vi.fn((input: RequestInfo | URL): Promise<Response> => {
      const url = getUrlFromRequest(input);
      if (url === "/data/cardMetadata.json") {
        return new Promise<Response>((resolve) => {
          release = resolve;
        });
      }
      return Promise.resolve(jsonResponse({ ok: true }));
    });
    vi.stubGlobal("fetch", fetchMock);

    const first = render(<TradeBalancer />);
    expect(screen.getByText("Loading card list…")).toBeInTheDocument();
    first.unmount();

    render(<QuickLookupApp />);
    release(jsonResponse(baseCardMetadataFixture));

    await waitFor(() => expect(screen.queryByRole("status", { name: /loading/i })).not.toBeInTheDocument());
    const metadataCalls = fetchMock.mock.calls.filter(([input]) => getUrlFromRequest(input) === "/data/cardMetadata.json");
    expect(metadataCalls).toHaveLength(1);
    expect(screen.queryByText("Card search is unavailable. You can still ask without a card.")).not.toBeInTheDocument();
  });

  it("a screen opened after the list arrived renders with the list in hand and loading false on first render", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL): Promise<Response> => {
      const url = getUrlFromRequest(input);
      if (url === "/data/cardMetadata.json") return jsonResponse(cards);
      return jsonResponse({ ok: true });
    });
    vi.stubGlobal("fetch", fetchMock);
    await loadCardMetadata();

    render(<TradeBalancer />);

    // First render, no await: no one-frame "Loading card list…".
    expect(screen.queryByText("Loading card list…")).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Add card" })[0]).toBeEnabled();
    expect(fetchMock.mock.calls.filter(([input]) => getUrlFromRequest(input) === "/data/cardMetadata.json")).toHaveLength(1);
  });
});
