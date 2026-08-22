import fs from "node:fs"
import path from "node:path"
import { pathToFileURL } from "node:url"

import { streamJsonArrayObjects } from "./lib/stream-json-array.mjs"

const rawInputDir = path.resolve("apps/backend/data/commander-spellbook")
const stagingDir = `${rawInputDir}.tmp`

/**
 * DEC-162: the bulk export replaces the paginated REST walk entirely, not just
 * as a fallback. The paginated feed sat behind an AWS ELB that throttled a
 * sustained cursor walk with a bodiless 429 and no `Retry-After` after ~13,600
 * variants; the bulk export supplies the full reviewed corpus (105k+ variants)
 * in one unthrottled, sub-second request, regenerated daily.
 */
export const BULK_EXPORT_URL = "https://json.commanderspellbook.com/variants.json.gz"
export const SCRYFALL_REQUEST_DELAY_MS = 100
export const MAX_FETCH_ATTEMPTS = 6
export const RETRY_BASE_DELAY_MS = 1000
export const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504])
export const CONFIRM_FLAG = "--confirm-live-calls"

/**
 * REQ-093 gates every Commander Spellbook / Scryfall retrieval on explicit human
 * approval, so this script is never wired into `data:build` and refuses to make a
 * single request without the confirmation flag.
 */
export function parseRefreshArgs(argv) {
  return { confirmed: argv.includes(CONFIRM_FLAG) }
}

/**
 * `Retry-After` is either delay-seconds or an HTTP date. The upstream ELB sends
 * neither, so this returns null far more often than not and the caller falls back
 * to blind exponential backoff.
 */
export function parseRetryAfterMs(headerValue, now = Date.now()) {
  if (typeof headerValue !== "string" || headerValue.trim() === "") return null

  const seconds = Number(headerValue.trim())
  if (Number.isFinite(seconds)) return seconds >= 0 ? Math.round(seconds * 1000) : null

  const timestamp = Date.parse(headerValue)
  if (Number.isNaN(timestamp)) return null
  return Math.max(0, timestamp - now)
}

/** Exponential backoff with full jitter, so parallel retries do not resynchronize. */
export function backoffDelayMs(attempt, baseDelayMs = RETRY_BASE_DELAY_MS, random = Math.random) {
  const ceiling = baseDelayMs * 2 ** (attempt - 1)
  return Math.round(ceiling * (0.5 + random() * 0.5))
}

export function createRequestOptions() {
  return {
    headers: {
      Accept: "application/json",
      "User-Agent": "TheJudge/0.0.1 (https://github.com/local/thejudge)"
    }
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function ensureDirectory(directory) {
  fs.mkdirSync(directory, { recursive: true })
}

/**
 * Retry throttled and transient upstream failures instead of discarding a run that
 * is otherwise seconds from finishing. Non-retryable statuses (a 404, a 400) still
 * throw on the first response — retrying those would only be slower, not luckier.
 */
export async function fetchJsonWithRetry(url, options = {}) {
  const {
    fetchImpl = fetch,
    sleepImpl = delay,
    maxAttempts = MAX_FETCH_ATTEMPTS,
    baseDelayMs = RETRY_BASE_DELAY_MS,
    random = Math.random,
    onRetry = () => {}
  } = options

  for (let attempt = 1; ; attempt += 1) {
    const response = await fetchImpl(url, createRequestOptions())
    if (response.ok) return response.json()

    const failure = `Request failed for ${url}: ${response.status} ${response.statusText}`
    if (!RETRYABLE_STATUSES.has(response.status) || attempt >= maxAttempts) {
      throw new Error(failure)
    }

    const retryAfterMs = parseRetryAfterMs(response.headers?.get?.("retry-after"))
    const waitMs = retryAfterMs ?? backoffDelayMs(attempt, baseDelayMs, random)
    onRetry({ url, status: response.status, attempt, waitMs })
    await sleepImpl(waitMs)
  }
}

/**
 * Same retry/backoff behavior as `fetchJsonWithRetry`, but returns the raw
 * response bytes rather than calling `response.json()` — `parseBulkExportBytes`
 * decides how to interpret them.
 */
export async function fetchBufferWithRetry(url, options = {}) {
  const {
    fetchImpl = fetch,
    sleepImpl = delay,
    maxAttempts = MAX_FETCH_ATTEMPTS,
    baseDelayMs = RETRY_BASE_DELAY_MS,
    random = Math.random,
    onRetry = () => {}
  } = options

  for (let attempt = 1; ; attempt += 1) {
    const response = await fetchImpl(url, createRequestOptions())
    if (response.ok) return Buffer.from(await response.arrayBuffer())

    const failure = `Request failed for ${url}: ${response.status} ${response.statusText}`
    if (!RETRYABLE_STATUSES.has(response.status) || attempt >= maxAttempts) {
      throw new Error(failure)
    }

    const retryAfterMs = parseRetryAfterMs(response.headers?.get?.("retry-after"))
    const waitMs = retryAfterMs ?? backoffDelayMs(attempt, baseDelayMs, random)
    onRetry({ url, status: response.status, attempt, waitMs })
    await sleepImpl(waitMs)
  }
}

function fetchJson(url) {
  return fetchJsonWithRetry(url, {
    onRetry: ({ status, attempt, waitMs }) =>
      console.warn(`HTTP ${status}; retry ${attempt}/${MAX_FETCH_ATTEMPTS - 1} in ${waitMs} ms.`)
  })
}

/**
 * The bulk export URL ends in `.gz`, but upstream serves it with
 * `Content-Encoding: gzip` (confirmed against the real endpoint, 2026-08-22),
 * which Node's `fetch` decodes transparently before `arrayBuffer()` ever sees
 * compressed bytes — so the bytes `fetchBufferWithRetry` returns are already
 * plain JSON in practice, despite the `.gz` filename.
 *
 * The real document is far too large to parse as one JS string: measured
 * 2026-08-22 at ~634MB decompressed, past V8's ~536MB max string length, so
 * `bytes.toString("utf8")` on the whole buffer throws before `JSON.parse`
 * ever runs. Only a real live refresh exercises the actual size — the
 * DEC-162 amendment's own measurements were against a smaller sample.
 *
 * `timestamp`/`version` sit in the first few hundred bytes of the document,
 * well before the multi-hundred-MB `variants` array, so they are read from a
 * small prefix rather than requiring a full parse.
 */
export function extractEnvelopeMetadata(bytes) {
  const head = bytes.subarray(0, Math.min(bytes.length, 4096)).toString("utf8")
  const timestampMatch = head.match(/"timestamp"\s*:\s*"([^"]*)"/)
  const versionMatch = head.match(/"version"\s*:\s*"([^"]*)"/)
  return {
    timestamp: timestampMatch ? timestampMatch[1] : null,
    version: versionMatch ? versionMatch[1] : null
  }
}

