import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { compareSnapshot, computeSnapshot, deriveTags, sha256 } from "./gold-cases.mjs";
import { isGradable, selectCases } from "./answer-quality-run.mjs";
import { applyVerdicts, parseBatch, pendingCases, renderBatches, sortForReview } from "./rules-review.mjs";
import { applyCommand, renderCommand } from "../rules-review.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const ZERO = "0".repeat(64);
const GOYF = "45900b2f-f6a9-4c42-9642-008f3c1cf6dd";

// In-memory committed data, so no test reads the 2 MB rule index.
function makeSources(overrides = {}) {
  const data = {
    rules: { "702.19b": "702.19b Trample text.", "702.19c": "702.19c Trample over planeswalkers.", "701.2": "701.2 Activate.", "510.1c": "510.1c Damage assignment." },
    oracle: { [GOYF]: "Tarmogoyf's power is equal to the number of card types." },
    rulings: { [GOYF]: [{ publishedAt: "2021-03-19", comment: "Counts card types, not cards." }] },
    ...overrides
  };
  return {
    ruleIndexHash: sha256("index"),
    ruleText: (ruleId) => data.rules[ruleId] ?? null,
    oracleText: (oracleId) => data.oracle[oracleId] ?? null,
    rulings: (oracleId) => data.rulings[oracleId] ?? []
  };
}

function rawCase(id, overrides = {}) {
  return {
    id,
    formatVersion: 2,
    tier: 1,
    review: { status: "draft", reviewedOn: null },
    cards: [],
    gameState: null,
    question: `Question ${id}?`,
    expected: { outcome: "works", shortAnswer: `Short ${id}.`, answer: `Reference answer ${id}.`, decidingRuleIds: ["510.1c"] },
    source: { authority: "wotc-comprehensive-rules", publisher: "Wizards of the Coast", license: "WotC Fan Content Policy.", ruleId: "510.1c" },
    layers: { requiredFacts: [], irrelevantFacts: [], variants: [] },
    snapshot: { ruleIndexHash: ZERO, dependsOnHashes: { rules: ZERO, oracle: ZERO, rulings: ZERO } },
    whyHard: `Why ${id} is hard.`,
    ...overrides
  };
}

/** A case whose snapshot is exactly what the given sources say (an approved, current case). */
function authored(id, sources, overrides = {}) {
  const raw = rawCase(id, overrides);
  return { ...raw, snapshot: computeSnapshot(raw, sources) };
}

/** What the loader hands every reader: the raw case plus derived tags. */
function loaded(raw) {
  return { ...raw, tags: deriveTags(raw) };
}

function makeCasesDir(cases) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "rules-review-"));
  test.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  for (const raw of cases) fs.writeFileSync(path.join(dir, `${raw.id}.case.json`), `${JSON.stringify(raw, null, 2)}\n`, "utf8");
  return dir;
}

function readCase(dir, id) {
  return JSON.parse(fs.readFileSync(path.join(dir, `${id}.case.json`), "utf8"));
}

/** Fills a rendered batch's verdict and note slots for the given case ids. */
function fill(markdown, verdicts) {
  const lines = markdown.split("\n");
  let current = null;
  return lines
    .map((line) => {
      const match = /^<!-- rules-review:case (\{.*\}) -->$/.exec(line);
      if (match) current = JSON.parse(match[1]).id;
      if (current && verdicts[current]) {
        if (line.startsWith(">>> Verdict:")) return `>>> Verdict: ${verdicts[current].verdict}`;
        if (line.startsWith(">>> Note:")) return `>>> Note: ${verdicts[current].note ?? ""}`;
      }
      return line;
    })
    .join("\n");
}

const silent = () => {};

