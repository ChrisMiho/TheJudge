/**
 * Attach a CloudFront response headers policy to a distribution (REQ-197).
 *
 * `scripts/aws-bootstrap.sh` creates or updates a named response headers
 * policy, fetches the live distribution config with
 * `aws cloudfront get-distribution-config`, hands the JSON here, and sends the
 * result back with `update-distribution --if-match <ETag>` — the same
 * pure-transform-plus-shell split `scripts/lib/cloudfront-custom-domain.mjs`
 * already uses for the certificate/alias/redirect attachment.
 *
 * Every response CloudFront serves for `mtgjudge.gg` carries five standard
 * security headers. Four are CloudFront's built-in `SecurityHeadersConfig`
 * fields; `Permissions-Policy` has no built-in field, so it ships as a custom
 * header. Deliberately absent: `Content-Security-Policy` (no staging
 * distribution to verify one against — a wrong policy silently breaks the
 * app's own bundle or its cross-origin call to the Lambda Function URL) and
 * HSTS `preload` (effectively one-way, binds every future subdomain).
 *
 * Usage from the shell:
 *   node scripts/lib/cloudfront-response-headers.mjs config <policy-name>
 *     prints the ResponseHeadersPolicyConfig body `create-response-headers-policy`
 *     / `update-response-headers-policy` want
 *   node scripts/lib/cloudfront-response-headers.mjs check <distribution-config.json> <response-headers-policy.json|NONE>
 *     exits 0 when the distribution's default cache behavior already
 *     references a response headers policy with this exact header set, 1
 *     otherwise (pass NONE when no policy is attached yet)
 *   node scripts/lib/cloudfront-response-headers.mjs attach <distribution-config.json> <policy-id>
 *     prints the updated DistributionConfig (the body `update-distribution` wants)
 */

import fs from "node:fs"
import { pathToFileURL } from "node:url"

/**
 * The five header values every response carries, verbatim. This is the single
 * source of truth other things are checked against; there is deliberately no
 * `content-security-policy` key here.
 * @type {Record<string, string>}
 */
export const SECURITY_HEADERS = {
  "strict-transport-security": "max-age=31536000; includeSubDomains",
  "x-content-type-options": "nosniff",
  "x-frame-options": "SAMEORIGIN",
  "referrer-policy": "strict-origin-when-cross-origin",
  // camera stays allowed for the Scan feature's getUserMedia call
  // (apps/frontend/src/components/ScanCameraSurface.tsx) — a blanket
  // camera=() would silently break card scanning.
  "permissions-policy": "camera=(self), microphone=(), geolocation=()"
}

/**
 * @param {string} name a unique CloudFront response-headers-policy name
 * @returns {object} a `ResponseHeadersPolicyConfig` body — the input
 *   `create-response-headers-policy` / `update-response-headers-policy` want.
 *   Pure: builds no AWS SDK calls.
 */
export function buildResponseHeadersPolicyConfig(name) {
  return {
    Name: name,
    Comment: "thejudge production security headers (REQ-197)",
    SecurityHeadersConfig: {
      StrictTransportSecurity: {
        Override: true,
        IncludeSubdomains: true,
        Preload: false,
        AccessControlMaxAgeSec: 31536000
      },
      ContentTypeOptions: { Override: true },
      FrameOptions: { Override: true, FrameOption: "SAMEORIGIN" },
      ReferrerPolicy: { Override: true, ReferrerPolicy: "strict-origin-when-cross-origin" }
    },
    CustomHeadersConfig: {
      Quantity: 1,
      Items: [
        {
          Header: "Permissions-Policy",
          Value: SECURITY_HEADERS["permissions-policy"],
          Override: true
        }
      ]
    }
  }
}

/**
 * Renders the literal HTTP header values a `ResponseHeadersPolicyConfig`
 * would produce, the way CloudFront does at the edge. Pure and AWS-free, so
 * `buildResponseHeadersPolicyConfig`'s output can be asserted against
 * `SECURITY_HEADERS` without a live distribution.
 * @param {object} policyConfig a `ResponseHeadersPolicyConfig` body
 * @returns {Record<string, string>}
 */
export function renderedHeaders(policyConfig) {
  const headers = {}
  const security = policyConfig?.SecurityHeadersConfig ?? {}

  if (security.StrictTransportSecurity) {
    const { AccessControlMaxAgeSec, IncludeSubdomains, Preload } = security.StrictTransportSecurity
    let value = `max-age=${AccessControlMaxAgeSec}`
    if (IncludeSubdomains) value += "; includeSubDomains"
    if (Preload) value += "; preload"
    headers["strict-transport-security"] = value
  }
  if (security.ContentTypeOptions) {
    headers["x-content-type-options"] = "nosniff"
  }
  if (security.FrameOptions) {
    headers["x-frame-options"] = security.FrameOptions.FrameOption
  }
  if (security.ReferrerPolicy) {
    headers["referrer-policy"] = security.ReferrerPolicy.ReferrerPolicy
  }
  if (security.ContentSecurityPolicy) {
    headers["content-security-policy"] = security.ContentSecurityPolicy.ContentSecurityPolicy
  }
  for (const item of policyConfig?.CustomHeadersConfig?.Items ?? []) {
    headers[item.Header.toLowerCase()] = item.Value
  }
  return headers
}

