import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ZoneCardPicker } from "./ZoneCardPicker";
import type { ScanConvergence } from "../hooks/useScanCapture";
import type { ZoneCardItem, ZoneId } from "../types";

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

function renderPicker(
  scanOverrides: Partial<Parameters<typeof ZoneCardPicker>[0]["scan"]> = {},
  pickerOverrides: {
    zoneId?: ZoneId;
    cards?: ZoneCardItem[];
    onRemoveCard?: (cardId: string) => void;
  } = {}
) {
  const onExitToManual = vi.fn();
  render(
    <ZoneCardPicker
      zoneId={pickerOverrides.zoneId ?? "stack"}
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
        sessionInstanceIds: [],
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

describe("Frontend - MTG Assistant", () => {
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

  it("never renders a manual-entry prompt or 'Use manual search' button", () => {
    renderPicker();
    expect(screen.queryByText("Still no confident scan match. Manual search is available.")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Use manual search" })).not.toBeInTheDocument();
  });
});

describe("ZoneCardPicker scan focus", () => {
  it("hides search input and Scan button when scan is open", () => {
    renderPicker({ isOpen: true });
    expect(screen.queryByText("Stack order is bottom to top. The first card you add is the bottom; each new card is added on top.")).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Scan" })).not.toBeInTheDocument();
  });

  it("hides zone card list when scan is open with cards present", () => {
    renderPicker({ isOpen: true }, { cards: [makeZoneCard("opt", "Opt"), makeZoneCard("bolt", "Lightning Bolt")] });
    expect(screen.queryByText("Stack cards (2)")).not.toBeInTheDocument();
    expect(document.querySelector(".zone-card-grid")).toBeNull();
  });

  it("renders Exit scan above and outside the camera overlay", () => {
    renderPicker({ isOpen: true });
    const exitBtn = screen.getByRole("button", { name: "Exit scan" });
    const camera = screen.getByTestId("scan-camera");
    const cameraOverlay = camera.parentElement;

    expect(exitBtn.compareDocumentPosition(camera) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(cameraOverlay).not.toContainElement(exitBtn);
    expect(exitBtn).not.toHaveClass("absolute", "right-3", "top-3", "z-20");
    expect(exitBtn).toHaveClass("min-h-10");
  });

  it("Exit scan closes scan when clicked", async () => {
    const user = userEvent.setup();
    const { onExitToManual } = renderPicker({ isOpen: true });
    await user.click(screen.getByRole("button", { name: "Exit scan" }));
    expect(onExitToManual).toHaveBeenCalledTimes(1);
  });
});

describe("ZoneCardPicker card grid", () => {
  it("marks the rendered active-zone picker as a current ambient accent surface", () => {
    renderPicker({ isOpen: false });

    expect(screen.getByLabelText("Stack search input").closest(".ambient-accent-surface")).toHaveAttribute(
      "data-accent-current",
      "true"
    );
  });

  it("renders zone cards in a horizontal left-to-right strip with region scroll and zone-card-grid class (DEC-151 part 3, REQ-130)", () => {
    renderPicker(
      { isOpen: false },
      { cards: [makeZoneCard("opt", "Opt"), makeZoneCard("bolt", "Lightning Bolt")] }
    );
    const grid = document.querySelector(".zone-card-grid");
    expect(grid).not.toBeNull();
    expect(grid).toHaveClass("flex", "overflow-x-auto");
    expect(grid).not.toHaveClass("grid", "grid-cols-2");

    // Tiles lay out left-to-right in add order.
    const tiles = grid?.querySelectorAll(".zone-card-tile") ?? [];
    expect(tiles).toHaveLength(2);
    expect(within(tiles[0] as HTMLElement).getByText("bottom")).toBeInTheDocument();
    expect(within(tiles[1] as HTMLElement).getByText("top")).toBeInTheDocument();
  });

  it("exposes the semantic responsive hook on zone card tiles", () => {
    renderPicker({ isOpen: false }, { cards: [makeZoneCard("opt", "Opt")] });
    const tile = screen.getByRole("button", { name: "Remove Opt from Stack" }).closest(".zone-card-tile");
    expect(tile).toHaveClass("zone-card-tile");
  });

  it("adds token-driven entrance and remove-exit hooks to card tiles", () => {
    renderPicker({ isOpen: false }, { cards: [makeZoneCard("opt", "Opt")] });

    const removeButton = screen.getByRole("button", { name: "Remove Opt from Stack" });
    expect(removeButton.closest(".zone-card-tile")).toHaveClass(
      "enrichment-card-enter",
      "card-state-remove"
    );
    expect(removeButton).toHaveClass("card-state-remove-trigger");
  });

  it("uses a compact image with a corner detail popup, no duplicated card name, and keeps controls below it (DEC-151)", async () => {
    const user = userEvent.setup();
    renderPicker(
      { isOpen: false },
      { cards: [makeZoneCard("opt", "Opt", { imageUrl: "https://img.example/opt.jpg" })] }
    );

    const image = screen.getByRole("img", { name: "Opt" });
    const tile = image.closest(".zone-card-tile") as HTMLElement;
    expect(image).toHaveClass("zone-card-tile-image", "h-auto", "w-auto", "object-contain");
    expect(within(tile).queryByText("Opt")).not.toBeInTheDocument();
    expect(screen.getByText("bottom & top")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove Opt from Stack" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show details for Opt" })).toBeInTheDocument();

    // Oracle/detail text is not stacked under the image by default — only the popup shows it.
    expect(within(tile).queryByTestId("card-detail-popup")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Show details for Opt" }));
    // DEC-158: the popup is portaled to <body>, so a w-40 strip tile never bounds the detail
    // surface's geometry.
    expect(within(tile).queryByTestId("card-detail-popup")).not.toBeInTheDocument();
    expect(screen.getByTestId("card-detail-popup").closest(".zone-card-tile")).toBeNull();
    expect(within(screen.getByTestId("card-detail-popup")).getByText("Opt")).toBeInTheDocument();
    // The image stays mounted while the popup is open rather than being replaced by it.
    expect(screen.getByRole("img", { name: "Opt" })).toBeInTheDocument();
  });

  it("does not duplicate the owner label on an image-bearing non-stack card", () => {
    renderPicker(
      { isOpen: false },
      {
        zoneId: "battlefield",
        cards: [
          makeZoneCard("opt", "Opt", {
            imageUrl: "https://img.example/opt.jpg",
            owner: "Player 1"
          })
        ]
      }
    );

    const tile = screen.getByRole("img", { name: "Opt" }).closest(".zone-card-tile") as HTMLElement;
    expect(within(tile).queryByText("Opt")).not.toBeInTheDocument();
    expect(within(tile).queryByText("Player 1")).not.toBeInTheDocument();
  });

  it("applies the identity ring to the complete image-bearing tile", () => {
    renderPicker(
      { isOpen: false },
      {
        cards: [
          makeZoneCard("opt", "Opt", {
            imageUrl: "https://img.example/opt.jpg",
            colors: ["U"]
          })
        ]
      }
    );

    const tile = screen.getByRole("img", { name: "Opt" }).closest(".zone-card-tile");
    expect(tile).toHaveClass("card-identity-ring");
    expect(tile).not.toHaveClass("ambient-accent-surface");
    expect(tile).toHaveStyle("--card-identity-ring: rgb(14 165 233 / 0.55)");
  });

  it("uses a full-width metadata fallback while preserving stack position and controls", () => {
    renderPicker(
      { isOpen: false },
      {
        cards: [
          makeZoneCard("urza", "Urza, Lord High Artificer", {
            manaCost: "{2}{U}{U}",
            manaValue: 0,
            typeLine: "Legendary Creature — Human Artificer",
            oracleText: "When Urza enters, create a Construct.",
            colors: ["U", "W"],
            supertypes: ["Legendary"],
            subtypes: ["Human", "Artificer"]
          })
        ]
      }
    );

    const fallback = screen.getByTestId("card-presentation-fallback");
    const tile = fallback.closest(".zone-card-tile");
    expect(fallback).toHaveClass("w-full");
    expect(tile).toHaveClass("card-identity-ring");
    expect(tile).toHaveStyle(
      "--card-identity-ring: linear-gradient(90deg, rgb(248 231 185 / 0.55), rgb(14 165 233 / 0.55))"
    );
    expect(within(fallback).getByText("Urza, Lord High Artificer")).toBeInTheDocument();
    expect(within(fallback).getByText("{2}{U}{U}")).toBeInTheDocument();
    expect(within(fallback).getByText("0")).toBeInTheDocument();
    expect(within(fallback).getByText("Legendary Creature — Human Artificer")).toBeInTheDocument();
    expect(within(fallback).getByText("When Urza enters, create a Construct.")).toBeInTheDocument();
    expect(within(fallback).getByText("U, W")).toBeInTheDocument();
    expect(within(fallback).getByText("Legendary")).toBeInTheDocument();
    expect(within(fallback).getByText("Human, Artificer")).toBeInTheDocument();
    expect(screen.getByText("bottom & top")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove Urza, Lord High Artificer from Stack" })).toBeInTheDocument();
  });

  it("replaces a failed tile image with the readable fallback", () => {
    renderPicker(
      { isOpen: false },
      {
        cards: [
          makeZoneCard("opt", "Opt", {
            imageUrl: "https://img.example/missing.jpg",
            oracleText: "Scry 1, then draw a card."
          })
        ]
      }
    );

    fireEvent.error(screen.getByRole("img", { name: "Opt" }));

    expect(screen.queryByRole("img", { name: "Opt" })).not.toBeInTheDocument();
    expect(within(screen.getByTestId("card-presentation-fallback")).getByText("Scry 1, then draw a card.")).toBeInTheDocument();
  });

  it("calls onRemoveCard with the instanceId of the removed card", async () => {
    const user = userEvent.setup();
    const onRemoveCard = vi.fn();
    renderPicker(
      { isOpen: false },
      {
        cards: [
          makeZoneCard("opt", "Opt", { instanceId: "iid-opt" }),
          makeZoneCard("bolt", "Lightning Bolt", { instanceId: "iid-bolt" })
        ],
        onRemoveCard
      }
    );
    await user.click(screen.getByRole("button", { name: "Remove Opt from Stack" }));
    expect(onRemoveCard).toHaveBeenCalledTimes(1);
    expect(onRemoveCard).toHaveBeenCalledWith("iid-opt");
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
    renderPicker({ sessionInstanceIds: [] }, { cards: [makeZoneCard("opt", "Opt")] });
    expect(screen.queryByLabelText(/^Scanned this session:/)).not.toBeInTheDocument();
  });

  it("counts this-session adds and expands to the scanned cards", async () => {
    const user = userEvent.setup();
    const optCard = makeZoneCard("opt", "Opt", { instanceId: "iid-opt" });
    const boltCard = makeZoneCard("bolt", "Lightning Bolt", { instanceId: "iid-bolt" });
    const manualCard = makeZoneCard("manual", "Counterspell");
    renderPicker(
      { sessionInstanceIds: ["iid-opt", "iid-bolt"] },
      { cards: [optCard, boltCard, manualCard] }
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
      { sessionInstanceIds: ["iid-opt"] },
      { cards: [makeZoneCard("opt", "Opt", { instanceId: "iid-opt" })] }
    );
    const bubble = screen.getByLabelText("Scanned this session: 1");
    expect(bubble).toHaveClass("bg-accent/90", "text-accent-contrast");
    expect(bubble.className).not.toMatch(/\b(sky|emerald)-/);
  });

  it("removes a scanned card in one tap via the existing removal path with no confirmation", async () => {
    const user = userEvent.setup();
    const onRemoveCard = vi.fn();
    const confirmSpy = vi.spyOn(window, "confirm");
    renderPicker(
      { sessionInstanceIds: ["iid-opt"] },
      { cards: [makeZoneCard("opt", "Opt", { instanceId: "iid-opt" })], onRemoveCard }
    );

    await user.click(screen.getByLabelText("Scanned this session: 1"));
    await user.click(screen.getByRole("button", { name: "Remove Opt from scan review" }));

    expect(onRemoveCard).toHaveBeenCalledTimes(1);
    expect(onRemoveCard).toHaveBeenCalledWith("iid-opt");
    expect(confirmSpy).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it("drops a card from the bubble once it leaves the zone list (live update)", () => {
    renderPicker({ sessionInstanceIds: ["iid-opt"] }, { cards: [] });
    expect(screen.queryByLabelText(/^Scanned this session:/)).not.toBeInTheDocument();
  });
});
});
