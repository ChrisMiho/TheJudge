import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
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
  it("renders an uncropped container-relative card image with its source, meaningful alt, and a corner detail control", () => {
    render(
      <CardPresentation
        card={makeCard()}
        actions={<button type="button">Remove</button>}
      />
    );

    const image = screen.getByRole("img", { name: "Urza, Lord High Artificer" });
    expect(image).toHaveAttribute("src", "https://img.example/urza.jpg");
    // DEC-160: one shared width/container-relative rule. `w-full` makes the host container
    // decide the size, `h-auto` + `object-contain` keep it uncropped and aspect-preserving.
    expect(image).toHaveClass("h-auto", "w-full", "object-contain");
    expect(screen.getByRole("button", { name: "Remove" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Show details for Urza, Lord High Artificer" })
    ).toHaveAttribute("aria-expanded", "false");
  });

  it("carries no fixed pixel height cap and no per-surface size variant", () => {
    const { container } = render(<CardPresentation card={makeCard()} />);

    const image = screen.getByRole("img", { name: "Urza, Lord High Artificer" });
    // The superseded rule rendered an identical 92x128px image on every surface and at every
    // viewport width (DEC-160). Nothing may reintroduce that ceiling here or at a call site.
    expect(image.className).not.toMatch(/max-h-/);
    expect(image.className).not.toMatch(/\bw-auto\b/);
    // The image's own box must not shrink-wrap; its container is what sizes it.
    expect(image.parentElement?.className).not.toMatch(/\bw-fit\b/);
    expect(image.parentElement).toHaveClass("w-full");
    expect(container.querySelector("[data-card-size-variant]")).toBeNull();
  });

  it("lets a host container's width decide the rendered size without a component prop", () => {
    const { rerender } = render(
      <div style={{ width: "160px" }}>
        <CardPresentation card={makeCard()} />
      </div>
    );
    const narrowClasses = screen.getByRole("img").className;

    rerender(
      <div style={{ width: "640px" }}>
        <CardPresentation card={makeCard()} />
      </div>
    );

    // Identical classes in both hosts: the difference is the container, never a variant.
    expect(screen.getByRole("img").className).toBe(narrowClasses);
  });

  it("opens a detail popup with oracle text and closes it via the X control, without unmounting the image", async () => {
    const user = userEvent.setup();
    render(
      <CardPresentation
        card={makeCard()}
        actions={<button type="button">Remove</button>}
      />
    );

    await user.click(
      screen.getByRole("button", { name: "Show details for Urza, Lord High Artificer" })
    );

    // Image stays mounted while the popup is open (DEC-151: the popup adds detail, it never
    // replaces the card image).
    expect(screen.getByRole("img", { name: "Urza, Lord High Artificer" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Show details for Urza, Lord High Artificer" })
    ).toHaveAttribute("aria-expanded", "true");

    const popup = screen.getByTestId("card-detail-popup");
    expect(popup).toBeInTheDocument();
    expect(screen.getByText("When Urza enters, create a Construct artifact creature token.")).toBeInTheDocument();
    expect(screen.getByText("{2}{U}{U}")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close details for Urza, Lord High Artificer" }));

    expect(screen.queryByTestId("card-detail-popup")).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Urza, Lord High Artificer" })).toBeInTheDocument();
  });

  it("hosts the detail popup in a body portal outside the card image container", async () => {
    const user = userEvent.setup();
    const { container } = render(<CardPresentation card={makeCard()} />);

    await user.click(screen.getByRole("button", { name: "Show details for Urza, Lord High Artificer" }));

    const overlay = screen.getByTestId("card-detail-overlay");
    const popup = screen.getByTestId("card-detail-popup");
    const image = screen.getByRole("img", { name: "Urza, Lord High Artificer" });

    // DEC-158/screen-layout.md "Card detail popup": the dialog is no longer `absolute inset-0`
    // inside the 92x128px image box — it is a portal child of <body>, so its geometry is its
    // own rather than the image's.
    expect(overlay.parentElement).toBe(document.body);
    expect(container.contains(popup)).toBe(false);
    expect(image.closest("[data-testid='card-detail-popup']")).toBeNull();
    expect(popup.parentElement).toBe(overlay);
  });

  it("renders the popup as the overlay-family bottom sheet / side panel surface rather than an image-bound box", async () => {
    const user = userEvent.setup();
    render(<CardPresentation card={makeCard()} />);

    await user.click(screen.getByRole("button", { name: "Show details for Urza, Lord High Artificer" }));

    const overlay = screen.getByTestId("card-detail-overlay");
    const popup = screen.getByTestId("card-detail-popup");

    // The responsive bottom-sheet / side-panel geometry lives in index.css on these classes,
    // matching the AdaptiveContextDialog composition the catalog points at.
    expect(overlay).toHaveClass("card-detail-overlay");
    expect(popup).toHaveClass("card-detail-surface");
    expect(popup).not.toHaveClass("absolute", "inset-0");
    expect(popup).toHaveAttribute("role", "dialog");
    expect(popup).toHaveAttribute("aria-modal", "true");
  });

  it("closes the detail popup on Escape and restores focus to the trigger", async () => {
    const user = userEvent.setup();
    render(<CardPresentation card={makeCard()} />);

    const trigger = screen.getByRole("button", { name: "Show details for Urza, Lord High Artificer" });
    await user.click(trigger);
    expect(screen.getByTestId("card-detail-popup")).toBeInTheDocument();

    await user.keyboard("{Escape}");

    expect(screen.queryByTestId("card-detail-popup")).not.toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveFocus();
  });

  it("closes the detail popup on an outside interaction but not on an inside one", async () => {
    const user = userEvent.setup();
    render(<CardPresentation card={makeCard()} />);

    const trigger = screen.getByRole("button", { name: "Show details for Urza, Lord High Artificer" });
    await user.click(trigger);

    fireEvent.mouseDown(screen.getByText("Urza, Lord High Artificer", { selector: "p" }));
    expect(screen.getByTestId("card-detail-popup")).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByTestId("card-detail-overlay"));

    expect(screen.queryByTestId("card-detail-popup")).not.toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("removes the portal host from the document when the card presentation unmounts while open", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<CardPresentation card={makeCard()} />);

    await user.click(screen.getByRole("button", { name: "Show details for Urza, Lord High Artificer" }));
    expect(document.body.querySelector("[data-testid='card-detail-overlay']")).not.toBeNull();

    unmount();

    expect(document.body.querySelector("[data-testid='card-detail-overlay']")).toBeNull();
    expect(document.body.querySelector("[data-testid='card-detail-popup']")).toBeNull();
  });

  it("populates the popup only from the passed card, issuing no network request", async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    render(<CardPresentation card={makeCard()} />);

    await user.click(screen.getByRole("button", { name: "Show details for Urza, Lord High Artificer" }));

    const popup = screen.getByTestId("card-detail-popup");
    expect(within(popup).getByText("{2}{U}{U}")).toBeInTheDocument();
    expect(within(popup).getByText("Legendary Creature — Human Artificer")).toBeInTheDocument();
    expect(
      within(popup).getByText("When Urza enters, create a Construct artifact creature token.")
    ).toBeInTheDocument();
    expect(within(popup).getByText("U, W")).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();

    fetchSpy.mockRestore();
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
    expect(screen.queryByRole("button", { name: /show details for/i })).not.toBeInTheDocument();
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
    expect(screen.queryByRole("button", { name: /show details for/i })).not.toBeInTheDocument();
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
