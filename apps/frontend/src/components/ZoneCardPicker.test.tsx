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
  conditionHint: null
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
        showManualEntryPrompt: false,
        sessionCardIds: [],
        onOpen: () => undefined,
        onExitToManual,
        identify: () => ({ matched: false, was_rotated: false, candidates: [] }),
        onCameraStatusChange: () => undefined,
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

  it("still escalates to manual entry after the low-confidence threshold", async () => {
    const user = userEvent.setup();
    const { onExitToManual } = renderPicker({ showManualEntryPrompt: true });
    expect(screen.getByText("Still no confident scan match. Manual search is available.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Use manual search" }));
    expect(onExitToManual).toHaveBeenCalledTimes(1);
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
    // Counter reflects only this-session scans, not the manually added card.
    expect(within(counter).getByText("2")).toBeInTheDocument();

    await user.click(counter);
    expect(screen.getByText("Added this session")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove Opt from scan review" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove Lightning Bolt from scan review" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove Counterspell from scan review" })).not.toBeInTheDocument();
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
