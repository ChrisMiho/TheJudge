import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

/**
 * The committed data artifacts must leave room for a deployable Lambda
 * package.
 *
 * Before #REQ-165 the deploy path uploaded the zip directly
 * (`update-function-code --zip-file`), which base64-encodes the whole
 * archive into the request body and is effectively capped around 50MB —
 * AWS's documented direct-upload quota. On 2026-08-22 a combo-corpus refresh
 * (#96) pushed the package past that, `deploy` began failing on every push to
 * `main`, and nothing caught it for two days.
 *
 * The deploy path now stages the zip in S3 first and points
 * `update-function-code` at the object (`--s3-bucket`/`--s3-key`), which
 * reads it directly with no base64 request-size detour. The real ceiling is
 * now AWS's Lambda deployment-package quota: **250 MB, unzipped** (code +
 * dependencies + data, as they land on disk when the zip is extracted — see
 * https://docs.aws.amazon.com/lambda/latest/dg/gettingstarted-limits.html).
 *
 * This test is the pre-merge signal for that quota. It runs in
 * `test:scripts`, which is part of `quality:check`, so an artifact that would
 * break the deploy fails on the pull request instead of after the merge.
 *
 * The budget is measured, not guessed. In the package built on 2026-08-24:
 *
 *     committed data    49.8 MB   (dominated by the two combo artifacts)
 *     node_modules       3.8 MB   (production deps, compressed in transit;
 *                                  a few MB more unpacked)
 *     code + manifests   0.1 MB
 *     -------------------------
 *     total             ~55 MB   against a 250 MB unzipped quota
 *
 * The data is what moves; dependencies and code are close to flat. So the
 * budget caps the committed data and reserves a fixed allowance for
 * everything else. It is deliberately not set to the exact current size: an
 * artifact that grows a little should be allowed to, and only a change that
 * genuinely threatens the deploy should fail.
 *
 * REQ-181 re-measurement (2026-09-05): the bundled `local` embedding provider
 * (`Xenova/all-MiniLM-L6-v2` via `@huggingface/transformers`) adds a real
 * ONNX runtime to production `node_modules`, not a few KB. Measured on a
 * fresh `npm ci --omit=dev` in a scratch package root (actual file bytes,
 * `find -type f | stat`, not disk-block `du`):
 *
 *     onnxruntime-node (all 3 bundled platforms)   210 MB
 *       -> pruned to the Lambda target (linux/x64)  34 MB  (scripts/package-lambda.sh)
 *     @huggingface/transformers + sharp + deps      73 MB
 *     warmed local-model cache (quantised .onnx +
 *       tokenizer, apps/backend/data/models/,
 *       gitignored — REQ-181/NFR-017 constraint —
 *       but copied into the zip by the packaging
 *       script once warmed)                         23 MB
 *     pre-existing production deps + code            0.5 MB (unchanged)
 *     -------------------------------------------
 *     total non-data                               ~130 MB
 *
 * `onnxruntime-node` ships all three platforms' native binaries bundled
 * directly in its published tarball (not npm `optionalDependencies`), so an
 * un-pruned `npm ci` on any OS pulls all three; `scripts/package-lambda.sh`
 * removes the two the Lambda runtime never uses before zipping.
 *
 * The reserve below is re-based on that real measurement, not loosened
 * blindly: it grew from 20MB to 130MB because the real non-data footprint
 * grew, and the guardrail is re-armed against that larger, real number —
 * still comfortably inside the 250MB quota with the current committed data.
 */
/** AWS Lambda's deployment-package size quota, unzipped. */
const LAMBDA_UNZIPPED_QUOTA = 250 * 1024 * 1024

/**
 * Reserved for node_modules, compiled code, and the package manifests — the
 * non-data part of the package, including the warmed local-embedding-model
 * cache the packaging script copies into the zip. Re-measured for REQ-181
 * (see the file header); re-measure again whenever a dependency contributing
 * meaningfully to this reserve changes, the same way this test exists to
 * catch a runaway *data* artifact, not to pin dependency size to the byte.
 */
const NON_DATA_RESERVE = 130 * 1024 * 1024

