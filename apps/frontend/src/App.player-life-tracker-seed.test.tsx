import { act, render, screen, waitFor } from "@testing-library/react";
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
import { expandSecondaryPlayerDetails,
  navigateToPath,
  startOnInDepthQuestion
} from "./test/appTestHelpers";

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

// REQ-067/REQ-206: the Menu lists one question door — "Ask a Question" (not
// "Quick Question"), and `in-depth` has no row of its own, so "In-Depth
// Question" is reached by direct navigation instead of a menu click.
async function selectDestination(user: ReturnType<typeof userEvent.setup>, name: string): Promise<void> {
  if (name === "In-Depth Question") {
    await navigateToPath("/in-depth");
    return;
  }
  const menuLabel = name === "Quick Question" ? "Ask a Question" : name;
  await user.click(screen.getByRole("button", { name: "Switch feature" }));
  await user.click(screen.getByRole("menuitem", { name: menuLabel }));
}

// REQ-206 (slice C, 2026-10-01): the Life Tracker -> Assistant roster-seed hand-off's
// only live trigger now is Ask a Question's "Add in-depth details" carry — the Menu's
// retired "In-Depth Question" row was the old one-hop gesture; this is the new one-hop
// equivalent (Life Tracker -> Ask a Question -> Add in-depth details), narrowly tied to
// the explicit carry button the same way the old gesture was narrowly tied to the Menu
// row (see the negative tests above, unchanged: a deep link, browser Back, or a raw
// route jump to `/in-depth` still never seeds).
async function carryIntoInDepthDetails(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await user.click(screen.getByRole("button", { name: "Switch feature" }));
  await user.click(screen.getByRole("menuitem", { name: "Ask a Question" }));
  await user.click(screen.getByRole("button", { name: "Add in-depth details" }));
}

describe("Frontend - Portal", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createMemoryStorage());
    vi.stubGlobal("sessionStorage", createMemoryStorage());
    startOnInDepthQuestion();
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

  // REQ-206 (slice C, 2026-10-01): un-skipped — the hand-off's new trigger is Ask a
  // Question's "Add in-depth details" carry (see `carryIntoInDepthDetails` above).
  it("seeds a previously mounted Assistant only on the direct tracker-to-Assistant carry", async () => {
    const user = userEvent.setup();
    saveTrackerState(seededTrackerState());
    render(<App />);

    expect(screen.getByRole("heading", { name: "Game context" })).toBeInTheDocument();
    await selectDestination(user, "Life Tracker");
    await carryIntoInDepthDetails(user);

    expect(await screen.findByLabelText("Player 1 display name")).toHaveValue("Alice");
    expect(screen.getByLabelText("Player 1 life total")).toHaveValue("35");
    expect(screen.queryByLabelText("Player 1 poison")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Player 4 display name")).toHaveValue("Player 4");

    await expandSecondaryPlayerDetails(user);
    expect(screen.getByLabelText("Player 1 poison")).toHaveValue("3");
    expect(screen.getByLabelText("Player 1 commander damage from Player 2")).toHaveValue("5");
  });

  it("does not seed an Assistant reached by a direct deep link", async () => {
    const user = userEvent.setup();
    saveTrackerState(seededTrackerState());
    window.history.replaceState(null, "", "/in-depth");

    render(<App />);
    await user.click(screen.getByRole("button", { name: "Show player details" }));

    expect(screen.getByLabelText("Player 1 display name")).toHaveValue("Player 1");
    expect(screen.getByLabelText("Player 1 life total")).toHaveValue("20");
  });

  it("does not seed an Assistant reached from Life Tracker with browser Back", async () => {
    const user = userEvent.setup();
    saveTrackerState(seededTrackerState());
    window.history.replaceState(null, "", "/in-depth");
    render(<App />);

    await selectDestination(user, "Life Tracker");
    act(() => window.history.back());
    await waitFor(() => expect(window.location.pathname).toBe("/in-depth"));
    await user.click(screen.getByRole("button", { name: "Show player details" }));

    expect(screen.getByLabelText("Player 1 display name")).toHaveValue("Player 1");
    expect(screen.getByLabelText("Player 1 life total")).toHaveValue("20");
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
    expect(screen.getByText("2 players")).toBeInTheDocument();

    await expandSecondaryPlayerDetails(user);
    expect(screen.getByLabelText("Player 1 poison")).toHaveValue("");
  });

  // REQ-206 (slice C, 2026-10-01): un-skipped — seeds via the carry, then exercises
  // consume-once behavior via a later, unrelated raw route re-entry (never the carry
  // again), which must not re-seed and so must not clobber the edit made in Assistant.
  it("consumes the seed once so later unrelated re-entry does not clobber Assistant edits", async () => {
    const user = userEvent.setup();
    saveTrackerState(seededTrackerState());
    saveActiveDestinationId("player-life-tracker");
    render(<App />);

    await carryIntoInDepthDetails(user);
    const nameInput = await screen.findByLabelText("Player 1 display name");
    await user.clear(nameInput);
    await user.type(nameInput, "Edited in Assistant");
    await selectDestination(user, "Quick Question");
    await selectDestination(user, "In-Depth Question");

    expect(screen.getByLabelText("Player 1 display name")).toHaveValue("Edited in Assistant");
  });

  // REQ-206 (slice C, 2026-10-01): un-skipped — reaches the seeded, further-progressed
  // wizard step via the carry.
  it("never writes Assistant edits back to the tracker snapshot", async () => {
    const user = userEvent.setup();
    saveTrackerState(seededTrackerState());
    const before = localStorage.getItem(TRACKER_STORAGE_KEY);
    saveActiveDestinationId("player-life-tracker");
    render(<App />);

    await carryIntoInDepthDetails(user);
    const lifeInput = await screen.findByLabelText("Player 1 life total");
    await user.clear(lifeInput);
    await user.type(lifeInput, "12");
    await expandSecondaryPlayerDetails(user);
    const poisonInput = screen.getByLabelText("Player 1 poison");
    await user.selectOptions(poisonInput, "8");
    await selectDestination(user, "Life Tracker");

    await waitFor(() => expect(localStorage.getItem(TRACKER_STORAGE_KEY)).toBe(before));
  });
});
