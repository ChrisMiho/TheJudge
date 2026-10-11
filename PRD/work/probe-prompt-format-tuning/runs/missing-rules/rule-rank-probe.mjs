// Free, local probe (no API calls): for every practice-suite question the suite run selects, where does each
// deciding rule land in System 3's rule search? Production retrieval, cap 10, local embedder.
// Prints aggregate counts only (rule ids, buckets, levels) — no question ids, text or answers.
// Per-question detail goes to the gitignored output/rulesguru/reports/pft-rule-ranks.json (local only).
// Usage (from .worktrees/probe-pft): npx tsx <this file> [--set hard25]
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const REPO = "/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/probe-pft";
const SUITE = `${REPO}/output/rulesguru`;
const args = process.argv.slice(2);
const SET = args.includes("--set") ? args[args.indexOf("--set") + 1] : "suite";
const CAP = 10;
const FULL = 100000;

const imp = (rel) => import(pathToFileURL(`${REPO}/${rel}`).href);
const evalMod = await imp("scripts/eval-answer-quality.mjs");
const ws = await imp("scripts/eval-worked-solutions.mjs");
const fid = await imp("scripts/lib/prompt-fidelity.mjs");
const ra = await imp("scripts/lib/rule-availability.mjs");
const sg = await imp("scripts/lib/rulesguru-suite.mjs");
const { preparePromptInput, buildRetrievalQueryText } = await imp("apps/backend/src/prompt/preparation.ts");
const { askAiRequestSchema } = await imp("apps/backend/src/validation/askAiRequest.ts");
const { loadGameRulesRuleEmbeddings, cosineSimilarity } = await imp("apps/backend/src/gameRulesRetrieval.ts");

sg.assertSuiteIgnored({ suiteDir: SUITE });
const env = evalMod.resolveRunEnv({ processEnv: process.env, confirmed: true });
if (fid.resolveEmbeddingProviderMode(env) !== "local") throw new Error("EMBEDDING_PROVIDER is not local");

const { selected } = await ws.loadSuiteSelection({ suiteDir: SUITE });
let cases = selected;
if (SET === "hard25") {
  const ids = new Set(JSON.parse(readFileSync(`${SUITE}/reports/pft-hard25-verify.json`, "utf8")).final);
  cases = selected.filter((c) => ids.has(c.id));
}
console.log(`Set ${SET}: ${cases.length} questions`);

const resources = await fid.loadPromptResources({ env });
const indexIds = new Set(resources.gameRulesRuleIndex.map((e) => e.ruleId));
const embeddings = loadGameRulesRuleEmbeddings(join(REPO, "apps/backend/data/gameRulesRuleEmbeddings.json"));
const embedder = await fid.buildEmbedder(env);
if (embedder.mode !== "local") throw new Error(`embedder mode ${embedder.mode}`);

const family = (id) => (/^(\d{3}\.\d+)/.exec(id) ?? [])[1] ?? id;
const bucket = (rank) => (rank == null ? "not ranked" : rank <= 10 ? "1-10" : rank <= 20 ? "11-20" : rank <= 50 ? "21-50" : rank <= 100 ? "51-100" : rank <= 500 ? "101-500" : ">500");
const BUCKETS = ["1-10", "11-20", "21-50", "51-100", "101-500", ">500", "not ranked"];
const inc = (o, k, n = 1) => (o[k] = (o[k] ?? 0) + n);

const detail = {};
const rules = { total: 0, available: 0, curated: 0, selected: 0, ruling: 0, notInIndex: 0, missing: 0 };
const missingBlended = {}, missingCosine = {}, missingFamily = { yes: 0, no: 0 };
const byLevel = {};
const allAtCap = { 10: 0, 20: 0, 30: 0, 50: 0 };
const selectedFreq = {};
const notInIndexIds = {};
let done = 0;
let skipped = 0;

