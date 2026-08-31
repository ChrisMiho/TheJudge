import { readFileSync } from "node:fs";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { loadGameRulesTopics, type GameRulesTopic } from "../gameRules.js";
import { selectGameRulesTopics } from "../gameRulesTopicSelection.js";
import {
  collectCuratedRuleIds,
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
import {
  buildChecklistReport,
  buildEvalComboCatalog,
  evaluateScenario,
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
  ["fixture-questing-beast", [{ publishedAt: "2019-10-04", comment: "Combat damage can't be prevented." }]],
  // The lookup combo fixtures attach these cards; `lookup-card-enrichment`
  // requires an OFFICIAL RULINGS section for any attached card.
  ["eval-oracle-a", [{ publishedAt: "2020-01-10", comment: "Its ability triggers once per turn." }]],
  ["eval-oracle-b", [{ publishedAt: "2020-01-24", comment: "You may name a card that is not in your library." }]],
  ["eval-oracle-c", [{ publishedAt: "2020-02-05", comment: "It returns only creature cards." }]],
  ["eval-oracle-d", [{ publishedAt: "2020-02-11", comment: "Its trigger uses the stack." }]]
]);

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

function evaluateFixtureRequest(request: AskAiRequest, disableComboEnrichment = false) {
  // The degraded fixture omits the catalog entirely, which is exactly how the
  // runtime behaves with a missing artifact or COMBO_ENRICHMENT_ENABLED=false.
  const comboCatalog = disableComboEnrichment ? undefined : evalComboCatalog;

  if (request.mode === "lookup") {
    const prepared = preparePromptInput(request, {
      gameRulesTopics: allGameRulesTopics,
      gameRulesRuleIndex: ruleIndex,
      cardRulingsIndex: fixtureRulings,
      comboCatalog,
      collectEnrichmentDebug: true
    });
    return {
      context: prepared.context,
      promptText: prepared.promptText,
      relevance: relevanceFromPrepared(prepared)
    };
  }

  const gameRequest = request as GameAskAiRequest;
  const context = buildPromptContext(gameRequest);
  const selectedTopics = selectGameRulesTopics(context, allGameRulesTopics);
  const curatedRuleIds = collectCuratedRuleIds(selectedTopics);
  const supplementalRules = retrieveSupplementalRules(context, ruleIndex, curatedRuleIds);
  const comboCandidates = resolveGameComboCandidates(gameRequest, context, { comboCatalog });
  return {
    context,
    promptText: buildPromptText(context, { gameRulesTopics: selectedTopics, supplementalRules, comboCandidates }),
    relevance: { selectedTopics, supplementalRules }
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
