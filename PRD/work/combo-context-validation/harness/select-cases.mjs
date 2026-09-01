// Combo-context-validation — case selection (FREE, no model calls).
//
// Streams the processed combo catalog, keeps combos whose every piece is a
// concrete named card resolvable in the local card-metadata lookup, then
// stratifies by popularity and samples a pilot set. Writes cases.json.
//
// Selection rules (see FINDINGS plan):
//   - templateIngredients empty        -> "attach all cards" is a true COMPLETE case
//   - 2..4 cardIngredients             -> within max-5, small enough to reason about
//   - steps + producedEffects present  -> gradable ground truth
//   - every ingredient resolves in cardMetadata.json (real oracle text available)
//
// Usage: node select-cases.mjs [--n 20] [--seed 42]

import { createReadStream } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { createGunzip } from "node:zlib";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, "../../../..");
const COMBOS_GZ = resolve(REPO, "apps/backend/data/commanderSpellbookCombos.json.gz");
const CARD_METADATA = resolve(REPO, "apps/frontend/public/data/cardMetadata.json");
const OUT = resolve(HERE, "cases.json");

function parseArgs(argv) {
  const get = (name, dflt) => {
    const i = argv.indexOf(name);
    return i !== -1 && i + 1 < argv.length ? argv[i + 1] : dflt;
  };
  return { n: Number(get("--n", "20")), seed: Number(get("--seed", "42")) };
}

// Deterministic PRNG so a pilot set is reproducible.
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Incrementally yield each top-level {...} object from a stream of concatenated
// JSON objects, respecting strings and escapes. Never holds the whole file.
async function* streamCombos(path) {
  const gunzip = createReadStream(path).pipe(createGunzip());
  let buf = "";
  let scan = 0;          // scan cursor into buf
  let objStart = -1;     // start of the current top-level object, or -1
  let depth = 0, inStr = false, esc = false;
  for await (const chunk of gunzip) {
    buf += chunk.toString("utf8");
    for (; scan < buf.length; scan++) {
      const c = buf[scan];
      if (inStr) {
        if (esc) esc = false;
        else if (c === "\\") esc = true;
        else if (c === '"') inStr = false;
        continue;
      }
      if (c === '"') { inStr = true; continue; }
      if (c === "{") { if (depth === 0) objStart = scan; depth++; }
      else if (c === "}") {
        depth--;
        if (depth === 0) {
          yield JSON.parse(buf.slice(objStart, scan + 1));
          objStart = -1;
        }
      }
    }
    // Compact once per chunk: drop everything before the live object (or all of
    // it if we're between objects). This keeps buf ~one-object sized, O(n) total.
    const keepFrom = objStart === -1 ? scan : objStart;
    buf = buf.slice(keepFrom);
    scan -= keepFrom;
    if (objStart !== -1) objStart -= keepFrom;
  }
}

async function main() {
  const { n, seed } = parseArgs(process.argv.slice(2));

  console.log("Loading card-metadata lookup...");
  const meta = JSON.parse(await readFile(CARD_METADATA, "utf8"));
  const byId = new Map(meta.map((c) => [c.cardId, c]));
  const byName = new Map(meta.map((c) => [c.name, c]));
  console.log(`  ${meta.length} cards in lookup.`);

  console.log("Streaming combo catalog and filtering...");
  const eligible = [];
  let scanned = 0;
  for await (const combo of streamCombos(COMBOS_GZ)) {
    scanned++;
    if ((combo.templateIngredients?.length ?? 0) !== 0) continue;
    const ing = combo.cardIngredients ?? [];
    if (ing.length < 2 || ing.length > 4) continue;
    if (!combo.steps || !combo.steps.trim()) continue;
    if (!(combo.producedEffects?.length > 0)) continue;
    const resolved = ing.map((c) => byId.get(c.cardId) ?? byName.get(c.cardName));
    if (resolved.some((c) => !c || !c.oracleText)) continue;
    eligible.push({
      variantId: combo.variantId,
      popularity: combo.popularity ?? 0,
      ingredientCount: ing.length,
      cardNames: ing.map((c) => c.cardName),
      cardIds: ing.map((c) => c.cardId),
      // Ground truth for grading — the labeled result the model must reproduce.
      groundTruth: {
        steps: combo.steps,
        producedEffects: combo.producedEffects,
        notablePrerequisites: combo.notablePrerequisites ?? ""
      }
    });
  }
  console.log(`  scanned ${scanned} combos; ${eligible.length} eligible.`);

  // Stratify by popularity into bands, skewing the sample toward mid/low —
  // high-popularity combos are memorized in pretraining and don't test OUR context.
  const rng = mulberry32(seed);
  const shuffle = (arr) => arr.map((v) => [rng(), v]).sort((a, b) => a[0] - b[0]).map((p) => p[1]);
  const sorted = [...eligible].sort((a, b) => b.popularity - a.popularity);
  const bands = {
    high: sorted.filter((c) => c.popularity >= 2000),
    mid: sorted.filter((c) => c.popularity >= 200 && c.popularity < 2000),
    low: sorted.filter((c) => c.popularity >= 1 && c.popularity < 200),
    zero: sorted.filter((c) => c.popularity === 0)
  };
  console.log(
    `  bands: high=${bands.high.length} mid=${bands.mid.length} low=${bands.low.length} zero=${bands.zero.length}`
  );

  // Quota skewed to mid/low/zero. Scale to requested n.
  const quota = { high: 0.15, mid: 0.35, low: 0.3, zero: 0.2 };
  const picked = [];
  const seen = new Set();
  for (const [band, frac] of Object.entries(quota)) {
    const want = Math.round(n * frac);
    for (const c of shuffle(bands[band]).slice(0, want)) {
      if (!seen.has(c.variantId)) { seen.add(c.variantId); picked.push({ ...c, band }); }
    }
  }
  // Top up from any band if rounding left us short.
  for (const c of shuffle([...bands.mid, ...bands.low, ...bands.zero, ...bands.high])) {
    if (picked.length >= n) break;
    if (!seen.has(c.variantId)) { seen.add(c.variantId); picked.push({ ...c, band: c.popularity >= 2000 ? "high" : c.popularity >= 200 ? "mid" : c.popularity >= 1 ? "low" : "zero" }); }
  }

  const cases = picked.slice(0, n).map((c, idx) => ({
    caseId: `combo-${String(idx + 1).padStart(2, "0")}`,
    scenario: "complete", // pilot is complete-combo; partial/unrelated added later
    ...c
  }));

  await writeFile(OUT, JSON.stringify({ generatedAt: new Date().toISOString(), seed, n, cases }, null, 2));
  console.log(`\nWrote ${cases.length} cases to ${OUT}`);
  for (const c of cases) console.log(`  ${c.caseId} [${c.band} pop=${c.popularity}] ${c.cardNames.join(" + ")}`);
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
