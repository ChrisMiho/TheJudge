import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ZoneCollectionStep } from "./ZoneCollectionStep";
import type { ScanConvergence } from "../hooks/useScanCapture";
import { useScanCapture } from "../hooks/useScanCapture";
import type { ZoneCardItem } from "../types";

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
    oracleText: "",
    imageUrl: "",
    manaCost: "",
    manaValue: 0,
    typeLine: "",
    colors: [],
    supertypes: [],
    subtypes: [],
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
    expect(screen.getByRole("button", { name: "Back" })).toHaveClass(
      "motion-hover",
      "motion-press",
      "motion-focus"
    );
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
    expect(screen.getByLabelText("Battlefield search input").closest(".ambient-accent-surface")).toHaveAttribute(
      "data-accent-current",
      "true"
    );
  });

  it("renders the zone card list as a capped 2-column scroll grid before scan opens", () => {
    mockScanCapture(false);
    renderStep([
      makeZoneCard("opt", "Opt"),
      makeZoneCard("bolt", "Lightning Bolt"),
      makeZoneCard("counterspell", "Counterspell"),
      makeZoneCard("growth", "Giant Growth"),
      makeZoneCard("doom", "Doom Blade")
    ]);

    const cardGrid = screen.getByText("Stack cards (5)").nextElementSibling;
    expect(cardGrid).toHaveClass("zone-card-grid", "grid", "grid-cols-2", "overflow-y-auto");
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
      />
    );

    const grid = document.querySelector(".zone-card-grid") as HTMLElement;
    const removals = within(grid).getAllByRole("button", { name: "Remove Opt from Battlefield" });
    expect(removals).toHaveLength(2);

    await user.click(removals[0]!);

    expect(onZonesChange).toHaveBeenCalledWith({ battlefield: [card2] });
  });
});
});
