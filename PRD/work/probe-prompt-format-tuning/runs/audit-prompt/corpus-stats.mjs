// Free, local (no model call): section-size and framing stats for the production prompt of every
// non-rejected corpus worked-solution case. Counts only; writes corpus-stats.json next to this file.
// Usage (from .worktrees/probe-pft): EMBEDDING_PROVIDER=local npx tsx <this file>
import { writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const REPO = "/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/probe-pft";
const OUT = "/Users/chrismiho/Coding/Projects/TheJudge/PRD/work/probe-prompt-format-tuning/runs/audit-prompt";
const imp = (rel) => import(pathToFileURL(`${REPO}/${rel}`).href);
const fid = await imp("scripts/lib/prompt-fidelity.mjs");
const gold = await imp("scripts/lib/gold-cases.mjs");
const { preparePromptInput, buildRetrievalQueryText } = await imp("apps/backend/src/prompt/preparation.ts");
const { askAiRequestSchema } = await imp("apps/backend/src/validation/askAiRequest.ts");

if (fid.resolveEmbeddingProviderMode(process.env) !== "local") throw new Error("EMBEDDING_PROVIDER is not local");
const resources = await fid.loadPromptResources({ env: process.env });
const embedder = await fid.buildEmbedder(process.env);
if (embedder.mode !== "local") throw new Error("not local");
const ruleText = new Map(resources.gameRulesRuleIndex.map((e) => [e.ruleId, e.text]));

const cases = (await gold.loadGoldCases(gold.CASES_DIR)).filter((c) => c.review.status !== "rejected");
const rows = [];
let skipped = 0;
for (const c of cases) {
  const parsed = askAiRequestSchema.safeParse(fid.buildCaseRequest(c));
  if (!parsed.success) { skipped++; continue; }
  const request = parsed.data;
  const vector = await embedder.embed(buildRetrievalQueryText(request, { cardDetailIndex: resources.cardDetailIndex }));
  fid.assertQueryEmbedded({ mode: embedder.mode, vector, caseId: c.id });
  const p = preparePromptInput(request, { ...resources, supplementalRuleCap: 10, queryEmbedding: vector, collectEnrichmentDebug: true });
  const text = p.promptText;
  const sel = p.enrichmentDebug.supplemental.selected.map((r) => r.ruleId);
  const selSet = new Set(sel);
  const topicRules = new Set(p.enrichmentDebug.curatedGameRules.topics.flatMap((t) => t.ruleNumbers));
  const present = new Set([...sel, ...topicRules]);
  // An excerpt that announces sub-rules / exceptions ("following exception:", "as follows:", ends with ":")
  // while none of its lettered children is present.
  const dangling = [...present].filter((id) => {
    const t = (ruleText.get(id) ?? "").trim();
    if (!/:$|following exceptions?\.?$|as follows:?$/.test(t)) return false;
    return ![...present].some((other) => other !== id && other.startsWith(id) && /[a-z]$/.test(other));
  });
  // "see rule X" pointers inside delivered excerpts where X (or its family) is not delivered.
  let seePointers = 0, seeMissing = 0;
  for (const id of present) {
    for (const m of (ruleText.get(id) ?? "").matchAll(/rules? (\d{3}(?:\.\d+[a-z]?)?)/g)) {
      seePointers++;
      if (![...present].some((x) => x === m[1] || x.startsWith(m[1]))) seeMissing++;
    }
  }
  const rulings = p.enrichmentDebug.rulings.cardsIncluded.reduce((n, x) => n + x.rulingCount, 0);
  const d = p.diagnostics ?? {};
  rows.push({
    id: c.id, mode: request.mode, tier: c.tier, cards: (c.cards ?? []).length, chars: text.length,
    topics: p.enrichmentDebug.curatedGameRules.topicIds.length, rulings,
    rulingsChars: (text.split("OFFICIAL RULINGS (WotC reference)")[1] ?? "").split(/\n(?:COMMANDER SPELLBOOK|SCOPE|CONVERSATION HISTORY|QUESTION)\n/)[0].length,
    gameRulesChars: d.gameRulesSectionChars ?? null, supplementalChars: d.supplementalRulesSectionChars ?? null,
    deciding: c.expected.decidingRuleIds.length,
    decidingPresent: c.expected.decidingRuleIds.filter((x) => present.has(x)).length,
    dangling: dangling.length, danglingIds: dangling, seePointers, seeMissing,
    doubledIds: sel.length
  });
}
const sum = (k, rs = rows) => rs.reduce((n, r) => n + (r[k] ?? 0), 0);
const med = (k, rs = rows) => { const v = rs.map((r) => r[k]).sort((a, b) => a - b); return v[Math.floor(v.length / 2)]; };
const max = (k, rs = rows) => Math.max(...rs.map((r) => r[k]));
const summary = {};
for (const mode of ["lookup", "game"]) {
  const rs = rows.filter((r) => r.mode === mode);
  if (rs.length === 0) continue;
  summary[mode] = {
    cases: rs.length,
    charsMedian: med("chars", rs), charsMax: max("chars", rs),
    topicsMedian: med("topics", rs),
    rulingsMedian: med("rulings", rs), rulingsMax: max("rulings", rs), rulingsCharsMedian: med("rulingsChars", rs), rulingsCharsMax: max("rulingsChars", rs),
    promptsWithDanglingExcerpt: rs.filter((r) => r.dangling > 0).length,
    seePointers: sum("seePointers", rs), seePointersUnresolved: sum("seeMissing", rs),
    decidingTotal: sum("deciding", rs), decidingPresent: sum("decidingPresent", rs)
  };
}
summary.skippedBySchema = skipped;
const danglingFreq = {};
for (const r of rows) for (const id of r.danglingIds) danglingFreq[id] = (danglingFreq[id] ?? 0) + 1;
summary.danglingFreq = danglingFreq;
writeFileSync(`${OUT}/corpus-stats.json`, JSON.stringify({ summary, rows }, null, 2));
console.log(JSON.stringify(summary, null, 2));
