import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ZoneCardMenu } from "./ZoneCardMenu";
import type { ZoneCardItem } from "../types";

afterEach(() => {
  cleanup();
});

function makeCard(overrides: Partial<ZoneCardItem> = {}): ZoneCardItem {
  return { cardId: "opt", name: "Opt", imageUrl: "", colors: [], ...overrides };
}

describe("ZoneCardMenu", () => {
  it("renders nothing while closed", () => {
    render(
      <ZoneCardMenu
        isOpen={false}
        onClose={() => undefined}
        card={makeCard()}
        zoneId="stack"
        cardIndex={0}
        cardCount={1}
        onMoveTo={() => undefined}
        onReorder={() => undefined}
        onShowDetails={() => undefined}
        onRemove={() => undefined}
      />
    );
    expect(screen.queryByTestId("zone-card-menu")).not.toBeInTheDocument();
  });

  it("lists every other zone as a Move to pill, excluding the card's current zone", () => {
    render(
      <ZoneCardMenu
        isOpen
        onClose={() => undefined}
        card={makeCard()}
        zoneId="stack"
        cardIndex={0}
        cardCount={1}
        onMoveTo={() => undefined}
        onReorder={() => undefined}
        onShowDetails={() => undefined}
        onRemove={() => undefined}
      />
    );

    expect(screen.queryByRole("button", { name: "Stack" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Battlefield" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Hand" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Graveyard" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Exile" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Library" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Command Zone" })).toBeInTheDocument();
  });

  it("calls onMoveTo with the tapped zone", async () => {
    const user = userEvent.setup();
    const onMoveTo = vi.fn();
    render(
      <ZoneCardMenu
        isOpen
        onClose={() => undefined}
        card={makeCard()}
        zoneId="stack"
        cardIndex={0}
        cardCount={1}
        onMoveTo={onMoveTo}
        onReorder={() => undefined}
        onShowDetails={() => undefined}
        onRemove={() => undefined}
      />
    );

    await user.click(screen.getByRole("button", { name: "Battlefield" }));
    expect(onMoveTo).toHaveBeenCalledWith("battlefield");
  });

  it("shows Down/Up/To top order controls on the Stack with 2+ cards", () => {
    render(
      <ZoneCardMenu
        isOpen
        onClose={() => undefined}
        card={makeCard()}
        zoneId="stack"
        cardIndex={1}
        cardCount={3}
        onMoveTo={() => undefined}
        onReorder={() => undefined}
        onShowDetails={() => undefined}
        onRemove={() => undefined}
      />
    );

    expect(screen.getByRole("button", { name: "↓ Down" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "↑ Up" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "⤒ To top" })).toBeInTheDocument();
  });

  it("shows Left/Right order controls off the Stack, with no To top", () => {
    render(
      <ZoneCardMenu
        isOpen
        onClose={() => undefined}
        card={makeCard()}
        zoneId="battlefield"
        cardIndex={1}
        cardCount={2}
        onMoveTo={() => undefined}
        onReorder={() => undefined}
        onShowDetails={() => undefined}
        onRemove={() => undefined}
      />
    );

    expect(screen.getByRole("button", { name: "‹ Left" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Right ›" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "⤒ To top" })).not.toBeInTheDocument();
  });

  it("hides the order control entirely for a lone card", () => {
    render(
      <ZoneCardMenu
        isOpen
        onClose={() => undefined}
        card={makeCard()}
        zoneId="stack"
        cardIndex={0}
        cardCount={1}
        onMoveTo={() => undefined}
        onReorder={() => undefined}
        onShowDetails={() => undefined}
        onRemove={() => undefined}
      />
    );

    expect(screen.queryByRole("group", { name: "Reorder" })).not.toBeInTheDocument();
  });

  it("computes Down/Up/To top as the toIndexAfterRemoval contract", async () => {
    const user = userEvent.setup();
    const onReorder = vi.fn();
    render(
      <ZoneCardMenu
        isOpen
        onClose={() => undefined}
        card={makeCard()}
        zoneId="stack"
        cardIndex={1}
        cardCount={3}
        onMoveTo={() => undefined}
        onReorder={onReorder}
        onShowDetails={() => undefined}
        onRemove={() => undefined}
      />
    );

    await user.click(screen.getByRole("button", { name: "↓ Down" }));
    expect(onReorder).toHaveBeenLastCalledWith(0);
    await user.click(screen.getByRole("button", { name: "↑ Up" }));
    expect(onReorder).toHaveBeenLastCalledWith(2);
    await user.click(screen.getByRole("button", { name: "⤒ To top" }));
    expect(onReorder).toHaveBeenLastCalledWith(3);
  });

  it("names Card details and Remove from the <zone>, and calls through", async () => {
    const user = userEvent.setup();
    const onShowDetails = vi.fn();
    const onRemove = vi.fn();
    render(
      <ZoneCardMenu
        isOpen
        onClose={() => undefined}
        card={makeCard({ name: "Lightning Bolt" })}
        zoneId="graveyard"
        cardIndex={0}
        cardCount={1}
        onMoveTo={() => undefined}
        onReorder={() => undefined}
        onShowDetails={onShowDetails}
        onRemove={onRemove}
      />
    );

    await user.click(screen.getByRole("button", { name: "Card details" }));
    expect(onShowDetails).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Remove from the Graveyard" }));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });
});
