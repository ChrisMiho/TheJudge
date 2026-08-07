import { render, screen, waitFor, within } from "@testing-library/react";
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
import {
  waitForMetadataReady,
  selectTurnPhase,
  advancePastZoneConfirm,
  advanceToBattlefieldZoneCollection,
  advancePastZoneCollection,
  finishEnrichmentWizard,
  advanceToContextEnrichmentFromZones,
  selectZoneTab,
  addCardToActiveZone,
  openStackBuilder,
  selectCard,
  addCardToStack,
  clickDecryptStack,
  advanceToContextEnrichment
} from "./test/appTestHelpers";
import {
  installInteractionFlowsHarness,
  logFrontendDebugMock,
  queueAskAiResponses,
  submittedAskAiHeaders,
  submittedAskAiRequests
} from "./test/interactionFlowsHarness";

describe("Frontend - MTG Assistant", () => {
describe("Interaction flows - stack and target context", () => {
  installInteractionFlowsHarness();

  it("keeps collection previews free of context-edit controls", async () => {
    const user = userEvent.setup();
    render(<App />);
    await openStackBuilder(user);

    await user.type(screen.getByPlaceholderText("Type to begin"), "opt");
    await user.click(await screen.findByRole("button", { name: "Opt" }));
    expect(screen.queryByLabelText("Entry target kind")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Entry context notes")).not.toBeInTheDocument();

    const firstView = screen.getByTestId("card-presentation-fallback");
    expect(firstView).toHaveTextContent("Opt");
  });

  it("keeps battlefield preview free of context-edit controls", async () => {
    const user = userEvent.setup();
    render(<App />);
    await advanceToBattlefieldZoneCollection(user);
    await user.type(screen.getByLabelText("Battlefield search input"), "opt");
    await user.click(await screen.findByRole("button", { name: "Opt" }));
    expect(screen.queryByLabelText("Battlefield target kind")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Battlefield item details")).not.toBeInTheDocument();
  });

  it("enables target editing after entering context enrichment", async () => {
    const user = userEvent.setup();
    render(<App />);
    await openStackBuilder(user);

    await user.type(screen.getByPlaceholderText("Type to begin"), "opt");
    await user.click(await screen.findByRole("button", { name: "Opt" }));
    await user.click(screen.getByRole("button", { name: /Begin stackening!|Add to Stack/ }));
    await advanceToContextEnrichment(user);

    await user.selectOptions(screen.getByLabelText("Target kind for Opt"), "player");
    await user.selectOptions(screen.getByLabelText("Player target for Opt"), "Player 2");
    await user.click(screen.getByRole("button", { name: "Add target for Opt" }));
    expect(screen.getByText("Player: Player 2")).toBeInTheDocument();
  });

  it("shows enrichment step with context enrichment heading after zone collection", async () => {
    const user = userEvent.setup();
    render(<App />);
    await openStackBuilder(user);

    await addCardToStack(user, "opt", "Opt");
    await advanceToContextEnrichment(user);

    expect(screen.getByRole("heading", { name: "Context enrichment" })).toBeInTheDocument();
    expect(screen.getByLabelText("Target kind for Opt")).toBeInTheDocument();
    expect(screen.getByLabelText("Caster for Opt")).toBeInTheDocument();

    await finishEnrichmentWizard(user);
    expect(screen.getByRole("button", { name: "Decrypt Stack" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("How does this resolve?")).toBeInTheDocument();
  });

  it("shows the optional question immediately after finishing the card-by-card enrichment wizard", async () => {
    const user = userEvent.setup();
    render(<App />);
    await openStackBuilder(user);

    await addCardToStack(user, "opt", "Opt");
    await addCardToStack(user, "lig", "Lightning Bolt");
    await advancePastZoneCollection(user);

    expect(screen.getByText("Card 1 of 2")).toBeInTheDocument();
    await finishEnrichmentWizard(user);

    expect(screen.getByText("Ready to decrypt.")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("How does this resolve?")).toBeInTheDocument();
    expect(screen.queryByLabelText("Caster for Opt")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Caster for Lightning Bolt")).not.toBeInTheDocument();
  });

  it("uses first-add then subsequent-add button labels", async () => {
    const user = userEvent.setup();
    render(<App />);
    await openStackBuilder(user);

    await selectCard(user, "opt", "Opt");

    const firstAddButton = screen.getByRole("button", { name: "Begin stackening!" });
    expect(firstAddButton).toBeInTheDocument();

    await user.click(firstAddButton);
    await selectCard(user, "cou", "Counterspell");

    expect(screen.getByRole("button", { name: "Add to Stack" })).toBeInTheDocument();
  });

  it("submits bottom-to-top stack payload after add/remove interactions", async () => {
    const user = userEvent.setup();
    render(<App />);
    await openStackBuilder(user);

    await addCardToStack(user, "opt", "Opt");
    await addCardToStack(user, "cou", "Counterspell");
    await addCardToStack(user, "lig", "Lightning Bolt");

    await advanceToContextEnrichmentFromZones(user);

    const counterspellRow = screen.getByLabelText("Caster for Counterspell").closest("li");
    expect(counterspellRow).not.toBeNull();
    await user.click(within(counterspellRow as HTMLLIElement).getByRole("button", { name: "Remove Counterspell" }));

    await clickDecryptStack(user);

    const requestBody = await waitFor(() => {
      expect(submittedAskAiRequests.length).toBeGreaterThan(0);
      return submittedAskAiRequests[0];
    });

    expect(requestBody.question).toBe("Resolve the stack");
    expect(requestBody.gameContext.playerCount).toBe(2);
    expect(requestBody.gameContext.zones?.stack?.map((card) => card.name)).toEqual(["Opt", "Lightning Bolt"]);
    expect(submittedAskAiHeaders[0]["x-correlation-id"]).toMatch(/\S+/);
  });

  it("emits staged-flow milestone logs for game-context confirmation", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Confirm game context" }));
    expect(logFrontendDebugMock).toHaveBeenCalledWith("game_context.confirmed", { playerCount: 2 });

    await user.click(screen.getByLabelText("Zone: Stack"));
    await advancePastZoneConfirm(user);
    expect(screen.getByRole("heading", { name: "Add cards to zones" })).toBeInTheDocument();
  });

  it("logs ask-ai success completion with httpStatus and response correlation id", async () => {
    const user = userEvent.setup();
    queueAskAiResponses({
      status: 200,
      body: { answer: "Done" },
      headers: { "X-Correlation-Id": "srv-corr-999" }
    });
    render(<App />);
    await openStackBuilder(user);
    await addCardToStack(user, "opt", "Opt");

    await clickDecryptStack(user);
    await waitFor(() => {
      expect(logFrontendDebugMock).toHaveBeenCalledWith(
        "ask_ai.request_succeeded",
        expect.objectContaining({
          correlationId: "corr-test-id",
          responseCorrelationId: "srv-corr-999",
          httpStatus: 200
        })
      );
    });

    expect(screen.queryByRole("button", { name: "Decrypt Stack" })).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("How does this resolve?")).not.toBeInTheDocument();
  });

  it("captures caster, typed targets, and notes when adding a stack entry", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Add player" }));
    await user.click(screen.getByRole("button", { name: "Add player" }));
    await openStackBuilder(user);
    await selectCard(user, "opt", "Opt");

    await user.click(screen.getByRole("button", { name: /Begin stackening!|Add to Stack/ }));
    await advanceToContextEnrichment(user);

    await user.selectOptions(screen.getByLabelText("Caster for Opt"), "Player 4");
    await user.selectOptions(screen.getByLabelText("Target kind for Opt"), "player");
    await user.selectOptions(screen.getByLabelText("Player target for Opt"), "Player 3");
    await user.click(screen.getByRole("button", { name: "Add target for Opt" }));
    await user.type(screen.getByLabelText("Mana spent for Opt"), "4");
    await user.type(screen.getByLabelText("Context notes for Opt"), "Cast for alternate cost");

    await clickDecryptStack(user);

    const requestBody = await waitFor(() => {
      expect(submittedAskAiRequests.length).toBeGreaterThan(0);
      return submittedAskAiRequests[0];
    });

    expect(requestBody.gameContext.zones?.stack?.[0]).toMatchObject({
      name: "Opt",
      caster: "Player 4",
      targets: [{ kind: "player", targetPlayer: "Player 3" }],
      contextNotes: "Cast for alternate cost",
      manaSpent: 4
    });
  });

  it("supports an other-target context option with freeform text", async () => {
    const user = userEvent.setup();
    render(<App />);

    await openStackBuilder(user);
    await selectCard(user, "opt", "Opt");
    await user.click(screen.getByRole("button", { name: /Begin stackening!|Add to Stack/ }));
    await advanceToContextEnrichment(user);

    await user.selectOptions(screen.getByLabelText("Target kind for Opt"), "other");
    await user.type(screen.getByLabelText("Other target for Opt"), "Target defined by delayed trigger context");
    await user.click(screen.getByRole("button", { name: "Add target for Opt" }));

    await clickDecryptStack(user);

    const requestBody = await waitFor(() => {
      expect(submittedAskAiRequests.length).toBeGreaterThan(0);
      return submittedAskAiRequests[0];
    });

    expect(requestBody.gameContext.zones?.stack?.[0]?.targets).toEqual([
      { kind: "other", targetDescription: "Target defined by delayed trigger context" }
    ]);
  });

  it("lets users edit caster and targeting context from stack details", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Add player" }));
    await user.click(screen.getByRole("button", { name: "Add player" }));
    await openStackBuilder(user);
    await addCardToStack(user, "opt", "Opt");

    await advanceToContextEnrichmentFromZones(user);

    await user.selectOptions(screen.getByLabelText("Caster for Opt"), "Player 3");
    await user.selectOptions(screen.getByLabelText("Target kind for Opt"), "player");
    await user.selectOptions(screen.getByLabelText("Player target for Opt"), "Player 4");
    await user.click(screen.getByRole("button", { name: "Add target for Opt" }));
    await user.type(screen.getByLabelText("Context notes for Opt"), "Copied from graveyard");

    await clickDecryptStack(user);

    const requestBody = await waitFor(() => {
      expect(submittedAskAiRequests.length).toBeGreaterThan(0);
      return submittedAskAiRequests[0];
    });

    expect(requestBody.gameContext.zones?.stack?.[0]).toMatchObject({
      caster: "Player 3",
      targets: [{ kind: "player", targetPlayer: "Player 4" }],
      contextNotes: "Copied from graveyard"
    });
  });

  it("supports a no-specific-target context option", async () => {
    const user = userEvent.setup();
    render(<App />);

    await openStackBuilder(user);
    await selectCard(user, "opt", "Opt");
    await user.click(screen.getByRole("button", { name: /Begin stackening!|Add to Stack/ }));
    await advanceToContextEnrichment(user);

    await user.selectOptions(screen.getByLabelText("Target kind for Opt"), "none");
    await user.click(screen.getByRole("button", { name: "Add target for Opt" }));

    await clickDecryptStack(user);

    const requestBody = await waitFor(() => {
      expect(submittedAskAiRequests.length).toBeGreaterThan(0);
      return submittedAskAiRequests[0];
    });

    expect(requestBody.gameContext.zones?.stack?.[0]?.targets).toEqual([{ kind: "none" }]);
  });

  it("blocks Continue from zone collection until a selected zone has a card", async () => {
    const user = userEvent.setup();
    render(<App />);
    await openStackBuilder(user);

    const continueButton = screen.getByRole("button", { name: "Continue" });
    expect(continueButton).toBeDisabled();
    expect(screen.getByText("Add at least one card by searching or scanning before continuing.")).toBeInTheDocument();

    await addCardToStack(user, "opt", "Opt");
    expect(continueButton).toBeEnabled();
  });

  it("nudges on selected empty stack but continues to enrichment when another zone has cards", async () => {
    const user = userEvent.setup();
    render(<App />);

    await selectTurnPhase(user, "main_1");
    await user.click(screen.getByRole("button", { name: "Confirm game context" }));
    await user.click(screen.getByLabelText("Zone: Stack"));
    await advancePastZoneConfirm(user);
    await waitForMetadataReady();

    await selectZoneTab(user, "Battlefield");
    await addCardToActiveZone(user, "lig", "Lightning Bolt");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(screen.getByRole("heading", { name: "Context enrichment" })).toBeInTheDocument();
    expect(screen.getByText(/Stack zone is selected but empty/)).toBeInTheDocument();
  });

  it("summarizes battlefield-only send context and submits board-state fallback for blank main phase questions", async () => {
    const user = userEvent.setup();
    render(<App />);

    await selectTurnPhase(user, "main_1");
    await user.click(screen.getByRole("button", { name: "Confirm game context" }));
    await user.click(screen.getByLabelText("Zone: Stack"));
    await advancePastZoneConfirm(user);
    await waitForMetadataReady();

    await selectZoneTab(user, "Battlefield");
    await addCardToActiveZone(user, "lig", "Lightning Bolt");
    await advancePastZoneCollection(user);
    await finishEnrichmentWizard(user);

    expect(screen.getByText("Sending to TheJudge")).toBeInTheDocument();
    expect(screen.getByText("Battlefield: 1 card")).toBeInTheDocument();
    expect(screen.getByText("Stack: selected, no cards added")).toBeInTheDocument();
    expect(screen.getByText(/Explain the interaction with the provided game state/)).toBeInTheDocument();
    expect(screen.queryByText(/No question\? Uses fallback: “Resolve the stack”/)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Decrypt Stack" }));

    const requestBody = await waitFor(() => {
      expect(submittedAskAiRequests.length).toBeGreaterThan(0);
      return submittedAskAiRequests[0];
    });

    expect(requestBody.question).toBe("Explain the interaction with the provided game state");
    expect(requestBody.gameContext.zones?.stack).toBeUndefined();
    expect(requestBody.gameContext.zones?.battlefield?.map((card) => card.name)).toEqual(["Lightning Bolt"]);
  });
});
});
