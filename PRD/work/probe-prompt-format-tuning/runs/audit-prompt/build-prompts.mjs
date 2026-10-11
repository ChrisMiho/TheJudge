// Free, local (no model call, no paid API): builds the exact prompt production would send for
// corpus worked-solution cases, using production preparePromptInput + the route's inputs
// (card-detail + rulings indexes, combo catalog, local MiniLM query embedding, cap 10).
// Saves both Necropotence prompts, and a section-by-section diff for every case that exists
// in both a Quick Lookup and an In-Depth version.
// Usage (from .worktrees/probe-pft): EMBEDDING_PROVIDER=local npx tsx <this file>
import { writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

const REPO = "/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/probe-pft";
const OUT = "/Users/chrismiho/Coding/Projects/TheJudge/PRD/work/probe-prompt-format-tuning/runs/audit-prompt";
const CAP = 10;
const imp = (rel) => import(pathToFileURL(`${REPO}/${rel}`).href);

const fid = await imp("scripts/lib/prompt-fidelity.mjs");
const gold = await imp("scripts/lib/gold-cases.mjs");
const { preparePromptInput, buildRetrievalQueryText } = await imp("apps/backend/src/prompt/preparation.ts");
const { askAiRequestSchema } = await imp("apps/backend/src/validation/askAiRequest.ts");

if (fid.resolveEmbeddingProviderMode(process.env) !== "local") throw new Error("EMBEDDING_PROVIDER is not local");
const resources = await fid.loadPromptResources({ env: process.env });
if (!resources.comboCatalog) throw new Error("combo catalog not loaded");
const embedder = await fid.buildEmbedder(process.env);
if (embedder.mode !== "local") throw new Error(`embedder ${embedder.mode}`);

const cases = (await gold.loadGoldCases(gold.CASES_DIR)).filter((c) => c.review.status !== "rejected");
const byId = new Map(cases.map((c) => [c.id, c]));
const sha = (s) => createHash("sha256").update(s).digest("hex");

const HEADERS = [
  "SYSTEM ROLE PREAMBLE", "INSTRUCTIONS", "MTG REFERENCE", "GENERAL GAME CONTEXT", "PHASE GUIDANCE",
  "ZONE: STACK (BOTTOM TO TOP)", "ZONE: BATTLEFIELD", "ZONE: HAND", "ZONE: GRAVEYARD", "ZONE: EXILE", "ZONE: LIBRARY", "ZONE: COMMAND",
  "GAME RULES (reference)", "ADDITIONAL RELEVANT RULE EXCERPTS", "CARD (looked up)", "OFFICIAL RULINGS (WotC reference)",
  "COMMANDER SPELLBOOK COMBO CONTEXT — COMMUNITY-SOURCED", "SCOPE", "CONVERSATION HISTORY", "QUESTION"
];
function sections(text) {
  const lines = text.split("\n");
  const out = [];
  let cur = null;
  for (const line of lines) {
    if (HEADERS.includes(line)) { cur = { name: line, chars: 0, lines: [] }; out.push(cur); continue; }
    if (cur) { cur.chars += line.length + 1; cur.lines.push(line); }
  }
  return out;
}
function bucket(secs) {
  const b = {};
  for (const s of secs) {
    const k = s.name.startsWith("ZONE:") ? "ZONES (game state cards)" : s.name;
    b[k] = (b[k] ?? 0) + s.chars;
  }
  return b;
}

async function build(caseEntry) {
  const raw = fid.buildCaseRequest(caseEntry);
  const parsed = askAiRequestSchema.safeParse(raw);
  if (!parsed.success) throw new Error(`${caseEntry.id} rejected by schema`);
  const request = parsed.data;
  const vector = await embedder.embed(buildRetrievalQueryText(request, { cardDetailIndex: resources.cardDetailIndex }));
  fid.assertQueryEmbedded({ mode: embedder.mode, vector, caseId: caseEntry.id });
  const p = preparePromptInput(request, { ...resources, supplementalRuleCap: CAP, queryEmbedding: vector, collectEnrichmentDebug: true });
  if (!p.enrichmentDebug.supplemental.usedSemantic) throw new Error("semantic retrieval did not run");
  const secs = sections(p.promptText);
  const rulingsCount = (p.enrichmentDebug.rulings.cardsIncluded ?? []).reduce((n, c) => n + c.rulingCount, 0);
  return {
    id: caseEntry.id,
    mode: request.mode,
    chars: p.promptText.length,
    hash: sha(p.promptText),
    topics: p.enrichmentDebug.curatedGameRules.topicIds,
    topicRuleIds: p.enrichmentDebug.curatedGameRules.topics.flatMap((t) => t.ruleNumbers),
    supplemental: p.enrichmentDebug.supplemental.selected.map((r) => r.ruleId),
    runnerUp: p.enrichmentDebug.supplemental.runnerUp.map((r) => r.ruleId),
    queryText: p.enrichmentDebug.supplemental.queryText,
    rulingsByCard: p.enrichmentDebug.rulings.cardsIncluded.map((c) => `${c.name}:${c.rulingCount}`),
    rulingsCount,
    sectionChars: bucket(secs),
    deciding: caseEntry.expected.decidingRuleIds,
    promptText: p.promptText
  };
}

const pairs = cases.filter((c) => c.id.endsWith("-in-depth") && byId.has(c.id.replace(/-in-depth$/, "")));
const results = [];
for (const deep of pairs) {
  const quick = byId.get(deep.id.replace(/-in-depth$/, ""));
  const q = await build(quick);
  const d = await build(deep);
  results.push({ quick: q, deep: d });
}

const necro = results.find((r) => r.quick.id === "necropotence-silence-borne-upon-a-wind-cleanup");
writeFileSync(`${OUT}/necropotence-quick-lookup.prompt.txt`, necro.quick.promptText);
writeFileSync(`${OUT}/necropotence-in-depth.prompt.txt`, necro.deep.promptText);

const strip = (r) => { const { promptText, ...rest } = r; return rest; };
writeFileSync(`${OUT}/pairs.json`, JSON.stringify(results.map((r) => ({ quick: strip(r.quick), deep: strip(r.deep) })), null, 2));

const inPrompt = (r, id) => r.supplemental.includes(id) || r.topicRuleIds.includes(id) || r.promptText.includes(`${id} `) || r.promptText.includes(`${id}.`);
for (const { quick: q, deep: d } of results) {
  console.log(`\n== ${q.id}`);
  for (const r of [q, d]) {
    console.log(`  ${r.mode.padEnd(6)} chars=${r.chars} hash=${r.hash.slice(0, 12)} topics=${r.topics.length} rules=${r.supplemental.length} rulings=${r.rulingsCount} [${r.rulingsByCard.join(", ")}]`);
    console.log(`         sections ${JSON.stringify(r.sectionChars)}`);
    console.log(`         deciding in prompt: ${r.deciding.map((id) => `${id}:${inPrompt(r, id) ? "Y" : "n"}`).join(" ")}`);
  }
  const onlyD = d.supplemental.filter((x) => !q.supplemental.includes(x));
  const onlyQ = q.supplemental.filter((x) => !d.supplemental.includes(x));
  console.log(`  rules only In-Depth: ${onlyD.join(" ")} | only Quick: ${onlyQ.join(" ")}`);
  console.log(`  topics only In-Depth: ${d.topics.filter((t) => !q.topics.includes(t)).join(" ")}`);
}
