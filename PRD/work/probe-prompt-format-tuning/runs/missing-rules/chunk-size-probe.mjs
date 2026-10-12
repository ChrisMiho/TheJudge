// Free, local probe (no API calls): would bigger chunks catch the deciding rules? "Small-to-big" retrieval —
// match on today's per-rule chunks, then hand Luna the whole family each hit belongs to — measured three ways:
//   family = NNN.N (614.12 → 614.12, 614.12a, 614.12b …), section = NNN (614 → every 614.* rule).
// For each, deciding-rule recall and the rule text added to the prompt, against plain top-N at a similar size.
// Production retrieval (cap 10 + curated topics, local embedder). Prints aggregate counts only.
// Usage (from .worktrees/probe-pft): npx tsx <this file> [--set hard25]
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const REPO = "/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/probe-pft";
const SUITE = `${REPO}/output/practice-suite`;
const args = process.argv.slice(2);
const SET = args.includes("--set") ? args[args.indexOf("--set") + 1] : "suite";

const imp = (rel) => import(pathToFileURL(`${REPO}/${rel}`).href);
const evalMod = await imp("scripts/eval-answer-quality.mjs");
const ws = await imp("scripts/eval-worked-solutions.mjs");
const fid = await imp("scripts/lib/prompt-fidelity.mjs");
const sg = await imp("scripts/lib/practice-suite.mjs");
const { preparePromptInput, buildRetrievalQueryText } = await imp("apps/backend/src/prompt/preparation.ts");
const { askAiRequestSchema } = await imp("apps/backend/src/validation/askAiRequest.ts");

sg.assertSuiteIgnored({ suiteDir: SUITE });
const env = evalMod.resolveRunEnv({ processEnv: process.env, confirmed: true });
if (fid.resolveEmbeddingProviderMode(env) !== "local") throw new Error("EMBEDDING_PROVIDER is not local");
const { selected } = await ws.loadSuiteSelection({ suiteDir: SUITE });
let cases = selected;
if (SET === "hard25") {
  const ids = new Set(JSON.parse(readFileSync(`${SUITE}/reports/pft-hard25-verify.json`, "utf8")).final);
  cases = selected.filter((c) => ids.has(c.id));
}
const resources = await fid.loadPromptResources({ env });
const index = resources.gameRulesRuleIndex;
const len = new Map(index.map((e) => [e.ruleId, e.ruleId.length + 2 + e.text.length]));
const fam = (id) => (/^(\d{3}\.\d+)/.exec(id) ?? [])[1] ?? id;
const sec = (id) => id.slice(0, 3);
const members = (keyFn) => { const m = new Map(); for (const e of index) { const k = keyFn(e.ruleId); if (!m.has(k)) m.set(k, []); m.get(k).push(e.ruleId); } return m; };
const famMembers = members(fam), secMembers = members(sec);
const embedder = await fid.buildEmbedder(env);
if (embedder.mode !== "local") throw new Error(`embedder mode ${embedder.mode}`);

const ARMS = [];
for (const k of [3, 5, 10]) ARMS.push({ name: `top ${k} hits → their families`, k, expand: famMembers, key: fam });
for (const k of [1, 2, 3, 5]) ARMS.push({ name: `top ${k} hits → their sections`, k, expand: secMembers, key: sec });
for (const n of [10, 20, 30, 50, 100]) ARMS.push({ name: `plain top ${n}`, k: n });
const agg = Object.fromEntries(ARMS.map((a) => [a.name, { found: 0, all: 0, chars: [] }]));
const oracleSec = { chars: [] };
let total = 0, cites = 0, skipped = 0;

for (const c of cases) {
  const parsed = askAiRequestSchema.safeParse(fid.buildCaseRequest(c));
  if (!parsed.success) { skipped++; continue; }
  const request = parsed.data;
  const vector = await embedder.embed(buildRetrievalQueryText(request, { cardDetailIndex: resources.cardDetailIndex }));
  fid.assertQueryEmbedded({ mode: embedder.mode, vector, caseId: "case" });
  const p = preparePromptInput(request, { ...resources, queryEmbedding: vector, collectEnrichmentDebug: true, supplementalRuleCap: 100 });
  const ranked = p.enrichmentDebug.supplemental.selected.map((r) => r.ruleId);
  const curated = new Set((p.enrichmentDebug.curatedGameRules.topics ?? []).flatMap((t) => t.ruleNumbers ?? []));
  const deciding = [...new Set(c.expected.decidingRuleIds ?? [])];
  total++; cites += deciding.length;
  for (const a of ARMS) {
    let ids;
    if (a.expand) { ids = new Set(); for (const h of ranked.slice(0, a.k)) for (const id of a.expand.get(a.key(h)) ?? [h]) ids.add(id); }
    else ids = new Set(ranked.slice(0, a.k));
    const g = agg[a.name];
    let all = deciding.length > 0;
    for (const id of deciding) { if (curated.has(id) || ids.has(id)) g.found++; else all = false; }
    if (all) g.all++;
    g.chars.push([...ids].filter((id) => !curated.has(id)).reduce((s, id) => s + (len.get(id) ?? 0), 0));
  }
  // what would it cost to hand over every section a deciding rule sits in (an upper bound on "right section")
  const secs = new Set(deciding.map(sec));
  oracleSec.chars.push([...secs].reduce((s, k) => s + (secMembers.get(k) ?? []).reduce((x, id) => x + (len.get(id) ?? 0), 0), 0));
}

const med = (a) => { const s = [...a].sort((x, y) => x - y); return s[s.length >> 1]; };
console.log(`Set ${SET}: ${total} questions (${skipped} skipped), ${cites} deciding-rule citations. Whole rule book ≈ ${[...len.values()].reduce((a, b) => a + b, 0)} chars.`);
console.log(`Arm — deciding-rule citations in prompt / questions with every deciding rule / rule text added, median chars (p90)`);
for (const a of ARMS) {
  const g = agg[a.name];
  const s = [...g.chars].sort((x, y) => x - y);
  console.log(`  ${a.name.padEnd(30)} ${g.found} (${Math.round((100 * g.found) / cites)}%) / ${g.all} / ${med(g.chars)} (${s[Math.floor(s.length * 0.9)]})`);
}
console.log(`Every section a deciding rule sits in (oracle): median ${med(oracleSec.chars)} chars`);