/**
 * Collect every distinct template referenced by the downloaded variants.
 * `scryfallApi` is the only authoritative expansion upstream publishes — no
 * public serializer exposes `Template.replacements` — so a template without it
 * is left unresolved rather than hand-mapped. Upstream renders this camelCase
 * on the wire (DEC-162); `scryfall_api` is the Python serializer's name, never
 * the client-visible one.
 *
 * Accepts a plain array or an async iterable — `for await` works over both —
 * so the same function serves small hand-authored test fixtures and the real
 * streamed-from-disk variant sequence identically.
 */
export async function collectTemplates(variants) {
  const templates = new Map()
  for await (const variant of variants ?? []) {
    for (const requirement of variant?.requires ?? []) {
      const template = requirement?.template
      if (!Number.isInteger(template?.id) || templates.has(template.id)) continue
      templates.set(template.id, {
        templateId: template.id,
        name: typeof template.name === "string" ? template.name : "",
        scryfallApi: typeof template.scryfallApi === "string" ? template.scryfallApi : null
      })
    }
  }
  return [...templates.values()].sort((a, b) => a.templateId - b.templateId)
}

/** Follow Scryfall's `next_page` links, deduplicating oracle ids across all pages. */
export async function expandTemplate(template, fetchJsonImpl = fetchJson) {
  const oracleIds = new Set()
  let url = template.scryfallApi

  while (url) {
    const page = await fetchJsonImpl(url)
    for (const card of page?.data ?? []) {
      if (typeof card?.oracle_id === "string" && card.oracle_id.length > 0) {
        oracleIds.add(card.oracle_id)
      }
    }
    url = page?.has_more === true && typeof page?.next_page === "string" ? page.next_page : null
    if (url) await delay(SCRYFALL_REQUEST_DELAY_MS)
  }

  return [...oracleIds].sort((a, b) => a.localeCompare(b))
}

export async function downloadTemplateExpansions(templates, targetDir, { expandTemplateImpl = expandTemplate } = {}) {
  ensureDirectory(targetDir)
  let resolved = 0
  let unresolved = 0

  for (const template of templates) {
    if (!template.scryfallApi) {
      unresolved += 1
      console.warn(`Template ${template.templateId} (${template.name}) has no scryfall_api; left unresolved.`)
      continue
    }

    let oracleIds
    try {
      oracleIds = await expandTemplateImpl(template)
    } catch (error) {
      // A query Scryfall rejects outright (a 404, a syntax it no longer
      // accepts) is exactly as unresolvable as a template with no query at
      // all — REQ-093 already treats "no authoritative expansion" as a normal,
      // expected outcome, not a failure. Aborting the whole refresh over one
      // bad query would be worse than leaving that one template unresolved.
      unresolved += 1
      console.warn(`Template ${template.templateId} (${template.name}) failed to expand (${error.message}); left unresolved.`)
      continue
    }

    if (oracleIds.length === 0) {
      unresolved += 1
      console.warn(`Template ${template.templateId} (${template.name}) expanded to zero cards; left unresolved.`)
      continue
    }

    const payload = { templateId: template.templateId, name: template.name, scryfallApi: template.scryfallApi, oracleIds }
    fs.writeFileSync(
      path.join(targetDir, `${String(template.templateId).padStart(6, "0")}.json`),
      `${JSON.stringify(payload, null, 2)}\n`
    )
    resolved += 1
    console.log(`Expanded template ${template.templateId} (${template.name}) to ${oracleIds.length} oracle ids.`)
    await delay(SCRYFALL_REQUEST_DELAY_MS)
  }

  return { resolved, unresolved }
}

