import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import test from "node:test"

/**
 * The backend allows exactly one browser origin (`FRONTEND_ORIGIN` → CORS in
 * `apps/backend/src/app/createApp.ts`). With a custom domain on the CloudFront
 * distribution (DEC-084) that origin must be the domain players actually type,
 * not the raw `*.cloudfront.net` hostname — otherwise the app loads and every
 * Ask-the-Judge call is rejected by CORS.
 *
 * Two scripts write that env var, and both rewrite it unconditionally on every
 * run, so a value fixed by hand is clobbered by the next deploy. These tests pin
 * the rule for both:
 *
 * - `aws-deploy.sh` (CI, every push to `main`) derives the origin from the
 *   distribution's live alias, falling back to the CloudFront hostname when no
 *   alias is attached. The live distribution is the single source of truth, so
 *   the deploy follows whatever the bootstrap attached and never needs a second
 *   copy of the domain.
 * - `aws-bootstrap.sh` (admin, one-off) attaches the domain: ACM certificate in
 *   us-east-1 (the only region CloudFront accepts), Route 53 validation and
 *   alias records, and the distribution update guarded by its ETag.
 */

const here = path.dirname(fileURLToPath(import.meta.url))

/** Drop whole-line shell comments so prose can neither satisfy nor trip an
 *  assertion — only real commands count. */
function codeOnly(file) {
  return fs
    .readFileSync(path.join(here, file), "utf8")
    .split("\n")
    .filter((line) => !/^\s*#/.test(line))
    .join("\n")
}

test("aws-deploy.sh derives FRONTEND_ORIGIN from the distribution's alias, with the CloudFront hostname as fallback", () => {
  const source = codeOnly("aws-deploy.sh")

  assert.match(
    source,
    /Aliases\.Items/,
    "aws-deploy.sh must read the distribution's alias list to find the player-facing domain."
  )
  assert.match(
    source,
    /Distribution\.DomainName/,
    "aws-deploy.sh must keep the CloudFront hostname as the fallback for a distribution with no alias."
  )
  assert.match(source, /FRONTEND_ORIGIN=\$frontend_origin/)
  assert.match(
    source,
    /frontend_origin="https:\/\/\$frontend_alias"/,
    "the alias, when present, must become FRONTEND_ORIGIN; the CloudFront hostname is only the fallback."
  )
})

test("aws-bootstrap.sh attaches the custom domain end to end", () => {
  const source = codeOnly("aws-bootstrap.sh")

  assert.match(
    source,
    /aws acm request-certificate[\s\S]*?--region us-east-1/,
    "the certificate must live in us-east-1 for CloudFront."
  )
  assert.match(source, /--validation-method DNS/)
  assert.match(source, /aws acm wait certificate-validated/)
  assert.match(source, /aws route53 change-resource-record-sets/)
  assert.match(
    source,
    /Z2FDTNDATAQYW2/,
    "Route 53 alias records to CloudFront use CloudFront's fixed hosted zone id."
  )
  assert.match(source, /"AAAA"/, "an IPv6 alias record must accompany the A record.")
  assert.match(
    source,
    /aws cloudfront update-distribution[\s\S]*?--if-match/,
    "the distribution update must be ETag-guarded."
  )
  assert.match(
    source,
    /scripts\/lib\/cloudfront-custom-domain\.mjs/,
    "the config transform lives in the tested module, not inline."
  )
  assert.match(source, /FRONTEND_ORIGIN=\$frontend_origin/)
})

test("both scripts still set every non-secret Lambda env key", () => {
  for (const file of ["aws-deploy.sh", "aws-bootstrap.sh"]) {
    const source = codeOnly(file)
    for (const key of [
      "NODE_ENV",
      "ASK_AI_PROVIDER",
      "OPENAI_MODEL",
      "OPENAI_API_KEY_SSM_PARAM",
      "FRONTEND_ORIGIN"
    ]) {
      assert.match(source, new RegExp(`${key}=`), `${file} must still set ${key}`)
    }
  }
})
