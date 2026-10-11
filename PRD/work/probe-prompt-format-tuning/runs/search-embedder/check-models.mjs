// Free, local: download (public weights) and load each candidate embedder in transformers.js,
// then report size on disk, load time, per-query embed latency (1 and 4 threads) and a sanity check.
// Usage (from .worktrees/probe-pft): npx tsx <this file> [model,model,...]
import { MODELS, loadModel, dirSizeMB, modelDir } from "./lib-embed.mjs";

const keys = process.argv[2] ? process.argv[2].split(",") : Object.keys(MODELS);
// sanity texts (written for this probe; not suite content)
const Q = "If my creature with trample is blocked by a creature with protection from green, how much damage can I assign to the player?";
const DOCS = [
  "Keyword Abilities: 702.19b The controller of an attacking creature with trample first assigns damage to the creature(s) blocking it. Once all those blocking creatures are assigned lethal damage, any excess damage is assigned as its controller chooses.",
  "Cleanup Step: 514.1. First, if the active player's hand contains more cards than their maximum hand size (normally seven), they discard enough cards to reduce their hand size to that number.",
  "Mulligans: 103.5. Each player draws a number of cards equal to their starting hand size, which is normally seven."
];
// realistic query lengths for timing: question + compact card signal, ~40-120 word pieces
const TIMING = Array.from({ length: 30 }, (_, i) =>
  `${Q} ${"Llanowar Elves Creature — Elf Druid. Grizzly Bears Creature — Bear trample. ".repeat(1 + (i % 4))} Step ${i}`);
const med = (a) => { const s = [...a].sort((x, y) => x - y); return s[s.length >> 1]; };

for (const key of keys) {
  const m = MODELS[key];
  try {
    const t0 = performance.now();
    let model = await loadModel(key, { threads: 4 }); // first load may download
    const firstMs = performance.now() - t0;
    await model.ex.dispose?.();
    model = await loadModel(key, { threads: 4 }); // timed warm-cache load
    const [qv] = await model.embed([m.q + Q]);
    const dv = await model.embed(DOCS.map((d) => m.d + d));
    const cos = dv.map((v) => v.reduce((s, x, i) => s + x * qv[i], 0));
    const ms4 = [];
    for (const t of TIMING) { const s = performance.now(); await model.embed([m.q + t]); ms4.push(performance.now() - s); }
    await model.ex.dispose?.();
    const one = await loadModel(key, { threads: 1 });
    const ms1 = [];
    for (const t of TIMING) { const s = performance.now(); await one.embed([m.q + t]); ms1.push(performance.now() - s); }
    await one.ex.dispose?.();
    console.log(`${key.padEnd(14)} OK  dims ${qv.length}  size ${dirSizeMB(modelDir(key)).toFixed(0)} MB  first-load ${(firstMs / 1000).toFixed(1)} s  warm load ${model.loadMs.toFixed(0)} ms  ` +
      `ms/query median 4-thread ${med(ms4).toFixed(1)}, 1-thread ${med(ms1).toFixed(1)}  sanity cos [trample ${cos[0].toFixed(3)}, cleanup ${cos[1].toFixed(3)}, mulligan ${cos[2].toFixed(3)}] ${cos[0] > cos[1] && cos[0] > cos[2] ? "pass" : "FAIL"}`);
  } catch (e) {
    console.log(`${key.padEnd(14)} SKIP  ${String(e?.message ?? e).split("\n")[0].slice(0, 200)}`);
  }
}
