import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AssistantSeedContext, type LookupCarrySeed } from "../../lib/portal/seedContext";
import { baseCardMetadataFixture, getUrlFromRequest, jsonResponse, setSelectedZones } from "../../test/appTestHelpers";
import { MtgAssistantApp } from "./MtgAssistantApp";

function renderWithCarry(carry: LookupCarrySeed | null): void {
  let pendingCarry = carry;
  render(
    <MemoryRouter initialEntries={["/in-depth"]}>
      <AssistantSeedContext.Provider
        value={{
          queueSeed: vi.fn(),
          consumeSeed: () => null,
          queueLookupCarry: vi.fn(),
          consumeLookupCarry: () => {
            const pending = pendingCarry;
            pendingCarry = null;
            return pending;
          },
          queueHistoryResume: vi.fn(),
          consumeHistoryResume: () => null,
          queueHistoryDeletion: vi.fn(),
          consumeHistoryDeletion: () => null,
          queueDraftResume: vi.fn(),
          consumeDraftResume: () => false,
          historyResumeVersion: 0
        }}
      >
        <MtgAssistantApp />
      </AssistantSeedContext.Provider>
    </MemoryRouter>
  );
}

/** Walks a fresh mount through Game context and Zones (station 1 then 2) — carried
 * cards wait until the player naturally reaches the Cards station (REQ-209: the walk
 * still starts at station 1; carried cards do not skip Game or Zones). `preselected`
 * is the zone or zones the player manually checks at the Zones station; placement can
 * still add more beyond these. */
async function reachCardsStationWithZones(
  user: ReturnType<typeof userEvent.setup>,
  preselected: string[]
): Promise<void> {
  await screen.findByRole("button", { name: "Confirm game context" });
  await user.click(screen.getByRole("button", { name: "Confirm game context" }));
  await setSelectedZones(user, preselected);
  await user.click(screen.getByRole("button", { name: "Continue" }));
}

describe("Frontend - MTG Assistant", () => {
  describe("In-depth details — carried-card placement (REQ-018/REQ-206/REQ-209)", () => {
    beforeEach(() => {
      vi.stubGlobal(
        "fetch",
        vi.fn(async (input: RequestInfo | URL): Promise<Response> => {
          const url = getUrlFromRequest(input);
          if (url === "/data/cardMetadata.json") {
            return jsonResponse(baseCardMetadataFixture);
          }
          return jsonResponse({ error: "not found" }, 404);
        })
      );
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("shows the placement gate for every carried card, one at a time, with a counter, once the walk reaches Cards", async () => {
      const user = userEvent.setup();
      renderWithCarry({
        cards: [
          { cardId: "opt", name: "Opt", imageId: "", colors: ["U"] },
          { cardId: "lightning-bolt", name: "Lightning Bolt", imageId: "lightning-bolt-fixture-id", colors: ["R"] }
        ],
        question: ""
      });

      // REQ-209: the walk still starts at station 1 (Game); the placement gate only
      // appears once the player reaches Cards — carried cards do not skip Game or Zones.
      expect(screen.queryByTestId("card-placement-gate")).not.toBeInTheDocument();
      await reachCardsStationWithZones(user, ["Hand"]);

      expect(await screen.findByTestId("card-placement-gate")).toBeInTheDocument();
      expect(screen.getAllByText("Opt").length).toBeGreaterThan(0);
      expect(screen.getByText("Card 1 of 2")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Leave this card out" })).toBeInTheDocument();
      // Placement offers every zone, including ones the player did not pre-select.
      expect(screen.getByRole("button", { name: "Stack" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Battlefield" })).toBeInTheDocument();

      // D7: nothing else on the Cards station renders while a carried card is unplaced.
      expect(screen.queryByRole("button", { name: "Zone tab: Hand" })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Continue" })).not.toBeInTheDocument();
    });

    it("places a carried card into the tapped zone, selecting that zone, and advances to the next card", async () => {
      const user = userEvent.setup();
      renderWithCarry({
        cards: [
          { cardId: "opt", name: "Opt", imageId: "", colors: ["U"] },
          { cardId: "lightning-bolt", name: "Lightning Bolt", imageId: "lightning-bolt-fixture-id", colors: ["R"] }
        ],
        question: ""
      });

      await reachCardsStationWithZones(user, ["Hand"]);
      await screen.findByTestId("card-placement-gate");
      // Places into a zone the player never pre-selected at Zones — placement adds it.
      await user.click(screen.getByRole("button", { name: "Stack" }));

      expect((await screen.findAllByText("Lightning Bolt")).length).toBeGreaterThan(0);
      expect(screen.getByText("Card 2 of 2")).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Battlefield" }));

      // Both carried cards resolved: the normal Cards station appears, the Stack and
      // Battlefield zones were auto-selected by placement alongside the pre-selected
      // Hand, and each card landed where it was placed.
      // Look-matching pass (slice N): zone tabs are pills with the count in its own
      // bold span now (`in-depth-question.html:141-144`), not a "(N)" suffix.
      expect(await screen.findByRole("button", { name: "Zone tab: Stack" })).toHaveTextContent("Stack1");
      expect(screen.getByRole("button", { name: "Zone tab: Battlefield" })).toHaveTextContent("Battlefield1");
      expect(screen.getByRole("button", { name: "Zone tab: Hand" })).toHaveTextContent("Hand0");
      expect(screen.getByText("Opt")).toBeInTheDocument();
    });

    it("leaves a card out without placing it, and does not add its zone", async () => {
      const user = userEvent.setup();
      renderWithCarry({
        cards: [{ cardId: "opt", name: "Opt", imageId: "", colors: ["U"] }],
        question: ""
      });

      await reachCardsStationWithZones(user, ["Hand"]);
      await screen.findByTestId("card-placement-gate");
      await user.click(screen.getByRole("button", { name: "Leave this card out" }));

      // No carried cards remain: the Cards station shows its normal (pre-selected-only)
      // zone tabs, with no zone added by the skipped placement and Opt nowhere in it.
      expect(await screen.findByRole("button", { name: "Zone tab: Hand" })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Zone tab: Stack" })).not.toBeInTheDocument();
      expect(screen.queryByText("Opt")).not.toBeInTheDocument();
    });
  });
});
