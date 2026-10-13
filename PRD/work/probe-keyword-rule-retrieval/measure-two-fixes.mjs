// Probe D (keyword-rule-retrieval, 2026-10-07): simulate the two fixes Probe C
// found, over the whole rules-test corpus and every suite, offline.
//
// Fix 1 — curated exclusion precision (REQ-179). Today System 3 skips every rule
//   whose id OR any parentRuleIds entry is a selected curated topic's rule number
//   (gameRulesRetrieval.ts scoreIndex, both branches), so a topic listing 603.2
//   also blocks 603.2a–h although its excerpt carries only 603.2's own sentence.
//     F1a  exact-only: exclude only the listed rule numbers
//     F1b  exclude exactly the rules whose text a selected topic's excerpt carries
//          (checked against every topic in gameRulesByTopic.json; identical to F1a
//          when no excerpt carries text beyond its ruleNumbers — asserted below)
//   Both modes (lookup and game) — production selects the topics, nothing here does.
//
// Fix 2 — stem expansion. When a System 3 pick's text ends with a colon (514.3
//   "…subject to the following exception:"), also put its lettered sub-rules in
//   the prompt.
//     F2a  fill: the sub-rules are printed beside the pick; System 3's ten picks unchanged
//     F2b  slot: the sub-rules are inserted after the stem and take slots; cap stays 10
//   F1+F2: both, on top of F1a.
//
// Patching, production code never edited:
//   F1 — each rule-index entry is copied with a `parentRuleIds` array whose `.some`
//        is overridden (iteration untouched). `.some` is called by exactly one line
//        of production retrieval: the REQ-179 exclusion test (gameRulesRetrieval.ts
//        lines 705 and 740); the parent-rule-id boost (computeIdBoost, scoreEntry)
//        iterates with for..of and is unaffected. The patched index is passed as
//        `gameRulesRuleIndex` to the real `evaluateRulesGate` / `preparePromptInput`.
//        A control wrapper whose `.some` delegates to the original is asserted
//        byte-identical to the unwrapped index on every case.
//   F2 — computed from the real System 3 picks: the expanded excerpt list is laid out
//        with the production `formatSupplementalRulesSection` and swapped into the
//        real prompt text in place of today's section (asserted to occur once); the
//        real `checkCards` / `checkStateFacts` then run on the new prompt. The rule
//        ratchet is the gate's own logic re-applied (asserted equal to the real
//        gate's result for base and F1 on every case).
//
// Offline: committed data, frozen query vectors; the local MiniLM embedder only for
// the tester's verbatim Necropotence question; no network, no model call.
// Run from the worktree (read only, nothing is written there):
//   cd /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-niche-interaction-rule-tests \
//     && npx tsx /Users/chrismiho/Coding/Projects/TheJudge/PRD/work/probe-keyword-rule-retrieval/measure-two-fixes.mjs
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = "/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-niche-interaction-rule-tests";
const PROBE = "/Users/chrismiho/Coding/Projects/TheJudge/PRD/work/probe-keyword-rule-retrieval";
const imp = (p) => import(pathToFileURL(`${ROOT}/${p}`).href);

const { buildCaseRequest, loadPromptResources, buildEmbedder } = await imp("scripts/lib/prompt-fidelity.mjs");
const { loadGoldCases } = await imp("scripts/lib/gold-cases.mjs");
const prep = await imp("apps/backend/src/prompt/preparation.ts");
const gr = await imp("apps/backend/src/gameRulesRetrieval.ts");
const { formatSupplementalRulesSection } = await imp("apps/backend/src/prompt/promptFormatting.ts");
const { ALWAYS_ON_TOPIC_IDS, selectGameRulesTopics, selectCardWordingTopicIds } = await imp("apps/backend/src/gameRulesTopicSelection.ts");
const { buildPromptContext } = await imp("apps/backend/src/prompt/context.ts");
const { buildPromptText } = await imp("apps/backend/src/prompt/promptAssembly.ts");
const { evaluateRulesGate, checkCards } = await imp("apps/backend/src/eval/rules-gate/rulesGate.ts");
const { checkStateFacts } = await imp("apps/backend/src/eval/rules-gate/stateFacts.ts");
const { loadBaseline } = await imp("apps/backend/src/eval/rules-gate/baseline.ts");
const { loadFrozenVectors, checkReFreeze } = await imp("apps/backend/src/eval/rules-gate/frozenVectors.ts");
const { askAiRequestSchema } = await imp("apps/backend/src/validation/askAiRequest.ts");
const harness = await imp("apps/backend/src/eval/contextEvaluationHarness.ts");
const { cardDetailIndexFromRequest } = await imp("apps/backend/src/eval/fixtureCardDetail.ts");
const bench = await imp("apps/backend/src/eval/ragRetrievalBenchmark.ts");

const out = [];
const log = (s = "") => { out.push(s); };
const say = (s = "") => { out.push(s); console.log(s); };

const resources = await loadPromptResources();
const index = resources.gameRulesRuleIndex;
const ruleById = new Map(index.map((r) => [r.ruleId, r]));
const cdi = resources.cardDetailIndex;
const topicsAll = resources.gameRulesTopics;
const cases = await loadGoldCases();
const live = cases.filter((c) => c.review.status !== "rejected");
const vectors = loadFrozenVectors();
const baseline = loadBaseline();
const CAP = prep.DEFAULT_SUPPLEMENTAL_RULE_CAP;

const collapse = (s) => (s ?? "").replace(/\s+/g, " ").trim();
const stripBleed = (s) => s.replace(/\n\n\n[\s\S]*$/, ""); // 4 index entries end with the next CR section's heading
function quantiles(values) {
  const s = [...values].sort((a, b) => a - b);
  const q = (p) => (s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : 0);
  return { n: s.length, min: s.length ? s[0] : 0, p50: q(0.5), p95: q(0.95), p99: q(0.99), max: s.length ? s[s.length - 1] : 0, mean: s.length ? Math.round(s.reduce((a, b) => a + b, 0) / s.length) : 0 };
}
const fmtQ = (q) => `n=${q.n} min ${q.min} | p50 ${q.p50} | p95 ${q.p95} | p99 ${q.p99} | max ${q.max} | mean ${q.mean}`;
const eqArr = (a, b) => JSON.stringify(a) === JSON.stringify(b);

