import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { writeDb } from "./lib/scan/dbformat";
import type { IdentifyResult, RgbImage } from "./lib/scan/types";

const { cardIdentifierConstructorMock, identifierMock } = vi.hoisted(() => {
  const identifyResult = {
    matched: true,
    was_rotated: false,
    candidates: [{ card_id: "printing-opt", distance: 4 }]
  };
  const identifier = {
    isCardBack: vi.fn(() => ({ isBack: false, distance: 999 })),
    identify: vi.fn(() => identifyResult)
  };

  return {
    identifierMock: identifier,
    cardIdentifierConstructorMock: vi.fn(() => identifier)
  };
});

vi.mock("./lib/scan/identify", () => ({
  CardIdentifier: cardIdentifierConstructorMock
}));

vi.mock("./components/ScanCameraSurface", () => ({
  ScanCameraSurface: ({
    identify,
    onCapture,
    onResult,
    onStatusChange
  }: {
    identify?: (image: RgbImage) => IdentifyResult | Promise<IdentifyResult>;
    onCapture: (image: RgbImage) => void;
    onResult?: (result: IdentifyResult | null) => void;
    onStatusChange?: (status: string) => void;
  }) => {
    const image: RgbImage = { width: 1, height: 1, data: new Uint8Array([0, 0, 0]) };

    return (
      <section aria-label="Mock scan camera">
        <button
          type="button"
          onClick={async () => {
            onStatusChange?.("scanning");
            onCapture(image);
            const result = identify ? await identify(image) : null;
            onResult?.(result);
          }}
        >
          Fake scan capture
        </button>
      </section>
    );
  }
}));

import App from "./App";
import { PHASE_ZONE_DEFAULTS } from "./lib/contextFlow/phaseZoneDefaults";
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

function binaryResponse(bytes: Uint8Array): Response {
  const body = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(body).set(bytes);
  return new Response(body);
}

function makeHashDbBytes(): Uint8Array {
  return writeDb({
    ids: ["printing-opt"],
    hashes: new Uint8Array(96),
    count: 1
  });
}

async function openStackZoneCollection(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await user.click(screen.getByRole("button", { name: "Confirm game context" }));
  const stackCheckbox = screen.getByLabelText("Zone: Stack") as HTMLInputElement;
  if (!stackCheckbox.checked) {
    await user.click(stackCheckbox);
  }
  await user.click(screen.getByRole("button", { name: "Continue" }));
}

async function selectStackCard(user: ReturnType<typeof userEvent.setup>, query: string, cardName: string): Promise<void> {
  const searchInput = screen.getByPlaceholderText("Type to begin");
  await user.clear(searchInput);
  await user.type(searchInput, query);
  await user.click(await screen.findByRole("button", { name: cardName }));
}

describe("Phase zone defaults", () => {
  it("produces exactly 2 zones per phase", () => {
    for (const [phase, zones] of Object.entries(PHASE_ZONE_DEFAULTS)) {
      expect(zones, `phase "${phase}"`).toHaveLength(2);
    }
  });

  it("does not include stack_resolving as a phase", () => {
    expect(Object.keys(PHASE_ZONE_DEFAULTS)).not.toContain("stack_resolving");
  });
});

describe("STORY-074 target gating and pickers", () => {
  beforeEach(() => {
    cardIdentifierConstructorMock.mockClear();
    identifierMock.isCardBack.mockClear();
    identifierMock.identify.mockClear();
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL): Promise<Response> => {
        const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
        if (url === "/data/cardMetadata.json") {
          return jsonResponse(metadataFixture);
        }
        if (url === "/data/cardScanMap.json") {
          return jsonResponse({
            "printing-opt": { oracleId: "opt", name: "Opt" }
          });
        }
        if (url === "/data/cardhashes.bin") {
          return binaryResponse(makeHashDbBytes());
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
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Zone tab: Battlefield" }));
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

  it("accepts a scanned card through the existing stack add path", async () => {
    const user = userEvent.setup();
    render(<App />);
    await openStackZoneCollection(user);

    const fetchMock = vi.mocked(fetch);
    expect(fetchMock).toHaveBeenCalledWith("/data/cardMetadata.json", expect.anything());
    expect(fetchMock).not.toHaveBeenCalledWith("/data/cardScanMap.json");
    expect(fetchMock).not.toHaveBeenCalledWith("/data/cardhashes.bin");

    await user.click(screen.getByRole("button", { name: "Scan" }));
    await screen.findByLabelText("Mock scan camera");
    await user.click(screen.getByRole("button", { name: "Fake scan capture" }));

    expect(await screen.findByRole("button", { name: /Begin stackening!|Add to Stack/ })).toBeInTheDocument();
    expect(screen.getByText("Opt")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/data/cardScanMap.json");
    expect(fetchMock).toHaveBeenCalledWith("/data/cardhashes.bin");
    expect(cardIdentifierConstructorMock).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: /Begin stackening!|Add to Stack/ }));

    expect(await screen.findByText("1. Opt")).toBeInTheDocument();
    expect(screen.getByText("bottom & top")).toBeInTheDocument();
    expect(screen.getByLabelText("Mock scan camera")).toBeInTheDocument();
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
