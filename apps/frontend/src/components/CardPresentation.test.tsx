import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import type { ZoneCardItem } from "../types";
import { CardPresentation } from "./CardPresentation";

afterEach(cleanup);

function makeCard(overrides: Partial<ZoneCardItem> = {}): ZoneCardItem {
  return {
    cardId: "urza",
    name: "Urza, Lord High Artificer",
    oracleText: "When Urza enters, create a Construct artifact creature token.",
    imageUrl: "https://img.example/urza.jpg",
    manaCost: "{2}{U}{U}",
    manaValue: 0,
    typeLine: "Legendary Creature — Human Artificer",
    colors: ["U", "W"],
    supertypes: ["Legendary"],
    subtypes: ["Human", "Artificer"],
    ...overrides
  };
}

describe("Frontend - MTG Assistant", () => {
describe("CardPresentation", () => {
  it("renders an uncropped centered card image at 80% width with its source and meaningful alt", () => {
    render(
      <CardPresentation
        card={makeCard()}
        actions={<button type="button">Remove</button>}
      />
    );

    const image = screen.getByRole("img", { name: "Urza, Lord High Artificer" });
    expect(image).toHaveAttribute("src", "https://img.example/urza.jpg");
    expect(image).toHaveClass("mx-auto", "w-4/5", "h-auto", "object-contain");
    expect(screen.getByRole("button", { name: "Remove" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Show card metadata for Urza, Lord High Artificer" })
    ).toHaveAttribute("aria-expanded", "false");
  });

  it("replaces the image with metadata and toggles back while keeping actions visible", async () => {
    const user = userEvent.setup();
    render(
      <CardPresentation
        card={makeCard()}
        actions={<button type="button">Remove</button>}
      />
    );

    await user.click(
      screen.getByRole("button", { name: "Show card metadata for Urza, Lord High Artificer" })
    );

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByTestId("card-presentation-fallback")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Show card image for Urza, Lord High Artificer" })
    ).toHaveAttribute("aria-expanded", "true");

    await user.click(
      screen.getByRole("button", { name: "Show card image for Urza, Lord High Artificer" })
    );

    expect(screen.getByRole("img", { name: "Urza, Lord High Artificer" })).toBeInTheDocument();
  });

  it("renders the full-width fallback without mounting an image for an empty URL", () => {
    render(
      <CardPresentation
        card={makeCard({ imageUrl: "" })}
        actions={<button type="button">Remove</button>}
      />
    );

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByTestId("card-presentation-fallback")).toHaveClass("w-full");
    expect(screen.getByRole("button", { name: "Remove" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /card (metadata|image)/i })).not.toBeInTheDocument();
  });

  it("replaces a failed image with the fallback", () => {
    render(
      <CardPresentation
        card={makeCard()}
        actions={<button type="button">Remove</button>}
      />
    );

    fireEvent.error(screen.getByRole("img"));

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByTestId("card-presentation-fallback")).toHaveClass("motion-error");
    expect(screen.getByRole("button", { name: "Remove" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /card (metadata|image)/i })).not.toBeInTheDocument();
  });

  it("clears an image error when the source changes", () => {
    const { rerender } = render(<CardPresentation card={makeCard()} />);
    fireEvent.error(screen.getByRole("img"));

    rerender(<CardPresentation card={makeCard({ imageUrl: "https://img.example/urza-2.jpg" })} />);

    expect(screen.getByRole("img")).toHaveAttribute("src", "https://img.example/urza-2.jpg");
  });

  it("renders every present fallback field, including zero mana value", () => {
    render(<CardPresentation card={makeCard({ imageUrl: undefined })} />);

    expect(screen.getByText("Urza, Lord High Artificer")).toBeInTheDocument();
    expect(screen.getByText("{2}{U}{U}")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText("Legendary Creature — Human Artificer")).toBeInTheDocument();
    expect(screen.getByText("When Urza enters, create a Construct artifact creature token.")).toBeInTheDocument();
    expect(screen.getByText("U, W")).toBeInTheDocument();
    expect(screen.getByText("Legendary")).toBeInTheDocument();
    expect(screen.getByText("Human, Artificer")).toBeInTheDocument();
  });

  it("omits absent optional fallback fields instead of inventing values", () => {
    render(
      <CardPresentation
        card={makeCard({
          imageUrl: " ",
          manaCost: "",
          manaValue: undefined,
          typeLine: " ",
          oracleText: "",
          colors: [],
          supertypes: undefined,
          subtypes: []
        })}
      />
    );

    expect(screen.getByText("Urza, Lord High Artificer")).toBeInTheDocument();
    expect(screen.queryByText("Mana cost")).not.toBeInTheDocument();
    expect(screen.queryByText("Mana value")).not.toBeInTheDocument();
    expect(screen.queryByText("Type")).not.toBeInTheDocument();
    expect(screen.queryByText("Oracle text")).not.toBeInTheDocument();
    expect(screen.queryByText("Colors")).not.toBeInTheDocument();
    expect(screen.queryByText("Supertypes")).not.toBeInTheDocument();
    expect(screen.queryByText("Subtypes")).not.toBeInTheDocument();
    expect(screen.queryByText("N/A")).not.toBeInTheDocument();
  });
});
});
