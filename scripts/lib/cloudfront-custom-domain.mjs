/**
 * Attach a custom domain to a CloudFront distribution config (DEC-084).
 *
 * `scripts/aws-bootstrap.sh` fetches the live config with
 * `aws cloudfront get-distribution-config`, hands the JSON here, and sends the
 * result back with `update-distribution --if-match <ETag>`. The transform is a
 * pure function so it can be unit-tested without AWS; the shell script owns
 * every AWS call and the file I/O around it.
 *
 * Two pieces change and nothing else:
 * - `Aliases` gains the domain (the CNAME CloudFront answers for), and
 * - `ViewerCertificate` switches from the default `*.cloudfront.net`
 *   certificate to the ACM certificate for that domain, SNI-only with the
 *   TLS 1.2 (2021) policy — the current CloudFront recommendation.
 *
 * Usage from the shell:
 *   node scripts/lib/cloudfront-custom-domain.mjs check  <config.json> <domain> <cert-arn>
 *     exits 0 when the domain and that certificate are already attached, 1 otherwise
 *   node scripts/lib/cloudfront-custom-domain.mjs attach <config.json> <domain> <cert-arn>
 *     prints the updated DistributionConfig (the body `update-distribution` wants)
 */

import fs from "node:fs"
import { pathToFileURL } from "node:url"

/**
 * @param {{ DistributionConfig: object }} getDistributionConfigOutput
 * @param {string} domain
 * @param {string} certificateArn
 * @returns {object} a new DistributionConfig body
 */
export function attachCustomDomain(getDistributionConfigOutput, domain, certificateArn) {
  const config = structuredClone(getDistributionConfigOutput.DistributionConfig)
  config.Aliases = { Quantity: 1, Items: [domain] }
  config.ViewerCertificate = {
    ACMCertificateArn: certificateArn,
    SSLSupportMethod: "sni-only",
    MinimumProtocolVersion: "TLSv1.2_2021",
    Certificate: certificateArn,
    CertificateSource: "acm"
  }
  return config
}

/**
 * @param {{ DistributionConfig: object }} getDistributionConfigOutput
 * @param {string} domain
 * @param {string} certificateArn
 * @returns {boolean} true when nothing would change
 */
export function hasCustomDomain(getDistributionConfigOutput, domain, certificateArn) {
  const config = getDistributionConfigOutput.DistributionConfig
  const aliases = config.Aliases?.Items ?? []
  return aliases.includes(domain) && config.ViewerCertificate?.ACMCertificateArn === certificateArn
}

function main(argv) {
  const [command, configPath, domain, certificateArn] = argv
  if (!["check", "attach"].includes(command) || !configPath || !domain || !certificateArn) {
    process.stderr.write(
      "usage: cloudfront-custom-domain.mjs <check|attach> <get-distribution-config.json> <domain> <certificate-arn>\n"
    )
    return 2
  }
  const output = JSON.parse(fs.readFileSync(configPath, "utf8"))
  if (command === "check") {
    return hasCustomDomain(output, domain, certificateArn) ? 0 : 1
  }
  process.stdout.write(`${JSON.stringify(attachCustomDomain(output, domain, certificateArn), null, 2)}\n`)
  return 0
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = main(process.argv.slice(2))
}
