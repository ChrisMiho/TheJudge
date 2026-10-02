import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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
  expandPlayerDetails,
  advancePastZoneConfirm,
  advanceToBattlefieldZoneCollection,
  finishEnrichmentWizard,
  advanceToContextEnrichmentFromZones,
  advanceToZoneCollectionWithZones,
  selectZoneTab,
  addCardToActiveZone,
  openStackBuilder,
  addCardToStack,
  clickDecryptStack,
  advanceToContextEnrichment
} from "./test/appTestHelpers";
import {
  installInteractionFlowsHarness,
  queueAskAiResponses,
  submittedAskAiRequests
} from "./test/interactionFlowsHarness";

describe("Frontend - MTG Assistant", () => {
describe("Interaction flows - submission and retry", () => {
  installInteractionFlowsHarness();

  it("hides optional-question submit controls after response is received", async () => {
    const user = userEvent.setup();
    queueAskAiResponses({ status: 200, body: { answer: "First success answer" } });
    render(<App />);
    await openStackBuilder(user);
    await addCardToStack(user, "opt", "Opt");
    await advanceToContextEnrichment(user);
    await finishEnrichmentWizard(user);

    const questionInput = screen.getByPlaceholderText("How does this resolve?");
    await user.type(questionInput, "Will this resolve?");

    await clickDecryptStack(user);
    expect(await screen.findByText("First success answer")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Decrypt Stack" })).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("How does this resolve?")).not.toBeInTheDocument();
    expect(screen.queryByText("Optional question")).not.toBeInTheDocument();

    // Look-matching pass (slice N), requirement 10: the ruling now takes the shared
    // `.app-header` (brand + tagline, same as every other destination) plus its own
    // `.chat-head` "Ask a Question" — the old header that hid the tagline here alone is
    // retired.
    expect(screen.queryByRole("heading", { name: "Conversation" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "TheJudge" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Ask a Question" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Ask a follow-up…")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start over — clears everything" })).toBeInTheDocument();
  });

  it("enforces retry cooldown and keeps context through repeated failures", async () => {
    const user = userEvent.setup();
    queueAskAiResponses(
      { status: 502, body: { error: "Miho is working on it", retryAfterSeconds: 13 } },
      { status: 502, body: { error: "Miho is working on it", retryAfterSeconds: 13 } }
    );
    render(<App />);
    await openStackBuilder(user);
    await addCardToStack(user, "opt", "Opt");
    await advanceToContextEnrichment(user);
    await finishEnrichmentWizard(user);

    const questionInput = screen.getByPlaceholderText("How does this resolve?");
    await user.type(questionInput, "Retry this");
    vi.useFakeTimers();
    fireEvent.click(screen.getByRole("button", { name: "Decrypt Stack" }));

    await act(async () => {
      await Promise.resolve();
    });

    const retryButton = screen.getByRole("button", { name: "Retry in 13s" });
    expect(retryButton).toBeDisabled();
    expect(screen.getByText("Miho is working on it")).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(12000);
    });
    expect(screen.getByRole("button", { name: "Retry in 1s" })).toBeDisabled();

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    const enabledRetryButton = screen.getByRole("button", { name: "Retry" });
    expect(enabledRetryButton).toBeEnabled();
    fireEvent.click(enabledRetryButton);

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByRole("button", { name: "Retry in 13s" })).toBeDisabled();
    expect(questionInput).toHaveValue("Retry this");
    expect(submittedAskAiRequests).toHaveLength(2);
  });

  it("retries with identical staged context payload after failure", async () => {
    const user = userEvent.setup();
    queueAskAiResponses(
      { status: 502, body: { error: "Miho is working on it", retryAfterSeconds: 13 } },
      { status: 502, body: { error: "Miho is working on it", retryAfterSeconds: 13 } }
    );
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Add player" }));
    await expandPlayerDetails(user);
    await user.clear(screen.getByLabelText("Player 1 life total"));
    await user.type(screen.getByLabelText("Player 1 life total"), "38");
    await user.clear(screen.getByLabelText("Player 2 life total"));
    await user.type(screen.getByLabelText("Player 2 life total"), "24");
    await user.clear(screen.getByLabelText("Player 3 life total"));
    await user.type(screen.getByLabelText("Player 3 life total"), "17");
    await user.click(screen.getByRole("button", { name: "Confirm game context" }));
    await advanceToZoneCollectionWithZones(user, ["Battlefield", "Stack"]);

    await selectZoneTab(user, "Battlefield");
    await addCardToActiveZone(user, "lig", "Lightning Bolt");
    await selectZoneTab(user, "Stack");
    await addCardToActiveZone(user, "opt", "Opt");
    await advanceToContextEnrichmentFromZones(user);
    // Walk the compact sheets (real pointer-event clicks) before switching to fake
    // timers — only the retry-cooldown wait below needs those.
    await finishEnrichmentWizard(user);

    vi.useFakeTimers();
    fireEvent.click(screen.getByRole("button", { name: "Decrypt Stack" }));
    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      vi.advanceTimersByTime(13000);
    });
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    await act(async () => {
      await Promise.resolve();
    });

    expect(submittedAskAiRequests).toHaveLength(2);
    expect(submittedAskAiRequests[1]).toEqual(submittedAskAiRequests[0]);
    expect(submittedAskAiRequests[0]).toMatchObject({
      gameContext: {
        playerCount: 3,
        players: [
          { label: "Player 1", lifeTotal: 38 },
          { label: "Player 2", lifeTotal: 24 },
          { label: "Player 3", lifeTotal: 17 }
        ],
        zones: {
          battlefield: expect.arrayContaining([expect.objectContaining({ name: "Lightning Bolt" })]),
          stack: expect.arrayContaining([expect.objectContaining({ name: "Opt" })])
        }
      }
    });
  });

  it("requires game context before showing stack builder", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByRole("heading", { name: "Game context" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Confirm game context" }));
    expect(screen.getByRole("heading", { name: "Zone confirmation" })).toBeInTheDocument();
    await advancePastZoneConfirm(user);
    expect(screen.getByRole("heading", { name: "Add cards to zones" })).toBeInTheDocument();
  });

  it("captures battlefield context and submits it in ask-ai payload", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Confirm game context" }));
    await advanceToZoneCollectionWithZones(user, ["Battlefield", "Stack"]);

    await selectZoneTab(user, "Battlefield");
    await addCardToActiveZone(user, "lig", "Lightning Bolt");
    await selectZoneTab(user, "Stack");
    await addCardToActiveZone(user, "opt", "Opt");
    await clickDecryptStack(user);

    const requestBody = await waitFor(() => {
      expect(submittedAskAiRequests.length).toBeGreaterThan(0);
      return submittedAskAiRequests[0];
    });

    expect(requestBody.gameContext.zones?.battlefield).toBeDefined();
    expect(requestBody.gameContext.zones?.battlefield?.[0]).toMatchObject({ name: "Lightning Bolt" });
  });

  it("allows battlefield context edits in enrichment step", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Confirm game context" }));
    await advanceToZoneCollectionWithZones(user, ["Battlefield", "Stack"]);

    await selectZoneTab(user, "Battlefield");
    await addCardToActiveZone(user, "lig", "Lightning Bolt");
    await selectZoneTab(user, "Stack");
    await addCardToActiveZone(user, "opt", "Opt");
    await advanceToContextEnrichmentFromZones(user);

    // Canonical zone order puts the Stack's Opt first; step to Lightning Bolt
    // (Battlefield) before editing its sheet.
    await user.click(screen.getByRole("button", { name: "OK — next card" }));
    await user.click(screen.getByRole("button", { name: "Add a note for Lightning Bolt" }));
    await user.type(screen.getByLabelText("Context notes for Lightning Bolt"), "Created by Storm count");
    await user.selectOptions(screen.getByLabelText("Add a target for Lightning Bolt"), "player:Player 2");

    await clickDecryptStack(user);
    const requestBody = await waitFor(() => {
      expect(submittedAskAiRequests.length).toBeGreaterThan(0);
      return submittedAskAiRequests[0];
    });

    const battlefieldCard = requestBody.gameContext.zones?.battlefield?.[0];
    expect(battlefieldCard?.name).toBe("Lightning Bolt");
    expect(battlefieldCard?.contextNotes).toBe("Created by Storm count");
    expect(battlefieldCard?.targets).toEqual([{ kind: "player", targetPlayer: "Player 2" }]);
  });

  it("edits command card ownership separately from zone-card targets in enrichment", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Confirm game context" }));
    await advanceToZoneCollectionWithZones(user, ["Battlefield", "Command Zone"]);

    await selectZoneTab(user, "Battlefield");
    await addCardToActiveZone(user, "lig", "Lightning Bolt");
    await selectZoneTab(user, "Command Zone");
    await addCardToActiveZone(user, "opt", "Opt");
    await advanceToContextEnrichmentFromZones(user);

    // Canonical zone order puts Battlefield's Lightning Bolt first; step to Opt
    // (Command Zone) before editing its sheet.
    await user.click(screen.getByRole("button", { name: "OK — next card" }));
    await user.selectOptions(screen.getByLabelText("Owner for Opt"), "Player 2");
    await user.selectOptions(screen.getByLabelText("Add a target for Opt"), "card:battlefield:lightning-bolt");

    await clickDecryptStack(user);
    const requestBody = await waitFor(() => {
      expect(submittedAskAiRequests.length).toBeGreaterThan(0);
      return submittedAskAiRequests[0];
    });

    const commandCard = requestBody.gameContext.zones?.command?.[0];
    expect(commandCard?.owner).toBe("Player 2");
    expect(commandCard?.targets).toEqual([
      {
        kind: "card",
        zone: "battlefield",
        cardId: "lightning-bolt",
        cardName: "Lightning Bolt"
      }
    ]);
  });

  it("keeps game context and zone card review state in parity with submitted payload", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Add player" }));
    await expandPlayerDetails(user);
    await user.clear(screen.getByLabelText("Player 1 life total"));
    await user.type(screen.getByLabelText("Player 1 life total"), "35");
    await user.clear(screen.getByLabelText("Player 2 life total"));
    await user.type(screen.getByLabelText("Player 2 life total"), "22");
    await user.clear(screen.getByLabelText("Player 3 life total"));
    await user.type(screen.getByLabelText("Player 3 life total"), "19");
    await user.click(screen.getByRole("button", { name: "Confirm game context" }));
    await advanceToZoneCollectionWithZones(user, ["Battlefield", "Stack"]);

    await selectZoneTab(user, "Battlefield");
    await addCardToActiveZone(user, "lig", "Lightning Bolt");
    await selectZoneTab(user, "Stack");
    await addCardToActiveZone(user, "opt", "Opt");
    await addCardToActiveZone(user, "cou", "Counterspell");
    await advanceToContextEnrichmentFromZones(user);

    // Canonical zone order puts the Stack's cards (Opt, then Counterspell) before
    // Battlefield's Lightning Bolt. Walk them one sheet at a time: each untouched
    // Mana spent box shows the printed mana value, fetched on demand (REQ-210), and
    // sends nothing unless edited.
    const optRow = screen.getByLabelText("Caster for Opt").closest("li") as HTMLElement;
    expect(within(optRow).getByLabelText("Caster for Opt")).toHaveValue("Player 1");
    await waitFor(() => expect(within(optRow).getByLabelText("Mana spent for Opt")).toHaveValue("1"));
    await user.click(within(optRow).getByRole("button", { name: "Add a note for Opt" }));
    expect(within(optRow).getByLabelText("Context notes for Opt")).toHaveValue("");

    await user.click(screen.getByRole("button", { name: "OK — next card" }));
    const counterspellRow = screen.getByLabelText("Caster for Counterspell").closest("li") as HTMLElement;
    expect(within(counterspellRow).getByLabelText("Caster for Counterspell")).toHaveValue("Player 1");
    await waitFor(() =>
      expect(within(counterspellRow).getByLabelText("Mana spent for Counterspell")).toHaveValue("2")
    );
    await user.click(within(counterspellRow).getByRole("button", { name: "Add a note for Counterspell" }));
    expect(within(counterspellRow).getByLabelText("Context notes for Counterspell")).toHaveValue("");

    await user.click(screen.getByRole("button", { name: "OK — next card" }));
    await user.click(screen.getByRole("button", { name: "OK — finish context" }));
    await user.type(screen.getByPlaceholderText("How does this resolve?"), "Can this be countered now?");

    await clickDecryptStack(user);
    const requestBody = await waitFor(() => {
      expect(submittedAskAiRequests.length).toBeGreaterThan(0);
      return submittedAskAiRequests[0];
    });

    expect(requestBody).toMatchObject({
      question: "Can this be countered now?",
      gameContext: {
        playerCount: 3,
        players: [
          { label: "Player 1", lifeTotal: 35 },
          { label: "Player 2", lifeTotal: 22 },
          { label: "Player 3", lifeTotal: 19 }
        ],
        zones: {
          battlefield: expect.arrayContaining([expect.objectContaining({ name: "Lightning Bolt" })]),
          stack: expect.arrayContaining([
            expect.objectContaining({ name: "Opt" }),
            expect.objectContaining({ name: "Counterspell" })
          ])
        }
      }
    });
  });

  it("keeps reviewed stack order and question in parity with submitted payload", async () => {
    const user = userEvent.setup();
    render(<App />);

    await openStackBuilder(user);
    await addCardToStack(user, "lig", "Lightning Bolt");
    await addCardToStack(user, "opt", "Opt");
    await addCardToStack(user, "cou", "Counterspell");
    await advanceToContextEnrichment(user);

    // One compact sheet at a time (REQ-017) walks add order, confirming it rather
    // than comparing simultaneous DOM positions.
    expect(screen.getByText("Card 1 of 3")).toBeInTheDocument();
    expect(screen.getByLabelText("Caster for Lightning Bolt")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "OK — next card" }));
    expect(screen.getByText("Card 2 of 3")).toBeInTheDocument();
    expect(screen.getByLabelText("Caster for Opt")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "OK — next card" }));
    expect(screen.getByText("Card 3 of 3")).toBeInTheDocument();
    expect(screen.getByLabelText("Caster for Counterspell")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "OK — finish context" }));

    const reviewedQuestion = "Does this ordering resolve correctly?";
    await user.type(screen.getByPlaceholderText("How does this resolve?"), reviewedQuestion);
    await clickDecryptStack(user);

    const requestBody = await waitFor(() => {
      expect(submittedAskAiRequests.length).toBeGreaterThan(0);
      return submittedAskAiRequests[0];
    });

    expect(requestBody.question).toBe(reviewedQuestion);
    expect(requestBody.gameContext.zones?.stack?.map((item) => item.name)).toEqual([
      "Lightning Bolt",
      "Opt",
      "Counterspell"
    ]);
  });

  it("does not show battlefield item name before selection and shows preview after selection", async () => {
    const user = userEvent.setup();
    render(<App />);

    await advanceToBattlefieldZoneCollection(user);
    await user.click(screen.getByRole("button", { name: "Add a card to Battlefield" }));
    const battlefieldSearchInput = screen.getByLabelText("Battlefield search input");
    expect(screen.queryByLabelText("Battlefield item name")).not.toBeInTheDocument();

    await user.type(battlefieldSearchInput, "lig");
    expect(screen.queryByLabelText("Battlefield item name")).not.toBeInTheDocument();

    await user.click(await screen.findByRole("button", { name: "Lightning Bolt" }));
    expect(screen.queryByLabelText("Battlefield item name")).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Lightning Bolt" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Battlefield item details")).not.toBeInTheDocument();
  });

  it("hides battlefield target controls until a card is selected", async () => {
    const user = userEvent.setup();
    render(<App />);

    await advanceToBattlefieldZoneCollection(user);

    expect(screen.queryByLabelText("Battlefield target kind")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add battlefield target" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add battlefield item" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Add a card to Battlefield" }));
    await user.type(screen.getByLabelText("Battlefield search input"), "lig");
    await user.click(await screen.findByRole("button", { name: "Lightning Bolt" }));

    expect(screen.queryByLabelText("Battlefield target kind")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add battlefield target" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add card" })).toBeInTheDocument();
  });
});
});
