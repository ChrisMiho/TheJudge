// Polite, resumable, freeze-on-import fetcher for the local practice suite
// (REQ-232). Used with permission, local only.
//
// The only code in the repo that contacts the outside site, and only the
// owner's hand runs it (scripts/rulesguru-import.mjs). `fetch`, the clock and
// the sleep are required parameters of importQuestions(): the entry point
// passes Node's global `fetch`; every test injects a fake. Nothing here knows
// the suite folder's path -- the caller passes `suiteDir`.
//
// Behaviour (REQ-232): sequential requests, each starting no sooner than 3 s
// after the previous one finished; a batch starts at 50 questions and halves
// on a malformed-batch answer (50, 25, 12, 6, 3, 1); a failing one-question
// request records a skip and steps past one id; five successful batches in a
// row double the size back toward 50. Each question is written whole to
// raw/<id>.json exactly as returned and never overwritten. Progress is saved
// to import-state.json after every saved batch, and a new run resumes from
// the larger of the saved last id and 1. It stops cleanly, progress saved, on
// a network error, on a rate-limit answer that repeats after one 30 s wait,
// after 10 failed requests in a row, and at the end (an empty batch, or a batch
// whose highest id is not above the cursor -- the API wraps to id 1 past the
// last question).

import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";

export const API_URL = "https://rulesguru.org/api/questions/";
export const FROM_NAME = "TheJudge";
export const START_BATCH_SIZE = 50;
export const MIN_GAP_MS = 3000;
export const RATE_LIMIT_WAIT_MS = 30000;
export const MAX_CONSECUTIVE_FAILURES = 10;
export const GROW_AFTER_SUCCESSES = 5;
export const STATE_FILE = "import-state.json";

/** Request settings: every level, every complexity, legality all, no tag filter, `from` naming TheJudge. */
export function buildSettings({ previousId, count, from = FROM_NAME }) {
  return {
    previousId,
    count,
    level: ["0", "1", "2", "3", "Corner Case"],
    complexity: ["Simple", "Intermediate", "Complicated"],
    legality: "all",
    tags: [],
    tagsConjunc: "NOT",
    from
  };
}

export function buildRequestUrl(settings, baseUrl = API_URL) {
  return `${baseUrl}?json=${encodeURIComponent(JSON.stringify(settings))}`;
}

/** Classifies one API answer. Returns { kind: "ok" | "empty" | "malformed" | "rate-limited" | "failed", questions? }. */
export function classifyResponse(status, bodyText) {
  const text = String(bodyText ?? "");
  if (status === 429 || /don'?t send more than one request/i.test(text)) return { kind: "rate-limited" };
  if (/incorrectly formatted json/i.test(text)) return { kind: "malformed" };
  if (status < 200 || status >= 300) return { kind: "failed" };
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { kind: "failed" };
  }
  const questions = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed?.questions)
      ? parsed.questions
      : Array.isArray(parsed?.data)
        ? parsed.data
        : null;
  if (questions === null) return { kind: "failed" };
  if (questions.length === 0) return { kind: "empty" };
  const idOk = (question) => question !== null && typeof question === "object" && /^\d+$/.test(String(question.id));
  if (!questions.every(idOk)) return { kind: "failed" };
  return { kind: "ok", questions };
}

function emptyState() {
  return { lastSavedId: 0, cursor: 0, skippedIds: [], batchSizeHistory: [], complete: false };
}

async function readState(suiteDir) {
  try {
    return { ...emptyState(), ...JSON.parse(await readFile(join(suiteDir, STATE_FILE), "utf8")) };
  } catch (error) {
    if (error?.code === "ENOENT") return emptyState();
    throw error;
  }
}

async function writeWhole(path, text) {
  const temp = `${path}.tmp-${process.pid}`;
  await writeFile(temp, text, "utf8");
  await rename(temp, path);
}

