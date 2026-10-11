// Prints the curated topic ids each hard-25 prompt carries (same preparation path as the probe). No suite content here.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
const REPO = "/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/probe-pft";
const SUITE = `${REPO}/output/rulesguru`;
const ids = JSON.parse(readFileSync(`${SUITE}/reports/pft-hard25-verify.json`, "utf8")).final;
const imp = (rel) => import(pathToFileURL(`${REPO}/${rel}`).href);
const evalMod = await imp("scripts/eval-answer-quality.mjs");
const fid = await imp("scripts/lib/prompt-fidelity.mjs");
const gold = await imp("scripts/lib/gold-cases.mjs");
const { preparePromptInput } = await imp("apps/backend/src/prompt/preparation.ts");
const env = evalMod.resolveRunEnv({ processEnv: process.env, confirmed: false });
const all = await gold.loadGoldCases(join(SUITE, "cases"), { external: true });
const cases = ids.map((id) => all.find((c) => c.id === id));
const resources = await fid.loadPromptResources({ env });
const embedder = await fid.buildEmbedder(env);
const vectors = await fid.embedGoldCaseQueries({ goldCases: cases, embedder, cardDetailIndex: resources.cardDetailIndex });
for (const c of cases) {
  const p = preparePromptInput(fid.buildCaseRequest(c), { ...resources, supplementalRuleCap: 10, queryEmbedding: vectors.get(c.id) ?? null, collectEnrichmentDebug: true });
  const cur = p.enrichmentDebug?.curatedGameRules ?? {};
  console.log(c.id, JSON.stringify(cur.topicIds ?? (cur.topics ?? []).map((t) => t.id)));
}
