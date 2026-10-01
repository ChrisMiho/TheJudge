import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("./lib/debugLogger", async () => {
  const harness = await import("./test/interactionFlowsHarness");
  return {
    createCorrelationId: harness.createCorrelationIdMock,
    logFrontendDebug: harness.logFrontendDebugMock
  };
});

import App from "./App";
import {
  baseCardMetadataFixture,
  createStackItem,
  advancePastZoneCollection,
  advanceToContextEnrichmentFromZones,
  openStackBuilder,
  selectCard,
  addCardToStack
} from "./test/appTestHelpers";
import {
  installInteractionFlowsHarness,
  setMetadataFixture,
  submittedAskAiRequests
} from "./test/interactionFlowsHarness";

describe("Frontend - MTG Assistant", () => {
describe("Interaction flows - zone card presentation", () => {
  installInteractionFlowsHarness();

  it("blocks Decrypt Stack after all cards are removed in enrichment", async () => {
    // REQ-209/REQ-017 (slice D/E): per-card removal moved from the Context sheet to
    // the Cards station's shelf card menu. Reach Context once (furthest-reached makes
    // its rail station tappable), go back to Cards, remove the only card there, then
    // return to Context directly via the rail — bypassing the Cards→Context Continue
    // gate the same way a player revisiting an earlier choice would.
    const user = userEvent.setup();
    render(<App />);
    await openStackBuilder(user);
    await addCardToStack(user, "opt", "Opt");
    await advanceToContextEnrichmentFromZones(user);

    await user.click(screen.getByRole("button", { name: "Back to zones" }));
    await user.click(screen.getByRole("button", { name: "Card actions for Opt" }));
    await user.click(screen.getByRole("button", { name: "Remove from the Stack" }));
    await user.click(screen.getByRole("button", { name: "Station 4: Context" }));

    const decryptButton = screen.getByRole("button", { name: "Decrypt Stack" });
    expect(decryptButton).toBeDisabled();
    expect(screen.getByText("Add at least one card by searching or scanning before decrypting.")).toBeInTheDocument();

    await user.click(decryptButton);
    expect(submittedAskAiRequests).toHaveLength(0);
  });

  it("hides cat wizard image by default on game-context render", () => {
    render(<App />);
    expect(screen.queryByRole("img", { name: "Cat wizard" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Game context" })).toBeInTheDocument();
  });

  it("reveals cat wizard image after exactly 10 brand clicks, not before", async () => {
    const user = userEvent.setup();
    render(<App />);

    const brandButton = screen.getByRole("button", { name: "TheJudge" });
    for (let i = 0; i < 9; i++) {
      await user.click(brandButton);
    }
    expect(screen.queryByRole("img", { name: "Cat wizard" })).not.toBeInTheDocument();

    await user.click(brandButton);
    const emptyStateImage = screen.getByRole("img", { name: "Cat wizard" });
    expect(emptyStateImage).toHaveAttribute("src", "/assets/cats-homescreen.png");
  });

  it("shows cat wizard text fallback when image fails after easter egg reveal", async () => {
    const user = userEvent.setup();
    render(<App />);

    const brandButton = screen.getByRole("button", { name: "TheJudge" });
    for (let i = 0; i < 10; i++) {
      await user.click(brandButton);
    }

    const emptyStateImage = screen.getByRole("img", { name: "Cat wizard" });
    fireEvent.error(emptyStateImage);
    expect(screen.getByText("Cat wizard")).toBeInTheDocument();
  });

  it("shows zone cards in enrichment step, one sheet at a time, in add order", async () => {
    const user = userEvent.setup();
    render(<App />);
    await openStackBuilder(user);

    await addCardToStack(user, "opt", "Opt");
    await addCardToStack(user, "cou", "Counterspell");

    expect(screen.getByRole("button", { name: "Zone tab: Stack" })).toHaveTextContent("Stack (2)");

    await advanceToContextEnrichmentFromZones(user);
    expect(screen.getByText("Card 1 of 2")).toBeInTheDocument();
    expect(screen.getByLabelText("Caster for Opt")).toBeInTheDocument();
    expect(screen.queryByLabelText("Caster for Counterspell")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "OK — next card" }));
    expect(screen.getByText("Card 2 of 2")).toBeInTheDocument();
    expect(screen.queryByLabelText("Caster for Opt")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Caster for Counterspell")).toBeInTheDocument();
  });

  it("uses the image-first presentation and complete-row identity ring in the compact sheet", async () => {
    const user = userEvent.setup();
    render(<App />);
    await openStackBuilder(user);

    await addCardToStack(user, "lig", "Lightning Bolt");
    await advancePastZoneCollection(user);

    const image = screen.getByRole("img", { name: "Lightning Bolt" });
    expect(image).toHaveClass("h-auto", "w-full", "object-contain");

    const row = screen.getByLabelText("Caster for Lightning Bolt").closest("li");
    expect(row).toHaveClass("enrichment-card-row", "card-identity-ring");
    expect(row).toHaveStyle("--card-identity-ring: rgb(239 68 68 / 0.55)");

    const header = image.closest(".enrichment-card-header");
    expect(header).not.toBeNull();
    expect(within(header as HTMLElement).queryByText("Lightning Bolt")).not.toBeInTheDocument();
    expect(within(header as HTMLElement).queryByText("Stack")).not.toBeInTheDocument();
    expect(within(header as HTMLElement).queryByText("Lightning Bolt deals 3 damage to any target.")).not.toBeInTheDocument();

    await user.click(
      within(header as HTMLElement).getByRole("button", {
        name: "Show details for Lightning Bolt"
      })
    );
    // DEC-158: the popup is portaled to <body>, so it is never bound by the enrichment card
    // header it was opened from — the header itself still shows no duplicated detail.
    expect(within(header as HTMLElement).queryByTestId("card-detail-popup")).not.toBeInTheDocument();
    expect(within(header as HTMLElement).queryByText("Lightning Bolt")).not.toBeInTheDocument();
    const detailPopup = screen.getByTestId("card-detail-popup");
    expect(within(detailPopup).getByText("Lightning Bolt")).toBeInTheDocument();
    await waitFor(() =>
      expect(within(detailPopup).getByText("Lightning Bolt deals 3 damage to any target.")).toBeInTheDocument()
    );

    await user.click(
      screen.getByRole("button", { name: "Close details for Lightning Bolt" })
    );

    expect(within(row as HTMLElement).getByLabelText("Caster for Lightning Bolt")).toBeInTheDocument();
    expect(within(row as HTMLElement).getByLabelText("Mana spent for Lightning Bolt")).toBeInTheDocument();
    expect(within(row as HTMLElement).getByLabelText("Add a target for Lightning Bolt")).toBeInTheDocument();
    await user.click(within(row as HTMLElement).getByRole("button", { name: "Add a note for Lightning Bolt" }));
    expect(within(row as HTMLElement).getByLabelText("Context notes for Lightning Bolt")).toBeInTheDocument();
  });

  it("uses the same shared name-only fallback on the compact sheet after an image error (D3)", async () => {
    const user = userEvent.setup();
    render(<App />);
    await openStackBuilder(user);

    await addCardToStack(user, "lig", "Lightning Bolt");
    await advanceToContextEnrichmentFromZones(user);

    const image = screen.getByRole("img", { name: "Lightning Bolt" });
    expect(image).toHaveClass("h-auto", "w-full", "object-contain");

    const row = screen.getByLabelText("Caster for Lightning Bolt").closest("li");

    fireEvent.error(image);

    const fallback = within(row as HTMLElement).getByTestId("card-presentation-fallback");
    expect(fallback).toHaveClass("w-full");
    expect(within(fallback).getByText("Lightning Bolt")).toBeInTheDocument();
    // D3: the fallback shows the card name only — no descriptive fields, no detail fetch.
    expect(within(fallback).queryByText("Instant")).not.toBeInTheDocument();
    expect(within(fallback).queryByText("Lightning Bolt deals 3 damage to any target.")).not.toBeInTheDocument();
  });

  it("shows only the card name in the empty-image enrichment fallback, with no descriptive fields (D3)", async () => {
    setMetadataFixture(baseCardMetadataFixture.map((card) =>
      card.cardId === "opt"
        ? {
            ...card,
            manaValue: 0,
            supertypes: ["Legendary"],
            subtypes: ["Wizard"]
          }
        : card
    ));
    const user = userEvent.setup();
    render(<App />);
    await openStackBuilder(user);

    await addCardToStack(user, "opt", "Opt");
    await advanceToContextEnrichmentFromZones(user);

    const row = screen.getByLabelText("Caster for Opt").closest("li");
    const fallback = within(row as HTMLElement).getByTestId("card-presentation-fallback");
    expect(screen.queryByRole("img", { name: "Opt" })).not.toBeInTheDocument();
    expect(fallback).toHaveClass("w-full");
    expect(within(fallback).getByText("Opt")).toBeInTheDocument();
    expect(within(fallback).queryByText("Instant")).not.toBeInTheDocument();
    expect(within(fallback).queryByText("Scry 1, then draw a card.")).not.toBeInTheDocument();
    expect(within(fallback).queryByText("Legendary")).not.toBeInTheDocument();
    expect(row).toHaveClass("card-identity-ring");
    expect(row).toHaveStyle("--card-identity-ring: rgb(14 165 233 / 0.55)");
  });

  it("walks zone cards in enrichment order (bottom-to-top), one sheet at a time", async () => {
    // REQ-017/REQ-056 (amended): the former "View all cards" list mode and its 4-row
    // scroll cap are retired along with per-card removal in this step (REQ-209's shelf
    // card menu owns removal now) — this walks the compact-sheet order instead.
    const user = userEvent.setup();
    render(<App />);
    await openStackBuilder(user);

    await addCardToStack(user, "opt", "Opt");
    await addCardToStack(user, "lig", "Lightning Bolt");

    await advanceToContextEnrichmentFromZones(user);

    expect(screen.getByText("Card 1 of 2")).toBeInTheDocument();
    expect(screen.getByLabelText("Caster for Opt")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "OK — next card" }));
    expect(screen.getByText("Card 2 of 2")).toBeInTheDocument();
    expect(screen.getByLabelText("Caster for Lightning Bolt")).toBeInTheDocument();
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
    setMetadataFixture(manyCards);
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
    for (let index = 0; index < 10; index += 1) {
      expect(screen.getByText(`Card ${index + 1} of 10`)).toBeInTheDocument();
      expect(screen.getByLabelText(`Caster for ${manyCards[index].name}`)).toBeInTheDocument();
      if (index < 9) {
        await user.click(screen.getByRole("button", { name: "OK — next card" }));
      }
    }
    // Outlier test: fills the whole 10-card stack through the UI (~10 sequential
    // userEvent add flows), far more than any sibling. It runs ~1.5s locally but
    // crosses the default 5000ms testTimeout on slower/contended CI runners, so it
    // gets explicit headroom.
  }, 20000);
});
});
