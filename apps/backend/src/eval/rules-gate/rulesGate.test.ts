import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it, vi } from "vitest";
// The gate reads cases through the one shared loader and builds requests through
// the one shared request builder, by static import of the real .mjs modules
// (their sibling .d.mts declarations carry the types; REQ-185, A3).
import { loadGoldCases, type GoldCase } from "../../../../../scripts/lib/gold-cases.mjs";
import {
  buildCaseRequest,
  loadPromptResources,
  type PromptResources
} from "../../../../../scripts/lib/prompt-fidelity.mjs";
import { preparePromptInput } from "../../prompt/preparation.js";
import { askAiRequestSchema } from "../../validation/askAiRequest.js";
import { BASELINE_PATH, loadBaseline } from "./baseline.js";
import {
  FROZEN_VECTORS_PATH,
  buildCaseQueryText,
  checkReFreeze,
  decodeVector,
  encodeVector,
  hashQueryText,
  loadFrozenVectors,
  type FrozenVectorFile
} from "./frozenVectors.js";
import {
  checkCards,
  evaluateRulesGate,
  findGameStateSchemaFailures,
  raiseBaseline,
  type RulesGateBaseline
} from "./rulesGate.js";
import { checkStateFacts } from "./stateFacts.js";

// No model call, no network: the gate ranks with committed frozen vectors. If any
// code path under test reached for the local embedder or the network, these fail.
const embedSpy = vi.hoisted(() => vi.fn(async () => {
  throw new Error("the offline gate must never invoke the embedder");
}));
vi.mock("../../providers/localEmbeddingProvider.js", () => ({
  localEmbeddingProvider: { embed: embedSpy },
  LOCAL_MODEL_ID: "mock",
  LOCAL_MODEL_CACHE_DIR: "mock"
}));

const currentDir = dirname(fileURLToPath(import.meta.url));

const PANHARMONICON = { oracleId: "76678885-3674-443d-b9a2-2a460cf6aac0", name: "Panharmonicon" };
const TARMOGOYF = { oracleId: "45900b2f-f6a9-4c42-9642-008f3c1cf6dd", name: "Tarmogoyf" };

let resources: PromptResources;
let cases: GoldCase[];
let vectors: FrozenVectorFile;
let baseline: RulesGateBaseline;
let fetchSpy: { mock: { calls: unknown[][] } };

beforeAll(async () => {
  fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
    throw new Error("the offline gate must never use the network");
  });
  resources = await loadPromptResources();
  cases = await loadGoldCases();
  vectors = loadFrozenVectors();
  baseline = loadBaseline();
});

function runGate(overrides: Partial<Parameters<typeof evaluateRulesGate>[0]> = {}) {
  return evaluateRulesGate({ cases, resources, vectors, baseline, buildRequest: buildCaseRequest, ...overrides });
}

/** A second-case fixture sharing a real case's attached cards and a stack of two items with a controller note. */
function fixtureGameCase(overrides: Partial<GoldCase> = {}): GoldCase {
  const template = cases[0];
  return {
    ...template,
    id: "fixture-game-state",
    tier: 3,
    review: { status: "draft", reviewedOn: null },
    cards: [PANHARMONICON, TARMOGOYF],
    question: "Fixture: which resolves first, and who controls the Tarmogoyf?",
    gameState: {
      playerCount: 2,
      players: [
        { label: "Player 1", lifeTotal: 18 },
        { label: "Player 2", lifeTotal: 20 }
      ],
      turnPhase: "main_1",
      activePlayer: "Player 1",
      selectedZones: ["stack", "battlefield"],
      zones: {
        stack: [
          { cardId: PANHARMONICON.oracleId, name: "Panharmonicon", caster: "Player 2", targets: [{ kind: "player", targetPlayer: "Player 1" }] },
          { cardId: TARMOGOYF.oracleId, name: "Tarmogoyf", caster: "Player 1" }
        ],
        battlefield: [
          { cardId: PANHARMONICON.oracleId, name: "Panharmonicon", owner: "Player 2", contextNotes: "controlled by Player 1" }
        ]
      }
    },
    ...overrides
  };
}

function preparedPrompt(caseEntry: GoldCase): string {
  const parsed = askAiRequestSchema.parse(buildCaseRequest(caseEntry));
  return preparePromptInput(parsed, { ...resources, collectEnrichmentDebug: true }).promptText;
}