say(`Probe D measure-two-fixes — code under test ${ROOT}`);
say(`rule index ${index.length} entries; curated topics ${topicsAll.length}; cases ${cases.length} (${live.length} non-rejected); System 3 cap ${CAP}; always-on topics ${ALWAYS_ON_TOPIC_IDS.join(", ")}`);

// ======================================================================= T  topic excerpt audit (decides F1a vs F1b)
say("\n==================== T  what each curated topic excerpt actually carries");
const carriedExtra = new Map(); // ruleId -> [topic ruleNumbers] for topics whose excerpt carries its full text beyond ruleNumbers
let listedNotCarried = 0;
const danglingStems = [];
for (const t of topicsAll) {
  const ex = collapse(t.excerpt);
  const listed = t.ruleNumbers.map((id) => {
    const r = ruleById.get(id);
    if (!r) return `${id}:NOT-IN-INDEX`;
    const full = ex.includes(collapse(stripBleed(r.text)));
    if (!full) listedNotCarried++;
    return `${id}:${full ? "full" : "NOT-CARRIED"}`;
  });
  const extra = index.filter((r) => !t.ruleNumbers.includes(r.ruleId) && ex.includes(collapse(stripBleed(r.text)))).map((r) => r.ruleId);
  for (const id of extra) carriedExtra.set(id, [...(carriedExtra.get(id) ?? []), t.ruleNumbers]);
  const prefixExcluded = index.filter((r) => !t.ruleNumbers.includes(r.ruleId) && r.parentRuleIds.some((p) => t.ruleNumbers.includes(p)));
  const nearDup = index.filter((r) => !t.ruleNumbers.includes(r.ruleId) && !extra.includes(r.ruleId)).filter((r) => {
    const b = collapse(stripBleed(r.text)).replace(/^\S+\s/, "").toLowerCase();
    return b.length > 40 && ex.toLowerCase().includes(b.slice(0, 50));
  }).map((r) => r.ruleId);
  for (const id of t.ruleNumbers) {
    const r = ruleById.get(id);
    if (r && /:$/.test(collapse(stripBleed(r.text)))) {
      const kids = index.filter((k) => k.parentRuleIds[0] === id && /[a-z]$/.test(k.ruleId));
      const missing = kids.filter((k) => !t.ruleNumbers.includes(k.ruleId));
      if (missing.length) danglingStems.push({ topic: t.id, stem: id, kids: missing.map((k) => k.ruleId), chars: missing.reduce((s, k) => s + k.text.length, 0), alwaysOn: ALWAYS_ON_TOPIC_IDS.includes(t.id) });
    }
  }
  log(`${t.id}${ALWAYS_ON_TOPIC_IDS.includes(t.id) ? " (always-on)" : ""}: listed [${listed.join(" ")}]; full text of other rules carried: ${extra.join(",") || "none"}; prefix-excluded today (REQ-179) ${prefixExcluded.length}: ${prefixExcluded.map((r) => r.ruleId).join(",") || "-"}; of those carried by the excerpt: ${prefixExcluded.filter((r) => extra.includes(r.ruleId)).length}; first-50-char near-duplicates (not carried): ${nearDup.join(",") || "none"}`);
}
const prefixExcludedTotal = new Set(topicsAll.flatMap((t) => index.filter((r) => !t.ruleNumbers.includes(r.ruleId) && r.parentRuleIds.some((p) => t.ruleNumbers.includes(p))).map((r) => r.ruleId)));
const alwaysOnNums = new Set(topicsAll.filter((t) => ALWAYS_ON_TOPIC_IDS.includes(t.id)).flatMap((t) => t.ruleNumbers));
const alwaysOnBlocked = index.filter((r) => !alwaysOnNums.has(r.ruleId) && r.parentRuleIds.some((p) => alwaysOnNums.has(p))).map((r) => r.ruleId);
say(`listed rule numbers whose full text the excerpt does NOT carry: ${listedNotCarried}; rules carried in full beyond a topic's ruleNumbers: ${carriedExtra.size} -> F1b's exclusion set equals F1a's (exact ruleNumbers) for every topic: ${listedNotCarried === 0 && carriedExtra.size === 0}`);
say(`sub-rules shut out of System 3 by prefix today: ${alwaysOnBlocked.length} on every lookup prompt (always-on topics: ${alwaysOnBlocked.join(",")}); ${prefixExcludedTotal.size} across all ${topicsAll.length} topics (game mode can select any)`);
say(`curated topics carrying a colon-ending stem without its lettered sub-rules: ${danglingStems.map((d) => `${d.topic}${d.alwaysOn ? " (ALWAYS-ON)" : ""}: ${d.stem} without ${d.kids.join(",")} (${d.chars} chars)`).join("; ") || "none"}`);

// ======================================================================= index policies (F1)
function withSomePolicy(policy) {
  return index.map((e) => {
    const parents = [...e.parentRuleIds];
    Object.defineProperty(parents, "some", { value: (fn) => policy(e, fn), enumerable: false, writable: true });
    return { ...e, parentRuleIds: parents };
  });
}
const IDX = {
  base: index,
  control: withSomePolicy((e, fn) => e.parentRuleIds.some(fn)),
  F1a: withSomePolicy(() => false),
  F1b: withSomePolicy((e, fn) => (carriedExtra.get(e.ruleId) ?? []).some((nums) => nums.every(fn)))
};

