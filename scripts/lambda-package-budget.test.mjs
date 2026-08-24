import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"
import zlib from "node:zlib"

/**
 * The committed data artifacts must leave room for a Lambda deployment package.
 *
 * `UpdateFunctionCode` refuses a request over 70,167,211 bytes. On 2026-08-22 a
 * combo-corpus refresh (#96) pushed the artifacts past that, `deploy` began
 * failing on every push to `main`, and nothing caught it for two days — the job
 * only runs on push, so every pull request reported it as `skipping`.
 *
 * This test is the missing pre-merge signal. It runs in `test:scripts`, which is
 * part of `quality:check`, so an artifact that would break the deploy fails on
 * the pull request instead of after the merge.
 *
 * The budget is measured, not guessed. In the package built on 2026-08-24:
 *
 *     committed data    49.8 MB   (dominated by the two combo artifacts)
 *     node_modules       3.8 MB   (production deps, compressed)
 *     code + manifests   0.1 MB
 *     -------------------------
 *     total             53.8 MB   against a 66.9 MB ceiling
 *
 * The data is what moves; dependencies and code are close to flat. So the budget
 * caps the data and reserves the rest for everything else. It is deliberately
 * not set to the exact current size: an artifact that grows a little should be
 * allowed to, and only a change that genuinely threatens the deploy should fail.
 */
/** AWS's observed limit for a direct `UpdateFunctionCode` upload. */
const LAMBDA_REQUEST_LIMIT = 70_167_211

/** Reserved for node_modules, compiled code, and the package manifests. */
const NON_DATA_RESERVE = 8 * 1024 * 1024

const DATA_BUDGET = LAMBDA_REQUEST_LIMIT - NON_DATA_RESERVE

/**
 * What a file contributes to the zip, not what it occupies on disk.
 *
 * The two are far apart here and in opposite directions: the combo artifacts are
 * already gzip, so they enter the archive at close to their on-disk size, while
 * `cardRulingsByOracleId.json` is 18.6MB of JSON that deflates to about 5MB.
 * Budgeting on-disk size would fail on a package that deploys fine.
 *
 * Already-compressed formats are counted verbatim rather than re-deflated —
 * deflate cannot shrink them, and re-running it over 46MB on every test run
 * costs real time for a number already known.
 */
const INCOMPRESSIBLE = /\.(gz|br|zip|png|jpg|jpeg|webp)$/i

function packagedSize(absolute) {
  const { size } = fs.statSync(absolute)
  if (INCOMPRESSIBLE.test(absolute)) return size
  return zlib.deflateSync(fs.readFileSync(absolute), { level: 6 }).length
}

/**
 * Only tracked files ship. An untracked local artifact — a Scryfall bulk dump,
 * a scratch file — is not in the CI checkout and must not fail this test.
 */
function trackedDataFiles() {
  const listed = new Set(
    fs
      .readFileSync(path.resolve(".git/index"), null)
      .toString("latin1")
      .match(/apps\/backend\/data\/[^\0]*/g) ?? []
  )
  return [...listed]
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
    `apps/backend/data contributes ${(total / 1048576).toFixed(1)}MB to the package, over the ${(DATA_BUDGET / 1048576).toFixed(1)}MB budget ` +
      `that keeps the Lambda package under AWS's ${(LAMBDA_REQUEST_LIMIT / 1048576).toFixed(1)}MB request limit. ` +
      `Largest: ${largest}. Raise MIN_VARIANT_POPULARITY in ` +
      `scripts/build-commander-spellbook-combos.mjs and re-run with --trim-committed, or move the deploy to an S3 upload.`
  )
})
