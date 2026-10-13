// Probe B (keyword-rule-retrieval, 2026-10-07): would a direct keyword lookup
// legitimately close the keyword gap, at what prompt cost, without moving any
// existing test?
//
// Candidate: when an attached card's Scryfall `keywords` names a keyword ability
// (CR 702) or keyword action (CR 701), put that keyword's defining rule into the
// prompt as a curated block outside System 3's ten scored slots, its rule ids
// excluded from System 3 exactly like a curated topic (`collectCuratedRuleIds`).
//
//   V1  the family's `a` sub-rule only (plus, for a variant keyword such as
//       Megamorph or Hexproof from, the sub-rule that names the variant)
//   V2  the keyword's whole rule family (702.Xa, b, c, ...)
//   V1f / V2f  the same blocks as "fill": System 3 ranks exactly as today and the
//       block carries only the keyword rules System 3 did not pick (computed from
//       the base run; exact by construction, see the fill section)
//
// Patching: production code is never edited. Each case's keyword block is built
// in memory as synthetic curated topics (one per rule family), appended to the
// loaded topic list, and their ids pushed onto the exported ALWAYS_ON_TOPIC_IDS
// array for that one case only (both lookup and game mode read it), then the
// real `evaluateRulesGate` and `preparePromptInput` run unmodified. Rule ids a
// selected curated topic already carries are not repeated in the block.
//
//   M1  mapping coverage: Scryfall keyword -> rule family, over every distinct keyword
//   M2  rules gate over the whole corpus, base and per variant
//   M3  prompt cost: corpus, single cards over the whole card pool, 5-card boards
//   M4  other suites: context-eval harness (labelled System 3 checks, golden churn),
//       retrieval benchmark, eval:worked-solutions-style System 3 counts
//   M5  the gap cases with no keyword tag: oracle-text triggers and their false-positive load
//
// Offline: committed data, frozen query vectors, no embedder, no network, no model call.
// Run from the worktree (read only, nothing is written there):
//   cd /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-niche-interaction-rule-tests \
//     && npx tsx /Users/chrismiho/Coding/Projects/TheJudge/PRD/work/probe-keyword-rule-retrieval/measure-fix.mjs
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = "/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-niche-interaction-rule-tests";
const PROBE = "/Users/chrismiho/Coding/Projects/TheJudge/PRD/work/probe-keyword-rule-retrieval";

const { buildCaseRequest, loadPromptResources } = await import(ROOT + "/scripts/lib/prompt-fidelity.mjs");
const { loadGoldCases } = await import(ROOT + "/scripts/lib/gold-cases.mjs");
const prep = await import(ROOT + "/apps/backend/src/prompt/preparation.ts");
const gr = await import(ROOT + "/apps/backend/src/gameRulesRetrieval.ts");
const { formatGameRulesSection } = await import(ROOT + "/apps/backend/src/gameRules.ts");
const { ALWAYS_ON_TOPIC_IDS, selectGameRulesTopics } = await import(ROOT + "/apps/backend/src/gameRulesTopicSelection.ts");
const { buildLookupPromptContext, buildPromptContext } = await import(ROOT + "/apps/backend/src/prompt/context.ts");
const { evaluateRulesGate } = await import(ROOT + "/apps/backend/src/eval/rules-gate/rulesGate.ts");
const { loadBaseline } = await import(ROOT + "/apps/backend/src/eval/rules-gate/baseline.ts");
const { loadFrozenVectors, checkReFreeze } = await import(ROOT + "/apps/backend/src/eval/rules-gate/frozenVectors.ts");
const { askAiRequestSchema } = await import(ROOT + "/apps/backend/src/validation/askAiRequest.ts");
const { evaluateSystem3RelevanceChecks } = await import(ROOT + "/apps/backend/src/eval/contextEvaluationHarness.ts");
const { cardDetailIndexFromRequest } = await import(ROOT + "/apps/backend/src/eval/fixtureCardDetail.ts");
const bench = await import(ROOT + "/apps/backend/src/eval/ragRetrievalBenchmark.ts");

const resources = await loadPromptResources();
const index = resources.gameRulesRuleIndex;
const ruleById = new Map(index.map((r) => [r.ruleId, r]));
const cdi = resources.cardDetailIndex;
const cases = await loadGoldCases();
const live = cases.filter((c) => c.review.status !== "rejected");
const vectors = loadFrozenVectors();
const baseline = loadBaseline();
const gapList = JSON.parse(readFileSync(join(PROBE, "keyword-gap-cases.json"), "utf8"));
const keywordGapIds = new Set(gapList.map(([id]) => id));

const pct = (n, d) => `${((100 * n) / d).toFixed(1)}%`;
function quantiles(values) {
  const s = [...values].sort((a, b) => a - b);
  const q = (p) => (s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : 0);
  return { n: s.length, p50: q(0.5), p95: q(0.95), p99: q(0.99), max: s.length ? s[s.length - 1] : 0, mean: s.length ? Math.round(s.reduce((a, b) => a + b, 0) / s.length) : 0 };
}
const fmtQ = (q) => `n=${q.n} p50 ${q.p50} | p95 ${q.p95} | p99 ${q.p99} | max ${q.max} | mean ${q.mean}`;

