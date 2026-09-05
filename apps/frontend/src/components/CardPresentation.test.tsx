import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearCardDetailCache, type CardDetailBlock } from "../lib/cardDetail";
import { CardDetailPopup, CardPresentation, type CardPresentationCard } from "./CardPresentation";

const URZA_DETAIL: CardDetailBlock = {
  oracleText: "When Urza enters, create a Construct artifact creature token.",
  manaCost: "{2}{U}{U}",
  manaValue: 0,
  typeLine: "Legendary Creature — Human Artificer",
  colors: ["U", "W"],
  supertypes: ["Legendary"],
  subtypes: ["Human", "Artificer"]
};

function makeCard(overrides: Partial<CardPresentationCard> = {}): CardPresentationCard {
  return {
    cardId: "urza",
    name: "Urza, Lord High Artificer",
    imageUrl: "https://img.example/urza.jpg",
    ...overrides
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" }
  });
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  clearCardDetailCache();
  fetchMock = vi.fn().mockResolvedValue(jsonResponse(URZA_DETAIL));
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  clearCardDetailCache();
});

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
    expect(fetchMock).not.toHaveBeenCalled();
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

  it("opens a detail popup that fetches its descriptive block by oracle id and closes via the X control, without unmounting the image", async () => {
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
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/api/cards/urza"));

    await waitFor(() =>
      expect(
        screen.getByText("When Urza enters, create a Construct artifact creature token.")
      ).toBeInTheDocument()
    );
    expect(screen.getByText("{2}{U}{U}")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close details for Urza, Lord High Artificer" }));

    expect(screen.queryByTestId("card-detail-popup")).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Urza, Lord High Artificer" })).toBeInTheDocument();
  });

  it("shows a quiet loading state confined to the popup content region while the fetch is pending (A10)", async () => {
    let resolveFetch!: (response: Response) => void;
    fetchMock.mockReturnValue(new Promise<Response>((resolve) => { resolveFetch = resolve; }));
    const user = userEvent.setup();
    render(<CardPresentation card={makeCard()} />);

    await user.click(screen.getByRole("button", { name: "Show details for Urza, Lord High Artificer" }));

    // Name/image/ring (already local) stay rendered while the descriptive block loads.
    expect(screen.getByRole("img", { name: "Urza, Lord High Artificer" })).toBeInTheDocument();
    const popup = screen.getByTestId("card-detail-popup");
    expect(within(popup).getByText("Urza, Lord High Artificer")).toBeInTheDocument();
    expect(within(popup).getByTestId("card-detail-loading")).toBeInTheDocument();

    resolveFetch(jsonResponse(URZA_DETAIL));
    await waitFor(() => expect(within(popup).queryByTestId("card-detail-loading")).not.toBeInTheDocument());
    expect(within(popup).getByText("{2}{U}{U}")).toBeInTheDocument();
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

  it("caches a card's detail for the session: reopening the same card issues no second fetch (A5)", async () => {
    const user = userEvent.setup();
    render(<CardPresentation card={makeCard()} />);

    const trigger = screen.getByRole("button", { name: "Show details for Urza, Lord High Artificer" });
    await user.click(trigger);
    await waitFor(() =>
      expect(
        screen.getByText("When Urza enters, create a Construct artifact creature token.")
      ).toBeInTheDocument()
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Close details for Urza, Lord High Artificer" }));
    await user.click(trigger);

    // Cache hit: the descriptive block renders immediately with no loading flash and no
    // second network call.
    expect(screen.queryByTestId("card-detail-loading")).not.toBeInTheDocument();
    expect(
      screen.getByText("When Urza enters, create a Construct artifact creature token.")
    ).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("degrades to the local identity plus a retry affordance on a failed/offline fetch, without blocking other controls (A11)", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    const user = userEvent.setup();
    render(
      <CardPresentation
        card={makeCard()}
        actions={<button type="button">Remove</button>}
      />
    );

    await user.click(screen.getByRole("button", { name: "Show details for Urza, Lord High Artificer" }));

    await waitFor(() => expect(screen.getByTestId("card-detail-error")).toBeInTheDocument());
    expect(screen.getByText("Urza, Lord High Artificer")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove" })).toBeEnabled();

    fetchMock.mockResolvedValue(jsonResponse(URZA_DETAIL));
    await user.click(screen.getByRole("button", { name: "Retry" }));

    await waitFor(() =>
      expect(
        screen.getByText("When Urza enters, create a Construct artifact creature token.")
      ).toBeInTheDocument()
    );
  });

  it("renders the not-found response as the empty-detail marker with no retry loop (REQ-175)", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: "card_not_found" }, 404));
    const user = userEvent.setup();
    render(<CardPresentation card={makeCard()} />);

    await user.click(screen.getByRole("button", { name: "Show details for Urza, Lord High Artificer" }));

    await waitFor(() => expect(screen.queryByTestId("card-detail-loading")).not.toBeInTheDocument());
    expect(screen.queryByTestId("card-detail-error")).not.toBeInTheDocument();
    expect(screen.getByText("Urza, Lord High Artificer")).toBeInTheDocument();
  });

  it("renders the full-width name-only fallback without mounting an image for an empty URL, issuing no fetch", () => {
    render(
      <CardPresentation
        card={makeCard({ imageUrl: "" })}
        actions={<button type="button">Remove</button>}
      />
    );

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    const fallback = screen.getByTestId("card-presentation-fallback");
    expect(fallback).toHaveClass("w-full");
    expect(within(fallback).getByText("Urza, Lord High Artificer")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /show details for/i })).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("replaces a failed image with the name-only fallback, issuing no detail fetch (D3, DEC-078)", () => {
    render(
      <CardPresentation
        card={makeCard()}
        actions={<button type="button">Remove</button>}
      />
    );

    fireEvent.error(screen.getByRole("img"));

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    const fallback = screen.getByTestId("card-presentation-fallback");
    expect(fallback).toHaveClass("motion-error");
    expect(within(fallback).getByText("Urza, Lord High Artificer")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /show details for/i })).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("clears an image error when the source changes", () => {
    const { rerender } = render(<CardPresentation card={makeCard()} />);
    fireEvent.error(screen.getByRole("img"));

    rerender(<CardPresentation card={makeCard({ imageUrl: "https://img.example/urza-2.jpg" })} />);

    expect(screen.getByRole("img")).toHaveAttribute("src", "https://img.example/urza-2.jpg");
  });
});

