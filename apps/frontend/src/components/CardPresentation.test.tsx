import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearCardDetailCache, type CardDetailBlock } from "../lib/cardDetail";
import { clearCardPrintingsCache, peekCardPrintings } from "../lib/trade/fetchCardPrintings";
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
  clearCardPrintingsCache();
  // Look-matching pass (slice L): a fresh `Response` per call, not one shared
  // instance (`mockResolvedValue` would resolve to the exact same object for
  // every call) — the detail fetch and the new price fetch each read their
  // own `.json()` body, and a `Response` body stream can only be read once.
  fetchMock = vi.fn().mockImplementation(() => Promise.resolve(jsonResponse(URZA_DETAIL)));
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  clearCardDetailCache();
  clearCardPrintingsCache();
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

    const overlay = screen.getByTestId("card-detail-popup-overlay");
    const popup = screen.getByTestId("card-detail-popup");
    const image = screen.getByRole("img", { name: "Urza, Lord High Artificer" });

    // DEC-158/REQ-208/screen-layout.md "Card detail popup": the dialog is no longer
    // `absolute inset-0` inside the 92x128px image box — it is a portal child of <body> via
    // the shared SheetShell, so its geometry is its own rather than the image's.
    expect(overlay.parentElement).toBe(document.body);
    expect(container.contains(popup)).toBe(false);
    expect(image.closest("[data-testid='card-detail-popup']")).toBeNull();
    expect(popup.parentElement).toBe(document.body);
  });

  it("renders the popup on the shared sheet shell — a bottom sheet below 600px, centred on desktop (REQ-128) — rather than an image-bound box", async () => {
    const user = userEvent.setup();
    render(<CardPresentation card={makeCard()} />);

    await user.click(screen.getByRole("button", { name: "Show details for Urza, Lord High Artificer" }));

    const overlay = screen.getByTestId("card-detail-popup-overlay");
    const popup = screen.getByTestId("card-detail-popup");

    // The responsive bottom-sheet / centred-desktop-card geometry lives in shell.css on
    // these shared classes (REQ-208): `.sheet-backdrop` behind an `aside.drawer-panel.detail-panel`.
    expect(overlay).toHaveClass("sheet-backdrop");
    expect(popup).toHaveClass("drawer-panel", "detail-panel");
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

    // Look-matching pass (slice L): once loaded, the name renders inside the
    // hero's <h3> (card-detail-hero-name), not the old <p> head title — any
    // element with this exact text is an "inside" click either way.
    fireEvent.mouseDown(screen.getByText("Urza, Lord High Artificer"));
    expect(screen.getByTestId("card-detail-popup")).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByTestId("card-detail-popup-overlay"));

    expect(screen.queryByTestId("card-detail-popup")).not.toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("removes the portal host from the document when the card presentation unmounts while open", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<CardPresentation card={makeCard()} />);

    await user.click(screen.getByRole("button", { name: "Show details for Urza, Lord High Artificer" }));
    expect(document.body.querySelector("[data-testid='card-detail-popup-overlay']")).not.toBeNull();

    unmount();

    expect(document.body.querySelector("[data-testid='card-detail-popup-overlay']")).toBeNull();
    expect(document.body.querySelector("[data-testid='card-detail-popup']")).toBeNull();
  });

  it("caches a card's detail (and its price, slice L) for the session: reopening the same card issues no second fetch (A5)", async () => {
    const user = userEvent.setup();
    render(<CardPresentation card={makeCard()} />);

    const trigger = screen.getByRole("button", { name: "Show details for Urza, Lord High Artificer" });
    await user.click(trigger);
    await waitFor(() =>
      expect(
        screen.getByText("When Urza enters, create a Construct artifact creature token.")
      ).toBeInTheDocument()
    );
    // Two independently cached fetches: the oracle-id detail block (REQ-175) and
    // the look-matching pass's price lookup (same `/prices` endpoint Trade
    // Balancer/the card scanner already call). `fetchMock` records a call the
    // instant `fetch()` is invoked, not when its promise settles, so waiting on
    // the call count alone races the price cache's own write — wait on the
    // cache itself (module state) instead.
    await waitFor(() => expect(peekCardPrintings("urza")).not.toBeUndefined());
    expect(fetchMock).toHaveBeenCalledTimes(2);

    await user.click(screen.getByRole("button", { name: "Close details for Urza, Lord High Artificer" }));
    await user.click(trigger);

    // Cache hit: the descriptive block renders immediately with no loading flash and no
    // second network call, for either fetch.
    expect(screen.queryByTestId("card-detail-loading")).not.toBeInTheDocument();
    expect(
      screen.getByText("When Urza enters, create a Construct artifact creature token.")
    ).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
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

    fetchMock.mockImplementation(() => Promise.resolve(jsonResponse(URZA_DETAIL)));
    await user.click(screen.getByRole("button", { name: "Retry" }));

    await waitFor(() =>
      expect(
        screen.getByText("When Urza enters, create a Construct artifact creature token.")
      ).toBeInTheDocument()
    );
  });

  it("renders the not-found response as the empty-detail marker with no retry loop (REQ-175)", async () => {
    fetchMock.mockImplementation(() => Promise.resolve(jsonResponse({ error: "card_not_found" }, 404)));
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
    // Look-matching pass (slice L, requirement #10): colours render as the
    // typeline's colour dot (see the dedicated describe block below), not as
    // "U, W" text; supertypes are dropped — "Legendary" already reads from
    // the typeline string above, so a separate Supertypes fact would repeat
    // it. Subtypes keep their own fact chip.
    expect(screen.getByText("Human, Artificer")).toBeInTheDocument();
    // The new price fact chip (no price in this fixture's response — the shared
    // fetch mock returns the oracle-detail shape for every call, which carries
    // no `printings`) shows its "—" placeholder rather than inventing a value.
    expect(screen.getByText("Price")).toBeInTheDocument();
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("renders the colour-identity dot from the same source the card tile's own ring reads", async () => {
    render(<CardDetailPopup card={makeCard()} onClose={vi.fn()} />);

    await waitFor(() => expect(screen.getByText("{2}{U}{U}")).toBeInTheDocument());
    const typeline = screen.getByText("Legendary Creature — Human Artificer").closest(".typeline");
    const dot = typeline?.querySelector(".pips i");
    expect(dot).not.toBeNull();
    // U + W, two colours: getCardIdentityRing returns a linear-gradient, not a flat colour.
    expect((dot as HTMLElement).style.background).toMatch(/linear-gradient/);
  });

  it("shows the art-crop image, not the normal-size image, in the hero", async () => {
    const scryfallUrl = "https://cards.scryfall.io/normal/front/0/2/urza.jpg";
    render(<CardDetailPopup card={makeCard({ imageUrl: scryfallUrl })} onClose={vi.fn()} />);

    await waitFor(() => expect(screen.getByText("{2}{U}{U}")).toBeInTheDocument());
    const hero = document.querySelector(".detail-panel .art img");
    expect(hero).toHaveAttribute("src", "https://cards.scryfall.io/art_crop/front/0/2/urza.jpg");
  });

  it("omits absent optional fields instead of inventing values", async () => {
    fetchMock.mockImplementation(() =>
      Promise.resolve(
        jsonResponse({
          oracleText: "",
          manaCost: "",
          manaValue: 0,
          typeLine: "",
          colors: [],
          supertypes: [],
          subtypes: []
        })
      )
    );
    render(<CardDetailPopup card={makeCard()} onClose={vi.fn()} />);

    await waitFor(() => expect(screen.queryByTestId("card-detail-loading")).not.toBeInTheDocument());

    expect(screen.queryByText("Mana cost")).not.toBeInTheDocument();
    expect(screen.queryByText("Type")).not.toBeInTheDocument();
    expect(screen.queryByText("Oracle text")).not.toBeInTheDocument();
    expect(screen.queryByText("Colors")).not.toBeInTheDocument();
    // Supertypes is dropped entirely (see the main field-list test above) —
    // never shown, empty or not. Look-matching pass (slice L): Subtypes and
    // Price are now fixed fact chips (flow.css:280-317's `.detail-panel
    // .facts`), always present, so an absent value shows the suite's "—"
    // placeholder rather than being omitted — that is the non-inventing
    // behaviour this test guards, just expressed as a placeholder instead of
    // a hidden row.
    expect(screen.queryByText("Supertypes")).not.toBeInTheDocument();
    expect(screen.getByText("Subtypes")).toBeInTheDocument();
    expect(screen.queryByText("N/A")).not.toBeInTheDocument();
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });
});
});
