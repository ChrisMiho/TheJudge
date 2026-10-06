// Scratch measurement for the rules-test-harness DESIGN-BRIEF (define node,
// attempt 2, 2026-10-06; gate-qc finding 2). Sizes the two official pools the
// 120 hard-area cases are drawn from, and how many "does-not-work"
// candidates each pool holds. Committed data only; no network, no model call.
//
//   node PRD/work/rules-test-harness/measure/depth-pool.mjs
//
// 1. Hard-area `Example:` lines in the committed rule index, minus the ones
//    the 18 gold cases already use (the case's deciding rule carries that
//    line, or the line's text is inside a gold answer).
// 2. WotC rulings that name a second card: a ruling on card A whose comment
//    contains, word-bounded and case-sensitive, the full name of another
//    committed card B of two or more words (single-word names such as
//    "Shock" or "Fog" are skipped because they collide with rules words;
//    this undercounts rather than overcounts). Then the subset whose comment
//    matches a hard-area term.
// 3. "Negative-phrased" candidates in each pool (doesn't / can't / won't /
//    isn't / aren't / no longer / not / never): a proxy for how many
//    does-not-work cases the pool can supply. Authoring still decides each
//    case's outcome; this only shows the supply.
import { readFileSync, readdirSync } from "node:fs";
import { brotliDecompressSync } from "node:zlib";

const root = new URL("../../../../", import.meta.url).pathname;
const index = JSON.parse(readFileSync(root + "apps/backend/data/gameRulesRuleIndex.json", "utf8"));
const rulings = JSON.parse(brotliDecompressSync(readFileSync(root + "apps/backend/data/cardRulingsByOracleId.json.br")));
const meta = JSON.parse(readFileSync(root + "apps/frontend/public/data/cardMetadata.json", "utf8"));
const casesDir = root + "apps/backend/src/eval/worked-solutions/";
const gold = readdirSync(casesDir).filter((f) => f.endsWith(".case.json")).map((f) => JSON.parse(readFileSync(casesDir + f, "utf8")));

const NEG = /\b(doesn't|does not|can't|cannot|won't|will not|isn't|is not|aren't|are not|no longer|not|never)\b/i;
const section = (ruleId) => ruleId.split(".")[0];
const HARD = {
  "copies 707": ["707"], "multiplayer 801": ["801"], "triggers 603": ["603"], "layers 613": ["613"],
  "double-faced 712": ["712"], "resolution 608": ["608"], "two-headed giant 810": ["810"],
  "replacement/prevention 614-616": ["614", "615", "616"], "continuous effects 611": ["611"], "commander 903": ["903"],
  "combat 508-510": ["508", "509", "510"], "SBA 704": ["704"]
};
const hardSections = new Set(Object.values(HARD).flat());

// 1. Example lines.
const goldRuleIds = new Set(gold.flatMap((c) => c.expectedSupplementalRuleIds));
const goldAnswers = gold.map((c) => c.workedSolution);
let total = 0, used = 0, unusedNeg = 0;
const perArea = {};
for (const e of index) {
  if (!hardSections.has(section(e.ruleId))) continue;
  const parts = e.text.split(/(?=Example:)/).filter((p) => p.startsWith("Example:"));
  for (const p of parts) {
    total++;
    const body = p.replace(/^Example:\s*/, "").trim();
    const isUsed = goldRuleIds.has(e.ruleId) || goldAnswers.some((a) => a.includes(body.slice(0, 60)));
    const area = Object.entries(HARD).find(([, s]) => s.includes(section(e.ruleId)))[0];
    perArea[area] ??= { lines: 0, unused: 0 };
    perArea[area].lines++;
    if (isUsed) used++;
    else {
      perArea[area].unused++;
      if (NEG.test(body)) unusedNeg++;
    }
  }
}
console.log(`Example lines in hard areas: ${total}; used by the 18 gold cases: ${used}; unused: ${total - used}; unused and negative-phrased: ${unusedNeg}`);
console.log("  per area (lines/unused):", Object.entries(perArea).map(([a, v]) => `${a} ${v.lines}/${v.unused}`).join("; "));

// 2. Two-card rulings.
const nameToId = new Map();
for (const c of meta) {
  const full = c.name;
  const faces = full.includes(" // ") ? full.split(" // ") : [];
  for (const n of [full, ...faces]) if (n.includes(" ") && !nameToId.has(n)) nameToId.set(n, c.cardId);
}
const ownNames = new Map();
for (const c of meta) ownNames.set(c.cardId, new Set([c.name, ...(c.name.includes(" // ") ? c.name.split(" // ") : [])]));
const AREA_TERMS = {
  copies: /\bcop(y|ies)\b/i,
  layers: /\blayer|\btimestamp|\bdependen/i,
  replacement: /\binstead\b|\bprevent|replacement effect/i,
  triggers: /\btrigger/i,
  combat: /combat damage|\bblock|\battack/i,
  sba: /state-based action/i,
  dfc: /\btransform|double-faced|back face|front face/i,
  multiplayer: /multiplayer|each opponent|\bcommander\b|two-headed giant/i
};
let twoCard = 0, twoCardHard = 0, twoCardHardNeg = 0;
const pairs = new Set();
const perTerm = Object.fromEntries(Object.keys(AREA_TERMS).map((k) => [k, 0]));
for (const [oid, list] of Object.entries(rulings)) {
  const own = ownNames.get(oid) ?? new Set();
  for (const r of list) {
    const tokens = r.comment.split(/\s+/);
    const found = new Set();
    for (let i = 0; i < tokens.length; i++) {
      let phrase = tokens[i];
      for (let n = 2; n <= 7 && i + n - 1 < tokens.length; n++) {
        phrase += " " + tokens[i + n - 1];
        const stripped = phrase.replace(/[.,;:)"'’]+$/, "").replace(/^[("'‘“]+/, "");
        const hit = nameToId.get(stripped);
        if (hit && hit !== oid && !own.has(stripped)) found.add(hit);
      }
    }
    if (found.size === 0) continue;
    twoCard++;
    for (const b of found) pairs.add(oid < b ? `${oid}|${b}` : `${b}|${oid}`);
    const terms = Object.entries(AREA_TERMS).filter(([, re]) => re.test(r.comment)).map(([k]) => k);
    if (terms.length) {
      twoCardHard++;
      for (const t of terms) perTerm[t]++;
      if (NEG.test(r.comment)) twoCardHardNeg++;
    }
  }
}
console.log(`Rulings naming a second card (2+ word names): ${twoCard}; distinct card pairs: ${pairs.size}`);
console.log(`  of those, matching a hard-area term: ${twoCardHard}; hard-area and negative-phrased: ${twoCardHardNeg}`);
console.log("  per term (a ruling can match several):", Object.entries(perTerm).map(([k, v]) => `${k} ${v}`).join("; "));
