import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CardSelectionPreview } from "./CardSelectionPreview";
import type { CardMetadataItem } from "../types";

const lightningBolt: CardMetadataItem = {
  cardId: "oracle-lightning-bolt",
  name: "Lightning Bolt",
  oracleText: "Lightning Bolt deals 3 damage to any target.",
  imageUrl: "https://cards.example/lightning-bolt.jpg",
  manaCost: "{R}",
  manaValue: 1,
  typeLine: "Instant",
  colors: ["R"],
  supertypes: [],
  subtypes: []
};

describe("Frontend - Shared", () => {
  describe("CardSelectionPreview", () => {
    it("renders full metadata lists when every field is present", () => {
      render(
        <CardSelectionPreview card={lightningBolt} contextTitle="Context" contextContent={<p>Context body</p>} />
      );

      expect(screen.getByRole("heading", { name: "Lightning Bolt" })).toBeInTheDocument();
      expect(screen.getByText("R")).toBeInTheDocument();
    });

    it("renders N/A fallbacks instead of throwing when colors, supertypes, and subtypes are missing", () => {
      const incompleteCard = { ...lightningBolt } as CardMetadataItem;
      // Simulates a frozen/resumed card whose stored shape predates these fields —
      // CardMetadataItem's type says they're required, but runtime data is not guaranteed to match.
      delete (incompleteCard as Partial<CardMetadataItem>).colors;
      delete (incompleteCard as Partial<CardMetadataItem>).supertypes;
      delete (incompleteCard as Partial<CardMetadataItem>).subtypes;

      expect(() =>
        render(
          <CardSelectionPreview card={incompleteCard} contextTitle="Context" contextContent={<p>Context body</p>} />
        )
      ).not.toThrow();

      expect(screen.getByRole("heading", { name: "Lightning Bolt" })).toBeInTheDocument();
      expect(screen.getAllByText("N/A")).toHaveLength(3);
    });

    it("renders N/A fallbacks for present-but-empty metadata lists", () => {
      render(
        <CardSelectionPreview
          card={{ ...lightningBolt, colors: [], supertypes: [], subtypes: [] }}
          contextTitle="Context"
          contextContent={<p>Context body</p>}
        />
      );

      expect(screen.getAllByText("N/A")).toHaveLength(3);
    });

    it("still renders remaining fields (name, oracle text, mana cost) alongside missing metadata lists", () => {
      const incompleteCard = { ...lightningBolt } as CardMetadataItem;
      delete (incompleteCard as Partial<CardMetadataItem>).colors;

      render(
        <CardSelectionPreview card={incompleteCard} contextTitle="Context" contextContent={<p>Context body</p>} />
      );

      expect(screen.getByText("Lightning Bolt deals 3 damage to any target.")).toBeInTheDocument();
      expect(screen.getByText("{R}")).toBeInTheDocument();
    });
  });
});
