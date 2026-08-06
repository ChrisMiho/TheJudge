import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import test from "node:test";

import { parse } from "yaml";

// CI no longer runs the aggregate `quality:check`; it runs the chain's
// sub-scripts as separate parallel jobs. That decomposition is fast but it is
// not self-maintaining: adding a check to `quality:check` would pass locally
// while CI silently never ran it. These tests keep the local command and the CI
// decomposition provably equivalent.

const ROOT = new URL("../", import.meta.url);
const WORKFLOWS = new URL(".github/workflows/", ROOT);
const GATE_WORKFLOW = "quality-check.yml";
const AGGREGATE = "quality:check";

const packageJson = JSON.parse(readFileSync(new URL("package.json", ROOT), "utf8"));
const scripts = packageJson.scripts ?? {};

// A CI job may satisfy a sub-script through a decomposed form that cannot be
// derived from package.json (sharding, for example). Each entry is a deliberate
// declaration: adding one is a reviewable act, not an accident.
const CI_DECOMPOSITIONS = [];

const normalize = (command) => command.trim().replace(/\s+/g, " ");

/**
 * Expand a shell command into the leaf commands it ultimately runs, following
 * `npm run <script>` references into the root package.json chain.
 */
function expandLeaves(command, seen = new Set()) {
  const leaves = [];
  for (const rawSegment of command.split("&&")) {
    const segment = normalize(rawSegment);
    if (!segment) continue;

    const scriptRef = /^npm run ([\w:-]+)$/.exec(segment);
    const name = scriptRef?.[1];
    if (name && Object.hasOwn(scripts, name) && !seen.has(name)) {
      leaves.push(...expandLeaves(scripts[name], new Set([...seen, name])));
      continue;
    }
    leaves.push(segment);
  }
  return leaves;
}

function loadWorkflow(file) {
  return parse(readFileSync(new URL(file, WORKFLOWS), "utf8"));
}

/**
 * Jobs that run on pull requests. A sub-script executed only by the deploy job
 * is not gating anything, so it must not count as coverage.
 */
function gateJobs(workflow) {
  return Object.entries(workflow.jobs ?? {}).filter(
    ([, job]) => !String(job.if ?? "").includes("event_name == 'push'")
  );
}

function gateJobLeaves(workflow) {
  const leaves = new Set();
  for (const [, job] of gateJobs(workflow)) {
    for (const step of job.steps ?? []) {
      if (typeof step.run !== "string") continue;
      for (const leaf of expandLeaves(step.run)) leaves.add(leaf);
    }
  }
  return leaves;
}

test("CI runs every quality:check sub-script", () => {
  assert.ok(scripts[AGGREGATE], `package.json must define "${AGGREGATE}"`);

  const workflow = loadWorkflow(GATE_WORKFLOW);
  const covered = gateJobLeaves(workflow);
  const expected = expandLeaves(scripts[AGGREGATE]);
  assert.ok(expected.length > 0, `"${AGGREGATE}" expanded to no commands`);

  const missing = expected.filter(
    (leaf) =>
      !covered.has(leaf) &&
      !CI_DECOMPOSITIONS.some(
        (entry) =>
          entry.subScript === leaf && [...covered].some((c) => entry.satisfiedBy.test(c))
      )
  );

  assert.deepEqual(
    missing,
    [],
    `${GATE_WORKFLOW} does not run these "${AGGREGATE}" sub-commands in any ` +
      `pull-request job. Add a job/step that runs them, or declare a deliberate ` +
      `CI decomposition in CI_DECOMPOSITIONS.`
  );
});

test("no workflow re-runs the aggregate quality:check", () => {
  const offenders = [];
  for (const file of readdirSync(WORKFLOWS)) {
    if (!/\.ya?ml$/.test(file)) continue;
    const workflow = loadWorkflow(file);
    for (const [jobName, job] of Object.entries(workflow.jobs ?? {})) {
      for (const step of job.steps ?? []) {
        if (typeof step.run === "string" && step.run.includes(`npm run ${AGGREGATE}`)) {
          offenders.push(`${file}:${jobName}`);
        }
      }
    }
  }

  assert.deepEqual(
    offenders,
    [],
    `The aggregate "${AGGREGATE}" must not run in CI — running it alongside the ` +
      `decomposed jobs executes every test twice (DEC-086, NFR-012).`
  );
});

test("deploy credentials stay scoped to the deploy job", () => {
  const workflow = loadWorkflow(GATE_WORKFLOW);
  assert.ok(
    !("id-token" in (workflow.permissions ?? {})),
    "id-token must not be granted at workflow level — PR jobs would inherit it"
  );

  const holders = Object.entries(workflow.jobs ?? {})
    .filter(([, job]) => (job.permissions ?? {})["id-token"] === "write")
    .map(([name]) => name);

  assert.deepEqual(holders, ["deploy"], "only the deploy job may request id-token: write");

  const deploy = workflow.jobs.deploy;
  assert.match(
    String(deploy.if ?? ""),
    /github\.event_name == 'push'/,
    "deploy must be restricted to push events"
  );
  assert.ok(
    (deploy.needs ?? []).length > 0,
    "deploy must depend on the gate jobs via needs:"
  );
});
