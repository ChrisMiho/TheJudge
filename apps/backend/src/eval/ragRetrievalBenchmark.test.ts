import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { loadCardDetailIndex } from "../cardDetail.js";
import { loadGameRulesRuleIndex } from "../gameRulesRetrieval.js";
import {
  BENCHMARK_PATH,
  CARD_DETAIL_PATH,
  RULE_INDEX_PATH,
  buildPollutionText,
  loadBenchmarkCorpus,
  scoreBenchmark
} from "./ragRetrievalBenchmark.js";

const currentDir = dirname(fileURLToPath(import.meta.url));
const step1BaselinePath = resolve(currentDir, "benchmark/step1-baseline.json");

type Step1Baseline = { clean: { recall5: number }; polluted: { recall5: number } };

function loadStep1Baseline(): Step1Baseline {
  return JSON.parse(readFileSync(step1BaselinePath, "utf8")) as Step1Baseline;
}

describe("Backend - Eval - RAG retrieval benchmark (REQ-177)", () => {
  it("loads the committed 156-pair corpus: 150 synthetic + 6 gold", () => {
    const corpus = loadBenchmarkCorpus();
    expect(corpus.items).toHaveLength(156);
    expect(corpus.items.filter((item) => item.source === "gold")).toHaveLength(6);
    expect(corpus.items.filter((item) => item.source === "synthetic")).toHaveLength(150);
    for (const item of corpus.items) {
      expect(item.question.length).toBeGreaterThan(0);
      expect(item.expectedRuleId.length).toBeGreaterThan(0);
    }
  });

  it("scores deterministically offline: no live AI call, no live embedding call, no randomness", () => {
    // Calling this twice with the same committed inputs must yield byte-identical
    // results — the guarantee that lets Step 2+ compare against a fixed baseline.
    const corpus = loadBenchmarkCorpus(BENCHMARK_PATH);
    const ruleIndex = loadGameRulesRuleIndex(RULE_INDEX_PATH);
    const cardDetailIndex = loadCardDetailIndex(CARD_DETAIL_PATH);
    const pollutionText = buildPollutionText(cardDetailIndex);

    const first = scoreBenchmark(corpus, ruleIndex, pollutionText);
    const second = scoreBenchmark(corpus, ruleIndex, pollutionText);

    expect(second).toEqual(first);
    expect(first.n).toBe(156);
    expect(first.k).toBe(5);
    expect(first.clean.recall5).toBeGreaterThan(0);
    expect(first.clean.mrr).toBeGreaterThan(0);
  });

  it("stays at or above the committed Step 1 baseline (REQ-177/178/179/180 no-regression gate)", () => {
    // Every later gameplan step states its recall gate relative to this
    // baseline, never derived by proportion (DESIGN-BRIEF material assumption
    // 3). This test is the shared no-regression guard: it reads the frozen
    // `step1-baseline.json` rather than pinning a literal number here, so it
    // stays meaningful (and green) as Slices B-D deliberately move the clean
    // recall number up.
    const corpus = loadBenchmarkCorpus(BENCHMARK_PATH);
    const ruleIndex = loadGameRulesRuleIndex(RULE_INDEX_PATH);
    const cardDetailIndex = loadCardDetailIndex(CARD_DETAIL_PATH);
    const pollutionText = buildPollutionText(cardDetailIndex);
    const result = scoreBenchmark(corpus, ruleIndex, pollutionText);
    const baseline = loadStep1Baseline();

    expect(result.clean.recall5).toBeGreaterThanOrEqual(baseline.clean.recall5);
  });
});
