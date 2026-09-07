import assert from "node:assert/strict";
import test from "node:test";

import {
  CONFIRM_FLAG,
  DEFAULT_EXCERPT_CAPS,
  DEFAULT_JUDGE_MODEL,
  DEFAULT_LINEUP,
  assertLiveProviderConfigured,
  checkModelAccess,
  estimateCost,
  parseArgs,
  resolveJudgeModel,
  run
} from "./eval-answer-quality.mjs";

// Never depends on the real preparePromptInput TS import: every test injects
// a fixed measureChars, so this file runs under plain `node --test`, no
// TypeScript loader, and makes no network call.
const fakeMeasureChars = async (goldCases, excerptCaps) => {
  const result = {};
  for (const cap of excerptCaps) result[cap] = 10000;
  return result;
};

function fakeAccessClient(availableModelIds) {
  const calls = [];
  return {
    calls,
    models: {
      async list() {
        calls.push("list");
        return { data: availableModelIds.map((id) => ({ id })) };
      }
    }
  };
}

test("parseArgs defaults to the four-model lineup and both excerpt caps, ignoring OPENAI_MODEL entirely", () => {
  const originalOpenAiModel = process.env.OPENAI_MODEL;
  process.env.OPENAI_MODEL = "some-other-model";
  try {
    const parsed = parseArgs([]);
    assert.deepEqual(parsed.models, DEFAULT_LINEUP);
    assert.deepEqual(parsed.excerptCaps, DEFAULT_EXCERPT_CAPS);
    assert.equal(parsed.confirmed, false);
    assert.ok(!parsed.models.includes("some-other-model"));
  } finally {
    if (originalOpenAiModel === undefined) delete process.env.OPENAI_MODEL;
    else process.env.OPENAI_MODEL = originalOpenAiModel;
  }
});

test("parseArgs reads repeatable --model and --excerpt-cap flags and the confirm flag", () => {
  const parsed = parseArgs(["--model", "gpt-4.1", "--model", "gpt-5-nano", "--excerpt-cap", "5", CONFIRM_FLAG]);
  assert.deepEqual(parsed.models, ["gpt-4.1", "gpt-5-nano"]);
  assert.deepEqual(parsed.excerptCaps, [5]);
  assert.equal(parsed.confirmed, true);
});

test("resolveJudgeModel defaults to gpt-5 and honors ANSWER_QUALITY_JUDGE_MODEL", () => {
  assert.equal(resolveJudgeModel({}), DEFAULT_JUDGE_MODEL);
  assert.equal(resolveJudgeModel({ ANSWER_QUALITY_JUDGE_MODEL: "gpt-5-custom" }), "gpt-5-custom");
});

test("run with no confirmation flag and no OPENAI_API_KEY prints a plan, makes no network call, and exits without error", async () => {
  const logs = [];
  const result = await run({
    argv: [],
    env: {},
    log: (line) => logs.push(line),
    measureChars: fakeMeasureChars
  });

  assert.equal(result.ran, false);
  assert.equal(result.accessChecked, false);
  assert.equal(logs.length, 1);
  assert.match(logs[0], /Answer-quality baseline plan/);
  assert.match(logs[0], /Gold cases: \d+/);
  assert.match(logs[0], /Estimated cost: \$/);
});

test("run with --confirm-live-calls and no OPENAI_API_KEY fails with an actionable message, no network call made", async () => {
  const client = fakeAccessClient(DEFAULT_LINEUP);
  await assert.rejects(
    () =>
      run({
        argv: [CONFIRM_FLAG],
        env: {},
        log: () => {},
        measureChars: fakeMeasureChars,
        client
      }),
    /ASK_AI_PROVIDER/
  );
  assert.deepEqual(client.calls, [], "the models-list request must never happen before the provider guard passes");
});

test("run with --confirm-live-calls, ASK_AI_PROVIDER set but no OPENAI_API_KEY still fails actionably", async () => {
  await assert.rejects(
    () =>
      run({
        argv: [CONFIRM_FLAG],
        env: { ASK_AI_PROVIDER: "openai" },
        log: () => {},
        measureChars: fakeMeasureChars
      }),
    /OPENAI_API_KEY/
  );
});

