import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import {
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

    it("writes a per-case-per-cap ranking transcript", async () => {
      const dir = makeTempDir();
      const filePath = await writeRankingTranscript(
        { caseId: "case-a", excerptCap: 5, ranks: { "gpt-4.1-mini": 1, "gpt-4.1": 2 }, undetermined: false },
        dir
      );
      expect(existsSync(filePath)).toBe(true);
      const files = readdirSync(dir);
      expect(files).toContain("case-a--cap5--ranking.json");
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
