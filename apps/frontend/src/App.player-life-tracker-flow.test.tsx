import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import type { ZoneAskAiPayload } from "./lib/contextFlow";
import { TRACKER_STORAGE_KEY } from "./lib/lifeTracker/persistence";
import { saveActiveDestinationId } from "./lib/portal/activeDestinationPrefs";
import {
  addCardToActiveZone,
  advanceToContextEnrichmentFromZones,
  advanceToZoneCollectionWithZones,
  baseCardMetadataFixture,
  clickDecryptStack,
  createMemoryStorage,
  getUrlFromRequest,
  jsonResponse,
  selectZoneTab
} from "./test/appTestHelpers";

async function selectDestination(
  user: ReturnType<typeof userEvent.setup>,
  destinationName: string
): Promise<void> {
  await user.click(screen.getByRole("button", { name: "Switch feature" }));
  await user.click(screen.getByRole("menuitem", { name: destinationName }));
}

function lifeCard(player: string): HTMLElement {
  return screen.getByTestId(`life-card-${player}`);
}

async function setCounterValue(
  user: ReturnType<typeof userEvent.setup>,
  counterName: string,
  amount: string
): Promise<void> {
  await user.click(screen.getByRole("button", { name: `Options for ${counterName}` }));
  const options = screen.getByRole("group", { name: `${counterName} options` });
  const input = within(options).getByRole("spinbutton", { name: `Set ${counterName}` });
  await user.clear(input);
  await user.type(input, amount);
  await user.click(within(options).getByRole("button", { name: `Apply ${counterName} value` }));
}

