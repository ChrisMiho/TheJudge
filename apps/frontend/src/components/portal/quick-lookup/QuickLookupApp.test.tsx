import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CardMetadataItem } from "../../../types";
import { NO_MATCH_COPY } from "../../../lib/search";
import { deriveCardImageUrl } from "../../../lib/cardImage";
import { toCardDetail, toSlimMetadata, type CardFixture } from "../../../test/appTestHelpers";
import { QuickLookupApp } from "./QuickLookupApp";

const lightningBolt: CardFixture = {
  cardId: "oracle-lightning-bolt",
  name: "Lightning Bolt",
  oracleText: "Lightning Bolt deals 3 damage to any target.",
  imageId: "lightning-bolt-fixture-id",
  manaCost: "{R}",
  manaValue: 1,
  typeLine: "Instant",
  colors: ["R"],
  supertypes: [],
  subtypes: []
};

const counterspell: CardFixture = {
  cardId: "oracle-counterspell",
  name: "Counterspell",
  oracleText: "Counter target spell.",
  imageId: "counterspell-fixture-id",
  manaCost: "{U}{U}",
  manaValue: 2,
  typeLine: "Instant",
  colors: ["U"],
  supertypes: [],
  subtypes: []
};

function simpleCard(cardId: string, name: string): CardFixture {
  return {
    cardId,
    name,
    oracleText: `${name} oracle text.`,
    imageId: `${cardId}-fixture-id`,
    manaCost: "{1}",
    manaValue: 1,
    typeLine: "Instant",
    colors: [],
    supertypes: [],
    subtypes: []
  };
}

// REQ-167 (amended): enough distinct cards to exercise the 10-card cap and an 11th
// blocked add.
const giantGrowth = simpleCard("oracle-giant-growth", "Giant Growth");
const doomBlade = simpleCard("oracle-doom-blade", "Doom Blade");
const brainstorm = simpleCard("oracle-brainstorm", "Brainstorm");
const wrathOfGod = simpleCard("oracle-wrath-of-god", "Wrath of God");
const shock = simpleCard("oracle-shock", "Shock");
const divination = simpleCard("oracle-divination", "Divination");
const terror = simpleCard("oracle-terror", "Terror");
const healingSalve = simpleCard("oracle-healing-salve", "Healing Salve");
const opt = simpleCard("oracle-opt", "Opt");
const allLookupCards = [
  lightningBolt,
  counterspell,
  giantGrowth,
  doomBlade,
  brainstorm,
  wrathOfGod,
  shock,
  divination,
  terror,
  healingSalve,
  opt
];

const scrollIntoView = vi.fn();
const scanState = vi.hoisted(() => ({ isOpen: false }));

vi.mock("../../../hooks/useScanCapture", () => ({
  useScanCapture: ({
    cardMetadata,
    onScanCandidateSelected
  }: {
    cardMetadata: CardMetadataItem[];
    onScanCandidateSelected: (card: CardMetadataItem, scanImageUrl: string) => unknown;
  }) => ({
    isOpen: scanState.isOpen,
    heldEntries: [],
    removeHeld: vi.fn(),
    isLoading: false,
    error: null,
    convergence: {
      phase: "searching",
      leaderName: null,
      votes: 0,
      votesNeeded: 3,
      conditionHint: null,
      detectorNudge: null,
      inZone: false
    },
    addConfirmation: null,
    scanDebug: null,
    openScan: async () => {
      const scannedCard = cardMetadata.find((card) => card.cardId === counterspell.cardId);
      if (scannedCard) {
        onScanCandidateSelected(scannedCard, "data:image/png;base64,scan-art");
      }
    },
    closeScan: vi.fn(),
    identify: vi.fn(),
    setCameraStatus: vi.fn(),
    recordAcquisitionDiagnostic: vi.fn()
  })
}));

function jsonResponse(payload: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: async () => payload
  } as Response;
}

/** REQ-175/FLOW-024: the popup fetches a card's descriptive block by oracle id
 * from `GET /api/cards/:oracleId` — matched here against the same fixtures
 * used to seed `/data/cardMetadata.json`. */
function cardDetailResponseFor(
  url: string,
  cardMetadata: CardFixture[]
): Response | undefined {
  const match = url.match(/\/api\/cards\/([^/?]+)$/);
  if (!match) {
    return undefined;
  }
  const oracleId = decodeURIComponent(match[1]);
  const card = cardMetadata.find((candidate) => candidate.cardId === oracleId);
  if (!card) {
    return new Response(null, { status: 404 });
  }
  return jsonResponse(toCardDetail(card));
}

