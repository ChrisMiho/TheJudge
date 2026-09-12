import assert from "node:assert/strict"
import test from "node:test"

import {
  SECURITY_HEADERS,
  attachResponseHeadersPolicy,
  buildResponseHeadersPolicyConfig,
  hasResponseHeadersPolicy,
  renderedHeaders
} from "./cloudfront-response-headers.mjs"

const POLICY_NAME = "thejudge-security-headers"
const POLICY_ID = "POLICY123"

/** The shape `aws cloudfront get-distribution-config` returns for a
 *  fully-attached custom-domain distribution (DEC-084) before this slice. */
function freshConfig() {
  return {
    ETag: "E1",
    DistributionConfig: {
      Comment: "thejudge-web",
      Aliases: { Quantity: 2, Items: ["mtgjudge.gg", "www.mtgjudge.gg"] },
      ViewerCertificate: {
        ACMCertificateArn: "arn:aws:acm:us-east-1:123456789012:certificate/abc",
        SSLSupportMethod: "sni-only",
        MinimumProtocolVersion: "TLSv1.2_2021",
        Certificate: "arn:aws:acm:us-east-1:123456789012:certificate/abc",
        CertificateSource: "acm"
      },
      DefaultCacheBehavior: {
        TargetOriginId: "origin",
        Compress: true,
        FunctionAssociations: {
          Quantity: 1,
          Items: [{ FunctionARN: "arn:redirect", EventType: "viewer-request" }]
        }
      },
      CustomErrorResponses: {
        Quantity: 2,
        Items: [
          { ErrorCode: 403, ResponsePagePath: "/index.html", ResponseCode: "200", ErrorCachingMinTTL: 0 },
          { ErrorCode: 404, ResponsePagePath: "/index.html", ResponseCode: "200", ErrorCachingMinTTL: 0 }
        ]
      },
      Origins: { Quantity: 1, Items: [{ Id: "origin" }] }
    }
  }
}

function attachedPolicyOutput(overrides = {}) {
  return {
    ETag: "PE1",
    ResponseHeadersPolicy: {
      Id: POLICY_ID,
      ResponseHeadersPolicyConfig: buildResponseHeadersPolicyConfig(POLICY_NAME),
      ...overrides
    }
  }
}

test("buildResponseHeadersPolicyConfig produces the five header values verbatim, with no Content-Security-Policy key anywhere", () => {
  const config = buildResponseHeadersPolicyConfig(POLICY_NAME)

  assert.deepEqual(renderedHeaders(config), SECURITY_HEADERS)
  assert.equal(config.SecurityHeadersConfig.ContentSecurityPolicy, undefined)
  assert.equal("content-security-policy" in renderedHeaders(config), false)
  assert.doesNotMatch(JSON.stringify(config), /ContentSecurityPolicy/)
})

test("the permissions-policy grant keeps camera=(self), not a blanket camera=()", () => {
  const config = buildResponseHeadersPolicyConfig(POLICY_NAME)
  const headers = renderedHeaders(config)

  assert.equal(headers["permissions-policy"], "camera=(self), microphone=(), geolocation=()")
  assert.notEqual(headers["permissions-policy"], "camera=()")
})

test("SECURITY_HEADERS carries exactly the five expected keys, verbatim", () => {
  assert.deepEqual(SECURITY_HEADERS, {
    "strict-transport-security": "max-age=31536000; includeSubDomains",
    "x-content-type-options": "nosniff",
    "x-frame-options": "SAMEORIGIN",
    "referrer-policy": "strict-origin-when-cross-origin",
    "permissions-policy": "camera=(self), microphone=(), geolocation=()"
  })
  assert.equal("content-security-policy" in SECURITY_HEADERS, false)
})

test("hasResponseHeadersPolicy is false when no policy is attached", () => {
  assert.equal(hasResponseHeadersPolicy(freshConfig(), null), false)
})

test("hasResponseHeadersPolicy is true when the distribution references a policy carrying the exact header set", () => {
  const distributionConfig = freshConfig()
  distributionConfig.DistributionConfig.DefaultCacheBehavior.ResponseHeadersPolicyId = POLICY_ID

  assert.equal(hasResponseHeadersPolicy(distributionConfig, attachedPolicyOutput()), true)
})

test("hasResponseHeadersPolicy is false when the referenced policy id does not match the fetched policy", () => {
  const distributionConfig = freshConfig()
  distributionConfig.DistributionConfig.DefaultCacheBehavior.ResponseHeadersPolicyId = "SOME-OTHER-ID"

  assert.equal(hasResponseHeadersPolicy(distributionConfig, attachedPolicyOutput()), false)
})

test("hasResponseHeadersPolicy is false when the attached policy carries a different header set", () => {
  const distributionConfig = freshConfig()
  distributionConfig.DistributionConfig.DefaultCacheBehavior.ResponseHeadersPolicyId = POLICY_ID

  const differentConfig = buildResponseHeadersPolicyConfig(POLICY_NAME)
  differentConfig.SecurityHeadersConfig.FrameOptions.FrameOption = "DENY"

  assert.equal(
    hasResponseHeadersPolicy(distributionConfig, attachedPolicyOutput({ ResponseHeadersPolicyConfig: differentConfig })),
    false
  )
})

test("hasResponseHeadersPolicy is false when the attached policy has grown a Content-Security-Policy", () => {
  const distributionConfig = freshConfig()
  distributionConfig.DistributionConfig.DefaultCacheBehavior.ResponseHeadersPolicyId = POLICY_ID

  const withCsp = buildResponseHeadersPolicyConfig(POLICY_NAME)
  withCsp.SecurityHeadersConfig.ContentSecurityPolicy = {
    Override: true,
    ContentSecurityPolicy: "default-src 'self'"
  }

  assert.equal(
    hasResponseHeadersPolicy(distributionConfig, attachedPolicyOutput({ ResponseHeadersPolicyConfig: withCsp })),
    false
  )
})

test("attachResponseHeadersPolicy changes only DefaultCacheBehavior.ResponseHeadersPolicyId, leaving Aliases, ViewerCertificate, FunctionAssociations and CustomErrorResponses byte-identical", () => {
  const input = freshConfig()
  const result = attachResponseHeadersPolicy(input, POLICY_ID)

  assert.equal(result.DefaultCacheBehavior.ResponseHeadersPolicyId, POLICY_ID)
  assert.deepEqual(result.Aliases, input.DistributionConfig.Aliases)
  assert.deepEqual(result.ViewerCertificate, input.DistributionConfig.ViewerCertificate)
  assert.deepEqual(result.DefaultCacheBehavior.FunctionAssociations, input.DistributionConfig.DefaultCacheBehavior.FunctionAssociations)
  assert.deepEqual(result.CustomErrorResponses, input.DistributionConfig.CustomErrorResponses)
  assert.equal(result.DefaultCacheBehavior.Compress, true)
  assert.equal(result.Comment, "thejudge-web")
})

test("attachResponseHeadersPolicy does not mutate its input", () => {
  const input = freshConfig()
  const snapshot = JSON.stringify(input)
  attachResponseHeadersPolicy(input, POLICY_ID)
  assert.equal(JSON.stringify(input), snapshot)
})

test("attachResponseHeadersPolicy throws when DefaultCacheBehavior is missing", () => {
  assert.throws(() => attachResponseHeadersPolicy({ DistributionConfig: {} }, POLICY_ID), /DefaultCacheBehavior/)
})