test("pending means every draft, every approved case the stale comparison flags (with what changed), and needs-edit only on request; rejected never", () => {
  const sources = makeSources();
  const staleSources = makeSources({ rules: { "510.1c": "510.1c Damage assignment, reworded." } });
  const cases = [
    loaded(rawCase("draft-case")),
    loaded(authored("approved-fresh", staleSources, { review: { status: "approved", reviewedOn: "2026-10-06" } })),
    loaded(authored("approved-stale", sources, { review: { status: "approved", reviewedOn: "2026-10-06" } })),
    loaded(rawCase("edit-case", { review: { status: "needs-edit", reviewedOn: "2026-10-06", note: "rework" } })),
    loaded(rawCase("rejected-case", { review: { status: "rejected", reviewedOn: "2026-10-06" } }))
  ];

  const pending = pendingCases({ cases, sources: staleSources });
  assert.deepEqual(pending.map(({ caseEntry }) => caseEntry.id), ["draft-case", "approved-stale"]);
  assert.deepEqual(pending[1].stale, { stale: true, changed: ["rules"] });

  const withEdits = pendingCases({ cases, sources: staleSources, includeNeedsEdit: true });
  assert.deepEqual(withEdits.map(({ caseEntry }) => caseEntry.id), ["draft-case", "approved-stale", "edit-case"]);
});

test("batches group cases by mechanic, then rules section, then id, with a case that names no mechanic last, in batches of the chosen size", () => {
  const sources = makeSources();
  const mk = (id, ruleIds) => loaded(rawCase(id, { expected: { ...rawCase(id).expected, decidingRuleIds: ruleIds } }));
  const cases = [
    mk("zz-none-510", ["510.1c"]),
    mk("b-trample-c", ["702.19c"]),
    mk("a-trample-b", ["702.19b"]),
    mk("activate", ["701.2"]),
    mk("aa-none-510", ["510.1c"])
  ];

  const ordered = sortForReview(pendingCases({ cases, sources })).map(({ caseEntry }) => caseEntry.id);
  assert.deepEqual(ordered, ["activate", "a-trample-b", "b-trample-c", "aa-none-510", "zz-none-510"]);

  const batches = renderBatches({ cases, sources, batchSize: 2, renderedOn: "2026-10-06" });
  assert.deepEqual(batches.map((batch) => batch.name), ["batch-001.md", "batch-002.md", "batch-003.md"]);
  assert.deepEqual(batches.map((batch) => batch.caseIds), [["activate", "a-trample-b"], ["b-trample-c", "aa-none-510"], ["zz-none-510"]]);
  assert.match(batches[0].markdown, /batch 001 of 3/);
  assert.throws(() => renderBatches({ cases, sources, batchSize: 0 }), /--batch-size/);
  assert.deepEqual(renderBatches({ cases: [], sources }), []);
});

test("a rendered entry shows the question, each card's oracle text, the answer verbatim, the rules, the citation and the verdict slots", () => {
  const sources = makeSources();
  const tier2 = loaded(
    rawCase("goyf", {
      tier: 2,
      cards: [{ oracleId: GOYF, name: "Tarmogoyf" }],
      source: { authority: "wotc-card-ruling", publisher: "WotC", license: "x", cardName: "Tarmogoyf", oracleId: GOYF, rulingDate: "2021-03-19" }
    })
  );
  const tier3 = loaded(
    rawCase("derived", {
      tier: 3,
      source: { authority: "owner-approved-derived", publisher: "Owner", license: "x", citation: "CR 514.1, 514.2", research: ["a link used only for discovery"] }
    })
  );
  const [batch] = renderBatches({ cases: [tier2, tier3], sources });

  assert.match(batch.markdown, /> Question goyf\?/);
  assert.match(batch.markdown, /Tarmogoyf \(oracle text\):\n> Tarmogoyf's power is equal/);
  assert.match(batch.markdown, /Reference answer, verbatim:\n> Reference answer goyf\./);
  assert.match(batch.markdown, /Short answer: Short goyf\./);
  assert.match(batch.markdown, /Deciding rule ids: 510\.1c/);
  assert.match(batch.markdown, /Rule 510\.1c \(committed text\):\n> 510\.1c Damage assignment\./);
  assert.match(batch.markdown, /Citation: Tarmogoyf \(45900b2f[^)]*\), ruling dated 2021-03-19/);
  assert.match(batch.markdown, /Citation: CR 514\.1, 514\.2\nResearch \(discovery only, never the answer\):\n- a link used only for discovery/);
  assert.equal((batch.markdown.match(/^>>> Verdict: $/gm) ?? []).length, 2);
  assert.equal((batch.markdown.match(/^>>> Note: $/gm) ?? []).length, 2);
});

