import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NO_MATCH_COPY } from "../lib/search";
import type { CardDetailBlock } from "../lib/cardDetail";
import type { CardMetadataItem } from "../types";

export const appCss = readFileSync(resolve(process.cwd(), "src/index.css"), "utf8");

/**
 * Test-fixture shape: the slim up-front `CardMetadataItem` fields (REQ-174)
 * plus the descriptive block, so one literal seeds both the
 * `/data/cardMetadata.json` mock (slim, via `toSlimMetadata`) and the
 * `GET /api/cards/:oracleId` popup-detail mock (full, via `toCardDetail`)
 * without duplicating card data across the two.
 */
export type CardFixture = CardMetadataItem & Partial<CardDetailBlock>;

export function toSlimMetadata(card: CardFixture): CardMetadataItem {
  return { cardId: card.cardId, name: card.name, imageUrl: card.imageUrl, colors: card.colors };
}

export function toCardDetail(card: CardFixture): CardDetailBlock {
  return {
    oracleText: card.oracleText ?? "",
    typeLine: card.typeLine ?? "",
    manaCost: card.manaCost ?? "",
    manaValue: card.manaValue ?? 0,
    colors: card.colors ?? [],
    supertypes: card.supertypes ?? [],
    subtypes: card.subtypes ?? []
  };
}

export const baseCardMetadataFixture: CardFixture[] = [
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
    cardId: "counterspell",
    name: "Counterspell",
    oracleText: "Counter target spell.",
    imageUrl: "",
    manaCost: "{U}{U}",
    manaValue: 2,
    typeLine: "Instant",
    colors: ["U"],
    supertypes: [],
    subtypes: []
  },
  {
    cardId: "lightning-bolt",
    name: "Lightning Bolt",
    oracleText: "Lightning Bolt deals 3 damage to any target.",
    imageUrl: "https://example.com/lightning-bolt.jpg",
    manaCost: "{R}",
    manaValue: 1,
    typeLine: "Instant",
    colors: ["R"],
    supertypes: [],
    subtypes: []
  }
];

export const ZONE_LABELS_FOR_TESTS = ["Stack", "Battlefield", "Hand", "Graveyard", "Exile", "Library", "Command Zone"];

export function jsonResponse(payload: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json", ...headers }
  });
}

export function getUrlFromRequest(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

export function createMemoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (key: string) => (map.has(key) ? (map.get(key) as string) : null),
    setItem: (key: string, value: string) => {
      map.set(key, String(value));
    },
    removeItem: (key: string) => {
      map.delete(key);
    },
    key: (index: number) => Array.from(map.keys())[index] ?? null
  };
}

export function installMemoryLocalStorage(): void {
  const storage = createMemoryStorage();
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    writable: true,
    value: storage
  });
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: storage
  });
}

export function uninstallMemoryLocalStorage(): void {
  Reflect.deleteProperty(globalThis, "localStorage");
  Reflect.deleteProperty(window, "localStorage");
}

export function installMemorySessionStorage(): void {
  const storage = createMemoryStorage();
  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    writable: true,
    value: storage
  });
  Object.defineProperty(window, "sessionStorage", {
    configurable: true,
    value: storage
  });
}

export function uninstallMemorySessionStorage(): void {
  Reflect.deleteProperty(globalThis, "sessionStorage");
  Reflect.deleteProperty(window, "sessionStorage");
}

/**
 * Seeds the tab's active-destination preference so an App-level suite renders straight into
 * In-Depth Question. The portal's own default is the first registered destination, which is
 * Quick Question (`destinationRegistry.tsx`); suites that exercise the In-Depth flow itself
 * say so here rather than depending on which destination happens to lead the registry.
 * Call after any `installMemorySessionStorage()`, so the seed lands in the storage under test.
 */
export function startOnInDepthQuestion(): void {
  try {
    globalThis.sessionStorage?.setItem("thejudge.portal.activeDestinationId", "mtg-assistant");
  } catch {
    // A suite without session storage simply gets the registry default.
  }
}

export function createStackItem(name: string, index: number): CardFixture {
  return {
    cardId: `card-${index}`,
    name,
    oracleText: `${name} oracle text.`,
    imageUrl: "",
    manaCost: "{1}",
    manaValue: 1,
    typeLine: "Instant",
    colors: [],
    supertypes: [],
    subtypes: []
  };
}

export function normalizeHeaders(initHeaders: RequestInit["headers"]): Record<string, string> {
  if (!initHeaders) return {};
  if (initHeaders instanceof Headers) {
    return Object.fromEntries(initHeaders.entries());
  }

  if (Array.isArray(initHeaders)) {
    return Object.fromEntries(initHeaders);
  }

  return Object.fromEntries(
    Object.entries(initHeaders).map(([key, value]) => [key.toLowerCase(), String(value)])
  );
}

export async function waitForMetadataReady(): Promise<void> {
  await screen.findByPlaceholderText("Type to begin");
}

export async function advanceToStackBuilder(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await user.click(screen.getByRole("button", { name: "Confirm game context" }));
  await setSelectedZones(user, ["Stack"]);
  await user.click(screen.getByRole("button", { name: "Continue" }));
}

