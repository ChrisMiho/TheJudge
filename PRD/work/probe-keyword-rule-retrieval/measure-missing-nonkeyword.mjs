// Probe C (keyword-rule-retrieval, 2026-10-07): for the 37 rules-test cases whose
// deciding rule OUTSIDE CR 701/702 never reaches the AI prompt, what does the
// prompt already carry instead? Adapted from measure-missing.mjs (Probe A).
//
// For each case this builds the exact prompt the offline rules gate scores
// (REQ-222: `preparePromptInput` with the committed indexes, the attached cards,
// the case's frozen query vector, production cap of ten) and records:
//   (a) whether each missed rule's text / id is in the prompt (expect no)
//   (b) the case source (authority, pool, tier) and, when ruling-sourced,
//       whether that ruling is in the prompt and its position on its card
//   (c) every ruling of every attached card, flagged in-prompt, for reading
//   (d) System 3 hybrid rank of each missed rule (full ranking, cap 3000), and
//       the same-section / same-family rules that are in the prompt, with ranks
//   (e) curated (System 2) topics selected, and every topic in the data that
//       carries a missed rule or a family member (selected or not)
// plus the question, expected answers, the attached cards' oracle text and the
// System 3 excerpt texts — the raw material for the per-case verdicts.
//
// Offline: committed data, frozen vectors, no network, no model call. Reads the
// code under test by absolute path; writes nothing inside it.
//   cd /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-niche-interaction-rule-tests && \
//     npx tsx /Users/chrismiho/Coding/Projects/TheJudge/PRD/work/probe-keyword-rule-retrieval/measure-missing-nonkeyword.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const ROOT = "/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-niche-interaction-rule-tests";
const HERE = "/Users/chrismiho/Coding/Projects/TheJudge/PRD/work/probe-keyword-rule-retrieval";
const imp = (p) => import(pathToFileURL(`${ROOT}/${p}`).href);

const { buildCaseRequest, loadPromptResources } = await imp("scripts/lib/prompt-fidelity.mjs");
const { loadGoldCases } = await imp("scripts/lib/gold-cases.mjs");
const prep = await imp("apps/backend/src/prompt/preparation.ts");
const { loadFrozenVectors, checkReFreeze } = await imp("apps/backend/src/eval/rules-gate/frozenVectors.ts");
const { loadBaseline } = await imp("apps/backend/src/eval/rules-gate/baseline.ts");
const { askAiRequestSchema } = await imp("apps/backend/src/validation/askAiRequest.ts");
const { MAX_RULINGS_PER_CARD } = await imp("apps/backend/src/prompt/normalization.ts");

const gapCases = JSON.parse(readFileSync(`${HERE}/nonkeyword-gap-cases.json`, "utf8"));
const resources = await loadPromptResources();
const ruleById = new Map(resources.gameRulesRuleIndex.map((r) => [r.ruleId, r]));
const allTopics = resources.gameRulesTopics;
const cases = new Map((await loadGoldCases()).map((c) => [c.id, c]));
const vectors = loadFrozenVectors();
const baseline = loadBaseline();
const DEEP_CAP = 3000;
// Per case: a rule that fits the expected answer better than (or as well as) the
// labelled deciding rule — checked for presence and rank in section (f).
const ALT = {
  "combat-quest-for-pure-flame-divided-damage": ["701.10g", "120.4"],
  "combat-ward-of-piety-redirected-damage": ["614.9"],
  "combat-wicker-warcrawler-counter-after-damage": ["603.7", "511.1"],
  "copies-bloodlord-and-phantasmal-image": ["707.5", "614.1c"],
  "copies-copy-of-permanent-spell-not-created": ["111.13", "608.3f", "707.10f"],
  "copies-null-profusion-and-isochron-scepter": ["108.2", "601.1a"],
  "dfc-modal-double-faced-card-legality": ["712.11c", "601.3e"],
  "layers-hand-size-timestamp-praetors-counsel": ["613.11"],
  "layers-hand-size-timestamp-thought-eater": ["613.11"],
  "necropotence-silence-borne-upon-a-wind-cleanup": ["703.4p", "724.1f"],
  "replacement-byrke-and-branching-evolution": ["614.16"],
  "replacement-crafty-cutpurse-anointed-procession": ["616.1b"],
  "replacement-regenerate-planeswalker-loyalty-zero": ["306.9", "614.8"],
  "triggers-damage-prevented-no-trigger": ["615.6", "120.4b"],
  "triggers-dark-depths-leaves-before-resolving": ["701.21a", "113.7a"],
  "triggers-quagnoth-discard-and-yixlid-jailer": ["113.6k"],
  "triggers-satoru-and-aven-interrupter": ["118.9d"]
};

