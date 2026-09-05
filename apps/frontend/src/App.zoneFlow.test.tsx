import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { writeDb } from "./lib/scan/dbformat";
import { CARD_HEIGHT, CARD_WIDTH } from "./lib/scan/identify";
import type { IdentifyResult, RgbImage } from "./lib/scan/types";

/** Deterministic per-pixel noise: a frame-quality-acceptable image for the mocked scan camera. */
function noiseChannel(x: number, y: number, seed: number): number {
  let h = (x * 374761393 + y * 668265263 + seed * 2147483647) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  h = (h ^ (h >>> 16)) >>> 0;
  return 20 + (h % 200);
}

function makeGoodImage(): RgbImage {
  const data = new Uint8Array(CARD_WIDTH * CARD_HEIGHT * 3);
  for (let y = 0; y < CARD_HEIGHT; y++) {
    for (let x = 0; x < CARD_WIDTH; x++) {
      const p = (y * CARD_WIDTH + x) * 3;
      data[p] = noiseChannel(x, y, 1);
      data[p + 1] = noiseChannel(x, y, 2);
      data[p + 2] = noiseChannel(x, y, 3);
    }
  }
  return { width: CARD_WIDTH, height: CARD_HEIGHT, data };
}

const { cardIdentifierConstructorMock, identifierMock } = vi.hoisted(() => {
  const identifyResult = {
    matched: true,
    was_rotated: false,
    candidates: [{ card_id: "printing-opt", distance: 4 }]
  };
  const identifier = {
    identify: vi.fn(() => identifyResult)
  };

  return {
    identifierMock: identifier,
    cardIdentifierConstructorMock: vi.fn(() => identifier)
  };
});

vi.mock("./lib/scan/identify", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./lib/scan/identify")>();
  return {
    ...actual,
    CardIdentifier: cardIdentifierConstructorMock
  };
});

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
    const image: RgbImage = makeGoodImage();

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
import { startOnInDepthQuestion, toSlimMetadata, type CardFixture } from "./test/appTestHelpers";

const metadataFixture: CardFixture[] = [
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

describe("Frontend - MTG Assistant", () => {
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

describe("Target gating and pickers", () => {
  beforeEach(() => {
    startOnInDepthQuestion();
    cardIdentifierConstructorMock.mockClear();
    identifierMock.identify.mockClear();
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL): Promise<Response> => {
        const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
        if (url === "/data/cardMetadata.json") {
          return jsonResponse(metadataFixture.map(toSlimMetadata));
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

  it("auto-adds a scanned card through the existing stack add path and keeps scanning", async () => {
    const user = userEvent.setup();
    render(<App />);
    await openStackZoneCollection(user);

    const fetchMock = vi.mocked(fetch);
    expect(fetchMock).toHaveBeenCalledWith("/data/cardMetadata.json", expect.anything());
    expect(fetchMock).not.toHaveBeenCalledWith("/data/cardScanMap.json");
    expect(fetchMock).not.toHaveBeenCalledWith("/data/cardhashes.bin");

    await user.click(screen.getByRole("button", { name: "Scan" }));
    await screen.findByLabelText("Mock scan camera");

    // Lock-in needs sustained agreement across frames (strict minVotes), not a single capture.
    for (let i = 0; i < 6; i++) {
      await user.click(screen.getByRole("button", { name: "Fake scan capture" }));
    }

    // On a confident lock the card is added hands-free (no Accept tap) and scanning resumes.
    expect(await screen.findByLabelText("Scanned this session: 1")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Add cards to zones" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Zone tab: Stack" })).not.toBeInTheDocument();
    expect(screen.queryByText("Stack order is bottom to top. The first card you add is the bottom; each new card is added on top.")).not.toBeInTheDocument();
    expect(screen.queryByText("Stack cards (1)")).not.toBeInTheDocument();
    expect(screen.queryByText("Locked on")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add card" })).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/data/cardScanMap.json");
    expect(fetchMock).toHaveBeenCalledWith("/data/cardhashes.bin");
    expect(cardIdentifierConstructorMock).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText("Mock scan camera")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Exit scan" }));
    expect(screen.getByRole("button", { name: "Zone tab: Stack" })).toHaveTextContent("Stack (1)");
    expect(screen.getByText("Opt")).toBeInTheDocument();
    expect(screen.getByText("bottom & top")).toBeInTheDocument();
  });

  it("tracks auto-added scans in the review bubble and removes one in a single tap", async () => {
    const user = userEvent.setup();
    render(<App />);
    await openStackZoneCollection(user);

    await user.click(screen.getByRole("button", { name: "Scan" }));
    await screen.findByLabelText("Mock scan camera");

    for (let i = 0; i < 6; i++) {
      await user.click(screen.getByRole("button", { name: "Fake scan capture" }));
    }

    // The auto-add lands in the zone and the review bubble counts this-session scans.
    expect(screen.queryByRole("button", { name: "Zone tab: Stack" })).not.toBeInTheDocument();
    const bubble = await screen.findByLabelText("Scanned this session: 1");

    // One tap to expand, one tap to remove — no confirmation step (DEC-058).
    await user.click(bubble);
    await user.click(screen.getByRole("button", { name: "Remove Opt from scan review" }));

    // Removal flows through the existing zone-card path; count/list update live.
    expect(screen.queryByLabelText(/^Scanned this session:/)).not.toBeInTheDocument();
    // Scanning continues after the undo.
    expect(screen.getByLabelText("Mock scan camera")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Exit scan" }));
    expect(screen.getByRole("button", { name: "Zone tab: Stack" })).toHaveTextContent("Stack");
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
});
