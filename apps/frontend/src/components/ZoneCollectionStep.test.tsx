import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ZoneCollectionStep } from "./ZoneCollectionStep";
import type { ScanConvergence } from "../hooks/useScanCapture";
import { useScanCapture } from "../hooks/useScanCapture";
import type { CardMetadataItem, ZoneCardItem } from "../types";

vi.mock("./ScanCameraSurface", () => ({
  ScanCameraSurface: ({ onCapture }: { onCapture: () => void }) => (
    <button type="button" onClick={onCapture}>
      Capture
    </button>
  )
}));

vi.mock("../hooks/useScanCapture", () => ({
  useScanCapture: vi.fn()
}));

const searching: ScanConvergence = {
  phase: "searching",
  leaderName: null,
  votes: 0,
  votesNeeded: 6,
  conditionHint: null,
  detectorNudge: null,
  inZone: false
};

function makeZoneCard(cardId: string, name: string, overrides: Partial<ZoneCardItem> = {}): ZoneCardItem {
  return {
    cardId,
    name,
    imageUrl: "",
    colors: [],
    ...overrides
  };
}

function mockScanCapture(isOpen: boolean): void {
  vi.mocked(useScanCapture).mockReturnValue({
    isOpen,
    isLoading: false,
    error: null,
    cameraStatus: "idle",
    setCameraStatus: vi.fn(),
    resolvedCandidates: [],
    lockedCandidate: null,
    scanPhase: "searching",
    convergence: searching,
    scanDebug: null,
    scanAcquisitionDiagnostic: null,
    blockedNotice: null,
    addConfirmation: null,
    heldEntries: [],
    removeHeld: vi.fn(),
    openScan: vi.fn(),
    closeScan: vi.fn(),
    rescan: vi.fn(),
    identify: vi.fn(async () => ({ matched: false, was_rotated: false, candidates: [] })),
    recordAcquisitionDiagnostic: vi.fn(),
    acceptCandidate: vi.fn()
  });
}

function renderStep(
  cards: ZoneCardItem[] = [makeZoneCard("opt", "Opt")],
  statusMessage: string | null = null,
  selectedZones: Parameters<typeof ZoneCollectionStep>[0]["selectedZones"] = ["stack"]
): void {
  render(
    <ZoneCollectionStep
      selectedZones={selectedZones}
      zones={{ stack: cards }}
      onZonesChange={() => undefined}
      cardMetadata={[]}
      isMetadataLoading={false}
      activePlayer="Player 1"
      activePlayers={["Player 1"]}
      displayNamesByPlayer={{ "Player 1": undefined } as never}
      onBack={() => undefined}
      onContinue={() => undefined}
      canContinue={true}
      onFlashStatus={() => undefined}
      statusMessage={statusMessage}
      pendingPlacementCards={[]}
      placementTotal={0}
      onPlaceCard={() => undefined}
      onLeaveCardOut={() => undefined}
    />
  );
}