describe("Frontend - Portal", () => {
  const submittedRequests: ZoneAskAiPayload[] = [];

  beforeEach(() => {
    submittedRequests.length = 0;
    vi.stubGlobal("localStorage", createMemoryStorage());
    vi.stubGlobal("sessionStorage", createMemoryStorage());
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const url = getUrlFromRequest(input);
        if (url === "/data/cardMetadata.json") {
          return jsonResponse(baseCardMetadataFixture);
        }
        if (url.includes("gameRulesCoreTopics")) {
          return jsonResponse([]);
        }
        if (url.endsWith("/api/ask-ai")) {
          submittedRequests.push(JSON.parse(String(init?.body)) as ZoneAskAiPayload);
          return jsonResponse({ answer: "Integrated answer" });
        }
        return jsonResponse({ error: "not found" }, 404);
      })
    );
    saveActiveDestinationId("player-life-tracker");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("carries a persisted live table through one-way Assistant handoff without cross-player or reverse-sync leaks", async () => {
    const user = userEvent.setup();
    const firstMount = render(<App />);

    expect(screen.getByTestId("life-tracker-table")).toHaveAttribute("aria-label", "4-player life table");
    expect(within(lifeCard("Player 1")).getByText("40")).toBeInTheDocument();
    expect(within(lifeCard("Player 2")).getByText("40")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Open game setup" }));
    expect(screen.getByRole("dialog", { name: "Game Setup" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Edit player names" }));
    const playerOneName = screen.getByLabelText("Player 1 display name");
    await user.clear(playerOneName);
    await user.type(playerOneName, "Alice");
    await user.click(screen.getByRole("button", { name: "Close game setup" }));

    const decreaseAlice = () => screen.getByRole("button", { name: /Decrease life for Player 1/ });
    await user.click(decreaseAlice());
    expect(within(lifeCard("Player 1")).getByText("39")).toBeInTheDocument();
    expect(within(lifeCard("Player 2")).getByText("40")).toBeInTheDocument();

    for (let amount = 39; amount > 0; amount -= 1) {
      await user.click(decreaseAlice());
    }
    expect(screen.getByRole("img", { name: "Player 1 (Alice) is at zero or less life" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Increase life for Player 1/ }));
    expect(screen.queryByRole("img", { name: /Player 1 \(Alice\) is at zero or less life/ })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Open game setup" }));
    await user.click(screen.getByRole("button", { name: "Set starting life to 40" }));
    await user.click(screen.getByRole("button", { name: "Close game setup" }));
    await user.click(decreaseAlice());
    expect(within(lifeCard("Player 1")).getByText("39")).toBeInTheDocument();
    expect(within(lifeCard("Player 2")).getByText("40")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Open counters for Player 1 (Alice)" }));
    for (let amount = 0; amount < 5; amount += 1) {
      await user.click(screen.getByRole("button", { name: "Increase commander damage from Player 2" }));
    }
    await user.click(screen.getByRole("tab", { name: "Counters" }));
    await setCounterValue(user, "Poison", "3");
    await user.click(screen.getByRole("button", { name: "Increment Monarch" }));
    await user.click(screen.getByRole("button", { name: "Close counters" }));

    const persistedBeforeReload = localStorage.getItem(TRACKER_STORAGE_KEY);
    expect(persistedBeforeReload).not.toBeNull();

    firstMount.unmount();
    render(<App />);

    expect(lifeCard("Player 1")).toHaveAttribute("aria-label", "Player 1 (Alice), 34 life");
    expect(lifeCard("Player 2")).toHaveAttribute("aria-label", "Player 2, 40 life");
    await user.click(screen.getByRole("button", { name: "Open counters for Player 1 (Alice)" }));
    expect(screen.getByTestId("commander-value-Player 2")).toHaveTextContent("5");
    await user.click(screen.getByRole("tab", { name: "Counters" }));
    expect(screen.getByRole("button", { name: "Increment Poison" })).toHaveTextContent("3");
    expect(screen.getByRole("button", { name: "Increment Monarch" })).toHaveTextContent("1");
    await user.click(screen.getByRole("button", { name: "Close counters" }));

    const trackerSnapshot = localStorage.getItem(TRACKER_STORAGE_KEY);
    expect(trackerSnapshot).toBe(persistedBeforeReload);
    await selectDestination(user, "In-Depth Question");

    const assistantLife = await screen.findByLabelText("Player 1 life total");
    expect(screen.getByLabelText("Player 1 display name")).toHaveValue("Alice");
    expect(assistantLife).toHaveValue("34");
    expect(screen.getByLabelText("Player 1 poison")).toHaveValue("3");
    expect(screen.getByLabelText("Player 1 commander damage from Player 2")).toHaveValue("5");
    expect(screen.getByLabelText("Player 1 counter Monarch amount")).toHaveValue("1");

    await user.clear(assistantLife);
    await user.type(assistantLife, "12");
    await user.clear(screen.getByLabelText("Player 1 poison"));
    await user.type(screen.getByLabelText("Player 1 poison"), "8");
    await user.clear(screen.getByLabelText("Player 1 counter Monarch amount"));
    await user.type(screen.getByLabelText("Player 1 counter Monarch amount"), "0");

    await selectDestination(user, "Quick Question");
    await selectDestination(user, "In-Depth Question");
    expect(screen.getByLabelText("Player 1 life total")).toHaveValue("12");
    expect(screen.getByLabelText("Player 1 poison")).toHaveValue("8");
    expect(screen.getByLabelText("Player 1 counter Monarch amount")).toHaveValue("0");

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
      lifeTotal: 12,
      poison: 8,
      commanderDamage: [{ from: "Player 2", amount: 5 }]
    });
    expect(submittedRequests[0]?.gameContext.players[1]).toEqual({
      label: "Player 2",
      lifeTotal: 40
    });
    expect(submittedRequests[0]?.gameContext.players[0]).not.toHaveProperty("energy");
    expect(submittedRequests[0]?.gameContext.players[0]).not.toHaveProperty("counters");

    await selectDestination(user, "Life Tracker");
    expect(localStorage.getItem(TRACKER_STORAGE_KEY)).toBe(trackerSnapshot);
    expect(lifeCard("Player 1")).toHaveAttribute("aria-label", "Player 1 (Alice), 34 life");
    expect(lifeCard("Player 2")).toHaveAttribute("aria-label", "Player 2, 40 life");
    await user.click(screen.getByRole("button", { name: "Open counters for Player 1 (Alice)" }));
    expect(screen.getByTestId("commander-value-Player 2")).toHaveTextContent("5");
    await user.click(screen.getByRole("tab", { name: "Counters" }));
    expect(screen.getByRole("button", { name: "Increment Poison" })).toHaveTextContent("3");
    expect(screen.getByRole("button", { name: "Increment Monarch" })).toHaveTextContent("1");
    // Outlier test: drives the full tracker -> counters -> reload -> Assistant
    // handoff -> edit -> return journey through real components. It runs ~1.5-2.6s
    // locally but crosses the default 5000ms testTimeout under coverage
    // instrumentation or contended CI runners, so it gets explicit headroom.
  }, 20000);
});
