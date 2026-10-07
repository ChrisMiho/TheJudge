import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { RUBRIC_REVISION } from "./rubric.js";
import {
  compareRecords,
  compareRuns,
  readResultsFile,
  validateResultsShape,
  writeRankingTranscript,
  writeResultsFile,
  writeTranscript,
  type AnswerQualityResults,
  type RunMetadata
} from "./artifact.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../../..");

function sampleResults(overrides: Partial<AnswerQualityResults> = {}): AnswerQualityResults {
  return {
    runMetadata: {
      goldSetCaseIds: ["case-a", "case-b"],
      goldSetTier1Count: 1,
      goldSetTier2Count: 1,
      answerModelLineup: ["gpt-4.1-mini", "gpt-4.1"],
      judgeModel: "gpt-5",
      judgeMatchesAnswerModel: false,
      rubricRevision: "2026-09-07.1",
      askAiProvider: "openai",
      embeddingProvider: "local",
      gitCommit: "abc1234",
      generatedAt: "2026-09-07T00:00:00.000Z",
      totalInputTokens: 1000,
      totalOutputTokens: 500,
      totalCostUsd: 0.12
    },
    legs: [{ model: "gpt-4.1-mini", excerptCap: 5, fullyCorrectCount: 1, caseCount: 2 }],
    caseLegScores: [
      {
        caseId: "case-a",
        model: "gpt-4.1-mini",
        excerptCap: 5,
        undetermined: false,
        scores: { correctness: 2, grounding: 2, calibration: 2, readability: 2 },
        namesGoldRuleId: true,
        promptChars: 10000,
        inputTokens: 2500,
        outputTokens: 600,
        latencyMs: 1200,
        blindRank: 1
      }
    ],
    ...overrides
  };
}

