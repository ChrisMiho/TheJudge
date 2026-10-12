// REQ-237 / REQ-181: which embedding model runs, and the loud refusal when a vector file was built by another.
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { dirname, resolve } from "node:path";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";
import {
  EmbeddingModelMismatchError,
  STOCK_MODEL_ID,
  assertVectorsMatchRuntimeModel,
  loadEmbeddingModelManifest,
  runtimeEmbeddingModelId
} from "./embeddingModel.js";
import { loadFrozenCardVectors } from "./eval/frozenCardVectors.js";
import { loadFrozenVectors } from "./eval/rules-gate/frozenVectors.js";
import { scoreBenchmarkSemantic } from "./eval/ragRetrievalBenchmark.js";
import { retrieveRulesForQueryWithDebug, type GameRulesRuleIndexEntry, type ScoringResources } from "./gameRulesRetrieval.js";
import { LOCAL_MODEL_ID } from "./providers/localEmbeddingProvider.js";

const currentDir = dirname(fileURLToPath(import.meta.url));
const dataDir = resolve(currentDir, "../data");

function tempFile(name: string, content: unknown): string {
  const dir = mkdtempSync(join(tmpdir(), "embedding-model-test-"));
  const path = join(dir, name);
  writeFileSync(path, JSON.stringify(content), "utf8");
  return path;
}

const manifest = {
  modelId: "rule-search-0123456789ab",
  baseModel: "sentence-transformers/all-MiniLM-L6-v2",
  files: [{ path: "onnx/model_quantized.onnx", sha256: "a".repeat(64), bytes: 10 }]
};

describe("the running model (REQ-237)", () => {
  it("is the stock model when no manifest is committed", () => {
    expect(loadEmbeddingModelManifest("/nonexistent/embeddingModel.manifest.json")).toBeNull();
    expect(runtimeEmbeddingModelId(null)).toBe(STOCK_MODEL_ID);
  });

  it("is the manifest's model id when one is committed", () => {
    const loaded = loadEmbeddingModelManifest(tempFile("m.json", manifest));
    expect(loaded).toEqual(manifest);
    expect(runtimeEmbeddingModelId(loaded)).toBe("rule-search-0123456789ab");
  });

  it("refuses a malformed manifest instead of guessing around it", () => {
    expect(() => loadEmbeddingModelManifest(tempFile("bad.json", { modelId: "x" }))).toThrow(/unexpected shape/);
  });

  it("is what the local embedding provider loads", () => {
    expect(LOCAL_MODEL_ID).toBe(runtimeEmbeddingModelId());
  });
});

describe("every committed vector file records the running model (REQ-237)", () => {
  const running = runtimeEmbeddingModelId();

  it("the rule vectors", () => {
    const artifact = JSON.parse(readFileSync(resolve(dataDir, "gameRulesRuleEmbeddings.json"), "utf8")) as { model: string };
    expect(artifact.model).toBe(running);
  });

  it("the labelled fixtures' frozen query embeddings and the cross-reference test's vector", () => {
    const fixtures = JSON.parse(readFileSync(resolve(currentDir, "eval/fixtures/frozen-query-embeddings.json"), "utf8")) as { model: string };
    const crossReference = JSON.parse(readFileSync(resolve(currentDir, "prompt/preparation.crossReferenceQueryEmbedding.json"), "utf8")) as { model: string };
    expect(fixtures.model).toBe(running);
    expect(crossReference.model).toBe(running);
  });

  it("the rules gate's frozen query vectors and the frozen per-card vectors", () => {
    const gate = JSON.parse(readFileSync(resolve(currentDir, "eval/rules-gate/frozen-query-vectors.json"), "utf8")) as { model: string };
    const cards = JSON.parse(readFileSync(resolve(currentDir, "eval/frozen-card-vectors.json"), "utf8")) as { model: string };
    expect(gate.model).toBe(running);
    expect(cards.model).toBe(running);
  });
});