const collapse = (s) => (s ?? "").replace(/\s+/g, " ").trim();
const norm = (s) => collapse(s).toLowerCase().replace(/[’‘]/g, "'").replace(/[“”]/g, '"');
const out = [];
const log = (s = "") => out.push(s);
const summary = [];

// "614.1a" -> section "614", family "614.1"; "707.2" -> section "707", family "707.2"
const sectionOf = (id) => id.split(".")[0];
const familyOf = (id) => id.replace(/[a-z]$/, "");

log(`Probe C measure-missing-nonkeyword — code under test ${ROOT}`);
log(`MAX_RULINGS_PER_CARD=${MAX_RULINGS_PER_CARD}; cases=${gapCases.length}; full-ranking cap=${DEEP_CAP}; rule index=${resources.gameRulesRuleIndex.length}`);
log("");

for (const [caseId, missedIds] of gapCases) {
  const c = cases.get(caseId);
  if (!c) throw new Error(`no case ${caseId}`);
  const request = askAiRequestSchema.parse(buildCaseRequest(c));
  const freeze = checkReFreeze(c.id, request, resources.cardDetailIndex, vectors);
  if (freeze.state !== "fresh") throw new Error(`${caseId}: vector ${freeze.state}`);
  const opts = { ...resources, queryEmbedding: freeze.vector, collectEnrichmentDebug: true };
  const gate = prep.preparePromptInput(request, { ...opts, supplementalRuleCap: prep.DEFAULT_SUPPLEMENTAL_RULE_CAP });
  const deep = prep.preparePromptInput(request, { ...opts, supplementalRuleCap: DEEP_CAP });
  const sup = gate.enrichmentDebug.supplemental;
  if (sup.usedSemantic !== true) throw new Error(`${caseId}: lexical`);
  const ids10 = sup.selected.map((r) => r.ruleId);
  const idsDeep = deep.enrichmentDebug.supplemental.selected.map((r) => r.ruleId);
  if (JSON.stringify(idsDeep.slice(0, 10)) !== JSON.stringify(ids10)) throw new Error(`${caseId}: deep ranking prefix differs from the cap-10 selection`);
  const topics = gate.enrichmentDebug.curatedGameRules.topics ?? [];
  const topicRules = new Map();
  for (const t of topics) for (const id of t.ruleNumbers) topicRules.set(id, t.id);
  const prompt = gate.promptText;
  const promptN = norm(prompt);
  const b = baseline.cases[caseId];
  const rankOf = (id) => {
    if (topicRules.has(id)) return `topic:${topicRules.get(id)}`;
    const i = idsDeep.indexOf(id);
    return i >= 0 ? `#${i + 1}` : `>${idsDeep.length} (curated-excluded or unscored)`;
  };
  const inPromptRules = [...ids10, ...topicRules.keys()];

  log("=".repeat(100));
  const s = c.source;
  log(`CASE ${caseId}  mode=${request.mode}  tier=${c.tier}  authority=${s.authority}  pool=${s.pool ?? "-"}` +
    `${s.cardName ? `  card=${s.cardName}${s.rulingDate ? ", " + s.rulingDate : ""}` : ""}${s.ruleId ? `  ruleId=${s.ruleId}` : ""}${s.citation ? `  citation=${s.citation}` : ""}`);
  log(`  baseline: hit=${JSON.stringify(b?.hit)} miss=${JSON.stringify(b?.miss)} inTopic=${JSON.stringify(b?.inTopic ?? [])}`);
  log(`  deciding=${JSON.stringify(c.expected.decidingRuleIds)}  missed=${JSON.stringify(missedIds)}  outcome=${c.expected.outcome}`);
  log(`  Q: ${c.question}`);
  log(`  SHORT: ${c.expected.shortAnswer}`);
  log(`  ANSWER: ${collapse(c.expected.answer)}`);
  log(`  WHYHARD: ${collapse(c.whyHard)}`);
  log(`  (e) topics selected: ${topics.map((t) => `${t.id}[${t.ruleNumbers.join(",")}]`).join("; ")}`);
  log(`  prompt chars: ${prompt.length}; combo section present: ${/combo/i.test(prompt) && /COMBO/.test(prompt)}`);
  log(`  System 3 picks (cap 10):`);
  ids10.forEach((id, i) => log(`    #${i + 1} ${id} | ${collapse(ruleById.get(id)?.text).slice(0, 260)}`));

  const row = { caseId, missed: missedIds, authority: s.authority, pool: s.pool ?? "-", tier: c.tier };

  // (a) + (d) + (e) per missed rule
  row.rules = missedIds.map((id) => {
    const rule = ruleById.get(id);
    const body = rule ? rule.text.replace(/^\S+\s/, "") : "";
    const textIn = rule ? promptN.includes(norm(body)) : false;
    const idIn = new RegExp(`\\b${id.replace(/\./g, "\\.")}\\b`).test(prompt);
    const rank = rankOf(id);
    log(`  (a) ${id} text in prompt: ${textIn}; id string in prompt: ${idIn}   (d) System 3 rank: ${rank}`);
    log(`      rule text: ${collapse(rule?.text)}`);
    // same family (614.1, 614.1a, 614.1b ...) and parents, ranked
    const fam = familyOf(id);
    const famRules = resources.gameRulesRuleIndex.filter((r) => r.ruleId !== id && (r.ruleId === fam || (familyOf(r.ruleId) === fam && /^[0-9]+\.[0-9]+[a-z]?$/.test(r.ruleId))));
    for (const p of rule?.parentRuleIds ?? []) log(`      parent ${p} in prompt: ${inPromptRules.includes(p)}; rank ${rankOf(p)}`);
    for (const f of famRules) {
      log(`      family ${f.ruleId} in prompt: ${inPromptRules.includes(f.ruleId)}; rank ${rankOf(f.ruleId)} | ${collapse(f.text).slice(0, 220)}`);
    }
    // same section in the prompt (e.g. any 614.x)
    const sec = sectionOf(id);
    const secIn = inPromptRules.filter((x) => sectionOf(x) === sec && x !== id);
    log(`      same section ${sec}.x in prompt: ${secIn.map((x) => `${x}(${rankOf(x)})`).join(", ") || "none"}`);
    // every topic in the data that carries this rule or a family member
    const carriers = allTopics.filter((t) => t.ruleNumbers.some((n) => n === id || familyOf(n) === fam || n === fam));
    log(`      topics carrying ${id}/family: ${carriers.map((t) => `${t.id}${topics.some((x) => x.id === t.id) ? "(SELECTED)" : "(not selected)"}[${t.ruleNumbers.filter((n) => n === id || familyOf(n) === fam || n === fam).join(",")}]`).join("; ") || "none"}`);
    return { id, textIn, idIn, rank, famIn: famRules.filter((f) => inPromptRules.includes(f.ruleId)).map((f) => `${f.ruleId}(${rankOf(f.ruleId)})`), secIn: secIn.map((x) => `${x}(${rankOf(x)})`), carriers: carriers.map((t) => t.id) };
  });

  // cards
  for (const card of c.cards) {
    const detail = resources.cardDetailIndex.get(card.oracleId);
    const oracle = detail?.oracleText ?? "";
    log(`  CARD ${card.name} type=${detail?.typeLine ?? "?"} keywords=${JSON.stringify(detail?.keywords ?? [])} oracleInPrompt=${promptN.includes(norm(oracle))}`);
    log(`    ORACLE: ${collapse(oracle)}`);
  }

  // (b) source ruling
  const attached = new Set(c.cards.map((x) => x.oracleId));
  row.sourceRuling = "n/a";
  let srcKey = null;
  if (s.authority === "wotc-card-ruling") {
    const srcOracle = s.oracleId;
    const rulings = resources.cardRulingsIndex.get(srcOracle) ?? [];
    const target = norm(c.expected.answer);
    let idx = rulings.findIndex((r) => norm(r.comment) === target);
    let how = "exact";
    if (idx < 0) {
      idx = rulings.findIndex((r) => norm(r.comment).includes(target) || target.includes(norm(r.comment)));
      how = "contains";
    }
    if (idx < 0) {
      const words = new Set(target.split(/\W+/).filter((w) => w.length > 3));
      let best = -1, bestScore = 0;
      rulings.forEach((r, i) => {
        if (s.rulingDate && r.publishedAt !== s.rulingDate) return;
        const ws = norm(r.comment).split(/\W+/).filter((w) => w.length > 3);
        const score = ws.filter((w) => words.has(w)).length / Math.max(1, words.size);
        if (score > bestScore) { bestScore = score; best = i; }
      });
      if (bestScore >= 0.5) { idx = best; how = `overlap ${bestScore.toFixed(2)}`; }
    }
    if (idx < 0) {
      row.sourceRuling = "not found";
      log(`  (b) source ruling: NOT FOUND among ${rulings.length} rulings of ${s.cardName} (attached=${attached.has(srcOracle)})`);
    } else {
      const r = rulings[idx];
      const inPrompt = promptN.includes(norm(`- ${r.publishedAt}: ${r.comment}`));
      const capped = idx >= MAX_RULINGS_PER_CARD;
      row.sourceRuling = inPrompt ? `yes #${idx + 1}/${rulings.length}` : capped ? "no (cap)" : attached.has(srcOracle) ? "no" : "no (card not attached)";
      srcKey = `${srcOracle}#${idx}`;
      log(`  (b) source ruling #${idx + 1}/${rulings.length} of ${s.cardName} (${how}); attached=${attached.has(srcOracle)}; in prompt=${inPrompt}; beyond cap=${capped}`);
      log(`      "${r.publishedAt}: ${collapse(r.comment)}"`);
    }
  } else if (s.authority === "wotc-comprehensive-rules") {
    const r = ruleById.get(s.ruleId);
    const ex = (r?.text ?? "").split(/\nExample:/).slice(1).map((e) => collapse(e));
    log(`  (b) source is CR ${s.ruleId} worked example; example text in prompt: ${ex.map((e) => promptN.includes(norm(e))).join(",") || "none"}`);
    row.sourceRuling = "n/a (CR example)";
  } else {
    log(`  (b) source: ${s.authority} ${s.citation ?? ""}`);
    row.sourceRuling = "n/a (derived)";
  }

  // (c) every ruling of every attached card, flagged
  for (const card of c.cards) {
    const rulings = resources.cardRulingsIndex.get(card.oracleId) ?? [];
    const nIn = rulings.filter((r) => promptN.includes(norm(`- ${r.publishedAt}: ${r.comment}`))).length;
    log(`  RULINGS ${card.name}: ${rulings.length} total, ${nIn} in prompt`);
    rulings.forEach((r, i) => {
      const inP = promptN.includes(norm(`- ${r.publishedAt}: ${r.comment}`));
      const mark = srcKey === `${card.oracleId}#${i}` ? " [SOURCE]" : "";
      log(`    ${i + 1}.${inP ? "" : " [NOT IN PROMPT]"}${mark} ${r.publishedAt}: ${collapse(r.comment)}`);
    });
  }
  // (f) where the deciding-rule label looks off: the better-fitting rule, in the prompt or ranked
  for (const alt of ALT[caseId] ?? []) {
    const r = ruleById.get(alt);
    log(`  (f) alternative deciding rule ${alt} in prompt: ${inPromptRules.includes(alt)}; rank ${rankOf(alt)} | ${collapse(r?.text).slice(0, 240)}`);
  }
  // (g) colon-ending stem rules among the System 3 picks ("subject to the following exception:")
  for (const id of ids10) {
    const t = (ruleById.get(id)?.text ?? "").trim();
    if (/:$/.test(t)) {
      const kids = resources.gameRulesRuleIndex.filter((x) => familyOf(x.ruleId) === id && x.ruleId !== id).map((x) => `${x.ruleId}(${rankOf(x.ruleId)})`);
      log(`  (g) System 3 pick ${id} is a colon-ending stem; its lettered children: ${kids.join(", ") || "none"}`);
      row.stems = [...(row.stems ?? []), id];
    }
  }
  // (h) REQ-179 counterfactual: a missed rule excluded only because a curated topic
  //     carries its PARENT (whose topic excerpt holds the parent's own sentence, not the
  //     children). Re-rank with exclusion limited to the exact curated ids.
  const curatedSet = new Set(topicRules.keys());
  const blocked = missedIds.filter((id) => !curatedSet.has(id) && (ruleById.get(id)?.parentRuleIds ?? []).some((p) => curatedSet.has(p)));
  if (blocked.length) {
    const exactOnlyIndex = resources.gameRulesRuleIndex.map((r) => ({ ...r, parentRuleIds: r.parentRuleIds.filter((p) => !curatedSet.has(p)) }));
    const cf = prep.preparePromptInput(request, { ...opts, gameRulesRuleIndex: exactOnlyIndex, supplementalRuleCap: DEEP_CAP });
    const cfIds = cf.enrichmentDebug.supplemental.selected.map((r) => r.ruleId);
    const cf10 = cfIds.slice(0, 10);
    for (const id of blocked) {
      const i = cfIds.indexOf(id);
      log(`  (h) ${id} is excluded by REQ-179 (curated parent ${(ruleById.get(id)?.parentRuleIds ?? []).filter((p) => curatedSet.has(p)).join(",")} — topic excerpt carries only the parent sentence). Exact-id-only exclusion rank: ${i >= 0 ? "#" + (i + 1) : "unranked"}`);
    }
    log(`      exact-id-only top 10 would be: ${cf10.join(", ")}`);
    row.cf = blocked.map((id) => `${id}:#${cfIds.indexOf(id) + 1}`);
  }
  summary.push(row);
  log("");
}

