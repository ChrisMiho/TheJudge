// Shared live-call plumbing for both arm-L probes (no product edits). Mirrors the effort probes' answer/judge path
// with no effort parameter (production default; provider must report medium).
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

export const REPO = "/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/probe-pft";
export const SUITE_RECORDS = `${REPO}/output/rulesguru/runs/probe-lookup-topics-hard25/records.jsonl`;
export const CORPUS_RECORDS = "/Users/chrismiho/Coding/Projects/TheJudge/PRD/work/probe-prompt-format-tuning/runs/lookup-topics-corpus/records.jsonl";
export const MAX_USD_TOTAL = 6; // across both record files
export const MODEL = "gpt-6-luna";
export const EXPECTED_JUDGE = "gpt-6.1-sol";
export const EXPECTED_EFFORT = "medium";
export const CAP = 10;
export const ANSWER_ESTIMATE_MULTIPLIER = 1.5;

export const imp = (rel) => import(pathToFileURL(`${REPO}/${rel}`).href);

export const spentOf = (file) =>
  existsSync(file) ? readFileSync(file, "utf8").split("\n").filter(Boolean).reduce((s, l) => s + (JSON.parse(l).totalCostUsd ?? 0), 0) : 0;
export const spentBoth = () => spentOf(SUITE_RECORDS) + spentOf(CORPUS_RECORDS);

export async function makeClient(evalMod, env, judgeModel) {
  const require = createRequire(`${REPO}/scripts/eval-answer-quality.mjs`);
  const { default: OpenAI } = await import(pathToFileURL(require.resolve("openai")).href);
  const client = new OpenAI(evalMod.openAiClientOptions(env));
  const { missing } = await evalMod.checkModelAccess({ client, modelIds: [MODEL, judgeModel] });
  if (missing.length) throw new Error(`no access to ${missing.join(", ")}`);
  return client;
}

export async function answerOnce(client, exp, promptText) {
  const startedAt = Date.now();
  let response;
  let lastError;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      response = await client.responses.create({ model: MODEL, input: promptText });
      break;
    } catch (error) {
      lastError = error;
    }
  }
  const latencyMs = Date.now() - startedAt;
  if (!response) throw Object.assign(new Error(`answer call failed: ${lastError?.message}`), { provider: true });
  if (response.model !== MODEL) throw new Error(`HONESTY: provider reported model ${response.model}, expected ${MODEL}`);
  const usage = exp.readUsage(response);
  if (usage.reportedEffort !== EXPECTED_EFFORT) throw new Error(`HONESTY: provider reported effort ${usage.reportedEffort}, expected ${EXPECTED_EFFORT}`);
  const answerText = response.output_text?.trim() ?? "";
  if (!answerText) throw Object.assign(new Error("empty answer"), { provider: true });
  return { answerText, latencyMs, reportedModel: response.model, usage };
}

export async function runQueue(queue, concurrency, runOne) {
  const state = { aborted: null, stoppedForCap: false };
  async function worker() {
    while (queue.length && !state.aborted && !state.stoppedForCap) {
      try {
        await runOne(queue.shift(), state);
      } catch (error) {
        if (error.provider) console.log(`provider error, not recorded -- ${error.message}`);
        else state.aborted = error;
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  return state;
}
