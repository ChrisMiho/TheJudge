// Mode-aware input builder for the `retrieval:report` review aid (DEC-047).
//
// The report iterates every fixture carrying an `expected` block and, per
// fixture, needs the System 2 topics selected and the System 3 supplemental
// rules (with scores). Game- and lookup-mode requests reach that selection by
// different paths — a lookup request has no `gameContext`, so the game-mode
// `buildPromptContext` throws on it. This module routes by mode exactly as the
// eval harness's `evaluateFixtureRequest` does, so the report mirrors production
// selection for both modes instead of assuming every fixture is a game request.
//
// Extracted from `scripts/retrieval-relevance-report.mjs` so the routing is
// unit-testable: the root script imports backend TypeScript through tsx, which
// the plain `node --test` scripts runner cannot load.

import { collectCuratedRuleIds, retrieveSupplementalRulesWithDebug } from "../gameRulesRetrieval.js";
import type { GameRulesRuleIndexEntry, RetrievedGameRule } from "../gameRulesRetrieval.js";
import type { GameRulesTopic } from "../gameRules.js";
import { selectGameRulesTopics } from "../gameRulesTopicSelection.js";
import { buildPromptContext } from "../prompt/context.js";
import { preparePromptInput } from "../prompt/preparation.js";
import type { AskAiRequest, GameAskAiRequest } from "../types/index.js";

export type LabeledFixture = {
  id: string;
  request: AskAiRequest;
  expected: unknown;
};

export type RetrievalReportInput = {
  fixtureId: string;
  selectedTopics: GameRulesTopic[];
  supplementalRules: RetrievedGameRule[];
  expected: unknown;
};

export type RetrievalReportDeps = {
  gameRulesTopics: GameRulesTopic[];
  gameRulesRuleIndex: GameRulesRuleIndexEntry[];
};

/** Game-mode path: the direct selection the report has always used. */
function buildGameRelevance(request: GameAskAiRequest, deps: RetrievalReportDeps) {
  const context = buildPromptContext(request);
  const selectedTopics = selectGameRulesTopics(context, deps.gameRulesTopics);
  const curatedRuleIds = collectCuratedRuleIds(selectedTopics);
  const { selected } = retrieveSupplementalRulesWithDebug(context, deps.gameRulesRuleIndex, curatedRuleIds);
  return { selectedTopics, supplementalRules: selected };
}

/**
 * Lookup-mode path: run the production preparation pipeline with enrichment
 * debug on, then reconstruct the same {selectedTopics, supplementalRules} shape
 * from the debug block — the reconstruction the eval harness uses.
 */
function buildLookupRelevance(request: AskAiRequest, deps: RetrievalReportDeps) {
  const prepared = preparePromptInput(request, {
    gameRulesTopics: deps.gameRulesTopics,
    gameRulesRuleIndex: deps.gameRulesRuleIndex,
    collectEnrichmentDebug: true
  });
  const topicIds = new Set(prepared.enrichmentDebug?.curatedGameRules.topicIds ?? []);
  const selectedTopics = deps.gameRulesTopics.filter((topic) => topicIds.has(topic.id));
  const supplementalRules: RetrievedGameRule[] = (prepared.enrichmentDebug?.supplemental.selected ?? []).map(
    (selected) => {
      const source = deps.gameRulesRuleIndex.find((entry) => entry.ruleId === selected.ruleId);
      return {
        ruleId: selected.ruleId,
        sectionTitle: selected.sectionTitle,
        text: source?.text ?? "",
        score: selected.score
      };
    }
  );
  return { selectedTopics, supplementalRules };
}

/**
 * Build one report input per labeled fixture, routing each by its request mode.
 * A lookup-mode fixture is handled through the preparation pipeline rather than
 * the game-mode context builder, which is what previously crashed the report.
 */
export function buildRetrievalReportInputs(
  fixtures: LabeledFixture[],
  deps: RetrievalReportDeps
): RetrievalReportInput[] {
  return fixtures.map((fixture) => {
    const { selectedTopics, supplementalRules } =
      fixture.request.mode === "lookup"
        ? buildLookupRelevance(fixture.request, deps)
        : buildGameRelevance(fixture.request as GameAskAiRequest, deps);
    return {
      fixtureId: fixture.id,
      selectedTopics,
      supplementalRules,
      expected: fixture.expected
    };
  });
}
