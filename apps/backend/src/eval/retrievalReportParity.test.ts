// REQ-177 acceptance criterion: an automated test asserts the relevance
// report (`retrieval:report`) and the eval harness (`test:eval`) return the
// same per-scenario System 3 recall verdict for every labeled fixture, and
// fails the pull request when they diverge.
//
// Before REQ-177, `retrievalReportInputs.ts` built no card-detail index at
// all, so every card in the report's fixtures resolved through
// `resolveCardDetail`'s empty fallback — the report scored a query
// production would never build. Live on 2026-09-05: the harness (`test:eval`)
// reported all 9 labeled fixtures passing while the report
// (`retrieval:report`) reported 3 failing (`counterspell-stack`,
// `quick-lookup-card`, `quick-lookup-multi-card`). This test recomputes the
// harness path independently of `retrievalReportInputs.ts` (using the same
// production primitives the harness itself calls) and asserts the two land on
// identical selected-topic and retrieved-rule-id sets for every labeled
// fixture — a divergence here is exactly the bug this requirement fixes.

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { loadGameRulesTopics, type GameRulesTopic } from "../gameRules.js";
import {
  collectCuratedRuleIds,
  loadGameRulesRuleIndex,
  retrieveSupplementalRules,
  type GameRulesRuleIndexEntry
} from "../gameRulesRetrieval.js";
import { selectGameRulesTopics } from "../gameRulesTopicSelection.js";
import { buildPromptContext } from "../prompt/context.js";
import { preparePromptInput } from "../prompt/preparation.js";
import { cardDetailIndexFromRequest } from "./fixtureCardDetail.js";
import { buildRetrievalReportInputs, type LabeledFixture } from "./retrievalReportInputs.js";
import type { AskAiRequest, GameAskAiRequest } from "../types/index.js";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const fixtureDir = path.join(currentDir, "fixtures");
const gameRulesTopics: GameRulesTopic[] = loadGameRulesTopics(
  path.resolve(currentDir, "../../data/gameRulesByTopic.json")
);
const gameRulesRuleIndex: GameRulesRuleIndexEntry[] = loadGameRulesRuleIndex(
  path.resolve(currentDir, "../../data/gameRulesRuleIndex.json")
);

async function loadLabeledFixtures(): Promise<LabeledFixture[]> {
  const fileNames = await readdir(fixtureDir);
  const fixtureFiles = fileNames.filter((name) => name.endsWith(".fixture.json")).sort();
  const fixtures = await Promise.all(
    fixtureFiles.map(async (name) => JSON.parse(await readFile(path.join(fixtureDir, name), "utf8")) as LabeledFixture)
  );
  return fixtures.filter((fixture) => fixture.expected);
}

/**
 * Independently recomputes the harness's per-fixture relevance — the same
 * production primitives `contextEvaluationHarness.test.ts`'s
 * `evaluateFixtureRequest` calls for its `relevance` field — without importing
 * that test file or `retrievalReportInputs.ts`'s own routing.
 */
function buildHarnessRelevance(request: AskAiRequest) {
  const cardDetailIndex = cardDetailIndexFromRequest(request);

  if (request.mode === "lookup") {
    const prepared = preparePromptInput(request, {
      gameRulesTopics,
      gameRulesRuleIndex,
      cardDetailIndex,
      collectEnrichmentDebug: true
    });
    const topicIds = new Set(prepared.enrichmentDebug?.curatedGameRules.topicIds ?? []);
    const selectedTopics = gameRulesTopics.filter((topic) => topicIds.has(topic.id));
    const supplementalRuleIds = (prepared.enrichmentDebug?.supplemental.selected ?? []).map(
      (selected) => selected.ruleId
    );
    return { selectedTopicIds: new Set(selectedTopics.map((topic) => topic.id)), supplementalRuleIds: new Set(supplementalRuleIds) };
  }

  const gameRequest = request as GameAskAiRequest;
  const context = buildPromptContext(gameRequest, cardDetailIndex);
  const selectedTopics = selectGameRulesTopics(context, gameRulesTopics);
  const curatedRuleIds = collectCuratedRuleIds(selectedTopics);
  const supplementalRules = retrieveSupplementalRules(context, gameRulesRuleIndex, curatedRuleIds);
  return {
    selectedTopicIds: new Set(selectedTopics.map((topic) => topic.id)),
    supplementalRuleIds: new Set(supplementalRules.map((rule) => rule.ruleId))
  };
}

describe("Backend - Eval - report/harness parity (REQ-177)", () => {
  it("agrees with the eval harness on selected topics and retrieved rules for every labeled fixture", async () => {
    const fixtures = await loadLabeledFixtures();
    expect(fixtures.length).toBeGreaterThan(0);

    const reportInputs = buildRetrievalReportInputs(fixtures, { gameRulesTopics, gameRulesRuleIndex });
    const mismatches: string[] = [];

    for (const input of reportInputs) {
      const fixture = fixtures.find((candidate) => candidate.id === input.fixtureId);
      if (!fixture) continue;

      const harness = buildHarnessRelevance(fixture.request);
      const reportTopicIds = new Set(input.selectedTopics.map((topic) => topic.id));
      const reportRuleIds = new Set(input.supplementalRules.map((rule) => rule.ruleId));

      const topicsMatch =
        harness.selectedTopicIds.size === reportTopicIds.size &&
        [...harness.selectedTopicIds].every((id) => reportTopicIds.has(id));
      const rulesMatch =
        harness.supplementalRuleIds.size === reportRuleIds.size &&
        [...harness.supplementalRuleIds].every((id) => reportRuleIds.has(id));

      if (!topicsMatch || !rulesMatch) {
        mismatches.push(
          `${input.fixtureId}: harness topics=[${[...harness.selectedTopicIds].join(",")}] report topics=[${[...reportTopicIds].join(",")}]; ` +
            `harness rules=[${[...harness.supplementalRuleIds].join(",")}] report rules=[${[...reportRuleIds].join(",")}]`
        );
      }
    }

    expect(mismatches, `Report/harness divergence:\n${mismatches.join("\n")}`).toHaveLength(0);
  });
});