// ======================================================================= F2 expansion helpers
const isStem = (id) => /:$/.test(collapse(stripBleed(ruleById.get(id)?.text ?? "")));
const childrenOf = new Map();
for (const e of index) {
  if (!/[a-z]$/.test(e.ruleId)) continue;
  const p = e.parentRuleIds[0];
  if (!childrenOf.has(p)) childrenOf.set(p, []);
  childrenOf.get(p).push(e.ruleId);
}
const stems = index.filter((e) => isStem(e.ruleId)).map((e) => e.ruleId);
const toRetrieved = (id) => ({ ruleId: id, sectionTitle: ruleById.get(id).sectionTitle, text: ruleById.get(id).text, score: 0 });
const sectionOf = (ids) => formatSupplementalRulesSection(ids.map(toRetrieved));
/** picks: System 3 ids in rank order; carried: ids a selected topic carries. mode fill | slot. */
function expand(picks, carried, mode, cap = CAP) {
  const list = [];
  const added = [];
  const seen = new Set(picks);
  const stemPicks = [];
  for (const id of picks) {
    list.push(id);
    if (!isStem(id)) continue;
    stemPicks.push(id);
    for (const k of childrenOf.get(id) ?? []) {
      if (seen.has(k) || carried.has(k)) continue;
      seen.add(k);
      list.push(k);
      added.push(k);
    }
  }
  if (mode === "fill") return { selected: picks, shown: list, added, stemPicks, displaced: [], dropped: [] };
  const sel = list.slice(0, cap);
  return { selected: sel, shown: sel, added: added.filter((k) => sel.includes(k)), stemPicks, displaced: picks.filter((p) => !sel.includes(p)), dropped: added.filter((k) => !sel.includes(k)) };
}

// ======================================================================= W  worst case per stem
say("\n==================== W  colon-ending rules in the index and what expanding each adds");
say(`${stems.length} colon-ending rules. chars = formatted characters the expansion adds to the System 3 section (rule id, ". ", text, blank line).`);
const stemRows = stems.map((id) => {
  const kids = childrenOf.get(id) ?? [];
  const addChars = sectionOf([id, ...kids]).length - sectionOf([id]).length;
  return { id, stemChars: ruleById.get(id).text.length, kids, addChars, kidLens: kids.map((k) => `${k}:${ruleById.get(k).text.length}`) };
}).sort((a, b) => b.addChars - a.addChars);
for (const r of stemRows) say(`  ${r.id} (${r.stemChars} chars, ${r.kids.length} sub-rules) adds ${r.addChars}: ${r.kidLens.join(" ")} | "${collapse(ruleById.get(r.id).text).slice(-70)}"`);

// ======================================================================= P  per-case production runs
function runPrepared(request, vector, idx, cap = CAP) {
  const p = prep.preparePromptInput(request, { ...resources, gameRulesRuleIndex: idx, queryEmbedding: vector, collectEnrichmentDebug: true, supplementalRuleCap: cap });
  const topics = p.enrichmentDebug.curatedGameRules.topics;
  return {
    picks: p.enrichmentDebug.supplemental.selected.map((r) => r.ruleId),
    usedSemantic: p.enrichmentDebug.supplemental.usedSemantic,
    excludedCount: p.enrichmentDebug.supplemental.excludedCuratedRuleCount,
    topicIds: topics.map((t) => t.id),
    carried: new Set(topics.flatMap((t) => t.ruleNumbers)),
    promptText: p.promptText
  };
}
function ruleGate(c, selected, carried, extra = new Set()) {
  const sel = new Set(selected);
  const reaches = (id) => sel.has(id) || carried.has(id) || extra.has(id);
  const deciding = c.expected.decidingRuleIds;
  const rec = baseline.cases[c.id];
  const recorded = new Set([...(rec?.hit ?? []), ...(rec?.inTopic ?? [])]);
  return {
    hit: deciding.filter((id) => sel.has(id)),
    miss: deciding.filter((id) => !sel.has(id)),
    inTopic: deciding.filter((id) => !sel.has(id) && carried.has(id)),
    inExpansion: deciding.filter((id) => !sel.has(id) && !carried.has(id) && extra.has(id)),
    regressions: [...recorded].filter((id) => !reaches(id)),
    newHits: deciding.filter((id) => reaches(id) && !recorded.has(id)),
    complete: deciding.every(reaches),
    s3Complete: deciding.every((id) => sel.has(id)),
    s3PlusExpansionComplete: deciding.every((id) => sel.has(id) || extra.has(id))
  };
}

say("\n==================== G  real rules gate (evaluateRulesGate, frozen vectors, cap 10)");
const gateRuns = {};
for (const name of ["base", "control", "F1a", "F1b"]) {
  gateRuns[name] = evaluateRulesGate({ cases, resources: { ...resources, gameRulesRuleIndex: IDX[name] }, vectors, baseline, buildRequest: buildCaseRequest });
  say(`${name}: ${gateRuns[name].report.split("\n").pop()}; ok=${gateRuns[name].ok}`);
}
for (const r of gateRuns.base.results) {
  const c = gateRuns.control.results.find((x) => x.id === r.id);
  if (!eqArr(r, c)) throw new Error(`control wrapper moved the gate on ${r.id}`);
}
say("control (wrapped index, .some delegating to the original): identical to base on every case — the patch mechanism is inert by itself");
for (const r of gateRuns.F1a.results) {
  const b = gateRuns.F1b.results.find((x) => x.id === r.id);
  if (!eqArr(r, b)) throw new Error(`F1b differs from F1a on ${r.id}`);
}
say("F1b: identical to F1a on every case (no topic excerpt carries a rule beyond its ruleNumbers) — reported as F1 below");

// Per-case data.
const caseData = [];
for (const c of live) {
  const request = askAiRequestSchema.parse(buildCaseRequest(c));
  const freeze = checkReFreeze(c.id, request, cdi, vectors);
  const vector = freeze.state === "fresh" ? freeze.vector : null;
  const base = runPrepared(request, vector, IDX.base);
  const f1 = runPrepared(request, vector, IDX.F1a);
  const control = runPrepared(request, vector, IDX.control);
  if (control.promptText !== base.promptText || !eqArr(control.picks, base.picks)) throw new Error(`control prompt moved: ${c.id}`);
  caseData.push({ c, request, vector, scored: freeze.state === "fresh", mode: request.mode, base, f1 });
}
say(`cases scored: ${caseData.filter((d) => d.scored).length}; lookup ${caseData.filter((d) => d.mode === "lookup").length}, game (In-Depth) ${caseData.filter((d) => d.mode !== "lookup").length}`);