export async function expandPlayerDetails(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await user.click(screen.getByRole("button", { name: "Show player details" }));
}

export async function expandSecondaryPlayerDetails(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  const [arrow] = await screen.findAllByRole("button", { name: "Show secondary details for all players" });
  await user.click(arrow);
}

export async function selectTurnPhase(user: ReturnType<typeof userEvent.setup>, phaseValue: string): Promise<void> {
  await user.selectOptions(screen.getByLabelText("Turn phase"), phaseValue);
}

export async function advancePastZoneConfirm(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  const continueButton = screen.getByRole("button", { name: "Continue" });
  if (continueButton.hasAttribute("disabled")) {
    await user.click(screen.getByLabelText("Zone: Stack"));
  }
  await user.click(continueButton);
}

export async function openEnrichmentListView(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  const viewAllButton = screen.queryByRole("button", { name: "View all cards" });
  if (viewAllButton) {
    await user.click(viewAllButton);
  }
}

export async function advanceToBattlefieldZoneCollection(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await user.click(screen.getByRole("button", { name: "Confirm game context" }));
  await setSelectedZones(user, ["Battlefield"]);
  await advancePastZoneConfirm(user);
}

export async function advancePastZoneCollection(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await user.click(screen.getByRole("button", { name: "Continue" }));
}

export async function finishEnrichmentWizard(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  for (;;) {
    const finishButton = screen.queryByRole("button", { name: "OK — finish enrichment" });
    if (finishButton) {
      await user.click(finishButton);
      break;
    }
    const nextButton = screen.queryByRole("button", { name: "OK — next card" });
    if (nextButton) {
      await user.click(nextButton);
      continue;
    }
    break;
  }
}

export async function advanceToContextEnrichmentFromZones(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await advancePastZoneCollection(user);
  await openEnrichmentListView(user);
}

export async function advanceToZoneCollectionWithZones(
  user: ReturnType<typeof userEvent.setup>,
  zones: string[]
): Promise<void> {
  await setSelectedZones(user, zones);
  await advancePastZoneConfirm(user);
}

export async function setSelectedZones(user: ReturnType<typeof userEvent.setup>, zones: string[]): Promise<void> {
  for (const zone of ZONE_LABELS_FOR_TESTS) {
    const checkbox = screen.getByLabelText(`Zone: ${zone}`) as HTMLInputElement;
    if (checkbox.checked !== zones.includes(zone)) {
      await user.click(checkbox);
    }
  }
}

export async function selectZoneTab(user: ReturnType<typeof userEvent.setup>, zone: string): Promise<void> {
  await user.click(screen.getByRole("button", { name: `Zone tab: ${zone}` }));
}

export async function addCardToActiveZone(
  user: ReturnType<typeof userEvent.setup>,
  query: string,
  cardName: string
): Promise<void> {
  const searchInput = screen.getByPlaceholderText("Type to begin");
  await user.clear(searchInput);
  await user.type(searchInput, query);
  await user.click(await screen.findByRole("button", { name: cardName }));
  await user.click(screen.getByRole("button", { name: /Begin stackening!|Add to Stack|Add card/ }));
  await user.clear(searchInput);
}

export async function openStackBuilder(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await advanceToStackBuilder(user);
  await waitForMetadataReady();
}

export function readSuggestionNamesFromPanel(searchInput: HTMLElement): string[] {
  const searchLabel = searchInput.closest("label");
  const suggestionPanel = searchLabel?.nextElementSibling;
  if (!(suggestionPanel instanceof HTMLElement)) {
    return [];
  }
  const hasAutocompleteContent =
    within(suggestionPanel).queryByText("Loading cards...") !== null ||
    within(suggestionPanel).queryByText(NO_MATCH_COPY) !== null ||
    suggestionPanel.querySelector("ul") !== null;
  if (!hasAutocompleteContent) {
    return [];
  }

  if (within(suggestionPanel).queryByText(NO_MATCH_COPY)) {
    return [];
  }

  return within(suggestionPanel)
    .queryAllByRole("button")
    .map((button) => button.textContent?.trim() ?? "")
    .filter((name) => name.length > 0);
}

export async function selectCard(user: ReturnType<typeof userEvent.setup>, query: string, cardName: string): Promise<void> {
  const searchInput = screen.getByPlaceholderText("Type to begin");
  await user.clear(searchInput);
  await user.type(searchInput, query);
  await user.click(await screen.findByRole("button", { name: cardName }));
}

export async function addCardToStack(
  user: ReturnType<typeof userEvent.setup>,
  query: string,
  cardName: string
): Promise<void> {
  await selectCard(user, query, cardName);
  await user.click(screen.getByRole("button", { name: /Begin stackening!|Add to Stack/ }));
  await user.clear(screen.getByPlaceholderText("Type to begin"));
}

export async function clickDecryptStack(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  if (screen.queryByRole("heading", { name: "Add cards to zones" })) {
    await advancePastZoneCollection(user);
  }
  if (!screen.queryByRole("button", { name: "Decrypt Stack" })) {
    await finishEnrichmentWizard(user);
  }
  await user.click(screen.getByRole("button", { name: "Decrypt Stack" }));
}

export async function advanceToContextEnrichment(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await advanceToContextEnrichmentFromZones(user);
}
