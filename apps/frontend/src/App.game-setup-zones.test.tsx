import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { createCorrelationIdMock, logFrontendDebugMock } = vi.hoisted(() => ({
  createCorrelationIdMock: vi.fn(() => "corr-test-id"),
  logFrontendDebugMock: vi.fn()
}));

vi.mock("./lib/debugLogger", () => ({
  createCorrelationId: createCorrelationIdMock,
  logFrontendDebug: logFrontendDebugMock
}));

import App from "./App";
import type { ZoneAskAiPayload } from "./lib/contextFlow";
import type { CardMetadataItem } from "./types";
import {
  baseCardMetadataFixture,
  jsonResponse,
  getUrlFromRequest,
  waitForMetadataReady,
  advanceToStackBuilder,
  expandPlayerDetails,
  selectTurnPhase,
  advancePastZoneConfirm,
  openEnrichmentListView,
  advancePastZoneCollection,
  advanceToContextEnrichmentFromZones,
  advanceToZoneCollectionWithZones,
  setSelectedZones,
  selectZoneTab,
  addCardToActiveZone,
  openStackBuilder,
  selectCard,
  addCardToStack,
  clickDecryptStack
} from "./test/appTestHelpers";

let fetchMock: ReturnType<typeof vi.fn>;
// Seeded from the shared base fixture: the waiting-panel test reads metadataFixture
// via its own fetch mock, and neither describe's beforeEach reassigns it.
const metadataFixture: CardMetadataItem[] = [...baseCardMetadataFixture];
const submittedAskAiRequests: ZoneAskAiPayload[] = [];

