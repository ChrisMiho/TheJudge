import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { deriveCardImageUrl } from "../../lib/cardImage";
import { clearCardPrintingsCache, type CardPrintingPrice } from "../../lib/trade/fetchCardPrintings";
import type { CardMetadataItem } from "../../types";
import { TradeBalancer } from "./TradeBalancer";

const cardMetadata: CardMetadataItem[] = [
  { cardId: "oracle-bolt", name: "Lightning Bolt", imageId: "bolt-img", colors: ["R"] },
  { cardId: "oracle-lotus", name: "Black Lotus", imageId: "lotus-img", colors: [] }
];

// Printing order matters for these tests: with no preferred printing id, the
// balancer defaults to the first printing the backend returns (FLOW-025).
const pricesByOracle: Record<string, { snapshotDate: string; printings: CardPrintingPrice[] }> = {
  "oracle-bolt": {
    snapshotDate: "2026-06-05",
    printings: [
      { id: "bolt-2ed", set: "2ed", setName: "Unlimited Edition", collectorNumber: "162", usd: 10, usdFoil: null },
      { id: "bolt-m10", set: "m10", setName: "Magic 2010", collectorNumber: "146", usd: 4, usdFoil: 25 }
    ]
  },
  "oracle-lotus": {
    snapshotDate: "2026-06-05",
    printings: [
      { id: "lotus-lea", set: "lea", setName: "Limited Edition Alpha", collectorNumber: "232", usd: 30, usdFoil: null }
    ]
  }
};

function jsonResponse(payload: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : "Error",
    json: async () => payload
  } as unknown as Response;
}

function metadataErrorResponse(status: number): Response {
  return { ok: false, status, statusText: "Error", json: async () => ({}) } as unknown as Response;
}

function makeFetchMock(
  prices: typeof pricesByOracle = pricesByOracle,
  metadata: CardMetadataItem[] = cardMetadata
): ReturnType<typeof vi.fn> {
  return vi.fn((input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("/data/cardMetadata.json")) {
      return Promise.resolve(jsonResponse(metadata));
    }
    const match = url.match(/\/api\/cards\/([^/]+)\/prices$/);
    if (match) {
      const oracleId = decodeURIComponent(match[1]);
      const entry = prices[oracleId];
      if (!entry) {
        return Promise.resolve(jsonResponse({ error: "card_not_found" }, 404));
      }
      return Promise.resolve(jsonResponse({ oracleId, ...entry }));
    }
    return Promise.reject(new Error(`Unhandled fetch in test: ${url}`));
  });
}

async function renderBalancer(): Promise<void> {
  render(<TradeBalancer />);
  await waitFor(() => {
    expect(screen.getByLabelText("Side A card search")).not.toBeDisabled();
  });
}

function side(sideId: "A" | "B"): HTMLElement {
  return screen.getByRole("region", { name: `Side ${sideId}` });
}

function sideTotalText(sideId: "A" | "B"): string {
  return within(side(sideId)).getByLabelText(`Side ${sideId} total`).textContent ?? "";
}

/** Manual path: search a card by name and add it. The card is added immediately,
 * defaulting to the first printing the backend returns; the caller waits for
 * that fetch to resolve before making further assertions (FLOW-025). */
async function addCard(
  user: ReturnType<typeof userEvent.setup>,
  sideId: "A" | "B",
  cardName: string
): Promise<void> {
  const search = within(side(sideId)).getByLabelText(`Side ${sideId} card search`);
  await user.clear(search);
  await user.type(search, cardName.slice(0, 5));
  await user.click(within(side(sideId)).getByRole("button", { name: new RegExp(`^${cardName}`) }));
  await waitFor(() => {
    expect(within(side(sideId)).queryByText("Loading price…")).not.toBeInTheDocument();
  });
}