// Parity: my ratchet logic vs the real gate, base and F1.
for (const [name, key] of [["base", "base"], ["F1a", "f1"]]) {
  for (const d of caseData) {
    if (!d.scored) continue;
    const real = gateRuns[name].results.find((x) => x.id === d.c.id);
    const mine = ruleGate(d.c, d[key].picks, d[key].carried);
    for (const f of ["hit", "miss", "inTopic", "regressions", "newHits"]) {
      if (!eqArr(real[f], mine[f])) throw new Error(`ratchet parity ${name} ${d.c.id} ${f}: ${JSON.stringify(real[f])} vs ${JSON.stringify(mine[f])}`);
    }
  }
}
say("ratchet parity: the gate logic re-applied below equals the real gate's hit / miss / inTopic / regressions / newHits on every case, base and F1");

// Variants.
const VARIANTS = ["base", "F1", "F2a", "F2b", "F1+F2a", "F1+F2b"];
function variantRow(d, v) {
  const src = v.startsWith("F1") ? d.f1 : d.base;
  const mode = v.endsWith("F2a") ? "fill" : v.endsWith("F2b") ? "slot" : null;
  const ex = mode ? expand(src.picks, src.carried, mode) : { selected: src.picks, shown: src.picks, added: [], stemPicks: src.picks.filter(isStem), displaced: [], dropped: [] };
  let promptText = src.promptText;
  if (mode) {
    const oldS = sectionOf(src.picks);
    const at = promptText.indexOf(oldS);
    if (src.picks.length && (at < 0 || promptText.indexOf(oldS, at + 1) >= 0)) throw new Error(`System 3 section not found exactly once: ${d.c.id}`);
    if (src.picks.length) promptText = promptText.slice(0, at) + sectionOf(ex.shown) + promptText.slice(at + oldS.length);
  }
  const extra = mode === "fill" ? new Set(ex.added) : new Set();
  const gate = ruleGate(d.c, ex.selected, src.carried, extra);
  const failures = [...checkCards(promptText, d.c, resources), ...checkStateFacts(d.c, promptText)];
  return { d, v, src, ex, promptText, gate, failures, promptDelta: promptText.length - d.base.promptText.length };
}
const rows = {};
for (const v of VARIANTS) rows[v] = caseData.map((d) => variantRow(d, v));
for (const r of rows.base) if (r.failures.length) throw new Error(`base card/state failures ${r.d.c.id}`);

const scoredRows = (v) => rows[v].filter((r) => r.d.scored);
const baseComplete = new Set(scoredRows("base").filter((r) => r.gate.complete).map((r) => r.d.c.id));
const gapIds = scoredRows("base").filter((r) => !r.gate.complete).map((r) => r.d.c.id);
const EXPECT = ["triggers-becomes-tapped-not-entering-tapped", "triggers-damage-prevented-no-trigger", "necropotence-silence-borne-upon-a-wind-cleanup"];
const firstShip = (r) => r.d.c.source.pool === undefined && r.d.c.review.reviewedOn !== null && r.d.c.tier !== 3;

say("\n==================== M1  rules gate per variant (complete = every deciding rule reaches the prompt)");
say(`base: complete ${baseComplete.size} of ${scoredRows("base").length}; gap ${gapIds.length}`);
const summary = {};
for (const v of VARIANTS) {
  const sr = scoredRows(v);
  const complete = sr.filter((r) => r.gate.complete);
  const closed = complete.filter((r) => !baseComplete.has(r.d.c.id)).map((r) => r.d.c.id);
  const opened = sr.filter((r) => !r.gate.complete && baseComplete.has(r.d.c.id)).map((r) => r.d.c.id);
  const regs = sr.filter((r) => r.gate.regressions.length);
  const fails = rows[v].filter((r) => r.failures.length);
  const s3c = sr.filter((r) => r.gate.s3Complete).length;
  const s3xc = sr.filter((r) => r.gate.s3PlusExpansionComplete).length;
  const fs = sr.filter(firstShip);
  const fsHits = fs.filter((r) => r.gate.miss.length === 0);
  const newHits = sr.reduce((s, r) => s + r.gate.newHits.length, 0);
  summary[v] = { complete: complete.length, closed, opened, regs, fails, s3c, s3xc, fsN: fs.length, fsHits: fsHits.length, fsMisses: fs.filter((r) => r.gate.miss.length > 0).map((r) => r.d.c.id).sort(), newHits };
  say(`\n---------- ${v}`);
  say(`complete ${complete.length} (base ${baseComplete.size}); closed ${closed.length}: ${closed.join(", ") || "none"}; newly incomplete: ${opened.join(", ") || "none"}`);
  say(`expected closures: ${EXPECT.map((id) => `${id}=${closed.includes(id) ? "CLOSED" : baseComplete.has(id) ? "was complete" : "still open"}`).join("; ")}`);
  say(`card/state check failures: ${fails.length}${fails.length ? " " + fails.map((r) => `${r.d.c.id}: ${r.failures.join("; ")}`).join(" | ") : ""}`);
  say(`regressions (recorded hit or inTopic rule no longer reaching the prompt): ${regs.length} cases${regs.length ? "" : " — none"}`);
  for (const r of regs) {
    const entered = r.ex.selected.filter((id) => !r.d.base.picks.includes(id));
    say(`   ${r.d.c.id}: lost [${r.gate.regressions.join(", ")}] (base rank ${r.gate.regressions.map((id) => r.d.base.picks.indexOf(id) + 1).join(",")}); entered System 3: [${entered.join(", ")}]`);
  }
  say(`gate newHits to record on a baseline raise: ${newHits} rules in ${sr.filter((r) => r.gate.newHits.length).length} cases${v.endsWith("F2a") ? ` (of which carried only by the fill expansion: ${sr.reduce((s, r) => s + r.gate.inExpansion.length, 0)} — the gate must be taught to read them)` : ""}`);
  say(`eval:worked-solutions measure (every deciding rule a System 3 pick): ${s3c}${v.endsWith("F2a") ? ` (counting fill sub-rules as picks: ${s3xc})` : ""}`);
  say(`first-ship assertion (test filter; baseline miss empty, System 3 meaning; test expects exactly 16 and misses [panharmonicon…, restoration-angel…]): ${fsHits.length}/${fs.length}; misses ${summary[v].fsMisses.join(", ")}`);
}

