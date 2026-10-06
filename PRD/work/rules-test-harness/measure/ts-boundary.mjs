// Define attempt 6 (M17): can a backend vitest test import a `scripts/lib/*.mjs`
// module with one copy and keep `npm run typecheck` green?
//
// Builds a throwaway tree in the OS temp dir that mirrors the repo layout
// (scripts/lib/ beside apps/backend/src/eval/), copies the two committed
// modules in unchanged, and writes a scratch apps/backend/tsconfig.json with
// the backend's compiler options (extends the real tsconfig.base.json;
// module/moduleResolution NodeNext, types node, rootDir src, include src).
// Then it runs three variants under `tsc --noEmit` (the backend typecheck)
// and the winning variant under `tsc` with emit (the backend build) and
// `vitest run`. Reads committed case files only. No network, no model call.
// The temp tree is deleted at the end.
//
// Usage: node PRD/work/rules-test-harness/measure/ts-boundary.mjs

import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
const casesDir = join(repoRoot, "apps/backend/src/eval/worked-solutions");
const bin = (name) => join(repoRoot, "node_modules/.bin", name);

const root = mkdtempSync(join(tmpdir(), "ts-boundary-"));
const lib = join(root, "scripts/lib");
const backend = join(root, "apps/backend");
const evalDir = join(backend, "src/eval");
mkdirSync(lib, { recursive: true });
mkdirSync(evalDir, { recursive: true });
symlinkSync(join(repoRoot, "node_modules"), join(root, "node_modules"));
copyFileSync(join(repoRoot, "scripts/lib/gold-cases.mjs"), join(lib, "gold-cases.mjs"));
copyFileSync(join(repoRoot, "scripts/lib/prompt-fidelity.mjs"), join(lib, "prompt-fidelity.mjs"));

writeFileSync(
  join(backend, "tsconfig.json"),
  JSON.stringify(
    {
      extends: join(repoRoot, "tsconfig.base.json"),
      compilerOptions: {
        module: "NodeNext",
        moduleResolution: "NodeNext",
        types: ["node"],
        rootDir: "src",
        outDir: "dist"
      },
      include: ["src"]
    },
    null,
    2
  )
);

const staticTest = `import { describe, expect, it } from "vitest";
import { loadGoldCases, REQUIRED_SIX_CASE_IDS } from "../../../../scripts/lib/gold-cases.mjs";
import { buildCaseRequest } from "../../../../scripts/lib/prompt-fidelity.mjs";

describe("one-copy loader across the boundary", () => {
  it("loads every committed case and builds its request", async () => {
    const cases = await loadGoldCases(${JSON.stringify(casesDir)});
    expect(cases.length).toBe(18);
    expect(REQUIRED_SIX_CASE_IDS.length).toBe(6);
    const tier2 = cases.filter((entry) => entry.tier === 2).map(buildCaseRequest);
    expect(tier2.length).toBe(3);
    expect(tier2.every((request) => request.cards?.length === 1)).toBe(true);
  });
});
`;

const dynamicTest = `import { expect, it } from "vitest";
const loaderPath = "../../../../scripts/lib/gold-cases.mjs";
it("loads through a variable-path dynamic import", async () => {
  const { loadGoldCases } = await import(loaderPath);
  const cases = await loadGoldCases(${JSON.stringify(casesDir)});
  expect(cases.length).toBe(18);
});
`;

const goldCasesDecl = `export declare const CASES_DIR: string;
export declare const REQUIRED_SIX_CASE_IDS: readonly string[];
export interface GoldCase {
  id: string;
  question: string;
  tier: 1 | 2;
  source: { publisher: string; license: string; ruleId?: string; cardName?: string; oracleId?: string; rulingDate?: string };
  [field: string]: unknown;
}
export declare function validateGoldCase(caseEntry: unknown): { valid: boolean; errors: string[] };
export declare function readCaseFiles(casesDir?: string): Promise<Array<{ fileName: string; case: unknown }>>;
export declare function loadGoldCases(casesDir?: string): Promise<GoldCase[]>;
`;

const promptFidelityDecl = `import type { GoldCase } from "./gold-cases.mjs";
export interface CaseRequest {
  mode: "lookup" | "game";
  question: string;
  cards?: Array<{ cardId: string; name: string }>;
  gameContext?: unknown;
}
export declare function buildCaseRequest(caseEntry: GoldCase): CaseRequest;
`;

function run(label, command, args, cwd) {
  try {
    const out = execFileSync(command, args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    console.log(`${label}: exit 0`);
    const summary = out.split("\n").filter((line) => /Tests|Test Files|passed|failed/.test(line));
    if (summary.length > 0) console.log(summary.map((line) => `  ${line.trim()}`).join("\n"));
  } catch (error) {
    console.log(`${label}: exit ${error.status}`);
    const text = `${error.stdout ?? ""}${error.stderr ?? ""}`;
    const lines = text.split("\n").filter((line) => /error TS|FAIL|Tests|failed/.test(line));
    console.log(lines.map((line) => `  ${line.replace(root, "<tmp>").trim()}`).join("\n"));
  }
}

const tsc = bin("tsc");
const vitest = bin("vitest");
const staticTestPath = join(evalDir, "boundary.test.ts");
const dynamicTestPath = join(evalDir, "boundary-dynamic.test.ts");

try {
  // Variant 1: static import, no declaration (what A3 said before attempt 6).
  writeFileSync(staticTestPath, staticTest);
  run("V1 static import, no declaration: tsc --noEmit", tsc, ["-p", "tsconfig.json", "--noEmit"], backend);

  // Variant 2: static import plus a sibling .d.mts beside each .mjs.
  writeFileSync(join(lib, "gold-cases.d.mts"), goldCasesDecl);
  writeFileSync(join(lib, "prompt-fidelity.d.mts"), promptFidelityDecl);
  run("V2 static import, sibling .d.mts: tsc --noEmit", tsc, ["-p", "tsconfig.json", "--noEmit"], backend);
  run("V2 static import, sibling .d.mts: tsc (emit, the backend build)", tsc, ["-p", "tsconfig.json"], backend);
  run("V2 static import, sibling .d.mts: vitest run", vitest, ["run", "--root", backend, "src/eval/boundary.test.ts"], backend);

  // Variant 3: variable-path dynamic import, no declaration.
  rmSync(staticTestPath);
  rmSync(join(lib, "gold-cases.d.mts"));
  rmSync(join(lib, "prompt-fidelity.d.mts"));
  writeFileSync(dynamicTestPath, dynamicTest);
  run("V3 variable-path dynamic import: tsc --noEmit", tsc, ["-p", "tsconfig.json", "--noEmit"], backend);
  run("V3 variable-path dynamic import: vitest run", vitest, ["run", "--root", backend, "src/eval/boundary-dynamic.test.ts"], backend);
} finally {
  rmSync(root, { recursive: true, force: true });
}
