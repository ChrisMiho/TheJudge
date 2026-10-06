import { describe, expect, it } from "vitest";
// The rules test corpus has one loader and one request builder (REQ-185). Both
// are plain .mjs modules under scripts/lib; these static imports resolve the
// real modules at run time and their sibling .d.mts declarations at typecheck
// time, so this test can never drift onto a second copy.
import { loadGoldCases, validateGoldCase, type GoldCase } from "../../../../scripts/lib/gold-cases.mjs";
import { buildCaseRequest } from "../../../../scripts/lib/prompt-fidelity.mjs";
import { askAiRequestSchema } from "../validation/askAiRequest.js";

const COPY_ID = "11111111-1111-4111-8111-111111111111";
const BOLT_ID = "22222222-2222-4222-8222-222222222222";
const BEAR_ID = "33333333-3333-4333-8333-333333333333";

function fixtureGameCase(overrides: Partial<GoldCase> = {}): GoldCase {
  return {
    id: "fixture-game-state",
    formatVersion: 2,
    tier: 3,
    review: { status: "draft", reviewedOn: null },
    cards: [
      { oracleId: COPY_ID, name: "Fixture Copy Spell" },
      { oracleId: BOLT_ID, name: "Fixture Bolt" },
      { oracleId: BEAR_ID, name: "Fixture Bear" }
    ],
    gameState: {
      playerCount: 2,
      players: [
        { label: "Player 1", lifeTotal: 20 },
        { label: "Player 2", lifeTotal: 20 }
      ],
      turnPhase: "main_1",
      activePlayer: "Player 1",
      selectedZones: ["stack", "battlefield"],
      zones: {
        stack: [
          { cardId: COPY_ID, name: "Fixture Copy Spell", caster: "Player 1" },
          { cardId: BOLT_ID, name: "Fixture Bolt", caster: "Player 2" }
        ],
        battlefield: [
          { cardId: BEAR_ID, name: "Fixture Bear", owner: "Player 2", contextNotes: "controlled by Player 1" }
        ]
      }
    },
    question: "Which resolves first, and who controls the bear?",
    expected: {
      outcome: "works",
      shortAnswer: "The top of the stack resolves first.",
      answer: "The last spell put on the stack resolves first.",
      decidingRuleIds: ["405.5"]
    },
    source: {
      authority: "owner-approved-derived",
      citation: "CR 405.5",
      research: ["fixture"],
      publisher: "Fixture",
      license: "Fixture"
    },
    layers: { requiredFacts: [], irrelevantFacts: [], variants: [] },
    snapshot: {
      ruleIndexHash: "0".repeat(64),
      dependsOnHashes: { rules: "0".repeat(64), oracle: "0".repeat(64), rulings: "0".repeat(64) }
    },
    whyHard: "Fixture.",
    ...overrides
  };
}

describe("Backend - Eval - rules test case request (REQ-185)", () => {
  it("loads the committed corpus through the shared loader with every case valid", async () => {
    const cases = await loadGoldCases();
    expect(cases.length).toBeGreaterThanOrEqual(18);
    for (const caseEntry of cases) {
      expect(caseEntry.formatVersion).toBe(2);
      expect(Array.isArray(caseEntry.tags)).toBe(true);
    }
  });

  it("asks a case without a game state as a lookup that attaches every card by oracle id, and the request schema accepts it", async () => {
    const cases = await loadGoldCases();
    const withCards = cases.filter((caseEntry) => caseEntry.cards.length > 0 && caseEntry.gameState === null);
    // The four first-ship cases that name a real card (three tier-2 rulings and the Tarmogoyf token question), and every
    // later case that attaches one: each is asked as a lookup carrying exactly its attached cards.
    const firstShipWithCards = [
      "panharmonicon-controller-not-entering-permanent",
      "restoration-angel-blink-resets-counters",
      "sensei-top-leaves-battlefield-ability-on-stack",
      "token-created-by-name-uses-oracle-card"
    ];
    expect(withCards.map((caseEntry) => caseEntry.id)).toEqual(expect.arrayContaining(firstShipWithCards));
    for (const caseEntry of withCards) {
      const request = buildCaseRequest(caseEntry);
      expect(request.mode).toBe("lookup");
      if (request.mode !== "lookup") throw new Error("expected a lookup request");
      expect(request.cards).toEqual(caseEntry.cards.map((card) => ({ cardId: card.oracleId, name: card.name })));
      expect(askAiRequestSchema.safeParse(request).success).toBe(true);
    }
  });

  it("asks a case with a game state as an In-Depth game request with each card in its zone and the stack in order", () => {
    const caseEntry = fixtureGameCase();
    expect(validateGoldCase(caseEntry).valid).toBe(true);

    const request = buildCaseRequest(caseEntry);
    expect(request.mode).toBe("game");
    const parsed = askAiRequestSchema.safeParse(request);
    expect(parsed.success).toBe(true);
    if (!parsed.success || parsed.data.mode !== "game") throw new Error("expected an accepted game request");

    const { zones } = parsed.data.gameContext;
    expect(zones.stack?.map((item) => item.cardId)).toEqual([COPY_ID, BOLT_ID]);
    expect(zones.stack?.map((item) => item.caster)).toEqual(["Player 1", "Player 2"]);
    expect(zones.battlefield?.[0]).toMatchObject({
      cardId: BEAR_ID,
      owner: "Player 2",
      contextNotes: "controlled by Player 1"
    });
  });

  it("fills a zone card's missing name from the attached card", () => {
    const fixture = fixtureGameCase();
    const stack = [{ cardId: COPY_ID, caster: "Player 1" }, { cardId: BOLT_ID, name: "Fixture Bolt", caster: "Player 2" }];
    const caseEntry = fixtureGameCase({
      gameState: { ...fixture.gameState!, zones: { stack, battlefield: fixture.gameState!.zones!.battlefield } }
    });
    const request = buildCaseRequest(caseEntry);
    if (request.mode !== "game") throw new Error("expected a game request");
    const parsed = askAiRequestSchema.safeParse(request);
    expect(parsed.success).toBe(true);
    expect((request.gameContext as { zones: { stack: Array<{ name: string }> } }).zones.stack[0].name).toBe(
      "Fixture Copy Spell"
    );
  });
});
