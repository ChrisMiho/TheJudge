// Free, local probe (no API calls): the corpus's one two-step follow-up (Necropotence + Silence + Borne Upon a Wind).
// Production searches on the follow-up turn alone; this compares that with searching on both turns joined.
// Usage (from .worktrees/probe-pft): EMBEDDING_PROVIDER=local npx tsx <this file>
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
const REPO = "/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/probe-pft";
const imp = (rel) => import(pathToFileURL(`${REPO}/${rel}`).href);
const evalMod = await imp("scripts/eval-answer-quality.mjs");
const fid = await imp("scripts/lib/prompt-fidelity.mjs");
const { preparePromptInput, buildRetrievalQueryText } = await imp("apps/backend/src/prompt/preparation.ts");
const env = evalMod.resolveRunEnv({ processEnv: process.env, confirmed: true });
if (fid.resolveEmbeddingProviderMode(env) !== "local") throw new Error("EMBEDDING_PROVIDER is not local");
const embedder = await fid.buildEmbedder(env);
const resources = await fid.loadPromptResources({ env });
const c = JSON.parse(readFileSync(`${REPO}/apps/backend/src/eval/worked-solutions/necropotence-silence-borne-upon-a-wind-cleanup.case.json`, "utf8"));
const [s1, s2] = c.layers.variants[0].steps;
const deciding = c.expected.decidingRuleIds;
for (const [label, question] of [["turn 1 alone", s1], ["turn 2 alone (production for the follow-up)", s2], ["turn 1 + turn 2 joined", `${s1} ${s2}`]]) {
  const request = { ...fid.buildCaseRequest(c), question };
  const vector = await embedder.embed(buildRetrievalQueryText(request, { cardDetailIndex: resources.cardDetailIndex }));
  fid.assertQueryEmbedded({ mode: embedder.mode, vector, caseId: c.id });
  const p = preparePromptInput(request, { ...resources, queryEmbedding: vector, collectEnrichmentDebug: true, supplementalRuleCap: 100000 });
  const rank = new Map(p.enrichmentDebug.supplemental.selected.map((r, i) => [r.ruleId, i + 1]));
  console.log(`${label}: ${deciding.map((id) => `${id}→${rank.get(id) ?? "curated/none"}`).join(", ")}; top 10 ${p.enrichmentDebug.supplemental.selected.slice(0, 10).map((r) => r.ruleId).join(" ")}`);
}
