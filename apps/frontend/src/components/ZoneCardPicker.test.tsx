import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ZoneCardPicker } from "./ZoneCardPicker";
import type { ScanConvergence } from "../hooks/useScanCapture";
import type { ZoneCardItem } from "../types";

// The camera surface is exercised in ScanCameraSurface.test.tsx; here we only
// care about the picker chrome around it (no selectable list, no Accept gate).
vi.mock("./ScanCameraSurface", () => ({
  ScanCameraSurface: () => <div data-testid="scan-camera" />
}));

afterEach(cleanup);

const searching: ScanConvergence = {
  phase: "searching",
  leaderName: null,
  votes: 0,
  votesNeeded: 6,
  conditionHint: null,
  detectorNudge: null,
  inZone: false
};

function makeZoneCard(cardId: string, name: string): ZoneCardItem {
  return { cardId, name, oracleText: "", imageUrl: "", manaCost: "", manaValue: 0, typeLine: "", colors: [], supertypes: [], subtypes: [] };
}

function renderPicker(
  scanOverrides: Partial<Parameters<typeof ZoneCardPicker>[0]["scan"]> = {},
  pickerOverrides: { cards?: ZoneCardItem[]; onRemoveCard?: (cardId: string) => void } = {}
) {
  const onExitToManual = vi.fn();
  render(
    <ZoneCardPicker
      zoneId="stack"
      cards={pickerOverrides.cards ?? []}
      activePlayers={["Player 1"]}
      displayNamesByPlayer={{ "Player 1": undefined } as never}
      pendingOwner="Player 1"
      onPendingOwnerChange={() => undefined}
      searchInput=""
      onSearchInputChange={() => undefined}
      onSearchKeyDown={() => undefined}
      showSuggestions={false}
      isMetadataLoading={false}
      suggestions={[]}
      noMatchCopy="No match"
      activeSuggestionIndex={-1}
      onSuggestionHover={() => undefined}
      onSuggestionSelect={() => undefined}
      selectedCard={null}
      addButtonLabel="Add card"
      onAddSelectedCard={() => undefined}
      onRemoveCard={pickerOverrides.onRemoveCard ?? (() => undefined)}
      scan={{
        isOpen: true,
        isLoading: false,
        error: null,
        convergence: searching,
        addConfirmation: null,
        scanDebug: null,
        sessionCardIds: [],
        onOpen: () => undefined,
        onExitToManual,
        identify: () => ({ matched: false, was_rotated: false, candidates: [] }),
        onCameraStatusChange: () => undefined,
        onAcquisitionDiagnostic: () => undefined,
        ...scanOverrides
      }}
    />
  );
  return { onExitToManual };
}

