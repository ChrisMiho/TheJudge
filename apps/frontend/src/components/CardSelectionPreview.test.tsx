import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import type { CardMetadataItem } from "../types";
import { CardSelectionPreview } from "./CardSelectionPreview";

afterEach(cleanup);

function makeCard(overrides: Partial<CardMetadataItem> = {}): CardMetadataItem {
  return {
    cardId: "opt",
    name: "Opt",
    oracleText: "Scry 1. Draw a card.",
    imageUrl: "https://img.example/opt.jpg",
    manaCost: "{U}",
    manaValue: 1,
    typeLine: "Instant",
    colors: ["U"],
    supertypes: [],
    subtypes: [],
    ...overrides
  } as CardMetadataItem;
}

describe("Frontend - MTG Assistant", () => {
  describe("CardSelectionPreview staged-card composition", () => {
    it("shows the image and its action only, with no duplicated name or metadata beside it", () => {
      render(
        <CardSelectionPreview
          card={makeCard()}
          action={
            <button type="button" aria-label="Remove Opt">
              Remove card
            </button>
          }
        />
      );

      const article = screen.getByRole("article");
      expect(within(article).getByRole("img", { name: "Opt" })).toBeInTheDocument();
      expect(within(article).getByRole("button", { name: "Remove Opt" })).toBeInTheDocument();

      // REQ-133/DEC-160: the duplicated metadata sidebar is gone — name, oracle text, mana
      // cost, type line and colors are reached through the corner detail popup instead.
      expect(within(article).queryByRole("heading")).not.toBeInTheDocument();
      expect(within(article).queryByText("Opt")).not.toBeInTheDocument();
      expect(within(article).queryByText("Scry 1. Draw a card.")).not.toBeInTheDocument();
      expect(within(article).queryByText("{U}")).not.toBeInTheDocument();
      expect(within(article).queryByText("Instant")).not.toBeInTheDocument();
      expect(within(article).queryByText("U")).not.toBeInTheDocument();
    });

    it("keeps card detail reachable through the corner popup after consolidation", async () => {
      const user = userEvent.setup();
      render(<CardSelectionPreview card={makeCard()} />);

      await user.click(screen.getByRole("button", { name: "Show details for Opt" }));

      const popup = screen.getByTestId("card-detail-popup");
      expect(within(popup).getByText("Scry 1. Draw a card.")).toBeInTheDocument();
      expect(within(popup).getByText("{U}")).toBeInTheDocument();
      expect(within(popup).getByText("Instant")).toBeInTheDocument();
    });

    it("renders the image in a single content column rather than an image/metadata grid", () => {
      render(<CardSelectionPreview card={makeCard()} />);

      const article = screen.getByRole("article");
      expect(article.className).not.toMatch(/grid-cols/);
      expect(article.querySelector(".card-shell-column")).not.toBeNull();
    });

    it("still renders the shared text-first fallback, carrying the name, when no image exists", () => {
      render(
        <CardSelectionPreview
          card={makeCard({ imageUrl: "" })}
          action={
            <button type="button" aria-label="Remove Opt">
              Remove card
            </button>
          }
        />
      );

      const fallback = screen.getByTestId("card-presentation-fallback");
      expect(within(fallback).getByText("Opt")).toBeInTheDocument();
      expect(screen.queryByRole("img")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Remove Opt" })).toBeInTheDocument();
    });

    it("renders no action region when the host supplies none", () => {
      render(<CardSelectionPreview card={makeCard()} />);

      expect(screen.queryByRole("button", { name: /remove|add/i })).not.toBeInTheDocument();
      expect(screen.getByRole("img", { name: "Opt" })).toBeInTheDocument();
    });
  });
});
