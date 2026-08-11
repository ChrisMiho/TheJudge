import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("./lib/debugLogger", async () => {
  const harness = await import("./test/interactionFlowsHarness");
  return {
    createCorrelationId: harness.createCorrelationIdMock,
    logFrontendDebug: harness.logFrontendDebugMock
  };
});

import App from "./App";
import { NO_MATCH_COPY } from "./lib/search";
import type { CardMetadataItem } from "./types";
import {
  expandPlayerDetails,
  selectTurnPhase,
  advanceToBattlefieldZoneCollection,
  openStackBuilder,
  readSuggestionNamesFromPanel,
  appCss
} from "./test/appTestHelpers";
import {
  installInteractionFlowsHarness,
  setMetadataFixture
} from "./test/interactionFlowsHarness";

describe("Frontend - MTG Assistant", () => {
describe("Interaction flows - search and game context", () => {
  installInteractionFlowsHarness();

  it("shows suggestions only at threshold and supports suggestion-to-preview selection", async () => {
    const user = userEvent.setup();
    render(<App />);
    await openStackBuilder(user);

    const searchInput = screen.getByPlaceholderText("Type to begin");
    await user.type(searchInput, "op");
    expect(screen.queryByRole("button", { name: "Opt" })).not.toBeInTheDocument();

    await user.type(searchInput, "t");
    await user.click(await screen.findByRole("button", { name: "Opt" }));

    // REQ-133/DEC-160: the staged preview is the shared CardPresentation only — no
    // duplicated name heading beside it. This fixture carries no image, so the text-first
    // fallback is what renders and it still carries the card's name.
    expect(screen.queryByRole("heading", { name: "Opt" })).not.toBeInTheDocument();
    expect(screen.getByTestId("card-presentation-fallback")).toHaveTextContent("Opt");
    expect(screen.getByText("Scry 1, then draw a card.")).toBeInTheDocument();
  });

  it("shows TheJudge title on first render", () => {
    render(<App />);
    expect(screen.getByRole("button", { name: "TheJudge" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Game context" })).toBeInTheDocument();
  });

  it("renders ergonomic player controls in conventional stepper order", async () => {
    const user = userEvent.setup();
    render(<App />);

    const toggle = screen.getByRole("button", { name: "Show player details" });
    const remove = screen.getByRole("button", { name: "Remove last player" });
    const add = screen.getByRole("button", { name: "Add player" });

    for (const control of [toggle, remove, add]) {
      expect(control).toHaveClass("min-h-[2.75rem]", "min-w-[3.5rem]");
    }
    expect(remove.compareDocumentPosition(add) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
    // The disclosure paints a full-size triangle, rotated when expanded, rather than a
    // small text glyph inside a boxed button.
    expect(toggle.querySelector("polygon")).not.toBeNull();
    expect(toggle.querySelector("svg")?.getAttribute("class")).not.toContain("rotate-90");
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    await user.click(toggle);

    const expandedToggle = screen.getByRole("button", { name: "Hide player details" });
    expect(expandedToggle.querySelector("svg")?.getAttribute("class")).toContain("rotate-90");
    expect(expandedToggle).toHaveAttribute("aria-expanded", "true");
  });

  it("applies staged entrance motion and shared feedback to game-context controls", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByRole("heading", { name: "Game context" }).closest(".motion-enter")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Add player" })).toHaveClass(
      "motion-hover",
      "motion-press",
      "motion-focus"
    );
    expect(screen.getByLabelText("Turn phase")).toHaveClass("motion-focus");
    expect(screen.getByRole("button", { name: "Confirm game context" })).toHaveClass(
      "motion-hover",
      "motion-press",
      "motion-focus"
    );

    await user.click(screen.getByRole("button", { name: "Confirm game context" }));
    expect(screen.getByRole("heading", { name: "Zone confirmation" }).closest(".motion-enter")).not.toBeNull();
  });

  it("opts only the game-context disclosure row and phase control group into ambient accent surfaces", async () => {
    const user = userEvent.setup();
    render(<App />);

    const playerDisclosure = screen
      .getByRole("button", { name: "Show player details" })
      .closest(".ambient-accent-surface");
    const phaseGroup = screen.getByLabelText("Turn phase").closest(".ambient-accent-surface");

    expect(playerDisclosure).toHaveClass("ambient-accent-interactive");
    expect(phaseGroup).toHaveClass("ambient-accent-interactive");
    expect(phaseGroup).toContainElement(screen.getByLabelText("Active player"));

    await selectTurnPhase(user, "combat");
    expect(phaseGroup).toContainElement(screen.getByLabelText("Combat step"));

    await expandPlayerDetails(user);
    expect(screen.getByLabelText("Player 1 life total").closest(".ambient-accent-surface")).toBeNull();
  });

  it("defines a visible focus treatment for the shared motion utility", () => {
    expect(appCss).toMatch(
      /\.motion-focus:focus-visible\s*\{[^}]*outline:\s*2px solid rgb\(var\(--accent-soft\)\);[^}]*outline-offset:\s*2px;/
    );
  });

  it("defaults to 20 life for 2 players and 40 for 3+ players", async () => {
    const user = userEvent.setup();
    render(<App />);
    await expandPlayerDetails(user);

    expect(screen.getByLabelText("Player 1 life total")).toHaveValue("20");
    expect(screen.getByLabelText("Player 2 life total")).toHaveValue("20");
    expect(screen.queryByLabelText("Player 3 life total")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Add player" }));

    expect(screen.getByLabelText("Player 1 life total")).toHaveValue("40");
    expect(screen.getByLabelText("Player 2 life total")).toHaveValue("40");
    expect(screen.getByLabelText("Player 3 life total")).toHaveValue("40");

    await user.click(screen.getByRole("button", { name: "Remove last player" }));

    expect(screen.getByLabelText("Player 1 life total")).toHaveValue("20");
    expect(screen.getByLabelText("Player 2 life total")).toHaveValue("20");
    expect(screen.queryByLabelText("Player 3 life total")).not.toBeInTheDocument();
  });

  it("supports keyboard suggestion navigation and selection in stack builder search", async () => {
    const user = userEvent.setup();
    render(<App />);
    await openStackBuilder(user);

    const searchInput = screen.getByPlaceholderText("Type to begin");
    await user.type(searchInput, "lig");
    expect(await screen.findByRole("button", { name: "Lightning Bolt" })).toBeInTheDocument();

    fireEvent.keyDown(searchInput, { key: "ArrowDown" });
    fireEvent.keyDown(searchInput, { key: "Enter" });

    expect(screen.getByRole("img", { name: "Lightning Bolt" })).toBeInTheDocument();
    expect(screen.getByLabelText("Stack search input")).toHaveValue("Lightning Bolt");
    expect(screen.queryByRole("button", { name: "Lightning Bolt" })).not.toBeInTheDocument();
  });

  it("supports keyboard selection and escape-dismiss behavior in battlefield search", async () => {
    const user = userEvent.setup();
    render(<App />);

    await advanceToBattlefieldZoneCollection(user);

    const battlefieldSearchInput = screen.getByLabelText("Battlefield search input");
    await user.type(battlefieldSearchInput, "lig");
    expect(await screen.findByRole("button", { name: "Lightning Bolt" })).toBeInTheDocument();

    fireEvent.keyDown(battlefieldSearchInput, { key: "Escape" });
    expect(screen.queryByRole("button", { name: "Lightning Bolt" })).not.toBeInTheDocument();

    await user.type(battlefieldSearchInput, "h");
    expect(await screen.findByRole("button", { name: "Lightning Bolt" })).toBeInTheDocument();

    fireEvent.keyDown(battlefieldSearchInput, { key: "ArrowDown" });
    fireEvent.keyDown(battlefieldSearchInput, { key: "Enter" });

    expect(screen.getByRole("img", { name: "Lightning Bolt" })).toBeInTheDocument();
    expect(battlefieldSearchInput).toHaveValue("Lightning Bolt");
    expect(screen.queryByLabelText("Battlefield item details")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Lightning Bolt" })).not.toBeInTheDocument();
  });

  it("keeps ordered suggestions, threshold, and no-match behavior in parity across stack and battlefield flows", async () => {
    const parityFixture: CardMetadataItem[] = [
      {
        cardId: "swords-to-plowshares",
        name: "Swords to Plowshares",
        oracleText: "Exile target creature.",
        imageUrl: "",
        manaCost: "{W}",
        manaValue: 1,
        typeLine: "Instant",
        colors: ["W"],
        supertypes: [],
        subtypes: []
      },
      {
        cardId: "sword-of-fire-and-ice",
        name: "Sword of Fire and Ice",
        oracleText: "Equipped creature gets +2/+2 and has protection from red and from blue.",
        imageUrl: "",
        manaCost: "{3}",
        manaValue: 3,
        typeLine: "Artifact - Equipment",
        colors: [],
        supertypes: [],
        subtypes: ["Equipment"]
      },
      {
        cardId: "swiftfoot-boots",
        name: "Swiftfoot Boots",
        oracleText: "Equipped creature has hexproof and haste.",
        imageUrl: "",
        manaCost: "{2}",
        manaValue: 2,
        typeLine: "Artifact - Equipment",
        colors: [],
        supertypes: [],
        subtypes: ["Equipment"]
      }
    ];
    setMetadataFixture(parityFixture);
    const user = userEvent.setup();

    const stackView = render(<App />);
    await openStackBuilder(user);
    const stackInput = screen.getByPlaceholderText("Type to begin");

    await user.type(stackInput, "sw");
    expect(readSuggestionNamesFromPanel(stackInput)).toEqual([]);
    expect(screen.queryByText(NO_MATCH_COPY)).not.toBeInTheDocument();

    await user.type(stackInput, "o");
    const stackOrderedSuggestions = await waitFor(() => {
      const names = readSuggestionNamesFromPanel(stackInput);
      expect(names).toEqual(["Swords to Plowshares", "Sword of Fire and Ice"]);
      return names;
    });

    await user.clear(stackInput);
    await user.type(stackInput, "zzz");
    await waitFor(() => {
      expect(readSuggestionNamesFromPanel(stackInput)).toEqual([]);
      expect(screen.queryByRole("button", { name: "Swords to Plowshares" })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Sword of Fire and Ice" })).not.toBeInTheDocument();
    });

    stackView.unmount();

    const battlefieldView = render(<App />);
    await advanceToBattlefieldZoneCollection(user);
    const battlefieldInput = screen.getByLabelText("Battlefield search input");

    await user.type(battlefieldInput, "sw");
    expect(readSuggestionNamesFromPanel(battlefieldInput)).toEqual([]);
    expect(screen.queryByText(NO_MATCH_COPY)).not.toBeInTheDocument();

    await user.type(battlefieldInput, "o");
    await waitFor(() => {
      expect(readSuggestionNamesFromPanel(battlefieldInput)).toEqual(stackOrderedSuggestions);
    });

    await user.clear(battlefieldInput);
    await user.type(battlefieldInput, "zzz");
    await waitFor(() => {
      expect(readSuggestionNamesFromPanel(battlefieldInput)).toEqual([]);
      expect(screen.queryByRole("button", { name: "Swords to Plowshares" })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Sword of Fire and Ice" })).not.toBeInTheDocument();
    });

    battlefieldView.unmount();
  });
});
});
