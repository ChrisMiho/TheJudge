// Probe A (keyword-rule-retrieval, 2026-10-07): for the 63 rules-test cases whose
// deciding keyword / keyword-action rule (CR 701.x / 702.x) does not reach the
// AI prompt, what does the prompt already carry instead?
//
// For each case this builds the exact prompt the offline rules gate scores
// (REQ-222: `preparePromptInput` with the committed indexes, the attached cards,
// the case's frozen query vector, production cap of ten) and records:
//   (a) whether the missed rule's text is in the prompt (expect no)
//   (b) reminder text (parentheticals) in each attached card's oracle text, and
//       whether it names the keyword
//   (c) whether the case's source ruling (wotc-card-ruling: expected.answer is
//       the ruling text verbatim) is in the prompt's rulings section, and
//       whether the per-card ruling cap dropped it
//   (d) the rank System 3 gives the missed rule (hybrid, frozen vector), from the
//       identical ranking with the cap raised to 500 (REQ-190 override)
// plus the question, expected answers, every ruling of the attached cards that
// names the keyword, and the System 2 topic ids — the raw material for the
// per-case verdicts in FINDINGS-missing.md.
//
// Offline: committed data, frozen vectors, no network, no model call. Reads the
// code under test by absolute path; writes nothing inside it.
//   cd /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-niche-interaction-rule-tests && \
//     npx tsx /Users/chrismiho/Coding/Projects/TheJudge/PRD/work/probe-keyword-rule-retrieval/measure-missing.mjs
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

const gapCases = JSON.parse(readFileSync(`${HERE}/keyword-gap-cases.json`, "utf8"));
const resources = await loadPromptResources();
const ruleById = new Map(resources.gameRulesRuleIndex.map((r) => [r.ruleId, r]));
const cases = new Map((await loadGoldCases()).map((c) => [c.id, c]));
const vectors = loadFrozenVectors();
const baseline = loadBaseline();

// Keyword stem per missed rule, for matching reminder text and rulings.
const STEM = {
  "702.64a": /absorb/i, "701.2a": /activat/i, "702.41a": /affinity/i, "701.47a": /amass/i,
  "702.38a": /amplif/i, "702.22a": /band/i, "701.4a": /behold/i, "701.68a": /blight/i,
  "701.5a": /\bcast/i, "702.72a": /champion/i, "701.30a": /clash/i, "702.16a": /protection/i,
  "702.16b": /protection/i, "702.114a": /devoid|colorless/i, "701.50a": /conniv/i, "701.7a": /creat/i,
  "702.24a": /cumulative upkeep|age counter/i, "702.29a": /cycl/i, "702.145a": /daybound|nightbound|\bday\b|\bnight\b/i,
  "702.2a": /deathtouch/i, "702.3a": /defender/i, "701.35a": /detain/i, "701.27a": /transform/i,
  "702.5a": /enchant\b/i, "702.50a": /\bepic\b/i, "702.6a": /\bequip/i, "702.83a": /exalted/i,
  "701.44a": /explor/i, "701.55a": /villainous/i, "702.32a": /fade|fading/i, "702.36a": /\bfear\b/i,
  "702.7a": /first strike/i, "702.9a": /flying/i, "702.68a": /frenzy/i, "702.58a": /graft/i,
  "702.106a": /hidden agenda|named card|name a card/i, "702.90a": /infect/i, "702.13a": /intimidate/i,
  "701.40a": /manifest/i, "702.187a": /mayhem/i, "701.42a": /\bmeld/i, "702.121a": /\bmelee/i,
  "702.111a": /menace/i, "701.17a": /\bmill/i, "702.49a": /ninjutsu/i, "702.48a": /offering/i,
  "701.18a": /\bplay/i, "702.160a": /prototype/i, "702.17a": /\breach\b/i, "702.77a": /reinforce/i,
  "701.19a": /regenerat/i, "702.60a": /ripple/i, "701.22a": /\bscry/i, "701.24a": /shuffl/i,
  "702.118a": /skulk/i, "702.95a": /soulbond|pair/i, "701.26a": /\b(un)?tap/i, "702.164a": /toxic|poison/i,
  "701.9a": /discard/i, "701.11a": /tripl/i, "702.125a": /undaunted/i, "701.49a": /ventur|dungeon/i,
  "702.159a": /\bvisit/i
};

const collapse = (s) => (s ?? "").replace(/\s+/g, " ").trim();
const norm = (s) => collapse(s).toLowerCase().replace(/[’‘]/g, "'").replace(/[“”]/g, '"');
const out = [];
const log = (s = "") => out.push(s);
const summary = [];

log(`Probe A measure-missing — code under test ${ROOT}`);
log(`MAX_RULINGS_PER_CARD=${MAX_RULINGS_PER_CARD}; cases=${gapCases.length}`);
log("");

