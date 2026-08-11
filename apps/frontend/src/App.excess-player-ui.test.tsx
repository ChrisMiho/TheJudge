import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import type { ZoneAskAiPayload } from "./lib/contextFlow";
import {
  addCardToActiveZone,
  advanceToContextEnrichmentFromZones,
  advanceToZoneCollectionWithZones,
  baseCardMetadataFixture,
  clickDecryptStack,
  expandSecondaryPlayerDetails,
  getUrlFromRequest,
  jsonResponse,
  selectZoneTab,
  startOnInDepthQuestion
} from "./test/appTestHelpers";

async function selectDestination(user: ReturnType<typeof userEvent.setup>, name: string): Promise<void> {
  await user.click(screen.getByRole("button", { name: "Switch feature" }));
  await user.click(screen.getByRole("menuitem", { name }));
}

function secondaryArrows(): HTMLElement[] {
  return [
    ...screen.queryAllByRole("button", { name: "Show secondary details for all players" }),
    ...screen.queryAllByRole("button", { name: "Hide secondary details for all players" })
  ];
}

describe("Frontend - Portal", () => {
  const submittedRequests: ZoneAskAiPayload[] = [];

  beforeEach(() => {

    startOnInDepthQuestion();
    submittedRequests.length = 0;
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
          return jsonResponse({ answer: "ok" });
        }
        return jsonResponse({ error: "not found" }, 404);
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("keeps every active card compact with no counter inputs until the outer roster and shared arrow are both open", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.queryByLabelText("Player 1 display name")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Show player details" }));

    expect(screen.getByLabelText("Player 1 display name")).toBeInTheDocument();
    expect(screen.getByLabelText("Player 2 display name")).toBeInTheDocument();
    expect(screen.queryByLabelText("Player 1 poison")).not.toBeInTheDocument();

    const arrows = secondaryArrows();
    expect(arrows.length).toBeGreaterThan(0);
    for (const arrow of arrows) {
      expect(arrow.className).toContain("min-h-[2.75rem]");
      expect(arrow.className).toContain("min-w-[2.75rem]");
    }
  });

  it("expands and collapses every card in sync from different cards' arrows", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Show player details" }));
    await user.click(screen.getByRole("button", { name: "Add player" }));

    const [arrow1] = screen.getAllByRole("button", { name: "Show secondary details for all players" });
    await user.click(arrow1);

    expect(screen.getByLabelText("Player 1 poison")).toBeInTheDocument();
    expect(screen.getByLabelText("Player 3 poison")).toBeInTheDocument();
    for (const arrow of secondaryArrows()) {
      expect(arrow).toHaveAttribute("aria-expanded", "true");
    }

    const [, secondHideArrow] = screen.getAllByRole("button", { name: "Hide secondary details for all players" });
    await user.click(secondHideArrow);

    expect(screen.queryByLabelText("Player 1 poison")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Player 3 poison")).not.toBeInTheDocument();
    for (const arrow of secondaryArrows()) {
      expect(arrow).toHaveAttribute("aria-expanded", "false");
    }
  });

  it("resets secondary details when the outer roster closes and preserves values through reopen", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Show player details" }));
    await expandSecondaryPlayerDetails(user);

    const poison = screen.getByLabelText("Player 1 poison");
    await user.selectOptions(poison, "5");

    await user.click(screen.getByRole("button", { name: "Hide player details" }));
    expect(screen.queryByLabelText("Player 1 display name")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Show player details" }));
    expect(screen.getByLabelText("Player 1 display name")).toBeInTheDocument();
    expect(screen.queryByLabelText("Player 1 poison")).not.toBeInTheDocument();

    await expandSecondaryPlayerDetails(user);
    expect(screen.getByLabelText("Player 1 poison")).toHaveValue("5");
  });

  it("resets only secondary presentation across a destination round trip while preserving the outer roster, values, and staged step", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Show player details" }));
    await expandSecondaryPlayerDetails(user);

    const nameInput = screen.getByLabelText("Player 1 display name");
    await user.clear(nameInput);
    await user.type(nameInput, "Alice");
    const lifeInput = screen.getByLabelText("Player 1 life total");
    await user.clear(lifeInput);
    await user.type(lifeInput, "33");
    const poisonInput = screen.getByLabelText("Player 1 poison");
    await user.selectOptions(poisonInput, "5");

    await selectDestination(user, "Quick Question");
    await selectDestination(user, "In-Depth Question");

    expect(screen.getByLabelText("Player 1 display name")).toHaveValue("Alice");
    expect(screen.getByLabelText("Player 1 life total")).toHaveValue("33");
    expect(screen.queryByLabelText("Player 1 poison")).not.toBeInTheDocument();
    for (const arrow of secondaryArrows()) {
      expect(arrow).toHaveAttribute("aria-expanded", "false");
    }

    await expandSecondaryPlayerDetails(user);
    expect(screen.getByLabelText("Player 1 poison")).toHaveValue("5");

    await user.click(screen.getByRole("button", { name: "Confirm game context" }));
    expect(screen.getByRole("heading", { name: "Zone confirmation" })).toBeInTheDocument();

    await selectDestination(user, "Quick Question");
    await selectDestination(user, "In-Depth Question");

    expect(screen.getByRole("heading", { name: "Zone confirmation" })).toBeInTheDocument();
  });

  it("selecting the already-active destination is a no-op that changes nothing", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Show player details" }));
    await expandSecondaryPlayerDetails(user);
    expect(screen.getByLabelText("Player 1 poison")).toBeInTheDocument();

    await selectDestination(user, "In-Depth Question");

    expect(screen.getByLabelText("Player 1 poison")).toBeInTheDocument();
    expect(screen.getByLabelText("Player 1 poison")).toHaveAttribute("aria-label", "Player 1 poison");
  });

  it("produces the same submission payload for unchanged inputs regardless of disclosure resets", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Show player details" }));
    await expandSecondaryPlayerDetails(user);
    const poison = screen.getByLabelText("Player 1 poison");
    await user.selectOptions(poison, "5");

    await selectDestination(user, "Quick Question");
    await selectDestination(user, "In-Depth Question");
    await expandSecondaryPlayerDetails(user);
    expect(screen.getByLabelText("Player 1 poison")).toHaveValue("5");

    await user.click(screen.getByRole("button", { name: "Confirm game context" }));
    await advanceToZoneCollectionWithZones(user, ["Stack"]);
    await selectZoneTab(user, "Stack");
    await addCardToActiveZone(user, "opt", "Opt");
    await advanceToContextEnrichmentFromZones(user);
    await clickDecryptStack(user);

    await waitFor(() => expect(submittedRequests).toHaveLength(1));
    expect(submittedRequests[0]?.gameContext.players[0]).toEqual({
      label: "Player 1",
      lifeTotal: 20,
      poison: 5
    });
  });
});
