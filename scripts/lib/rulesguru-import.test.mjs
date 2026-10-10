import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { classifyResponse, importQuestions, buildSettings } from "./rulesguru-import.mjs";

// Invented questions in the API's field shape. Nothing here is real suite content.
function invented(id, extra = {}) {
  return {
    id,
    level: 1,
    complexity: "simple",
    tags: ["Invented tag"],
    includedCards: [],
    questionSimple: `Invented question number ${id}?`,
    answerSimple: `Invented answer number ${id}.`,
    answerSimpleCited: "Invented answer.",
    citedRules: {},
    url: `https://example.invalid/q/${id}`,
    ...extra
  };
}

function tempSuite() {
  const dir = mkdtempSync(join(tmpdir(), "import-suite-"));
  test.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

function json(body, status = 200) {
  return { status, text: async () => (typeof body === "string" ? body : JSON.stringify(body)) };
}

/**
 * A fake world: a clock, a sleep that advances it, and a fetch that records when each request started
 * and finished. `respond(call)` returns the answer for one request.
 */
function world(respond, { latencyMs = 500 } = {}) {
  let clock = 1_000_000;
  const calls = [];
  return {
    calls,
    now: () => clock,
    sleep: async (ms) => {
      clock += ms;
    },
    fetch: async (url) => {
      const settings = JSON.parse(decodeURIComponent(new URL(url).searchParams.get("json")));
      const call = { url, settings, startedAt: clock, finishedAt: 0 };
      calls.push(call);
      clock += latencyMs;
      call.finishedAt = clock;
      const answer = respond(call, calls.length);
      if (answer instanceof Error) throw answer;
      return answer;
    }
  };
}

const MALFORMED = () => json("Incorrectly formatted json.", 400);
const questionsAfter = (previousId, count, last = 1000) =>
  Array.from({ length: Math.min(count, Math.max(0, last - previousId)) }, (_, i) => invented(previousId + 1 + i));

test("the first request starts at previousId 1 and names TheJudge; settings cover every level and complexity", async () => {
  const suiteDir = tempSuite();
  const w = world(() => json([]));
  const counts = await importQuestions({ ...w, suiteDir });
  assert.equal(w.calls[0].settings.previousId, 1);
  assert.equal(w.calls[0].settings.count, 50);
  assert.match(w.calls[0].settings.from, /TheJudge/);
  assert.equal(w.calls[0].settings.legality, "all");
  assert.deepEqual(w.calls[0].settings.tags, []);
  assert.deepEqual(buildSettings({ previousId: 7, count: 3 }), {
    previousId: 7,
    count: 3,
    level: ["0", "1", "2", "3", "Corner Case"],
    complexity: ["Simple", "Intermediate", "Complicated"],
    legality: "all",
    tags: [],
    tagsConjunc: "NOT",
    from: "TheJudge"
  });
  assert.equal(counts.stopReason, "end");
});

test("a wrapped batch (highest id not above the cursor) ends the import as complete without overwriting", async () => {
  const suiteDir = tempSuite();
  mkdirSync(join(suiteDir, "raw"), { recursive: true });
  writeFileSync(join(suiteDir, "raw", "1.json"), '{"id":1,"frozen":"original"}\n');
  writeFileSync(join(suiteDir, "import-state.json"), JSON.stringify({ lastSavedId: 9, cursor: 9, skippedIds: [], batchSizeHistory: [] }));
  const w = world(() => json([invented(1), invented(2), invented(3)]));
  const counts = await importQuestions({ ...w, suiteDir });
  assert.equal(counts.stopReason, "end");
  assert.equal(counts.saved, 0);
  assert.equal(w.calls.length, 1);
  assert.equal(JSON.parse(readFileSync(join(suiteDir, "raw", "1.json"), "utf8")).frozen, "original");
  assert.deepEqual(readdirSync(join(suiteDir, "raw")), ["1.json"]);
  const state = JSON.parse(readFileSync(join(suiteDir, "import-state.json"), "utf8"));
  assert.equal(state.complete, true);
  assert.equal(state.lastSavedId, 9);
});

test("a mixed batch saves the new ids, advances the cursor, then the wrap ends the import", async () => {
  const suiteDir = tempSuite();
  const w = world((call) => json(call.settings.previousId === 1 ? [invented(2), invented(3), invented(1), invented(2)] : [invented(1), invented(2)]));
  const counts = await importQuestions({ ...w, suiteDir });
  assert.equal(counts.saved, 2);
  assert.equal(counts.stopReason, "end");
  assert.deepEqual(readdirSync(join(suiteDir, "raw")).sort(), ["2.json", "3.json"]);
  assert.equal(w.calls[1].settings.previousId, 3);
  const state = JSON.parse(readFileSync(join(suiteDir, "import-state.json"), "utf8"));
  assert.equal(state.lastSavedId, 3);
  assert.equal(state.complete, true);
});

test("no request starts less than 3 seconds after the previous one finished", async () => {
  const suiteDir = tempSuite();
  const w = world((call) => json(questionsAfter(call.settings.previousId, call.settings.count, 120)), { latencyMs: 700 });
  await importQuestions({ ...w, suiteDir });
  assert.ok(w.calls.length >= 3);
  for (let i = 1; i < w.calls.length; i++) {
    assert.ok(w.calls[i].startedAt - w.calls[i - 1].finishedAt >= 3000, `request ${i} waited at least 3000 ms`);
  }
});

test("a malformed answer halves the size 50, 25, 12, 6, 3, 1 at the same previousId", async () => {
  const suiteDir = tempSuite();
  const w = world((call) => (call.settings.count > 1 ? MALFORMED() : json([])));
  await importQuestions({ ...w, suiteDir });
  assert.deepEqual(
    w.calls.map((call) => call.settings.count),
    [50, 25, 12, 6, 3, 1]
  );
  assert.ok(w.calls.every((call) => call.settings.previousId === 1));
});

test("a failing one-question request records a skip and advances one id", async () => {
  const suiteDir = tempSuite();
  const w = world((call) => {
    if (call.settings.previousId === 1) return MALFORMED();
    return call.settings.previousId === 2 ? json([]) : MALFORMED();
  });
  const counts = await importQuestions({ ...w, suiteDir });
  assert.equal(counts.skipped, 1);
  const last = w.calls.at(-1);
  assert.equal(last.settings.previousId, 2);
  assert.equal(last.settings.count, 1);
  const state = JSON.parse(readFileSync(join(suiteDir, "import-state.json"), "utf8"));
  assert.deepEqual(state.skippedIds, [1]);
});

test("the size doubles back toward 50 after five successful batches in a row", async () => {
  const suiteDir = tempSuite();
  let failedOnce = false;
  const w = world((call) => {
    if (!failedOnce) {
      failedOnce = true;
      return MALFORMED();
    }
    return json(questionsAfter(call.settings.previousId, call.settings.count, 400));
  });
  await importQuestions({ ...w, suiteDir });
  const sizes = w.calls.map((call) => call.settings.count);
  assert.deepEqual(sizes.slice(0, 7), [50, 25, 25, 25, 25, 25, 50]);
});

test("a frozen file is never overwritten, and state is rewritten after each batch", async () => {
  const suiteDir = tempSuite();
  mkdirSync(join(suiteDir, "raw"), { recursive: true });
  writeFileSync(join(suiteDir, "raw", "2.json"), '{"id":2,"frozen":"original"}\n');
  const w = world((call) => json(questionsAfter(call.settings.previousId, call.settings.count, 4).map((q) => ({ ...q, rolled: "different" }))));
  const counts = await importQuestions({ ...w, suiteDir });
  assert.equal(JSON.parse(readFileSync(join(suiteDir, "raw", "2.json"), "utf8")).frozen, "original");
  assert.equal(JSON.parse(readFileSync(join(suiteDir, "raw", "3.json"), "utf8")).rolled, "different");
  assert.equal(counts.alreadyFrozen, 1);
  assert.equal(counts.saved, 2);
  assert.deepEqual(readdirSync(join(suiteDir, "raw")).sort(), ["2.json", "3.json", "4.json"]);
  const state = JSON.parse(readFileSync(join(suiteDir, "import-state.json"), "utf8"));
  assert.equal(state.lastSavedId, 4);
});

test("a new run resumes after the saved id", async () => {
  const suiteDir = tempSuite();
  writeFileSync(join(suiteDir, "import-state.json"), JSON.stringify({ lastSavedId: 77, skippedIds: [], batchSizeHistory: [] }));
  const w = world(() => json([]));
  await importQuestions({ ...w, suiteDir });
  assert.equal(w.calls[0].settings.previousId, 77);
});

test("state is saved after every batch, so a stop mid-way loses nothing", async () => {
  const suiteDir = tempSuite();
  let seen = null;
  const w = world((call, n) => {
    if (n === 3) {
      seen = JSON.parse(readFileSync(join(suiteDir, "import-state.json"), "utf8")).lastSavedId;
      return json([]);
    }
    return json(questionsAfter(call.settings.previousId, 10, 1000));
  });
  await importQuestions({ ...w, suiteDir });
  assert.equal(seen, 21, "after two batches of ten from id 1");
});

test("a network error stops cleanly with state saved", async () => {
  const suiteDir = tempSuite();
  const w = world((call, n) => (n === 2 ? new Error("socket hang up") : json(questionsAfter(call.settings.previousId, 5, 1000))));
  const counts = await importQuestions({ ...w, suiteDir });
  assert.equal(counts.stopReason, "network-error");
  assert.equal(counts.saved, 5);
  assert.equal(JSON.parse(readFileSync(join(suiteDir, "import-state.json"), "utf8")).lastSavedId, 6);
});

test("ten failed requests in a row stop cleanly", async () => {
  const suiteDir = tempSuite();
  const w = world(() => json("<html>server error</html>", 500));
  const counts = await importQuestions({ ...w, suiteDir });
  assert.equal(counts.stopReason, "too-many-failures");
  assert.equal(w.calls.length, 10);
  assert.ok(existsSync(join(suiteDir, "import-state.json")));
});

test("a rate-limit answer waits once for 30 seconds, then stops if it repeats", async () => {
  const suiteDir = tempSuite();
  const limited = () => json("Please don't send more than one request every 2 seconds.", 429);
  const w = world(limited);
  const counts = await importQuestions({ ...w, suiteDir });
  assert.equal(counts.stopReason, "rate-limited");
  assert.equal(w.calls.length, 2);
  assert.ok(w.calls[1].startedAt - w.calls[0].finishedAt >= 30000);

  const recover = world((call, n) => (n === 1 ? limited() : json(call.settings.previousId === 1 ? [invented(2)] : [])));
  const counts2 = await importQuestions({ ...recover, suiteDir: tempSuite() });
  assert.equal(counts2.stopReason, "end");
  assert.equal(counts2.saved, 1);
});

test("an empty batch ends cleanly and the printed result is counts only", async () => {
  const suiteDir = tempSuite();
  const w = world((call) => json(call.settings.previousId === 1 ? [invented(5), invented(6)] : []));
  const counts = await importQuestions({ ...w, suiteDir });
  assert.deepEqual(Object.keys(counts).sort(), ["alreadyFrozen", "requests", "saved", "skipped", "stopReason"]);
  assert.equal(counts.stopReason, "end");
  assert.ok(Object.values(counts).every((value) => typeof value === "number" || typeof value === "string"));
});

test("fetch and the clock are required", async () => {
  await assert.rejects(() => importQuestions({ suiteDir: tempSuite(), now: () => 0, sleep: async () => {} }), /injected fetch/);
  await assert.rejects(() => importQuestions({ suiteDir: tempSuite(), fetch: async () => json([]) }), /injected clock/);
});

test("classifyResponse sorts API answers", () => {
  assert.equal(classifyResponse(200, "[]").kind, "empty");
  assert.equal(classifyResponse(200, JSON.stringify({ questions: [invented(3)] })).kind, "ok");
  assert.equal(classifyResponse(200, JSON.stringify({ data: [invented(3)] })).kind, "ok");
  assert.equal(classifyResponse(200, JSON.stringify({ data: [invented(3)] })).questions.length, 1);
  assert.equal(classifyResponse(200, JSON.stringify([{ nope: true }])).kind, "failed");
  assert.equal(classifyResponse(400, "Incorrectly formatted json.").kind, "malformed");
  assert.equal(classifyResponse(429, "slow down").kind, "rate-limited");
  assert.equal(classifyResponse(500, "x").kind, "failed");
});