for (const [caseId, missedIds] of gapCases) {
  const c = cases.get(caseId);
  if (!c) throw new Error(`no case ${caseId}`);
  const request = askAiRequestSchema.parse(buildCaseRequest(c));
  const freeze = checkReFreeze(c.id, request, resources.cardDetailIndex, vectors);
  if (freeze.state !== "fresh") throw new Error(`${caseId}: vector ${freeze.state}`);
  const opts = { ...resources, queryEmbedding: freeze.vector, collectEnrichmentDebug: true };
  const gate = prep.preparePromptInput(request, { ...opts, supplementalRuleCap: prep.DEFAULT_SUPPLEMENTAL_RULE_CAP });
  const deep = prep.preparePromptInput(request, { ...opts, supplementalRuleCap: 500 });
  const sup = gate.enrichmentDebug.supplemental;
  if (sup.usedSemantic !== true) throw new Error(`${caseId}: lexical`);
  const ids10 = sup.selected.map((r) => r.ruleId);
  const idsDeep = deep.enrichmentDebug.supplemental.selected.map((r) => r.ruleId);
  if (JSON.stringify(idsDeep.slice(0, 10)) !== JSON.stringify(ids10)) throw new Error(`${caseId}: deep ranking prefix differs from the cap-10 selection`);
  const topics = gate.enrichmentDebug.curatedGameRules.topics ?? [];
  const topicRules = new Set(topics.flatMap((t) => t.ruleNumbers));
  const prompt = gate.promptText;
  const promptN = norm(prompt);
  const b = baseline.cases[caseId];

  log("=".repeat(100));
  log(`CASE ${caseId}  mode=${request.mode}  tier=${c.tier}  source=${c.source.authority}${c.source.cardName ? ` (${c.source.cardName}${c.source.rulingDate ? ", " + c.source.rulingDate : ""})` : ""}`);
  log(`  baseline: hit=${JSON.stringify(b?.hit)} miss=${JSON.stringify(b?.miss)} inTopic=${JSON.stringify(b?.inTopic ?? [])}`);
  log(`  deciding=${JSON.stringify(c.expected.decidingRuleIds)}  outcome=${c.expected.outcome}`);
  log(`  Q: ${c.question}`);
  log(`  SHORT: ${c.expected.shortAnswer}`);
  log(`  ANSWER: ${c.expected.answer}`);
  log(`  topics: ${topics.map((t) => t.id).join(", ")}`);
  log(`  System 3 picks: ${ids10.join(", ")}`);
  log(`  prompt chars: ${prompt.length}`);

  const row = { caseId, missed: missedIds, mode: request.mode };
  // (a) + (d)
  row.rules = missedIds.map((id) => {
    const rule = ruleById.get(id);
    const textIn = rule ? promptN.includes(norm(rule.text.replace(/^\S+\s/, ""))) : false;
    const idIn = new RegExp(`\\b${id.replace(/\./g, "\\.")}\\b`).test(prompt);
    const rank = idsDeep.indexOf(id);
    const rankLabel = topicRules.has(id) ? "curated" : rank >= 0 ? `#${rank + 1}` : `>${idsDeep.length}`;
    log(`  (a) ${id} text in prompt: ${textIn}; id string in prompt: ${idIn}  (d) System 3 rank: ${rankLabel}`);
    log(`      rule text: ${rule?.text}`);
    // sibling sub-rules (b, c, ...) of the same family: in the prompt?
    const fam = id.replace(/[a-z]$/, "");
    const sibs = resources.gameRulesRuleIndex.filter((r) => r.ruleId.startsWith(fam) && /^[0-9.]+[a-z]?$/.test(r.ruleId) && r.ruleId !== id && r.ruleId.replace(/[a-z]$/, "") === fam);
    for (const s of sibs) {
      const sRank = idsDeep.indexOf(s.ruleId);
      log(`      sibling ${s.ruleId} in S3 top10: ${ids10.includes(s.ruleId)}; in topic: ${topicRules.has(s.ruleId)}; rank ${sRank >= 0 ? "#" + (sRank + 1) : "-"} | ${s.text.slice(0, 300)}`);
    }
    const sibsIn = sibs.filter((s) => ids10.includes(s.ruleId) || topicRules.has(s.ruleId)).map((s) => s.ruleId);
    return { id, textIn, idIn, rank: rankLabel, sibsIn };
  });

  // (b) reminder text
  const stem = STEM[missedIds[0]];
  row.reminder = [];
  for (const card of c.cards) {
    const detail = resources.cardDetailIndex.get(card.oracleId);
    const oracle = detail?.oracleText ?? "";
    const inPrompt = promptN.includes(norm(oracle));
    log(`  CARD ${card.name} keywords=${JSON.stringify(detail?.keywords ?? [])} oracleInPrompt=${inPrompt}`);
    log(`    ORACLE: ${collapse(oracle)}`);
    const parens = [...oracle.matchAll(/\([^()]*\)/g)];
    for (const m of parens) {
      const p = m[0];
      // The reminder belongs to the keyword when the keyword is named inside it,
      // or in the text it is attached to (back to the previous line break / sentence end).
      // (a reminder may follow its keyword's own sentence: "Scry 2. (Look at ...)")
      const before = oracle.slice(0, m.index).replace(/[\s.]+$/, "").split(/[\n.]/).pop() ?? "";
      const names = stem.test(p) || stem.test(before);
      log(`    (b) reminder${names ? " [FOR KEYWORD]" : ""}: ${before.trim() ? `[after "${before.trim()}"] ` : ""}${p}`);
      if (names && inPrompt) row.reminder.push(`${card.name}: ${p}`);
    }
    if (!parens.length) log(`    (b) no reminder text`);
  }

  // (c) source ruling + keyword rulings
  const attached = new Set(c.cards.map((x) => x.oracleId));
  row.sourceRuling = "n/a";
  if (c.source.authority === "wotc-card-ruling") {
    const srcOracle = c.source.oracleId;
    const rulings = resources.cardRulingsIndex.get(srcOracle) ?? [];
    const target = norm(c.expected.answer);
    let idx = rulings.findIndex((r) => norm(r.comment) === target);
    let how = "exact";
    if (idx < 0) {
      idx = rulings.findIndex((r) => norm(r.comment).includes(target) || target.includes(norm(r.comment)));
      how = "contains";
    }
    if (idx < 0 && c.source.rulingDate) {
      // fall back: best word overlap among rulings on the stated date
      const words = new Set(target.split(/\W+/).filter((w) => w.length > 3));
      let best = -1, bestScore = 0;
      rulings.forEach((r, i) => {
        if (r.publishedAt !== c.source.rulingDate) return;
        const ws = norm(r.comment).split(/\W+/).filter((w) => w.length > 3);
        const score = ws.filter((w) => words.has(w)).length / Math.max(1, words.size);
        if (score > bestScore) { bestScore = score; best = i; }
      });
      if (bestScore >= 0.5) { idx = best; how = `overlap ${bestScore.toFixed(2)}`; }
    }
    if (idx < 0) {
      row.sourceRuling = "not found in committed rulings";
      log(`  (c) source ruling: NOT FOUND among ${rulings.length} rulings of ${c.source.cardName} (attached=${attached.has(srcOracle)})`);
    } else {
      const r = rulings[idx];
      const inPrompt = promptN.includes(norm(`- ${r.publishedAt}: ${r.comment}`));
      const capped = idx >= MAX_RULINGS_PER_CARD;
      row.sourceRuling = inPrompt ? "yes" : capped ? "no (cap)" : attached.has(srcOracle) ? "no" : "no (card not attached)";
      log(`  (c) source ruling #${idx + 1}/${rulings.length} of ${c.source.cardName} (${how}); attached=${attached.has(srcOracle)}; in prompt=${inPrompt}; beyond cap=${capped}`);
      log(`      "${r.publishedAt}: ${collapse(r.comment)}"`);
    }
  } else {
    log(`  (c) source not a card ruling: ${c.source.authority} ${c.source.type ?? ""} ${c.source.ruleId ?? ""}`);
  }
  for (const card of c.cards) {
    const rulings = resources.cardRulingsIndex.get(card.oracleId) ?? [];
    const kw = rulings.filter((r) => stem.test(r.comment));
    log(`  RULINGS ${card.name}: ${rulings.length} total, ${kw.length} name the keyword`);
    for (const r of kw) log(`    - ${r.publishedAt}: ${collapse(r.comment)}`);
  }
  summary.push(row);
  log("");
}

