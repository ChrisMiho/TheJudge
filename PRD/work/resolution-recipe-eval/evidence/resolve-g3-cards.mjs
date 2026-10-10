// Evidence script for GATE-QUESTIONS.md G3: resolves every card named in a G3
// slot to its oracle id and prints the committed oracle text it was checked against.
// Offline, read-only. Run from the repo root:
//   node PRD/work/resolution-recipe-eval/evidence/resolve-g3-cards.mjs
// Name -> oracle id: apps/frontend/public/data/cardMetadata.json (`name` -> `cardId`,
// the oracle id). That file skips cards with empty oracle text
// (scripts/build-card-metadata.mjs, finalizeTransformState), so a vanilla creature
// falls back to apps/frontend/public/data/cardScanMap.json (the scanner's printing
// index, `name` -> `oracleId`). Every name must resolve to exactly one oracle id in
// each index that lists it, and the two indexes must agree.
// Text: apps/backend/data/cardDetailByOracleId.json.br (what the prompt prints).
import { readFileSync } from "node:fs";
import { brotliDecompressSync } from "node:zlib";

const names = [
  "Blood Moon", "Urborg, Tomb of Yawgmoth", "Humility", "Opalescence", "Grizzly Bears",
  "Giant Growth", "Turn to Frog", "Kalitas, Traitor of Ghet", "Blood Artist", "Murder",
  "Necropotence", "Borne Upon a Wind", "Silence", "Academy Manufactor", "Esix, Fractal Bloom",
  "Clone", "Frogify", "Serra Angel", "Mycosynth Lattice", "March of the Machines", "Forest", "Island"
];
const meta = JSON.parse(readFileSync("apps/frontend/public/data/cardMetadata.json", "utf8"));
const scan = JSON.parse(readFileSync("apps/frontend/public/data/cardScanMap.json", "utf8"));
const detail = JSON.parse(brotliDecompressSync(readFileSync("apps/backend/data/cardDetailByOracleId.json.br")).toString("utf8"));

const scanIds = new Map();
for (const printing of Object.values(scan)) {
  if (!scanIds.has(printing.name)) scanIds.set(printing.name, new Set());
  scanIds.get(printing.name).add(printing.oracleId);
}

let problems = 0;
for (const name of names) {
  const metaIds = [...new Set(meta.filter((m) => m.name === name).map((m) => m.cardId))];
  const fromScan = [...(scanIds.get(name) ?? [])];
  const source = metaIds.length ? "cardMetadata.json" : "cardScanMap.json (absent from cardMetadata.json)";
  const ids = metaIds.length ? metaIds : fromScan;
  const agree = !metaIds.length || !fromScan.length || (fromScan.length === 1 && fromScan[0] === metaIds[0]);
  if (ids.length !== 1 || !agree) problems += 1;
  const id = ids[0];
  const d = id ? detail[id] : undefined;
  if (!d) problems += 1;
  console.log(`${name}`);
  console.log(`  oracle id: ${ids.join(", ") || "NONE"}  via ${source}${agree ? "" : "  INDEXES DISAGREE"}`);
  console.log(d ? `  ${d.manaCost || "(no cost)"} | ${d.typeLine} | ${JSON.stringify(d.oracleText)}` : "  NOT IN cardDetailByOracleId.json.br");
}
console.log(`\n${names.length} names, ${problems} problem(s)`);
process.exitCode = problems ? 1 : 0;
