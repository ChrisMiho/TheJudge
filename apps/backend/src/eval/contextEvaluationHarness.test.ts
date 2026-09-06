import { readFileSync } from "node:fs";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { loadGameRulesTopics, type GameRulesTopic } from "../gameRules.js";
import { selectGameRulesTopics } from "../gameRulesTopicSelection.js";
import {
  collectCuratedRuleIds,
  loadGameRulesRuleEmbeddings,
  loadGameRulesRuleIndex,
  retrieveSupplementalRules,
  type GameRulesRuleIndexEntry,
  type RetrievedGameRule
} from "../gameRulesRetrieval.js";
import { buildPromptContext } from "../prompt/context.js";
import { buildPromptText } from "../prompt/promptAssembly.js";
import { preparePromptInput, resolveGameComboCandidates } from "../prompt/preparation.js";
import type { AskAiRequest, GameAskAiRequest } from "../types/index.js";
import type { ComboVariant } from "../commanderSpellbook/catalog.js";
import { cardDetailIndexFromRequest } from "./fixtureCardDetail.js";
import {
  buildChecklistReport,
  buildEvalComboCatalog,
  evaluateScenario,
  evaluateSystem3RelevanceChecks,
  type EvaluationFixture,
  type EvaluationResult
} from "./contextEvaluationHarness.js";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const fixtureDir = path.join(currentDir, "fixtures");
const shouldUpdateGoldenFiles = process.env.UPDATE_CONTEXT_EVAL_FIXTURES === "1";
const gameRulesPath = path.resolve(currentDir, "../../data/gameRulesByTopic.json");
const allGameRulesTopics: GameRulesTopic[] = loadGameRulesTopics(gameRulesPath);
const ruleIndexPath = path.resolve(currentDir, "../../data/gameRulesRuleIndex.json");
const ruleIndex: GameRulesRuleIndexEntry[] = loadGameRulesRuleIndex(ruleIndexPath);
const fixtureRulings = new Map([
  ["003e5dc6-8b26-4a0a-a50b-5f0806a7bacd", [{ publishedAt: "2019-10-04", comment: "Combat damage can't be prevented." }]],
  // The lookup combo fixtures attach these cards; `lookup-card-enrichment`
  // requires an OFFICIAL RULINGS section for any attached card.
  ["eval-oracle-a", [{ publishedAt: "2020-01-10", comment: "Its ability triggers once per turn." }]],
  ["eval-oracle-b", [{ publishedAt: "2020-01-24", comment: "You may name a card that is not in your library." }]],
  ["eval-oracle-c", [{ publishedAt: "2020-02-05", comment: "It returns only creature cards." }]],
  ["eval-oracle-d", [{ publishedAt: "2020-02-11", comment: "Its trigger uses the stack." }]],
  // REQ-032 (Slice B): quick-lookup-multi-keyword-card.fixture.json attaches
  // Questing Beast by its real oracle id — same lookup-card-enrichment
  // requirement above.
  ["b685757b-521e-4353-a233-97052359723d", [{ publishedAt: "2019-10-04", comment: "Vigilance means the creature doesn't tap when it attacks." }]]
]);

// REQ-181/E10 (review loop 1): one frozen query embedding per labeled
// fixture, generated offline with the shipped local model and committed
// (`npm run eval:build-frozen-query-embeddings`; see
// scripts/build-frozen-query-embeddings.mjs) — no live embedding call at
// test time. Keyed by fixture id, each value is the exact vector production
// would compute for that fixture's retrieval query text.
const ruleEmbeddingsPath = path.resolve(currentDir, "../../data/gameRulesRuleEmbeddings.json");
type FrozenQueryEmbedding = { question: string; vector: number[] };
const frozenQueryEmbeddings: Record<string, FrozenQueryEmbedding> = JSON.parse(
  readFileSync(path.join(fixtureDir, "frozen-query-embeddings.json"), "utf8")
);

// Eval-only combo corpus: independent of the production artifact so an
// owner-approved corpus refresh can never churn a prompt golden.
const evalComboCatalogPath = path.join(fixtureDir, "commander-spellbook-eval-catalog.json");
const evalComboVariants: ComboVariant[] = JSON.parse(readFileSync(evalComboCatalogPath, "utf8")).variants;
const evalComboCatalog = buildEvalComboCatalog(evalComboVariants);

async function readJsonFixture(fileName: string): Promise<EvaluationFixture> {
  const fixturePath = path.join(fixtureDir, fileName);
  const content = await readFile(fixturePath, "utf8");
  return JSON.parse(content) as EvaluationFixture;
}

