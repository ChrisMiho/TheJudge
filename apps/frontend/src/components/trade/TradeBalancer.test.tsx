import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createCardPrices,
  loadCardPrices,
  type CardPrintingPriceArtifact
} from "../../lib/trade/loadCardPrices";
import { TradeBalancer } from "./TradeBalancer";

vi.mock("../../lib/trade/loadCardPrices", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../lib/trade/loadCardPrices")>();
  return { ...actual, loadCardPrices: vi.fn() };
});

const artifact: CardPrintingPriceArtifact = {
  snapshotDate: "2026-06-05",
  printings: {
    "bolt-2ed": {
      id: "bolt-2ed",
      oracleId: "oracle-bolt",
      name: "Lightning Bolt",
      set: "2ed",
      setName: "Unlimited Edition",
      collectorNumber: "162",
      imageUrl: "https://example.test/bolt-2ed.jpg",
      usd: 10,
      usdFoil: null
    },
    "bolt-m10": {
      id: "bolt-m10",
      oracleId: "oracle-bolt",
      name: "Lightning Bolt",
      set: "m10",
      setName: "Magic 2010",
      collectorNumber: "146",
      imageUrl: "https://example.test/bolt-m10.jpg",
      usd: 4,
      usdFoil: 25
    },
    "lotus-lea": {
      id: "lotus-lea",
      oracleId: "oracle-lotus",
      name: "Black Lotus",
      set: "lea",
      setName: "Limited Edition Alpha",
      collectorNumber: "232",
      imageUrl: "https://example.test/lotus-lea.jpg",
      usd: 30,
      usdFoil: null
    }
  },
  byOracleId: {
    "oracle-bolt": ["bolt-2ed", "bolt-m10"],
    "oracle-lotus": ["lotus-lea"]
  }
};

const loadCardPricesMock = vi.mocked(loadCardPrices);

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

/** Manual path: search a card by name, then pick one of its printings. */
async function addCard(
  user: ReturnType<typeof userEvent.setup>,
  sideId: "A" | "B",
  cardName: string,
  printingLabel: string | RegExp
): Promise<void> {
  const search = within(side(sideId)).getByLabelText(`Side ${sideId} card search`);
  await user.clear(search);
  await user.type(search, cardName.slice(0, 5));
  await user.click(within(side(sideId)).getByRole("button", { name: new RegExp(`^${cardName}`) }));
  await user.click(within(side(sideId)).getByRole("button", { name: printingLabel }));
}

