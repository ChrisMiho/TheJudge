// Scratch: for mechanics whose name never appears in Scryfall's keywords field,
// count committed cards whose oracle text names the mechanic, and how many of
// those carry >=1 WotC ruling. Committed data only; no network.
import { readFileSync } from "node:fs";
import { brotliDecompressSync } from "node:zlib";
const root = new URL("../../../../", import.meta.url).pathname;
const cards = JSON.parse(brotliDecompressSync(readFileSync(root + "apps/backend/data/cardDetailByOracleId.json.br")));
const rulings = JSON.parse(brotliDecompressSync(readFileSync(root + "apps/backend/data/cardRulingsByOracleId.json.br")));
const { rows } = JSON.parse(readFileSync(new URL("./mechanics-result.json", import.meta.url), "utf8"));
const patterns = {
  "Tap and Untap": /\b(tap|untap)\b/i,
  "Daybound and Nightbound": /\bdaybound\b/i,
  "The Ring Tempts You": /the ring tempts you/i,
  "Face a Villainous Choice": /villainous choice/i,
  "∞ (Infinity)": /∞/,
  "Visit": /\bvisit\b/i,
  "Space Sculptor": /space sculptor|sector/i
};
const out = [];
for (const r of rows.filter((x) => x.cardsWithKeyword === 0 || x.id === "701.45")) {
  const re = patterns[r.name] ?? new RegExp(`\\b${r.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i");
  const hits = Object.entries(cards).filter(([, c]) => re.test(c.oracleText ?? ""));
  const withRuling = hits.filter(([oid]) => (rulings[oid] ?? []).length > 0);
  out.push(`${r.id}\t${r.name}\tkwCards=${r.cardsWithKeyword}\ttextCards=${hits.length}\ttextCardsWithRuling=${withRuling.length}\tsubrules=${r.subrules}\texamples=${r.exampleLines}`);
}
console.log(out.join("\n"));
const noRulingAnyRoute = rows.filter((r) => r.cardsWithKeywordAndRuling === 0).map((r) => r.id + " " + r.name);
console.log("\nno keyword-field card with a ruling:", noRulingAnyRoute.length, noRulingAnyRoute.join("; "));
