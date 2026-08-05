import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { createCorrelationIdMock, logFrontendDebugMock } = vi.hoisted(() => ({
  createCorrelationIdMock: vi.fn(() => "corr-test-id"),
  logFrontendDebugMock: vi.fn()
}));

vi.mock("./lib/debugLogger", () => ({
  createCorrelationId: createCorrelationIdMock,
  logFrontendDebug: logFrontendDebugMock
}));

import App from "./App";
import { DEFAULT_PALETTE_ID, PALETTES, getPaletteById, type Palette } from "./lib/theme/palettes";
import {
  addCardToStack,
  baseCardMetadataFixture,
  clickDecryptStack,
  createMemoryStorage,
  getUrlFromRequest,
  jsonResponse,
  openStackBuilder,
  startOnInDepthQuestion
} from "./test/appTestHelpers";

function paletteFor(id: string): Palette {
  return getPaletteById(id) as Palette;
}

async function openPortalMenu(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  if (screen.queryByRole("menu")) {
    return;
  }
  await user.click(screen.getByRole("button", { name: "Switch feature" }));
}

async function selectDestination(
  user: ReturnType<typeof userEvent.setup>,
  destinationName: string
): Promise<void> {
  await openPortalMenu(user);
  await user.click(screen.getByRole("menuitem", { name: destinationName }));
}

async function selectPalette(user: ReturnType<typeof userEvent.setup>, paletteName: string): Promise<void> {
  await openPortalMenu(user);
  await user.click(screen.getByRole("button", { name: `Theme: ${paletteName}` }));
}

function expectRootTokens(palette: Palette): void {
  expect(document.documentElement.dataset.theme).toBe(palette.id);
  expect(document.documentElement.style.getPropertyValue("--accent")).toBe(palette.accent);
  expect(document.documentElement.style.getPropertyValue("--accent-strong")).toBe(palette.accentStrong);
  expect(document.documentElement.style.getPropertyValue("--accent-soft")).toBe(palette.accentSoft);
  expect(document.documentElement.style.getPropertyValue("--accent-contrast")).toBe(palette.accentContrast);
}

