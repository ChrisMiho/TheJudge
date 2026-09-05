/**
 * Attach a custom domain to a CloudFront distribution config (DEC-084).
 *
 * `scripts/aws-bootstrap.sh` fetches the live config with
 * `aws cloudfront get-distribution-config`, hands the JSON here, and sends the
 * result back with `update-distribution --if-match <ETag>`. The transform is a
 * pure function so it can be unit-tested without AWS; the shell script owns
 * every AWS call and the file I/O around it.
 *
 * Three pieces change and nothing else:
 * - `Aliases` gains every name CloudFront should answer for (the apex and its
 *   `www.` twin),
 * - `ViewerCertificate` switches from the default `*.cloudfront.net`
 *   certificate to the ACM certificate covering those names, SNI-only with the
 *   TLS 1.2 (2021) policy — the current CloudFront recommendation, and
 * - the default cache behavior gets a viewer-request CloudFront Function that
 *   answers any host other than the apex (`www.`, the raw CloudFront hostname)
 *   with a permanent redirect to the apex. The backend allows exactly one
 *   browser origin, so exactly one name may run the app; the others send
 *   players across.
 *
 * Usage from the shell:
 *   node scripts/lib/cloudfront-custom-domain.mjs function-code <apex-domain>
 *     prints the CloudFront Function source (cloudfront-js-2.0) for that apex
 *   node scripts/lib/cloudfront-custom-domain.mjs check  <config.json> <cert-arn> <function-arn> <domain>...
 *     exits 0 when those aliases, that certificate and that function are already attached, 1 otherwise
 *   node scripts/lib/cloudfront-custom-domain.mjs attach <config.json> <cert-arn> <function-arn> <domain>...
 *     prints the updated DistributionConfig (the body `update-distribution` wants)
 */

import fs from "node:fs"
import { pathToFileURL } from "node:url"

/** The only event a redirect can be decided on: before CloudFront touches the cache. */
export const REDIRECT_EVENT_TYPE = "viewer-request"

/**
 * Source of the CloudFront Function that redirects every host except the apex
 * to `https://<apex><path><query>`. Written for the cloudfront-js-2.0 runtime,
 * which is why it stays in `var`s and plain loops.
 *
 * @param {string} apexDomain
 * @returns {string}
 */
export function redirectFunctionCode(apexDomain) {
  return `function handler(event) {
  var request = event.request;
  var host = request.headers.host && request.headers.host.value;
  if (host === ${JSON.stringify(apexDomain)}) {
    return request;
  }
  var query = "";
  var params = request.querystring || {};
  var keys = Object.keys(params);
  for (var i = 0; i < keys.length; i++) {
    var entry = params[keys[i]];
    var values = entry.multiValue
      ? entry.multiValue.map(function (item) { return item.value; })
      : [entry.value];
    for (var j = 0; j < values.length; j++) {
      query += (query ? "&" : "?") + encodeURIComponent(keys[i]) + "=" + encodeURIComponent(values[j]);
    }
  }
  return {
    statusCode: 301,
    statusDescription: "Moved Permanently",
    headers: {
      location: { value: ${JSON.stringify(`https://${apexDomain}`)} + request.uri + query }
    }
  };
}
`
}

/**
 * @typedef {object} CustomDomain
 * @property {string[]} domains        every alias, apex first
 * @property {string} certificateArn   ACM certificate (us-east-1) covering all of them
 * @property {string} redirectFunctionArn published CloudFront Function from `redirectFunctionCode`
 */

/**
 * @param {{ DistributionConfig: object }} getDistributionConfigOutput
 * @param {CustomDomain} customDomain
 * @returns {object} a new DistributionConfig body
 */
export function attachCustomDomain(getDistributionConfigOutput, customDomain) {
  const { domains, certificateArn, redirectFunctionArn } = customDomain
  const config = structuredClone(getDistributionConfigOutput.DistributionConfig)

  config.Aliases = { Quantity: domains.length, Items: [...domains] }
  config.ViewerCertificate = {
    ACMCertificateArn: certificateArn,
    SSLSupportMethod: "sni-only",
    MinimumProtocolVersion: "TLSv1.2_2021",
    Certificate: certificateArn,
    CertificateSource: "acm"
  }

  const behavior = config.DefaultCacheBehavior
  if (!behavior) {
    throw new Error("DistributionConfig.DefaultCacheBehavior is missing; is this a get-distribution-config output?")
  }
  const otherAssociations = (behavior.FunctionAssociations?.Items ?? []).filter(
    (association) => association.EventType !== REDIRECT_EVENT_TYPE
  )
  const associations = [
    ...otherAssociations,
    { FunctionARN: redirectFunctionArn, EventType: REDIRECT_EVENT_TYPE }
  ]
  behavior.FunctionAssociations = { Quantity: associations.length, Items: associations }

  return config
}

/**
 * @param {{ DistributionConfig: object }} getDistributionConfigOutput
 * @param {CustomDomain} customDomain
 * @returns {boolean} true when `attachCustomDomain` would change nothing that matters
 */
export function hasCustomDomain(getDistributionConfigOutput, customDomain) {
  const { domains, certificateArn, redirectFunctionArn } = customDomain
  const config = getDistributionConfigOutput.DistributionConfig

  const aliases = config.Aliases?.Items ?? []
  const sameAliases = aliases.length === domains.length && domains.every((domain) => aliases.includes(domain))
  const sameCertificate = config.ViewerCertificate?.ACMCertificateArn === certificateArn
  const associations = config.DefaultCacheBehavior?.FunctionAssociations?.Items ?? []
  const sameRedirect = associations.some(
    (association) =>
      association.EventType === REDIRECT_EVENT_TYPE && association.FunctionARN === redirectFunctionArn
  )

  return sameAliases && sameCertificate && sameRedirect
}

const USAGE =
  "usage: cloudfront-custom-domain.mjs function-code <apex-domain>\n" +
  "       cloudfront-custom-domain.mjs <check|attach> <get-distribution-config.json> <certificate-arn> <function-arn> <domain>...\n"

function main(argv) {
  const [command, ...rest] = argv

  if (command === "function-code") {
    const [apexDomain] = rest
    if (!apexDomain) {
      process.stderr.write(USAGE)
      return 2
    }
    process.stdout.write(redirectFunctionCode(apexDomain))
    return 0
  }

  const [configPath, certificateArn, redirectFunctionArn, ...domains] = rest
  if (
    !["check", "attach"].includes(command) ||
    !configPath ||
    !certificateArn ||
    !redirectFunctionArn ||
    domains.length === 0
  ) {
    process.stderr.write(USAGE)
    return 2
  }

  const output = JSON.parse(fs.readFileSync(configPath, "utf8"))
  const customDomain = { domains, certificateArn, redirectFunctionArn }
  if (command === "check") {
    return hasCustomDomain(output, customDomain) ? 0 : 1
  }
  process.stdout.write(`${JSON.stringify(attachCustomDomain(output, customDomain), null, 2)}\n`)
  return 0
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = main(process.argv.slice(2))
}
