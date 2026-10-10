// Evidence for DESIGN-BRIEF.md "Full name lookup" (Measured coverage) and
// assumption 5, and the REQ-232 Notes line in GATE-QUESTIONS.md.
//
// Reads committed repo data only (no network, no RulesGuru data) and prints
// the counts the brief cites. Run from anywhere:
//   node PRD/work/rulesguru-local-suite/evidence/name-lookup-counts.mjs
// Saved output: name-lookup-counts.out.txt beside this file.
//
// Join, by oracle id:
//   keys  = every oracle id in apps/backend/data/cardDetailByOracleId.json.br
//   name  = apps/frontend/public/data/cardMetadata.json (cardId -> name), else
//           apps/frontend/public/data/cardScanMap.json (oracleId -> name, first
//           printing per oracle id in file order)
// "Non-token" = typeLine without "Token". "No rules text" = empty oracleText.

import { readFileSync, readdirSync } from 'node:fs';
import { brotliDecompressSync } from 'node:zlib';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../../../..');
const at = (p) => resolve(root, p);

const detail = JSON.parse(
  brotliDecompressSync(readFileSync(at('apps/backend/data/cardDetailByOracleId.json.br'))).toString('utf8'),
);
const metadata = JSON.parse(readFileSync(at('apps/frontend/public/data/cardMetadata.json'), 'utf8'));
const scanMap = JSON.parse(readFileSync(at('apps/frontend/public/data/cardScanMap.json'), 'utf8'));

const detailIds = Object.keys(detail);
const detailHasName = detailIds.some((id) => detail[id] && 'name' in detail[id]);

const metaName = new Map();
for (const row of metadata) if (!metaName.has(row.cardId)) metaName.set(row.cardId, row.name);

const scanName = new Map();
for (const entry of Object.values(scanMap)) {
  if (!scanName.has(entry.oracleId)) scanName.set(entry.oracleId, entry.name);
}

const nameOf = new Map();
let fromMetadata = 0;
for (const id of detailIds) {
  if (metaName.has(id)) {
    nameOf.set(id, metaName.get(id));
    fromMetadata += 1;
  } else if (scanName.has(id)) {
    nameOf.set(id, scanName.get(id));
  }
}

const isToken = (id) => /Token/.test(detail[id].typeLine ?? '');
const noRulesText = (id) => !(detail[id].oracleText ?? '').trim();
const isCreature = (id) => /Creature/.test(detail[id].typeLine ?? '');

const blankCreatures = detailIds.filter((id) => isCreature(id) && !isToken(id) && noRulesText(id));
const blankCreaturesNamed = blankCreatures.filter((id) => nameOf.has(id));

const idsByName = new Map();
for (const [id, name] of nameOf) {
  if (isToken(id)) continue;
  if (!idsByName.has(name)) idsByName.set(name, []);
  idsByName.get(name).push(id);
}
const duplicateNonTokenNames = [...idsByName.values()].filter((ids) => ids.length > 1).length;

const corpusCaseFiles = readdirSync(at('apps/backend/src/eval/worked-solutions')).filter((f) =>
  f.endsWith('.case.json'),
).length;

let commit = 'unknown';
try {
  commit = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: root }).toString().trim();
} catch {}

const lines = [
  `commit: ${commit}`,
  `cardDetailByOracleId.json.br oracle ids: ${detailIds.length}`,
  `cardDetailByOracleId.json.br entries carry a name field: ${detailHasName}`,
  `cardMetadata.json rows: ${metadata.length}`,
  `detail ids named from cardMetadata.json: ${fromMetadata}`,
  `detail ids named from cardMetadata.json plus cardScanMap.json: ${nameOf.size}`,
  `detail ids left unnamed: ${detailIds.length - nameOf.size}`,
  `non-token creatures with no rules text: ${blankCreatures.length}`,
  `  of those, named: ${blankCreaturesNamed.length}`,
  `names matching two or more non-token cards: ${duplicateNonTokenNames}`,
  `corpus case files (apps/backend/src/eval/worked-solutions/*.case.json): ${corpusCaseFiles}`,
];
for (const line of lines) console.log(line);
