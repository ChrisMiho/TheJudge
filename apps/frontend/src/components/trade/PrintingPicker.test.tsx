// Slice D: the printing picker becomes a scrollable, filterable box — a
// count header, a ~40vh scroll region instead of growing the page, lazy row
// images, a set filter once a card has more than eight printings, and
// scrolling the current printing into view on open.

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
  describe("PrintingPicker (Slice D)", () => {
    beforeEach(() => {
      // jsdom has no layout engine and doesn't implement scrollIntoView.
      Element.prototype.scrollIntoView = vi.fn();
    });

    it("D1: the header shows the printing count", () => {
      render(
        <PrintingPicker
          cardName="Lightning Bolt"
          printings={[printing(), printing({ id: "printing-2", collectorNumber: "146" })]}
          onSelect={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      expect(screen.getByText("2 printings")).toBeInTheDocument();
    });

    it("D1: a single printing reads '1 printing', not '1 printings'", () => {
      render(
        <PrintingPicker cardName="Rare Card" printings={[printing()]} onSelect={vi.fn()} onCancel={vi.fn()} />
      );

      expect(screen.getByText("1 printing")).toBeInTheDocument();
    });

    it("D2: the printing list sits in a scroll region, not a plain growing list", () => {
      render(
        <PrintingPicker
          cardName="Sol Ring"
          printings={manyPrintings(20)}
          onSelect={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      const list = screen.getByRole("list");
      expect(list).toHaveClass("overflow-y-auto");
      expect(list.className).toMatch(/max-h-\[40vh\]/);
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

    it("D4: the set filter is absent at 8 or fewer printings and present above 8", () => {
      const { rerender } = render(
        <PrintingPicker
          cardName="Sol Ring"
          printings={manyPrintings(8)}
          onSelect={vi.fn()}
          onCancel={vi.fn()}
        />
      );
      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();

      rerender(
        <PrintingPicker
          cardName="Sol Ring"
          printings={manyPrintings(9)}
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
          printings={manyPrintings(9)}
          onSelect={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      await user.type(screen.getByRole("textbox", { name: /filter printings/i }), "nonexistent-set-xyz");

      expect(screen.queryAllByRole("listitem")).toHaveLength(0);
      expect(screen.getByText("No printings match that set.")).toBeInTheDocument();
    });

    it("D6: the row matching selectedPrintingId gets aria-current and is scrolled into view on open", () => {
      const printings = [
        printing({ id: "printing-1" }),
        printing({ id: "printing-2", collectorNumber: "146" }),
        printing({ id: "printing-3", collectorNumber: "1" })
      ];

      render(
        <PrintingPicker
          cardName="Lightning Bolt"
          printings={printings}
          onSelect={vi.fn()}
          onCancel={vi.fn()}
          selectedPrintingId="printing-2"
        />
      );

      const rows = screen.getAllByRole("listitem");
      const selectedButton = within(rows[1]).getByRole("button");
      expect(selectedButton).toHaveAttribute("aria-current", "true");
      expect(rows[0].querySelector("[aria-current]")).not.toBeInTheDocument();
      expect(rows[2].querySelector("[aria-current]")).not.toBeInTheDocument();
      expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
    });
  });
});
