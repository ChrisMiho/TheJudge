import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ScanPanel } from "./ScanPanel";
import type { HeldScanEntry, ScanConvergence } from "../hooks/useScanCapture";

vi.mock("./ScanCameraSurface", () => ({
  ScanCameraSurface: () => <div data-testid="scan-camera" />
}));

const convergence: ScanConvergence = {
  phase: "searching",
  leaderName: null,
  votes: 0,
  votesNeeded: 6,
  conditionHint: null,
  detectorNudge: null,
  inZone: false
};

const held: HeldScanEntry = {
  id: 1,
  card: { cardId: "opt", name: "Opt", imageId: "", colors: [] },
  scanImageUrl: "",
  candidates: []
};

function renderPanel(overrides: Partial<React.ComponentProps<typeof ScanPanel>> = {}) {
  const onExit = vi.fn();
  render(
    <ScanPanel
      destinationLabel="Side A"
      isLoading={false}
      error={null}
      convergence={convergence}
      addConfirmation={null}
      scanDebug={null}
      heldEntries={[]}
      onRemoveHeld={() => undefined}
      onExit={onExit}
      identify={() => ({ matched: false, was_rotated: false, candidates: [] })}
      onCameraStatusChange={() => undefined}
      {...overrides}
    />
  );
  return { onExit };
}

describe("Frontend - Card Scan", () => {
  describe("ScanPanel", () => {
    it("shows the title at the left of the row when passed", () => {
      renderPanel({ title: "Scan a card" });
      expect(screen.getByText("Scan a card")).toHaveClass("scan-title");
    });

    it("shows the exit box alone when no title is passed", () => {
      renderPanel();
      expect(document.querySelector(".scan-title")).toBeNull();
      expect(document.querySelector(".scan-head")).toHaveAttribute("data-has-title", "false");
    });

    it("renders the Exit scan box in the row above the camera and calls onExit", async () => {
      const user = userEvent.setup();
      const { onExit } = renderPanel();
      const exitBtn = screen.getByRole("button", { name: "Exit scan" });
      const camera = screen.getByTestId("scan-camera");
      expect(exitBtn).toHaveClass("scan-exit");
      expect(camera.parentElement).not.toContainElement(exitBtn);
      expect(exitBtn.compareDocumentPosition(camera) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      await user.click(exitBtn);
      expect(onExit).toHaveBeenCalledTimes(1);
    });

    it("shows the loading line instead of the camera while scan data loads", () => {
      renderPanel({ isLoading: true });
      expect(screen.getByText("Loading scan data...")).toBeInTheDocument();
      expect(screen.queryByTestId("scan-camera")).toBeNull();
      expect(screen.getByRole("button", { name: "Exit scan" })).toBeInTheDocument();
    });

    it("announces the error line with role=alert", () => {
      renderPanel({ error: "Card scanning is unavailable right now" });
      expect(screen.getByRole("alert")).toHaveTextContent("Card scanning is unavailable right now");
    });

    it("renders the blocked-scan notice with role=status under the camera when given, and not otherwise", () => {
      renderPanel({ blockedNotice: "Duplicate cards are not supported in MVP1." });
      const notice = screen.getByRole("status");
      expect(notice).toHaveTextContent("Duplicate cards are not supported in MVP1.");
      expect(notice).toHaveClass("tb-note");
      const camera = screen.getByTestId("scan-camera");
      expect(camera.compareDocumentPosition(notice) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it("renders no status line when there is no blocked-scan notice", () => {
      renderPanel();
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });

    it("passes held entries to the review bubble with the destination label", () => {
      renderPanel({ heldEntries: [held], destinationLabel: "your question" });
      expect(screen.getByLabelText("Scanned this session: 1")).toBeInTheDocument();
    });

    it("keeps the exit box and the caution control in separate places (no overlap)", () => {
      renderPanel();
      const exitBtn = screen.getByRole("button", { name: "Exit scan" });
      const caution = screen.getByRole("button", { name: "Card scanning is experimental" });
      expect(exitBtn.closest(".scan-head")).not.toBeNull();
      expect(exitBtn.closest(".scan-head")).not.toContainElement(caution);
      expect(screen.getByTestId("scan-camera").parentElement).toContainElement(caution);
    });
  });
});