/** REQ-176: the wire request carries only identity + image now — the
 * descriptive block is resolved server-side by cardId. REQ-174/Slice C: the
 * wire's `imageUrl` is derived from `CardMetadataItem`'s `imageId`, the same
 * way `buildLookupAskAiRequest` derives it. */
function toWireCard(card: CardMetadataItem): { cardId: string; name: string; imageUrl?: string } {
  return { cardId: card.cardId, name: card.name, imageUrl: deriveCardImageUrl(card.imageId) };
}

function appFetchMock(
  answers: string[],
  cardMetadata: CardFixture[] = [lightningBolt, counterspell]
): ReturnType<typeof vi.fn> {
  let answerIndex = 0;
  return vi.fn((input: RequestInfo | URL) => {
    const url = String(input);
    if (url === "/data/cardMetadata.json") {
      return Promise.resolve(jsonResponse(cardMetadata.map(toSlimMetadata)));
    }
    const cardDetailResponse = cardDetailResponseFor(url, cardMetadata);
    if (cardDetailResponse) {
      return Promise.resolve(cardDetailResponse);
    }
    if (url === "http://localhost:3000/api/ask-ai") {
      const answer = answers[answerIndex] ?? answers.at(-1) ?? "Answer";
      answerIndex += 1;
      return Promise.resolve(
        new Response(JSON.stringify({ answer }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        })
      );
    }
    throw new Error(`Unexpected fetch: ${url}`);
  });
}

/** Look-matching pass (slice M), requirement 1: the card search now opens from the
 * "＋ Add card" chip instead of sitting permanently visible. A no-op once already open,
 * so a sequence of several adds (REQ-167) takes one open, not one per card. */
async function openCardSearch(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  if (screen.queryByRole("textbox", { name: "Card search" })) {
    return;
  }
  await user.click(screen.getByRole("button", { name: "Add card" }));
}

