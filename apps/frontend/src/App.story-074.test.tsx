import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import type { CardMetadataItem } from "./types";

const metadataFixture: CardMetadataItem[] = [
  {
    cardId: "opt",
    name: "Opt",
    oracleText: "Scry 1, then draw a card.",
    imageUrl: "",
    manaCost: "{U}",
    manaValue: 1,
    typeLine: "Instant",
    colors: ["U"],
    supertypes: [],
    subtypes: []
  },
  {
    cardId: "lightning-bolt",
    name: "Lightning Bolt",
    oracleText: "Lightning Bolt deals 3 damage to any target.",
    imageUrl: "",
    manaCost: "{R}",
    manaValue: 1,
    typeLine: "Instant",
    colors: ["R"],
    supertypes: [],
    subtypes: []
  }
];

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

async function openStackBuilder(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await user.click(screen.getByRole("button", { name: "Confirm game context" }));
  await user.click(screen.getByRole("button", { name: "Skip battlefield context" }));
}

async function selectStackCard(user: ReturnType<typeof userEvent.setup>, query: string, cardName: string): Promise<void> {
  const searchInput = screen.getByPlaceholderText("Type to begin");
  await user.clear(searchInput);
  await user.type(searchInput, query);
  await user.click(await screen.findByRole("button", { name: cardName }));
}

describe("STORY-074 target gating and pickers", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL): Promise<Response> => {
        const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
        if (url === "/data/cardMetadata.json") {
          return jsonResponse(metadataFixture);
        }

        return jsonResponse({ answer: "ok" });
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("disables stack target entry controls when no stack references exist", async () => {
    const user = userEvent.setup();
    render(<App />);
    await openStackBuilder(user);

    await selectStackCard(user, "opt", "Opt");

    const stackTargetSelect = screen.getByLabelText("Entry stack target");
    const addTargetButton = screen.getByRole("button", { name: "Add entry target" });

    expect(stackTargetSelect).toBeDisabled();
    expect(screen.getByRole("option", { name: "No stack items available" })).toBeInTheDocument();
    expect(addTargetButton).toBeDisabled();
    expect(screen.getByText("Add a stack item before selecting a stack target.")).toBeInTheDocument();
  });

  it("uses battlefield target picker and empty-state gating in stack entry", async () => {
    const user = userEvent.setup();
    render(<App />);
    await openStackBuilder(user);

    await selectStackCard(user, "opt", "Opt");
    await user.selectOptions(screen.getByLabelText("Entry target kind"), "battlefield");

    const battlefieldTargetSelect = screen.getByLabelText("Entry battlefield target");
    const addTargetButton = screen.getByRole("button", { name: "Add entry target" });
    expect(battlefieldTargetSelect).toBeDisabled();
    expect(screen.getByRole("option", { name: "No battlefield entries available" })).toBeInTheDocument();
    expect(addTargetButton).toBeDisabled();

    await user.click(screen.getByRole("button", { name: /Begin stackening!|Add to Stack/ }));
    await user.click(screen.getByRole("button", { name: /^Stack/ }));
    await user.selectOptions(screen.getByLabelText("Target kind for Opt"), "battlefield");

    const detailBattlefieldSelect = screen.getByLabelText("Battlefield target for Opt");
    expect(detailBattlefieldSelect).toBeDisabled();
    expect(screen.getByRole("button", { name: "Add target for Opt" })).toBeDisabled();
  });

  it("disables battlefield-step stack targets to prevent dead-end references", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Confirm game context" }));
    await user.type(screen.getByLabelText("Battlefield search input"), "lig");
    await user.click(await screen.findByRole("button", { name: "Lightning Bolt" }));

    const targetKindSelect = screen.getByLabelText("Battlefield target kind");
    const stackOption = screen.getByRole("option", { name: "Stack target" });
    expect(stackOption).toBeDisabled();

    fireEvent.change(targetKindSelect, { target: { value: "stack" } });
    expect(screen.getByLabelText("Battlefield target stack name")).toBeDisabled();
    expect(screen.getByLabelText("Battlefield target stack id")).toBeDisabled();
    expect(screen.getByText("Stack targets are added in the stack step.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add battlefield target" })).toBeDisabled();
  });

  it("enables battlefield picker options once battlefield context exists", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Confirm game context" }));
    await user.type(screen.getByLabelText("Battlefield search input"), "lig");
    await user.click(await screen.findByRole("button", { name: "Lightning Bolt" }));
    await user.selectOptions(screen.getByLabelText("Battlefield target kind"), "none");
    await user.click(screen.getByRole("button", { name: "Add battlefield target" }));
    await user.click(screen.getByRole("button", { name: "Add battlefield item" }));
    await user.click(screen.getByRole("button", { name: "Continue to stack" }));

    await selectStackCard(user, "opt", "Opt");
    await user.selectOptions(screen.getByLabelText("Entry target kind"), "battlefield");
    const battlefieldTargetSelect = screen.getByLabelText("Entry battlefield target");
    expect(battlefieldTargetSelect).toBeEnabled();
    expect(screen.getByRole("option", { name: "Lightning Bolt" })).toBeInTheDocument();

    await user.selectOptions(battlefieldTargetSelect, "Lightning Bolt");
    expect(screen.getByRole("button", { name: "Add entry target" })).toBeEnabled();
  });
});
