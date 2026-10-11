// Free, local probe (no API calls, no LLM): exports training material for a Magic-trained
// MiniLM into the git-ignored worktree folder output/models-probe/train/data/.
//   cases.jsonl     practice + corpus questions: production query text, deciding rules, fold,
//                   half, hard-25 flag, hard negatives (today's top-40 non-deciding, family removed)
//   examples.jsonl  rule-book Example: passages -> the rule they illustrate (example stripped from
//                   that rule's document text for training), hard negatives by today's meaning half
//   rules.json      ruleId -> production embedding text (`${sectionTitle}: ${text}`.slice(0, 2000))
// Folds: 5, grouped so near-duplicates share a fold (corpus Quick/In-Depth twins; corpus cases with
// the same cards and deciding rules; practice questions with the same card set).
// Prints aggregate counts only.
// Usage (from .worktrees/probe-pft): EMBEDDING_PROVIDER=local npx tsx <this file>
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

const REPO = "/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/probe-pft";
const SUITE = `${REPO}/output/rulesguru`;
const OUT = `${REPO}/output/models-probe/train/data`;
mkdirSync(OUT, { recursive: true });

const imp = (rel) => import(pathToFileURL(`${REPO}/${rel}`).href);
const evalMod = await imp("scripts/eval-answer-quality.mjs");
const ws = await imp("scripts/eval-worked-solutions.mjs");
const fid = await imp("scripts/lib/prompt-fidelity.mjs");
const sg = await imp("scripts/lib/rulesguru-suite.mjs");
const { preparePromptInput, buildRetrievalQueryText } = await imp("apps/backend/src/prompt/preparation.ts");
const { buildPromptContext, buildLookupPromptContext } = await imp("apps/backend/src/prompt/context.ts");
const { askAiRequestSchema } = await imp("apps/backend/src/validation/askAiRequest.ts");
const R = await imp("apps/backend/src/gameRulesRetrieval.ts");

const env = evalMod.resolveRunEnv({ processEnv: process.env, confirmed: true });
if (fid.resolveEmbeddingProviderMode(env) !== "local") throw new Error("EMBEDDING_PROVIDER is not local");
const embedder = await fid.buildEmbedder(env);
if (embedder.mode !== "local") throw new Error(`embedder mode ${embedder.mode}`);
const resources = await fid.loadPromptResources({ env });
const index = resources.gameRulesRuleIndex;
const idSet = new Set(index.map((e) => e.ruleId));
const prodEmb = R.loadGameRulesRuleEmbeddings(`${REPO}/apps/backend/data/gameRulesRuleEmbeddings.json`);

const docText = (e, text = e.text) => `${e.sectionTitle}: ${text}`.slice(0, 2000);
writeFileSync(`${OUT}/rules.json`, JSON.stringify(Object.fromEntries(index.map((e) => [e.ruleId, docText(e)]))));

const family = (id) => (/^(\d{3}\.\d+)/.exec(id) ?? [])[1] ?? id;
const half = (id) => (createHash("sha256").update(`pft-split-1:${id}`).digest()[0] % 2 === 0 ? "tuning" : "check");
const hardIds = new Set(JSON.parse(readFileSync(`${SUITE}/reports/pft-hard25-verify.json`, "utf8")).final);
const hnegs = (order, deciding) => {
  const fams = new Set(deciding.map(family));
  return order.filter((id) => !deciding.includes(id) && !fams.has(family(id))).slice(0, 30);
};

