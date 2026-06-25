import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ZoneCardItem } from "../types";
import { ScanReviewBubble } from "./ScanReviewBubble";

afterEach(cleanup);

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

describe("ScanReviewBubble", () => {
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

  it("renders the scanned printing image when imageUrl is set", async () => {
    const user = userEvent.setup();
    const scannedUrl = "https://img/opt-print.jpg";
    const cards = [makeZoneCard({ name: "Opt", imageUrl: scannedUrl })];
    render(<ScanReviewBubble cards={cards} onRemove={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /Scanned this session/i }));

    const img = screen.getByRole("img", { name: "Opt" });
    expect(img.getAttribute("src")).toBe(scannedUrl);
  });

  it("does not render an image element when imageUrl is empty", async () => {
    const user = userEvent.setup();
    const cards = [makeZoneCard({ name: "Opt", imageUrl: "" })];
    render(<ScanReviewBubble cards={cards} onRemove={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /Scanned this session/i }));

    expect(screen.queryByRole("img")).toBeNull();
  });

  it("calls onRemove with the correct cardId", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    const cards = [makeZoneCard({ cardId: "opt", name: "Opt" })];
    render(<ScanReviewBubble cards={cards} onRemove={onRemove} />);

    await user.click(screen.getByRole("button", { name: /Scanned this session/i }));
    await user.click(screen.getByRole("button", { name: /Remove Opt/i }));

    expect(onRemove).toHaveBeenCalledWith("opt");
  });
});
