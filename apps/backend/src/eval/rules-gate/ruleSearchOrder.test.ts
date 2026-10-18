import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { loadGoldCases, type GoldCase } from "../../../../../scripts/lib/gold-cases.mjs";
import {
  buildCaseRequest,
  loadPromptResources,
  type PromptResources
} from "../../../../../scripts/lib/prompt-fidelity.mjs";
import { DEFAULT_SUPPLEMENTAL_RULE_CAP, preparePromptInput } from "../../prompt/preparation.js";
import { askAiRequestSchema } from "../../validation/askAiRequest.js";
import { buildCaseQueryText, checkReFreeze, hashQueryText, loadFrozenVectors } from "./frozenVectors.js";

// A characterization test for rule search scoring. For every rules-gate case it records, on two paths
// (semantic: the committed frozen vectors; lexical: no query vector), the ordered selected and
// runner-up rule ids, whether the semantic score was used, every rule score in output order, and a
// SHA-256 of the rest of the scored debug output. Everything but the scores must match exactly; each
// score must match to one part in a billion. A refactor of the scoring code that moves any rule or
// order, or changes any score by more than rounding, fails here.
//
// Why scores are not hashed exactly: the IDF weight uses `Math.log`, whose last bit differs between
// CPU architectures (CI runs x86-64, a Mac and Lambda run arm64). The same code gives the same rule
// order on both, but an exact hash of the raw scores would only pass on the architecture that wrote
// the snapshot.
//
// A case whose retrieval query text changed since the snapshot was written (a card-data refresh that
// changed a keyword, say) is skipped and listed instead of failed, the way the rules gate treats a
// case awaiting a re-freeze. When the rule text or the scoring is changed on purpose, regenerate with
//   UPDATE_RULE_SEARCH_ORDER=1 npm --workspace apps/backend run test -- ruleSearchOrder
// and review the diff.
//
// No model call, no network: the same offline posture as the rules gate.
const embedSpy = vi.hoisted(() => vi.fn(async () => {
  throw new Error("the order snapshot must never invoke the embedder");
}));
vi.mock("../../providers/localEmbeddingProvider.js", () => ({
  localEmbeddingProvider: { embed: embedSpy },
  LOCAL_MODEL_ID: "mock",
  LOCAL_MODEL_CACHE_DIR: "mock"
}));

const currentDir = dirname(fileURLToPath(import.meta.url));
const SNAPSHOT_PATH = resolve(currentDir, "ruleSearchOrder.snapshot.json");

type PathRecord = {
  usedSemantic: boolean;
  selected: string[];
  runnerUp: string[];
  /** Every `score` in the scored debug output, in output order. */
  scores: number[];
  /** SHA-256 of the scored debug output with each `score` replaced by null. */
  scoredOutputSha256: string;
};

/** Matches the architecture noise in `Math.log` with a wide margin; any real scoring change is far larger. */
const SCORE_RELATIVE_TOLERANCE = 1e-9;

type CaseRecord = {
  /** SHA-256 of the retrieval query text this record was made from. */
  queryTextHash: string;
  lexical: PathRecord;
  /** Null when the case had no fresh frozen vector. */
  semantic: PathRecord | null;
};

type Snapshot = { supplementalRuleCap: number; cases: Record<string, CaseRecord> };