describe("Frontend - Theme", () => {
describe("Global theme reach across destinations", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createMemoryStorage());
    vi.stubGlobal("sessionStorage", createMemoryStorage());
    startOnInDepthQuestion();
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
        if (url.endsWith("/api/ask-ai") && init?.method === "POST") {
          return jsonResponse({ answer: "Mock answer" });
        }
        return jsonResponse({ error: "not found" }, 404);
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete document.documentElement.dataset.theme;
    document.documentElement.style.removeProperty("--accent");
    document.documentElement.style.removeProperty("--accent-strong");
    document.documentElement.style.removeProperty("--accent-soft");
    document.documentElement.style.removeProperty("--accent-contrast");
  });

  it("applies every fixed profile's exact document-root tokens from the portal Theme section", async () => {
    const user = userEvent.setup();
    render(<App />);

    for (const palette of PALETTES) {
      await selectPalette(user, palette.name);
      expectRootTokens(palette);
    }
  });

  it("keeps a selected profile applied and reflected in the portal trigger/active row across a destination switch", async () => {
    const user = userEvent.setup();
    render(<App />);

    await selectPalette(user, "Red");
    expectRootTokens(paletteFor("red"));

    await selectDestination(user, "Quick Question");
    expectRootTokens(paletteFor("red"));
    // The rail's radial gradient reads --accent/--accent-strong directly (see .portal-menu-rail
    // in index.css), so the accent-root-token assertion above already covers palette reach; this
    // just confirms the trigger is still wired onto that accent-driven class after the switch.
    expect(screen.getByRole("button", { name: "Switch feature" }).className).toContain("portal-menu-rail");

    await openPortalMenu(user);
    expect(screen.getByRole("menuitem", { name: "Quick Question" })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("button", { name: "Theme: Red" })).toHaveAttribute("aria-pressed", "true");
  });

  it("retints Quick Question without resetting the typed question or selected card", async () => {
    const user = userEvent.setup();
    render(<App />);
    await selectDestination(user, "Quick Question");

    await user.type(screen.getByRole("textbox", { name: "Card search" }), "opt");
    await user.click(await screen.findByRole("button", { name: "Opt" }));
    await user.type(screen.getByRole("textbox", { name: "Magic question" }), "Does it draw a card?");

    await selectPalette(user, "Green");

    expectRootTokens(paletteFor("green"));
    expect(screen.getByRole("heading", { name: "Opt" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Magic question" })).toHaveValue("Does it draw a card?");
    expect(screen.getByRole("button", { name: "Scan a card" }).className).toContain("border-accent/70");
  });

  it("retints Player Life Tracker without resetting life, counter, or setup state", async () => {
    const user = userEvent.setup();
    render(<App />);
    await selectDestination(user, "Life Tracker");

    await user.click(screen.getByRole("button", { name: "Increase life for Player 2" }));
    await user.click(screen.getByRole("button", { name: "Open game setup" }));
    await user.click(screen.getByRole("button", { name: "Decrease player count" }));
    await user.click(screen.getByRole("button", { name: "Close game setup" }));

    await selectPalette(user, "Black");

    expectRootTokens(paletteFor("black"));
    expect(within(screen.getByTestId("life-card-Player 2")).getByText("41")).toBeInTheDocument();
    expect(screen.getAllByTestId(/^life-card-Player /)).toHaveLength(3);
  });

  it("removes an unsupported stored palette id and falls back to Blue", () => {
    localStorage.setItem("thejudge.theme.paletteId", "emerald");
    render(<App />);

    expectRootTokens(paletteFor(DEFAULT_PALETTE_ID));
    expect(localStorage.getItem("thejudge.theme.paletteId")).toBeNull();
  });

  it("removes malformed custom Colorless data and resolves the fixed Colorless gray", () => {
    localStorage.setItem("thejudge.theme.paletteId", "colorless");
    localStorage.setItem("thejudge.theme.colorlessCustomRgb", "not-a-hex");
    render(<App />);

    expectRootTokens(paletteFor("colorless"));
    expect(localStorage.getItem("thejudge.theme.colorlessCustomRgb")).toBeNull();
  });

  it("renders and still themes the session when storage access throws", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("localStorage", {
      getItem() {
        throw new Error("storage unavailable");
      },
      setItem() {
        throw new Error("storage unavailable");
      },
      removeItem() {
        throw new Error("storage unavailable");
      },
      clear() {},
      key() {
        return null;
      },
      length: 0
    });

    render(<App />);
    expectRootTokens(paletteFor(DEFAULT_PALETTE_ID));

    await selectPalette(user, "White");
    expectRootTokens(paletteFor("white"));
  });

  it("customizes and resets Colorless without losing In-Depth conversation state or a Quick Question card selection", async () => {
    const user = userEvent.setup();
    render(<App />);

    await openStackBuilder(user);
    await addCardToStack(user, "opt", "Opt");
    await clickDecryptStack(user);
    await screen.findByText("Mock answer");

    await selectPalette(user, "Colorless");
    fireEvent.change(screen.getByLabelText("Customize Colorless color"), {
      target: { value: "#0a0a0a" }
    });
    expect(document.documentElement.style.getPropertyValue("--accent")).toBe("10 10 10");
    expect(screen.getByText("Mock answer")).toBeInTheDocument();

    await user.click(screen.getByRole("menuitem", { name: "Quick Question" }));
    await user.type(screen.getByRole("textbox", { name: "Card search" }), "cou");
    await user.click(await screen.findByRole("button", { name: "Counterspell" }));

    await openPortalMenu(user);
    await user.click(screen.getByRole("button", { name: "Reset to gray" }));
    expect(document.documentElement.style.getPropertyValue("--accent")).toBe("82 82 91");
    expect(screen.getByRole("heading", { name: "Counterspell" })).toBeInTheDocument();

    await selectDestination(user, "In-Depth Question");
    expect(screen.getByText("Mock answer")).toBeInTheDocument();
  });
});
});
