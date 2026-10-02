import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { act, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NO_MATCH_COPY } from "../lib/search";
import type { CardDetailBlock } from "../lib/cardDetail";
import type { CardMetadataItem } from "../types";

export const appCss = readFileSync(resolve(process.cwd(), "src/index.css"), "utf8");
export const flowCss = readFileSync(resolve(process.cwd(), "src/styles/flow.css"), "utf8");
export const shellCss = readFileSync(resolve(process.cwd(), "src/styles/shell.css"), "utf8");

/**
 * Test-fixture shape: the slim up-front `CardMetadataItem` fields (REQ-174)
 * plus the descriptive block, so one literal seeds both the
 * `/data/cardMetadata.json` mock (slim, via `toSlimMetadata`) and the
 * `GET /api/cards/:oracleId` popup-detail mock (full, via `toCardDetail`)
 * without duplicating card data across the two.
 */
export type CardFixture = CardMetadataItem & Partial<CardDetailBlock>;

export function toSlimMetadata(card: CardFixture): CardMetadataItem {
  return { cardId: card.cardId, name: card.name, imageId: card.imageId, colors: card.colors };
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
    imageId: "",
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
    imageId: "",
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
    // REQ-174/Slice C: a representative printing id, not a full url; the
    // component derives `https://cards.scryfall.io/normal/front/l/b/lightning-bolt-fixture-id.jpg`.
    imageId: "lightning-bolt-fixture-id",
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
/**
 * REQ-067/REQ-206: `in-depth` stays registered and routable with no row of
 * its own in the Menu (its row — Ask a Question's "Add in-depth details" —
 * ships in slice C's carry hand-off). Mid-test navigation to it goes through
 * the URL — the same mechanism `useActiveDestination`'s own `navigate()`
 * uses (REQ-140/DEC-157: URL is the source of truth) — via the browser
 * History API plus a manually dispatched `popstate`, since calling
 * `window.history.pushState` directly does not itself notify React Router's
 * listener (bound to `popstate`), but updates `window.location` immediately,
 * so dispatching `popstate` afterward lets the router pick up the change.
 */
export async function navigateToPath(path: string): Promise<void> {
  await act(async () => {
    // React Router's own history state shape ({ idx, key, usr }) — a bare `{}`
    // state confuses its internal index tracking (its own `handlePop` reads
    // `state.idx`), so this mirrors it closely enough for the popstate it
    // dispatches next to read as one of its own POP navigations.
    const currentIdx = typeof window.history.state?.idx === "number" ? window.history.state.idx : 0;
    window.history.pushState({ idx: currentIdx + 1, key: Math.random().toString(36).slice(2) }, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
}

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
    imageId: "",
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
  // Look-matching pass (slice N, review 1 fix — finding 3): the search field no
  // longer renders by default (it opens from its own ＋ Add card chip), so
  // metadata readiness is now signalled by that chip's own presence instead —
  // present the moment a zone is active, regardless of which zone.
  await screen.findByRole("button", { name: /^Add a card to /, expanded: false });
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
    const finishButton = screen.queryByRole("button", { name: "OK — finish context" });
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

/**
 * Look-matching pass (slice N, review 1 fix — finding 3): the zone's search field
 * now opens from its own ＋ Add card chip (`aria-label`d "Add a card to <Zone>" to
 * stay distinct from that zone's own "Add card" confirm button) instead of sitting
 * permanently visible. A no-op if the popover is already open (idempotent, so
 * callers that search more than once in one test can call this before the first
 * search only). `expanded: false` scopes the query to the one, currently-closed
 * chip — opening the chip for a zone whose search is already open is never needed.
 */
export async function openZoneCardSearch(user: ReturnType<typeof userEvent.setup>, zone: string): Promise<void> {
  const chip = screen.queryByRole("button", { name: `Add a card to ${zone}`, expanded: false });
  if (chip) {
    await user.click(chip);
  }
}

export async function addCardToActiveZone(
  user: ReturnType<typeof userEvent.setup>,
  query: string,
  cardName: string
): Promise<void> {
  // Look-matching pass (slice N, review 1 fix — finding 3): the search field opens
  // from its own ＋ Add card chip now (`aria-label`d "Add a card to <Zone>" to stay
  // distinct from the zone's own "Add card" confirm button below), instead of
  // sitting permanently visible with the "Type to begin" placeholder.
  const openSearch = screen.queryByRole("button", { name: /^Add a card to /, expanded: false });
  if (openSearch) {
    await user.click(openSearch);
  }
  const searchInput = screen.getByPlaceholderText("Search for a card to add");
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
  // Look-matching pass (slice N, review 1 fix — finding 3): the field now sits in
  // `.search-row`, a sibling of `.search-results` inside the shared `.search-pop`
  // (no more `<label>` wrapper with the panel as its next sibling).
  const searchPop = searchInput.closest(".search-pop");
  const suggestionPanel = searchPop?.querySelector(".search-results");
  if (!(suggestionPanel instanceof HTMLElement)) {
    return [];
  }
  const hasAutocompleteContent =
    within(suggestionPanel).queryByText("Loading cards...") !== null ||
    within(suggestionPanel).queryByText(NO_MATCH_COPY) !== null ||
    suggestionPanel.querySelector("button") !== null;
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
  // Look-matching pass (slice N, review 1 fix — finding 3): open whichever zone's
  // ＋ Add card chip is currently showing (there is only ever one active zone's
  // `.attach` row at a time) before searching — a no-op if already open.
  const chip = screen.queryByRole("button", { name: /^Add a card to /, expanded: false });
  if (chip) {
    await user.click(chip);
  }
  const searchInput = screen.getByPlaceholderText("Search for a card to add");
  await user.clear(searchInput);
  await user.type(searchInput, query);
  await user.click(await screen.findByRole("button", { name: cardName }));
}

export async function addCardToStack(
  user: ReturnType<typeof userEvent.setup>,
  query: string,
  cardName: string
): Promise<void> {
  await openZoneCardSearch(user, "Stack");
  await selectCard(user, query, cardName);
  await user.click(screen.getByRole("button", { name: /Begin stackening!|Add to Stack/ }));
  await user.clear(screen.getByPlaceholderText("Search for a card to add"));
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
