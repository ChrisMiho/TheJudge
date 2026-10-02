import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearCardDetailCache } from "../lib/cardDetail";
import { ScanReviewBubble, type ScanReviewEntry } from "./ScanReviewBubble";

// The corner detail popup fetches its descriptive block on demand (REQ-175, FLOW-024);
// stub a default response so opening it in these tests never hits the network.
beforeEach(() => {
  clearCardDetailCache();
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          oracleText: "Scry 1, then draw a card.",
          typeLine: "Instant",
          manaCost: "{U}",
          manaValue: 1,
          colors: ["U"],
          supertypes: [],
          subtypes: []
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      )
    )
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  clearCardDetailCache();
});

let nextId = 1;
function makeEntry(overrides: Partial<ScanReviewEntry> = {}): ScanReviewEntry {
  return {
    id: nextId++,
    card: { cardId: "opt", name: "Opt", imageUrl: "" },
    colors: ["U"],
    ...overrides
  };
}

describe("Frontend - Card Scan", () => {
  describe("Review bubble", () => {
    it("renders nothing when the holding list is empty", () => {
      const { container } = render(
        <ScanReviewBubble entries={[]} onRemove={vi.fn()} destinationLabel="the Stack" />
      );
      expect(container.firstChild).toBeNull();
    });

    it("shows a count badge sized by the holding list", () => {
      const entries = [makeEntry(), makeEntry({ card: { cardId: "bolt", name: "Lightning Bolt" } })];
      render(<ScanReviewBubble entries={entries} onRemove={vi.fn()} destinationLabel="the Stack" />);
      expect(screen.getByRole("button", { name: /Scanned this session: 2/i })).toBeDefined();
    });

    it("expands to show card names on toggle", async () => {
      const user = userEvent.setup();
      const entries = [makeEntry({ card: { cardId: "opt", name: "Opt" } })];
      render(<ScanReviewBubble entries={entries} onRemove={vi.fn()} destinationLabel="the Stack" />);

      await user.click(screen.getByRole("button", { name: /Scanned this session/i }));

      expect(screen.getByText("Opt")).toBeDefined();
    });

    it("names the destination the list joins when the scanner closes", async () => {
      const user = userEvent.setup();
      render(
        <ScanReviewBubble entries={[makeEntry()]} onRemove={vi.fn()} destinationLabel="Side A" />
      );

      await user.click(screen.getByRole("button", { name: /Scanned this session/i }));

      expect(screen.getByText("Joins Side A when you close the scanner")).toBeInTheDocument();
    });

    it("opens the experimental-feature caution pop-up and dismisses it with Got it", async () => {
      const user = userEvent.setup();
      render(
        <ScanReviewBubble entries={[makeEntry()]} onRemove={vi.fn()} destinationLabel="the Stack" />
      );

      expect(screen.queryByText(/Card scanning is experimental/)).not.toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "Card scanning is experimental" }));
      // Look-matching pass (slice P): the pop-up's heading and body are now
      // separate elements (`card-scan.html`'s `.caution-panel` shape), not one
      // combined sentence.
      expect(screen.getByRole("heading", { name: "Card scanning is experimental" })).toBeInTheDocument();
      expect(screen.getByText(/isn't fully functioning yet/)).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Got it" }));
      expect(screen.queryByText(/isn't fully functioning yet/)).not.toBeInTheDocument();
    });

    it("renders a compact scanned printing image with a corner detail popup, no duplicated name (DEC-151)", async () => {
      const user = userEvent.setup();
      const scannedUrl = "https://img/opt-print.jpg";
      const entries = [makeEntry({ card: { cardId: "opt", name: "Opt", imageUrl: scannedUrl } })];
      render(<ScanReviewBubble entries={entries} onRemove={vi.fn()} destinationLabel="the Stack" />);

      await user.click(screen.getByRole("button", { name: /Scanned this session/i }));

      const img = screen.getByRole("img", { name: "Opt" });
      expect(img.getAttribute("src")).toBe(scannedUrl);
      expect(img).toHaveClass("h-auto", "w-full", "object-contain");

      const entry = screen.getByRole("button", { name: /Remove Opt/i }).closest("li");
      expect(entry).toHaveClass("card-identity-ring");
      expect(entry).toHaveStyle("--card-identity-ring: rgb(14 165 233 / 0.55)");
      expect(within(entry as HTMLElement).queryByText("Opt")).not.toBeInTheDocument();
      expect(
        within(entry as HTMLElement).getByRole("button", { name: "Show details for Opt" })
      ).toBeInTheDocument();

      await user.click(
        within(entry as HTMLElement).getByRole("button", { name: "Show details for Opt" })
      );
      // DEC-158: the popup is portaled out of the review row rather than layered inside it,
      // so the row still shows no duplicated name and the detail surface is not bound by the
      // row's geometry.
      expect(within(entry as HTMLElement).queryByTestId("card-detail-popup")).not.toBeInTheDocument();
      expect(within(entry as HTMLElement).queryByText("Opt")).not.toBeInTheDocument();
      expect(within(screen.getByTestId("card-detail-popup")).getByText("Opt")).toBeInTheDocument();
    });

    it("uses a 320px viewport-capped panel with an internally scrolling list", async () => {
      const user = userEvent.setup();
      const entries = [
        makeEntry({ card: { cardId: "opt", name: "Opt" } }),
        makeEntry({ card: { cardId: "bolt", name: "Lightning Bolt" } }),
        makeEntry({ card: { cardId: "ponder", name: "Ponder" } })
      ];
      render(<ScanReviewBubble entries={entries} onRemove={vi.fn()} destinationLabel="the Stack" />);

      await user.click(screen.getByRole("button", { name: /Scanned this session/i }));

      const heading = screen.getByText("Added this session");
      const panel = heading.parentElement;
      expect(panel).toHaveClass(
        "flex",
        "w-80",
        "max-w-[calc(100vw-1.5rem)]",
        "max-h-[calc(100dvh-6.25rem)]"
      );

      const list = heading.nextElementSibling;
      expect(list).toHaveClass("min-h-0", "overflow-y-auto");
    });

    it("renders a full-width name-only fallback and keeps Remove usable when imageUrl is empty (D3)", async () => {
      const user = userEvent.setup();
      const entries = [makeEntry({ card: { cardId: "opt", name: "Opt", imageUrl: "" } })];
      render(<ScanReviewBubble entries={entries} onRemove={vi.fn()} destinationLabel="the Stack" />);

      await user.click(screen.getByRole("button", { name: /Scanned this session/i }));

      expect(screen.queryByRole("img")).toBeNull();
      const fallback = screen.getByTestId("card-presentation-fallback");
      expect(fallback).toHaveClass("w-full");
      expect(within(fallback).getByText("Opt")).toBeInTheDocument();
      // D3: the fallback shows the card name only — no descriptive fields, no fetch.
      expect(within(fallback).queryByText("Instant")).not.toBeInTheDocument();
      expect(within(fallback).queryByText("Scry 1, then draw a card.")).not.toBeInTheDocument();
      expect(fetch).not.toHaveBeenCalled();

      const remove = screen.getByRole("button", { name: /Remove Opt/i });
      const entry = remove.closest("li");
      expect(remove).toBeEnabled();
      expect(entry).toHaveClass("card-identity-ring");
      expect(entry).toHaveStyle("--card-identity-ring: rgb(14 165 233 / 0.55)");
    });

    it("replaces a failed image with the metadata fallback without losing Remove", async () => {
      const user = userEvent.setup();
      render(
        <ScanReviewBubble
          entries={[makeEntry({ card: { cardId: "opt", name: "Opt", imageUrl: "https://img/opt-print.jpg" } })]}
          onRemove={vi.fn()}
          destinationLabel="the Stack"
        />
      );

      await user.click(screen.getByRole("button", { name: /Scanned this session/i }));
      fireEvent.error(screen.getByRole("img", { name: "Opt" }));

      expect(screen.queryByRole("img")).not.toBeInTheDocument();
      expect(screen.getByTestId("card-presentation-fallback")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Remove Opt/i })).toBeEnabled();
    });

    it("uses accent palette tokens for the count badge, not a fixed hue", () => {
      render(<ScanReviewBubble entries={[makeEntry()]} onRemove={vi.fn()} destinationLabel="the Stack" />);

      const badge = screen.getByRole("button", { name: /Scanned this session/i });
      expect(badge).toHaveClass("bg-accent/90", "text-accent-contrast");
      expect(badge.className).not.toMatch(/emerald|green|sky|blue-[0-9]/);
    });

    it("calls onRemove with the holding-list id of the removed entry", async () => {
      const user = userEvent.setup();
      const onRemove = vi.fn();
      const entry = makeEntry({ card: { cardId: "opt", name: "Opt" } });
      render(<ScanReviewBubble entries={[entry]} onRemove={onRemove} destinationLabel="the Stack" />);

      await user.click(screen.getByRole("button", { name: /Scanned this session/i }));
      await user.click(screen.getByRole("button", { name: /Remove Opt/i }));

      expect(onRemove).toHaveBeenCalledWith(entry.id);
    });
  });
});