async function readFixtures(): Promise<EvaluationFixture[]> {
  const fileNames = await readdir(fixtureDir);
  const fixtureFiles = fileNames.filter((fileName) => fileName.endsWith(".fixture.json")).sort();
  const fixtures = await Promise.all(fixtureFiles.map((fileName) => readJsonFixture(fileName)));

  return fixtures;
}

async function assertGoldenFile(fileName: string, actualContent: string): Promise<void> {
  const goldenPath = path.join(fixtureDir, fileName);

  if (shouldUpdateGoldenFiles) {
    await writeFile(goldenPath, actualContent, "utf8");
    return;
  }

  let expectedContent: string;
  try {
    expectedContent = await readFile(goldenPath, "utf8");
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      throw new Error(
        `Missing golden file "${fileName}". Run with UPDATE_CONTEXT_EVAL_FIXTURES=1 to generate snapshots.`
      );
    }
    throw error;
  }

  expect(actualContent).toBe(expectedContent);
}

function relevanceFromPrepared(prepared: ReturnType<typeof preparePromptInput>) {
  const topicIds = new Set(prepared.enrichmentDebug?.curatedGameRules.topicIds ?? []);
  const selectedTopics = allGameRulesTopics.filter((topic) => topicIds.has(topic.id));
  const supplementalRules: RetrievedGameRule[] = (prepared.enrichmentDebug?.supplemental.selected ?? []).map((selected) => {
    const source = ruleIndex.find((entry) => entry.ruleId === selected.ruleId);
    return {
      ruleId: selected.ruleId,
      sectionTitle: selected.sectionTitle,
      text: source?.text ?? "",
      score: selected.score
    };
  });
  return { selectedTopics, supplementalRules };
}

// REQ-176/REQ-177: `context.ts` resolves a card's descriptive block from an
// index keyed by cardId instead of trusting the request card directly. The
// fixtures below still carry that block on each request card (as the real
// client did before this change), so `cardDetailIndexFromRequest` builds a
// per-request index from the fixture's own data — proving the resolver
// plumbing is byte-identical to the old direct-read for whatever detail it is
// given, without coupling the eval corpus to the real committed artifact
// (which would let an owner-approved Scryfall refresh silently churn a prompt
// golden). It is the single shared implementation `retrievalReportInputs.ts`
// also calls, so the gate and the review report can no longer resolve
// card-intrinsic fields differently (REQ-177).

function evaluateFixtureRequest(request: AskAiRequest, disableComboEnrichment = false, queryEmbedding: number[] | null = null) {
  // The degraded fixture omits the catalog entirely, which is exactly how the
  // runtime behaves with a missing artifact or COMBO_ENRICHMENT_ENABLED=false.
  const comboCatalog = disableComboEnrichment ? undefined : evalComboCatalog;
  const cardDetailIndex = cardDetailIndexFromRequest(request);

  if (request.mode === "lookup") {
    const prepared = preparePromptInput(request, {
      gameRulesTopics: allGameRulesTopics,
      gameRulesRuleIndex: ruleIndex,
      cardRulingsIndex: fixtureRulings,
      cardDetailIndex,
      comboCatalog,
      collectEnrichmentDebug: true,
      // REQ-181/E10: `null` for every existing (lexical, golden) call site —
      // only the semantic-path check below passes a frozen vector.
      queryEmbedding
    });
    return {
      context: prepared.context,
      promptText: prepared.promptText,
      relevance: relevanceFromPrepared(prepared)
    };
  }

  const gameRequest = request as GameAskAiRequest;
  const context = buildPromptContext(gameRequest, cardDetailIndex);
  const selectedTopics = selectGameRulesTopics(context, allGameRulesTopics);
  const curatedRuleIds = collectCuratedRuleIds(selectedTopics);
  // 4th/5th positional args (`max`, `resources`) stay at their production
  // defaults; only `queryVector` (6th) is ever overridden here, same as the
  // lookup branch above.
  const supplementalRules = retrieveSupplementalRules(context, ruleIndex, curatedRuleIds, undefined, undefined, queryEmbedding);
  const comboCandidates = resolveGameComboCandidates(gameRequest, context, { comboCatalog });
  return {
    context,
    promptText: buildPromptText(context, { gameRulesTopics: selectedTopics, supplementalRules, comboCandidates }),
    relevance: { selectedTopics, supplementalRules }
  };
}