/** Opens the "Change printing" picker on an already-loaded entry and picks one. */
async function changePrinting(
  user: ReturnType<typeof userEvent.setup>,
  sideId: "A" | "B",
  cardName: string,
  printingLabel: string | RegExp
): Promise<void> {
  await user.click(
    within(side(sideId)).getByLabelText(new RegExp(`^Change printing for ${cardName}`))
  );
  await user.click(within(side(sideId)).getByRole("button", { name: printingLabel }));
}

describe("Frontend - Trade", () => {
  describe("TradeBalancer", () => {
    beforeEach(() => {
      clearCardPrintingsCache();
      vi.stubGlobal("fetch", makeFetchMock());
    });

    afterEach(() => {
      vi.unstubAllGlobals();
      vi.clearAllMocks();
    });

    it("shows a loading state for the card list, then an even trade with no snapshot line yet", async () => {
      render(<TradeBalancer />);

      expect(screen.getByText("Loading card list…")).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByLabelText("Side A card search")).not.toBeDisabled();
      });
      expect(screen.getByLabelText("Trade difference")).toHaveTextContent("Even trade");
      // Nothing has been priced yet — no bulk price snapshot to report.
      expect(screen.queryByText(/^Prices as of /)).not.toBeInTheDocument();
    });

    it("adds an entry via manual search, defaulting to the first fetched printing, and totals it", async () => {
      const user = userEvent.setup();
      await renderBalancer();

      await addCard(user, "A", "Lightning Bolt");

      const entry = within(side("A")).getByRole("listitem");
      expect(entry).toHaveTextContent("Unlimited Edition (2ED) #162");
      expect(sideTotalText("A")).toBe("$10.00");
      expect(screen.getByLabelText("Trade difference")).toHaveTextContent(
        "Side A is ahead by $10.00"
      );
      await waitFor(() => {
        expect(screen.getByText("Prices as of 5 June 2026")).toBeInTheDocument();
      });
    });

    it("allows duplicates: adding the same card twice counts both entries", async () => {
      const user = userEvent.setup();
      await renderBalancer();

      await addCard(user, "A", "Lightning Bolt");
      await addCard(user, "A", "Lightning Bolt");

      expect(
        within(side("A")).getAllByRole("button", { name: /^Remove Lightning Bolt/ })
      ).toHaveLength(2);
      expect(sideTotalText("A")).toBe("$20.00");
    });

    it("updates totals and difference live on foil, quantity, and remove", async () => {
      const user = userEvent.setup();
      await renderBalancer();

      await addCard(user, "A", "Lightning Bolt");
      await addCard(user, "B", "Black Lotus");

      expect(screen.getByLabelText("Trade difference")).toHaveTextContent(
        "Side B is ahead by $20.00"
      );

      await user.click(
        within(side("A")).getByLabelText("Toggle foil for Lightning Bolt (Side A)")
      );
      // Unlimited Edition has no foil price -> $0-plus-caution, not $ from usdFoil.
      expect(sideTotalText("A")).toBe("$0.00");

      await user.click(
        within(side("A")).getByLabelText("Toggle foil for Lightning Bolt (Side A)")
      );
      await user.click(
        within(side("A")).getByLabelText("Increase quantity for Lightning Bolt (Side A)")
      );
      expect(sideTotalText("A")).toBe("$20.00");

      await user.click(
        within(side("A")).getByLabelText("Decrease quantity for Lightning Bolt (Side A)")
      );
      expect(sideTotalText("A")).toBe("$10.00");

      await user.click(within(side("B")).getByLabelText("Remove Black Lotus (Side B)"));
      expect(sideTotalText("B")).toBe("$0.00");
      expect(screen.getByLabelText("Trade difference")).toHaveTextContent(
        "Side A is ahead by $10.00"
      );
    });

    it("flags a missing selected-mode price and counts it as $0", async () => {
      const user = userEvent.setup();
      await renderBalancer();

      await addCard(user, "A", "Lightning Bolt");
      expect(sideTotalText("A")).toBe("$10.00");

      await user.click(
        within(side("A")).getByLabelText("Toggle foil for Lightning Bolt (Side A)")
      );

      const entry = within(side("A")).getByRole("listitem");
      expect(entry).toHaveAttribute("data-missing-price", "true");
      expect(
        within(entry).getByLabelText("No foil price for Lightning Bolt")
      ).toBeInTheDocument();
      const contribution = within(entry).getByTestId("entry-contribution");
      expect(contribution).toHaveClass("text-amber-300");
      expect(contribution).toHaveTextContent("$0.00");
      expect(sideTotalText("A")).toBe("$0.00");
    });

    it("re-prices an entry when its printing changes", async () => {
      const user = userEvent.setup();
      await renderBalancer();

      await addCard(user, "A", "Lightning Bolt");
      expect(sideTotalText("A")).toBe("$10.00");

      await changePrinting(user, "A", "Lightning Bolt", /Magic 2010/);

      expect(sideTotalText("A")).toBe("$4.00");
    });

    it("B4: a manually toggled foil resets to non-foil when the player changes to a non-foil-priced printing", async () => {
      const user = userEvent.setup();
      await renderBalancer();

      await addCard(user, "A", "Lightning Bolt");
      const foilToggle = within(side("A")).getByLabelText(
        "Toggle foil for Lightning Bolt (Side A)"
      );
      expect(foilToggle).toHaveAttribute("aria-pressed", "false");

      // Unlimited Edition (bolt-2ed) has no foil price — toggling foil here
      // is a manual player action, not a printing change.
      await user.click(foilToggle);
      expect(
        within(side("A")).getByLabelText("Toggle foil for Lightning Bolt (Side A)")
      ).toHaveAttribute("aria-pressed", "true");

      // Changing to Magic 2010 (bolt-m10, usd present) re-derives the mode
      // from that printing's own prices — the toggled foil is not carried
      // over; it lands back on non-foil.
      await changePrinting(user, "A", "Lightning Bolt", /Magic 2010/);

      expect(
        within(side("A")).getByLabelText("Toggle foil for Lightning Bolt (Side A)")
      ).toHaveAttribute("aria-pressed", "false");
      expect(sideTotalText("A")).toBe("$4.00");
    });

    it("disambiguates printings in the picker by set, collector number, and a working id-derived image", async () => {
      const user = userEvent.setup();
      await renderBalancer();

      await addCard(user, "A", "Lightning Bolt");
      const entry = within(side("A")).getByRole("listitem");

      // The resolved entry itself shows a working image, derived from its
      // selected printing's id (REQ-066/REQ-174 image-derive template). The
      // image is decorative (the card name is already visible as text), so
      // it's queried by DOM shape, not accessible role.
      const entryImage = entry.querySelector("img");
      expect(entryImage).toHaveAttribute("src", deriveCardImageUrl("bolt-2ed"));

      await user.click(
        within(side("A")).getByLabelText("Change printing for Lightning Bolt (Side A)")
      );
      const pickerElement = within(side("A")).getByRole("group", {
        name: "Choose a printing for Lightning Bolt"
      });
      const picker = within(pickerElement);

      const unlimitedOption = picker.getByRole("button", { name: /Unlimited Edition \(2ED\) #162/ });
      expect(unlimitedOption.querySelector("img")).toHaveAttribute(
        "src",
        deriveCardImageUrl("bolt-2ed")
      );

      const magicOption = picker.getByRole("button", { name: /Magic 2010 \(M10\) #146/ });
      expect(magicOption.querySelector("img")).toHaveAttribute(
        "src",
        deriveCardImageUrl("bolt-m10")
      );
      // Two distinct printings of the same card render two distinct images —
      // the image, not just text, disambiguates them.
      expect(unlimitedOption.querySelector("img")?.getAttribute("src")).not.toBe(
        magicOption.querySelector("img")?.getAttribute("src")
      );
    });

    it("renders an ISO snapshot timestamp as date-level copy with no raw time, milliseconds, or zone", async () => {
      vi.stubGlobal(
        "fetch",
        makeFetchMock({
          "oracle-bolt": { ...pricesByOracle["oracle-bolt"], snapshotDate: "2026-06-05T22:21:13.248Z" },
          "oracle-lotus": pricesByOracle["oracle-lotus"]
        })
      );
      const user = userEvent.setup();
      await renderBalancer();
      await addCard(user, "A", "Lightning Bolt");

      const freshness = await screen.findByText(/^Prices as of /);
      expect(freshness).toHaveTextContent("Prices as of 5 June 2026");
      expect(freshness.textContent).not.toMatch(/T22:21:13\.248Z|\d{2}:\d{2}|Z$/);
    });

    it("degrades safely when the snapshot value is unparseable, leaving pricing intact", async () => {
      vi.stubGlobal(
        "fetch",
        makeFetchMock({
          "oracle-bolt": { ...pricesByOracle["oracle-bolt"], snapshotDate: "not-a-date" },
          "oracle-lotus": pricesByOracle["oracle-lotus"]
        })
      );
      const user = userEvent.setup();
      await renderBalancer();

      await addCard(user, "A", "Lightning Bolt");
      expect(sideTotalText("A")).toBe("$10.00");
      expect(screen.queryByText(/^Prices as of /)).not.toBeInTheDocument();
      expect(screen.queryByText(/not-a-date/)).not.toBeInTheDocument();
    });

    it("surfaces the reason when the card list fails to load", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn((input: RequestInfo | URL) => {
          const url = String(input);
          if (url.includes("/data/cardMetadata.json")) {
            return Promise.resolve(metadataErrorResponse(500));
          }
          return Promise.reject(new Error(`Unhandled fetch in test: ${url}`));
        })
      );
      render(<TradeBalancer />);

      const alert = await screen.findByRole("alert");
      expect(alert).toHaveTextContent("The card list is unavailable right now.");
      expect(alert).toHaveTextContent("500");
      expect(screen.getByLabelText("Trade difference")).toHaveTextContent("Even trade");
      expect(screen.getByLabelText("Side A card search")).toBeDisabled();
    });

    it("degrades a failed price fetch to $0-plus-caution with a retry affordance, and retrying re-fetches", async () => {
      const flakyFetch = vi.fn((input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/data/cardMetadata.json")) {
          return Promise.resolve(jsonResponse(cardMetadata));
        }
        if (url.includes("/api/cards/oracle-bolt/prices")) {
          if (flakyFetch.mock.calls.filter((call) => String(call[0]).includes("oracle-bolt")).length === 1) {
            return Promise.reject(new Error("network down"));
          }
          return Promise.resolve(jsonResponse({ oracleId: "oracle-bolt", ...pricesByOracle["oracle-bolt"] }));
        }
        return Promise.reject(new Error(`Unhandled fetch in test: ${url}`));
      });
      vi.stubGlobal("fetch", flakyFetch);

      const user = userEvent.setup();
      await renderBalancer();

      const search = within(side("A")).getByLabelText("Side A card search");
      await user.type(search, "Light");
      await user.click(within(side("A")).getByRole("button", { name: /^Lightning Bolt/ }));

      const entry = within(side("A")).getByRole("listitem");
      await waitFor(() => {
        expect(within(entry).getByText("Price unavailable right now.")).toBeInTheDocument();
      });
      expect(entry).toHaveAttribute("data-missing-price", "true");
      expect(sideTotalText("A")).toBe("$0.00");

      await user.click(within(entry).getByRole("button", { name: "Retry" }));

      await waitFor(() => {
        expect(sideTotalText("A")).toBe("$10.00");
      });
      expect(within(entry).queryByText("Price unavailable right now.")).not.toBeInTheDocument();
    });
  });
});
