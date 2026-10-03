import { cleanup, render, screen, within } from "@testing-library/react";
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

    // The holding list is the mockup's `.review-bubble .list`: one row per card, a ringed 30x42
    // thumbnail, the name, and Remove.
    it("renders each held card as a ringed thumbnail row with its name and Remove", async () => {
      const user = userEvent.setup();
      const scannedUrl = "https://img/opt-print.jpg";
      const entries = [makeEntry({ card: { cardId: "opt", name: "Opt", imageUrl: scannedUrl } })];
      render(<ScanReviewBubble entries={entries} onRemove={vi.fn()} destinationLabel="the Stack" />);

      await user.click(screen.getByRole("button", { name: /Scanned this session/i }));

      const row = screen.getByRole("button", { name: /Remove Opt/i }).closest(".row") as HTMLElement;
      const thumb = within(row).getByRole("button", { name: "Show details for Opt" });
      expect(thumb.querySelector("img")?.getAttribute("src")).toBe(scannedUrl);
      expect(thumb).toHaveClass("thumb", "card-identity-ring");
      expect(thumb).toHaveStyle("--card-identity-ring: rgb(14 165 233 / 0.55)");
      expect(within(row).getByText("Opt")).toBeInTheDocument();

      // A tap on the thumbnail opens the shared card detail popup (DEC-151), portaled out of the row.
      await user.click(thumb);
      expect(within(row).queryByTestId("card-detail-popup")).not.toBeInTheDocument();
      expect(within(screen.getByTestId("card-detail-popup")).getByText("Opt")).toBeInTheDocument();
    });

    it("lists the held cards in one scrolling panel under the count pill", async () => {
      const user = userEvent.setup();
      const entries = [
        makeEntry({ card: { cardId: "opt", name: "Opt" } }),
        makeEntry({ card: { cardId: "bolt", name: "Lightning Bolt" } }),
        makeEntry({ card: { cardId: "ponder", name: "Ponder" } })
      ];
      render(<ScanReviewBubble entries={entries} onRemove={vi.fn()} destinationLabel="the Stack" />);

      await user.click(screen.getByRole("button", { name: /Scanned this session/i }));

      const heading = screen.getByText("Added this session");
      expect(heading.closest(".list")).not.toBeNull();
      expect(heading.closest(".review-bubble")).toHaveAttribute("data-open", "true");
      expect(heading.closest(".list")?.querySelectorAll(".row")).toHaveLength(3);
    });

    it("keeps Remove usable when a held card has no image (D3): the row shows the name only", async () => {
      const user = userEvent.setup();
      const entries = [makeEntry({ card: { cardId: "opt", name: "Opt", imageUrl: "" } })];
      render(<ScanReviewBubble entries={entries} onRemove={vi.fn()} destinationLabel="the Stack" />);

      await user.click(screen.getByRole("button", { name: /Scanned this session/i }));

      expect(document.querySelector(".review-bubble img")).toBeNull();
      expect(fetch).not.toHaveBeenCalled();

      const remove = screen.getByRole("button", { name: /Remove Opt/i });
      const row = remove.closest(".row") as HTMLElement;
      expect(remove).toBeEnabled();
      expect(within(row).getByText("Opt")).toBeInTheDocument();
      expect(row.querySelector(".thumb")).toHaveClass("card-identity-ring");
      expect(row.querySelector(".thumb")).toHaveStyle("--card-identity-ring: rgb(14 165 233 / 0.55)");
    });

    it("the count pill and caution triangle sit in the frame's top-right, beside each other", () => {
      render(<ScanReviewBubble entries={[makeEntry()]} onRemove={vi.fn()} destinationLabel="the Stack" />);

      const badge = screen.getByRole("button", { name: /Scanned this session/i });
      expect(badge).toHaveClass("pill");
      const corner = badge.closest(".vf-top-right");
      expect(corner).not.toBeNull();
      expect(corner).toContainElement(screen.getByRole("button", { name: "Card scanning is experimental" }));
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