test("round trip: render a batch, fill verdicts, apply; only review.* changes, plus snapshot on an approve", async () => {
  const sources = makeSources();
  const originals = [rawCase("to-approve"), rawCase("to-reject"), rawCase("to-edit"), rawCase("to-skip")];
  const casesDir = makeCasesDir(originals);
  const outDir = path.join(casesDir, "out");
  const loadCases = async () => originals.map(loaded);

  const written = await renderCommand({ argv: ["--out", outDir], casesDir, loadCases, loadSources: async () => sources, log: silent, now: () => "2026-10-07" });
  assert.equal(written.length, 1);
  const filled = fill(fs.readFileSync(written[0], "utf8"), {
    "to-approve": { verdict: "approve", note: "reads right" },
    "to-reject": { verdict: "reject", note: "not a real interaction" },
    "to-edit": { verdict: "edit", note: "name the second card" }
  });
  fs.writeFileSync(written[0], filled, "utf8");

  const result = await applyCommand({ argv: [written[0]], casesDir, loadSources: async () => sources, log: silent, now: () => "2026-10-08" });
  assert.deepEqual(result.refused, []);
  assert.deepEqual(result.skipped, ["to-skip"]);

  const strip = (raw) => Object.fromEntries(Object.entries(raw).filter(([key]) => key !== "review" && key !== "snapshot"));
  for (const original of originals) assert.deepEqual(strip(readCase(casesDir, original.id)), strip(original), `${original.id}: nothing outside review and snapshot changes`);

  const approved = readCase(casesDir, "to-approve");
  assert.deepEqual(approved.review, { status: "approved", reviewedOn: "2026-10-08", note: "reads right" });
  assert.deepEqual(approved.snapshot, computeSnapshot(approved, sources), "an approve re-records the snapshot from the committed data");
  assert.deepEqual(readCase(casesDir, "to-reject").review, { status: "rejected", reviewedOn: "2026-10-08", note: "not a real interaction" });
  assert.deepEqual(readCase(casesDir, "to-reject").snapshot, originals[1].snapshot, "only an approve rewrites snapshot");
  assert.deepEqual(readCase(casesDir, "to-edit").review, { status: "needs-edit", reviewedOn: "2026-10-08", note: "name the second card" });
  assert.deepEqual(readCase(casesDir, "to-skip"), originals[3], "a blank verdict leaves the file untouched");
});