describe("Frontend - Trade", () => {
  describe("TradeBalancer", () => {
    beforeEach(() => {
      loadCardPricesMock.mockResolvedValue(createCardPrices(artifact));
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    it("shows a loading state, then the snapshot date and an even trade", async () => {
      render(<TradeBalancer />);

      expect(screen.getByText("Loading card prices…")).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText("Prices as of 5 June 2026")).toBeInTheDocument();
      });
      expect(screen.getByLabelText("Trade difference")).toHaveTextContent("Even trade");
    });

    it("adds an entry via manual search plus printing pick and totals it", async () => {
      const user = userEvent.setup();
      await renderBalancer();

      await addCard(user, "A", "Lightning Bolt", /Magic 2010/);

      expect(sideTotalText("A")).toBe("$4.00");
      expect(screen.getByLabelText("Trade difference")).toHaveTextContent(
        "Side A is ahead by $4.00"
      );
    });

    it("allows duplicates: adding the same card twice counts both entries", async () => {
      const user = userEvent.setup();
      await renderBalancer();

      await addCard(user, "A", "Lightning Bolt", /Magic 2010/);
      await addCard(user, "A", "Lightning Bolt", /Magic 2010/);

      expect(
        within(side("A")).getAllByRole("button", { name: /^Remove Lightning Bolt/ })
      ).toHaveLength(2);
      expect(sideTotalText("A")).toBe("$8.00");
    });

    it("updates totals and difference live on foil, quantity, and remove", async () => {
      const user = userEvent.setup();
      await renderBalancer();

      await addCard(user, "A", "Lightning Bolt", /Magic 2010/);
      await addCard(user, "B", "Black Lotus", /Limited Edition Alpha/);

      expect(screen.getByLabelText("Trade difference")).toHaveTextContent(
        "Side B is ahead by $26.00"
      );

      await user.click(
        within(side("A")).getByLabelText("Toggle foil for Lightning Bolt (Side A)")
      );
      expect(sideTotalText("A")).toBe("$25.00");

      await user.click(
        within(side("A")).getByLabelText("Increase quantity for Lightning Bolt (Side A)")
      );
      expect(sideTotalText("A")).toBe("$50.00");
      expect(screen.getByLabelText("Trade difference")).toHaveTextContent(
        "Side A is ahead by $20.00"
      );

      await user.click(
        within(side("A")).getByLabelText("Decrease quantity for Lightning Bolt (Side A)")
      );
      expect(sideTotalText("A")).toBe("$25.00");

      await user.click(within(side("B")).getByLabelText("Remove Black Lotus (Side B)"));
      expect(sideTotalText("B")).toBe("$0.00");
      expect(screen.getByLabelText("Trade difference")).toHaveTextContent(
        "Side A is ahead by $25.00"
      );
    });

    it("flags a missing selected-mode price and counts it as $0", async () => {
      const user = userEvent.setup();
      await renderBalancer();

      await addCard(user, "A", "Lightning Bolt", /Unlimited Edition/);
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

      await addCard(user, "A", "Lightning Bolt", /Unlimited Edition/);
      expect(sideTotalText("A")).toBe("$10.00");

      await user.click(
        within(side("A")).getByLabelText("Change printing for Lightning Bolt (Side A)")
      );
      await user.click(within(side("A")).getByRole("button", { name: /Magic 2010/ }));

      expect(sideTotalText("A")).toBe("$4.00");
    });

    it("renders an ISO snapshot timestamp as date-level copy with no raw time, milliseconds, or zone", async () => {
      loadCardPricesMock.mockResolvedValue(
        createCardPrices({ ...artifact, snapshotDate: "2026-06-05T22:21:13.248Z" })
      );
      render(<TradeBalancer />);

      const freshness = await screen.findByText(/^Prices as of /);
      expect(freshness).toHaveTextContent("Prices as of 5 June 2026");
      expect(freshness.textContent).not.toMatch(/T22:21:13\.248Z|\d{2}:\d{2}|Z$/);
    });

    it("degrades safely when the snapshot value is unparseable, leaving pricing intact", async () => {
      loadCardPricesMock.mockResolvedValue(
        createCardPrices({ ...artifact, snapshotDate: "not-a-date" })
      );
      const user = userEvent.setup();
      render(<TradeBalancer />);

      await waitFor(() => {
        expect(screen.getByLabelText("Side A card search")).not.toBeDisabled();
      });
      expect(screen.queryByText(/^Prices as of /)).not.toBeInTheDocument();
      expect(screen.queryByText(/not-a-date/)).not.toBeInTheDocument();

      await addCard(user, "A", "Lightning Bolt", /Magic 2010/);
      expect(sideTotalText("A")).toBe("$4.00");
      expect(screen.getByLabelText("Trade difference")).toHaveTextContent(
        "Side A is ahead by $4.00"
      );
    });

    it("surfaces the reason when the price artifact fails to load", async () => {
      loadCardPricesMock.mockRejectedValue(new Error("Could not load card printing prices: 404"));
      render(<TradeBalancer />);

      const alert = await screen.findByRole("alert");
      expect(alert).toHaveTextContent("Card prices are unavailable right now.");
      expect(alert).toHaveTextContent("404");
      expect(screen.getByLabelText("Trade difference")).toHaveTextContent("Even trade");
      expect(screen.getByLabelText("Side A card search")).toBeDisabled();
    });
  });
});