log("=".repeat(100));
log("SUMMARY  case | missed | rule text in prompt | rank | keyword reminder text in prompt | source ruling in prompt | same-family sub-rules in prompt");
for (const r of summary) {
  const sibs = [...new Set(r.rules.flatMap((x) => x.sibsIn))].filter((id) => !r.missed.includes(id));
  log(`${r.caseId} | ${r.missed.join(",")} | ${r.rules.map((x) => x.textIn).join(",")} | ${r.rules.map((x) => x.rank).join(",")} | ${r.reminder.length ? "yes" : "no"} | ${r.sourceRuling} | ${sibs.join(",") || "-"}`);
}
log(`cases with a same-family sub-rule of the missed rule in the prompt: ${summary.filter((r) => r.rules.some((x) => x.sibsIn.some((id) => !r.missed.includes(id)))).length}/${summary.length}`);
const n = (f) => summary.filter(f).length;
log("");
log(`missed rule text in prompt: ${n((r) => r.rules.some((x) => x.textIn))}/${summary.length}`);
log(`keyword reminder text in prompt:${n((r) => r.reminder.length > 0)}/${summary.length}`);
log(`source ruling in prompt: ${n((r) => r.sourceRuling === "yes")}/${n((r) => r.sourceRuling !== "n/a")} card-ruling-sourced cases`);
writeFileSync(`${HERE}/measure-missing.out.txt`, out.join("\n") + "\n");
console.log(out.slice(-8).join("\n"));