describe("Slice-04: game setup + zone confirmation", () => {
  beforeEach(() => {
    submittedAskAiRequests.length = 0;
    fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = getUrlFromRequest(input);
      if (url === "/data/cardMetadata.json") {
        return jsonResponse(baseCardMetadataFixture);
      }
      if (url.endsWith("/api/ask-ai")) {
        submittedAskAiRequests.push(JSON.parse(String(init?.body)) as ZoneAskAiPayload);
      }
      return jsonResponse({ answer: "ok" });
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows zone confirmation step after confirming game context", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Confirm game context" }));

    expect(screen.getByRole("heading", { name: "Zone confirmation" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back" })).toBeInTheDocument();
  });

  it("pre-checks hand and library when Draw phase is selected", async () => {
    const user = userEvent.setup();
    render(<App />);

    await selectTurnPhase(user, "draw");
    await user.click(screen.getByRole("button", { name: "Confirm game context" }));

    expect(screen.getByLabelText("Zone: Hand")).toBeChecked();
    expect(screen.getByLabelText("Zone: Library")).toBeChecked();
    expect(screen.getByLabelText("Zone: Battlefield")).not.toBeChecked();
    expect(screen.getByLabelText("Zone: Stack")).not.toBeChecked();
  });

  it("additive merge: unchecking hand, going back to Combat does not restore hand but adds stack", async () => {
    const user = userEvent.setup();
    render(<App />);

    await selectTurnPhase(user, "draw");
    await user.click(screen.getByRole("button", { name: "Confirm game context" }));

    expect(screen.getByLabelText("Zone: Hand")).toBeChecked();
    await user.click(screen.getByLabelText("Zone: Hand"));
    expect(screen.getByLabelText("Zone: Hand")).not.toBeChecked();

    await user.click(screen.getByRole("button", { name: "Back" }));
    await selectTurnPhase(user, "combat");
    await user.click(screen.getByRole("button", { name: "Confirm game context" }));

    expect(screen.getByLabelText("Zone: Stack")).toBeChecked();
    expect(screen.getByLabelText("Zone: Hand")).not.toBeChecked();
  });

  it("life totals unchanged after navigating back from zone confirm", async () => {
    const user = userEvent.setup();
    render(<App />);

    await expandPlayerDetails(user);
    await user.clear(screen.getByLabelText("Player 1 life total"));
    await user.type(screen.getByLabelText("Player 1 life total"), "33");
    await user.clear(screen.getByLabelText("Player 2 life total"));
    await user.type(screen.getByLabelText("Player 2 life total"), "27");

    await user.click(screen.getByRole("button", { name: "Confirm game context" }));
    await user.click(screen.getByRole("button", { name: "Back" }));

    expect(screen.getByLabelText("Player 1 life total")).toHaveValue("33");
    expect(screen.getByLabelText("Player 2 life total")).toHaveValue("27");
  });

  it("blocks continuing from zone confirm when no zones are selected", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Confirm game context" }));
    await setSelectedZones(user, []);

    const continueButton = screen.getByRole("button", { name: "Continue" });
    expect(continueButton).toBeDisabled();
    expect(screen.getByText(/Select at least one zone/i)).toBeInTheDocument();
  });

  it("shows active player select on game context step", () => {
    render(<App />);
    expect(screen.getByLabelText("Active player")).toBeInTheDocument();
  });

  it("shows the player setup control guidance on the game context step", () => {
    render(<App />);

    expect(
      screen.getByText("Tap ▾ to set names and life totals — 2 players start at 20, 3+ at 40.")
    ).toBeInTheDocument();
    expect(
      screen.queryByText(["2 players start at 20", "life. 3+ players default to 40 life."].join(" "))
    ).not.toBeInTheDocument();
  });

  it("shows player display names in selects while keeping submitted player labels canonical", async () => {
    const user = userEvent.setup();
    render(<App />);

    await expandPlayerDetails(user);
    await user.clear(screen.getByLabelText("Player 1 display name"));
    await user.type(screen.getByLabelText("Player 1 display name"), "Alice");
    await user.clear(screen.getByLabelText("Player 2 display name"));
    await user.type(screen.getByLabelText("Player 2 display name"), "Bob");

    const activePlayerSelect = screen.getByLabelText("Active player");
    expect(within(activePlayerSelect).getByRole("option", { name: "Player 1 (Alice)" })).toHaveValue("Player 1");
    expect(within(activePlayerSelect).getByRole("option", { name: "Player 2 (Bob)" })).toHaveValue("Player 2");

    await user.click(screen.getByRole("button", { name: "Confirm game context" }));
    await advanceToZoneCollectionWithZones(user, ["Battlefield", "Stack"]);

    await selectZoneTab(user, "Battlefield");
    await selectCard(user, "lig", "Lightning Bolt");
    const collectionOwnerSelect = screen.getByLabelText("Owner for Lightning Bolt");
    expect(within(collectionOwnerSelect).getByRole("option", { name: "Player 1 (Alice)" })).toHaveValue("Player 1");
    await user.selectOptions(collectionOwnerSelect, "Player 2");
    await user.click(screen.getByRole("button", { name: "Add card" }));

    await selectZoneTab(user, "Stack");
    await addCardToActiveZone(user, "opt", "Opt");
    await advanceToContextEnrichmentFromZones(user);

    const casterSelect = screen.getByLabelText("Caster for Opt");
    expect(within(casterSelect).getByRole("option", { name: "Player 1 (Alice)" })).toHaveValue("Player 1");
    await user.selectOptions(casterSelect, "Player 2");

    await user.selectOptions(screen.getByLabelText("Target kind for Opt"), "player");
    const targetSelect = screen.getByLabelText("Player target for Opt");
    expect(within(targetSelect).getByRole("option", { name: "Player 2 (Bob)" })).toHaveValue("Player 2");
    await user.selectOptions(targetSelect, "Player 1");
    await user.click(screen.getByRole("button", { name: "Add target for Opt" }));
    expect(screen.getByText("Player: Player 1 (Alice)")).toBeInTheDocument();

    await clickDecryptStack(user);
    await waitFor(() => expect(submittedAskAiRequests).toHaveLength(1));
    expect(submittedAskAiRequests[0]?.gameContext.players).toEqual([
      { label: "Player 1", lifeTotal: 20, displayName: "Alice" },
      { label: "Player 2", lifeTotal: 20, displayName: "Bob" }
    ]);
    expect(submittedAskAiRequests[0]?.gameContext.activePlayer).toBe("Player 1");
    expect(submittedAskAiRequests[0]?.gameContext.zones?.battlefield?.[0]?.owner).toBe("Player 2");
    expect(submittedAskAiRequests[0]?.gameContext.zones?.stack?.[0]).toMatchObject({
      caster: "Player 2",
      targets: [{ kind: "player", targetPlayer: "Player 1" }]
    });
  });

  it("shows all turn phase options on game context step", () => {
    render(<App />);
    const turnPhaseSelect = screen.getByLabelText("Turn phase");
    expect(turnPhaseSelect).toHaveValue("main_1");
    expect(within(turnPhaseSelect).queryByRole("option", { name: "None" })).not.toBeInTheDocument();
    expect(within(turnPhaseSelect).queryByRole("option", { name: "Stack Resolving" })).not.toBeInTheDocument();
    expect(within(turnPhaseSelect).getByRole("option", { name: "Draw" })).toBeInTheDocument();
    expect(within(turnPhaseSelect).getByRole("option", { name: "Combat" })).toBeInTheDocument();
    expect(within(turnPhaseSelect).getByRole("option", { name: "Pre Combat Main Phase" })).toBeInTheDocument();
  });

  it("shows combat step selector when Combat phase is selected and hides it otherwise", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.queryByLabelText("Combat step")).not.toBeInTheDocument();
    await selectTurnPhase(user, "combat");
    const combatStepSelect = screen.getByLabelText("Combat step");
    expect(combatStepSelect).toBeInTheDocument();
    expect(combatStepSelect).toHaveValue("declare_blockers");
    expect(within(combatStepSelect as HTMLSelectElement).getByRole("option", { name: "Beginning of Combat" })).toBeInTheDocument();
    expect(within(combatStepSelect as HTMLSelectElement).getByRole("option", { name: "Declare Attackers" })).toBeInTheDocument();
    expect(within(combatStepSelect as HTMLSelectElement).getByRole("option", { name: "Declare Blockers" })).toBeInTheDocument();
    expect(within(combatStepSelect as HTMLSelectElement).getByRole("option", { name: "Combat Damage" })).toBeInTheDocument();
    expect(within(combatStepSelect as HTMLSelectElement).getByRole("option", { name: "End of Combat" })).toBeInTheDocument();

    await selectTurnPhase(user, "draw");
    expect(screen.queryByLabelText("Combat step")).not.toBeInTheDocument();
  });

  it("submits the default main_1 turn phase", async () => {
    const user = userEvent.setup();
    render(<App />);

    await advanceToStackBuilder(user);
    await waitForMetadataReady();
    await addCardToStack(user, "opt", "Opt");
    await clickDecryptStack(user);

    await waitFor(() => expect(submittedAskAiRequests).toHaveLength(1));
    expect(submittedAskAiRequests[0]?.gameContext.turnPhase).toBe("main_1");
  });
});
describe("Slice-05: zone collection UI", () => {
  beforeEach(() => {
    fetchMock = vi.fn(async (input: RequestInfo | URL): Promise<Response> => {
      const url = getUrlFromRequest(input);
      if (url === "/data/cardMetadata.json") {
        return jsonResponse(baseCardMetadataFixture);
      }
      return jsonResponse({ answer: "ok" });
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows zone collection after zone confirmation", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Confirm game context" }));
    await advancePastZoneConfirm(user);

    expect(screen.getByRole("heading", { name: "Add cards to zones" })).toBeInTheDocument();
  });

  it("preserves stack order bottom-to-top and shows enrichment counts", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Confirm game context" }));
    await advanceToZoneCollectionWithZones(user, ["Stack", "Hand", "Battlefield"]);

    await addCardToActiveZone(user, "opt", "Opt");
    await addCardToActiveZone(user, "lig", "Lightning Bolt");
    await selectZoneTab(user, "Stack");
    expect(screen.getByText("bottom")).toBeInTheDocument();
    expect(screen.getByText("top")).toBeInTheDocument();

    await selectZoneTab(user, "Hand");
    await selectZoneTab(user, "Battlefield");
    await addCardToActiveZone(user, "lig", "Lightning Bolt");

    await advancePastZoneCollection(user);
    await openEnrichmentListView(user);
    expect(screen.getByRole("heading", { name: "Context enrichment" })).toBeInTheDocument();
    expect(screen.getByLabelText("Caster for Opt")).toBeInTheDocument();
    expect(screen.getByLabelText("Caster for Lightning Bolt")).toBeInTheDocument();
  });

  it("retains zone card data when backing out and unchecking a zone", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Confirm game context" }));
    await advanceToZoneCollectionWithZones(user, ["Hand"]);

    await addCardToActiveZone(user, "opt", "Opt");
    await user.click(screen.getByRole("button", { name: "Back" }));
    await user.click(screen.getByLabelText("Zone: Hand"));
    await user.click(screen.getByLabelText("Zone: Stack"));
    await advancePastZoneConfirm(user);
    await user.click(screen.getByRole("button", { name: "Back" }));
    await user.click(screen.getByLabelText("Zone: Hand"));
    await advancePastZoneConfirm(user);

    await selectZoneTab(user, "Hand");
    expect(screen.getByRole("button", { name: "Remove Opt from Hand" })).toBeInTheDocument();
  });

  it("shows waiting panel while submitting and hides the submit form", async () => {
    let resolveAskAi!: (value: Response) => void;
    fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = getUrlFromRequest(input);
      if (url === "/data/cardMetadata.json") return jsonResponse(metadataFixture);
      if (url.endsWith("/api/ask-ai") && init?.method === "POST") {
        return new Promise<Response>((resolve) => { resolveAskAi = resolve; });
      }
      return jsonResponse({ error: "not found" }, 404);
    });
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();
    render(<App />);
    await openStackBuilder(user);
    await addCardToStack(user, "opt", "Opt");
    await clickDecryptStack(user);

    expect(document.querySelector("[aria-live='polite']")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Decrypt Stack" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Context enrichment" })).toBeInTheDocument();

    resolveAskAi(jsonResponse({ answer: "Mock answer" }));
    await screen.findByText("Mock answer");
    expect(document.querySelector("[aria-live='polite']")).not.toBeInTheDocument();
  });
});
