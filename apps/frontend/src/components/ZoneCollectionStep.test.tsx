import { cleanup, render, screen } from "@testing-library/react";
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

function makeZoneCard(cardId: string, name: string): ZoneCardItem {
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
    subtypes: []
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

function renderStep(cards: ZoneCardItem[] = [makeZoneCard("opt", "Opt")], statusMessage: string | null = null): void {
  render(
    <ZoneCollectionStep
      selectedZones={["stack"]}
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

describe("ZoneCollectionStep scan focus", () => {
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
    expect(screen.queryByText("Add at least one card in a selected zone. Other selected zones may stay empty.")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Zone tab: Stack" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Stack search input")).not.toBeInTheDocument();
    expect(screen.queryByText("Stack cards (1)")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Back" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Continue" })).not.toBeInTheDocument();
    expect(screen.queryByText("Stacked")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Exit scan" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Capture" })).toBeInTheDocument();
  });
});