describe("Frontend - Quick Lookup", () => {
describe("QuickLookupApp", () => {
  beforeEach(() => {
    scanState.isOpen = false;
    scrollIntoView.mockClear();
    Object.defineProperty(Element.prototype, "scrollIntoView", {
      configurable: true,
      value: scrollIntoView
    });
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false })));
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input);
        if (url === "/data/cardMetadata.json") {
          return Promise.resolve(jsonResponse([lightningBolt, counterspell].map(toSlimMetadata)));
        }
        const cardDetailResponse = cardDetailResponseFor(url, [lightningBolt, counterspell]);
        if (cardDetailResponse) {
          return Promise.resolve(cardDetailResponse);
        }
        throw new Error(`Unexpected fetch: ${url}`);
      })
    );
  });

  it("frames the pre-submit screen in the narrow-fit variant with the question box resting under the card stage, scanner open or not (REQ-218)", async () => {
    const user = userEvent.setup();
    const { container, unmount } = render(<QuickLookupApp />);

    expect(container.querySelector(".page-shell-fit")).not.toBeNull();
    expect(container.querySelector(".page-content-narrow-fit")).not.toBeNull();
    const qq = container.querySelector(".page-content-narrow-fit > .qq");
    expect(qq).not.toBeNull();
    // The composer sits directly under the card stage (top-rest), after the title row — it is
    // not bottom-pinned: no stylesheet rule pushes it to the foot or lets the stage eat the slack.
    const children = Array.from(qq?.children ?? []);
    const composerIndex = children.findIndex((child) => child.classList.contains("composer"));
    expect(composerIndex).toBeGreaterThan(0);
    const stageIndex = children.findIndex((child) => child.classList.contains("stage"));
    if (stageIndex >= 0) expect(stageIndex).toBeLessThan(composerIndex);
    const composer = qq?.children[composerIndex] as HTMLElement;
    expect(composer.style.marginTop).toBe("");

    // jsdom applies no stylesheet, so assert the frame rules at source: no bottom pin, no fixed
    // 176px textarea cap, and the stage no longer flexes to eat the slack above the box.
    const css = readFileSync(resolve(process.cwd(), "src/index.css"), "utf8");
    expect(css).not.toMatch(/\.page-content-narrow-fit > \.qq > \.composer\s*\{[^}]*margin-top:\s*auto/);
    expect(css).not.toMatch(/\.enrichment-question-surface\s*\{[^}]*margin-top:\s*auto/);
    expect(css).not.toMatch(/\.page-content-narrow-fit \.q-box textarea\s*\{[^}]*176px/);
    // The only element that scrolls is the textarea: the card stage and the In-depth context
    // region never scroll, and the card image is capped by the responsive breakpoints instead.
    const stageRule = css.match(/\.page-content-narrow-fit > \.qq > \.stage\s*\{([^}]*)\}/)?.[1] ?? "";
    expect(stageRule).toMatch(/flex:\s*0 0 auto/);
    expect(stageRule).not.toMatch(/overflow-y:\s*auto/);
    const plateRule = css.match(/\.idq-fit > \.idq-step > \.plate\s*\{([^}]*)\}/)?.[1] ?? "";
    expect(plateRule).not.toMatch(/overflow/);
    expect(css).toMatch(/\.page-content-narrow-fit\s*\{[^}]*--card-cap:\s*0\.4/);
    expect(css).toMatch(/@media \(min-width: 600px\)\s*\{\s*\.page-content-narrow-fit\s*\{\s*--card-cap:\s*0\.48/);
    expect(css).toMatch(/@media \(min-width: 720px\)\s*\{\s*\.page-content-narrow-fit\s*\{\s*--card-cap:\s*0\.55/);
    expect(css).toMatch(
      /@media \(max-width: 480px\) and \(max-height: 700px\)\s*\{\s*\.page-content-narrow-fit\s*\{\s*--card-cap:\s*0\.33;\s*\}\s*\.page-content-narrow-fit \.ring\s*\{\s*--card-w:\s*min\(162px,[^;]*--card-room/,
    );
    expect(css).toMatch(/\.page-content-narrow-fit \.ring\s*\{\s*--card-w:\s*min\(196px,[^;]*--card-room/);
    expect(css).toMatch(/\.page-content-narrow-fit \.q-box textarea\s*\{\s*max-height:\s*none/);
    expect(qq?.querySelector(".composer textarea")).not.toBeNull();
    await user.click(screen.getByRole("button", { name: "Add card" }));
    unmount();

    scanState.isOpen = true;
    const scanning = render(<QuickLookupApp />);
    expect(scanning.container.querySelector(".page-content-narrow-fit")).not.toBeNull();
    expect(scanning.container.querySelector(".page-content-narrow-fit > .idq .scan-exit")).not.toBeNull();
  });

  it("renders the Ask a Question title with Add card/Scan beside it, then the card search, then the question box — and no General rules topics panel (REQ-079 retired)", async () => {
    const user = userEvent.setup();
    render(<QuickLookupApp />);

    expect(screen.getByRole("heading", { name: "Ask a Question" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add card" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Scan a card" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "General rules topics" })).not.toBeInTheDocument();
    expect(screen.queryByText(/Choose a topic to start a question/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Add .* to question$/ })).not.toBeInTheDocument();

    // The card search is collapsed behind "＋ Add card" until opened.
    expect(screen.queryByRole("textbox", { name: "Card search" })).not.toBeInTheDocument();
    await openCardSearch(user);

    const cardSection = screen.getByRole("textbox", { name: "Card search" }).closest("section");
    const composerPill = screen.getByTestId("composer-pill");

    expect(cardSection).not.toBeNull();
    expect(cardSection!.compareDocumentPosition(composerPill) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    // The whole pre-submit column is the mockup's `.qq`, which flips to the strip while searching.
    expect(cardSection!.closest(".qq")).toHaveAttribute("data-searching", "true");
  });

  it("relabels the Add-card chip to \"Close search\" while search is open, so the same control that hides the card carousel on mobile reads as the way to bring it back", async () => {
    const user = userEvent.setup();
    render(<QuickLookupApp />);

    // Closed: the chip invites adding a card.
    expect(screen.getByRole("button", { name: "Add card" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Close search" })).not.toBeInTheDocument();

    await openCardSearch(user);

    // Open: the same toggle now reads as the close action (the only hint that tapping
    // it again closes search and reveals the carousel on mobile).
    expect(screen.getByRole("button", { name: "Close search" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add card" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close search" }));

    expect(screen.getByRole("button", { name: "Add card" })).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Card search" })).not.toBeInTheDocument();
  });

  it("makes no request for core topics and keeps the locked topic out of the draft (REQ-079 retired)", async () => {
    render(<QuickLookupApp />);
    await screen.findByRole("textbox", { name: "Magic question" });

    const fetched = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls.map(([input]) => String(input));
    expect(fetched.some((url) => url.includes("gameRulesCoreTopics"))).toBe(false);
  });

  it("resolves one card from autocomplete and supports removal", async () => {
    const user = userEvent.setup();
    render(<QuickLookupApp />);
    await openCardSearch(user);

    const searchInput = screen.getByRole("textbox", { name: "Card search" });
    await user.type(searchInput, "lig");
    await user.click(await screen.findByRole("button", { name: "Lightning Bolt" }));

    // REQ-133/DEC-160: the staged card is the image itself — the duplicated name heading and
    // metadata panel beside it are gone, so nothing repeats what the popup already carries.
    expect(screen.getByRole("img", { name: "Lightning Bolt" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Lightning Bolt" })).not.toBeInTheDocument();
    // Oracle text is not stacked under the image by default (DEC-151) — it is reached via
    // the suite-wide corner detail popup.
    expect(screen.queryByText(lightningBolt.oracleText!)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Show details for Lightning Bolt" }));
    expect(await screen.findByText(lightningBolt.oracleText!)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Close details for Lightning Bolt" }));

    await user.click(screen.getByRole("button", { name: "Remove Lightning Bolt" }));

    expect(screen.queryByRole("img", { name: "Lightning Bolt" })).not.toBeInTheDocument();
  });

  it("lists matches from the first character typed in the Add-card search (REQ-167)", async () => {
    const user = userEvent.setup();
    render(<QuickLookupApp />);
    await openCardSearch(user);

    await user.type(screen.getByRole("textbox", { name: "Card search" }), "l");

    expect(await screen.findByRole("button", { name: "Lightning Bolt" })).toBeInTheDocument();
  });

  it("shows the shared no-match copy for a three-character query", async () => {
    const user = userEvent.setup();
    render(<QuickLookupApp />);
    await openCardSearch(user);

    await user.type(screen.getByRole("textbox", { name: "Card search" }), "zzz");

    expect(await screen.findByText(NO_MATCH_COPY)).toBeInTheDocument();
  });

  it("uses palette-driven styling for the Scan and Ask controls, not a fixed hue (look-matching pass, slice M)", async () => {
    render(<QuickLookupApp />);

    const scanButton = screen.getByRole("button", { name: "Scan a card" });
    const askButton = screen.getByRole("button", { name: "Ask TheJudge" });
    // Restyled to `.icon-chip`/`.send-pair` (flow.css), which read the active palette's
    // CSS custom properties (`--accent`/`--accent-soft`/`--accent-strong`) rather than a
    // fixed Tailwind hue utility.
    expect(scanButton).toHaveClass("icon-chip");
    expect(scanButton.className).not.toMatch(/emerald|green|sky|blue-[0-9]/);
    expect(askButton.className).not.toMatch(/emerald|green|sky|blue-[0-9]/);
  });

  it("uses the shared scan flow to resolve a single card", async () => {
    const user = userEvent.setup();
    render(<QuickLookupApp />);

    await waitFor(() => expect(fetch).toHaveBeenCalledWith("/data/cardMetadata.json", expect.anything()));
    await user.click(screen.getByRole("button", { name: "Scan a card" }));

    expect(await screen.findByRole("img", { name: "Counterspell" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Show details for Counterspell" }));
    expect(await screen.findByText(counterspell.oracleText!)).toBeInTheDocument();
  });

  it("caps the raw question at 300 characters and blocks blank submission", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<QuickLookupApp onSubmit={onSubmit} />);

    const questionInput = screen.getByRole("textbox", { name: "Magic question" });
    const submitButton = screen.getByRole("button", { name: "Ask TheJudge" });
    expect(questionInput).toHaveAttribute("maxLength", "300");
    expect(submitButton).toBeDisabled();

    await user.type(questionInput, "   ");
    expect(submitButton).toBeDisabled();
    await user.clear(questionInput);
    await user.type(questionInput, "a".repeat(301));
    expect(questionInput).toHaveValue("a".repeat(300));
    expect(screen.getByText("300 / 300")).toBeInTheDocument();
    expect(submitButton).toBeEnabled();

    await user.click(submitButton);
    expect(onSubmit).toHaveBeenLastCalledWith("a".repeat(300), []);
  });

  it("counts the editable text rather than the silent card fallback", async () => {
    const user = userEvent.setup();
    render(<QuickLookupApp />);
    await openCardSearch(user);

    await user.type(screen.getByRole("textbox", { name: "Card search" }), "lig");
    await user.click(await screen.findByRole("button", { name: "Lightning Bolt" }));

    const questionInput = screen.getByRole("textbox", { name: "Magic question" });
    // REQ-206: at 0 characters the box carries data-fill="0", which hides the count and the ring (flow.css).
    expect(screen.getByTestId("composer-pill")).toHaveAttribute("data-fill", "0");

    await user.type(questionInput, "x");
    expect(screen.getByText("1 / 300")).toBeInTheDocument();
    expect(screen.getByTestId("composer-pill")).toHaveAttribute("data-fill", "some");

    await user.clear(questionInput);
    expect(screen.getByTestId("composer-pill")).toHaveAttribute("data-fill", "0");
    expect(screen.getByRole("button", { name: "Ask TheJudge" })).toBeEnabled();
  });

  it("submits a silent card-name fallback when only a card is attached", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<QuickLookupApp onSubmit={onSubmit} />);
    await openCardSearch(user);

    await user.type(screen.getByRole("textbox", { name: "Card search" }), "lig");
    await user.click(await screen.findByRole("button", { name: "Lightning Bolt" }));

    const submitButton = screen.getByRole("button", { name: "Ask TheJudge" });
    expect(submitButton).toBeEnabled();
    await user.click(submitButton);

    expect(onSubmit).toHaveBeenCalledWith("Tell me about Lightning Bolt.", [toSlimMetadata(lightningBolt)]);
  });

  it("replaces the question form during the initial wait and restores it on error", async () => {
    const user = userEvent.setup();
    let resolveAskAi: ((response: Response) => void) | undefined;
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url === "/data/cardMetadata.json") {
        return Promise.resolve(jsonResponse([lightningBolt, counterspell].map(toSlimMetadata)));
      }
      if (url === "http://localhost:3000/api/ask-ai") {
        return new Promise<Response>((resolve) => {
          resolveAskAi = resolve;
        });
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<QuickLookupApp />);
    // Look-matching pass (slice M): the card search lives beside the composer in one
    // shared wrapper, independent of the submit state — opened once here, it stays
    // available while the answer loads below, same as it did permanently before this
    // slice.
    await openCardSearch(user);

    await user.type(
      screen.getByRole("textbox", { name: "Magic question" }),
      "How does priority work?"
    );
    await user.click(screen.getByRole("button", { name: "Ask TheJudge" }));

    expect(await screen.findByText("Consulting the stack…")).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Magic question" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ask TheJudge" })).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Card search" })).toBeEnabled();

    await act(async () => {
      resolveAskAi?.(
        new Response(
          JSON.stringify({
            code: "PROVIDER_UNAVAILABLE",
            message: "Miho is working on it",
            retryAfterSeconds: 13
          }),
          {
            status: 502,
            headers: { "Content-Type": "application/json" }
          }
        )
      );
    });

    expect(await screen.findByText("Miho is working on it")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Magic question" })).toHaveValue(
      "How does priority work?"
    );
    expect(screen.getByRole("button", { name: "Ask TheJudge" })).toBeInTheDocument();
    expect(screen.queryByText("Consulting the stack…")).not.toBeInTheDocument();
  });

  it("runs a cardless conversation (question shown first, REQ-025) and clears the question on start over", async () => {
    const user = userEvent.setup();
    const fetchMock = appFetchMock(["First lookup answer", "Follow-up lookup answer"]);
    vi.stubGlobal("fetch", fetchMock);
    render(<QuickLookupApp />);

    await user.type(screen.getByRole("textbox", { name: "Magic question" }), "How does priority work?");
    await user.click(screen.getByRole("button", { name: "Ask TheJudge" }));

    expect(await screen.findByText("First lookup answer")).toBeInTheDocument();
    expect(screen.getAllByTestId("conversation-workspace")).toHaveLength(1);
    expect(screen.getByRole("log")).toHaveAttribute("aria-relevant", "additions text");
    expect(screen.getByText("How does priority work?")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /View context:/ })).not.toBeInTheDocument();
    const initialAskRequest = fetchMock.mock.calls.find(([input]) =>
      String(input).endsWith("/api/ask-ai")
    );
    expect(JSON.parse(initialAskRequest?.[1]?.body as string)).toEqual({
      mode: "lookup",
      question: "How does priority work?"
    });

    await user.type(screen.getByRole("textbox", { name: "Follow-up question" }), "Can you give an example?");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByText("Follow-up lookup answer")).toBeInTheDocument();
    const askRequests = fetchMock.mock.calls.filter(([input]) =>
      String(input).endsWith("/api/ask-ai")
    );
    expect(JSON.parse(askRequests[1]?.[1]?.body as string)).toEqual({
      mode: "lookup",
      question: "Can you give an example?",
      conversationHistory: [
        { role: "user", content: "How does priority work?" },
        { role: "assistant", content: "First lookup answer" }
      ]
    });

    await user.click(screen.getByRole("button", { name: "Start over — clears the cards and the question" }));

    expect(screen.queryByText("First lookup answer")).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Magic question" })).toHaveValue("");
  });

  it("freezes an attached card for the thread and follow-ups, then clears it on start over", async () => {
    const user = userEvent.setup();
    const fetchMock = appFetchMock(["Card lookup answer", "Card follow-up answer"]);
    vi.stubGlobal("fetch", fetchMock);
    render(<QuickLookupApp />);
    await openCardSearch(user);

    await user.type(screen.getByRole("textbox", { name: "Card search" }), "lig");
    await user.click(await screen.findByRole("button", { name: "Lightning Bolt" }));
    await user.type(screen.getByRole("textbox", { name: "Magic question" }), "What can this target?");
    await user.click(screen.getByRole("button", { name: "Ask TheJudge" }));

    expect(await screen.findByText("Card lookup answer")).toBeInTheDocument();
    expect(screen.getAllByTestId("conversation-workspace")).toHaveLength(1);
    expect(screen.queryByRole("img", { name: "Lightning Bolt" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove Lightning Bolt" })).not.toBeInTheDocument();
    // Look-matching pass (slice M), requirement 11: the "VIEW CONTEXT" trigger is
    // retired here in favour of the CARDS thumbnail strip — a tap on the one thumbnail
    // opens the same corner card-detail popup the stage uses.
    await user.click(screen.getByRole("button", { name: "View Lightning Bolt" }));
    expect(await screen.findByRole("heading", { name: "Lightning Bolt" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove Lightning Bolt" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Close details for Lightning Bolt" }));
    const initialAskRequest = fetchMock.mock.calls.find(([input]) =>
      String(input).endsWith("/api/ask-ai")
    );
    expect(JSON.parse(initialAskRequest?.[1]?.body as string)).toEqual({
      mode: "lookup",
      question: "What can this target?",
      cards: [toWireCard(lightningBolt)]
    });

    await user.type(screen.getByRole("textbox", { name: "Follow-up question" }), "What if I copy it?");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByText("Card follow-up answer")).toBeInTheDocument();
    const askRequests = fetchMock.mock.calls.filter(([input]) =>
      String(input).endsWith("/api/ask-ai")
    );
    expect(JSON.parse(askRequests[1]?.[1]?.body as string)).toMatchObject({
      mode: "lookup",
      question: "What if I copy it?",
      cards: [toWireCard(lightningBolt)]
    });

    await user.click(screen.getByRole("button", { name: "Start over — clears the cards and the question" }));

    expect(screen.queryByText("Card lookup answer")).not.toBeInTheDocument();
    expect(screen.queryByRole("img", { name: "Lightning Bolt" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove Lightning Bolt" })).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Card search" })).toHaveValue("");
    expect(screen.getByRole("textbox", { name: "Magic question" })).toHaveValue("");
  });

  describe("multi-card lookup (REQ-167)", () => {
    async function addCardByName(user: ReturnType<typeof userEvent.setup>, query: string, name: string): Promise<void> {
      await openCardSearch(user);
      const searchInput = screen.getByRole("textbox", { name: "Card search" });
      await user.clear(searchInput);
      await user.type(searchInput, query);
      await user.click(await screen.findByRole("button", { name }));
    }

    it("adds and removes more than one card via typed search, on the lit card stage", async () => {
      const user = userEvent.setup();
      vi.stubGlobal("fetch", appFetchMock([], allLookupCards));
      render(<QuickLookupApp />);

      await addCardByName(user, "lig", "Lightning Bolt");
      expect(screen.getByTestId("card-stage-count")).toHaveAccessibleName("Card 1 of 1");
      await addCardByName(user, "cou", "Counterspell");
      expect(screen.getByTestId("card-stage-count")).toHaveAccessibleName("Card 2 of 2");

      // REQ-206: the stage shows the front card (the one just added) full size with its one
      // neighbour peeking — the front card carries the Remove control.
      expect(screen.getByRole("img", { name: "Counterspell" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Show Lightning Bolt on the stage" })).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Remove Counterspell" }));

      expect(screen.queryByRole("img", { name: "Counterspell" })).not.toBeInTheDocument();
      expect(screen.getByRole("img", { name: "Lightning Bolt" })).toBeInTheDocument();
      expect(screen.getByTestId("card-stage-count")).toHaveAccessibleName("Card 1 of 1");
    });

    it("blocks an add past the 10-card cap and states the limit to the player (REQ-167 amended)", async () => {
      const user = userEvent.setup();
      vi.stubGlobal("fetch", appFetchMock([], allLookupCards));
      render(<QuickLookupApp />);

      for (const [query, name] of [
        ["lig", "Lightning Bolt"],
        ["cou", "Counterspell"],
        ["gia", "Giant Growth"],
        ["doo", "Doom Blade"],
        ["bra", "Brainstorm"],
        ["wra", "Wrath of God"],
        ["sho", "Shock"],
        ["div", "Divination"],
        ["ter", "Terror"],
        ["hea", "Healing Salve"]
      ] as const) {
        await addCardByName(user, query, name);
      }

      expect(screen.getByTestId("card-stage-count")).toHaveAccessibleName("Card 10 of 10");
      expect(screen.queryByText(/You've added 10 cards/)).not.toBeInTheDocument();

      const searchInput = screen.getByRole("textbox", { name: "Card search" });
      await user.clear(searchInput);
      await user.type(searchInput, "opt");
      await user.click(await screen.findByRole("button", { name: "Opt" }));

      expect(
        screen.getByText("You've added 10 cards, the most one Quick Question can use. Remove a card below to add another.")
      ).toBeInTheDocument();
      expect(screen.queryByRole("img", { name: "Opt" })).not.toBeInTheDocument();
      expect(screen.getByTestId("card-stage-count")).toHaveAccessibleName("Card 10 of 10");
    });

    it("submits the full attached card list, freezes every card in context, and sends the frozen set on a follow-up", async () => {
      const user = userEvent.setup();
      const fetchMock = appFetchMock(["Multi-card answer", "Multi-card follow-up answer"], allLookupCards);
      vi.stubGlobal("fetch", fetchMock);
      render(<QuickLookupApp />);

      await addCardByName(user, "lig", "Lightning Bolt");
      await addCardByName(user, "cou", "Counterspell");
      await user.type(screen.getByRole("textbox", { name: "Magic question" }), "How do these interact?");
      await user.click(screen.getByRole("button", { name: "Ask TheJudge" }));

      expect(await screen.findByText("Multi-card answer")).toBeInTheDocument();
      const initialAskRequest = fetchMock.mock.calls.find(([input]) => String(input).endsWith("/api/ask-ai"));
      expect(JSON.parse(initialAskRequest?.[1]?.body as string)).toEqual({
        mode: "lookup",
        question: "How do these interact?",
        cards: [toWireCard(lightningBolt), toWireCard(counterspell)]
      });

      // Look-matching pass (slice M), requirement 11: both cards show in the CARDS strip,
      // each its own tappable thumbnail opening the shared card-detail popup.
      expect(screen.getByRole("button", { name: "View Lightning Bolt" })).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "View Counterspell" }));
      expect(await screen.findByRole("heading", { name: "Counterspell" })).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "Close details for Counterspell" }));

      await user.type(screen.getByRole("textbox", { name: "Follow-up question" }), "What if both resolve?");
      await user.click(screen.getByRole("button", { name: "Send" }));

      expect(await screen.findByText("Multi-card follow-up answer")).toBeInTheDocument();
      const askRequests = fetchMock.mock.calls.filter(([input]) => String(input).endsWith("/api/ask-ai"));
      expect(JSON.parse(askRequests[1]?.[1]?.body as string)).toMatchObject({
        mode: "lookup",
        question: "What if both resolve?",
        cards: [toWireCard(lightningBolt), toWireCard(counterspell)]
      });
    });
  });
});
});
