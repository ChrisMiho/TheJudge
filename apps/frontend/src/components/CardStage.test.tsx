import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CardStage } from "./CardStage";

afterEach(cleanup);

function card(cardId: string, name: string) {
  return { cardId, name, imageUrl: `https://img.example/${cardId}.jpg` };
}

describe("Frontend - CardStage (REQ-206)", () => {
  it("renders nothing with no cards attached", () => {
    const { container } = render(<CardStage cards={[]} cap={10} onRemove={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the front card full size with no neighbours or arrows for a single card", () => {
    render(<CardStage cards={[card("urza", "Urza, Lord High Artificer")]} cap={10} onRemove={vi.fn()} />);

    expect(screen.getByRole("img", { name: "Urza, Lord High Artificer" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Previous card" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Next card" })).not.toBeInTheDocument();
    // one card: no ring to turn, so no dots either — only the accessible position
    expect(screen.getByTestId("card-stage-count")).toHaveAccessibleName("Card 1 of 1");
    expect(screen.getByTestId("card-stage-count").querySelectorAll("span")).toHaveLength(0);
  });

  it("peeks a neighbour on each side with three or more cards attached", () => {
    render(
      <CardStage
        cards={[card("a", "Alpha"), card("b", "Bravo"), card("c", "Charlie")]}
        cap={10}
        onRemove={vi.fn()}
      />
    );

    expect(screen.getByRole("img", { name: "Alpha" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show Charlie on the stage" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show Bravo on the stage" })).toBeInTheDocument();
    // position dots replace the old `n / cap` pill (REQ-206): one per card, the front card's lit
    const dots = screen.getByTestId("card-stage-count");
    expect(dots).toHaveAccessibleName("Card 1 of 3");
    expect(dots.querySelectorAll("span[data-on]")).toHaveLength(3);
    expect(dots.querySelector('span[data-on="true"]')).toBe(dots.querySelectorAll("span[data-on]")[0]);
    expect(dots).not.toHaveTextContent("10");
  });

  it("turns the ring on a tap of a neighbour", async () => {
    const user = userEvent.setup();
    render(
      <CardStage
        cards={[card("a", "Alpha"), card("b", "Bravo"), card("c", "Charlie")]}
        cap={10}
        onRemove={vi.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: "Show Bravo on the stage" }));
    expect(screen.getByRole("img", { name: "Bravo" })).toBeInTheDocument();
    // the lit dot follows the front card
    expect(screen.getByTestId("card-stage-count")).toHaveAccessibleName("Card 2 of 3");
    expect(screen.getByTestId("card-stage-count").querySelectorAll("span[data-on]")[1]).toHaveAttribute("data-on", "true");
  });

  it("turns the ring to a card as it is added, as the mockup does", () => {
    const { rerender } = render(<CardStage cards={[card("a", "Alpha")]} cap={10} onRemove={vi.fn()} />);
    rerender(<CardStage cards={[card("a", "Alpha"), card("b", "Bravo")]} cap={10} onRemove={vi.fn()} />);

    expect(screen.getByTestId("card-stage-count")).toHaveAccessibleName("Card 2 of 2");
    expect(screen.getByRole("button", { name: "Remove Bravo" })).toBeInTheDocument();
  });

  it("places cards by their signed distance from the front card and renders only the three on stage", () => {
    const { container } = render(
      <CardStage
        cards={[card("a", "A"), card("b", "B"), card("c", "C"), card("d", "D"), card("e", "E")]}
        cap={10}
        onRemove={vi.fn()}
      />
    );

    const placed = Array.from(container.querySelectorAll<HTMLElement>(".ring .card"));
    expect(placed).toHaveLength(3);
    expect(placed.map((el) => el.style.getPropertyValue("--d")).sort()).toEqual(["-1", "0", "1"]);
    expect(container.querySelectorAll('.card[data-front="true"]')).toHaveLength(1);
  });

  it("peeks the one other card only once with exactly two cards attached, never on both sides", () => {
    render(<CardStage cards={[card("a", "Alpha"), card("b", "Bravo")]} cap={10} onRemove={vi.fn()} />);

    expect(screen.getAllByRole("img", { name: "Bravo" })).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Show Bravo on the stage" })).toBeInTheDocument();
  });

  it("turns the ring with the arrows, wrapping at the ends", async () => {
    const user = userEvent.setup();
    render(<CardStage cards={[card("a", "Alpha"), card("b", "Bravo")]} cap={10} onRemove={vi.fn()} />);

    expect(screen.getByRole("img", { name: "Alpha" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Previous card" }));
    expect(screen.getByRole("img", { name: "Bravo" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Next card" }));
    expect(screen.getByRole("img", { name: "Alpha" })).toBeInTheDocument();
  });

  it("calls onRemove for the front card from the straddling ✕ control", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(<CardStage cards={[card("urza", "Urza, Lord High Artificer")]} cap={10} onRemove={onRemove} />);

    await user.click(screen.getByRole("button", { name: "Remove Urza, Lord High Artificer" }));
    expect(onRemove).toHaveBeenCalledWith("urza");
  });

  it("opens the card detail popup from the straddling ⓘ control", async () => {
    const user = userEvent.setup();
    render(<CardStage cards={[card("urza", "Urza, Lord High Artificer")]} cap={10} onRemove={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Show details for Urza, Lord High Artificer" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