// REQ-179 reach: how many index rules the four always-on topics keep out of System 3
// purely as children of a curated parent (their own text is not in the topic excerpt).
{
  const alwaysOn = allTopics.filter((t) => ["stack-and-priority", "targets-basics", "zones-basics", "abilities-trigger-basics"].includes(t.id));
  const ids = new Set(alwaysOn.flatMap((t) => t.ruleNumbers));
  const kids = resources.gameRulesRuleIndex.filter((r) => !ids.has(r.ruleId) && r.parentRuleIds.some((p) => ids.has(p)));
  const excerptText = alwaysOn.map((t) => t.excerpt).join("\n");
  const kidsInExcerpt = kids.filter((k) => excerptText.includes(k.ruleId));
  log("=".repeat(100));
  log(`REQ-179 reach: the always-on topics (${[...ids].join(",")}) exclude ${kids.length} child rules from System 3 on every lookup prompt; ${kidsInExcerpt.length} of them have their id in the topic excerpt text.`);
  log(`  excluded children: ${kids.map((k) => k.ruleId).join(", ")}`);
}

log("=".repeat(100));
log("SUMMARY  case | tier | authority | pool | missed | rule text in prompt | rank | source ruling in prompt | family in prompt | same section in prompt | topics carrying missed/family");
for (const r of summary) {
  log(`${r.caseId} | ${r.tier} | ${r.authority} | ${r.pool} | ${r.missed.join(",")} | ${r.rules.map((x) => x.textIn).join(",")} | ${r.rules.map((x) => x.rank).join(",")} | ${r.sourceRuling} | ${[...new Set(r.rules.flatMap((x) => x.famIn))].join(",") || "-"} | ${[...new Set(r.rules.flatMap((x) => x.secIn))].join(",") || "-"} | ${[...new Set(r.rules.flatMap((x) => x.carriers))].join(",") || "-"}`);
}
const n = (f) => summary.filter(f).length;
log("");
log(`missed rule text in prompt: ${n((r) => r.rules.some((x) => x.textIn))}/${summary.length}`);
log(`source ruling in prompt: ${n((r) => r.sourceRuling.startsWith("yes"))}/${n((r) => !r.sourceRuling.startsWith("n/a"))} card-ruling-sourced cases`);
log(`authorities: ${JSON.stringify(summary.reduce((m, r) => ((m[r.authority] = (m[r.authority] ?? 0) + 1), m), {}))}`);
log(`REQ-179 child-exclusion counterfactual (exact-id-only rank): ${summary.filter((r) => r.cf).map((r) => `${r.caseId}: ${r.cf.join(",")}`).join("; ") || "none"}`);
log(`colon-ending stem picks in a top ten: ${summary.filter((r) => r.stems).map((r) => `${r.caseId}: ${r.stems.join(",")}`).join("; ") || "none"}`);
log(`missed rules ranked #11-#20:${summary.flatMap((r) => r.rules.filter((x) => /^#(1[1-9]|20)$/.test(x.rank)).map((x) => `${r.caseId}:${x.id}${x.rank}`)).join(", ") || "none"}`);
writeFileSync(`${HERE}/measure-missing-nonkeyword.out.txt`, out.join("\n") + "\n");
console.log(out.slice(-6).join("\n"));
