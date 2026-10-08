import assert from "node:assert/strict";
import test from "node:test";

import { buildCaseRequest } from "./prompt-fidelity.mjs";

const PANHARMONICON = { oracleId: "76678885-3674-443d-b9a2-2a460cf6aac0", name: "Panharmonicon" };
const TARMOGOYF = { oracleId: "45900b2f-f6a9-4c42-9642-008f3c1cf6dd", name: "Tarmogoyf" };

test("buildCaseRequest asks a case that names no real card as the bare question", () => {
  assert.deepEqual(buildCaseRequest({ question: "Does trample need lethal first?", cards: [], gameState: null }), {
    mode: "lookup",
    question: "Does trample need lethal first?"
  });
});

test("buildCaseRequest attaches every cards entry by oracle id, whatever the tier (REQ-185)", () => {
  const request = buildCaseRequest({
    question: "Does Panharmonicon double a Tarmogoyf token's trigger?",
    cards: [PANHARMONICON, TARMOGOYF],
    gameState: null
  });
  assert.deepEqual(request, {
    mode: "lookup",
    question: "Does Panharmonicon double a Tarmogoyf token's trigger?",
    // cardId is the oracle id: the key both the rulings index and the card-detail index resolve by.
    cards: [
      { cardId: PANHARMONICON.oracleId, name: "Panharmonicon" },
      { cardId: TARMOGOYF.oracleId, name: "Tarmogoyf" }
    ]
  });
});

test("buildCaseRequest asks a case with a gameState as an In-Depth game request with its cards in their zones", () => {
  const gameState = {
    playerCount: 2,
    players: [
      { label: "Player 1", lifeTotal: 20 },
      { label: "Player 2", lifeTotal: 20 }
    ],
    turnPhase: "cleanup",
    selectedZones: ["stack", "battlefield"],
    zones: {
      stack: [{ cardId: PANHARMONICON.oracleId, caster: "Player 1" }],
      battlefield: [{ cardId: TARMOGOYF.oracleId, name: "Tarmogoyf", owner: "Player 2" }]
    }
  };
  const request = buildCaseRequest({ question: "Q?", cards: [PANHARMONICON, TARMOGOYF], gameState });
  assert.equal(request.mode, "game");
  assert.equal(request.question, "Q?");
  assert.equal(request.gameContext.turnPhase, "cleanup");
  // A zone card without a name takes it from the attached card; stack order is the stack array's order.
  assert.deepEqual(request.gameContext.zones.stack, [
    { cardId: PANHARMONICON.oracleId, caster: "Player 1", name: "Panharmonicon" }
  ]);
  assert.deepEqual(request.gameContext.zones.battlefield, gameState.zones.battlefield);
  // The case's own gameState is left untouched.
  assert.equal(gameState.zones.stack[0].name, undefined);
});

// ---------------------------------------------------------------------------
// loadPromptResources (REQ-188): the evaluation loader matches production's combo default
// ---------------------------------------------------------------------------

import { COMBO_ENRICHMENT_ENV, loadPromptResources } from "./prompt-fidelity.mjs";

function fakeModules() {
  const loaded = [];
  const resolveBooleanEnv = (value, name, fallback) => {
    if (value === undefined || value === "") return fallback;
    if (["false", "0", "no"].includes(String(value).toLowerCase())) return false;
    if (["true", "1", "yes"].includes(String(value).toLowerCase())) return true;
    throw new Error(`${name} must be a boolean`);
  };
  return {
    loaded,
    modules: {
      loadGameRulesTopics: (path) => (loaded.push(path), [{ id: "topic" }]),
      loadGameRulesRuleIndex: (path) => (loaded.push(path), [{ ruleId: "100.1" }]),
      loadCardRulingsIndex: (path) => (loaded.push(path), new Map()),
      loadCardDetailIndex: (path) => (loaded.push(path), new Map()),
      loadComboCatalog: (detailPath, indexPath) => (loaded.push(detailPath, indexPath), { variantCount: 3 }),
      resolveBooleanEnv
    }
  };
}

test("loadPromptResources loads the combo catalog by default (production's default) and the flag is readable from the resources", async () => {
  const { loaded, modules } = fakeModules();
  const resources = await loadPromptResources({ env: {}, modules });
  assert.deepEqual(resources.comboCatalog, { variantCount: 3 })
  assert.equal(Boolean(resources.comboCatalog), true, "the run records comboCatalogLoaded from this")
  assert.ok(loaded.some((path) => path.endsWith("commanderSpellbookComboBlocks.br")))
  assert.ok(loaded.some((path) => path.endsWith("commanderSpellbookComboIndex.json.br")))
  // The four files createConfiguredApp always loads are still loaded.
  assert.ok(loaded.some((path) => path.endsWith("gameRulesByTopic.json")))
  assert.ok(loaded.some((path) => path.endsWith("gameRulesRuleIndex.json")))
  assert.ok(loaded.some((path) => path.endsWith("cardRulingsByOracleId.json.br")))
  assert.ok(loaded.some((path) => path.endsWith("cardDetailByOracleId.json.br")))
});

test("loadPromptResources leaves the combo catalog out, and loads nothing for it, when combo enrichment is turned off", async () => {
  const { loaded, modules } = fakeModules();
  const resources = await loadPromptResources({ env: { [COMBO_ENRICHMENT_ENV]: "false" }, modules });
  assert.equal("comboCatalog" in resources, false);
  assert.ok(!loaded.some((path) => path.includes("commanderSpellbook")));
});