/**
 * @param {object} policyConfig a `ResponseHeadersPolicyConfig` body, as read
 *   back from `get-response-headers-policy`
 * @returns {boolean} true when its header set exactly matches `SECURITY_HEADERS`
 */
function headersConfigMatchesExpected(policyConfig) {
  if (!policyConfig) return false
  if (policyConfig.SecurityHeadersConfig?.ContentSecurityPolicy) return false
  const rendered = renderedHeaders(policyConfig)
  const expectedKeys = Object.keys(SECURITY_HEADERS)
  const renderedKeys = Object.keys(rendered)
  if (renderedKeys.length !== expectedKeys.length) return false
  return expectedKeys.every((key) => rendered[key] === SECURITY_HEADERS[key])
}

/**
 * @param {{ DistributionConfig: object }} getDistributionConfigOutput
 * @param {{ ResponseHeadersPolicy: { Id: string, ResponseHeadersPolicyConfig: object } } | null} getResponseHeadersPolicyOutput
 *   the `aws cloudfront get-response-headers-policy --id <id>` output for the
 *   policy currently referenced by the distribution, or `null`/absent when
 *   none is attached
 * @returns {boolean} true when `attachResponseHeadersPolicy` would change
 *   nothing that matters — the distribution already references a policy
 *   carrying this exact header set
 */
export function hasResponseHeadersPolicy(getDistributionConfigOutput, getResponseHeadersPolicyOutput) {
  const attachedId = getDistributionConfigOutput.DistributionConfig?.DefaultCacheBehavior?.ResponseHeadersPolicyId
  if (!attachedId) return false

  const policy = getResponseHeadersPolicyOutput?.ResponseHeadersPolicy
  if (!policy || policy.Id !== attachedId) return false

  return headersConfigMatchesExpected(policy.ResponseHeadersPolicyConfig)
}

/**
 * @param {{ DistributionConfig: object }} getDistributionConfigOutput
 * @param {string} responseHeadersPolicyId
 * @returns {object} a new DistributionConfig body with only
 *   `DefaultCacheBehavior.ResponseHeadersPolicyId` changed
 */
export function attachResponseHeadersPolicy(getDistributionConfigOutput, responseHeadersPolicyId) {
  const config = structuredClone(getDistributionConfigOutput.DistributionConfig)
  const behavior = config.DefaultCacheBehavior
  if (!behavior) {
    throw new Error("DistributionConfig.DefaultCacheBehavior is missing; is this a get-distribution-config output?")
  }
  behavior.ResponseHeadersPolicyId = responseHeadersPolicyId
  return config
}

const USAGE =
  "usage: cloudfront-response-headers.mjs config <policy-name>\n" +
  "       cloudfront-response-headers.mjs check <get-distribution-config.json> <get-response-headers-policy.json|NONE>\n" +
  "       cloudfront-response-headers.mjs attach <get-distribution-config.json> <policy-id>\n"

function main(argv) {
  const [command, ...rest] = argv

  if (command === "config") {
    const [name] = rest
    if (!name) {
      process.stderr.write(USAGE)
      return 2
    }
    process.stdout.write(`${JSON.stringify(buildResponseHeadersPolicyConfig(name), null, 2)}\n`)
    return 0
  }

  if (command === "check") {
    const [distributionConfigPath, policyPath] = rest
    if (!distributionConfigPath || !policyPath) {
      process.stderr.write(USAGE)
      return 2
    }
    const distributionConfigOutput = JSON.parse(fs.readFileSync(distributionConfigPath, "utf8"))
    const policyOutput = policyPath === "NONE" ? null : JSON.parse(fs.readFileSync(policyPath, "utf8"))
    return hasResponseHeadersPolicy(distributionConfigOutput, policyOutput) ? 0 : 1
  }

  if (command === "attach") {
    const [distributionConfigPath, policyId] = rest
    if (!distributionConfigPath || !policyId) {
      process.stderr.write(USAGE)
      return 2
    }
    const distributionConfigOutput = JSON.parse(fs.readFileSync(distributionConfigPath, "utf8"))
    process.stdout.write(`${JSON.stringify(attachResponseHeadersPolicy(distributionConfigOutput, policyId), null, 2)}\n`)
    return 0
  }

  process.stderr.write(USAGE)
  return 2
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = main(process.argv.slice(2))
}
