import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

// REGRESSION GUARD (REQ-188, NFR-018): the paid answer half and the investigation tooling are never a
// gate. No gate script and no CI workflow may invoke the answer-quality run (routine or experiment),
// its compare report, its manifest generator, or the evidence trace and its compare. The files below
// name every such command; the guard fails if any of them appears in a gate.

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const NEVER_IN_A_GATE = [
  "eval:answer-quality", // also covers :compare and :manifests
  "eval:evidence-trace", // also covers :compare
  "eval-answer-quality",
  "eval-answer-compare",
  "eval-evidence-trace",
  "build-answer-quality-manifests",
  "diagnostic-arms-check",
  "--confirm-live-calls"
];

test("no gate script and no CI workflow invokes the answer-quality run, its compare, its manifest generator, or the evidence trace", async () => {
  const rootPkg = JSON.parse(await readFile(join(repoRoot, "package.json"), "utf8"));
  const backendPkg = JSON.parse(await readFile(join(repoRoot, "apps/backend/package.json"), "utf8"));
  const frontendPkg = JSON.parse(await readFile(join(repoRoot, "apps/frontend/package.json"), "utf8"));

  const gateScripts = {
    "package.json quality:check": rootPkg.scripts["quality:check"],
    "package.json test": rootPkg.scripts.test,
    "package.json test:scripts": rootPkg.scripts["test:scripts"],
    "package.json coverage:check": rootPkg.scripts["coverage:check"],
    "package.json lint": rootPkg.scripts.lint,
    "package.json typecheck": rootPkg.scripts.typecheck,
    "package.json format:check": rootPkg.scripts["format:check"],
    "apps/backend/package.json test": backendPkg.scripts.test,
    "apps/backend/package.json test:coverage": backendPkg.scripts["test:coverage"],
    "apps/backend/package.json test:eval": backendPkg.scripts["test:eval"],
    "apps/backend/package.json typecheck": backendPkg.scripts.typecheck,
    "apps/frontend/package.json test": frontendPkg.scripts.test,
    "apps/frontend/package.json typecheck": frontendPkg.scripts.typecheck
  };
  for (const [name, command] of Object.entries(gateScripts)) {
    assert.ok(command, `expected ${name} to exist`);
    for (const forbidden of NEVER_IN_A_GATE) {
      assert.ok(!command.includes(forbidden), `${name} must never invoke ${forbidden}, but reads: ${command}`);
    }
  }

  const workflowDir = join(repoRoot, ".github/workflows");
  const workflows = (await readdir(workflowDir)).filter((name) => /\.ya?ml$/.test(name));
  assert.ok(workflows.length > 0, "the CI workflow exists");
  for (const name of workflows) {
    const text = await readFile(join(workflowDir, name), "utf8");
    for (const forbidden of NEVER_IN_A_GATE) {
      assert.ok(!text.includes(forbidden), `.github/workflows/${name} must never invoke ${forbidden}`);
    }
  }

  // Each command exists exactly once, as its own on-demand script.
  const expected = {
    "eval:answer-quality": "tsx scripts/eval-answer-quality.mjs",
    "eval:answer-quality:compare": "node scripts/eval-answer-compare.mjs",
    "eval:answer-quality:manifests": "tsx scripts/build-answer-quality-manifests.mjs",
    "eval:evidence-trace": "tsx scripts/eval-evidence-trace.mjs",
    "eval:evidence-trace:compare": "node scripts/eval-evidence-trace-compare.mjs"
  };
  for (const [script, command] of Object.entries(expected)) assert.equal(rootPkg.scripts[script], command, `${script} is registered as its own on-demand script`);
});
