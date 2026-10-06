// Scratch: per mechanic in the committed rule index, which official answer
// route exists — (a) a WotC ruling on a card whose Scryfall keywords carry the
// mechanic, (b) else a WotC ruling on a card whose oracle text names it
// (approximate text match), (c) else a CR Example: line, (d) else only the CR
// rule text verbatim. Also which mechanics the 18 gold cases already cover by
// their expected rule ids. Committed data only.
import { readFileSync, readdirSync } from "node:fs";
import { brotliDecompressSync } from "node:zlib";
const root = new URL("../../../../", import.meta.url).pathname;
const cards = JSON.parse(brotliDecompressSync(readFileSync(root + "apps/backend/data/cardDetailByOracleId.json.br")));
const rulings = JSON.parse(brotliDecompressSync(readFileSync(root + "apps/backend/data/cardRulingsByOracleId.json.br")));
const { rows } = JSON.parse(readFileSync(new URL("./mechanics-result.json", import.meta.url), "utf8"));
const special = { "Tap and Untap": /\b(tap|untap)\b/i, "Daybound and Nightbound": /\bdaybound\b/i, "∞ (Infinity)": /∞ —|\n∞/, "The Ring Tempts You": /the ring tempts you/i, "Face a Villainous Choice": /villainous choice/i };
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const routes = { a: [], b: [], c: [], d: [] };
for (const r of rows) {
  if (r.cardsWithKeywordAndRuling > 0) { routes.a.push(r.id); continue; }
  const re = special[r.name] ?? new RegExp(`\\b${esc(r.name)}\\b`, "i");
  const hit = Object.entries(cards).some(([oid, c]) => re.test(c.oracleText ?? "") && (rulings[oid] ?? []).length > 0);
  if (hit) { routes.b.push(r.id + " " + r.name); continue; }
  if (r.exampleLines > 0) { routes.c.push(r.id + " " + r.name); continue; }
  routes.d.push(r.id + " " + r.name);
}
console.log("a keyword-card ruling:", routes.a.length);
console.log("b text-named-card ruling:", routes.b.length, routes.b.join("; "));
console.log("c Example: line only:", routes.c.length, routes.c.join("; "));
console.log("d verbatim rule only:", routes.d.length, routes.d.join("; "));
const dir = root + "apps/backend/src/eval/worked-solutions/";
const covered = new Set();
for (const f of readdirSync(dir).filter((x) => x.endsWith(".case.json"))) {
  const c = JSON.parse(readFileSync(dir + f, "utf8"));
  for (const id of c.expectedSupplementalRuleIds) { const m = /^(70[12]\.\d+)/.exec(id); if (m) covered.add(m[1]); }
}
console.log("gold cases' expected rule ids touching a 701/702 mechanic:", [...covered].join(", ") || "none");