// ---- questions --------------------------------------------------------------------------------------
const WS_DIR = `${REPO}/apps/backend/src/eval/worked-solutions`;
const corpus = readdirSync(WS_DIR).filter((f) => f.endsWith(".case.json")).map((f) => JSON.parse(readFileSync(`${WS_DIR}/${f}`, "utf8"))).filter((c) => c.review?.status !== "rejected");
sg.assertSuiteIgnored({ suiteDir: SUITE });
const { selected } = await ws.loadSuiteSelection({ suiteDir: SUITE });
const rows = [];
let skipped = 0;
for (const [set, list] of [["suite", selected], ["corpus", corpus]]) {
  for (const c of list) {
    const parsed = askAiRequestSchema.safeParse(fid.buildCaseRequest(c));
    if (!parsed.success) { skipped++; continue; }
    const request = parsed.data;
    const query = buildRetrievalQueryText(request, { cardDetailIndex: resources.cardDetailIndex });
    const vector = await embedder.embed(query);
    fid.assertQueryEmbedded({ mode: embedder.mode, vector, caseId: "case" });
    const prod = preparePromptInput(request, { ...resources, queryEmbedding: vector, collectEnrichmentDebug: true, supplementalRuleCap: 40 });
    if (!prod.enrichmentDebug.supplemental.usedSemantic) throw new Error("semantic retrieval did not run");
    const order = prod.enrichmentDebug.supplemental.selected.map((r) => r.ruleId);
    const cards = request.mode === "lookup"
      ? buildLookupPromptContext(request, resources.cardDetailIndex).cards ?? []
      : (() => { const ctx = buildPromptContext(request, resources.cardDetailIndex); return [...ctx.orderedStack, ...ctx.populatedZones.flatMap((z) => z.items)]; })();
    const cardKey = [...new Set(cards.map((k) => k.name))].sort().join("|");
    const deciding = [...new Set(c.expected?.decidingRuleIds ?? [])];
    const group = set === "corpus"
      ? `corpus:${c.id.replace(/-in-depth$/, "")}`
      : `suite:${cardKey || c.id}`;
    rows.push({ id: c.id, set, group, alt: set === "corpus" ? `corpus2:${cardKey}#${[...deciding].sort().join(",")}` : null, half: set === "suite" ? half(c.id) : "corpus", hard: set === "suite" && hardIds.has(c.id), query, deciding, positives: deciding.filter((id) => idSet.has(id)), negs: hnegs(order, deciding) });
  }
}
// union-find over group + alt keys
const parent = new Map();
const find = (x) => { while (parent.get(x) !== x) { parent.set(x, parent.get(parent.get(x))); x = parent.get(x); } return x; };
const union = (a, b) => { for (const k of [a, b]) if (!parent.has(k)) parent.set(k, k); parent.set(find(a), find(b)); };
for (const r of rows) { union(r.group, r.group); if (r.alt && !r.alt.startsWith("corpus2:#")) union(r.group, r.alt); }
const groups = new Map();
for (const r of rows) { const g = find(r.group); if (!groups.has(g)) groups.set(g, []); groups.get(g).push(r); }
// balanced assignment: largest groups first, to the fold with fewest citations (ties by hash)
const hash = (s) => createHash("sha256").update(s).digest().readUInt32BE(0);
const gl = [...groups.entries()].sort((a, b) => b[1].length - a[1].length || hash(a[0]) - hash(b[0]));
const load = [0, 0, 0, 0, 0];
for (const [, rs] of gl) {
  const w = rs.reduce((s, r) => s + Math.max(1, r.deciding.length), 0);
  const f = load.indexOf(Math.min(...load));
  load[f] += w;
  for (const r of rs) r.fold = f;
}
writeFileSync(`${OUT}/cases.jsonl`, rows.map((r) => JSON.stringify(r)).join("\n") + "\n");

// ---- rule-book examples -----------------------------------------------------------------------------
const exRows = [];
for (const e of index) {
  const lines = e.text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const m = /^\s*Example:\s*(.*)$/.exec(lines[i]);
    if (!m || m[1].length < 20) continue;
    const query = m[1].trim();
    const doc = docText(e, lines.filter((_, j) => j !== i).join("\n"));
    const v = await embedder.embed(query);
    const cos = prodEmb.ruleIds.map((id, k) => [id, R.cosineSimilarity(v, prodEmb.vectors[k])]).sort((a, b) => b[1] - a[1]).map((x) => x[0]);
    exRows.push({ ruleId: e.ruleId, query, doc, negs: hnegs(cos.slice(0, 60), [e.ruleId]) });
  }
}
writeFileSync(`${OUT}/examples.jsonl`, exRows.map((r) => JSON.stringify(r)).join("\n") + "\n");

const by = (f) => rows.filter(f);
console.log(`questions: suite ${by((r) => r.set === "suite").length}, corpus ${by((r) => r.set === "corpus").length}; skipped ${skipped}`);
console.log(`citations: suite ${by((r) => r.set === "suite").reduce((s, r) => s + r.deciding.length, 0)}, corpus ${by((r) => r.set === "corpus").reduce((s, r) => s + r.deciding.length, 0)}; positives in the rule index: ${rows.reduce((s, r) => s + r.positives.length, 0)}`);
console.log(`groups ${groups.size} (largest ${gl[0][1].length}); fold citation load ${load.join(" / ")}`);
for (let f = 0; f < 5; f++) console.log(`  fold ${f}: suite ${by((r) => r.fold === f && r.set === "suite").length} q, corpus ${by((r) => r.fold === f && r.set === "corpus").length} q, hard25 ${by((r) => r.fold === f && r.hard).length}`);
console.log(`rule-book examples: ${exRows.length} pairs over ${new Set(exRows.map((r) => r.ruleId)).size} rules`);
