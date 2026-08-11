import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ZoneAskAiPayload } from "../../lib/contextFlow";
import type { RosterSeed } from "../../lib/lifeTracker/seed";
import { AssistantSeedContext } from "../../lib/portal/seedContext";
import {
  addCardToActiveZone,
  advanceToContextEnrichmentFromZones,
  advanceToZoneCollectionWithZones,
  baseCardMetadataFixture,
  clickDecryptStack,
  expandSecondaryPlayerDetails,
  getUrlFromRequest,
  jsonResponse,
  selectZoneTab
} from "../../test/appTestHelpers";
import { MtgAssistantApp } from "./MtgAssistantApp";

const fourPlayerSeed: RosterSeed = {
  playerCount: 4,
  players: [
    {
      label: "Player 1",
      displayName: "Alice",
      lifeTotal: 27,
      poison: 3,
      energy: 2,
      experience: 4,
      commanderDamage: [{ from: "Player 2", amount: 5 }],
      counters: [
        { name: "Monarch", amount: 1 },
        { name: "Shield", amount: 6 },
        { name: "Charge", amount: 2 }
      ]
    },
    { label: "Player 2", lifeTotal: 31 },
    { label: "Player 3", displayName: "Chandra", lifeTotal: 18 },
    { label: "Player 4", lifeTotal: 40 }
  ]
};

function renderWithSeed(seed: RosterSeed): void {
  let pendingSeed: RosterSeed | null = seed;
  render(
    <AssistantSeedContext.Provider
      value={{
        queueSeed: vi.fn(),
        consumeSeed: () => {
          const pending = pendingSeed;
          pendingSeed = null;
          return pending;
        }
      }}
    >
      <MtgAssistantApp />
    </AssistantSeedContext.Provider>
  );
}

