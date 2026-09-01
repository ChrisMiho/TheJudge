// Combo-context-validation — 500-case scenario suite selection (FREE, no model calls).
//
// Streams the combo catalog once, buckets combos into pools, then samples five
// scenario families that stress different parts of the context, not one shape:
//
//   complete  — all concrete cards attached, 2-4 cards        (base rate)
//   large     — all concrete cards attached, exactly 5 cards  (max-attach stress)
//   template  — concrete cards attached, combo ALSO needs a generic piece
//                (templateIngredients non-empty)              (partial-by-design path)
//   partial   — a complete combo with ONE card dropped        (tests REQ-095: name the gap)
//   unrelated — cards pulled from different combos            (negative: expect no combo)
//
// Popularity-stratified within each combo family, skewed to mid/low/zero so the
// result tests OUR context rather than pretraining recall.
//
// Usage: node select-suite.mjs [--complete 250 --large 50 --template 50 --partial 100 --unrelated 50] [--seed 43]

import { createReadStream } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { createGunzip } from "node:zlib";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, "../../../..");
const COMBOS_GZ = resolve(REPO, "apps/backend/data/commanderSpellbookCombos.json.gz");
const CARD_METADATA = resolve(REPO, "apps/frontend/public/data/cardMetadata.json");
const OUT = resolve(HERE, "suite-cases.json");