test("assertLiveProviderConfigured passes only with ASK_AI_PROVIDER=openai and OPENAI_API_KEY set", () => {
  assert.doesNotThrow(() => assertLiveProviderConfigured({ ASK_AI_PROVIDER: "openai", OPENAI_API_KEY: "sk-test" }));
  assert.throws(() => assertLiveProviderConfigured({}), /ASK_AI_PROVIDER/);
  assert.throws(() => assertLiveProviderConfigured({ ASK_AI_PROVIDER: "openai" }), /OPENAI_API_KEY/);
});

test("the dry run performs the model-access check (a models-list request, never a completion) when a key is present", async () => {
  const client = fakeAccessClient([...DEFAULT_LINEUP, DEFAULT_JUDGE_MODEL]);
  const logs = [];
  const result = await run({
    argv: [],
    env: { OPENAI_API_KEY: "sk-test" },
    log: (line) => logs.push(line),
    measureChars: fakeMeasureChars,
    client
  });

  assert.equal(result.accessChecked, true);
  assert.deepEqual(client.calls, ["list"]);
  assert.match(logs[0], /Model access check passed/);
  assert.ok(!("responses" in client), "the fake client exposes no completion method -- nothing could call one");
});

test("the dry run skips the model-access check entirely when no key is present", async () => {
  const client = fakeAccessClient(DEFAULT_LINEUP);
  const result = await run({
    argv: [],
    env: {},
    log: () => {},
    measureChars: fakeMeasureChars,
    client
  });

  assert.equal(result.accessChecked, false);
  assert.deepEqual(client.calls, [], "no key present means no network call at all, not even a models-list one");
});

test("checkModelAccess reports every missing model id from a models-list response", async () => {
  const client = fakeAccessClient(["gpt-4.1-mini"]);
  const result = await checkModelAccess({ client, modelIds: ["gpt-4.1-mini", "gpt-5-nano", "gpt-5"] });
  assert.equal(result.available, false);
  assert.deepEqual(result.missing, ["gpt-5-nano", "gpt-5"]);
});

test("a live run fails naming any lineup or judge model the credentials cannot access, before any completion", async () => {
  const client = fakeAccessClient(["gpt-4.1-mini", "gpt-4.1"]); // missing gpt-5-mini, gpt-5-nano, and the judge
  await assert.rejects(
    () =>
      run({
        argv: [CONFIRM_FLAG],
        env: { ASK_AI_PROVIDER: "openai", OPENAI_API_KEY: "sk-test" },
        measureChars: fakeMeasureChars,
        client
      }),
    /gpt-5-mini.*gpt-5-nano.*gpt-5|does not have access/
  );
});

test("a live run with full model access reports access verified and does not yet make any completion call (Slice E wires the loop)", async () => {
  const client = fakeAccessClient([...DEFAULT_LINEUP, DEFAULT_JUDGE_MODEL]);
  const logs = [];
  const result = await run({
    argv: [CONFIRM_FLAG],
    env: { ASK_AI_PROVIDER: "openai", OPENAI_API_KEY: "sk-test" },
    log: (line) => logs.push(line),
    measureChars: fakeMeasureChars,
    client
  });

  assert.equal(result.accessChecked, true);
  assert.deepEqual(client.calls, ["list"]);
  assert.match(logs[0], /Model access verified/);
});

test("estimateCost sets no numeric target and scales with lineup size, excerpt caps, and gold-case count", () => {
  const small = estimateCost({
    models: ["gpt-4.1-mini"],
    judgeModel: "gpt-5",
    excerptCaps: [5],
    goldCaseCount: 6,
    avgPromptCharsByCap: { 5: 10000 }
  });
  const large = estimateCost({
    models: DEFAULT_LINEUP,
    judgeModel: "gpt-5",
    excerptCaps: [5, 10],
    goldCaseCount: 18,
    avgPromptCharsByCap: { 5: 10000, 10: 12600 }
  });

  assert.equal(small.answerCalls, 6);
  assert.equal(large.answerCalls, DEFAULT_LINEUP.length * 18 * 2);
  assert.ok(large.totalCostUsd > small.totalCostUsd);
  assert.ok(Number.isFinite(large.totalCostUsd));
});
