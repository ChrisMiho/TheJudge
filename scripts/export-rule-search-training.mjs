// REQ-236: exports the training material for the Magic-trained search model. Owner-run, local, never in
// CI: it reads the practice suite (a git-ignored local folder), so it is not part of `npm test` or
// `npm run quality:check`.
//
// Writes only under a git-ignored folder (default output/rule-search-model/data/):
//   cases.jsonl     practice and corpus questions: the retrieval query the SHIPPED query builder makes, less the
//                   search-only concept-map entries (REQ-234)
//                   (question, card signal, concept terms, In-Depth turn step: REQ-178, 233, 234), the
//                   deciding rules, a fold, the tuning/check half, the hard-25 flag, and hard negatives
//                   (the shipped search's top 40 that are not deciding, whole rule family removed)
//   examples.jsonl  the rule book's `Example:` passages, each paired with the rule it illustrates (the
//                   example is stripped from that rule's text for that pair), with hard negatives from
//                   the committed rule vectors
//   rules.json      ruleId -> the production embedding text `${sectionTitle}: ${text}` sliced to 2,000
//
// Folds: 5, grouped so near-duplicates share a fold (a corpus case's Quick Lookup and In-Depth versions,
// corpus cases with the same cards and deciding rules, practice questions with the same card set).
// Prints counts only: never a question, an answer, a card list or an id.
//
//   EMBEDDING_PROVIDER=local npx tsx scripts/export-rule-search-training.mjs \
//     [--suite output/practice-suite] [--out output/rule-search-model/data] [--hard25 output/rule-search-eval/hard25.json]
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const arg = (key, fallback) => (args.includes(key) ? args[args.indexOf(key) + 1] : fallback);
const SUITE = resolve(arg("--suite", join(REPO, "output/practice-suite")));
const OUT = resolve(arg("--out", join(REPO, "output/rule-search-model/data")));
const HARD25 = resolve(arg("--hard25", join(REPO, "output/rule-search-eval/hard25.json")));
const NEGATIVES_PER_PAIR = 30;
const SEARCH_DEPTH = 40;

// Training material may only be written to a git-ignored folder (the repository is public).
mkdirSync(OUT, { recursive: true });
const ignored = spawnSync("git", ["check-ignore", "-q", join(OUT, "probe.json")], { cwd: REPO });
if (ignored.status !== 0) throw new Error(`${OUT} is not git-ignored; refusing to write training data there.`);

const imp = (rel) => import(pathToFileURL(join(REPO, rel)).href);
const { resolveRunEnv } = await imp("scripts/lib/run-env.mjs");
const fid = await imp("scripts/lib/prompt-fidelity.mjs");
const sg = await imp("scripts/lib/practice-suite.mjs");
const { loadGoldCases } = await imp("scripts/lib/gold-cases.mjs");
const { preparePromptInput, buildRetrievalQueryText } = await imp("apps/backend/src/prompt/preparation.ts");
const { buildPromptContext, buildLookupPromptContext } = await imp("apps/backend/src/prompt/context.ts");
const { askAiRequestSchema } = await imp("apps/backend/src/validation/askAiRequest.ts");
const R = await imp("apps/backend/src/gameRulesRetrieval.ts");
// REQ-234 / REQ-236: training questions, their hard negatives and their curated topics are built without the
// search-only concept-map entries, so a retrain cannot learn to ignore those entries' words.
(await imp("apps/backend/src/gameRulesConceptMap.ts")).turnOffSearchOnlyEntriesForTraining();

const env = resolveRunEnv({ processEnv: process.env, confirmed: true });
if (fid.resolveEmbeddingProviderMode(env) !== "local") throw new Error("EMBEDDING_PROVIDER is not local");
const embedder = await fid.buildEmbedder(env);
if (embedder.mode !== "local") throw new Error(`embedder mode ${embedder.mode}`);
const resources = await fid.loadPromptResources({ env });
const index = resources.gameRulesRuleIndex;
const idSet = new Set(index.map((entry) => entry.ruleId));
const committedVectors = R.loadGameRulesRuleEmbeddings(join(REPO, "apps/backend/data/gameRulesRuleEmbeddings.json"));

const documentText = (entry, text = entry.text) => `${entry.sectionTitle}: ${text}`.slice(0, 2000);
writeFileSync(join(OUT, "rules.json"), JSON.stringify(Object.fromEntries(index.map((entry) => [entry.ruleId, documentText(entry)]))));

const family = (id) => (/^(\d{3}\.\d+)/.exec(id) ?? [])[1] ?? id;
const half = (id) => (createHash("sha256").update(`pft-split-1:${id}`).digest()[0] % 2 === 0 ? "tuning" : "check");
const hardIds = new Set(existsSync(HARD25) ? JSON.parse(readFileSync(HARD25, "utf8")).ids : []);
const hardNegatives = (order, deciding) => {
  const families = new Set(deciding.map(family));
  return order.filter((id) => !deciding.includes(id) && !families.has(family(id))).slice(0, NEGATIVES_PER_PAIR);
};

// ---- questions ------------------------------------------------------------------------------------------
const corpusDir = join(REPO, "apps/backend/src/eval/worked-solutions");
const corpus = readdirSync(corpusDir)
  .filter((file) => file.endsWith(".case.json"))
  .map((file) => JSON.parse(readFileSync(join(corpusDir, file), "utf8")))
  .filter((entry) => entry.review?.status !== "rejected");
// The suite lives in the launch checkout; ask git there whether it is ignored (read-only).
sg.assertSuiteIgnored({ suiteDir: SUITE, checkIgnore: (target) => sg.gitCheckIgnore(target, { cwd: dirname(dirname(SUITE)) }) });
// Every selectable question counts, stale or not: a rule-data fix changes snapshot hashes, which would
// otherwise shrink the universe the targets were measured on.
const { selected } = sg.selectSuiteCases(await loadGoldCases(join(SUITE, "cases"), { external: true }), sg.normalizeSuiteFilters(), {
  isStale: () => false
});