function sha256(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

/** Splits the debug output into its scores and a hash of everything else. */
function fingerprintScoredOutput(debug: unknown): { scores: number[]; scoredOutputSha256: string } {
  const scores: number[] = [];
  const withoutScores = JSON.stringify(debug, (key, value: unknown) => {
    if (key === "score" && typeof value === "number") {
      scores.push(value);
      return null;
    }
    return value;
  });
  return { scores, scoredOutputSha256: sha256(withoutScores) };
}

function expectPathToMatch(actual: PathRecord | null, expected: PathRecord | null, label: string): void {
  if (!actual || !expected) {
    expect(actual, label).toEqual(expected);
    return;
  }
  const { scores: actualScores, ...actualRest } = actual;
  const { scores: expectedScores, ...expectedRest } = expected;
  expect(actualRest, label).toEqual(expectedRest);
  expect(actualScores, `${label} score count`).toHaveLength(expectedScores.length);
  actualScores.forEach((score, index) => {
    const tolerance = SCORE_RELATIVE_TOLERANCE * Math.max(1, Math.abs(expectedScores[index]));
    expect(Math.abs(score - expectedScores[index]), `${label} score ${index}`).toBeLessThanOrEqual(tolerance);
  });
}

describe("Backend - Game Rules", () => {
  describe("Rule search order", () => {
    let resources: PromptResources;
    let cases: GoldCase[];
    let current: Snapshot;

    beforeAll(async () => {
      vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
        throw new Error("the order snapshot must never use the network");
      });
      resources = await loadPromptResources();
      cases = (await loadGoldCases()).filter((caseEntry: GoldCase) => caseEntry.review.status !== "rejected");
      const vectors = loadFrozenVectors();

      const record: Snapshot = { supplementalRuleCap: DEFAULT_SUPPLEMENTAL_RULE_CAP, cases: {} };
      for (const caseEntry of cases) {
        const request = askAiRequestSchema.parse(buildCaseRequest(caseEntry));
        const freeze = checkReFreeze(caseEntry.id, request, resources.cardDetailIndex, vectors);
        const run = (queryEmbedding: number[] | null, cardEmbeddings?: Map<string, number[]>): PathRecord => {
          const prepared = preparePromptInput(request, {
            ...resources,
            queryEmbedding,
            cardEmbeddings,
            supplementalRuleCap: DEFAULT_SUPPLEMENTAL_RULE_CAP,
            collectEnrichmentDebug: true
          });
          const debug = prepared.enrichmentDebug!.supplemental;
          return {
            usedSemantic: debug.usedSemantic,
            selected: debug.selected.map((rule) => rule.ruleId),
            runnerUp: debug.runnerUp.map((rule) => rule.ruleId),
            ...fingerprintScoredOutput(debug)
          };
        };
        record.cases[caseEntry.id] = {
          queryTextHash: hashQueryText(buildCaseQueryText(request, resources.cardDetailIndex)),
          lexical: run(null),
          semantic: freeze.state === "fresh" ? run(freeze.vector, freeze.cardEmbeddings) : null
        };
      }
      current = record;

      if (process.env.UPDATE_RULE_SEARCH_ORDER === "1") {
        // Formatted with the repo's Prettier config, so `npm run format:check` accepts the committed file.
        const prettier = await import("prettier");
        const config = (await prettier.resolveConfig(SNAPSHOT_PATH)) ?? {};
        writeFileSync(SNAPSHOT_PATH, await prettier.format(JSON.stringify(record), { ...config, filepath: SNAPSHOT_PATH }), "utf8");
      }
    }, 120_000);

    it("ranks every case on the lexical path exactly as the committed snapshot records", () => {
      const snapshot = JSON.parse(readFileSync(SNAPSHOT_PATH, "utf8")) as Snapshot;
      expect(snapshot.supplementalRuleCap).toBe(current.supplementalRuleCap);
      let compared = 0;
      for (const [id, expected] of Object.entries(snapshot.cases)) {
        const actual = current.cases[id];
        if (!actual || actual.queryTextHash !== expected.queryTextHash) continue;
        expectPathToMatch(actual.lexical, expected.lexical, `${id} (lexical)`);
        compared += 1;
      }
      // Most of the corpus must still be compared, or the guard has silently stopped guarding.
      expect(compared).toBeGreaterThan(Object.keys(snapshot.cases).length * 0.9);
    });

    it("ranks every case with a frozen vector exactly as the committed snapshot records, on the semantic path", () => {
      const snapshot = JSON.parse(readFileSync(SNAPSHOT_PATH, "utf8")) as Snapshot;
      let compared = 0;
      for (const [id, expected] of Object.entries(snapshot.cases)) {
        const actual = current.cases[id];
        if (!actual || actual.queryTextHash !== expected.queryTextHash) continue;
        expectPathToMatch(actual.semantic, expected.semantic, `${id} (semantic)`);
        if (expected.semantic) {
          expect(expected.semantic.usedSemantic, `${id} used the semantic score`).toBe(true);
          compared += 1;
        }
      }
      expect(compared).toBeGreaterThan(Object.keys(snapshot.cases).length * 0.9);
    });

    it("runs every non-rejected rules-gate case on both paths without calling the embedder or the network", () => {
      expect(Object.keys(current.cases)).toHaveLength(cases.length);
      expect(cases.length).toBeGreaterThan(300);
      expect(Object.values(current.cases).filter((entry) => entry.semantic !== null).length).toBeGreaterThan(300);
      expect(embedSpy).not.toHaveBeenCalled();
    });
  });
});