describe("a model-id mismatch is refused loudly (REQ-181, REQ-237)", () => {
  it("assertVectorsMatchRuntimeModel names both ids and says what to do", () => {
    expect(() => assertVectorsMatchRuntimeModel("The rule vectors", "model-old", "model-new")).toThrow(EmbeddingModelMismatchError);
    expect(() => assertVectorsMatchRuntimeModel("The rule vectors", "model-old", "model-new")).toThrow(/"model-old".*"model-new"/s);
    expect(() => assertVectorsMatchRuntimeModel("The rule vectors", undefined, "model-new")).toThrow(/no model recorded/);
    expect(() => assertVectorsMatchRuntimeModel("The rule vectors", "model-new", "model-new")).not.toThrow();
  });

  it("the rules gate refuses frozen query vectors from another model", () => {
    const path = tempFile("frozen.json", { model: "some-other-model", vectors: {} });
    expect(() => loadFrozenVectors(path)).toThrow(EmbeddingModelMismatchError);
  });

  it("the frozen per-card vectors refuse another model", () => {
    const path = tempFile("cards.json", { model: "some-other-model", vectors: {} });
    expect(() => loadFrozenCardVectors(path)).toThrow(EmbeddingModelMismatchError);
  });

  it("the benchmark refuses to report a semantic number when the rule vectors came from another model", async () => {
    const corpus = { generatedAt: "x", items: [{ question: "q", expectedRuleId: "100.1", sectionTitle: "s", source: "synthetic" as const }] };
    await expect(
      scoreBenchmarkSemantic(corpus, [], "", async () => [1, 0], { runningModelId: "a-model-the-vectors-were-not-built-by" })
    ).rejects.toBeInstanceOf(EmbeddingModelMismatchError);
  });

  it("at runtime the semantic path is disabled with one error naming both ids, and the lexical path serves the question", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const entry: GameRulesRuleIndexEntry = { ruleId: "601.2", sectionTitle: "S", text: "601.2 cast", searchText: "601.2 cast", parentRuleIds: ["601"] };
    const resources: ScoringResources = {
      tokenStats: { N: 100, df: new Map([["cast", 3]]) },
      keywordVocabulary: new Set(),
      ruleEmbeddings: { model: "model-that-built-the-vectors", dims: 2, ruleIds: ["601.2"], vectors: [[1, 0]] },
      runtimeModelId: "model-that-runs"
    };
    const run = () =>
      retrieveRulesForQueryWithDebug([{ token: "cast", source: "question", isKeyword: false }], [], [entry], new Set(), 5, resources, [1, 0]);
    const first = run();
    expect(first.debug.usedSemantic).toBe(false);
    expect(first.selected.map((rule) => rule.ruleId)).toEqual(["601.2"]);
    expect(errorSpy).toHaveBeenCalledTimes(1);
    const message = String(errorSpy.mock.calls[0]![0]);
    expect(message).toContain("model-that-built-the-vectors");
    expect(message).toContain("model-that-runs");
    // Asked again, the same diagnostic is not repeated, and the result is the same.
    expect(run().debug.usedSemantic).toBe(false);
    expect(errorSpy).toHaveBeenCalledTimes(1);
    errorSpy.mockRestore();
  });

  it("an OpenAI-sized query vector against the 384-dimension rule vectors disables the semantic path with one error naming both sizes", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const dims = 384;
    const entry: GameRulesRuleIndexEntry = { ruleId: "601.2", sectionTitle: "S", text: "601.2 cast", searchText: "601.2 cast", parentRuleIds: ["601"] };
    const resources: ScoringResources = {
      tokenStats: { N: 100, df: new Map([["cast", 3]]) },
      keywordVocabulary: new Set(),
      ruleEmbeddings: { model: "m", dims, ruleIds: ["601.2"], vectors: [Array.from({ length: dims }, () => 0.05)] }
    };
    const result = retrieveRulesForQueryWithDebug(
      [{ token: "cast", source: "question", isKeyword: false }],
      [],
      [entry],
      new Set(),
      5,
      resources,
      Array.from({ length: 1536 }, () => 0.01)
    );
    expect(result.debug.usedSemantic).toBe(false);
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(String(errorSpy.mock.calls[0]![0])).toMatch(/1536.*384/s);
    errorSpy.mockRestore();
  });
});