async function exists(path) {
  try {
    await readFile(path);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

/**
 * Imports questions into `suiteDir`. Returns counts only:
 * `{ saved, skipped, alreadyFrozen, requests, stopReason }`, where stopReason is
 * `end`, `network-error`, `rate-limited` or `too-many-failures`.
 */
export async function importQuestions({
  fetch,
  now,
  sleep,
  suiteDir,
  from = FROM_NAME,
  baseUrl = API_URL,
  minGapMs = MIN_GAP_MS,
  rateLimitWaitMs = RATE_LIMIT_WAIT_MS,
  maxConsecutiveFailures = MAX_CONSECUTIVE_FAILURES
}) {
  if (typeof fetch !== "function") throw new Error("importQuestions needs an injected fetch");
  if (typeof now !== "function" || typeof sleep !== "function") throw new Error("importQuestions needs an injected clock (now, sleep)");

  const rawDir = join(suiteDir, "raw");
  await mkdir(rawDir, { recursive: true });
  const state = await readState(suiteDir);
  const counts = { saved: 0, skipped: 0, alreadyFrozen: 0, requests: 0, stopReason: "end" };

  let previousId = Math.max(state.lastSavedId, state.cursor, 1);
  let size = START_BATCH_SIZE;
  let successes = 0;
  let failures = 0;
  let lastFinished = null;

  const save = async () => writeWhole(join(suiteDir, STATE_FILE), `${JSON.stringify(state, null, 2)}\n`);
  const remember = (reason) => state.batchSizeHistory.push({ previousId, size, reason });

  // One request, honouring the 3 s gap. A network error is returned, not thrown.
  const request = async () => {
    if (lastFinished !== null) {
      const wait = lastFinished + minGapMs - now();
      if (wait > 0) await sleep(wait);
    }
    counts.requests += 1;
    try {
      const response = await fetch(buildRequestUrl(buildSettings({ previousId, count: size, from }), baseUrl));
      const result = classifyResponse(response.status, await response.text());
      lastFinished = now();
      return result;
    } catch {
      lastFinished = now();
      return { kind: "network-error" };
    }
  };

  for (;;) {
    let result = await request();
    if (result.kind === "rate-limited") {
      await sleep(rateLimitWaitMs);
      result = await request();
      if (result.kind === "rate-limited") {
        counts.stopReason = "rate-limited";
        break;
      }
    }
    if (result.kind === "network-error") {
      counts.stopReason = "network-error";
      break;
    }
    if (result.kind === "empty") {
      state.complete = true;
      counts.stopReason = "end";
      break;
    }
    if (result.kind === "ok") {
      let highest = previousId;
      for (const question of result.questions) {
        const id = String(question.id);
        // Every id is frozen if absent (id 1 only ever arrives in the wrap batch); only ids above the cursor move it.
        const target = join(rawDir, `${id}.json`);
        if (await exists(target)) {
          counts.alreadyFrozen += 1;
        } else {
          await writeWhole(target, `${JSON.stringify(question, null, 2)}\n`);
          counts.saved += 1;
        }
        if (Number(id) > previousId) highest = Math.max(highest, Number(id));
      }
      if (highest <= previousId) {
        // The API wraps back to the start past the last question: that is the end.
        state.complete = true;
        counts.stopReason = "end";
        break;
      } else {
        failures = 0;
        successes += 1;
        previousId = highest;
        state.lastSavedId = highest;
        state.cursor = highest;
        state.complete = false;
        if (successes >= GROW_AFTER_SUCCESSES && size < START_BATCH_SIZE) {
          size = Math.min(START_BATCH_SIZE, size * 2);
          successes = 0;
          remember("grew after five successes");
        }
        await save();
        continue;
      }
    }

    // A failed or malformed request.
    successes = 0;
    failures += 1;
    if (failures >= maxConsecutiveFailures) {
      await save();
      counts.stopReason = "too-many-failures";
      break;
    }
    if (result.kind === "malformed" && size > 1) {
      size = Math.max(1, Math.floor(size / 2));
      remember("halved after a malformed batch");
    } else if (result.kind === "malformed") {
      state.skippedIds.push(previousId);
      counts.skipped += 1;
      previousId += 1;
      state.cursor = previousId;
      remember("skipped one id after a failing one-question request");
      await save();
    }
  }

  await save();
  return counts;
}
