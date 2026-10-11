// Extra free checks: trailing-period token loss, dependency phrases, inline examples, odd chars.
// Run from repo root: node PRD/work/probe-prompt-format-tuning/runs/audit-data/extra-checks.mjs
import fs from "node:fs";
const index = JSON.parse(fs.readFileSync("apps/backend/data/gameRulesRuleIndex.json", "utf8"));
const STOP = new Set(["and","are","can","card","cards","does","for","from","has","have","how","one","that","the","this","what","when","will","with"]);
const tokenize = (v) => v.toLowerCase().split(/[^a-z0-9.]+/).map((t) => t.trim()).filter((t) => t.length >= 3 && !STOP.has(t));
const out = {};
// 1. words a piece contains ONLY in sentence-final form (word.) -> invisible to a bare query word
let piecesAffected = 0, lostWords = 0; const lostByWord = new Map();
for (const e of index) {
  const set = new Set(tokenize(e.searchText));
  let hit = false;
  for (const t of set) if (/[a-z]\.$/.test(t) && !set.has(t.slice(0, -1))) { lostWords++; hit = true; const w = t.slice(0, -1); lostByWord.set(w, (lostByWord.get(w) ?? 0) + 1); }
  if (hit) piecesAffected++;
}
out.trailingPeriod = { piecesWithAWordOnlyInDottedForm: piecesAffected, wordInstancesInvisible: lostWords,
  topWords: [...lostByWord].sort((a, b) => b[1] - a[1]).slice(0, 25).map(([w, n]) => `${w} ${n}`) };
// keyword sample: pieces where the keyword is only sentence-final
for (const w of ["trample", "deathtouch", "lifelink", "flying", "hexproof", "indestructible", "haste", "ward", "cascade", "graveyard", "exile", "sacrifice"]) {
  const only = index.filter((e) => { const s = new Set(tokenize(e.searchText)); return s.has(w + ".") && !s.has(w); }).map((e) => e.ruleId);
  out.trailingPeriod[`only-dotted:${w}`] = only;
}
// 2. dependency phrases: piece explicitly defers to another rule's procedure
const dep = /(as described in rule|described in rules?|defined in rule|follows? the (?:rules|process|steps)|using the (?:rules|process)|the process described|in the same way as|as outlined in|as specified in|as per rule|see rule \d{3}\.\d+[a-z]? for)/i;
const depHits = index.filter((e) => dep.test(e.text.split("\nExample:")[0]));
out.dependencyPhrases = { count: depHits.length, examples: depHits.slice(0, 10).map((e) => e.text.slice(0, 170)) };
// 3. inline examples (Example: not on its own line)
const inline = index.filter((e) => /[^\n]Example:/.test(e.text));
out.inlineExample = inline.map((e) => e.ruleId);
// 4. odd characters
out.u2028 = index.filter((e) => /\u2028/.test(e.text)).map((e) => ({ id: e.ruleId, around: JSON.stringify(e.text.slice(Math.max(0, e.text.indexOf("\u2028") - 40), e.text.indexOf("\u2028") + 20)) }));
out.nbsp = index.filter((e) => /\u00a0/.test(e.text)).map((e) => e.ruleId);
out.minusSign = index.filter((e) => /\u2212/.test(e.text)).map((e) => e.ruleId);
// 5. keyword-family labels: how many 702/701 pieces carry only the generic section title
out.genericLabel = {
  keywordAbilities: index.filter((e) => e.sectionTitle === "Keyword Abilities").length,
  keywordActions: index.filter((e) => e.sectionTitle === "Keyword Actions").length,
  general: index.filter((e) => e.sectionTitle === "General").length
};
fs.writeFileSync("PRD/work/probe-prompt-format-tuning/runs/audit-data/out/extra-checks.json", JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
