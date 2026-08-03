import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { saveActiveDestinationId } from "./lib/portal/activeDestinationPrefs";
import {
  createInitialState,
  setNamedCounter,
  setPlayerDisplayName,
  setCommanderDamage
} from "./lib/lifeTracker/state";
import { saveTrackerState, TRACKER_STORAGE_KEY } from "./lib/lifeTracker/persistence";

function createMemoryStorage(): Storage {
  const entries = new Map<string, string>();
  return {
    get length() {
      return entries.size;
    },
    clear: () => entries.clear(),
    getItem: (key) => entries.get(key) ?? null,
    key: (index) => Array.from(entries.keys())[index] ?? null,
    removeItem: (key) => {
      entries.delete(key);
    },
    setItem: (key, value) => {
      entries.set(key, String(value));
    }
  };
}

function seededTrackerState() {
  let state = createInitialState(4, 40);
  state = setPlayerDisplayName(state, "Player 1", "Alice");
  state = setNamedCounter(state, "Player 1", "poison", 3);
  state = setCommanderDamage(state, "Player 1", "Player 2", 5);
  return state;
}

async function selectDestination(user: ReturnType<typeof userEvent.setup>, name: string): Promise<void> {
  await user.click(screen.getByRole("button", { name: "Switch feature" }));
  await user.click(screen.getByRole("menuitem", { name }));
}

describe("Frontend - Portal", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createMemoryStorage());
    vi.stubGlobal("sessionStorage", createMemoryStorage());
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = typeof input === "string" ? input : input.toString();
        if (url.includes("cardMetadata") || url.includes("gameRulesCoreTopics")) {
          return new Response("[]", { status: 200, headers: { "Content-Type": "application/json" } });
        }
        return new Response(JSON.stringify({ answer: "ok" }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("seeds a previously mounted Assistant only on the direct tracker-to-Assistant transition", async () => {
    const user = userEvent.setup();
    saveTrackerState(seededTrackerState());
    render(<App />);

    expect(screen.getByRole("heading", { name: "Game context" })).toBeInTheDocument();
    await selectDestination(user, "Life Tracker");
    await selectDestination(user, "In-Depth Question");

    expect(await screen.findByLabelText("Player 1 display name")).toHaveValue("Alice");
    expect(screen.getByLabelText("Player 1 life total")).toHaveValue("40");
    expect(screen.getByLabelText("Player 1 poison")).toHaveValue("3");
    expect(screen.getByLabelText("Player 1 commander damage from Player 2")).toHaveValue("5");
    expect(screen.getByLabelText("Player 4 display name")).toHaveValue("Player 4");
  });

  it("does not seed after tracker-to-Quick-to-Assistant routing", async () => {
    const user = userEvent.setup();
    saveTrackerState(seededTrackerState());
    saveActiveDestinationId("player-life-tracker");
    render(<App />);

    await selectDestination(user, "Quick Question");
    await selectDestination(user, "In-Depth Question");
    await user.click(screen.getByRole("button", { name: "Show player details" }));

    expect(screen.getByLabelText("Player 1 display name")).toHaveValue("Player 1");
    expect(screen.getByLabelText("Player 1 life total")).toHaveValue("20");
    expect(screen.queryByLabelText("Player 1 poison")).toHaveValue("");
    expect(screen.getByText("2 players")).toBeInTheDocument();
  });

  it("consumes the seed once so later unrelated re-entry does not clobber Assistant edits", async () => {
    const user = userEvent.setup();
    saveTrackerState(seededTrackerState());
    saveActiveDestinationId("player-life-tracker");
    render(<App />);

    await selectDestination(user, "In-Depth Question");
    const nameInput = await screen.findByLabelText("Player 1 display name");
    await user.clear(nameInput);
    await user.type(nameInput, "Edited in Assistant");
    await selectDestination(user, "Quick Question");
    await selectDestination(user, "In-Depth Question");

    expect(screen.getByLabelText("Player 1 display name")).toHaveValue("Edited in Assistant");
  });

  it("never writes Assistant edits back to the tracker snapshot", async () => {
    const user = userEvent.setup();
    saveTrackerState(seededTrackerState());
    const before = localStorage.getItem(TRACKER_STORAGE_KEY);
    saveActiveDestinationId("player-life-tracker");
    render(<App />);

    await selectDestination(user, "In-Depth Question");
    const lifeInput = await screen.findByLabelText("Player 1 life total");
    await user.clear(lifeInput);
    await user.type(lifeInput, "12");
    const poisonInput = screen.getByLabelText("Player 1 poison");
    await user.clear(poisonInput);
    await user.type(poisonInput, "8");
    await selectDestination(user, "Life Tracker");

    await waitFor(() => expect(localStorage.getItem(TRACKER_STORAGE_KEY)).toBe(before));
  });
});
