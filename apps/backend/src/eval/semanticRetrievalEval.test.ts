// REQ-181 (E10): system3-expected-recall and system3-noise-excluded run
// against the semantic path using committed frozen query embeddings — no
// live embedding call and no live AI call. The vectors in
// `fixtures/frozen-query-embeddings.json` were computed once via the `local`
// provider (`npm run data:build-rule-embeddings`'s model) and committed; this
// test only ever reads them from disk.

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { loadGameRulesTopics, type GameRulesTopic } from "../gameRules.js";
import { loadGameRulesRuleIndex, type GameRulesRuleIndexEntry } from "../gameRulesRetrieval.js";
import { preparePromptInput } from "../prompt/preparation.js";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const allGameRulesTopics: GameRulesTopic[] = loadGameRulesTopics(
  path.resolve(currentDir, "../../data/gameRulesByTopic.json")
);
const ruleIndex: GameRulesRuleIndexEntry[] = loadGameRulesRuleIndex(
  path.resolve(currentDir, "../../data/gameRulesRuleIndex.json")
);

type FrozenQueryEmbeddings = Record<string, { question: string; vector: number[] }>;

const frozenEmbeddings: FrozenQueryEmbeddings = JSON.parse(
  readFileSync(path.join(currentDir, "fixtures/frozen-query-embeddings.json"), "utf8")
);

describe("Backend - Eval - semantic retrieval (REQ-181, frozen query embeddings, no live calls)", () => {
  it("system3-expected-recall: a frozen cascade query vector semantically retrieves the cascade definition rule", () => {
    const frozen = frozenEmbeddings["frozen-cascade-no-card"]!;
    const prepared = preparePromptInput(
      { mode: "lookup", question: frozen.question },
      {
        gameRulesTopics: allGameRulesTopics,
        gameRulesRuleIndex: ruleIndex,
        queryEmbedding: frozen.vector,
        collectEnrichmentDebug: true
      }
    );
    const retrievedRuleIds = prepared.enrichmentDebug?.supplemental.selected.map((rule) => rule.ruleId) ?? [];
    expect(retrievedRuleIds).toContain("702.85a");
  });

  it("system3-noise-excluded: the same frozen deathtouch query never surfaces an unrelated general rule", () => {
    const frozen = frozenEmbeddings["frozen-deathtouch-combat"]!;
    const prepared = preparePromptInput(
      { mode: "lookup", question: frozen.question },
      {
        gameRulesTopics: allGameRulesTopics,
        gameRulesRuleIndex: ruleIndex,
        queryEmbedding: frozen.vector,
        collectEnrichmentDebug: true
      }
    );
    const retrievedRuleIds = prepared.enrichmentDebug?.supplemental.selected.map((rule) => rule.ruleId) ?? [];
    expect(retrievedRuleIds).toContain("702.2b");
    expect(retrievedRuleIds).not.toContain("100.1");
  });

  it("caps at 5 excerpts under the semantic path, same as lexical", () => {
    const frozen = frozenEmbeddings["frozen-cascade-no-card"]!;
    const prepared = preparePromptInput(
      { mode: "lookup", question: frozen.question },
      {
        gameRulesTopics: allGameRulesTopics,
        gameRulesRuleIndex: ruleIndex,
        queryEmbedding: frozen.vector,
        collectEnrichmentDebug: true
      }
    );
    expect(prepared.enrichmentDebug?.supplemental.selected.length).toBeLessThanOrEqual(5);
  });
});