describe("Backend - Eval - offline prompt gate (REQ-222)", () => {
  describe("the committed corpus", () => {
    it("passes the gate against the committed baseline, with the 16 of 18 first-ship cases hitting", () => {
      const outcome = runGate();
      expect(outcome.report).toContain("Rules gate:");
      expect(outcome.results.filter((result) => result.failures.length > 0)).toEqual([]);
      expect(outcome.results.filter((result) => result.regressions.length > 0)).toEqual([]);
      expect(outcome.ok).toBe(true);

      const firstShip = cases.filter((caseEntry) => caseEntry.review.reviewedOn !== null && caseEntry.tier !== 3);
      expect(firstShip.length).toBeGreaterThanOrEqual(18);
      const recorded = firstShip.filter((caseEntry) => baseline.cases[caseEntry.id]);
      const hits = recorded.filter((caseEntry) => baseline.cases[caseEntry.id].miss.length === 0);
      const misses = recorded.filter((caseEntry) => baseline.cases[caseEntry.id].miss.length > 0).map((c) => c.id);
      expect(hits.length).toBe(16);
      expect(misses.sort()).toEqual([
        "panharmonicon-controller-not-entering-permanent",
        "restoration-angel-blink-resets-counters"
      ]);
    });

    it("reads cases through the shared loader and runs inside coverage:check (a backend vitest test)", () => {
      const root = resolve(currentDir, "../../../../..");
      const backendScripts = JSON.parse(readFileSync(resolve(root, "apps/backend/package.json"), "utf8")).scripts;
      expect(backendScripts["test:coverage"]).toContain("vitest run");
      expect(JSON.parse(readFileSync(resolve(root, "package.json"), "utf8")).scripts["coverage:check"]).toContain(
        "apps/backend"
      );
    });

    it("ranks every case semantically from a committed vector without calling the embedder or the network", () => {
      const outcome = runGate();
      expect(outcome.results.length).toBe(cases.filter((caseEntry) => caseEntry.review.status !== "rejected").length);
      expect(embedSpy).not.toHaveBeenCalled();
      expect(fetchSpy.mock.calls).toHaveLength(0);
    });

    it("parses every non-null gameState under the In-Depth gameContextSchema (schema check)", () => {
      expect(findGameStateSchemaFailures(cases)).toEqual([]);
    });
  });

  describe("card check (absolute)", () => {
    it("passes when every attached card's text and rulings reach the prompt", () => {
      const tier2 = cases.find((caseEntry) => caseEntry.cards.length > 0)!;
      const prompt = preparedPrompt(tier2);
      expect(checkCards(prompt, tier2, resources)).toEqual([]);
    });

    it("fails a planted case whose attached card was dropped from the request", () => {
      const withCard = cases.filter((caseEntry) => caseEntry.cards.length > 0).slice(0, 1);
      const dropCards = (caseEntry: GoldCase) => ({ ...buildCaseRequest(caseEntry), cards: undefined });
      const outcome = runGate({ cases: withCard, buildRequest: dropCards as never });
      expect(outcome.ok).toBe(false);
      expect(outcome.results[0].failures.join("\n")).toMatch(/oracle text does not reach the prompt/);
      expect(outcome.report).toContain(`FAIL ${withCard[0].id}`);
    });

    it("fails an attached card the committed card-detail index does not know", () => {
      const ghost = { ...cases[0], cards: [{ oracleId: "00000000-0000-4000-8000-000000000000", name: "Ghost Card" }] };
      expect(checkCards("anything", ghost, resources).join("\n")).toMatch(/not in the committed card-detail index/);
    });
  });

  describe("rule check (ratchet)", () => {
    it("fails a planted case that lost a deciding rule it used to get", () => {
      const target = cases.find((caseEntry) => baseline.cases[caseEntry.id]?.hit.length)!;
      const planted: RulesGateBaseline = {
        cases: { [target.id]: { hit: [...baseline.cases[target.id].hit, "999.99"], miss: [] } }
      };
      const outcome = runGate({ cases: [target], baseline: planted });
      expect(outcome.ok).toBe(false);
      expect(outcome.results[0].regressions).toEqual(["999.99"]);
      expect(outcome.report).toContain("used to reach the prompt and no longer does");
    });

    it("reports a new hit without failing, and records it only through the explicit baseline raise", () => {
      const target = cases.find((caseEntry) => baseline.cases[caseEntry.id]?.hit.length)!;
      const empty: RulesGateBaseline = { cases: {} };
      const outcome = runGate({ cases: [target], baseline: empty });
      expect(outcome.ok).toBe(true);
      expect(outcome.results[0].newHits).toEqual(baseline.cases[target.id].hit);
      expect(outcome.report).toContain("npm run eval:rules-gate:baseline");

      const raised = raiseBaseline(empty, outcome.results);
      expect(raised.baseline.cases[target.id].hit).toEqual(baseline.cases[target.id].hit);
      expect(raised.added.length).toBe(1);
    });

    it("refuses to raise the baseline while a recorded hit is lost, unless the loss is accepted", () => {
      const target = cases.find((caseEntry) => baseline.cases[caseEntry.id]?.hit.length)!;
      const planted: RulesGateBaseline = { cases: { [target.id]: { hit: ["999.99"], miss: [] } } };
      const outcome = runGate({ cases: [target], baseline: planted });
      expect(() => raiseBaseline(planted, outcome.results)).toThrow(/Refusing to raise the baseline/);
      const accepted = raiseBaseline(planted, outcome.results, { allowRegressions: true });
      expect(accepted.regressions).toEqual([`${target.id}: 999.99`]);
      expect(accepted.baseline.cases[target.id].hit).not.toContain("999.99");
    });

    it("keeps the previous entry for a case it could not score, and drops a case no longer in the corpus", () => {
      const [first, second] = cases;
      const stale = { ...vectors, [first.id]: { ...vectors[first.id], queryTextHash: "0".repeat(64) } };
      const outcome = runGate({ cases: [first, second], vectors: stale });
      const previous: RulesGateBaseline = {
        cases: {
          [first.id]: { hit: ["kept.1"], miss: [] },
          "removed-from-corpus": { hit: ["1.1"], miss: [] }
        }
      };
      const raised = raiseBaseline(previous, outcome.results);
      expect(raised.baseline.cases[first.id]).toEqual({ hit: ["kept.1"], miss: [] });
      expect(raised.baseline.cases["removed-from-corpus"]).toBeUndefined();
      expect(raised.baseline.cases[second.id]).toBeDefined();
    });
  });

  describe("awaiting a re-freeze", () => {
    it("reports a case whose query text changed, skips the ratchet, and does not fail the gate", () => {
      const target = cases.find((caseEntry) => baseline.cases[caseEntry.id]?.hit.length)!;
      const stale = { ...vectors, [target.id]: { ...vectors[target.id], queryTextHash: "0".repeat(64) } };
      const outcome = runGate({ cases: [target], vectors: stale, baseline });
      const [result] = outcome.results;
      expect(outcome.ok).toBe(true);
      expect(result.awaitingRefreeze).toBe(true);
      expect(result.hit).toBeNull();
      expect(result.miss).toBeNull();
      expect(result.regressions).toEqual([]);
      expect(outcome.summary.awaitingRefreeze).toBe(1);
      expect(outcome.summary.scored).toBe(0);
      expect(outcome.report).toContain("1 awaiting re-freeze");
    });

    it("fails a case with no vector at all", () => {
      const target = cases[0];
      const without = Object.fromEntries(Object.entries(vectors).filter(([id]) => id !== target.id));
      const outcome = runGate({ cases: [target], vectors: without });
      expect(outcome.ok).toBe(false);
      expect(outcome.results[0].failures.join("\n")).toMatch(/no frozen query vector/);
    });

    it("exposes the one re-freeze check the staleness report calls", () => {
      const target = cases[0];
      const request = askAiRequestSchema.parse(buildCaseRequest(target));
      expect(checkReFreeze(target.id, request, resources.cardDetailIndex, vectors).state).toBe("fresh");
      expect(checkReFreeze(target.id, request, resources.cardDetailIndex, {}).state).toBe("missing");
      const changed = { [target.id]: { ...vectors[target.id], queryTextHash: "f".repeat(64) } };
      expect(checkReFreeze(target.id, request, resources.cardDetailIndex, changed).state).toBe("awaiting-refreeze");
    });
  });

  describe("state-fact check", () => {
    it("passes a case with a game state through buildCaseRequest and the real preparePromptInput", () => {
      const fixture = fixtureGameCase();
      const prompt = preparedPrompt(fixture);
      expect(prompt).toContain("ZONE: STACK (BOTTOM TO TOP)");
      expect(checkStateFacts(fixture, prompt)).toEqual([]);
    });

    it("also runs inside the gate for a game-state case with its own frozen vector", () => {
      const fixture = fixtureGameCase();
      const request = askAiRequestSchema.parse(buildCaseRequest(fixture));
      const withVector: FrozenVectorFile = {
        ...vectors,
        [fixture.id]: {
          queryTextHash: hashQueryText(buildCaseQueryText(request, resources.cardDetailIndex)),
          vector: vectors[cases[0].id].vector
        }
      };
      const outcome = runGate({ cases: [fixture], vectors: withVector, baseline: { cases: {} } });
      expect(outcome.results[0].failures).toEqual([]);
      expect(outcome.ok).toBe(true);
    });

    it.each([
      ["caster of the top stack item", "caster: Player 1"],
      ["caster of the bottom stack item", "caster: Player 2"],
      ["owner of the battlefield card", "owner: Player 2"],
      ["controller note", "contextNotes: controlled by Player 1"],
      ["target of the bottom stack item", "targets: player:Player 1"],
      ["turn phase", "turnPhase: main_1"],
      ["active player", "activePlayer: Player 1"],
      ["life total", "Player 1: lifeTotal=18"]
    ])("fails when the line for the %s is missing from the prompt", (_label, line) => {
      const fixture = fixtureGameCase();
      const prompt = preparedPrompt(fixture);
      expect(prompt).toContain(line);
      const without = prompt.split("\n").filter((candidate) => candidate !== line).join("\n");
      expect(checkStateFacts(fixture, without).length).toBeGreaterThan(0);
    });

    it("fails when the stack order in the prompt differs from the case's stack order", () => {
      const fixture = fixtureGameCase();
      const prompt = preparedPrompt(fixture);
      const swapped = prompt.replace("card: Panharmonicon\n", "card: Placeholder\n").replace("card: Tarmogoyf\n", "card: Panharmonicon\n");
      expect(checkStateFacts(fixture, swapped).join("\n")).toMatch(/stack order differs/);
    });

    it("has no state facts to check for a case without a game state", () => {
      expect(checkStateFacts(cases[0], "")).toEqual([]);
    });
  });

  describe("schema check", () => {
    it("fails a planted gameState the schema rejects, naming the case", () => {
      const planted = fixtureGameCase({
        id: "planted-bad-phase",
        gameState: { ...fixtureGameCase().gameState!, turnPhase: "lunch" }
      });
      const failures = findGameStateSchemaFailures([planted]);
      expect(failures).toHaveLength(1);
      expect(failures[0]).toContain("planted-bad-phase");
      expect(failures[0]).toContain("turnPhase");
    });

    it("fails the gate for such a case, because the request built from it is rejected", () => {
      const planted = fixtureGameCase({
        id: "planted-bad-phase",
        gameState: { ...fixtureGameCase().gameState!, turnPhase: "lunch" }
      });
      const outcome = runGate({ cases: [planted], baseline: { cases: {} } });
      expect(outcome.ok).toBe(false);
      expect(outcome.results[0].failures.join("\n")).toMatch(/rejected by the Ask AI schema/);
    });
  });

  describe("frozen vectors", () => {
    it("round-trips a vector exactly through its float32 encoding", () => {
      const original = Float32Array.from([0.125, -0.5, 1.0000001, 3.4028235e38, 0]);
      expect(decodeVector(encodeVector(original))).toEqual(Array.from(original));
    });

    it("stores a SHA-256 of the query text beside every committed vector (the re-freeze hash)", () => {
      const committed = JSON.parse(readFileSync(FROZEN_VECTORS_PATH, "utf8")) as FrozenVectorFile;
      expect(Object.keys(committed).length).toBeGreaterThanOrEqual(18);
      for (const [id, entry] of Object.entries(committed)) {
        expect(entry.queryTextHash, id).toMatch(/^[0-9a-f]{64}$/);
        expect(decodeVector(entry.vector), id).toHaveLength(384);
      }
      expect(hashQueryText("a")).toBe("ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb");
    });

    it("treats a missing vector file as an empty set and a missing baseline as an empty baseline", () => {
      expect(loadFrozenVectors("/nonexistent/frozen.json")).toEqual({});
      expect(loadBaseline("/nonexistent/baseline.json")).toEqual({ cases: {} });
      expect(BASELINE_PATH).toContain("rules-gate");
    });

    it("has a build command and a baseline raise command in package.json", () => {
      const root = resolve(currentDir, "../../../../..");
      const scripts = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8")).scripts as Record<string, string>;
      expect(scripts["eval:build-rules-gate-vectors"]).toContain("build-rules-gate-vectors.mjs");
      expect(scripts["eval:rules-gate:baseline"]).toContain("raise-rules-gate-baseline.mjs");
      // Neither command runs inside a gate script.
      for (const gate of ["quality:check", "coverage:check", "test", "test:scripts"]) {
        expect(scripts[gate]).not.toContain("rules-gate");
      }
    });
  });
});