function parseArgs(argv) {
  const get = (n, d) => { const i = argv.indexOf(n); return i !== -1 && i + 1 < argv.length ? Number(argv[i + 1]) : d; };
  return {
    complete: get("--complete", 250), large: get("--large", 50), template: get("--template", 50),
    partial: get("--partial", 100), unrelated: get("--unrelated", 50), seed: get("--seed", 43)
  };
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

async function* streamCombos(path) {
  const gunzip = createReadStream(path).pipe(createGunzip());
  let buf = "", scan = 0, objStart = -1, depth = 0, inStr = false, esc = false;
  for await (const chunk of gunzip) {
    buf += chunk.toString("utf8");
    for (; scan < buf.length; scan++) {
      const c = buf[scan];
      if (inStr) { if (esc) esc = false; else if (c === "\\") esc = true; else if (c === '"') inStr = false; continue; }
      if (c === '"') { inStr = true; continue; }
      if (c === "{") { if (depth === 0) objStart = scan; depth++; }
      else if (c === "}") { depth--; if (depth === 0) { yield JSON.parse(buf.slice(objStart, scan + 1)); objStart = -1; } }
    }
    const keepFrom = objStart === -1 ? scan : objStart;
    buf = buf.slice(keepFrom); scan -= keepFrom; if (objStart !== -1) objStart -= keepFrom;
  }
}

const bandOf = (p) => (p >= 2000 ? "high" : p >= 200 ? "mid" : p >= 1 ? "low" : "zero");

// Popularity-skewed sample of `n` from a pool of combos.
function sampleByBand(pool, n, shuffle) {
  const bands = { high: [], mid: [], low: [], zero: [] };
  for (const c of pool) bands[bandOf(c.popularity)].push(c);
  const quota = { high: 0.15, mid: 0.35, low: 0.3, zero: 0.2 };
  const picked = [], seen = new Set();
  for (const [b, frac] of Object.entries(quota))
    for (const c of shuffle(bands[b]).slice(0, Math.round(n * frac)))
      if (!seen.has(c.variantId)) { seen.add(c.variantId); picked.push(c); }
  for (const c of shuffle(pool)) { if (picked.length >= n) break; if (!seen.has(c.variantId)) { seen.add(c.variantId); picked.push(c); } }
  return picked.slice(0, n);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const rng = mulberry32(args.seed);
  const shuffle = (arr) => arr.map((v) => [rng(), v]).sort((a, b) => a[0] - b[0]).map((p) => p[1]);

  console.log("Loading card-metadata lookup...");
  const meta = JSON.parse(await readFile(CARD_METADATA, "utf8"));
  const byId = new Map(meta.map((c) => [c.cardId, c]));
  const byName = new Map(meta.map((c) => [c.name, c]));

  console.log("Streaming combo catalog...");
  const poolComplete = [], poolLarge = [], poolTemplate = [];
  let scanned = 0;
  for await (const combo of streamCombos(COMBOS_GZ)) {
    scanned++;
    const ing = combo.cardIngredients ?? [];
    const tmpl = combo.templateIngredients ?? [];
    if (!combo.steps?.trim() || !(combo.producedEffects?.length > 0)) continue;
    if (ing.length < 1 || ing.length > 5) continue;
    const resolved = ing.map((c) => byId.get(c.cardId) ?? byName.get(c.cardName));
    if (resolved.some((c) => !c || !c.oracleText)) continue; // every concrete card must hydrate
    const base = {
      variantId: combo.variantId, popularity: combo.popularity ?? 0,
      cardNames: ing.map((c) => c.cardName), cardIds: ing.map((c) => c.cardId),
      templateNames: tmpl.map((t) => t.templateName ?? t.name ?? "a required piece"),
      groundTruth: { steps: combo.steps, producedEffects: combo.producedEffects, notablePrerequisites: combo.notablePrerequisites ?? "" }
    };
    if (tmpl.length > 0 && ing.length >= 1 && ing.length <= 4) poolTemplate.push(base);
    else if (tmpl.length === 0 && ing.length === 5) poolLarge.push(base);
    else if (tmpl.length === 0 && ing.length >= 2 && ing.length <= 4) poolComplete.push(base);
  }
  console.log(`  scanned ${scanned}; pools: complete=${poolComplete.length} large=${poolLarge.length} template=${poolTemplate.length}`);

  // --- Sample each family ---
  const completeSel = sampleByBand(poolComplete, args.complete, shuffle);
  const largeSel = sampleByBand(poolLarge, args.large, shuffle);
  const templateSel = sampleByBand(poolTemplate, args.template, shuffle);

  // partial: take fresh 3-4 card combos (not overlapping completeSel), drop one card so
  // ≥2 cards remain — a real multi-card context to test "name the missing role" against.
  const usedIds = new Set(completeSel.map((c) => c.variantId));
  const partialSource = sampleByBand(poolComplete.filter((c) => !usedIds.has(c.variantId) && c.cardNames.length >= 3), args.partial, shuffle);
  const partialSel = partialSource.map((c) => {
    const dropIdx = Math.floor(rng() * c.cardNames.length);
    const droppedName = c.cardNames[dropIdx];
    return {
      ...c,
      cardNames: c.cardNames.filter((_, i) => i !== dropIdx),
      cardIds: c.cardIds.filter((_, i) => i !== dropIdx),
      droppedCard: droppedName
    };
  });

  // unrelated: assemble groups of 2-3 cards from DIFFERENT combos (no shared variant),
  // avoiding any pair that co-occurs in a known combo (best-effort: random cross-combo).
  const allCards = shuffle(poolComplete.flatMap((c) => c.cardNames.map((n, i) => ({ name: n, id: c.cardIds[i], variantId: c.variantId }))));
  const unrelatedSel = [];
  let ci = 0;
  while (unrelatedSel.length < args.unrelated && ci + 3 <= allCards.length) {
    const grp = allCards.slice(ci, ci + (2 + (unrelatedSel.length % 2))); ci += 3;
    if (new Set(grp.map((g) => g.variantId)).size !== grp.length) continue; // all from different combos
    unrelatedSel.push({
      variantId: `unrelated-${unrelatedSel.length}`, popularity: -1,
      cardNames: grp.map((g) => g.name), cardIds: grp.map((g) => g.id),
      groundTruth: { expectNoCombo: true }
    });
  }

  // --- Emit unified case list ---
  const stamp = (arr, scenario) => arr.map((c, i) => ({ caseId: `${scenario}-${String(i + 1).padStart(3, "0")}`, scenario, band: bandOf(c.popularity), ...c }));
  const cases = [
    ...stamp(completeSel, "complete"), ...stamp(largeSel, "large"), ...stamp(templateSel, "template"),
    ...stamp(partialSel, "partial"), ...stamp(unrelatedSel, "unrelated")
  ];

  await writeFile(OUT, JSON.stringify({ generatedAt: new Date().toISOString(), seed: args.seed, counts: {
    complete: completeSel.length, large: largeSel.length, template: templateSel.length, partial: partialSel.length, unrelated: unrelatedSel.length, total: cases.length
  }, cases }, null, 2));
  console.log(`\nWrote ${cases.length} cases to ${OUT}`);
  console.log(`  complete=${completeSel.length} large=${largeSel.length} template=${templateSel.length} partial=${partialSel.length} unrelated=${unrelatedSel.length}`);
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