test("stale path: a stale approved case renders marked stale with the changed text; approving re-records its hashes, and the live runner's filter selects it again", async () => {
  const before = makeSources();
  const after = makeSources({ rulings: { [GOYF]: [{ publishedAt: "2021-03-19", comment: "Counts card types, not cards." }, { publishedAt: "2026-10-01", comment: "A brand new ruling." }] } });
  const approvedRaw = authored("goyf-case", before, {
    tier: 2,
    cards: [{ oracleId: GOYF, name: "Tarmogoyf" }],
    source: { authority: "wotc-card-ruling", publisher: "WotC", license: "x", cardName: "Tarmogoyf", oracleId: GOYF, rulingDate: "2021-03-19" },
    review: { status: "approved", reviewedOn: "2026-10-06" }
  });
  const casesDir = makeCasesDir([approvedRaw]);
  const outDir = path.join(casesDir, "out");
  const loadCases = async () => [loaded(readCase(casesDir, "goyf-case"))];
  const isStale = (caseEntry) => compareSnapshot(caseEntry, after).stale;

  // Stale: out of the live runner's reach.
  assert.equal(isGradable(loaded(approvedRaw), isStale), false);
  assert.deepEqual(selectCases({ cases: [loaded(approvedRaw)], records: [], models: ["gpt-4.1"], excerptCaps: [10], mode: { kind: "changed" }, isStale }).selected, []);

  const [file] = await renderCommand({ argv: ["--out", outDir], casesDir, loadCases, loadSources: async () => after, log: silent });
  const markdown = fs.readFileSync(file, "utf8");
  assert.match(markdown, /STALE: this case was approved against committed text that has since changed \(rulings\)/);
  assert.match(markdown, /Changed rulings text:\nTarmogoyf\n> - 2021-03-19: Counts card types, not cards\.\n> - 2026-10-01: A brand new ruling\./);

  fs.writeFileSync(file, fill(markdown, { "goyf-case": { verdict: "approve" } }), "utf8");
  const result = await applyCommand({ argv: [file], casesDir, loadSources: async () => after, log: silent, now: () => "2026-10-09" });
  assert.deepEqual(result.refused, []);

  const reapproved = loaded(readCase(casesDir, "goyf-case"));
  assert.deepEqual(compareSnapshot(reapproved, after), { stale: false, changed: [] });
  assert.equal(reapproved.review.reviewedOn, "2026-10-09");
  assert.equal(isGradable(reapproved, isStale), true);
  const selection = selectCases({ cases: [reapproved], records: [], models: ["gpt-4.1"], excerptCaps: [10], mode: { kind: "changed" }, isStale });
  assert.deepEqual(selection.selected.map(({ caseEntry }) => caseEntry.id), ["goyf-case"], "the runner's filter selects the case again");
});

function entryFor(raw, sources, verdict, note = "") {
  const [batch] = renderBatches({ cases: [loaded(raw)], sources });
  const { entries } = parseBatch(fill(batch.markdown, { [raw.id]: { verdict, note } }));
  return entries[0];
}

function applyOne({ raw, entry, rawNow = raw, sources }) {
  return applyVerdicts({
    entries: [entry],
    rawByCaseId: new Map([[rawNow.id, { fileName: `${rawNow.id}.case.json`, case: rawNow }]]),
    sources,
    reviewedOn: "2026-10-09"
  });
}

test("each refusal is reported and leaves the case untouched: unknown id, question changed, answer changed, committed rule, oracle or ruling text changed, an edit with no note, an unknown verdict", () => {
  const sources = makeSources();
  const raw = rawCase("subject", {
    tier: 2,
    cards: [{ oracleId: GOYF, name: "Tarmogoyf" }],
    source: { authority: "wotc-card-ruling", publisher: "WotC", license: "x", cardName: "Tarmogoyf", oracleId: GOYF, rulingDate: "2021-03-19" }
  });
  const approve = entryFor(raw, sources, "approve");

  // A clean apply works, so every refusal below is down to the one thing changed.
  assert.equal(applyOne({ raw, entry: approve, sources }).updated.length, 1);

  const unknown = applyVerdicts({ entries: [approve], rawByCaseId: new Map(), sources, reviewedOn: "2026-10-09" });
  assert.deepEqual(unknown.refused, [{ id: "subject", reason: "no case with this id exists" }]);

  const questionChanged = applyOne({ raw, entry: approve, rawNow: { ...raw, question: "A different question?" }, sources });
  assert.match(questionChanged.refused[0].reason, /question changed since this batch was rendered/);

  const answerChanged = applyOne({ raw, entry: approve, rawNow: { ...raw, expected: { ...raw.expected, answer: "A reworked answer." } }, sources });
  assert.match(answerChanged.refused[0].reason, /reference answer changed since this batch was rendered/);

  const ruleChanged = applyOne({ raw, entry: approve, sources: makeSources({ rules: { "510.1c": "510.1c Reworded." } }) });
  assert.match(ruleChanged.refused[0].reason, /committed rules text changed since this batch was rendered/);

  const oracleChanged = applyOne({ raw, entry: approve, sources: makeSources({ oracle: { [GOYF]: "Errata'd oracle text." } }) });
  assert.match(oracleChanged.refused[0].reason, /committed oracle text changed since this batch was rendered/);

  const rulingChanged = applyOne({ raw, entry: approve, sources: makeSources({ rulings: { [GOYF]: [{ publishedAt: "2026-01-01", comment: "New." }] } }) });
  assert.match(rulingChanged.refused[0].reason, /committed rulings text changed since this batch was rendered/);

  const noNote = applyOne({ raw, entry: entryFor(raw, sources, "edit", ""), sources });
  assert.match(noNote.refused[0].reason, /edit verdict needs a note/);

  const badVerdict = applyOne({ raw, entry: entryFor(raw, sources, "maybe"), sources });
  assert.match(badVerdict.refused[0].reason, /"maybe" is not a verdict/);

  for (const result of [unknown, questionChanged, answerChanged, ruleChanged, oracleChanged, rulingChanged, noNote, badVerdict]) {
    assert.deepEqual(result.updated, [], "a refused case is never written");
  }
});