// ======================================================================= M1 mapping
const norm = (s) =>
  s.toLowerCase().replace(/[’‘]/g, "'").replace(/[“”"]/g, "").replace(/\s+/g, " ").trim();
const bodyOf = (e) => e.text.slice(e.ruleId.length).replace(/^\.?\s+/, "");
const firstSentence = (s) => s.split(/\.(?:\s|$)/)[0];

// Rule families 701.N / 702.N (N >= 2): their sub-rules in index order.
const families = new Map();
for (const e of index) {
  const m = e.ruleId.match(/^(70[12])\.(\d+)([a-z]?)$/);
  if (!m || m[2] === "1") continue;
  const fam = `${m[1]}.${m[2]}`;
  if (!families.has(fam)) families.set(fam, []);
  families.get(fam).push(e);
}
const aRule = (fam) => families.get(fam).find((e) => /[a-z]$/.test(e.ruleId)) ?? families.get(fam)[0];

// The subject of a rule sentence: the words before its first verb, articles,
// placeholders ([cost], N) and a trailing "ability/abilities" removed; "X and Y" splits.
function subjects(body) {
  const sent = norm(firstSentence(body));
  const m = sent.match(/^(.+?)\s(?:is|are|represents?|appears?|means|on|has|functions)\b/);
  if (!m) return [];
  let subj = m[1].replace(/\[[^\]]*\]/g, " ").replace(/\s+/g, " ").trim();
  subj = subj.replace(/^(?:a|an|the)\s+/, "").replace(/\s+(?:ability|abilities)$/, "").replace(/\s+(?:n|x)$/, "").replace(/\s+(?:a|an)$/, "").trim();
  return subj.split(/\s+and\s+/).map((s) => s.trim()).filter(Boolean);
}
// "To scry N means", "To amass [subtype] N", "For a player to mill": the verb phrase that opens the rule.
function toPhrase(body) {
  const b = norm(body);
  const m = b.match(/^(?:to|for a player to)\s+(.*)$/);
  return m ? m[1] : null;
}
function inflections(kw) {
  const [head, ...rest] = kw.split(" ");
  const tail = rest.length ? ` ${rest.join(" ")}` : "";
  const forms = new Set([head, `${head}s`, `${head}es`, `${head}d`, `${head}ed`, `${head}ing`]);
  if (head.endsWith("e")) forms.add(`${head.slice(0, -1)}ing`);
  if (/[^aeiou]y$/.test(head)) forms.add(`${head.slice(0, -1)}ies`);
  return [...forms].map((f) => `${f}${tail}`);
}
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const startsWithWord = (text, phrase) => text === phrase || (text.startsWith(phrase) && !/[a-z0-9]/.test(text[phrase.length]));

function mapKeyword(kwRaw) {
  const kw = norm(kwRaw);
  const hits = []; // { fam, tier, via }
  for (const [fam, entries] of families) {
    const a = aRule(fam);
    const aBody = bodyOf(a);
    // Tier A: the `a` rule names the keyword as its subject, or opens with "To <keyword>".
    if (subjects(aBody).includes(kw)) { hits.push({ fam, tier: "A", via: a.ruleId }); continue; }
    const tp = toPhrase(aBody);
    if (tp && inflections(kw).some((f) => startsWithWord(tp.replace(/^[“"]/, ""), f))) { hits.push({ fam, tier: "A", via: a.ruleId }); continue; }
    // Tier B (keyword actions): an inflection of the verb in the `a` rule's first sentence,
    // at its start or after to/can/may (not a noun after a/an/the: "sacrifice a Food").
    if (fam.startsWith("701.")) {
      const sent = norm(firstSentence(aBody));
      const re = new RegExp(`(?:^|\\b(?:to|can|may)\\s)(?:${inflections(kw).map(escapeRe).join("|")})(?![a-z])`);
      if (re.test(sent)) { hits.push({ fam, tier: "B", via: a.ruleId }); continue; }
      const re2 = new RegExp(`\\b(?:${inflections(kw).filter((f) => f.split(" ")[0].endsWith("s")).map(escapeRe).join("|")})\\s(?:a|an)\\s`);
      if (inflections(kw).some((f) => f.split(" ")[0].endsWith("s")) && re2.test(sent) && sent.startsWith("if the effect")) { hits.push({ fam, tier: "B", via: a.ruleId }); continue; }
    }
    // Tier C: a later sub-rule names the keyword as a variant ("Megamorph is a variant of the morph ability").
    const variant = entries.find((e) => e !== a && subjects(bodyOf(e)).includes(kw));
    if (variant) { hits.push({ fam, tier: "C", via: variant.ruleId }); continue; }
  }
  // Tier D: landwalk and typecycling families ("Swampwalk", "Plainscycling", "Basic landcycling").
  if (hits.length === 0 && /[a-z]walk$/.test(kw)) hits.push({ fam: "702.14", tier: "D", via: "702.14a" }); // "Wind Walk" (a named ability) stays unmapped
  if (hits.length === 0 && /cycling$/.test(kw) && kw !== "cycling") hits.push({ fam: "702.29", tier: "D", via: "702.29e" });
  if (hits.length === 0) return { kw: kwRaw, fam: null, hits };
  const best = ["A", "B", "C", "D"].find((t) => hits.some((h) => h.tier === t));
  const top = hits.filter((h) => h.tier === best);
  return { kw: kwRaw, fam: top[0].fam, tier: best, via: top[0].via, ambiguous: top.length > 1 ? top.map((h) => h.fam) : null, allHits: hits };
}

// Ability words (CR 207.2c lists them; they have no rules meaning).
const abilityWords = new Set(
  norm(ruleById.get("207.2c").text.split("The ability words are")[1])
    .replace(/\band\b/g, ",")
    .split(",")
    .map((s) => s.replace(/\d+/g, "").replace(/\./g, "").trim())
    .filter(Boolean)
);

const kwCount = new Map();
for (const e of cdi.values()) for (const k of e.keywords ?? []) kwCount.set(k, (kwCount.get(k) ?? 0) + 1);
const mapping = new Map();
for (const k of kwCount.keys()) mapping.set(k, mapKeyword(k));

console.log("==================== M1 mapping: Scryfall keyword -> CR rule family");
console.log(`card pool: ${cdi.size} cards; distinct Scryfall keywords: ${kwCount.size}; 701/702 rule families in the index: ${families.size}`);
{
  const rows = [...mapping.values()];
  const by = (pred) => rows.filter(pred);
  const cardsWith = (list) => list.reduce((s, r) => s + kwCount.get(r.kw), 0);
  const to702 = by((r) => r.fam?.startsWith("702."));
  const to701 = by((r) => r.fam?.startsWith("701."));
  const none = by((r) => !r.fam);
  const noneAW = none.filter((r) => abilityWords.has(norm(r.kw)));
  const noneOther = none.filter((r) => !abilityWords.has(norm(r.kw)));
  console.log(`maps to a 702 keyword-ability family: ${to702.length} keywords (${cardsWith(to702)} card-keyword tags)`);
  console.log(`maps to a 701 keyword-action family:  ${to701.length} keywords (${cardsWith(to701)} card-keyword tags)`);
  console.log(`no rule family: ${none.length} keywords (${cardsWith(none)} tags) = ${noneAW.length} CR 207.2c ability words (${cardsWith(noneAW)} tags) + ${noneOther.length} other (${cardsWith(noneOther)} tags)`);
  for (const tier of ["A", "B", "C", "D"]) {
    const list = rows.filter((r) => r.tier === tier).sort((a, b) => kwCount.get(b.kw) - kwCount.get(a.kw));
    console.log(`  tier ${tier} (${{ A: "a-rule subject / 'To <verb>'", B: "keyword-action verb in the a-rule's first sentence", C: "variant named by a later sub-rule", D: "landwalk / typecycling pattern" }[tier]}): ${list.length} — ${list.map((r) => `${r.kw}->${r.via}`).join(", ")}`);
  }
  const amb = rows.filter((r) => r.ambiguous);
  console.log(`  ambiguous (same tier, several families): ${amb.length ? amb.map((r) => `${r.kw} -> [${r.ambiguous.join(", ")}] (took ${r.fam})`).join("; ") : "none"}`);
  const lowerTierAlso = rows.filter((r) => r.fam && r.allHits.length > 1 && !r.ambiguous);
  console.log(`  also matched a second family at a lower tier (best tier kept): ${lowerTierAlso.map((r) => `${r.kw}: ${r.allHits.map((h) => `${h.fam}/${h.tier}`).join(" ")}`).join("; ") || "none"}`);
  console.log(`  ability words with no rule (top by cards): ${noneAW.sort((a, b) => kwCount.get(b.kw) - kwCount.get(a.kw)).slice(0, 25).map((r) => `${r.kw}:${kwCount.get(r.kw)}`).join(", ")}`);
  console.log(`  other unmapped (top by cards): ${noneOther.sort((a, b) => kwCount.get(b.kw) - kwCount.get(a.kw)).slice(0, 60).map((r) => `${r.kw}:${kwCount.get(r.kw)}`).join(", ")}`);
  console.log(`  other unmapped, used by one card only: ${noneOther.filter((r) => kwCount.get(r.kw) === 1).length}`);
  const famsUsed = new Set(rows.filter((r) => r.fam).map((r) => r.fam));
  const famsUnused = [...families.keys()].filter((f) => !famsUsed.has(f));
  console.log(`  rule families reached by some Scryfall keyword: ${famsUsed.size}/${families.size}; never reached: ${famsUnused.map((f) => `${f} (${norm(firstSentence(bodyOf(aRule(f)))).slice(0, 38)})`).join("; ")}`);
}

// ----------------------------------------------------------------- blocks
function ruleIdsFor(fam, variant, via) {
  const entries = families.get(fam);
  if (variant === "V2") return entries.map((e) => e.ruleId);
  const ids = [aRule(fam).ruleId];
  if (via && !ids.includes(via)) ids.push(via);
  return ids;
}
const famName = (fam) => [...mapping.values()].find((r) => r.fam === fam && r.tier === "A")?.kw ?? [...mapping.values()].find((r) => r.fam === fam)?.kw ?? fam;
function blockTopics(cards, variant, alreadyCarried = new Set()) {
  const byFam = new Map();
  for (const card of cards) {
    for (const k of card.keywords ?? []) {
      const m = mapping.get(k) ?? mapKeyword(k);
      if (!m.fam) continue;
      if (!byFam.has(m.fam)) byFam.set(m.fam, new Set());
      for (const id of ruleIdsFor(m.fam, variant, m.tier === "C" || m.tier === "D" ? m.via : null)) byFam.get(m.fam).add(id);
    }
  }
  const topics = [];
  for (const [fam, idSet] of [...byFam].sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }))) {
    const ids = [...idSet].filter((id) => !alreadyCarried.has(id));
    if (!ids.length) continue;
    const kind = fam.startsWith("701.") ? "Keyword action" : "Keyword ability";
    topics.push({
      id: `keyword-rule-${fam}`,
      title: `${kind}: ${famName(fam)} (${fam})`,
      ruleNumbers: ids,
      excerpt: ids.map((id) => ruleById.get(id).text).join("\n")
    });
  }
  return topics;
}
// Chars a block adds inside GAME RULES (reference): title line, excerpt, blank line between topics.
const blockChars = (topics) => topics.reduce((s, t) => s + t.title.length + 1 + t.excerpt.length + 2, 0);

// ======================================================================= M2 rules gate
function contextCards(request, cardDetailIndex = cdi) {
  if (request.mode === "lookup") return buildLookupPromptContext(request, cardDetailIndex).cards ?? [];
  const context = buildPromptContext(request, cardDetailIndex);
  return [...context.orderedStack, ...context.populatedZones.flatMap((z) => z.items)];
}
function withPatch(topics, fn) {
  const before = ALWAYS_ON_TOPIC_IDS.length;
  ALWAYS_ON_TOPIC_IDS.push(...topics.map((t) => t.id));
  try {
    const patchedTopics = [...resources.gameRulesTopics, ...topics].sort((a, b) => a.id.localeCompare(b.id));
    return fn({ ...resources, gameRulesTopics: patchedTopics });
  } finally {
    ALWAYS_ON_TOPIC_IDS.splice(before);
  }
}

const base = evaluateRulesGate({ cases, resources, vectors, baseline, buildRequest: buildCaseRequest });
console.log("\n==================== M2 rules gate (real evaluateRulesGate, frozen vectors, cap 10)");
console.log(`base: ${base.report.split("\n").pop()}; ok=${base.ok}`);
let mism = 0;
for (const r of base.results) {
  if (r.hit === null) continue;
  const b = baseline.cases[r.id];
  if (!b || JSON.stringify(b.hit) !== JSON.stringify(r.hit) || JSON.stringify(b.inTopic ?? []) !== JSON.stringify(r.inTopic)) mism++;
}
console.log(`base: scored cases whose hit/inTopic differs from committed baseline.json: ${mism}`);

const caseById = new Map(live.map((c) => [c.id, c]));
const baseRes = new Map(base.results.map((r) => [r.id, r]));
const reachSet = (r) => new Set([...(r.hit ?? []), ...(r.inTopic ?? [])]);
const isComplete = (r, c) => r.hit !== null && c.expected.decidingRuleIds.every((id) => reachSet(r).has(id));
const gapIds = live.filter((c) => baseRes.get(c.id).hit !== null && !isComplete(baseRes.get(c.id), c)).map((c) => c.id);
console.log(`base: scored ${base.summary.scored}; complete (every deciding rule reaches the prompt) ${base.summary.scored - gapIds.length}; gap cases ${gapIds.length}; of them listed as keyword-gap ${gapIds.filter((id) => keywordGapIds.has(id)).length}/${keywordGapIds.size}`);

// Per-case base data.
const caseData = [];
for (const c of live) {
  const request = askAiRequestSchema.parse(buildCaseRequest(c));
  const freeze = checkReFreeze(c.id, request, cdi, vectors);
  const vector = freeze.state === "fresh" ? freeze.vector : null;
  const prepared = prep.preparePromptInput(request, { ...resources, queryEmbedding: vector, collectEnrichmentDebug: true });
  const carried = new Set(prepared.enrichmentDebug.curatedGameRules.topics.flatMap((t) => t.ruleNumbers));
  caseData.push({
    c, request, vector, scored: freeze.state === "fresh",
    cards: contextCards(request),
    carried,
    s3: prepared.enrichmentDebug.supplemental.selected.map((r) => r.ruleId),
    promptChars: prepared.promptText.length,
    s3Chars: prepared.diagnostics.supplementalRulesSectionChars ?? 0,
    grChars: prepared.diagnostics.gameRulesSectionChars ?? 0
  });
}

const variantOut = {};
for (const variant of ["V1", "V2"]) {
  const rows = [];
  for (const d of caseData) {
    const topics = blockTopics(d.cards, variant, d.carried);
    const injected = new Set(topics.flatMap((t) => t.ruleNumbers));
    const { gate, prepared } = withPatch(topics, (patchedResources) => {
      const gate = evaluateRulesGate({ cases: [d.c], resources: patchedResources, vectors, baseline, buildRequest: buildCaseRequest });
      const prepared = prep.preparePromptInput(d.request, { ...patchedResources, queryEmbedding: d.vector, collectEnrichmentDebug: true });
      return { gate, prepared };
    });
    const topicIds = prepared.enrichmentDebug.curatedGameRules.topicIds;
    for (const t of topics) if (!topicIds.includes(t.id)) throw new Error(`patch did not take for ${d.c.id} (${t.id})`);
    const s3 = prepared.enrichmentDebug.supplemental.selected.map((r) => r.ruleId);
    if (!topics.length && JSON.stringify(s3) !== JSON.stringify(d.s3)) throw new Error(`System 3 moved with no block: ${d.c.id}`);
    if (!topics.length && prepared.promptText.length !== d.promptChars) throw new Error(`prompt moved with no block: ${d.c.id}`);
    rows.push({ d, topics, injected, r: gate.results[0], s3, promptChars: prepared.promptText.length, s3Chars: prepared.diagnostics.supplementalRulesSectionChars ?? 0, grChars: prepared.diagnostics.gameRulesSectionChars ?? 0 });
  }
  variantOut[variant] = rows;
}

function report(variant) {
  const rows = variantOut[variant];
  const scoredRows = rows.filter((x) => x.r.hit !== null);
  console.log(`\n---------- ${variant} (${variant === "V1" ? "the `a` sub-rule only" : "the whole rule family"})`);
  const failures = rows.filter((x) => x.r.failures.length);
  const regressed = rows.filter((x) => x.r.regressions.length);
  console.log(`gate: failures ${failures.length}${failures.length ? " " + failures.map((x) => `${x.d.c.id}: ${x.r.failures.join("; ")}`).join(" | ") : ""}; regressions (recorded hit or inTopic rule that no longer reaches the prompt) ${regressed.length}${regressed.length ? " " + regressed.map((x) => `${x.d.c.id} [${x.r.regressions.join(", ")}]`).join("; ") : ""}; gate ok=${failures.length === 0 && regressed.length === 0}`);
  const complete = scoredRows.filter((x) => isComplete(x.r, x.d.c));
  console.log(`complete cases: ${base.summary.scored - gapIds.length} -> ${complete.length} of ${scoredRows.length}`);
  const kwGapClosed = [...keywordGapIds].filter((id) => complete.some((x) => x.d.c.id === id));
  const kwGapOpen = [...keywordGapIds].filter((id) => !kwGapClosed.includes(id));
  const allGapClosed = gapIds.filter((id) => complete.some((x) => x.d.c.id === id));
  console.log(`keyword-gap cases now complete: ${kwGapClosed.length}/${keywordGapIds.size}; all gap cases now complete: ${allGapClosed.length}/${gapIds.length}; non-keyword gap cases closed: ${allGapClosed.filter((id) => !keywordGapIds.has(id)).join(", ") || "none"}`);
  // rule-level: missed 701/702 rules that now reach
  let kwRulesMissed = 0, kwRulesReached = 0;
  for (const [id, rules] of gapList) {
    const x = rows.find((y) => y.d.c.id === id);
    for (const rule of rules) { kwRulesMissed++; if (reachSet(x.r).has(rule)) kwRulesReached++; }
  }
  console.log(`missed 701/702 deciding rules in the keyword-gap list now reaching the prompt: ${kwRulesReached}/${kwRulesMissed}`);
  console.log(`keyword-gap cases still open (${kwGapOpen.length}):`);
  for (const id of kwGapOpen) {
    const x = rows.find((y) => y.d.c.id === id);
    const kws = [...new Set(x.d.cards.flatMap((cd) => cd.keywords ?? []))];
    const missing = x.d.c.expected.decidingRuleIds.filter((rule) => !reachSet(x.r).has(rule));
    console.log(`   ${id}: still missing [${missing.join(", ")}]; card keywords [${kws.join(", ")}] -> block [${[...x.injected].join(", ")}]`);
  }
  // System 3 movement
  let movedCases = 0, displacedNonBlock = [], recordedS3ToBlock = [], newS3Hits = [], lostS3Deciding = [];
  for (const x of rows) {
    if (JSON.stringify(x.s3) !== JSON.stringify(x.d.s3)) movedCases++;
    const dropped = x.d.s3.filter((id) => !x.s3.includes(id));
    const displaced = dropped.filter((id) => !x.injected.has(id));
    if (displaced.length) displacedNonBlock.push(`${x.d.c.id} [${displaced.join(", ")}]`);
    if (x.r.hit === null) continue;
    const rec = baseline.cases[x.d.c.id] ?? { hit: [] };
    const toBlock = rec.hit.filter((id) => x.injected.has(id));
    if (toBlock.length) recordedS3ToBlock.push(`${x.d.c.id} [${toBlock.join(", ")}]`);
    const lostS3 = rec.hit.filter((id) => !x.r.hit.includes(id) && !x.injected.has(id));
    if (lostS3.length) lostS3Deciding.push(`${x.d.c.id} [${lostS3.join(", ")}]`);
    const gainedS3 = x.r.hit.filter((id) => !rec.hit.includes(id));
    if (gainedS3.length) newS3Hits.push(`${x.d.c.id} [${gainedS3.join(", ")}]`);
  }
  console.log(`System 3 selection changed in ${movedCases} cases (block ids excluded, lower ranks move up)`);
  console.log(`System 3 picks displaced that are NOT in the block (slot-shift losses): ${displacedNonBlock.length}${displacedNonBlock.length ? " — " + displacedNonBlock.join("; ") : ""}`);
  console.log(`recorded System 3 deciding hits now carried by the block instead (still in the prompt; hit -> inTopic): ${recordedS3ToBlock.length} cases — ${recordedS3ToBlock.join("; ") || "none"}`);
  console.log(`recorded System 3 deciding hits lost from System 3 for another reason: ${lostS3Deciding.length}${lostS3Deciding.length ? " — " + lostS3Deciding.join("; ") : ""}`);
  console.log(`deciding rules newly picked by System 3 (freed slots): ${newS3Hits.length}${newS3Hits.length ? " — " + newS3Hits.join("; ") : ""}`);
  const newHitsGate = scoredRows.filter((x) => x.r.newHits.length);
  console.log(`gate newHits to record (baseline raise): ${newHitsGate.reduce((s, x) => s + x.r.newHits.length, 0)} rules in ${newHitsGate.length} cases`);
  // fired / needed
  const fired = rows.filter((x) => x.topics.length);
  const needed = fired.filter((x) => x.d.c.expected.decidingRuleIds.some((id) => x.injected.has(id)));
  const neededNew = fired.filter((x) => x.d.c.expected.decidingRuleIds.some((id) => x.injected.has(id) && !(baseline.cases[x.d.c.id]?.hit ?? []).includes(id)));
  console.log(`block fired on ${fired.length}/${rows.length} cases (${pct(fired.length, rows.length)}); carried a deciding rule in ${needed.length} (of which ${neededNew.length} the rule was not already a System 3 hit); fired but carried no deciding rule: ${fired.length - needed.length}`);
  const unneeded = fired.filter((x) => !needed.includes(x));
  const unneededFams = new Map();
  for (const x of unneeded) for (const t of x.topics) unneededFams.set(t.title, (unneededFams.get(t.title) ?? 0) + 1);
  console.log(`   families in blocks that carried no deciding rule: ${[...unneededFams].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k, n]) => `${k} x${n}`).join(", ")}; e.g. ${unneeded.slice(0, 6).map((x) => `${x.d.c.id} [${x.topics.map((t) => t.id.replace("keyword-rule-", "")).join("+")}]`).join("; ")}`);
  const famsFired = fired.reduce((s, x) => s + x.topics.length, 0);
  console.log(`rule families injected across the corpus: ${famsFired} (mean ${(famsFired / Math.max(1, fired.length)).toFixed(2)} per firing case)`);
  // cost
  const added = rows.map((x) => blockChars(x.topics));
  const delta = rows.map((x) => x.promptChars - x.d.promptChars);
  const grDelta = rows.map((x) => x.grChars - x.d.grChars);
  const s3Delta = rows.map((x) => x.s3Chars - x.d.s3Chars);
  console.log(`cost, block chars per case (all ${rows.length} cases): ${fmtQ(quantiles(added))}`);
  console.log(`cost, block chars per firing case: ${fmtQ(quantiles(added.filter((v) => v > 0)))}`);
  console.log(`cost, measured GAME RULES section delta per case: ${fmtQ(quantiles(grDelta))} (equals block chars: ${grDelta.every((v, i) => v === added[i])})`);
  console.log(`cost, measured whole-prompt delta per case: ${fmtQ(quantiles(delta))}; System 3 section delta (excerpts that moved up): ${fmtQ(quantiles(s3Delta))} min ${Math.min(...s3Delta)}`);
  return { complete: complete.length, kwGapClosed: kwGapClosed.length, allGapClosed: allGapClosed.length, rows };
}
report("V1");
report("V2");

// ----------------------------------------------------------------- fill variants (V1f / V2f)
// The excluded variants above move System 3: excluding the keyword rule (often the
// query's top lexical score, KEYWORD_TOKEN_MULTIPLIER) re-normalises the hybrid blend
// (min-max over the remaining candidates), and every recorded System 3 hit on a keyword
// rule turns into a block-carried rule. A fill variant leaves System 3 untouched: it
// ranks exactly as today (curated exclusion only), and the block then carries only the
// keyword rules System 3 did not pick and no curated topic carries. Its result is exact
// by construction from the base run (System 3 and the curated topics do not change; the
// block is appended text), so it is computed, not patched.
const fillOut = {};
for (const variant of ["V1", "V2"]) {
  const name = `${variant}f`;
  const rows = caseData.map((d) => {
    const topics = blockTopics(d.cards, variant, new Set([...d.carried, ...d.s3]));
    const injected = new Set(topics.flatMap((t) => t.ruleNumbers));
    const b = baseRes.get(d.c.id);
    const reached = new Set([...reachSet(b), ...d.c.expected.decidingRuleIds.filter((id) => injected.has(id))]);
    return { d, topics, injected, reached, complete: d.c.expected.decidingRuleIds.every((id) => reached.has(id)) };
  });
  fillOut[name] = rows;
  console.log(`\n---------- ${name} (${variant === "V1" ? "`a` sub-rule" : "whole family"}, fill: System 3 untouched, block carries only what System 3 and the curated topics did not)`);
  const complete = rows.filter((x) => x.complete);
  const kwClosed = [...keywordGapIds].filter((id) => rows.find((x) => x.d.c.id === id).complete);
  const allClosed = gapIds.filter((id) => rows.find((x) => x.d.c.id === id).complete);
  console.log(`complete cases: ${base.summary.scored - gapIds.length} -> ${complete.length}; keyword-gap now complete ${kwClosed.length}/${keywordGapIds.size}; all gap now complete ${allClosed.length}/${gapIds.length}`);
  console.log(`System 3 picks moved: 0 by construction; recorded hits lost: 0; gate newHits (inTopic additions on a baseline raise): ${rows.reduce((s, x) => s + x.d.c.expected.decidingRuleIds.filter((id) => x.injected.has(id) && !reachSet(baseRes.get(x.d.c.id)).has(id)).length, 0)}`);
  const fired = rows.filter((x) => x.topics.length);
  const needed = fired.filter((x) => x.d.c.expected.decidingRuleIds.some((id) => x.injected.has(id)));
  console.log(`block fired on ${fired.length}/${rows.length} cases (${pct(fired.length, rows.length)}); carried a deciding rule in ${needed.length}; fired but carried no deciding rule: ${fired.length - needed.length}`);
  const added = rows.map((x) => blockChars(x.topics));
  console.log(`cost, block chars per case (all): ${fmtQ(quantiles(added))}; per firing case: ${fmtQ(quantiles(added.filter((v) => v > 0)))}`);
}

// eval:worked-solutions-style System 3 count (every deciding rule a System 3 pick), frozen vectors.
{
  const s3Complete = (rows, useBase) => rows.filter((x) => x.r.hit !== null && x.d.c.expected.decidingRuleIds.every((id) => (useBase ? x.d.s3 : x.s3).includes(id))).length;
  const anyComplete = (rows) => rows.filter((x) => x.r.hit !== null && isComplete(x.r, x.d.c)).length;
  console.log(`\nSystem 3-only count (eval:worked-solutions's measure, every deciding rule a System 3 pick, frozen vectors): base ${s3Complete(variantOut.V1, true)}, V1 ${s3Complete(variantOut.V1, false)}, V2 ${s3Complete(variantOut.V2, false)}, V1f/V2f ${s3Complete(variantOut.V1, true)} (System 3 untouched) of ${variantOut.V1.filter((x) => x.r.hit !== null).length}`);
  console.log(`in-the-prompt count (either route): base ${base.summary.scored - gapIds.length}, V1 ${anyComplete(variantOut.V1)}, V2 ${anyComplete(variantOut.V2)}, V1f ${fillOut.V1f.filter((x) => x.complete).length}, V2f ${fillOut.V2f.filter((x) => x.complete).length}`);
  const first18 = (rows) => rows.filter((x) => x.d.c.source?.pool === undefined);
  console.log(`the 18 first-ship cases: System 3-only base ${s3Complete(first18(variantOut.V1), true)}, V1 ${s3Complete(first18(variantOut.V1), false)}, V2 ${s3Complete(first18(variantOut.V2), false)} of ${first18(variantOut.V1).length}; in-the-prompt base ${first18(variantOut.V1).filter((x) => isComplete(baseRes.get(x.d.c.id), x.d.c)).length}, V1 ${anyComplete(first18(variantOut.V1))}, V2 ${anyComplete(first18(variantOut.V2))}`);
}

// ======================================================================= M3 prompt cost
console.log("\n==================== M3 prompt cost");
{
  const allTopicsChars = resources.gameRulesTopics.reduce((s, t) => s + t.excerpt.length, 0);
  const lookupAlwaysOn = resources.gameRulesTopics.filter((t) => ALWAYS_ON_TOPIC_IDS.includes(t.id));
  console.log(`reference: all ${resources.gameRulesTopics.length} curated topics' excerpts ${allTopicsChars} chars; formatted all-topics section ${formatGameRulesSection(resources.gameRulesTopics).length}; lookup always-on section (4 topics) ${formatGameRulesSection(lookupAlwaysOn).length}`);
  console.log(`reference over the corpus today: GAME RULES section ${fmtQ(quantiles(caseData.map((d) => d.grChars)))}`);
  console.log(`reference over the corpus today: System 3 section (ten excerpts) ${fmtQ(quantiles(caseData.map((d) => d.s3Chars)))}`);
  console.log(`reference over the corpus today: whole prompt ${fmtQ(quantiles(caseData.map((d) => d.promptChars)))}`);
  const nameByOracle = bench.loadCardNameByOracleId();
  for (const variant of ["V1", "V2"]) {
    const perCard = [];
    let withAny = 0;
    let top = { chars: -1 };
    for (const [oracleId, e] of cdi) {
      const chars = blockChars(blockTopics([e], variant));
      perCard.push(chars);
      if (chars > 0) withAny++;
      if (chars > top.chars) top = { chars, name: nameByOracle.get(oracleId) ?? oracleId, kws: e.keywords };
    }
    console.log(`${variant} single card attached alone, all ${cdi.size} cards: ${fmtQ(quantiles(perCard))}; cards with a block ${withAny} (${pct(withAny, cdi.size)}); with a block only: ${fmtQ(quantiles(perCard.filter((v) => v > 0)))}; largest: ${top.name} ${top.chars} [${top.kws.join(", ")}]`);
    // 5-card boards, uniform random, seeded.
    let seed = 20261007;
    const rand = () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const pool = [...cdi.values()];
    const creatures = pool.filter((e) => /Creature/.test(e.typeLine ?? ""));
    for (const [label, src] of [["any 5 cards", pool], ["5 creatures", creatures]]) {
      const boards = [];
      for (let i = 0; i < 20000; i++) {
        const board = [];
        while (board.length < 5) board.push(src[Math.floor(rand() * src.length)]);
        boards.push(blockChars(blockTopics(board, variant)));
      }
      console.log(`${variant} 5-card board (${label}, 20,000 seeded samples): ${fmtQ(quantiles(boards))}`);
    }
    // Most expensive families.
    const famRows = [...families.keys()].map((fam) => {
      const ids = ruleIdsFor(fam, variant, null);
      return { fam, chars: ids.reduce((s, id) => s + ruleById.get(id).text.length, 0), n: ids.length };
    }).sort((a, b) => b.chars - a.chars);
    const reached = new Set([...mapping.values()].filter((r) => r.fam).map((r) => r.fam));
    console.log(`${variant} rule-text chars per family reached by a keyword: ${fmtQ(quantiles(famRows.filter((f) => reached.has(f.fam)).map((f) => f.chars)))}; largest: ${famRows.filter((f) => reached.has(f.fam)).slice(0, 8).map((f) => `${f.fam} ${famName(f.fam)} ${f.chars} (${f.n} rules)`).join(", ")}`);
  }
  // Popular keywords' cost.
  const popular = [...kwCount.entries()].filter(([k]) => mapping.get(k).fam).sort((a, b) => b[1] - a[1]).slice(0, 15);
  console.log(`most common mapped keywords, block chars V1/V2: ${popular.map(([k, n]) => `${k} (${n} cards) ${blockChars(blockTopics([{ keywords: [k] }], "V1"))}/${blockChars(blockTopics([{ keywords: [k] }], "V2"))}`).join("; ")}`);
}

// ======================================================================= M4 other suites
console.log("\n==================== M4 other suites");
{
  const fixtureDir = join(ROOT, "apps/backend/src/eval/fixtures");
  const fixtures = readdirSync(fixtureDir).filter((f) => f.endsWith(".fixture.json")).sort().map((f) => JSON.parse(readFileSync(join(fixtureDir, f), "utf8")));
  const frozen = JSON.parse(readFileSync(join(fixtureDir, "frozen-query-embeddings.json"), "utf8"));
  const labelled = fixtures.filter((f) => f.expected?.expectedSupplementalRuleIds || f.expected?.forbiddenSupplementalRuleIds);
  // System 3 exactly as the harness calls it: lookup through preparePromptInput's query, game through retrieveSupplementalRules (cap 5 lexical, its default).
  function harnessS3(fixture, extraExclude, vector) {
    const req = fixture.request;
    const fcdi = cardDetailIndexFromRequest(req);
    if (req.mode === "lookup") {
      const context = buildLookupPromptContext(req, fcdi);
      const topics = resources.gameRulesTopics.filter((t) => ALWAYS_ON_TOPIC_IDS.includes(t.id));
      const curated = new Set([...gr.collectCuratedRuleIds(topics), ...extraExclude]);
      const q = gr.buildQueryTokensFromParts({ questionText: req.question, oracleText: (context.cards ?? []).map((c) => gr.buildCompactCardSignal(c.name, c.typeLine, c.keywords)).join(" ") });
      return { cards: context.cards ?? [], carried: gr.collectCuratedRuleIds(topics), selected: gr.retrieveRulesForQuery(q.tokens, q.queryRuleIds, index, curated, 10, undefined, vector, q.questionRuleIds) };
    }
    const context = buildPromptContext(req, fcdi);
    const topics = selectGameRulesTopics(context, resources.gameRulesTopics);
    const curated = new Set([...gr.collectCuratedRuleIds(topics), ...extraExclude]);
    const cards = [...context.orderedStack, ...context.populatedZones.flatMap((z) => z.items)];
    return { cards, carried: gr.collectCuratedRuleIds(topics), selected: gr.retrieveSupplementalRules(context, index, curated, vector ? 10 : 5, undefined, vector) };
  }
  // Parity with production for the labelled fixtures (semantic, frozen) — the harness's semantic test goes through preparePromptInput.
  for (const f of labelled) {
    const fcdi = cardDetailIndexFromRequest(f.request);
    const prod = prep.preparePromptInput(f.request, { ...resources, cardDetailIndex: fcdi, queryEmbedding: frozen[f.id].vector, collectEnrichmentDebug: true }).enrichmentDebug.supplemental.selected.map((r) => r.ruleId);
    const mine = harnessS3(f, [], frozen[f.id].vector).selected.map((r) => r.ruleId);
    if (JSON.stringify(prod) !== JSON.stringify(mine)) throw new Error(`harness parity failure ${f.id}`);
  }
  for (const variant of ["base", "V1", "V2", "V1f", "V2f"]) {
    let gl = 0, glT = 0, gs = 0, gsT = 0;
    const fails = [];
    let churn = 0;
    const churned = [];
    let s3Moved = 0;
    const fill = variant.endsWith("f");
    for (const f of fixtures) {
      const b0 = harnessS3(f, [], null);
      // Fill: the golden prompts are lexical, so the block skips the lexical System 3 picks.
      const skip = fill ? new Set([...b0.carried, ...b0.selected.map((r) => r.ruleId)]) : b0.carried;
      const topics = variant === "base" ? [] : blockTopics(b0.cards, variant.replace("f", ""), skip);
      const ex = fill ? [] : topics.flatMap((t) => t.ruleNumbers);
      const lex = harnessS3(f, ex, null);
      if (topics.length) { churn++; churned.push(`${f.id}(${topics.map((t) => t.id.replace("keyword-rule-", "")).join("+")})`); }
      if (JSON.stringify(lex.selected.map((r) => r.ruleId)) !== JSON.stringify(b0.selected.map((r) => r.ruleId))) s3Moved++;
      if (labelled.includes(f)) {
        for (const ch of evaluateSystem3RelevanceChecks(lex.selected, f.expected)) { glT++; if (ch.passed) gl++; else fails.push(`lexical ${f.id}: ${ch.details ?? ch.id}`); }
        const sem = harnessS3(f, ex, frozen[f.id].vector);
        for (const ch of evaluateSystem3RelevanceChecks(sem.selected, f.expected)) { gsT++; if (ch.passed) gs++; else fails.push(`semantic ${f.id}: ${ch.details ?? ch.id}`); }
      }
    }
    console.log(`context-eval harness ${variant}: labelled System 3 checks lexical ${gl}/${glT}, semantic (frozen) ${gs}/${gsT}; failures ${fails.join(" | ") || "none"}`);
    if (variant !== "base") console.log(`   fixtures whose prompt gains a keyword block (prompt golden + checklist-report golden would change): ${churn}/${fixtures.length} — ${churned.join(", ")}; fixtures whose lexical System 3 picks move: ${s3Moved}`);
    const s2 = fixtures.filter((f) => f.expected?.expectedSystem2TopicIds);
    if (variant === "V1" || variant === "V2") {
      const s2hit = s2.filter((f) => blockTopics(harnessS3(f, [], null).cards, variant, harnessS3(f, [], null).carried).length > 0);
      console.log(`   System 2 topic-id checks that would see an extra topic if the block were built as System 2 topics: ${s2hit.length}/${s2.length} ${s2hit.map((f) => f.id).join(", ")} (zero if built as its own prompt section)`);
    }
  }
  // Benchmark: production scoreBenchmark retrieves with an empty curated set and attaches no request cards, so neither variant enters it.
  const corpus = bench.loadBenchmarkCorpus();
  const nameIndex = bench.loadCardNameByOracleId();
  const sb = bench.scoreBenchmark(corpus, index, bench.buildPollutionText(cdi, nameIndex));
  console.log(`retrieval benchmark (production scoreBenchmark, lexical): clean R@5 ${sb.clean.recall5.toFixed(4)}, polluted R@5 ${sb.polluted.recall5.toFixed(4)} — identical under V1 and V2 (the benchmark calls retrieveRulesForQuery with an empty curated set and no request cards; the keyword block never enters it)`);
}

// ======================================================================= M5 gap cases with no keyword tag
console.log("\n==================== M5 keyword-gap cases the keyword tag cannot reach");
{
  const v2rows = variantOut.V2;
  const unreached = [];
  for (const [id, rules] of gapList) {
    const x = v2rows.find((y) => y.d.c.id === id);
    const stillMissing = rules.filter((rule) => !reachSet(x.r).has(rule));
    if (!stillMissing.length) continue;
    const kws = [...new Set(x.d.cards.flatMap((cd) => cd.keywords ?? []))];
    unreached.push({ id, rules: stillMissing, kws, x });
    console.log(`   ${id}: misses [${stillMissing.join(", ")}] (${stillMissing.map((r) => norm(firstSentence(bodyOf(ruleById.get(r)))).slice(0, 50)).join(" / ")}); card keywords [${kws.join(", ")}]; cards ${x.d.cards.map((cd) => cd.name).join(" + ")}`);
  }
  console.log(`count: ${unreached.length}`);
  // (a) naive oracle-text verb trigger for the plain keyword actions.
  const pool = [...cdi.values()];
  const verbs = { activate: "701.2", cast: "701.5", create: "701.7", discard: "701.9", play: "701.18", shuffle: "701.24", tap: "701.26", untap: "701.26", sacrifice: "701.21", exile: "701.13", destroy: "701.8", counter: "701.6", reveal: "701.20", search: "701.23", attach: "701.3" };
  const fires = (text, verb) => new RegExp(`\\b(?:${inflections(verb).map(escapeRe).join("|")})\\b`, "i").test(text ?? "");
  const rows = Object.entries(verbs).map(([verb, fam]) => ({ verb, fam, n: pool.filter((e) => fires(e.oracleText, verb)).length }));
  console.log(`(a) naive oracle-text verb trigger, share of the ${pool.length}-card pool that would fire: ${rows.map((r) => `${r.verb} (${r.fam}) ${r.n} ${pct(r.n, pool.length)}`).join("; ")}`);
  const anyPlain = pool.filter((e) => Object.keys(verbs).some((v) => fires(e.oracleText, v))).length;
  console.log(`    any of those verbs: ${anyPlain} cards (${pct(anyPlain, pool.length)})`);
  const plainCost = (verb, variant) => {
    const fam = verbs[verb];
    return ruleIdsFor(fam, variant, null).reduce((s, id) => s + ruleById.get(id).text.length, 0);
  };
  console.log(`    rule-text chars per plain action V1/V2: ${Object.keys(verbs).map((v) => `${v} ${plainCost(v, "V1")}/${plainCost(v, "V2")}`).join("; ")}`);
  // Which unreached cases a verb trigger would close (the verb appears in an attached card's oracle text).
  for (const u of unreached) {
    const closers = [];
    for (const rule of u.rules) {
      const fam = rule.replace(/[a-z]$/, "");
      const verb = Object.entries(verbs).find(([, f]) => f === fam)?.[0];
      const fired = verb ? u.x.d.cards.some((cd) => fires(cd.oracleText, verb) || (verb === "tap" && fires(cd.oracleText, "untap"))) : false;
      closers.push(`${rule}: ${verb ? `verb "${verb}" ${fired ? "in" : "NOT in"} card text` : "no plain-verb trigger"}`);
    }
    u.verbClosers = closers;
  }
  console.log(`    per unreached case: ${unreached.map((u) => `${u.id} -> ${u.verbClosers.join(", ")}`).join(" | ")}`);
  // (b) named-keyword trigger: a keyword-ability name (from the CR's own `a`-rule subjects plus
  // every Scryfall name mapped above) appears in the card's oracle text, reminder text removed,
  // and the card's own Scryfall keywords lack it ("All Sliver creatures have absorb 1",
  // "creatures you control gain flying", "Visit — ...", "faces a villainous choice").
  const named = new Map(); // name -> fam
  for (const [fam] of families) {
    if (!fam.startsWith("702.")) continue;
    for (const s of subjects(bodyOf(aRule(fam)))) if (s.length <= 30 && !/[()∞]/.test(s)) named.set(s, fam);
  }
  for (const r of mapping.values()) if (r.fam?.startsWith("702.") && r.tier !== "D") named.set(norm(r.kw), r.fam);
  named.set("villainous choice", "701.55");
  const namedRes = [...named].map(([k, fam]) => ({ k, fam, re: new RegExp(`(?<![a-z])${escapeRe(k)}(?![a-z])`) }));
  const namedIn = (card) => {
    const own = new Set((card.keywords ?? []).map((k) => (mapping.get(k) ?? mapKeyword(k)).fam).filter(Boolean));
    const text = norm((card.oracleText ?? "").replace(/\([^)]*\)/g, " "));
    return namedRes.filter(({ fam, re }) => !own.has(fam) && re.test(text));
  };
  let namedFires = 0;
  const namedChars = [];
  const namedTop = new Map();
  for (const e of pool) {
    const hits = namedIn(e);
    if (!hits.length) continue;
    namedFires++;
    const fams = [...new Set(hits.map((h) => h.fam))];
    namedChars.push(fams.reduce((s, fam) => s + ruleIdsFor(fam, "V1", null).reduce((t, id) => t + ruleById.get(id).text.length, 0), 0));
    for (const h of hits) namedTop.set(h.k, (namedTop.get(h.k) ?? 0) + 1);
  }
  console.log(`(b) named-keyword trigger (a keyword-ability name in oracle text, reminder text removed, that the card's own keywords lack; ${named.size} names): fires on ${namedFires} cards (${pct(namedFires, pool.length)}); V1 rule-text chars when it fires ${fmtQ(quantiles(namedChars))}`);
  console.log(`    most frequent names it fires on: ${[...namedTop].sort((a, b) => b[1] - a[1]).slice(0, 15).map(([k, n]) => `${k} ${n}`).join(", ")}`);
  for (const u of unreached) {
    const hits = u.x.d.cards.flatMap((cd) => namedIn(cd).map((h) => `${h.k}@${cd.name}`));
    const fams = new Set(u.x.d.cards.flatMap((cd) => namedIn(cd).map((h) => h.fam)));
    const closes = u.rules.every((rule) => fams.has(rule.replace(/[a-z]$/, "")));
    u.namedCloses = closes;
    console.log(`    ${u.id}: finds [${hits.join(", ") || "nothing"}] -> ${closes ? "closes it" : "does not close it"}`);
  }
  // Corpus load of (b): cases where it fires and whether it carried a deciding rule.
  let bFired = 0, bNeeded = 0;
  for (const d of caseData) {
    const fams = new Set(d.cards.flatMap((cd) => namedIn(cd).map((h) => h.fam)));
    if (!fams.size) continue;
    bFired++;
    if (d.c.expected.decidingRuleIds.some((id) => fams.has(id.replace(/[a-z]$/, "")))) bNeeded++;
  }
  console.log(`    corpus: (b) fires on ${bFired}/${caseData.length} cases; carries a deciding rule's family in ${bNeeded}`);
  // (c) question-side trigger: the player's question names the keyword or plain action.
  const qNames = new Map([...named]);
  for (const r of mapping.values()) if (r.fam?.startsWith("701.")) qNames.set(norm(r.kw), r.fam);
  for (const [verb, fam] of Object.entries(verbs)) qNames.set(verb, fam);
  const qRes = [...qNames].map(([k, fam]) => ({ k, fam, re: new RegExp(`(?<![a-z])(?:${inflections(k).map(escapeRe).join("|")})(?![a-z])`) }));
  const qFams = (question) => new Set(qRes.filter(({ re }) => re.test(norm(question))).map(({ fam }) => fam));
  for (const u of unreached) {
    const fams = qFams(u.x.d.c.question);
    u.qCloses = u.rules.every((rule) => fams.has(rule.replace(/[a-z]$/, "")));
  }
  console.log(`(c) question-side trigger (the question names the keyword or the plain action, any inflection): closes ${unreached.filter((u) => u.qCloses).length}/${unreached.length} — ${unreached.map((u) => `${u.id} ${u.qCloses ? "yes" : "no"}`).join(", ")}`);
  const plainFams = new Set(Object.values(verbs));
  let qFired = 0, qPlainFired = 0, qPlainNeeded = 0;
  for (const d of caseData) {
    const fams = qFams(d.c.question);
    if (fams.size) qFired++;
    const plain = [...fams].filter((f) => plainFams.has(f));
    if (plain.length) {
      qPlainFired++;
      if (d.c.expected.decidingRuleIds.some((id) => plain.includes(id.replace(/[a-z]$/, "")))) qPlainNeeded++;
    }
  }
  console.log(`    corpus: (c) fires on ${qFired}/${caseData.length} questions; a plain action (${Object.keys(verbs).join("/")}) is named in ${qPlainFired}, and that plain-action rule is a deciding rule in ${qPlainNeeded}`);
  const either = unreached.filter((u) => u.namedCloses || u.qCloses).length;
  console.log(`    closed by (b) or (c): ${either}/${unreached.length}`);
}