describe("Frontend - MTG Assistant", () => {
  const submittedRequests: ZoneAskAiPayload[] = [];

  beforeEach(() => {
    submittedRequests.length = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const url = getUrlFromRequest(input);
        if (url === "/data/cardMetadata.json") {
          return jsonResponse(baseCardMetadataFixture);
        }
        if (url.endsWith("/api/ask-ai")) {
          submittedRequests.push(JSON.parse(String(init?.body)) as ZoneAskAiPayload);
          return jsonResponse({ answer: "ok" });
        }
        return jsonResponse({ error: "not found" }, 404);
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("consumes a roster seed with counter inputs hidden until the shared arrow is activated", async () => {
    const user = userEvent.setup();
    renderWithSeed(fourPlayerSeed);

    expect(await screen.findByLabelText("Player 1 display name")).toHaveValue("Alice");
    expect(screen.getByLabelText("Player 1 life total")).toHaveValue("27");
    expect(screen.getByText("4 players")).toBeInTheDocument();
    expect(
      screen.getByText("Tap the arrow to set names and life totals — 2 players start at 20, 3+ at 40.")
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Player 1 poison")).not.toBeInTheDocument();

    await expandSecondaryPlayerDetails(user);

    expect(screen.getByLabelText("Player 1 poison")).toHaveValue("3");
    expect(screen.getByLabelText("Player 1 energy")).toHaveValue("2");
    expect(screen.getByLabelText("Player 1 experience")).toHaveValue("4");
    expect(screen.getByLabelText("Player 1 commander damage from Player 2")).toHaveValue("5");
    expect(screen.getByLabelText("Player 1 counter Monarch amount")).toHaveValue("1");
    expect(screen.getByLabelText("Player 4 poison")).toBeInTheDocument();
  });

  it("offers bounded scalar counter selects with an explicit unset option", async () => {
    const user = userEvent.setup();
    renderWithSeed(fourPlayerSeed);
    await expandSecondaryPlayerDetails(user);

    const bounds: Array<[string, number]> = [
      ["poison", 11],
      ["energy", 100],
      ["experience", 100]
    ];

    for (const [field, max] of bounds) {
      const select = screen.getByLabelText(`Player 1 ${field}`);
      expect(select.tagName).toBe("SELECT");
      const values = [...(select as HTMLSelectElement).options].map((option) => option.value);
      expect(values[0]).toBe("");
      expect(values.slice(1)).toEqual(
        Array.from({ length: max + 1 }, (_, index) => String(index))
      );
      // Out-of-range values are simply not offered.
      expect(values).not.toContain(String(max + 1));
    }

    const poison = screen.getByLabelText("Player 1 poison");
    await user.selectOptions(poison, "");
    expect(poison).toHaveValue("");
    await user.selectOptions(poison, "11");
    expect(poison).toHaveValue("11");
  });

  it("keeps a seeded value outside the offered range selectable", async () => {
    const user = userEvent.setup();
    renderWithSeed({
      ...fourPlayerSeed,
      players: [{ ...fourPlayerSeed.players[0], poison: 40 }, ...fourPlayerSeed.players.slice(1)]
    });
    await expandSecondaryPlayerDetails(user);

    const poison = screen.getByLabelText("Player 1 poison");
    expect(poison).toHaveValue("40");
    expect([...(poison as HTMLSelectElement).options].map((option) => option.value)).toContain("40");
  });

  it("stacks the scalar counters and groups counter rows with one shared row pattern", async () => {
    const user = userEvent.setup();
    renderWithSeed(fourPlayerSeed);
    await expandSecondaryPlayerDetails(user);

    const scalarRows = ["poison", "energy", "experience"].map((field) =>
      screen.getByLabelText(`Player 1 ${field}`).closest("label")
    );
    const scalarStack = scalarRows[0]!.parentElement!;
    expect(scalarStack.className).toContain("flex-col");
    expect(scalarStack.className).not.toMatch(/grid-cols-3/);
    for (const row of scalarRows) {
      expect(row!.parentElement).toBe(scalarStack);
    }

    // Commander-damage and named-counter rows consume the same grouped row pattern:
    // a content-sized leading element, one declared gap, then the numeric input.
    const commanderRow = screen
      .getByLabelText("Player 1 commander damage from Player 2")
      .closest("label")!;
    const namedCounterRow = screen.getByLabelText("Player 1 counter Monarch amount").parentElement!;
    expect(namedCounterRow.className).toBe(commanderRow.className);
    expect(commanderRow.className).toContain("gap-2");
    expect(commanderRow.className).not.toMatch(/grid-cols-\[1fr_auto\]/);
    expect(scalarRows[0]!.className).toBe(commanderRow.className);
  });

  it("keeps commander damage a free-typed unbounded numeric input", async () => {
    const user = userEvent.setup();
    renderWithSeed(fourPlayerSeed);
    await expandSecondaryPlayerDetails(user);

    const commanderDamage = screen.getByLabelText("Player 1 commander damage from Player 2");
    expect(commanderDamage.tagName).toBe("INPUT");
    expect(commanderDamage).toHaveAttribute("inputMode", "numeric");
    expect(commanderDamage).not.toHaveAttribute("max");

    await user.clear(commanderDamage);
    await user.type(commanderDamage, "137");
    expect(commanderDamage).toHaveValue("137");
  });

  it("keeps the shared expanded state and existing values across add and remove", async () => {
    const user = userEvent.setup();
    renderWithSeed(fourPlayerSeed);

    await expandSecondaryPlayerDetails(user);
    expect(screen.getByLabelText("Player 1 poison")).toHaveValue("3");

    await user.click(screen.getByRole("button", { name: "Add player" }));
    expect(screen.getByText("5 players")).toBeInTheDocument();
    expect(screen.getByLabelText("Player 5 poison")).toBeInTheDocument();
    expect(screen.getByLabelText("Player 1 poison")).toHaveValue("3");

    await user.click(screen.getByRole("button", { name: "Remove last player" }));
    expect(screen.getByText("4 players")).toBeInTheDocument();
    expect(screen.getByLabelText("Player 1 poison")).toHaveValue("3");
    expect(screen.getByLabelText("Player 4 poison")).toBeInTheDocument();
  });

  it("collapses secondary details on outer roster close and preserves values through reopen and re-expand", async () => {
    const user = userEvent.setup();
    renderWithSeed(fourPlayerSeed);

    await expandSecondaryPlayerDetails(user);
    expect(screen.getByLabelText("Player 1 poison")).toHaveValue("3");

    await user.click(screen.getByRole("button", { name: "Hide player details" }));
    expect(screen.queryByLabelText("Player 1 display name")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Show player details" }));
    expect(screen.getByLabelText("Player 1 display name")).toHaveValue("Alice");
    expect(screen.queryByLabelText("Player 1 poison")).not.toBeInTheDocument();

    await expandSecondaryPlayerDetails(user);
    expect(screen.getByLabelText("Player 1 poison")).toHaveValue("3");
    expect(screen.getByLabelText("Player 1 counter Monarch amount")).toHaveValue("1");
  });

  it("submits edited populated counters while omitting zero and empty values", async () => {
    const user = userEvent.setup();
    renderWithSeed(fourPlayerSeed);

    await expandSecondaryPlayerDetails(user);
    const poison = screen.getByLabelText("Player 1 poison");
    await user.selectOptions(poison, "8");
    await user.selectOptions(screen.getByLabelText("Player 1 energy"), "0");
    await user.clear(screen.getByLabelText("Player 1 counter Monarch amount"));
    await user.type(screen.getByLabelText("Player 1 counter Monarch amount"), "0");
    await user.clear(screen.getByLabelText("Player 1 counter Shield name"));
    await user.clear(screen.getByLabelText("Player 1 counter Charge amount"));
    await user.type(screen.getByLabelText("Player 1 counter Charge amount"), "7");

    // Collapse and re-expand secondary details before submitting to prove disclosure
    // toggles never alter the underlying counter values.
    const [hideArrow] = screen.getAllByRole("button", { name: "Hide secondary details for all players" });
    await user.click(hideArrow);
    await expandSecondaryPlayerDetails(user);

    await user.click(screen.getByRole("button", { name: "Confirm game context" }));
    await advanceToZoneCollectionWithZones(user, ["Stack"]);
    await selectZoneTab(user, "Stack");
    await addCardToActiveZone(user, "opt", "Opt");
    await advanceToContextEnrichmentFromZones(user);
    await clickDecryptStack(user);

    await waitFor(() => expect(submittedRequests).toHaveLength(1));
    expect(submittedRequests[0]?.gameContext.players[0]).toEqual({
      label: "Player 1",
      displayName: "Alice",
      lifeTotal: 27,
      poison: 8,
      experience: 4,
      commanderDamage: [{ from: "Player 2", amount: 5 }],
      counters: [{ name: "Charge", amount: 7 }]
    });
    expect(submittedRequests[0]?.gameContext.players[1]).toEqual({
      label: "Player 2",
      lifeTotal: 31
    });
  });

  it("returns to game context on start over while preserving roster/life/counter fields", async () => {
    const user = userEvent.setup();
    renderWithSeed(fourPlayerSeed);

    await user.click(screen.getByRole("button", { name: "Confirm game context" }));
    await advanceToZoneCollectionWithZones(user, ["Stack"]);
    await selectZoneTab(user, "Stack");
    await addCardToActiveZone(user, "opt", "Opt");
    await advanceToContextEnrichmentFromZones(user);
    await user.type(
      screen.getByPlaceholderText("How does this resolve?"),
      "What happens if this resolves?"
    );
    await clickDecryptStack(user);

    expect(await screen.findByText("ok")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Start Over" }));

    expect(screen.getByRole("heading", { name: "Game context" })).toBeInTheDocument();
    expect(await screen.findByLabelText("Player 1 display name")).toHaveValue("Alice");
    expect(screen.getByLabelText("Player 1 life total")).toHaveValue("27");

    await expandSecondaryPlayerDetails(user);
    expect(screen.getByLabelText("Player 1 poison")).toHaveValue("3");
    expect(screen.getByLabelText("Player 1 counter Monarch amount")).toHaveValue("1");

    await user.click(screen.getByRole("button", { name: "Confirm game context" }));
    await advanceToZoneCollectionWithZones(user, ["Stack"]);
    await selectZoneTab(user, "Stack");
    expect(screen.queryByText("Opt")).not.toBeInTheDocument();
    await addCardToActiveZone(user, "opt", "Opt");
    await advanceToContextEnrichmentFromZones(user);
    expect(screen.getByPlaceholderText("How does this resolve?")).toHaveValue("");
  });
});