beforeEach(() => {
  mockScanCapture(true);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("Frontend - MTG Assistant", () => {
describe("ZoneCollectionStep scan focus", () => {
  it("adds shared interaction feedback to zone tabs and flow actions", () => {
    mockScanCapture(false);
    renderStep();

    expect(screen.getByRole("button", { name: "Zone tab: Stack" })).toHaveClass(
      "motion-hover",
      "motion-press",
      "motion-focus"
    );
    // Look-matching pass (slice N), requirement 3: the per-step "Back" button is
    // retired — the caller's shared header ‹ is the only way back now.
    expect(screen.queryByRole("button", { name: "Back" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue" })).toHaveClass(
      "motion-hover",
      "motion-press",
      "motion-focus"
    );
  });

  it("marks every zone tab interactive and transfers current state when the active tab changes", async () => {
    const user = userEvent.setup();
    mockScanCapture(false);
    renderStep([makeZoneCard("opt", "Opt")], null, ["stack", "battlefield"]);

    const stackTab = screen.getByRole("button", { name: "Zone tab: Stack" });
    const battlefieldTab = screen.getByRole("button", { name: "Zone tab: Battlefield" });

    expect(stackTab).toHaveClass("ambient-accent-surface", "ambient-accent-interactive");
    expect(battlefieldTab).toHaveClass("ambient-accent-surface", "ambient-accent-interactive");
    expect(stackTab).toHaveAttribute("data-accent-current", "true");
    expect(battlefieldTab).toHaveAttribute("data-accent-current", "false");

    await user.click(battlefieldTab);

    expect(stackTab).toHaveAttribute("data-accent-current", "false");
    expect(battlefieldTab).toHaveAttribute("data-accent-current", "true");

    // Look-matching pass (slice N, review 1 fix — finding 3): search now opens
    // from its own ＋ Add card chip, and closes again on every zone change.
    await user.click(screen.getByRole("button", { name: "Add a card to Battlefield" }));
    expect(screen.getByLabelText("Battlefield search input").closest(".ambient-accent-surface")).toHaveAttribute(
      "data-accent-current",
      "true"
    );
  });

  it("relabels the Add-card chip to \"Close search\" while the zone card search is open, so the toggle reads as the way to close it again", async () => {
    const user = userEvent.setup();
    mockScanCapture(false);
    renderStep([makeZoneCard("opt", "Opt")], null, ["stack", "battlefield"]);

    await user.click(screen.getByRole("button", { name: "Zone tab: Battlefield" }));

    // Closed: the chip invites adding a card to the active zone (aria-label stays
    // zone-scoped to keep it distinct from the zone's own "Add card" confirm button).
    expect(screen.getByRole("button", { name: "Add a card to Battlefield" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Add a card to Battlefield" }));

    // Open: the same toggle now reads and shows as the close action.
    const toggle = screen.getByRole("button", { name: "Close card search for Battlefield" });
    expect(toggle).toHaveTextContent("Close search");
    expect(screen.queryByRole("button", { name: "Add a card to Battlefield" })).not.toBeInTheDocument();

    await user.click(toggle);

    expect(screen.getByRole("button", { name: "Add a card to Battlefield" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Battlefield search input")).not.toBeInTheDocument();
  });

  it("renders the zone card list as a horizontal left-to-right strip with region scroll before scan opens (DEC-151 part 3)", () => {
    mockScanCapture(false);
    renderStep([
      makeZoneCard("opt", "Opt"),
      makeZoneCard("bolt", "Lightning Bolt"),
      makeZoneCard("counterspell", "Counterspell"),
      makeZoneCard("growth", "Giant Growth"),
      makeZoneCard("doom", "Doom Blade")
    ]);

    // REQ-209: a multi-card shelf also carries a reorder hint between the count and the
    // grid, so the grid is looked up directly rather than assumed to be the next sibling.
    const cardGrid = document.querySelector(".zone-card-grid");
    expect(cardGrid).toHaveClass("zone-card-grid", "shelf");
    expect(screen.getByText("Doom Blade")).toBeInTheDocument();
  });

  it("hides outer flow actions while scan is open and keeps camera-local controls", () => {
    renderStep([makeZoneCard("opt", "Opt")], "Stacked");

    expect(screen.queryByRole("heading", { name: "Add cards to zones" })).not.toBeInTheDocument();
    expect(screen.queryByText("Select a zone, then add cards by searching or scanning.")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Zone tab: Stack" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Stack search input")).not.toBeInTheDocument();
    expect(screen.queryByText("Stack cards (1)")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Back" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Continue" })).not.toBeInTheDocument();
    expect(screen.queryByText("Stacked")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Exit scan" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Capture" })).toBeInTheDocument();
  });

  it("removes only the matching instance when duplicate cardIds are present in a non-stack zone", async () => {
    const user = userEvent.setup();
    mockScanCapture(false);

    const card1 = makeZoneCard("opt", "Opt", { instanceId: "iid-1" });
    const card2 = makeZoneCard("opt", "Opt", { instanceId: "iid-2" });
    const onZonesChange = vi.fn();

    render(
      <ZoneCollectionStep
        selectedZones={["battlefield"]}
        zones={{ battlefield: [card1, card2] }}
        onZonesChange={onZonesChange}
        cardMetadata={[]}
        isMetadataLoading={false}
        activePlayer="Player 1"
        activePlayers={["Player 1"]}
        displayNamesByPlayer={{ "Player 1": undefined } as never}
        onBack={() => undefined}
        onContinue={() => undefined}
        canContinue={true}
        onFlashStatus={() => undefined}
        statusMessage={null}
        pendingPlacementCards={[]}
        placementTotal={0}
        onPlaceCard={() => undefined}
        onLeaveCardOut={() => undefined}
      />
    );

    // REQ-008/REQ-209: Remove now lives in the card menu a tap on the card opens.
    const grid = document.querySelector(".zone-card-grid") as HTMLElement;
    const actionTriggers = within(grid).getAllByRole("button", { name: "Card actions for Opt" });
    expect(actionTriggers).toHaveLength(2);

    await user.click(actionTriggers[0]!);
    await user.click(screen.getByRole("button", { name: "Remove from the Battlefield" }));

    expect(onZonesChange).toHaveBeenCalledWith({ battlefield: [card2] });
  });

  it("puts the selected card's exact canonical name into the search field", async () => {
    const user = userEvent.setup();
    mockScanCapture(false);
    const opt: CardMetadataItem = {
      cardId: "opt",
      name: "Opt",
      imageId: "opt-fixture-id",
      colors: [],
    };

    render(
      <ZoneCollectionStep
        selectedZones={["stack"]}
        zones={{ stack: [] }}
        onZonesChange={() => undefined}
        cardMetadata={[opt]}
        isMetadataLoading={false}
        activePlayer="Player 1"
        activePlayers={["Player 1"]}
        displayNamesByPlayer={{ "Player 1": undefined } as never}
        onBack={() => undefined}
        onContinue={() => undefined}
        canContinue={true}
        onFlashStatus={() => undefined}
        statusMessage={null}
        pendingPlacementCards={[]}
        placementTotal={0}
        onPlaceCard={() => undefined}
        onLeaveCardOut={() => undefined}
      />
    );

    // Look-matching pass (slice N, review 1 fix — finding 3): search opens
    // from its own ＋ Add card chip now.
    await user.click(screen.getByRole("button", { name: "Add a card to Stack" }));
    const search = screen.getByLabelText("Stack search input");
    await user.type(search, "opt");
    await user.click(await screen.findByRole("button", { name: "Opt" }));

    // DEC-160: the canonical name in search is what lets the duplicate standalone title
    // below the art go — the typed fragment is replaced by the exact selected name.
    expect(search).toHaveValue("Opt");
    const preview = screen.getByRole("article");
    expect(within(preview).queryByText("Opt")).not.toBeInTheDocument();
    expect(within(preview).getByRole("img", { name: "Opt" })).toBeInTheDocument();
  });
});
});