for (const caseEntry of cases) {
  const raw = fid.buildCaseRequest(caseEntry);
  const parsed = askAiRequestSchema.safeParse(raw);
  if (!parsed.success) { skipped++; continue; } // production would reject it too (e.g. more than 10 cards)
  const request = parsed.data;
  const vector = await embedder.embed(buildRetrievalQueryText(request, { cardDetailIndex: resources.cardDetailIndex }));
  fid.assertQueryEmbedded({ mode: embedder.mode, vector, caseId: "case" });
  const opts = { ...resources, queryEmbedding: vector, collectEnrichmentDebug: true };
  const p10 = preparePromptInput(request, { ...opts, supplementalRuleCap: CAP });
  if (!p10.enrichmentDebug.supplemental.usedSemantic) throw new Error("semantic retrieval did not run");
  const pAll = preparePromptInput(request, { ...opts, supplementalRuleCap: FULL });
  const fullRank = new Map(pAll.enrichmentDebug.supplemental.selected.map((r, i) => [r.ruleId, i + 1]));
  for (const r of p10.enrichmentDebug.supplemental.selected) inc(selectedFreq, r.ruleId);

  const curated = new Set((p10.enrichmentDebug.curatedGameRules.topics ?? []).flatMap((t) => t.ruleNumbers ?? []));
  const cosRank = new Map(
    embeddings.ruleIds
      .map((id, i) => [id, cosineSimilarity(vector, embeddings.vectors[i])])
      .filter(([id]) => !curated.has(id))
      .sort((a, b) => b[1] - a[1])
      .map(([id], i) => [id, i + 1])
  );
  const avail = ra.describeDecidingRules({ decidingRuleIds: caseEntry.expected.decidingRuleIds, prepared: p10, request, cardRulingsIndex: resources.cardRulingsIndex });
  const inPrompt = new Set([...p10.enrichmentDebug.supplemental.selected.map((r) => r.ruleId), ...curated]);
  const level = caseEntry.suite?.level ?? "?";
  byLevel[level] ??= { questions: 0, allAvailable: 0, rules: 0, missing: 0 };
  byLevel[level].questions++;
  if (avail.allDecidingRulesInPrompt) byLevel[level].allAvailable++;

  const rows = [];
  let worstRank = 0;
  for (const a of avail.rules) {
    rules.total++;
    byLevel[level].rules++;
    const row = { ruleId: a.ruleId, available: a.availableToAnswer, curated: a.curatedTopic, selected: a.selectedInSearch, ruling: a.rulingQuote };
    if (a.availableToAnswer) {
      rules.available++;
      if (a.curatedTopic) rules.curated++;
      else if (a.selectedInSearch) rules.selected++;
      else rules.ruling++;
    } else if (!indexIds.has(a.ruleId)) {
      rules.notInIndex++;
      inc(notInIndexIds, a.ruleId);
      row.notInIndex = true;
      worstRank = Infinity;
    } else {
      rules.missing++;
      byLevel[level].missing++;
      row.blendedRank = fullRank.get(a.ruleId) ?? null;
      row.cosineRank = cosRank.get(a.ruleId) ?? null;
      row.familyInPrompt = [...inPrompt].some((id) => id !== a.ruleId && family(id) === family(a.ruleId));
      inc(missingBlended, bucket(row.blendedRank));
      inc(missingCosine, bucket(row.cosineRank));
      missingFamily[row.familyInPrompt ? "yes" : "no"]++;
      worstRank = Math.max(worstRank, row.blendedRank ?? Infinity);
    }
    rows.push(row);
  }
  // would a bigger excerpt cap put every deciding rule in the prompt?
  for (const cap of [10, 20, 30, 50]) if (avail.rules.length && worstRank <= cap) allAtCap[cap]++;
  detail[caseEntry.id] = { level, rules: rows, selected: p10.enrichmentDebug.supplemental.selected.map((r) => r.ruleId) };
  if (++done % 100 === 0) console.log(`  ${done}/${cases.length}`);
}

const pct = (n, d) => `${n} (${d ? Math.round((100 * n) / d) : 0}%)`;
console.log(`\nQuestions skipped because production would reject the request: ${skipped}`);
console.log(`\nDeciding-rule citations: ${rules.total}`);
console.log(`  in the prompt: ${pct(rules.available, rules.total)} — via curated topic ${rules.curated}, rule search ${rules.selected}, card ruling quote ${rules.ruling}`);
console.log(`  not in the rule index at all (section-level or stale number): ${pct(rules.notInIndex, rules.total)}`);
console.log(`  in the index but not in the prompt: ${pct(rules.missing, rules.total)}`);
console.log(`\nWhere the missing ones rank (production blended search, curated rules excluded):`);
for (const b of BUCKETS) console.log(`  ${b.padEnd(10)} ${missingBlended[b] ?? 0}`);
console.log(`Same ranks by meaning-search alone (cosine):`);
for (const b of BUCKETS) console.log(`  ${b.padEnd(10)} ${missingCosine[b] ?? 0}`);
console.log(`Missing rule's sibling/parent (same NNN.N family) is in the prompt: yes ${missingFamily.yes}, no ${missingFamily.no}`);
console.log(`\nQuestions with every deciding rule in the prompt if the excerpt cap were: ${Object.entries(allAtCap).map(([c, n]) => `${c} → ${n}`).join(", ")} (of ${cases.length})`);
console.log(`\nBy level (questions / every rule in prompt / deciding rules / missing):`);
for (const [l, v] of Object.entries(byLevel).sort()) console.log(`  ${l}: ${v.questions} / ${v.allAvailable} / ${v.rules} / ${v.missing}`);
console.log(`\nMost-cited ids not in the index: ${Object.entries(notInIndexIds).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k, v]) => `${k}×${v}`).join(", ")}`);
console.log(`Excerpts that turn up most often (share of questions): ${Object.entries(selectedFreq).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k, v]) => `${k} ${Math.round((100 * v) / cases.length)}%`).join(", ")}`);
const out = sg.resolveInsideSuite(`${SUITE}/reports/pft-rule-ranks-${SET}.json`, { suiteDir: SUITE });
writeFileSync(out, JSON.stringify(detail, null, 1));
console.log(`\nPer-question detail (local only): ${out}`);
