import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearCardDetailCache } from "../lib/cardDetail";
import type { ZoneCardItem } from "../types";
import { ScanReviewBubble } from "./ScanReviewBubble";

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

function makeZoneCard(overrides: Partial<ZoneCardItem> = {}): ZoneCardItem {
  return {
    cardId: "opt",
    name: "Opt",
    oracleText: "Scry 1, then draw a card.",
    imageUrl: "",
    manaCost: "{U}",
    manaValue: 1,
    typeLine: "Instant",
    colors: ["U"],
    supertypes: [],
    subtypes: [],
    ...overrides
  };
}

describe("Frontend - Card Scan", () => {
  describe("Review bubble", () => {
    it("renders nothing when no cards have been added", () => {
      const { container } = render(<ScanReviewBubble cards={[]} onRemove={vi.fn()} />);
      expect(container.firstChild).toBeNull();
    });

    it("shows a count badge when cards are present", () => {
      const cards = [makeZoneCard(), makeZoneCard({ cardId: "bolt", name: "Lightning Bolt" })];
      render(<ScanReviewBubble cards={cards} onRemove={vi.fn()} />);
      expect(screen.getByRole("button", { name: /Scanned this session: 2/i })).toBeDefined();
    });

    it("expands to show card names on toggle", async () => {
      const user = userEvent.setup();
      const cards = [makeZoneCard({ name: "Opt" })];
      render(<ScanReviewBubble cards={cards} onRemove={vi.fn()} />);

      await user.click(screen.getByRole("button", { name: /Scanned this session/i }));

      expect(screen.getByText("Opt")).toBeDefined();
    });

    it("renders a compact scanned printing image with a corner detail popup, no duplicated name (DEC-151)", async () => {
      const user = userEvent.setup();
      const scannedUrl = "https://img/opt-print.jpg";
      const cards = [makeZoneCard({ name: "Opt", imageUrl: scannedUrl })];
      render(<ScanReviewBubble cards={cards} onRemove={vi.fn()} />);

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
      const cards = [
        makeZoneCard(),
        makeZoneCard({ cardId: "bolt", name: "Lightning Bolt" }),
        makeZoneCard({ cardId: "ponder", name: "Ponder" })
      ];
      render(<ScanReviewBubble cards={cards} onRemove={vi.fn()} />);

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
      const cards = [
        makeZoneCard({
          name: "Opt",
          imageUrl: "",
          manaValue: 0,
          supertypes: ["Legendary"],
          subtypes: ["Wizard"]
        })
      ];
      render(<ScanReviewBubble cards={cards} onRemove={vi.fn()} />);

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
          cards={[makeZoneCard({ imageUrl: "https://img/opt-print.jpg" })]}
          onRemove={vi.fn()}
        />
      );

      await user.click(screen.getByRole("button", { name: /Scanned this session/i }));
      fireEvent.error(screen.getByRole("img", { name: "Opt" }));

      expect(screen.queryByRole("img")).not.toBeInTheDocument();
      expect(screen.getByTestId("card-presentation-fallback")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Remove Opt/i })).toBeEnabled();
    });

    it("uses accent palette tokens for the count badge, not a fixed hue", () => {
      const cards = [makeZoneCard()];
      render(<ScanReviewBubble cards={cards} onRemove={vi.fn()} />);

      const badge = screen.getByRole("button", { name: /Scanned this session/i });
      expect(badge).toHaveClass("bg-accent/90", "text-accent-contrast");
      expect(badge.className).not.toMatch(/emerald|green|sky|blue-[0-9]/);
    });

    it("calls onRemove with the instanceId of the removed card", async () => {
      const user = userEvent.setup();
      const onRemove = vi.fn();
      const cards = [makeZoneCard({ cardId: "opt", name: "Opt", instanceId: "iid-opt" })];
      render(<ScanReviewBubble cards={cards} onRemove={onRemove} />);

      await user.click(screen.getByRole("button", { name: /Scanned this session/i }));
      await user.click(screen.getByRole("button", { name: /Remove Opt/i }));

      expect(onRemove).toHaveBeenCalledWith("iid-opt");
    });
  });
});