describe("Backend - Eval - Answer quality - artifact (REQ-189)", () => {
  const tempDirs: string[] = [];
  afterEach(() => {
    for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true });
  });

  function makeTempDir(): string {
    const dir = mkdtempSync(path.join(tmpdir(), "answer-quality-artifact-"));
    tempDirs.push(dir);
    return dir;
  }

  describe("writeResultsFile / readResultsFile", () => {
    it("round-trips a run record and every required field is present after reading it back", async () => {
      const dir = makeTempDir();
      const resultsPath = path.join(dir, "results.json");
      const results = sampleResults();

      await writeResultsFile(results, resultsPath);
      const readBack = await readResultsFile(resultsPath);

      expect(readBack).toEqual(results);
      expect(validateResultsShape(readBack)).toEqual([]);
    });

    it("replaces the file on a second write, never appends", async () => {
      const dir = makeTempDir();
      const resultsPath = path.join(dir, "results.json");

      await writeResultsFile(sampleResults(), resultsPath);
      const second = sampleResults({ legs: [] });
      await writeResultsFile(second, resultsPath);

      const readBack = await readResultsFile(resultsPath);
      expect(readBack.legs).toEqual([]);
    });

    it("contains no model prose -- no answer text, no judge rationale, no prompt text", async () => {
      const dir = makeTempDir();
      const resultsPath = path.join(dir, "results.json");
      await writeResultsFile(sampleResults(), resultsPath);

      const raw = await readResultsFile(resultsPath);
      const asText = JSON.stringify(raw);
      expect(asText).not.toContain("rationale");
      expect(asText).not.toContain("promptText");
      expect(asText).not.toContain("workedSolution");
    });

    it("refuses to write a record that carries disallowed prose fields", async () => {
      const dir = makeTempDir();
      const resultsPath = path.join(dir, "results.json");
      const withProse = {
        ...sampleResults(),
        caseLegScores: [{ ...sampleResults().caseLegScores[0], rationale: "leaked prose" } as never]
      };

      await expect(writeResultsFile(withProse, resultsPath)).rejects.toThrow(/disallowed model prose/);
      expect(existsSync(resultsPath)).toBe(false);
    });

    it("refuses a record carrying shortAnswer: the reviewer's one-line summary is prose too", async () => {
      const dir = makeTempDir();
      const resultsPath = path.join(dir, "results.json");
      const withShortAnswer = {
        ...sampleResults(),
        caseLegScores: [{ ...sampleResults().caseLegScores[0], shortAnswer: "Yes: it still triggers." } as never]
      };

      await expect(writeResultsFile(withShortAnswer, resultsPath)).rejects.toThrow(/shortAnswer is disallowed model prose/);
      expect(existsSync(resultsPath)).toBe(false);
    });

    it("keeps workedSolution on the no-prose list so the version-1 field name can never leak in", async () => {
      const dir = makeTempDir();
      const withOldName = {
        ...sampleResults(),
        caseLegScores: [{ ...sampleResults().caseLegScores[0], workedSolution: "leaked" } as never]
      };
      await expect(writeResultsFile(withOldName, path.join(dir, "results.json"))).rejects.toThrow(/workedSolution/);
    });

    it("accepts the per-case fields a graded record carries: hashes, judge usage, unknown rule ids, timestamp and commit", async () => {
      const dir = makeTempDir();
      const resultsPath = path.join(dir, "results.json");
      const graded = {
        ...sampleResults().caseLegScores[0],
        tier: 1 as const,
        unknownRuleIds: ["999.9z"],
        promptHash: "a".repeat(64),
        referenceAnswerHash: "b".repeat(64),
        judgeInputTokens: 1500,
        judgeOutputTokens: 800,
        gradedAt: "2026-10-06T00:00:00.000Z",
        commit: "abc1234"
      };
      await writeResultsFile(sampleResults({ caseLegScores: [graded] }), resultsPath);
      expect((await readResultsFile(resultsPath)).caseLegScores[0]).toEqual(graded);
    });

    it("validateResultsShape reports every missing required field", () => {
      const incomplete = sampleResults();
      // @ts-expect-error -- deliberately constructing an invalid shape
      delete incomplete.runMetadata.judgeModel;
      const problems = validateResultsShape(incomplete);
      expect(problems).toContain("runMetadata.judgeModel is missing");
    });
  });

  describe("writeTranscript / writeRankingTranscript", () => {
    it("writes a full per-case-per-leg transcript under the given output directory", async () => {
      const dir = makeTempDir();
      const filePath = await writeTranscript(
        {
          caseId: "case-a",
          model: "gpt-4.1-mini",
          excerptCap: 5,
          question: "Does the trigger fire?",
          promptText: "assembled prompt text...",
          answerText: "No, it never fires.",
          workedSolution: "In this case, the delayed ability never triggers.",
          assertions: { namesGoldRuleId: true, nonEmpty: true, length: 20 },
          scores: { correctness: 2, grounding: 2, calibration: 2, readability: 2 },
          undetermined: false,
          rationale: "Matches the reference."
        },
        dir
      );

      expect(existsSync(filePath)).toBe(true);
      expect(filePath.startsWith(dir)).toBe(true);
      const files = await readdir(dir);
      expect(files).toContain("case-a--gpt-4.1-mini--cap5.json");
    });

    it("writes a per-case-per-cap ranking transcript, including its rationale", async () => {
      const dir = makeTempDir();
      const filePath = await writeRankingTranscript(
        {
          caseId: "case-a",
          excerptCap: 5,
          ranks: { "gpt-4.1-mini": 1, "gpt-4.1": 2 },
          undetermined: false,
          rationale: "gpt-4.1-mini stayed closer to the reference's wording."
        },
        dir
      );
      expect(existsSync(filePath)).toBe(true);
      const files = readdirSync(dir);
      expect(files).toContain("case-a--cap5--ranking.json");

      const written = JSON.parse(await readFile(filePath, "utf8"));
      expect(written.rationale).toBe("gpt-4.1-mini stayed closer to the reference's wording.");
    });

    it("a fresh directory with no writer call stays empty (the dry-run posture)", async () => {
      const dir = makeTempDir();
      const files = await readdir(dir);
      expect(files).toEqual([]);
    });
  });

  describe("compareRuns", () => {
    const base: RunMetadata = sampleResults().runMetadata;

    it("reports identical-lineup for two runs with the same everything", () => {
      const result = compareRuns(base, { ...base });
      expect(result).toEqual({ comparable: true, kind: "identical-lineup" });
    });

    it("reports a model comparison, never incomparable, when only the answer-model lineup differs", () => {
      const other: RunMetadata = { ...base, answerModelLineup: ["gpt-4.1-mini", "gpt-5-nano"] };
      const result = compareRuns(base, other);
      expect(result.comparable).toBe(true);
      if (result.comparable && result.kind === "model-comparison") {
        expect(result.sharedModels).toEqual(["gpt-4.1-mini"]);
        expect(result.onlyInA).toEqual(["gpt-4.1"]);
        expect(result.onlyInB).toEqual(["gpt-5-nano"]);
      } else {
        throw new Error("expected a model-comparison result");
      }
    });

    it("reports incomparable when the gold set differs", () => {
      const other: RunMetadata = { ...base, goldSetCaseIds: ["case-a", "case-c"] };
      expect(compareRuns(base, other)).toEqual({ comparable: false, reason: "gold sets differ" });
    });

    it("reports incomparable when the judge model differs", () => {
      const other: RunMetadata = { ...base, judgeModel: "gpt-5-thinking" };
      expect(compareRuns(base, other)).toEqual({ comparable: false, reason: "judge models differ" });
    });

    it("reports incomparable when the rubric revision differs", () => {
      const other: RunMetadata = { ...base, rubricRevision: "2026-10-01.1" };
      expect(compareRuns(base, other)).toEqual({ comparable: false, reason: "rubric revisions differ" });
    });

    it("reports incomparable when EMBEDDING_PROVIDER differs", () => {
      const other: RunMetadata = { ...base, embeddingProvider: "mock" };
      expect(compareRuns(base, other)).toEqual({ comparable: false, reason: "EMBEDDING_PROVIDER differs" });
    });
  });

  describe("compareRecords (REQ-189: compared per case)", () => {
    const base = {
      ...sampleResults().caseLegScores[0],
      referenceAnswerHash: "r".repeat(64),
      judgeModel: "gpt-5",
      rubricRevision: "2026-09-07.1",
      embeddingProvider: "local"
    };

    it("is comparable when only the record's own run differs", () => {
      expect(compareRecords(base, { ...base })).toEqual({ comparable: true, kind: "same-model" });
    });

    it("is a model comparison, never incomparable, when only the answer model differs", () => {
      expect(compareRecords(base, { ...base, model: "gpt-4.1" })).toEqual({
        comparable: true,
        kind: "model-comparison",
        models: ["gpt-4.1-mini", "gpt-4.1"]
      });
    });

    it("is incomparable when the reference answer, judge model, rubric revision or embedding provider differs", () => {
      expect(compareRecords(base, { ...base, referenceAnswerHash: "s".repeat(64) })).toEqual({
        comparable: false,
        reason: "reference answers differ"
      });
      expect(compareRecords(base, { ...base, judgeModel: "gpt-5-thinking" })).toEqual({
        comparable: false,
        reason: "judge models differ"
      });
      expect(compareRecords(base, { ...base, rubricRevision: "2026-10-01.1" })).toEqual({
        comparable: false,
        reason: "rubric revisions differ"
      });
      expect(compareRecords(base, { ...base, embeddingProvider: "mock" })).toEqual({
        comparable: false,
        reason: "EMBEDDING_PROVIDER differs"
      });
    });

    it("refuses a per-case comparison between grades under the previous rubric revision and the current one (REQ-187)", () => {
      const previous = { ...base, rubricRevision: "2026-10-06.1" };
      const current = { ...base, rubricRevision: RUBRIC_REVISION };
      expect(RUBRIC_REVISION).not.toBe("2026-10-06.1");
      expect(compareRecords(previous, current)).toEqual({ comparable: false, reason: "rubric revisions differ" });
      expect(compareRecords(current, { ...current })).toEqual({ comparable: true, kind: "same-model" });
    });

    it("accepts the new record fields beside the unchanged goldRuleInPrompt, and marks an unknown cost as unpriced, not zero (REQ-189, REQ-227)", () => {
      const record = {
        ...base,
        goldRuleInPrompt: true,
        allDecidingRulesInPrompt: false,
        reasoningTokens: 1500,
        judgeReasoningTokens: 900,
        reportedEffort: "medium",
        unpriced: true
      };
      const results = sampleResults({ caseLegScores: [record] });
      results.runMetadata.comboCatalogLoaded = true;
      results.runMetadata.answerClientTimeoutMs = "sdk-default";
      results.runMetadata.answerClientMaxRetries = "sdk-default";
      results.runMetadata.totalReasoningTokens = 1500;
      results.runMetadata.unpricedModels = ["gpt-6-luna"];
      expect(validateResultsShape(results)).toEqual([]);
      expect(record.goldRuleInPrompt).toBe(true);
      expect(record.allDecidingRulesInPrompt).toBe(false);
      expect(record.unpriced).toBe(true);
      expect("costUsd" in record).toBe(false);
    });

    it("never claims a legacy record (no hashes) comparable to one that carries them", () => {
      const legacy = { ...base, referenceAnswerHash: undefined };
      expect(compareRecords(legacy, base).comparable).toBe(false);
    });
  });

  describe(".gitignore (REQ-189)", () => {
    it("git check-ignore matches a path under output/answer-quality/", () => {
      const output = execFileSync("git", ["check-ignore", "-v", "output/answer-quality/example.json"], {
        cwd: repoRoot,
        encoding: "utf8"
      });
      expect(output).toContain(".gitignore");
      expect(output).toContain("output/answer-quality/");
    });
  });
});
