// Slice D built the scrollable, filterable box. Slice G (REQ-065, owner-edited)
// moved it onto the shared SheetShell and gave each printing a Nonfoil and a
// Foil price pill — a tap picks the printing and the finish together — and
// dropped the filter threshold from eight printings to five.

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CardPrintingPrice } from "../../lib/trade/fetchCardPrintings";
import { PrintingPicker } from "./PrintingPicker";

function printing(overrides: Partial<CardPrintingPrice> = {}): CardPrintingPrice {
  return {
    id: "printing-1",
    set: "2ed",
    setName: "Unlimited Edition",
    collectorNumber: "162",
    usd: 3.5,
    usdFoil: null,
    ...overrides
  };
}

/** A card with N printings, spread across a few distinct sets so the filter
 * test has something to narrow. */
function manyPrintings(count: number): CardPrintingPrice[] {
  const sets = [
    { set: "2ed", setName: "Unlimited Edition" },
    { set: "m10", setName: "Magic 2010" },
    { set: "cmr", setName: "Commander Legends" }
  ];
  return Array.from({ length: count }, (_, index) =>
    printing({
      id: `printing-${index}`,
      collectorNumber: String(index + 1),
      ...sets[index % sets.length]
    })
  );
}

describe("Frontend - Trade", () => {
  describe("PrintingPicker (slice G: shared sheet, Nonfoil/Foil pills)", () => {
    beforeEach(() => {
      // jsdom has no layout engine and doesn't implement scrollIntoView.
      Element.prototype.scrollIntoView = vi.fn();
    });

    it("opens in the shared sheet with the card's art and name", () => {
      render(
        <PrintingPicker
          cardName="Lightning Bolt"
          printings={[printing()]}
          onSelect={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      expect(screen.getByTestId("printing-picker")).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: /Lightning Bolt/ })).toBeInTheDocument();
    });

    it("D1: no printing-count line: the mockup's picker shows only the lede, the filter and the rows", () => {
      render(
        <PrintingPicker
          cardName="Lightning Bolt"
          printings={[printing(), printing({ id: "printing-2", collectorNumber: "146" })]}
          onSelect={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      expect(screen.getByText("Tap a price to use that printing and finish.")).toBeInTheDocument();
      expect(screen.queryByText("2 printings")).not.toBeInTheDocument();
      expect(screen.queryByText("only printing")).not.toBeInTheDocument();
    });

    it("D2: the printing list lives in the sheet body, not a plain growing list", () => {
      render(
        <PrintingPicker
          cardName="Sol Ring"
          printings={manyPrintings(20)}
          onSelect={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      // The list is the mockup's `.printing-list`; it scrolls with the shared sheet's own body, so a
      // card with 771 printings never grows the page.
      const list = screen.getByRole("list");
      expect(list).toHaveClass("printing-list");
      expect(list.closest(".body")).not.toBeNull();
    });

    it("D3: row images carry loading=\"lazy\"", () => {
      render(
        <PrintingPicker
          cardName="Lightning Bolt"
          printings={[printing()]}
          onSelect={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      const image = screen.getByRole("listitem").querySelector("img");
      expect(image).toHaveAttribute("loading", "lazy");
    });

    it("the filter is absent at 5 or fewer printings and present above 5", () => {
      const { rerender } = render(
        <PrintingPicker
          cardName="Sol Ring"
          printings={manyPrintings(5)}
          onSelect={vi.fn()}
          onCancel={vi.fn()}
        />
      );
      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();

      rerender(
        <PrintingPicker
          cardName="Sol Ring"
          printings={manyPrintings(6)}
          onSelect={vi.fn()}
          onCancel={vi.fn()}
        />
      );
      expect(screen.getByRole("textbox", { name: /filter printings/i })).toBeInTheDocument();
    });

    it("D5: typing in the filter narrows visible rows to those matching set name or code", async () => {
      const user = userEvent.setup();
      render(
        <PrintingPicker
          cardName="Sol Ring"
          printings={manyPrintings(12)}
          onSelect={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      expect(screen.getAllByRole("listitem")).toHaveLength(12);

      const filterInput = screen.getByRole("textbox", { name: /filter printings/i });
      await user.type(filterInput, "commander");

      const rows = screen.getAllByRole("listitem");
      expect(rows.length).toBeGreaterThan(0);
      expect(rows.length).toBeLessThan(12);
      for (const row of rows) {
        expect(within(row).getByText(/Commander Legends/)).toBeInTheDocument();
      }

      // A set code also matches, case-insensitively.
      await user.clear(filterInput);
      await user.type(filterInput, "CMR");
      expect(
        screen.getAllByRole("listitem").every((row) => within(row).queryByText(/Commander Legends/))
      ).toBe(true);
    });

    it("D5: a filter matching nothing shows no rows and no crash", async () => {
      const user = userEvent.setup();
      render(
        <PrintingPicker
          cardName="Sol Ring"
          printings={manyPrintings(6)}
          onSelect={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      await user.type(screen.getByRole("textbox", { name: /filter printings/i }), "nonexistent-set-xyz");

      expect(screen.queryAllByRole("listitem")).toHaveLength(0);
      expect(screen.getByText("No printings match that set.")).toBeInTheDocument();
    });

    it("D6: the row matching selectedPrintingId/selectedFoil gets aria-current on that pill and is scrolled into view on open", () => {
      const printings = [
        printing({ id: "printing-1" }),
        printing({ id: "printing-2", collectorNumber: "146", usdFoil: 9.5 }),
        printing({ id: "printing-3", collectorNumber: "1" })
      ];

      render(
        <PrintingPicker
          cardName="Lightning Bolt"
          printings={printings}
          onSelect={vi.fn()}
          onCancel={vi.fn()}
          selectedPrintingId="printing-2"
          selectedFoil={true}
        />
      );

      const rows = screen.getAllByRole("listitem");
      const foilPill = within(rows[1]).getByRole("button", { name: / foil$/i });
      expect(foilPill).toHaveAttribute("aria-current", "true");
      const nonfoilPill = within(rows[1]).getByRole("button", { name: /nonfoil/i });
      expect(nonfoilPill).not.toHaveAttribute("aria-current");
      expect(rows[0].querySelector("[aria-current]")).not.toBeInTheDocument();
      expect(rows[2].querySelector("[aria-current]")).not.toBeInTheDocument();
      expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
    });

    it("REQ-065: each row shows a Nonfoil and a Foil price pill; a tap picks that printing and finish", async () => {
      const onSelect = vi.fn();
      const user = userEvent.setup();
      render(
        <PrintingPicker
          cardName="Lightning Bolt"
          printings={[printing({ usd: 3.5, usdFoil: 12.75 })]}
          onSelect={onSelect}
          onCancel={vi.fn()}
        />
      );

      await user.click(screen.getByRole("button", { name: /nonfoil/i }));
      expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "printing-1" }), false);

      await user.click(screen.getByRole("button", { name: / foil$/i }));
      expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "printing-1" }), true);
    });

    it("REQ-065: a printing with no foil price shows a disabled Foil pill", () => {
      render(
        <PrintingPicker
          cardName="Lightning Bolt"
          printings={[printing({ usd: 3.5, usdFoil: null })]}
          onSelect={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      expect(screen.getByRole("button", { name: / foil$/i })).toBeDisabled();
      expect(screen.getByRole("button", { name: /nonfoil/i })).toBeEnabled();
    });
  });
});
