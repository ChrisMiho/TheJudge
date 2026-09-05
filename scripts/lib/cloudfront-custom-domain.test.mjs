import assert from "node:assert/strict"
import test from "node:test"

import { attachCustomDomain, hasCustomDomain } from "./cloudfront-custom-domain.mjs"

const DOMAIN = "mtgjude.gg"
const CERT = "arn:aws:acm:us-east-1:123456789012:certificate/abc"

/** The shape `aws cloudfront get-distribution-config` returns for a fresh
 *  bootstrap distribution: no aliases, default CloudFront certificate. */
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
      Origins: { Quantity: 1, Items: [{ Id: "origin" }] }
    }
  }
}

test("attachCustomDomain adds the alias and the ACM certificate, keeping everything else", () => {
  const input = freshConfig()
  const result = attachCustomDomain(input, DOMAIN, CERT)

  assert.deepEqual(result.Aliases, { Quantity: 1, Items: [DOMAIN] })
  assert.deepEqual(result.ViewerCertificate, {
    ACMCertificateArn: CERT,
    SSLSupportMethod: "sni-only",
    MinimumProtocolVersion: "TLSv1.2_2021",
    Certificate: CERT,
    CertificateSource: "acm"
  })
  assert.deepEqual(result.Origins, input.DistributionConfig.Origins)
  assert.equal(result.Comment, "thejudge-web")
  assert.equal("ETag" in result, false, "the ETag is a request header, not part of the config body")
})

test("attachCustomDomain does not mutate its input", () => {
  const input = freshConfig()
  const snapshot = JSON.stringify(input)
  attachCustomDomain(input, DOMAIN, CERT)
  assert.equal(JSON.stringify(input), snapshot)
})

test("hasCustomDomain is true only when the alias and the same certificate are already attached", () => {
  const fresh = freshConfig()
  assert.equal(hasCustomDomain(fresh, DOMAIN, CERT), false)

  const attached = { ETag: "E2", DistributionConfig: attachCustomDomain(fresh, DOMAIN, CERT) }
  assert.equal(hasCustomDomain(attached, DOMAIN, CERT), true)

  const otherCert = {
    ETag: "E3",
    DistributionConfig: attachCustomDomain(fresh, DOMAIN, `${CERT}-rotated`)
  }
  assert.equal(hasCustomDomain(otherCert, DOMAIN, CERT), false, "a rotated certificate must be re-applied")

  const otherDomain = { ETag: "E4", DistributionConfig: attachCustomDomain(fresh, "other.gg", CERT) }
  assert.equal(hasCustomDomain(otherDomain, DOMAIN, CERT), false)
})