const rows = [];
let skipped = 0;
for (const [set, list] of [["suite", selected], ["corpus", corpus]]) {
  for (const entry of list) {
    const parsed = askAiRequestSchema.safeParse(fid.buildCaseRequest(entry));
    if (!parsed.success) {
      skipped++;
      continue;
    }
    const request = parsed.data;
    const query = buildRetrievalQueryText(request, { cardDetailIndex: resources.cardDetailIndex });
    const vector = await embedder.embed(query);
    fid.assertQueryEmbedded({ mode: embedder.mode, vector, caseId: "case" });
    const shipped = preparePromptInput(request, { ...resources, queryEmbedding: vector, collectEnrichmentDebug: true, supplementalRuleCap: SEARCH_DEPTH });
    if (!shipped.enrichmentDebug.supplemental.usedSemantic) throw new Error("semantic retrieval did not run");
    const order = shipped.enrichmentDebug.supplemental.selected.map((rule) => rule.ruleId);
    const cards =
      request.mode === "lookup"
        ? buildLookupPromptContext(request, resources.cardDetailIndex).cards ?? []
        : (() => {
            const context = buildPromptContext(request, resources.cardDetailIndex);
            return [...context.orderedStack, ...context.populatedZones.flatMap((zone) => zone.items)];
          })();
    const cardKey = [...new Set(cards.map((card) => card.name))].sort().join("|");
    const deciding = [...new Set(entry.expected?.decidingRuleIds ?? [])];
    const group = set === "corpus" ? `corpus:${entry.id.replace(/-in-depth$/, "")}` : `suite:${cardKey || entry.id}`;
    rows.push({
      id: entry.id,
      set,
      group,
      alt: set === "corpus" ? `corpus2:${cardKey}#${[...deciding].sort().join(",")}` : null,
      half: set === "suite" ? half(entry.id) : "corpus",
      hard: set === "suite" && hardIds.has(entry.id),
      query,
      deciding,
      positives: deciding.filter((id) => idSet.has(id)),
      negs: hardNegatives(order, deciding)
    });
  }
}

// union-find over group and alt keys
const parent = new Map();
const find = (x) => {
  while (parent.get(x) !== x) {
    parent.set(x, parent.get(parent.get(x)));
    x = parent.get(x);
  }
  return x;
};
const union = (a, b) => {
  for (const key of [a, b]) if (!parent.has(key)) parent.set(key, key);
  parent.set(find(a), find(b));
};
for (const row of rows) {
  union(row.group, row.group);
  if (row.alt && !row.alt.startsWith("corpus2:#")) union(row.group, row.alt);
}
const groups = new Map();
for (const row of rows) {
  const key = find(row.group);
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(row);
}
// balanced assignment: largest groups first, each to the fold with the fewest citations (ties by hash)
const hash = (text) => createHash("sha256").update(text).digest().readUInt32BE(0);
const ordered = [...groups.entries()].sort((a, b) => b[1].length - a[1].length || hash(a[0]) - hash(b[0]));
const load = [0, 0, 0, 0, 0];
for (const [, members] of ordered) {
  const weight = members.reduce((sum, row) => sum + Math.max(1, row.deciding.length), 0);
  const fold = load.indexOf(Math.min(...load));
  load[fold] += weight;
  for (const row of members) row.fold = fold;
}
writeFileSync(join(OUT, "cases.jsonl"), rows.map((row) => JSON.stringify(row)).join("\n") + "\n");

// ---- rule-book examples ------------------------------------------------------------------------------------
const exampleRows = [];
for (const entry of index) {
  const lines = entry.text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const match = /^\s*Example:\s*(.*)$/.exec(lines[i]);
    if (!match || match[1].length < 20) continue;
    const query = match[1].trim();
    const doc = documentText(entry, lines.filter((_, j) => j !== i).join("\n"));
    const vector = await embedder.embed(query);
    const byCosine = committedVectors.ruleIds
      .map((id, k) => [id, R.cosineSimilarity(vector, committedVectors.vectors[k])])
      .sort((a, b) => b[1] - a[1])
      .map((pair) => pair[0]);
    exampleRows.push({ ruleId: entry.ruleId, query, doc, negs: hardNegatives(byCosine.slice(0, 60), [entry.ruleId]) });
  }
}
writeFileSync(join(OUT, "examples.jsonl"), exampleRows.map((row) => JSON.stringify(row)).join("\n") + "\n");

const by = (predicate) => rows.filter(predicate);
console.log(`questions: suite ${by((r) => r.set === "suite").length}, corpus ${by((r) => r.set === "corpus").length}; skipped ${skipped}`);
console.log(
  `citations: suite ${by((r) => r.set === "suite").reduce((s, r) => s + r.deciding.length, 0)}, corpus ${by((r) => r.set === "corpus").reduce((s, r) => s + r.deciding.length, 0)}; positives in the rule index: ${rows.reduce((s, r) => s + r.positives.length, 0)}`
);
console.log(`groups ${groups.size} (largest ${ordered[0][1].length}); fold citation load ${load.join(" / ")}`);
for (let f = 0; f < 5; f++) {
  console.log(
    `  fold ${f}: suite ${by((r) => r.fold === f && r.set === "suite").length} q, corpus ${by((r) => r.fold === f && r.set === "corpus").length} q, hard25 ${by((r) => r.fold === f && r.hard).length}`
  );
}
console.log(`rule-book examples: ${exampleRows.length} pairs over ${new Set(exampleRows.map((row) => row.ruleId)).size} rules`);
