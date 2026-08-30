import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import test from "node:test"

/**
 * Both AWS scripts that install the Lambda's code must stage the package in S3
 * and point Lambda at the object — never upload the zip inline.
 *
 * `update-function-code --zip-file` (and `create-function --zip-file`)
 * base64-encodes the whole archive into the request body, which AWS's
 * request-size limit caps around 50MB. The committed data corpus pushes the
 * package past that, so the direct upload fails with
 * RequestEntityTooLargeException. #REQ-165 moved the deploy to S3 staging
 * (`--s3-bucket`/`--s3-key`, `--code S3Bucket=`), which reads the object
 * directly and is bounded only by Lambda's 250MB unzipped quota.
 *
 * On 2026-08-30 this bit twice: `scripts/aws-deploy.sh` had been converted but
 * `scripts/aws-bootstrap.sh` was left on `--zip-file`, so a bootstrap run on the
 * real (oversized) package failed. This test is the pre-merge signal that keeps
 * BOTH scripts on the S3 path. It runs in `test:scripts` (part of
 * `quality:check`), so a regression back to inline upload fails on the pull
 * request instead of after a merge to `main`.
 */

const here = path.dirname(fileURLToPath(import.meta.url))

/** The scripts that install Lambda code, and must therefore stage via S3. */
const DEPLOY_SCRIPTS = ["aws-deploy.sh", "aws-bootstrap.sh"]

/** Drop whole-line shell comments so explanatory prose (which names these very
 *  flags) can neither satisfy nor trip an assertion — only real commands count. */
function codeOnly(source) {
  return source
    .split("\n")
    .filter((line) => !/^\s*#/.test(line))
    .join("\n")
}

for (const script of DEPLOY_SCRIPTS) {
  test(`${script} stages the Lambda package in S3, never inline --zip-file`, () => {
    const source = codeOnly(fs.readFileSync(path.join(here, script), "utf8"))

    assert.ok(
      !/--zip-file/.test(source),
      `${script} still uses \`--zip-file\`, the ~50MB inline-upload path REQ-165 removed. ` +
        `Stage the package in S3 and point Lambda at it (\`--s3-bucket\`/\`--s3-key\` for ` +
        `update-function-code, \`--code S3Bucket=\` for create-function) instead.`
    )

    assert.match(
      source,
      /aws s3 cp .*artifact_bucket_name/,
      `${script} must copy the packaged zip into the artifact bucket before pointing Lambda at it.`
    )

    assert.ok(
      /--s3-bucket\b/.test(source) || /--code\s+"?S3Bucket=/.test(source),
      `${script} must install the Lambda code from S3 (\`--s3-bucket\`/\`--s3-key\` or \`--code S3Bucket=\`).`
    )
  })
}