// REQ-181/E10 (review loop 1): unlike `evaluateFixtureRequest` above (whose
// game-mode branch calls the non-debug `retrieveSupplementalRules` directly),
// this always goes through `preparePromptInput` with `collectEnrichmentDebug`
// for BOTH modes, so the semantic-path mechanism test below can read
// `usedSemantic` off the returned debug object and prove the semantic branch
// actually engaged rather than silently falling back to lexical.
function evaluateFixtureRequestWithDebug(fixture: EvaluationFixture, queryEmbedding: number[] | null) {
  const comboCatalog = fixture.disableComboEnrichment ? undefined : evalComboCatalog;
  const cardDetailIndex = cardDetailIndexFromRequest(fixture.request);
  const prepared = preparePromptInput(fixture.request, {
    gameRulesTopics: allGameRulesTopics,
    gameRulesRuleIndex: ruleIndex,
    cardRulingsIndex: fixtureRulings,
    cardDetailIndex,
    comboCatalog,
    collectEnrichmentDebug: true,
    queryEmbedding
  });
  // `usedSemantic` rides through `enrichmentDebug.supplemental` at runtime
  // (preparation.ts passes the debug object through by reference) but isn't
  // part of the zod-derived `EnrichmentDebug` type that field is declared
  // with, so it's read back via an explicit cast rather than widening that
  // public, schema-validated debug type for one internal test assertion.
  const supplementalDebug = prepared.enrichmentDebug?.supplemental as unknown as
    | { usedSemantic?: boolean }
    | undefined;
  return {
    relevance: relevanceFromPrepared(prepared),
    usedSemantic: supplementalDebug?.usedSemantic ?? false
  };
}

function formatContextSnapshot(fixture: EvaluationFixture): string {
  const evaluated = evaluateFixtureRequest(fixture.request, fixture.disableComboEnrichment);
  return `${JSON.stringify(evaluated.context, null, 2)}\n`;
}

function formatPromptSnapshot(fixture: EvaluationFixture): string {
  return `${evaluateFixtureRequest(fixture.request, fixture.disableComboEnrichment).promptText}\n`;
}

