import { describe, expect, it, vi } from "vitest";
import {
  DEFAULT_JUDGE_MODEL,
  judgeAnswerAlone,
  judgeBlindRanking,
  buildLoneJudgePrompt,
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
      attachedExcerpts: [{ ruleId: "603.7a", text: "A delayed triggered ability is created by a resolving spell or ability." }],
      decidingRuleIds: ["603.7a", "603.7c"],
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
      expect(sentInput).toContain(baseInput.attachedExcerpts[0]!.ruleId);
      expect(sentInput).toContain(baseInput.attachedExcerpts[0]!.text);
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

    it("hides every model id from the prompt, shuffles presentation order, and requests the rubric and a rationale", async () => {
      const client = fakeClient(JSON.stringify({ ranks: { A: 2, B: 1, C: 4, D: 3 }, rationale: "5-mini stayed closest to the reference." }));

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
      expect(sentInput).toContain("Correctness:");
      expect(sentInput).toContain("Grounding:");
      expect(sentInput).toContain("Calibration:");
      expect(sentInput).toContain("Readability:");
      expect(sentInput).toContain("rationale");
    });

    it("maps the returned rank back to the correct real model id after a shuffle, and returns the rationale", async () => {
      const client = fakeClient(
        JSON.stringify({ ranks: { A: 2, B: 1, C: 4, D: 3 }, rationale: "5-mini stayed closest to the reference." })
      );

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
        expect(result.rationale).toBe("5-mini stayed closest to the reference.");
      }
    });

    it("records undetermined, never a partial ranking, when the response has ranks but no rationale", async () => {
      const client = fakeClient(JSON.stringify({ ranks: { A: 1, B: 2, C: 3, D: 4 } }));
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

    it("records undetermined when the rationale is present but empty", async () => {
      const client = fakeClient(JSON.stringify({ ranks: { A: 1, B: 2, C: 3, D: 4 }, rationale: "   " }));
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

    it("produces a different mapping under the identity order, proving the mapping is shuffle-dependent, not coincidental", async () => {
      const client = fakeClient(JSON.stringify({ ranks: { A: 1, B: 2, C: 3, D: 4 }, rationale: "Identity order preserved." }));
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

    it("refuses a single answer without any provider call: a one-model run has nothing to rank", async () => {
      const client = fakeClient(JSON.stringify({ ranks: { A: 1 }, rationale: "Only one." }));
      const result = await judgeBlindRanking({
        client,
        judgeModel: "gpt-5",
        question: "Q",
        workedSolution: "Reference.",
        answers: [answers[0]!]
      });
      expect(result).toEqual({
        undetermined: true,
        reason: "ranking needs two or more answers",
        usage: { inputTokens: 0, outputTokens: 0, reasoningTokens: 0 }
      });
      expect(client.create).not.toHaveBeenCalled();
    });

    it("returns the ranking call's own token use", async () => {
      const create = vi.fn(async () => ({
        output_text: JSON.stringify({ ranks: { A: 1, B: 2, C: 3, D: 4 }, rationale: "Identity." }),
        usage: { input_tokens: 3400, output_tokens: 1000 }
      }));
      const result = await judgeBlindRanking({
        client: { responses: { create } },
        judgeModel: "gpt-5",
        question: "Q",
        workedSolution: "Reference.",
        answers,
        shuffleIndices: [0, 1, 2, 3]
      });
      expect(result.undetermined).toBe(false);
      expect(result.usage).toEqual({ inputTokens: 3400, outputTokens: 1000, reasoningTokens: 0 });
    });
  });

  describe("judge usage (REQ-188: judge cost is recorded)", () => {
    const input = {
      judgeModel: "gpt-5",
      question: "Q",
      attachedExcerpts: [{ ruleId: "603.7a", text: "A delayed triggered ability." }],
      decidingRuleIds: ["603.7a"],
      answerText: "An answer.",
      workedSolution: "The reference."
    };
    const scored = JSON.stringify({ correctness: 2, grounding: 2, calibration: 2, readability: 2, rationale: "Agrees." });

    it("returns the lone judge call's token use beside its scores", async () => {
      const create = vi.fn(async () => ({ output_text: scored, usage: { input_tokens: 1500, output_tokens: 800 } }));
      const result = await judgeAnswerAlone({ client: { responses: { create } }, ...input });
      expect(result.undetermined).toBe(false);
      expect(result.usage).toEqual({ inputTokens: 1500, outputTokens: 800, reasoningTokens: 0 });
    });

    it("still reports the tokens a malformed response cost, and zero when the call itself failed", async () => {
      const malformed = vi.fn(async () => ({ output_text: "not json", usage: { input_tokens: 1500, output_tokens: 20 } }));
      const bad = await judgeAnswerAlone({ client: { responses: { create: malformed } }, ...input });
      expect(bad.undetermined).toBe(true);
      expect(bad.usage).toEqual({ inputTokens: 1500, outputTokens: 20, reasoningTokens: 0 });

      const failed = await judgeAnswerAlone({ client: fakeThrowingClient("boom"), ...input });
      expect(failed.undetermined).toBe(true);
      expect(failed.usage).toEqual({ inputTokens: 0, outputTokens: 0, reasoningTokens: 0 });
    });

    it("reports zero usage when the client reports none", async () => {
      const result = await judgeAnswerAlone({ client: fakeClient(scored), ...input });
      expect(result.usage).toEqual({ inputTokens: 0, outputTokens: 0, reasoningTokens: 0 });
    });
  });
  describe("judge inputs (REQ-186: the judge is told what the prompt actually carried)", () => {
    const excerpts = [
      { ruleId: "614.1a", text: "Effects that use the word instead are replacement effects." },
      { ruleId: "616.1", text: "If two or more replacement effects would apply, the affected player chooses." }
    ];
    const base = {
      question: "What happens when a Treasure would be created?",
      attachedExcerpts: excerpts,
      decidingRuleIds: ["614.1a", "616.1", "616.1e"],
      answerText: "Two Treasures are created.",
      workedSolution: "The affected player orders the replacement effects."
    };

    it("carries the id and text of each attached excerpt, labelled as attached, and the deciding ids under a separate label", () => {
      const prompt = buildLoneJudgePrompt(base);
      expect(prompt).toContain("Rule excerpts attached to the answer prompt");
      expect(prompt).toContain("614.1a. Effects that use the word instead are replacement effects.");
      expect(prompt).toContain("616.1. If two or more replacement effects would apply");
      expect(prompt).toContain("Rules the reference answer turns on (deciding rule ids; they may or may not be attached above): 614.1a, 616.1, 616.1e");
      // 616.1e is deciding but not attached: it appears only on the deciding line.
      expect(prompt.split("616.1e")).toHaveLength(2);
      expect(prompt.indexOf("Rule excerpts attached")).toBeLessThan(prompt.indexOf("Rules the reference answer turns on"));
    });

    it("says so when nothing was attached, and prints no game-state block for a lookup", () => {
      const prompt = buildLoneJudgePrompt({ ...base, attachedExcerpts: [] });
      expect(prompt).toContain("Rule excerpts attached to the answer prompt (the rules the answer could draw on):\n  (none)");
      expect(prompt).not.toContain("Game state the prompt printed");
    });

    it("prints the state lines the prompt printed for a case with a game state", () => {
      const prompt = buildLoneJudgePrompt({
        ...base,
        stateLines: ["turnPhase: cleanup", "ZONE: STACK (BOTTOM TO TOP)", "card: Academy Manufactor"]
      });
      expect(prompt).toContain("Game state the prompt printed:\n  turnPhase: cleanup\n  ZONE: STACK (BOTTOM TO TOP)\n  card: Academy Manufactor");
    });

    it("is built identically however the answer was produced: the model, cap and arm are not inputs", async () => {
      const reference = buildLoneJudgePrompt(base);
      const sent: string[] = [];
      for (const judgeModel of ["gpt-5", "gpt-5-mini"]) {
        const create = vi.fn(async (params: { model: string; input: string }) => {
          sent.push(params.input);
          return { output_text: "not json" };
        });
        await judgeAnswerAlone({ client: { responses: { create } }, judgeModel, ...base });
      }
      expect(sent).toEqual([reference, reference]);
      expect(Object.keys(base)).not.toEqual(expect.arrayContaining(["model", "excerptCap", "arm"]));
    });

    it("reports the judge's reasoning tokens inside its output tokens", async () => {
      const create = vi.fn(async () => ({
        output_text: JSON.stringify({ correctness: 2, grounding: 2, calibration: 2, readability: 2, rationale: "Agrees." }),
        usage: { input_tokens: 1500, output_tokens: 2300, output_tokens_details: { reasoning_tokens: 1500 } }
      }));
      const result = await judgeAnswerAlone({ client: { responses: { create } }, judgeModel: "gpt-5", ...base });
      expect(result.usage).toEqual({ inputTokens: 1500, outputTokens: 2300, reasoningTokens: 1500 });
    });
  });
});