export function describePlan() {
  return [
    "Commander Spellbook refresh plan (no request has been made):",
    `  1. Download the bulk export from ${BULK_EXPORT_URL} into ${rawInputDir}/variants.json`,
    `  2. Expand every referenced template through its upstream scryfallApi into ${rawInputDir}/template-expansions/`,
    `  3. Write ${rawInputDir}/refresh-manifest.json`,
    "",
    `Re-run with ${CONFIRM_FLAG} to perform the live retrieval (REQ-093 human-approved network access).`
  ].join("\n")
}

/**
 * The refresh itself, callable both by this script's own gated `main()` and by
 * `refresh-scryfall-data.mjs`'s `data:refresh` chain — DEC-162 makes invoking
 * `data:refresh` REQ-093's approval, so the combo download runs inside that
 * chain ungated by a second confirmation flag, exactly like the Scryfall and
 * Comprehensive Rules downloads already do there.
 */
export async function performCommanderSpellbookRefresh() {
  // Stage the whole refresh, then swap. A failed or partial run leaves the previous
  // raw inputs — and therefore the committed artifacts — untouched.
  fs.rmSync(stagingDir, { recursive: true, force: true })
  ensureDirectory(stagingDir)

  const bytes = await fetchBufferWithRetry(BULK_EXPORT_URL, {
    onRetry: ({ status, attempt, waitMs }) =>
      console.warn(`HTTP ${status}; retry ${attempt}/${MAX_FETCH_ATTEMPTS - 1} in ${waitMs} ms.`)
  })

  // Written as raw bytes — never converted to a JS string — because the real
  // document (~634MB decompressed, measured 2026-08-22) exceeds V8's max
  // string length. Everything downstream reads it back by streaming.
  const variantsPath = path.join(stagingDir, "variants.json")
  fs.writeFileSync(variantsPath, bytes)
  const { timestamp, version } = extractEnvelopeMetadata(bytes)

  let variantCount = 0
  async function* countedVariants() {
    const stream = fs.createReadStream(variantsPath, { encoding: "utf8", highWaterMark: 1024 * 1024 })
    for await (const variant of streamJsonArrayObjects(stream)) {
      variantCount += 1
      yield variant
    }
  }
  const templates = await collectTemplates(countedVariants())

  if (variantCount === 0) {
    throw new Error(`Unexpected Commander Spellbook bulk export response shape at ${BULK_EXPORT_URL}: no variants found.`)
  }

  const { resolved, unresolved } = await downloadTemplateExpansions(templates, path.join(stagingDir, "template-expansions"))

  const manifest = {
    // The bulk document's own timestamp/version satisfy REQ-093's snapshot
    // provenance directly (DEC-162) — no synthetic "now" stands in for it.
    snapshotAt: timestamp ?? new Date().toISOString(),
    source: "Commander Spellbook",
    sourceUrl: BULK_EXPORT_URL,
    license: "Commander Spellbook community data, retrieved from the public bulk export; see https://commanderspellbook.com/",
    upstreamVersion: version,
    rawVariantCount: variantCount,
    templateCount: templates.length,
    resolvedTemplateCount: resolved,
    unresolvedTemplateCount: unresolved
  }
  fs.writeFileSync(path.join(stagingDir, "refresh-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`)

  fs.rmSync(rawInputDir, { recursive: true, force: true })
  fs.renameSync(stagingDir, rawInputDir)

  console.log(`Refresh complete: ${variantCount} raw variants from the bulk export into ${rawInputDir}.`)
  console.log(`Templates: ${resolved} resolved, ${unresolved} unresolved.`)
  console.log("Next: node scripts/build-commander-spellbook-combos.mjs")

  return { variantCount, resolvedTemplateCount: resolved, unresolvedTemplateCount: unresolved }
}

async function main() {
  const { confirmed } = parseRefreshArgs(process.argv.slice(2))

  if (!confirmed) {
    console.log(describePlan())
    return
  }

  await performCommanderSpellbookRefresh()
}

const invokedPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : ""
if (import.meta.url === invokedPath) {
  main().catch((error) => {
    // Keep the staging directory: the swap never happened, so the committed
    // artifacts are still untouched, and the partial state is there to inspect.
    console.error(error.message)
    if (fs.existsSync(stagingDir)) {
      console.error(`Partial download kept at ${stagingDir}; re-run with ${CONFIRM_FLAG} to retry.`)
    }
    process.exitCode = 1
  })
}
