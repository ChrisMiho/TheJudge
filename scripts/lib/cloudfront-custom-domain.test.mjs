import assert from "node:assert/strict"
import test from "node:test"

import {
  REDIRECT_EVENT_TYPE,
  attachCustomDomain,
  hasCustomDomain,
  redirectFunctionCode
} from "./cloudfront-custom-domain.mjs"

const APEX = "mtgjudge.gg"
const WWW = "www.mtgjudge.gg"
const CERT = "arn:aws:acm:us-east-1:123456789012:certificate/abc"
const FUNCTION = "arn:aws:cloudfront::123456789012:function/thejudge-redirect-to-apex"
const CUSTOM_DOMAIN = { domains: [APEX, WWW], certificateArn: CERT, redirectFunctionArn: FUNCTION }

/** The shape `aws cloudfront get-distribution-config` returns for a fresh
 *  bootstrap distribution: no aliases, default certificate, no functions. */
function freshConfig() {
  return {
    ETag: "E1",
    DistributionConfig: {
      Comment: "thejudge-web",
      Aliases: { Quantity: 0, Items: [] },
      ViewerCertificate: {
        CloudFrontDefaultCertificate: true,
        MinimumProtocolVersion: "TLSv1",
        CertificateSource: "cloudfront"
      },
      DefaultCacheBehavior: { TargetOriginId: "origin", Compress: true },
      Origins: { Quantity: 1, Items: [{ Id: "origin" }] }
    }
  }
}

test("attachCustomDomain adds both aliases, the ACM certificate and the redirect function, keeping everything else", () => {
  const input = freshConfig()
  const result = attachCustomDomain(input, CUSTOM_DOMAIN)

  assert.deepEqual(result.Aliases, { Quantity: 2, Items: [APEX, WWW] })
  assert.deepEqual(result.ViewerCertificate, {
    ACMCertificateArn: CERT,
    SSLSupportMethod: "sni-only",
    MinimumProtocolVersion: "TLSv1.2_2021",
    Certificate: CERT,
    CertificateSource: "acm"
  })
  assert.deepEqual(result.DefaultCacheBehavior.FunctionAssociations, {
    Quantity: 1,
    Items: [{ FunctionARN: FUNCTION, EventType: REDIRECT_EVENT_TYPE }]
  })
  assert.equal(result.DefaultCacheBehavior.Compress, true)
  assert.deepEqual(result.Origins, input.DistributionConfig.Origins)
  assert.equal(result.Comment, "thejudge-web")
  assert.equal("ETag" in result, false, "the ETag is a request header, not part of the config body")
})

test("attachCustomDomain replaces an older viewer-request function but keeps other associations", () => {
  const input = freshConfig()
  input.DistributionConfig.DefaultCacheBehavior.FunctionAssociations = {
    Quantity: 2,
    Items: [
      { FunctionARN: "arn:old-redirect", EventType: REDIRECT_EVENT_TYPE },
      { FunctionARN: "arn:headers", EventType: "viewer-response" }
    ]
  }
  const result = attachCustomDomain(input, CUSTOM_DOMAIN)
  assert.deepEqual(result.DefaultCacheBehavior.FunctionAssociations, {
    Quantity: 2,
    Items: [
      { FunctionARN: "arn:headers", EventType: "viewer-response" },
      { FunctionARN: FUNCTION, EventType: REDIRECT_EVENT_TYPE }
    ]
  })
})

test("attachCustomDomain does not mutate its input", () => {
  const input = freshConfig()
  const snapshot = JSON.stringify(input)
  attachCustomDomain(input, CUSTOM_DOMAIN)
  assert.equal(JSON.stringify(input), snapshot)
})

test("hasCustomDomain is true only when the aliases, the certificate and the redirect function all match", () => {
  const fresh = freshConfig()
  assert.equal(hasCustomDomain(fresh, CUSTOM_DOMAIN), false)

  const attached = { ETag: "E2", DistributionConfig: attachCustomDomain(fresh, CUSTOM_DOMAIN) }
  assert.equal(hasCustomDomain(attached, CUSTOM_DOMAIN), true)

  const rotatedCert = {
    ETag: "E3",
    DistributionConfig: attachCustomDomain(fresh, { ...CUSTOM_DOMAIN, certificateArn: `${CERT}-rotated` })
  }
  assert.equal(hasCustomDomain(rotatedCert, CUSTOM_DOMAIN), false, "a rotated certificate must be re-applied")

  const apexOnly = {
    ETag: "E4",
    DistributionConfig: attachCustomDomain(fresh, { ...CUSTOM_DOMAIN, domains: [APEX] })
  }
  assert.equal(hasCustomDomain(apexOnly, CUSTOM_DOMAIN), false, "a missing www alias must be re-applied")

  const republishedFunction = {
    ETag: "E5",
    DistributionConfig: attachCustomDomain(fresh, { ...CUSTOM_DOMAIN, redirectFunctionArn: "arn:other" })
  }
  assert.equal(hasCustomDomain(republishedFunction, CUSTOM_DOMAIN), false)
})

/** Load the generated CloudFront Function the way the runtime would: as a
 *  script defining a global `handler`. */
function loadHandler(apex) {
  return new Function(`${redirectFunctionCode(apex)}; return handler;`)()
}

function viewerRequest(host, uri = "/", querystring = {}) {
  return { request: { headers: { host: { value: host } }, uri, querystring } }
}

test("the redirect function passes apex requests through untouched", () => {
  const handler = loadHandler(APEX)
  const event = viewerRequest(APEX, "/trade", { q: { value: "1" } })
  assert.equal(handler(event), event.request)
})

test("the redirect function sends www and the raw CloudFront hostname to the apex with a 301, keeping path and query", () => {
  const handler = loadHandler(APEX)

  const www = handler(viewerRequest(WWW, "/quick", { card: { value: "Sol Ring" } }))
  assert.equal(www.statusCode, 301)
  assert.equal(www.headers.location.value, "https://mtgjudge.gg/quick?card=Sol%20Ring")

  const cloudfront = handler(viewerRequest("d36yuv4ycof5gd.cloudfront.net"))
  assert.equal(cloudfront.statusCode, 301)
  assert.equal(cloudfront.headers.location.value, "https://mtgjudge.gg/")

  const multi = handler(
    viewerRequest(WWW, "/", { tag: { value: "a", multiValue: [{ value: "a" }, { value: "b" }] } })
  )
  assert.equal(multi.headers.location.value, "https://mtgjudge.gg/?tag=a&tag=b")
})

test("the redirect function stays inside the cloudfront-js-2.0 dialect", () => {
  const code = redirectFunctionCode(APEX)
  assert.match(code, /^function handler\(event\)/)
  assert.doesNotMatch(code, /\b(const|let|=>|async|await|import|require)\b/, "ES5 constructs only")
})
