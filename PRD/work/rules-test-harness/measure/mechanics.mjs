// Scratch measurement for the rules-test-harness DESIGN-BRIEF (define node,
// 2026-10-06). Reads only committed data plus the gitignored raw CR text
// (apps/backend/data/cr/source.txt, copied from the main checkout for this
// measurement, never committed). No network, no model call.
//
//   node PRD/work/rules-test-harness/measure/mechanics.mjs [--json out.json]
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { brotliDecompressSync } from "node:zlib";

const root = new URL("../../../../", import.meta.url).pathname;
const index = JSON.parse(readFileSync(root + "apps/backend/data/gameRulesRuleIndex.json", "utf8"));
const cards = JSON.parse(brotliDecompressSync(readFileSync(root + "apps/backend/data/cardDetailByOracleId.json.br")));
const rulings = JSON.parse(brotliDecompressSync(readFileSync(root + "apps/backend/data/cardRulingsByOracleId.json.br")));

// 1. Mechanics in the committed index: distinct 701.N / 702.N prefixes,
//    excluding the two general rules 701.1 and 702.1.
const byPrefix = new Map();
for (const e of index) {
  const m = /^(70[12])\.(\d+)/.exec(e.ruleId);
  if (!m) continue;
  const key = `${m[1]}.${m[2]}`;
  if (!byPrefix.has(key)) byPrefix.set(key, []);
  byPrefix.get(key).push(e);
}
const indexMechanicIds = [...byPrefix.keys()].filter((k) => k !== "701.1" && k !== "702.1");

// 2. Names from the raw CR headings ("702.19. Trample").
const crPath = root + "apps/backend/data/cr/source.txt";
const crNames = new Map();
let crEffective = null;
if (existsSync(crPath)) {
  const raw = readFileSync(crPath, "utf8").replace(/\r/g, "");
  crEffective = (/effective as of ([A-Za-z]+ \d+, \d{4})/.exec(raw) || [])[1] ?? null;
  for (const line of raw.split("\n")) {
    const m = /^(70[12]\.\d+)\. (.+)$/.exec(line.trim());
    if (m && !crNames.has(m[1])) crNames.set(m[1], m[2].trim());
  }
}
const crMechanicIds = [...crNames.keys()].filter((k) => k !== "701.1" && k !== "702.1");

// Name check: the index's first subrule text should mention the CR heading name
// (guards against a renumbering between the index build and the newer CR).
const nameMismatch = [];
for (const id of indexMechanicIds) {
  const name = crNames.get(id);
  const text = byPrefix.get(id).map((e) => e.text).join(" ").toLowerCase();
  const probe = name ? name.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 2)[0] : null;
  if (!name || (probe && !text.includes(probe))) nameMismatch.push({ id, crName: name ?? null, indexText: byPrefix.get(id)[0].text.slice(0, 80) });
}
const inCrNotIndex = crMechanicIds.filter((id) => !byPrefix.has(id)).map((id) => ({ id, name: crNames.get(id) }));

// 3. Card keyword join (Scryfall keywords field on the committed card-detail index).
const kwCards = new Map(); // lowercased keyword -> oracle ids
for (const [oid, c] of Object.entries(cards)) {
  for (const k of c.keywords ?? []) {
    const key = k.toLowerCase();
    if (!kwCards.has(key)) kwCards.set(key, []);
    kwCards.get(key).push(oid);
  }
}
const rows = indexMechanicIds.map((id) => {
  const name = crNames.get(id) ?? null;
  const key = (name ?? "").toLowerCase();
  const holders = kwCards.get(key) ?? [];
  const withRulings = holders.filter((oid) => Array.isArray(rulings[oid]) && rulings[oid].length > 0);
  const exampleLines = byPrefix.get(id).reduce((n, e) => n + (e.text.match(/Example:/g) || []).length, 0);
  return {
    id,
    name,
    kind: id.startsWith("701") ? "action" : "ability",
    subrules: byPrefix.get(id).length,
    cardsWithKeyword: holders.length,
    cardsWithKeywordAndRuling: withRulings.length,
    exampleLines
  };
});

// 4. Joke-only candidates and Infinity.
const jokeIds = ["701.51", "701.52", "702.158", "702.159", "702.186"];
const joke = jokeIds.map((id) => {
  const r = rows.find((x) => x.id === id);
  return { ...r, firstSubrule: (byPrefix.get(id)?.[0]?.text ?? "ABSENT").slice(0, 160) };
});
const attractionOrUnMention = rows
  .filter((r) => byPrefix.get(r.id).some((e) => /Attraction|Un-set|sticker|Contraption|silver-bordered|acorn/i.test(e.text)))
  .map((r) => r.id + " " + r.name);

// 5. Pools.
const exampleEntries = index.filter((e) => /Example:/.test(e.text));
const exampleLines = index.reduce((n, e) => n + (e.text.match(/Example:/g) || []).length, 0);
const totalRulings = Object.values(rulings).reduce((n, list) => n + (Array.isArray(list) ? list.length : 0), 0);
const section = (id) => id.split(".")[0];
const hardAreas = {
  "copies 707": ["707"], "multiplayer 801": ["801"], "triggers 603": ["603"], "layers 613": ["613"],
  "double-faced 712": ["712"], "resolution 608": ["608"], "two-headed giant 810": ["810"],
  "replacement/prevention 614-616": ["614", "615", "616"], "copiable 611?": ["611"], "commander 903": ["903"],
  "combat 508-510": ["508", "509", "510"], "SBA 704": ["704"]
};
const hardAreaExampleLines = Object.fromEntries(
  Object.entries(hardAreas).map(([label, secs]) => [
    label,
    index.filter((e) => secs.includes(section(e.ruleId))).reduce((n, e) => n + (e.text.match(/Example:/g) || []).length, 0)
  ])
);
const hardAreaExampleEntries = Object.fromEntries(
  Object.entries(hardAreas).map(([label, secs]) => [label, exampleEntries.filter((e) => secs.includes(section(e.ruleId))).length])
);

const summary = {
  crEffective,
  indexEntries: index.length,
  indexMechanics: indexMechanicIds.length,
  indexActions: indexMechanicIds.filter((i) => i.startsWith("701")).length,
  indexAbilities: indexMechanicIds.filter((i) => i.startsWith("702")).length,
  crMechanics: crMechanicIds.length,
  inCrNotIndex,
  nameMismatch,
  zeroKeywordCards: rows.filter((r) => r.cardsWithKeyword === 0).map((r) => `${r.id} ${r.name}`),
  withKeywordRuling: rows.filter((r) => r.cardsWithKeywordAndRuling > 0).length,
  withExampleLine: rows.filter((r) => r.exampleLines > 0).length,
  joke,
  attractionOrUnMention,
  exampleEntries: exampleEntries.length,
  exampleLines,
  cardsWithRulings: Object.keys(rulings).length,
  totalRulings,
  cardDetailCards: Object.keys(cards).length,
  hardAreaExampleLines,
  hardAreaExampleEntries
};
console.log(JSON.stringify(summary, null, 1));
const jsonFlag = process.argv.indexOf("--json");
if (jsonFlag !== -1) writeFileSync(process.argv[jsonFlag + 1], JSON.stringify({ summary, rows }, null, 1));