describe("Backend - Eval", () => {
  describe("context evaluation harness", () => {
    it("validates golden scenarios and checklist report", async () => {
      const fixtures = await readFixtures();
      expect(fixtures.length).toBeGreaterThan(0);

      const results: EvaluationResult[] = [];

      for (const fixture of fixtures) {
        const evaluated = evaluateFixtureRequest(fixture.request, fixture.disableComboEnrichment);
        const result = evaluateScenario(fixture, evaluated.context, evaluated.promptText, evaluated.relevance);

        results.push(result);

        await assertGoldenFile(`${fixture.id}.context.golden.json`, formatContextSnapshot(fixture));
        await assertGoldenFile(`${fixture.id}.prompt.golden.txt`, formatPromptSnapshot(fixture));
      }

      const checklistReport = `${buildChecklistReport(results)}\n`;
      await assertGoldenFile("checklist-report.golden.txt", checklistReport);
      expect(results.every((result) => result.passed), `Evaluation report:\n${checklistReport}`).toBe(true);
      // Heavy golden-eval loop: full evaluation + golden compares per fixture, so
      // runtime scales with the fixture count and legitimately nears the 5s default.
      // 30s keeps slow CI runners clear of the timeout without loosening it suite-wide.
    }, 30000);

    // REQ-032/REQ-181/REQ-182 (Slice B): `system3-expected-recall` and
    // `system3-noise-excluded` above only ever exercise the lexical path
    // (every golden fixture is evaluated with `queryEmbedding: null`). This
    // test runs the same two checks against the semantic path instead —
    // frozen query embeddings, committed offline, no live embedding call
    // here — so a real, committed change to `gameRulesRuleEmbeddings.json`
    // or the hybrid scorer is caught the same way a lexical regression is.
    //
    // This gates (a failing check fails the run) from the moment the hybrid
    // blend (REQ-182) cleared its own recall gates. Before that, semantic-only
    // ranking measured 9 of 12 labelled checks against lexical's 12 of 12
    // (2026-09-05), which is why these checks ran in report-only mode until
    // then — see REQ-032's amendment in `functional-requirements.md` for the
    // full history. With the hybrid blend (and its cross-reference boost,
    // added at build 2026-09-05 — see REQ-182's Notes) in place, all 12
    // original labelled checks pass, plus the 2 new checks the
    // multi-keyword-card fixture below adds.
    it("validates System 3 relevance under the semantic path (frozen query embeddings)", async () => {
      const ruleEmbeddings = loadGameRulesRuleEmbeddings(ruleEmbeddingsPath);
      expect(ruleEmbeddings, "committed gameRulesRuleEmbeddings.json must load for this test to prove anything").not.toBeNull();

      const fixtures = await readFixtures();
      const labeledFixtures = fixtures.filter(
        (fixture) => fixture.expected?.expectedSupplementalRuleIds || fixture.expected?.forbiddenSupplementalRuleIds
      );
      expect(labeledFixtures.length).toBeGreaterThan(0);
      expect(
        labeledFixtures.every((fixture) => frozenQueryEmbeddings[fixture.id]),
        `Missing a frozen query embedding for: ${labeledFixtures
          .filter((fixture) => !frozenQueryEmbeddings[fixture.id])
          .map((fixture) => fixture.id)
          .join(", ")}. Run: npm run eval:build-frozen-query-embeddings`
      ).toBe(true);

      const results: EvaluationResult[] = [];
      const notUsingSemantic: string[] = [];

      for (const fixture of labeledFixtures) {
        const frozen = frozenQueryEmbeddings[fixture.id];
        expect(frozen.vector.length, `${fixture.id}: frozen vector dims must match the committed embeddings artifact`).toBe(
          ruleEmbeddings!.dims
        );

        const evaluated = evaluateFixtureRequestWithDebug(fixture, frozen.vector);
        if (!evaluated.usedSemantic) notUsingSemantic.push(fixture.id);

        const checks = evaluateSystem3RelevanceChecks(evaluated.relevance.supplementalRules, fixture.expected);
        expect(checks.length).toBeGreaterThan(0);

        results.push({
          fixtureId: fixture.id,
          passed: checks.every((check) => check.passed),
          score: checks.filter((check) => check.passed).length,
          maxScore: checks.length,
          checks
        });
      }

      // Hard gate: every labelled fixture's supplemental retrieval actually
      // ran semantic-primary scoring — a silent lexical fallback here (e.g.
      // from a missing/malformed committed artifact) fails this loudly.
      expect(notUsingSemantic, `Fixtures that fell back to lexical instead of semantic: ${notUsingSemantic.join(", ")}`).toEqual(
        []
      );

      const checklistReport = buildChecklistReport(results);
      // eslint-disable-next-line no-console
      console.log(`Semantic-path relevance report:\n${checklistReport}`);

      // REQ-032 (Slice B): hard gate, same pattern as the golden-scenario
      // test above — a failing check fails the run.
      expect(results.every((result) => result.passed), `Semantic-path relevance report:\n${checklistReport}`).toBe(true);
    });

    it("detects ordering and guardrail regressions", () => {
      const fixture: EvaluationFixture = {
        id: "regression-sample",
        description: "Synthetic fixture used to prove regression detection",
        request: {
          question: "How does this resolve?",
          gameContext: {
            playerCount: 2,
            players: [
              { label: "Player 1", lifeTotal: 20 },
              { label: "Player 2", lifeTotal: 20 }
            ],
            turnPhase: "main_1",
            selectedZones: ["stack"],
            zones: {
              stack: [
                {
                  cardId: "bottom",
                  name: "Bottom Spell",
                  oracleText: "Bottom text",
                  imageUrl: "",
                  manaCost: "{U}",
                  manaValue: 1,
                  typeLine: "Instant",
                  colors: ["U"],
                  supertypes: [],
                  subtypes: [],
                  caster: "Player 1",
                  targets: []
                },
                {
                  cardId: "top",
                  name: "Top Spell",
                  oracleText: "Top text",
                  imageUrl: "",
                  manaCost: "{1}{R}",
                  manaValue: 2,
                  typeLine: "Instant",
                  colors: ["R"],
                  supertypes: [],
                  subtypes: [],
                  caster: "Player 2",
                  targets: [{ kind: "card", zone: "stack", cardId: "bottom", cardName: "Bottom Spell" }]
                }
              ]
            }
          }
        }
      };

      const context = buildPromptContext(fixture.request as GameAskAiRequest);
      const brokenContext = {
        ...context,
        orderedStack: [...context.orderedStack].reverse()
      };
      const brokenPrompt = [
        "INSTRUCTIONS",
        "- Explain reasoning clearly and concisely.",
        "",
        "QUESTION",
        context.finalQuestion,
        "",
        "ORDERED STACK (BOTTOM TO TOP)",
        "Card 1 (top)",
        "stack:Top Spell (top)"
      ].join("\n");

      const result = evaluateScenario(fixture, brokenContext, brokenPrompt);
      const failedCheckIds = result.checks.filter((check) => !check.passed).map((check) => check.id);

      expect(result.passed).toBe(false);
      expect(failedCheckIds).toEqual(
        expect.arrayContaining(["stack-order-preserved", "required-guardrails-present", "llm-prompt-omits-cardid", "mtg-reference-present", "scope-sentence-present", "game-rules-section-present"])
      );
    });
  });
});
