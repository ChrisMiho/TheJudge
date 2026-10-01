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

  // REQ-067/REQ-206 (slice A, 2026-10-01): the only trigger this hand-off ever had was
  // the Menu's "In-Depth Question" row, which the one-question-door redesign retires —
  // `mtg-assistant` stays registered and routable but gets no row of its own, so
  // `handleDestinationSelect("mtg-assistant")` (the seed's only call site, kept narrowly
  // tied to that explicit gesture by the negative tests below) is presently unreachable
  // from the UI. Skipped rather than deleted or rewritten to a UI path that doesn't exist:
  // the seeding logic in App.tsx is untouched and still correct, this is a reachability
  // gap pending slice C's "Add in-depth details" carry hand-off (or another explicit
  // gesture) restoring a way to invoke it. Un-skip once one does.
  it.skip("seeds a previously mounted Assistant only on the direct tracker-to-Assistant transition", async () => {
    const user = userEvent.setup();
    saveTrackerState(seededTrackerState());
    render(<App />);

    expect(screen.getByRole("heading", { name: "Game context" })).toBeInTheDocument();
    await selectDestination(user, "Life Tracker");
    await selectDestination(user, "In-Depth Question");

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

  // REQ-067/REQ-206 (slice A, 2026-10-01): same reachability gap as above — this test
  // seeds via the now-retired Menu row before exercising consume-once behavior.
  it.skip("consumes the seed once so later unrelated re-entry does not clobber Assistant edits", async () => {
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

  // REQ-067/REQ-206 (slice A, 2026-10-01): same reachability gap — reaching a seeded,
  // further-progressed wizard step (where "Player 1 life total" renders) depends on the
  // same now-retired Menu row.
  it.skip("never writes Assistant edits back to the tracker snapshot", async () => {
    const user = userEvent.setup();
    saveTrackerState(seededTrackerState());
    const before = localStorage.getItem(TRACKER_STORAGE_KEY);
    saveActiveDestinationId("player-life-tracker");
    render(<App />);

    await selectDestination(user, "In-Depth Question");
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
