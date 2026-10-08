// REQ-222: the committed ratchet baseline for the offline prompt gate's rule
// check: for each case, which deciding rules reached the prompt (hit) and which
// did not (miss) the last time `npm run eval:rules-gate:baseline` ran, plus,
// apart from those, which a selected curated topic carries (`inTopic`, written
// only when non-empty). The gate fails only when a recorded hit or `inTopic`
// rule reaches the prompt by neither route. Same shape as REQ-177's
// `benchmark/step1-baseline.json`.

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { RulesGateBaseline } from "./rulesGate.js";

const currentDir = dirname(fileURLToPath(import.meta.url));

export const BASELINE_PATH = resolve(currentDir, "baseline.json");

/** Reads the committed baseline; a missing file is an empty baseline (nothing yet to lose). */
export function loadBaseline(path = BASELINE_PATH): RulesGateBaseline {
  try {
    return JSON.parse(readFileSync(path, "utf8")) as RulesGateBaseline;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return { cases: {} };
    throw error;
  }
}