say("\n==================== M2  System 3 selection changes and displaced picks");
for (const v of VARIANTS.slice(1)) {
  const changed = rows[v].filter((r) => !eqArr(r.ex.selected, r.d.base.picks));
  const setChanged = rows[v].filter((r) => r.ex.selected.some((id) => !r.d.base.picks.includes(id)));
  const displacedAll = [];
  const enteredCount = new Map();
  for (const r of setChanged) {
    const dropped = r.d.base.picks.filter((id) => !r.ex.selected.includes(id));
    const entered = r.ex.selected.filter((id) => !r.d.base.picks.includes(id));
    for (const id of entered) enteredCount.set(id, (enteredCount.get(id) ?? 0) + 1);
    displacedAll.push({ r, dropped, entered, deciding: dropped.filter((id) => r.d.c.expected.decidingRuleIds.includes(id)) });
  }
  const byMode = (m) => setChanged.filter((r) => (m === "lookup") === (r.d.mode === "lookup")).length;
  say(`\n---------- ${v}: System 3 selection changes in ${changed.length} cases (order or set); set changes in ${setChanged.length} (lookup ${byMode("lookup")}, game ${byMode("game")}); picks displaced ${displacedAll.reduce((s, x) => s + x.dropped.length, 0)}, of which deciding rules ${displacedAll.reduce((s, x) => s + x.deciding.length, 0)}`);
  say(`   rules entering System 3, by count: ${[...enteredCount].sort((a, b) => b[1] - a[1]).map(([id, n]) => `${id} x${n}`).join(", ") || "none"}`);
  for (const x of displacedAll) log(`   ${x.r.d.c.id} [${x.r.d.mode}]: out [${x.dropped.join(", ")}]${x.deciding.length ? ` DECIDING [${x.deciding.join(", ")}]` : ""}; in [${x.entered.join(", ")}]`);
  if (v.endsWith("F2b")) {
    const trunc = rows[v].filter((r) => r.ex.dropped.length);
    say(`   F2b stems whose sub-rules did not all fit in the ten slots: ${trunc.length} cases — ${trunc.map((r) => `${r.d.c.id} stem ${r.ex.stemPicks.join("+")} @#${r.ex.stemPicks.map((s) => r.src.picks.indexOf(s) + 1).join(",")} dropped ${r.ex.dropped.length}`).join("; ") || "none"}`);
  }
}

say("\n==================== M3  colon-ending stem picks and expansion cost — corpus (392, hybrid, frozen vectors)");
for (const v of ["F2a", "F2b", "F1+F2a", "F1+F2b"]) {
  const fired = rows[v].filter((r) => r.ex.stemPicks.length);
  const withAdd = rows[v].filter((r) => r.ex.added.length);
  const stemCount = new Map();
  for (const r of fired) for (const s of r.ex.stemPicks) stemCount.set(s, (stemCount.get(s) ?? 0) + 1);
  const addedByCase = rows[v].map((r) => r.promptDelta - (v.startsWith("F1") ? r.d.f1.promptText.length - r.d.base.promptText.length : 0));
  say(`${v}: prompts with a stem pick ${fired.length}/${rows[v].length} (${(100 * fired.length / rows[v].length).toFixed(1)}%); with sub-rules actually added ${withAdd.length}; stems picked: ${[...stemCount].sort((a, b) => b[1] - a[1]).map(([s, n]) => `${s} x${n}`).join(", ") || "none"}`);
  say(`   expansion chars over all cases: ${fmtQ(quantiles(addedByCase))}; over firing cases: ${fmtQ(quantiles(addedByCase.filter((x, i) => rows[v][i].ex.added.length)))}`);
  for (const r of withAdd) log(`   ${r.d.c.id}: stem ${r.ex.stemPicks.join("+")} @#${r.ex.stemPicks.map((s) => r.src.picks.indexOf(s) + 1).join(",")} adds [${r.ex.added.join(", ")}]${r.ex.displaced.length ? ` displaces [${r.ex.displaced.join(", ")}]` : ""}`);
}

say("\n==================== M4  prompt cost added per variant (whole prompt chars vs base, all 392 cases)");
for (const v of VARIANTS.slice(1)) {
  const deltas = rows[v].map((r) => r.promptDelta);
  say(`${v}: ${fmtQ(quantiles(deltas))}; cases whose prompt changes ${deltas.filter((x) => x !== 0).length}`);
}
say(`reference: base whole prompt ${fmtQ(quantiles(rows.base.map((r) => r.promptText.length)))}`);

// ======================================================================= H  context-evaluation harness
say("\n==================== H  context-evaluation harness (31 fixtures): labelled System 3 checks, prompt goldens, checklist report");
const fixtureDir = join(ROOT, "apps/backend/src/eval/fixtures");
const fixtures = readdirSync(fixtureDir).filter((f) => f.endsWith(".fixture.json")).sort().map((f) => JSON.parse(readFileSync(join(fixtureDir, f), "utf8")));
const frozenQ = JSON.parse(readFileSync(join(fixtureDir, "frozen-query-embeddings.json"), "utf8"));
const testSrc = readFileSync(join(ROOT, "apps/backend/src/eval/contextEvaluationHarness.test.ts"), "utf8");
const rulingsLiteral = testSrc.slice(testSrc.indexOf("const fixtureRulings = new Map(") + "const fixtureRulings = ".length, testSrc.indexOf("]);", testSrc.indexOf("const fixtureRulings = new Map(")) + 2);
const fixtureRulings = new Function(`return ${rulingsLiteral};`)();
const evalComboCatalog = harness.buildEvalComboCatalog(JSON.parse(readFileSync(join(fixtureDir, "commander-spellbook-eval-catalog.json"), "utf8")).variants);
const topicsLoaded = topicsAll; // same artifact the test loads (loadGameRulesTopics, id-sorted)
function harnessEval(fixture, idx, f2mode, queryEmbedding = null) {
  const request = fixture.request;
  const comboCatalog = fixture.disableComboEnrichment ? undefined : evalComboCatalog;
  const fcdi = cardDetailIndexFromRequest(request);
  if (request.mode === "lookup" || queryEmbedding !== null) {
    const p = prep.preparePromptInput(request, { gameRulesTopics: topicsLoaded, gameRulesRuleIndex: idx, cardRulingsIndex: fixtureRulings, cardDetailIndex: fcdi, comboCatalog, collectEnrichmentDebug: true, queryEmbedding });
    const picks = p.enrichmentDebug.supplemental.selected.map((r) => r.ruleId);
    const topicIds = new Set(p.enrichmentDebug.curatedGameRules.topicIds);
    const selectedTopics = topicsLoaded.filter((t) => topicIds.has(t.id));
    const carried = new Set(selectedTopics.flatMap((t) => t.ruleNumbers));
    const ex = f2mode ? expand(picks, carried, f2mode) : { selected: picks, shown: picks, added: [] };
    let promptText = p.promptText;
    if (f2mode && picks.length) {
      const oldS = sectionOf(picks);
      const at = promptText.indexOf(oldS);
      if (at < 0 || promptText.indexOf(oldS, at + 1) >= 0) throw new Error(`harness section not found once: ${fixture.id}`);
      promptText = promptText.slice(0, at) + sectionOf(ex.shown) + promptText.slice(at + oldS.length);
    }
    return { context: p.context, promptText, relevance: { selectedTopics, supplementalRules: ex.selected.map(toRetrieved) }, ex, usedSemantic: p.enrichmentDebug.supplemental.usedSemantic };
  }
  const context = buildPromptContext(request, fcdi);
  const selectedTopics = selectGameRulesTopics(context, topicsLoaded);
  const curated = gr.collectCuratedRuleIds(selectedTopics);
  const picks = gr.retrieveSupplementalRules(context, idx, curated, undefined, undefined, null).map((r) => r.ruleId);
  const ex = f2mode ? expand(picks, curated, f2mode, 5) : { selected: picks, shown: picks, added: [] };
  const comboCandidates = prep.resolveGameComboCandidates(request, context, { comboCatalog });
  const promptText = buildPromptText(context, { gameRulesTopics: selectedTopics, supplementalRules: ex.shown.map(toRetrieved), comboCandidates });
  return { context, promptText, relevance: { selectedTopics, supplementalRules: ex.selected.map(toRetrieved) }, ex };
}
const labelled = fixtures.filter((f) => f.expected?.expectedSupplementalRuleIds || f.expected?.forbiddenSupplementalRuleIds);
const harnessVariants = [["base", IDX.base, null], ["F1", IDX.F1a, null], ["F2a", IDX.base, "fill"], ["F2b", IDX.base, "slot"], ["F1+F2a", IDX.F1a, "fill"], ["F1+F2b", IDX.F1a, "slot"]];
const harnessBase = new Map();
let baseChecklist = null;
for (const [v, idx, f2] of harnessVariants) {
  const results = [];
  let goldenChanged = [];
  let goldenMismatchAtBase = [];
  const stemFires = [];
  for (const f of fixtures) {
    const e = harnessEval(f, idx, f2);
    results.push(harness.evaluateScenario(f, e.context, e.promptText, e.relevance));
    if (v === "base") {
      harnessBase.set(f.id, e.promptText);
      harnessBase.set(`${f.id}#picks`, e.ex.shown);
      const golden = readFileSync(join(fixtureDir, `${f.id}.prompt.golden.txt`), "utf8");
      if (`${e.promptText}\n` !== golden) goldenMismatchAtBase.push(f.id);
    } else if (e.promptText !== harnessBase.get(f.id)) {
      const before = harnessBase.get(`${f.id}#picks`);
      goldenChanged.push(`${f.id} [${f.request.mode ?? "game"}: out ${before.filter((id) => !e.ex.shown.includes(id)).join(",") || "-"}; in ${e.ex.shown.filter((id) => !before.includes(id)).join(",") || "-"}]`);
    }
    if (e.ex.added?.length) stemFires.push(`${f.id}(+${e.ex.added.join(",")})`);
  }
  const checklist = `${harness.buildChecklistReport(results)}\n`;
  if (v === "base") {
    baseChecklist = checklist;
    const committed = readFileSync(join(fixtureDir, "checklist-report.golden.txt"), "utf8");
    say(`base parity: prompt goldens reproduced ${fixtures.length - goldenMismatchAtBase.length}/${fixtures.length}${goldenMismatchAtBase.length ? " MISMATCH " + goldenMismatchAtBase.join(",") : ""}; checklist-report golden reproduced: ${checklist === committed}; all scenarios pass: ${results.every((r) => r.passed)}`);
  }
  let lex = 0, lexT = 0, sem = 0, semT = 0;
  const failed = [];
  const semMoved = [];
  for (const f of labelled) {
    const e = harnessEval(f, idx, f2);
    for (const ch of harness.evaluateSystem3RelevanceChecks(e.relevance.supplementalRules, f.expected)) { lexT++; if (ch.passed) lex++; else failed.push(`lexical ${f.id} ${ch.id}: ${ch.details}`); }
    const s = harnessEval(f, idx, f2, frozenQ[f.id].vector);
    if (!s.usedSemantic) throw new Error(`semantic fallback ${f.id}`);
    if (v === "base") harnessBase.set(`${f.id}#sem`, s.ex.shown);
    else if (!eqArr(harnessBase.get(`${f.id}#sem`), s.ex.shown)) { const b0 = harnessBase.get(`${f.id}#sem`); semMoved.push(`${f.id} [${f.request.mode ?? "game"}: out ${b0.filter((id) => !s.ex.shown.includes(id)).join(",") || "-"}; in ${s.ex.shown.filter((id) => !b0.includes(id)).join(",") || "-"}]`); }
    for (const ch of harness.evaluateSystem3RelevanceChecks(s.relevance.supplementalRules, f.expected)) { semT++; if (ch.passed) sem++; else failed.push(`semantic ${f.id} ${ch.id}: ${ch.details}`); }
    // Fill shows sub-rules outside the scored list: report any forbidden id they would print.
    if (f2 === "fill" && f.expected.forbiddenSupplementalRuleIds) {
      const shown = new Set([...e.ex.shown, ...s.ex.shown]);
      const bad = f.expected.forbiddenSupplementalRuleIds.filter((id) => shown.has(id));
      if (bad.length) failed.push(`fill prints a forbidden rule ${f.id}: ${bad.join(",")}`);
    }
  }
  say(`${v}: labelled System 3 checks lexical ${lex}/${lexT}, semantic (frozen) ${sem}/${semT}; ${failed.length ? "FAIL " + failed.join(" | ") : "no failures"}${v === "base" ? "" : `; prompt goldens that change: ${goldenChanged.length}/${fixtures.length} ${goldenChanged.join(", ")}; checklist-report golden changes: ${checklist !== baseChecklist}; all scenarios pass: ${results.every((r) => r.passed)}; labelled fixtures whose semantic (production cap-10) excerpt list changes: ${semMoved.length}/${labelled.length} ${semMoved.join(", ")}`}${stemFires.length ? `; stem expansions: ${stemFires.join(" ")}` : ""}`);
}

// ======================================================================= B  retrieval benchmark
say("\n==================== B  retrieval benchmark (production scoreBenchmark)");
const corpus = bench.loadBenchmarkCorpus();
const nameIndex = bench.loadCardNameByOracleId();
const pollution = bench.buildPollutionText(cdi, nameIndex);
const sbBase = bench.scoreBenchmark(corpus, IDX.base, pollution);
const sbF1 = bench.scoreBenchmark(corpus, IDX.F1a, pollution);
const committed = JSON.parse(readFileSync(join(ROOT, "apps/backend/src/eval/benchmark/results.json"), "utf8"));
say(`lexical base: clean R@5 ${sbBase.clean.recall5.toFixed(4)} MRR ${sbBase.clean.mrr.toFixed(4)}, polluted R@5 ${sbBase.polluted.recall5.toFixed(4)} MRR ${sbBase.polluted.mrr.toFixed(4)} (committed results.json clean ${committed.clean.recall5.toFixed(4)} / polluted ${committed.polluted.recall5.toFixed(4)})`);
say(`lexical F1: identical to base: ${eqArr(sbBase, sbF1)}`);
{
  // scoreBenchmark / scoreBenchmarkSemantic pass `new Set()` as the exclusion set: under that set the
  // patched predicate and today's predicate are both false for every entry, lexical or hybrid.
  const empty = new Set();
  const differs = IDX.F1a.filter((e, i) => (empty.has(e.ruleId) || e.parentRuleIds.some((p) => empty.has(p))) !== (empty.has(index[i].ruleId) || index[i].parentRuleIds.some((p) => empty.has(p)))).length;
  say(`hybrid (scoreBenchmarkSemantic): not re-run (would embed 312 queries); both benchmark scorers pass an empty exclusion set, under which F1's exclusion test equals today's for all ${index.length} entries (differences: ${differs}) — unchanged by construction. F2a (fill) is outside System 3's list — unchanged by construction.`);
}
{
  // F2b sensitivity if it were built inside the retriever (benchmark would see it): lexical only.
  // The benchmark matches by rule family (a trailing letter stripped: 514.3a counts as 514.3), as its rankOf does.
  const fam = (id) => id.replace(/[a-z]$/i, "");
  const rank = (ids, exp) => { const i = ids.findIndex((id) => fam(id) === fam(exp)); return i < 0 ? 0 : i + 1; };
  const score = (ranks) => ({ recall5: ranks.filter((r) => r > 0 && r <= 5).length / ranks.length, mrr: ranks.reduce((s, r) => s + (r > 0 ? 1 / r : 0), 0) / ranks.length });
  const res = {};
  for (const [label, xform] of [["base", (ids) => ids], ["F2b-in-retriever", (ids) => expand(ids, new Set(), "slot", 5).selected]]) {
    const clean = [], pol = [];
    let stemQ = 0;
    for (const item of corpus.items) {
      const q1 = gr.buildQueryTokensFromParts({ questionText: item.question, oracleText: "" });
      const ids1 = gr.retrieveRulesForQuery(q1.tokens, q1.queryRuleIds, index, new Set(), 5).map((r) => r.ruleId);
      if (ids1.some(isStem)) stemQ++;
      clean.push(rank(xform(ids1), item.expectedRuleId));
      const q2 = gr.buildQueryTokensFromParts({ questionText: item.question, oracleText: pollution });
      pol.push(rank(xform(gr.retrieveRulesForQuery(q2.tokens, q2.queryRuleIds, index, new Set(), 5).map((r) => r.ruleId)), item.expectedRuleId));
    }
    res[label] = { clean: score(clean), polluted: score(pol), stemQ };
  }
  if (Math.abs(res.base.clean.recall5 - sbBase.clean.recall5) > 1e-12 || Math.abs(res.base.polluted.mrr - sbBase.polluted.mrr) > 1e-12) throw new Error("benchmark re-scoring parity");
  say(`F2b if built inside the retriever (lexical, top-5): clean R@5 ${res["F2b-in-retriever"].clean.recall5.toFixed(4)} MRR ${res["F2b-in-retriever"].clean.mrr.toFixed(4)}, polluted R@5 ${res["F2b-in-retriever"].polluted.recall5.toFixed(4)} MRR ${res["F2b-in-retriever"].polluted.mrr.toFixed(4)}; questions with a stem in the clean top 5: ${res.base.stemQ}/${corpus.items.length}. Built in prompt preparation (after retrieval) the benchmark does not see it.`);
}

// ======================================================================= R  realistic-query samples (stem frequency, F1 reach)
say("\n==================== R  colon-ending picks on realistic queries beyond the corpus (lexical: no frozen vectors exist for these)");
function lookupS3(question, cards, idx) {
  const topicIds = new Set([...ALWAYS_ON_TOPIC_IDS, ...selectCardWordingTopicIds(cards)]);
  const topics = topicsAll.filter((t) => topicIds.has(t.id));
  const carried = gr.collectCuratedRuleIds(topics);
  const q = gr.buildQueryTokensFromParts({ questionText: question, oracleText: cards.map((c) => gr.buildCompactCardSignal(c.name ?? "", c.typeLine, c.keywords)).join(" ") });
  return { picks: gr.retrieveRulesForQuery(q.tokens, q.queryRuleIds, idx, carried, CAP, undefined, null, q.questionRuleIds).map((r) => r.ruleId), carried };
}
function sampleReport(label, samples) {
  for (const [v, idx] of [["base", IDX.base], ["F1", IDX.F1a]]) {
    const runs = samples.map((s) => lookupS3(s.question, s.cards, idx));
    const fire = runs.filter((r) => r.picks.some(isStem));
    const stemCount = new Map();
    for (const r of fire) for (const s of r.picks.filter(isStem)) stemCount.set(s, (stemCount.get(s) ?? 0) + 1);
    const fillAdd = runs.map((r) => { const ex = expand(r.picks, r.carried, "fill"); return sectionOf(ex.shown).length - sectionOf(r.picks).length; });
    const freed = new Map();
    for (const r of runs) for (const id of r.picks) if (alwaysOnBlocked.includes(id)) freed.set(id, (freed.get(id) ?? 0) + 1);
    say(`${label} ${v}: ${samples.length} queries; with a stem pick ${fire.length} (${(100 * fire.length / samples.length).toFixed(1)}%): ${[...stemCount].sort((a, b) => b[1] - a[1]).map(([s, n]) => `${s} x${n}`).join(", ") || "none"}; fill chars all ${fmtQ(quantiles(fillAdd))}; firing ${fmtQ(quantiles(fillAdd.filter((x) => x > 0)))}${v === "F1" ? `; freed always-on sub-rules picked: ${[...freed].sort((a, b) => b[1] - a[1]).map(([id, n]) => `${id} x${n}`).join(", ") || "none"}` : ""}`);
  }
}
sampleReport("benchmark questions, no cards", corpus.items.map((i) => ({ question: i.question, cards: [] })));
{
  let seed = 20261007;
  const rand = () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const pool = [...cdi.entries()].map(([id, e]) => ({ ...e, name: nameIndex.get(id) ?? "" }));
  const samples = [];
  for (let i = 0; i < 1000; i++) {
    const n = 1 + Math.floor(rand() * 3);
    const cards = [];
    while (cards.length < n) cards.push(pool[Math.floor(rand() * pool.length)]);
    samples.push({ question: corpus.items[Math.floor(rand() * corpus.items.length)].question, cards });
  }
  sampleReport("benchmark question + 1-3 random cards (1,000 seeded)", samples);
}

// ======================================================================= N  the Necropotence tester case
say("\n==================== N  Necropotence tester case: does 514.3a reach the prompt?");
const necro = live.find((c) => c.id === "necropotence-silence-borne-upon-a-wind-cleanup");
const embedder = await buildEmbedder({ EMBEDDING_PROVIDER: "local" });
if (embedder.mode !== "local") throw new Error("local embedder required");
const CARD = {
  silence: { cardId: "8aed54cb-d1bb-45ad-adbe-38e55d84ff31", name: "Silence" },
  necro: { cardId: "94a844d2-0574-45a7-b347-e0e329767c42", name: "Necropotence" },
  borne: { cardId: "ce19962d-94f9-4b2b-b668-963c0acce308", name: "Borne Upon a Wind" }
};
const VERBATIM_Q2 = "Can I use the triggered ability of necropotence during my cleanup step to dodge silence effects and cast borne upon a wind?";
const necroVariants = [
  { label: "corpus wording (frozen vector)", request: askAiRequestSchema.parse(buildCaseRequest(necro)), frozen: true },
  { label: "verbatim tester question, cards Silence+Necro+Borne (live local embedding)", request: askAiRequestSchema.parse({ mode: "lookup", question: VERBATIM_Q2, cards: [CARD.silence, CARD.necro, CARD.borne] }) },
  { label: "verbatim tester question, cards Necro+Borne+Silence (live local embedding)", request: askAiRequestSchema.parse({ mode: "lookup", question: VERBATIM_Q2, cards: [CARD.necro, CARD.borne, CARD.silence] }) }
];
for (const nv of necroVariants) {
  const vector = nv.frozen ? checkReFreeze(necro.id, nv.request, cdi, vectors).vector : await embedder.embed(prep.buildRetrievalQueryText(nv.request, { cardDetailIndex: cdi }));
  if (!vector) throw new Error("no vector");
  say(`${nv.label}: deciding ${necro.expected.decidingRuleIds.join(", ")}`);
  for (const [vname, vec] of [["hybrid", vector], ["lexical", null]]) {
    const deepB = runPrepared(nv.request, vec, IDX.base, 3000).picks;
    const deepF = runPrepared(nv.request, vec, IDX.F1a, 3000).picks;
    const b = runPrepared(nv.request, vec, IDX.base);
    const f = runPrepared(nv.request, vec, IDX.F1a);
    const rk = (list, id) => (list.indexOf(id) + 1 || "-");
    const parts = [];
    for (const v of VARIANTS) {
      const src = v.startsWith("F1") ? f : b;
      const mode = v.endsWith("F2a") ? "fill" : v.endsWith("F2b") ? "slot" : null;
      const ex = mode ? expand(src.picks, src.carried, mode) : { shown: src.picks, displaced: [] };
      const reach = (id) => ex.shown.includes(id) || src.carried.has(id);
      parts.push(`${v}: ${necro.expected.decidingRuleIds.map((id) => `${id}=${reach(id) ? "IN" : "out"}`).join(" ")}${ex.displaced.length ? ` (displaces ${ex.displaced.join(",")})` : ""}`);
    }
    say(`   ${vname}: ranks base 514.3 #${rk(deepB, "514.3")} 514.3a #${rk(deepB, "514.3a")} 514.2 #${rk(deepB, "514.2")}; F1 514.3 #${rk(deepF, "514.3")} 514.3a #${rk(deepF, "514.3a")}; top ten base [${b.picks.join(", ")}]`);
    say(`      ${parts.join(" | ")}`);
  }
}

writeFileSync(join(PROBE, "measure-two-fixes.out.txt"), out.join("\n") + "\n");
console.log(`\nwrote ${join(PROBE, "measure-two-fixes.out.txt")} (${out.length} lines)`);
