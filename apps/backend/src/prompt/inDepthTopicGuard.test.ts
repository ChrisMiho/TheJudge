// REQ-242 acceptance: on the corpus cases that exist in both versions (Quick Lookup and In-Depth),
// In-Depth keeps at least 17 of their deciding rules in the prompt after the zone-presence triggers are
// replaced by wording triggers. (Measured at intake with zone triggers: 17 of 30.)
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { loadGoldCases, type GoldCase } from "../../../../scripts/lib/gold-cases.mjs";
import { buildCaseRequest, loadPromptResources, type PromptResources } from "../../../../scripts/lib/prompt-fidelity.mjs";
import { checkReFreeze, loadFrozenVectors, type FrozenVectorFile } from "../eval/rules-gate/frozenVectors.js";
import { tokenizeSearchText } from "../gameRulesStemmer.js";
import { IN_DEPTH_TOPIC_TRIGGERS } from "../gameRulesTopicSelection.js";
import { askAiRequestSchema } from "../validation/askAiRequest.js";
import { preparePromptInput } from "./preparation.js";

vi.mock("../providers/localEmbeddingProvider.js", () => ({
  localEmbeddingProvider: { embed: async () => { throw new Error("offline"); } },
  LOCAL_MODEL_ID: "mock",
  LOCAL_MODEL_CACHE_DIR: "mock"
}));

const dataDir = resolve(dirname(fileURLToPath(import.meta.url)), "../../data");
const printed = (promptText: string, ruleId: string) =>
  new RegExp(`^${ruleId.replace(/\./g, "\\.")}(?:\\.|\\s(?!\\u2026))`, "m").test(promptText);

let pairs: Array<{ id: string; deciding: string[]; promptText: string }> = [];

beforeAll(async () => {
  const resources: PromptResources = await loadPromptResources();
  const cases: GoldCase[] = (await loadGoldCases()).filter((c) => c.review.status !== "rejected");
  const vectors: FrozenVectorFile = loadFrozenVectors();
  const byId = new Map(cases.map((c) => [c.id, c]));
  pairs = cases
    .filter((c) => c.id.endsWith("-in-depth") && c.gameState && byId.has(c.id.replace(/-in-depth$/, "")))
    .map((c) => {
      const request = askAiRequestSchema.parse(buildCaseRequest(c));
      const freeze = checkReFreeze(c.id, request, resources.cardDetailIndex, vectors);
      const fresh = freeze.state === "fresh";
      const prepared = preparePromptInput(request, {
        ...resources,
        queryEmbedding: fresh ? freeze.vector : null,
        cardEmbeddings: fresh ? freeze.cardEmbeddings : undefined
      });
      return { id: c.id, deciding: [...new Set(c.expected.decidingRuleIds)], promptText: prepared.promptText };
    });
}, 120_000);

describe("REQ-242 In-Depth topic choice by wording", () => {
  it("keeps at least 17 of the paired cases' deciding rules in the In-Depth prompt", () => {
    expect(pairs).toHaveLength(9);
    const total = pairs.reduce((sum, p) => sum + p.deciding.length, 0);
    const kept = pairs.reduce((sum, p) => sum + p.deciding.filter((id) => printed(p.promptText, id)).length, 0);
    console.info(`In-Depth keeps ${kept} of ${total} deciding rules on the ${pairs.length} paired corpus cases`);
    expect(total).toBe(30);
    expect(kept).toBeGreaterThanOrEqual(17);
  });

  it("builds every trigger word from the topic's own title or its listed rules' section titles, and finds it in the rule index", () => {
    const manifest = JSON.parse(readFileSync(resolve(dataDir, "gameRulesTopicManifest.json"), "utf8")) as Array<{
      id: string;
      title: string;
      ruleNumbers: string[];
    }>;
    const index = JSON.parse(readFileSync(resolve(dataDir, "gameRulesRuleIndex.json"), "utf8")) as Array<{
      ruleId: string;
      sectionTitle: string;
      text: string;
    }>;
    const byId = new Map(index.map((entry) => [entry.ruleId, entry]));
    const indexText = index.map((entry) => entry.text).join("\n").toLowerCase();
    const wordsOf = (text: string) => text.toLowerCase().split(/[^a-z]+/).filter(Boolean);
    for (const [topicId, triggers] of Object.entries(IN_DEPTH_TOPIC_TRIGGERS)) {
      const topic = manifest.find((candidate) => candidate.id === topicId)!;
      expect(topic, topicId).toBeDefined();
      const allowed = new Set(
        [...wordsOf(topic.title), ...topic.ruleNumbers.flatMap((ruleNumber) => wordsOf(byId.get(ruleNumber)?.sectionTitle ?? ""))].flatMap(
          (word) => tokenizeSearchText(word)
        )
      );
      for (const word of triggers) {
        // a trigger word is one of the title words (compared after the stemming System 3 uses)
        expect(tokenizeSearchText(word).every((stem) => allowed.has(stem)), `${topicId}: ${word}`).toBe(true);
        expect(indexText.includes(word), `${topicId}: ${word} not in the rule index`).toBe(true);
      }
    }
  });
});