test("an edit verdict never rewrites a tier-1 or tier-2 reference answer: only review.* changes, the case lands in needs-edit with the note", () => {
  const sources = makeSources();
  for (const tier of [1, 2]) {
    const raw = rawCase(`tier-${tier}`, {
      tier,
      ...(tier === 2
        ? { cards: [{ oracleId: GOYF, name: "Tarmogoyf" }], source: { authority: "wotc-card-ruling", publisher: "WotC", license: "x", cardName: "Tarmogoyf", oracleId: GOYF, rulingDate: "2021-03-19" } }
        : {})
    });
    const { updated } = applyOne({ raw, entry: entryFor(raw, sources, "edit", "swap in the official example"), sources });
    assert.equal(updated.length, 1);
    const next = updated[0].case;
    assert.deepEqual(next.expected, raw.expected, "the official reference answer is untouched");
    assert.equal(next.question, raw.question);
    assert.deepEqual(next.cards, raw.cards);
    assert.deepEqual(next.snapshot, raw.snapshot, "an edit never re-records the snapshot");
    assert.equal(next.review.status, "needs-edit");
    assert.equal(next.review.note, "swap in the official example");
    assert.notEqual(next.review.status, "approved");
  }
});

test("apply refuses a batch file whose shape is wrong and names the problem; render says so when nothing is pending", async () => {
  const { entries, problems } = parseBatch(
    ['<!-- rules-review:case {"id":"x","question":"q","answer":"a","rules":"r","oracle":"o","rulings":"g"} -->', "no verdict line here"].join("\n")
  );
  assert.equal(entries.length, 1);
  assert.match(problems[0], /x: the batch has no ">>> Verdict:" line/);
  assert.match(parseBatch("<!-- rules-review:case {not json} -->").problems[0], /fingerprint line could not be read/);

  const logs = [];
  const none = await renderCommand({
    argv: [],
    casesDir: "/unused",
    loadCases: async () => [loaded(authored("fresh", makeSources(), { review: { status: "approved", reviewedOn: "2026-10-06" } }))],
    loadSources: async () => makeSources(),
    log: (line) => logs.push(line)
  });
  assert.deepEqual(none, []);
  assert.match(logs[0], /Nothing is pending/);

  await assert.rejects(() => applyCommand({ argv: [], casesDir: "/unused", loadSources: async () => makeSources() }), /Name the filled batch file/);
});

test("output/rules-review/ is gitignored, and the two commands are registered, never wired into a gate script", () => {
  const output = execFileSync("git", ["check-ignore", "-v", "output/rules-review/batch-001.md"], { cwd: repoRoot, encoding: "utf8" });
  assert.match(output, /\.gitignore/);

  const pkg = JSON.parse(fs.readFileSync(path.join(repoRoot, "package.json"), "utf8"));
  assert.equal(pkg.scripts["eval:rules-review:render"], "node scripts/rules-review.mjs render");
  assert.equal(pkg.scripts["eval:rules-review:apply"], "node scripts/rules-review.mjs apply");
  for (const gate of ["quality:check", "coverage:check", "test", "test:scripts"]) {
    assert.ok(!pkg.scripts[gate].includes("rules-review"), `${gate} must not run the review commands`);
  }
});