describe("CardDetailPopup", () => {
  it("shows every present descriptive field once fetched, including zero mana value", async () => {
    render(<CardDetailPopup card={makeCard()} onClose={vi.fn()} />);

    await waitFor(() => expect(screen.getByText("{2}{U}{U}")).toBeInTheDocument());
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText("Legendary Creature — Human Artificer")).toBeInTheDocument();
    expect(screen.getByText("When Urza enters, create a Construct artifact creature token.")).toBeInTheDocument();
    expect(screen.getByText("U, W")).toBeInTheDocument();
    expect(screen.getByText("Legendary")).toBeInTheDocument();
    expect(screen.getByText("Human, Artificer")).toBeInTheDocument();
  });

  it("omits absent optional fields instead of inventing values", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        oracleText: "",
        manaCost: "",
        manaValue: 0,
        typeLine: "",
        colors: [],
        supertypes: [],
        subtypes: []
      })
    );
    render(<CardDetailPopup card={makeCard()} onClose={vi.fn()} />);

    await waitFor(() => expect(screen.queryByTestId("card-detail-loading")).not.toBeInTheDocument());

    expect(screen.queryByText("Mana cost")).not.toBeInTheDocument();
    expect(screen.queryByText("Type")).not.toBeInTheDocument();
    expect(screen.queryByText("Oracle text")).not.toBeInTheDocument();
    expect(screen.queryByText("Colors")).not.toBeInTheDocument();
    expect(screen.queryByText("Supertypes")).not.toBeInTheDocument();
    expect(screen.queryByText("Subtypes")).not.toBeInTheDocument();
    expect(screen.queryByText("N/A")).not.toBeInTheDocument();
  });
});
});