describe("ZoneCardPicker scan chrome", () => {
  it("renders the camera surface but no selectable candidate list or Accept gate", () => {
    renderPicker();
    expect(screen.getByTestId("scan-camera")).toBeInTheDocument();
    expect(screen.queryByText("Possible matches — hold steady")).not.toBeInTheDocument();
    expect(screen.queryByText("Locked on")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Rescan" })).not.toBeInTheDocument();
  });

  it("does not leak the raw camera status debug line", () => {
    renderPicker();
    expect(screen.queryByText(/^Camera:/)).not.toBeInTheDocument();
  });

  it("renders the Scan confirm control with accent palette tokens, not a hardcoded emerald hue", () => {
    renderPicker({ isOpen: false });
    const scanButton = screen.getByRole("button", { name: "Scan" });
    expect(scanButton).toHaveClass("border-accent/70", "bg-accent/15", "text-accent-soft", "hover:bg-accent/25");
    expect(scanButton.className).not.toMatch(/emerald/);
  });

  it("never renders a manual-entry prompt or 'Use manual search' button (DEC-065: prompt removed)", () => {
    renderPicker();
    expect(screen.queryByText("Still no confident scan match. Manual search is available.")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Use manual search" })).not.toBeInTheDocument();
  });
});

describe("ZoneCardPicker scan focus (Slice C)", () => {
  it("hides search input and Scan button when scan is open", () => {
    renderPicker({ isOpen: true });
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Scan" })).not.toBeInTheDocument();
  });

  it("hides zone card list when scan is open with cards present", () => {
    renderPicker({ isOpen: true }, { cards: [makeZoneCard("opt", "Opt"), makeZoneCard("bolt", "Lightning Bolt")] });
    expect(screen.queryByText("Stack cards (2)")).not.toBeInTheDocument();
    expect(document.querySelector(".zone-card-grid")).toBeNull();
  });

  it("renders Exit scan as an absolute overlay button on the camera", () => {
    renderPicker({ isOpen: true });
    const exitBtn = screen.getByRole("button", { name: "Exit scan" });
    expect(exitBtn).toBeInTheDocument();
    expect(exitBtn).toHaveClass("absolute", "right-3", "top-3", "z-20");
  });

  it("Exit scan closes scan when clicked", async () => {
    const user = userEvent.setup();
    const { onExitToManual } = renderPicker({ isOpen: true });
    await user.click(screen.getByRole("button", { name: "Exit scan" }));
    expect(onExitToManual).toHaveBeenCalledTimes(1);
  });
});

describe("ZoneCardPicker card grid", () => {
  it("renders zone cards in a 2-column grid with overflow-y-auto and zone-card-grid class", () => {
    renderPicker(
      { isOpen: false },
      { cards: [makeZoneCard("opt", "Opt"), makeZoneCard("bolt", "Lightning Bolt")] }
    );
    const grid = document.querySelector(".zone-card-grid");
    expect(grid).not.toBeNull();
    expect(grid).toHaveClass("grid", "grid-cols-2", "overflow-y-auto");
  });

  it("exposes slim density hooks on zone card tiles", () => {
    renderPicker({ isOpen: false }, { cards: [makeZoneCard("opt", "Opt")] });
    const tile = screen.getByText("Opt").closest("div");
    expect(tile).toHaveClass("zone-card-tile");
  });

  it("calls onRemoveCard with the correct cardId when Remove is clicked", async () => {
    const user = userEvent.setup();
    const onRemoveCard = vi.fn();
    renderPicker(
      { isOpen: false },
      { cards: [makeZoneCard("opt", "Opt"), makeZoneCard("bolt", "Lightning Bolt")], onRemoveCard }
    );
    await user.click(screen.getByRole("button", { name: "Remove Opt from Stack" }));
    expect(onRemoveCard).toHaveBeenCalledTimes(1);
    expect(onRemoveCard).toHaveBeenCalledWith("opt");
  });

  it("renders stack position labels on tiles", () => {
    renderPicker(
      { isOpen: false },
      { cards: [makeZoneCard("opt", "Opt"), makeZoneCard("bolt", "Lightning Bolt")] }
    );
    expect(screen.getByText("bottom")).toBeInTheDocument();
    expect(screen.getByText("top")).toBeInTheDocument();
  });

  it("renders tile for a single card with 'bottom & top' label", () => {
    renderPicker({ isOpen: false }, { cards: [makeZoneCard("opt", "Opt")] });
    expect(screen.getByText("bottom & top")).toBeInTheDocument();
  });
});

describe("ZoneCardPicker scan review bubble", () => {
  it("does not render the bubble when nothing was scanned this session", () => {
    renderPicker({ sessionCardIds: [] }, { cards: [makeZoneCard("opt", "Opt")] });
    expect(screen.queryByLabelText(/^Scanned this session:/)).not.toBeInTheDocument();
  });

  it("counts this-session adds and expands to the scanned cards", async () => {
    const user = userEvent.setup();
    renderPicker(
      { sessionCardIds: ["opt", "bolt"] },
      { cards: [makeZoneCard("opt", "Opt"), makeZoneCard("bolt", "Lightning Bolt"), makeZoneCard("manual", "Counterspell")] }
    );

    const counter = screen.getByLabelText("Scanned this session: 2");
    expect(counter).toBeInTheDocument();
    expect(counter.parentElement).toHaveClass("absolute", "right-3", "top-12", "z-10");
    // Counter reflects only this-session scans, not the manually added card.
    expect(within(counter).getByText("2")).toBeInTheDocument();

    await user.click(counter);
    expect(screen.getByText("Added this session")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove Opt from scan review" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove Lightning Bolt from scan review" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove Counterspell from scan review" })).not.toBeInTheDocument();
  });

  it("renders the review bubble counter with accent palette tokens, not a fixed hue", () => {
    renderPicker(
      { sessionCardIds: ["opt"] },
      { cards: [makeZoneCard("opt", "Opt")] }
    );
    const bubble = screen.getByLabelText("Scanned this session: 1");
    expect(bubble).toHaveClass("bg-accent/90", "text-accent-contrast");
    expect(bubble.className).not.toMatch(/\b(sky|emerald)-/);
  });

  it("removes a scanned card in one tap via the existing removal path with no confirmation", async () => {
    const user = userEvent.setup();
    const onRemoveCard = vi.fn();
    const confirmSpy = vi.spyOn(window, "confirm");
    renderPicker({ sessionCardIds: ["opt"] }, { cards: [makeZoneCard("opt", "Opt")], onRemoveCard });

    await user.click(screen.getByLabelText("Scanned this session: 1"));
    await user.click(screen.getByRole("button", { name: "Remove Opt from scan review" }));

    expect(onRemoveCard).toHaveBeenCalledTimes(1);
    expect(onRemoveCard).toHaveBeenCalledWith("opt");
    expect(confirmSpy).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it("drops a card from the bubble once it leaves the zone list (live update)", () => {
    renderPicker({ sessionCardIds: ["opt"] }, { cards: [] });
    expect(screen.queryByLabelText(/^Scanned this session:/)).not.toBeInTheDocument();
  });
});
