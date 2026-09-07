import { describe, expect, it, vi } from "vitest";
import {
  DEFAULT_JUDGE_MODEL,
  judgeAnswerAlone,
  judgeBlindRanking,
  judgeMatchesAnswerModel,
  resolveJudgeModel,
  type JudgeClient
} from "./judge.js";

function fakeClient(outputText: string): JudgeClient & { create: ReturnType<typeof vi.fn> } {
  const create = vi.fn(async () => ({ output_text: outputText }));
  return { responses: { create }, create };
}

function fakeThrowingClient(message: string): JudgeClient {
  return {
    responses: {
      create: vi.fn(async () => {
        throw new Error(message);
      })
    }
  };
}

describe("Backend - Eval - Answer quality - judge (REQ-186)", () => {
  describe("resolveJudgeModel / judgeMatchesAnswerModel", () => {
    it("defaults to gpt-5 when ANSWER_QUALITY_JUDGE_MODEL is unset", () => {
      expect(resolveJudgeModel({})).toBe(DEFAULT_JUDGE_MODEL);
      expect(DEFAULT_JUDGE_MODEL).toBe("gpt-5");
    });

    it("honors ANSWER_QUALITY_JUDGE_MODEL when set", () => {
      expect(resolveJudgeModel({ ANSWER_QUALITY_JUDGE_MODEL: "gpt-5-custom" })).toBe("gpt-5-custom");
    });

    it("never falls back to OPENAI_MODEL", () => {
      expect(resolveJudgeModel({ OPENAI_MODEL: "gpt-4.1-mini" })).toBe(DEFAULT_JUDGE_MODEL);
    });

    it("flags a mismatch when the judge model id matches a lineup model id", () => {
      expect(judgeMatchesAnswerModel("gpt-4.1-mini", ["gpt-4.1-mini", "gpt-4.1"])).toBe(true);
      expect(judgeMatchesAnswerModel("gpt-5", ["gpt-4.1-mini", "gpt-4.1", "gpt-5-mini", "gpt-5-nano"])).toBe(false);
    });
  });

  describe("judgeAnswerAlone", () => {
    const baseInput = {
      judgeModel: "gpt-5",
      question: "Does the delayed trigger still fire?",
      ruleIds: ["603.7a"],
      answerText: "No, the delayed ability never triggers once the creature is already gone.",
      workedSolution: "In this case, the delayed ability never triggers."
    };

    it("sends the question, rule ids, answer, workedSolution, and rubric to the client and parses back four axis scores plus a rationale", async () => {
      const client = fakeClient(
        JSON.stringify({ correctness: 2, grounding: 2, calibration: 2, readability: 2, rationale: "Matches the reference exactly." })
      );

      const result = await judgeAnswerAlone({ client, ...baseInput });

      expect(result.undetermined).toBe(false);
      if (!result.undetermined) {
        expect(result.scores).toEqual({ correctness: 2, grounding: 2, calibration: 2, readability: 2 });
        expect(result.rationale).toBe("Matches the reference exactly.");
      }

      expect(client.create).toHaveBeenCalledTimes(1);
      const sentInput = client.create.mock.calls[0][0].input as string;
      expect(sentInput).toContain(baseInput.question);
      expect(sentInput).toContain(baseInput.ruleIds[0]);
      expect(sentInput).toContain(baseInput.answerText);
      expect(sentInput).toContain(baseInput.workedSolution);
      expect(sentInput).toContain("Correctness:");
      expect(sentInput).toContain("Grounding:");
      expect(sentInput).toContain("Calibration:");
      expect(sentInput).toContain("Readability:");
      expect(client.create.mock.calls[0][0].model).toBe("gpt-5");
    });

    it("parses JSON wrapped in a fenced code block", async () => {
      const client = fakeClient(
        "```json\n" +
          JSON.stringify({ correctness: 1, grounding: 1, calibration: 1, readability: 1, rationale: "Partially right." }) +
          "\n```"
      );
      const result = await judgeAnswerAlone({ client, ...baseInput });
      expect(result.undetermined).toBe(false);
    });

    it("records undetermined, never a numeric score, when the client throws", async () => {
      const client = fakeThrowingClient("network error");
      const result = await judgeAnswerAlone({ client, ...baseInput });
      expect(result.undetermined).toBe(true);
      if (result.undetermined) expect(result.reason).toMatch(/network error/);
    });

    it("records undetermined when the response is not valid JSON", async () => {
      const client = fakeClient("I think it's probably correct.");
      const result = await judgeAnswerAlone({ client, ...baseInput });
      expect(result.undetermined).toBe(true);
    });

    it("records undetermined when an axis score is out of range", async () => {
      const client = fakeClient(
        JSON.stringify({ correctness: 5, grounding: 2, calibration: 2, readability: 2, rationale: "x" })
      );
      const result = await judgeAnswerAlone({ client, ...baseInput });
      expect(result.undetermined).toBe(true);
    });

    it("records undetermined when a required field is missing", async () => {
      const client = fakeClient(JSON.stringify({ correctness: 2, grounding: 2, calibration: 2 }));
      const result = await judgeAnswerAlone({ client, ...baseInput });
      expect(result.undetermined).toBe(true);
    });
  });

  describe("judgeBlindRanking", () => {
    const answers = [
      { modelId: "gpt-4.1-mini", answerText: "Answer from mini." },
      { modelId: "gpt-4.1", answerText: "Answer from 4.1." },
      { modelId: "gpt-5-mini", answerText: "Answer from 5-mini." },
      { modelId: "gpt-5-nano", answerText: "Answer from nano." }
    ];

    it("hides every model id from the prompt and shuffles presentation order before the call", async () => {
      const client = fakeClient(JSON.stringify({ ranks: { A: 2, B: 1, C: 4, D: 3 } }));

      await judgeBlindRanking({
        client,
        judgeModel: "gpt-5",
        question: "Q",
        workedSolution: "Reference.",
        answers,
        shuffleIndices: [2, 0, 3, 1] // gpt-5-mini, gpt-4.1-mini, gpt-5-nano, gpt-4.1 -> labels A,B,C,D
      });

      const sentInput = client.create.mock.calls[0][0].input as string;
      for (const { modelId } of answers) {
        expect(sentInput).not.toContain(modelId);
      }
      expect(sentInput).toContain("Answer A: Answer from 5-mini.");
      expect(sentInput).toContain("Answer B: Answer from mini.");
      expect(sentInput).toContain("Answer C: Answer from nano.");
      expect(sentInput).toContain("Answer D: Answer from 4.1.");
    });

    it("maps the returned rank back to the correct real model id after a shuffle", async () => {
      const client = fakeClient(JSON.stringify({ ranks: { A: 2, B: 1, C: 4, D: 3 } }));

      const result = await judgeBlindRanking({
        client,
        judgeModel: "gpt-5",
        question: "Q",
        workedSolution: "Reference.",
        answers,
        shuffleIndices: [2, 0, 3, 1] // A=gpt-5-mini, B=gpt-4.1-mini, C=gpt-5-nano, D=gpt-4.1
      });

      expect(result.undetermined).toBe(false);
      if (!result.undetermined) {
        expect(result.ranks).toEqual({
          "gpt-5-mini": 2,
          "gpt-4.1-mini": 1,
          "gpt-5-nano": 4,
          "gpt-4.1": 3
        });
      }
    });

    it("produces a different mapping under the identity order, proving the mapping is shuffle-dependent, not coincidental", async () => {
      const client = fakeClient(JSON.stringify({ ranks: { A: 1, B: 2, C: 3, D: 4 } }));
      const result = await judgeBlindRanking({
        client,
        judgeModel: "gpt-5",
        question: "Q",
        workedSolution: "Reference.",
        answers,
        shuffleIndices: [0, 1, 2, 3]
      });
      expect(result.undetermined).toBe(false);
      if (!result.undetermined) {
        expect(result.ranks).toEqual({
          "gpt-4.1-mini": 1,
          "gpt-4.1": 2,
          "gpt-5-mini": 3,
          "gpt-5-nano": 4
        });
      }
    });

    it("records undetermined when the ranking response is malformed", async () => {
      const client = fakeClient("not json");
      const result = await judgeBlindRanking({
        client,
        judgeModel: "gpt-5",
        question: "Q",
        workedSolution: "Reference.",
        answers,
        shuffleIndices: [0, 1, 2, 3]
      });
      expect(result.undetermined).toBe(true);
    });

    it("records undetermined when the client throws", async () => {
      const client = fakeThrowingClient("boom");
      const result = await judgeBlindRanking({
        client,
        judgeModel: "gpt-5",
        question: "Q",
        workedSolution: "Reference.",
        answers,
        shuffleIndices: [0, 1, 2, 3]
      });
      expect(result.undetermined).toBe(true);
    });
  });
});