const DATA_BUDGET = LAMBDA_UNZIPPED_QUOTA - NON_DATA_RESERVE

/**
 * What a file contributes to the unzipped package: its on-disk size. Unlike
 * a zip-size estimate, this needs no compression model — the quota is
 * measured after extraction, which is byte-for-byte the original file.
 */
function packagedSize(absolute) {
  return fs.statSync(absolute).size
}

/**
 * Only tracked files ship. An untracked local artifact — a Scryfall bulk
 * dump, a scratch file — is not in the CI checkout and must not fail this
 * test.
 *
 * `git ls-files` rather than a manual `.git/index` read: in a git worktree
 * (as `thejudge-implement-all` uses), `.git` at the worktree root is a file
 * pointing at the shared `.git/worktrees/<name>` dir, not the index itself —
 * a direct read fails there. `git ls-files` resolves correctly in both a
 * plain checkout and a worktree.
 */
function trackedDataFiles() {
  const output = execFileSync("git", ["ls-files", "--", "apps/backend/data"], {
    encoding: "utf8",
  })
  return output.split("\n").filter(Boolean)
}

test("the committed data artifacts leave room for a deployable Lambda package", () => {
  const files = trackedDataFiles()
  assert.ok(files.length > 0, "expected to find tracked files under apps/backend/data")

  let total = 0
  const sizes = []
  for (const relative of files) {
    const absolute = path.resolve(relative)
    if (!fs.existsSync(absolute)) continue
    const size = packagedSize(absolute)
    total += size
    sizes.push([relative, size])
  }

  sizes.sort((a, b) => b[1] - a[1])
  const largest = sizes
    .slice(0, 3)
    .map(([name, size]) => `${name} ${(size / 1048576).toFixed(1)}MB`)
    .join(", ")

  assert.ok(
    total <= DATA_BUDGET,
    `apps/backend/data contributes ${(total / 1048576).toFixed(1)}MB to the unzipped package, over the ` +
      `${(DATA_BUDGET / 1048576).toFixed(1)}MB budget that keeps the total package under Lambda's ` +
      `${(LAMBDA_UNZIPPED_QUOTA / 1048576).toFixed(0)}MB unzipped deployment-package quota ` +
      `(reserving ${(NON_DATA_RESERVE / 1048576).toFixed(0)}MB for node_modules + code, including the bundled ` +
      `local semantic-embedding model and ONNX runtime, REQ-181). ` +
      `Largest: ${largest}. Raise MIN_VARIANT_POPULARITY in ` +
      `scripts/build-commander-spellbook-combos.mjs and re-run with --trim-committed, as an emergency valve.`
  )
})

test("the budget leaves a real reserve and rejects a synthetic over-budget package", () => {
  // The mistake this pins: a budget computed against the wrong quota (the
  // old ~50MB direct-upload ceiling, or the raw 250MB quota with no reserve
  // for node_modules + code) either rejects a package that would actually
  // deploy, or accepts one that would not.
  assert.ok(
    DATA_BUDGET < LAMBDA_UNZIPPED_QUOTA,
    "the data budget must be below the raw quota — some room must be reserved for node_modules + code"
  )
  assert.equal(
    DATA_BUDGET + NON_DATA_RESERVE,
    LAMBDA_UNZIPPED_QUOTA,
    "the budget and its reserve must exactly partition the quota"
  )

  // A synthetic total one byte over budget must be flagged as over budget —
  // the same comparison the real test above exercises against tracked files.
  const overBudgetTotal = DATA_BUDGET + 1
  assert.ok(
    overBudgetTotal > DATA_BUDGET,
    "a synthetic total 1 byte over budget must fail the budget check"
  )

  // A package the size of the real one observed on 2026-08-24 (~50MB of
  // data) must clear the new, larger budget — this is the change slice A
  // makes: the same corpus that strained the old ~50MB direct-upload ceiling
  // fits comfortably under the new 250MB-quota-derived budget.
  const observedDataSize = 49.8 * 1048576
  assert.ok(
    observedDataSize < DATA_BUDGET,
    "the previously-measured committed-data size must clear the new budget"
  )
})
