import { render, screen } from "@testing-library/react";
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

async function openStackZoneCollection(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await user.click(screen.getByRole("button", { name: "Confirm game context" }));
  await user.click(screen.getByLabelText("Zone: Stack"));
  await user.click(screen.getByRole("button", { name: "Continue" }));
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

  it("keeps battlefield collection in card-only mode", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Confirm game context" }));
    await user.click(screen.getByLabelText("Zone: Battlefield"));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.type(screen.getByLabelText("Battlefield search input"), "lig");
    await user.click(await screen.findByRole("button", { name: "Lightning Bolt" }));

    expect(screen.queryByLabelText("Battlefield target kind")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add battlefield target" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Battlefield item details")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add card" })).toBeInTheDocument();
  });

  it("keeps stack assembly in card-only mode until enrichment", async () => {
    const user = userEvent.setup();
    render(<App />);
    await openStackZoneCollection(user);

    await selectStackCard(user, "opt", "Opt");

    expect(screen.queryByLabelText("Entry target kind")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Entry caster")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Entry context notes")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Begin stackening!|Add to Stack/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Decrypt Stack" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Continue to context enrichment" })).not.toBeInTheDocument();
  });

  it("shows enrichment controls only after entering enrichment phase", async () => {
    const user = userEvent.setup();
    render(<App />);
    await openStackZoneCollection(user);
    await selectStackCard(user, "opt", "Opt");
    await user.click(screen.getByRole("button", { name: /Begin stackening!|Add to Stack/ }));
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(screen.getByLabelText("Target kind for Opt")).toBeInTheDocument();
    expect(screen.getByLabelText("Caster for Opt")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "OK — finish enrichment" }));
    expect(screen.getByRole("button", { name: "Decrypt Stack" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("How does this resolve?")).toBeInTheDocument();
  });

  it("keeps resolve control gated behind enrichment step", async () => {
    const user = userEvent.setup();
    render(<App />);
    await openStackZoneCollection(user);
    expect(screen.queryByRole("button", { name: "Decrypt Stack" })).not.toBeInTheDocument();

    await selectStackCard(user, "opt", "Opt");
    await user.click(screen.getByRole("button", { name: /Begin stackening!|Add to Stack/ }));
    expect(screen.queryByRole("button", { name: "Continue to context enrichment" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Decrypt Stack" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "OK — finish enrichment" }));
    expect(screen.getByRole("button", { name: "Decrypt Stack" })).toBeInTheDocument();
  });
});
