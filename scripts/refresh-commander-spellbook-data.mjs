import fs from "node:fs"
import path from "node:path"
import { pathToFileURL } from "node:url"

const rawInputDir = path.resolve("apps/backend/data/commander-spellbook")
const stagingDir = `${rawInputDir}.tmp`

export const VARIANTS_ENDPOINT = "https://backend.commanderspellbook.com/variants/"
export const SCRYFALL_REQUEST_DELAY_MS = 100
/**
 * The Commander Spellbook variants feed sits behind an AWS ELB that throttles a
 * sustained 10 req/s walk with a bodiless 429 and no `Retry-After`, so its cursor
 * gets a slower pace than Scryfall's documented allowance.
 */
export const VARIANTS_REQUEST_DELAY_MS = 250
export const MAX_FETCH_ATTEMPTS = 6
export const RETRY_BASE_DELAY_MS = 1000
export const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504])
export const CONFIRM_FLAG = "--confirm-live-calls"
export const RESUME_FLAG = "--resume"

/**
 * REQ-093 gates every Commander Spellbook / Scryfall retrieval on explicit human
 * approval, so this script is never wired into `data:build` and refuses to make a
 * single request without the confirmation flag.
 */
export function parseRefreshArgs(argv) {
  return { confirmed: argv.includes(CONFIRM_FLAG), resume: argv.includes(RESUME_FLAG) }
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

function pageFileName(pageNumber) {
  return `page-${String(pageNumber).padStart(4, "0")}.json`
}

/**
 * Retry throttled and transient upstream failures instead of discarding a run that
 * is otherwise minutes from finishing. Non-retryable statuses (a 404, a 400) still
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

function fetchJson(url) {
  return fetchJsonWithRetry(url, {
    onRetry: ({ status, attempt, waitMs }) =>
      console.warn(`HTTP ${status}; retry ${attempt}/${MAX_FETCH_ATTEMPTS - 1} in ${waitMs} ms.`)
  })
}

/**
 * Rebuild the cursor from pages already on disk so a throttled run resumes instead
 * of replaying thousands of requests into the same rate limit. The last file is the
 * only one that can be torn by an interrupted write, so a parse failure there drops
 * that page and resumes from its predecessor rather than failing the resume.
 */
export function resumeStateFromStagedPages(pageFiles, readPage) {
  // Accumulates the last consumable page's cursor, so a torn final page falls back
  // to its predecessor rather than discarding every page already downloaded.
  const state = { pageCount: 0, variantCount: 0, nextUrl: VARIANTS_ENDPOINT, complete: false }

  for (let index = 0; index < pageFiles.length; index += 1) {
    const isLast = index === pageFiles.length - 1

    let page
    try {
      page = readPage(pageFiles[index])
    } catch (error) {
      if (isLast) break
      throw new Error(`Staged variants page ${pageFiles[index]} is unreadable: ${error.message}`, { cause: error })
    }

    if (!Array.isArray(page?.results)) {
      if (isLast) break
      throw new Error(`Staged variants page ${pageFiles[index]} has an unexpected shape.`)
    }

    state.pageCount = index + 1
    state.variantCount += page.results.length
    state.nextUrl = typeof page.next === "string" && page.next.length > 0 ? page.next : null

    if (!state.nextUrl) {
      state.complete = true
      return state
    }
  }

  return state
}

function stagedPageFiles(targetDir) {
  if (!fs.existsSync(targetDir)) return []
  return fs
    .readdirSync(targetDir)
    .filter((entry) => /^page-\d+\.json$/.test(entry))
    .sort((a, b) => a.localeCompare(b))
}

/** Walk DRF's `next` cursor until the feed is exhausted, writing one file per page. */
async function downloadVariantPages(targetDir, { resume = false } = {}) {
  ensureDirectory(targetDir)

  let url = VARIANTS_ENDPOINT
  let pageNumber = 0
  let variantCount = 0

  if (resume) {
    const staged = stagedPageFiles(targetDir)
    if (staged.length > 0) {
      const state = resumeStateFromStagedPages(staged, (name) =>
        JSON.parse(fs.readFileSync(path.join(targetDir, name), "utf8"))
      )
      pageNumber = state.pageCount
      variantCount = state.variantCount
      url = state.nextUrl

      // Drop anything after the resume point, including a torn final page.
      for (const name of staged.slice(state.pageCount)) fs.rmSync(path.join(targetDir, name), { force: true })

      console.log(`Resuming after ${pageNumber} staged pages (${variantCount} variants).`)
      if (state.complete) return { pageCount: pageNumber, variantCount }
    }
  }

  while (url) {
    pageNumber += 1
    const page = await fetchJson(url)
    if (!Array.isArray(page?.results)) {
      throw new Error(`Unexpected Commander Spellbook variants response shape at ${url}.`)
    }

    fs.writeFileSync(path.join(targetDir, pageFileName(pageNumber)), `${JSON.stringify(page, null, 2)}\n`)
    variantCount += page.results.length
    console.log(`Fetched variants page ${pageNumber} (${page.results.length} variants, ${variantCount} total).`)

    url = typeof page.next === "string" && page.next.length > 0 ? page.next : null
    if (url) await delay(VARIANTS_REQUEST_DELAY_MS)
  }

  return { pageCount: pageNumber, variantCount }
}

/**
 * Collect every distinct template referenced by the downloaded variants.
 * `scryfall_api` is the only authoritative expansion upstream publishes — no
 * public serializer exposes `Template.replacements` — so a template without it
 * is left unresolved rather than hand-mapped.
 */
export function collectTemplates(variantPages) {
  const templates = new Map()
  for (const page of variantPages) {
    for (const variant of page?.results ?? []) {
      for (const requirement of variant?.requires ?? []) {
        const template = requirement?.template
        if (!Number.isInteger(template?.id) || templates.has(template.id)) continue
        templates.set(template.id, {
          templateId: template.id,
          name: typeof template.name === "string" ? template.name : "",
          scryfallApi: typeof template.scryfall_api === "string" ? template.scryfall_api : null
        })
      }
    }
  }
  return [...templates.values()].sort((a, b) => a.templateId - b.templateId)
}

/** Follow Scryfall's `next_page` links, deduplicating oracle ids across all pages. */
async function expandTemplate(template) {
  const oracleIds = new Set()
  let url = template.scryfallApi

  while (url) {
    const page = await fetchJson(url)
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

async function downloadTemplateExpansions(templates, targetDir) {
  ensureDirectory(targetDir)
  let resolved = 0
  let unresolved = 0

  for (const template of templates) {
    if (!template.scryfallApi) {
      unresolved += 1
      console.warn(`Template ${template.templateId} (${template.name}) has no scryfall_api; left unresolved.`)
      continue
    }

    const oracleIds = await expandTemplate(template)
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

function readStagedVariantPages(targetDir) {
  return fs
    .readdirSync(targetDir)
    .filter((entry) => entry.endsWith(".json"))
    .sort((a, b) => a.localeCompare(b))
    .map((entry) => JSON.parse(fs.readFileSync(path.join(targetDir, entry), "utf8")))
}

export function describePlan() {
  return [
    "Commander Spellbook refresh plan (no request has been made):",
    `  1. Page through ${VARIANTS_ENDPOINT} into ${rawInputDir}/variants/`,
    `  2. Expand every referenced template through its upstream scryfall_api into ${rawInputDir}/template-expansions/`,
    `  3. Write ${rawInputDir}/refresh-manifest.json`,
    "",
    `Re-run with ${CONFIRM_FLAG} to perform the live retrieval (REQ-093 human-approved network access).`,
    `Add ${RESUME_FLAG} to continue a throttled run from its staged pages instead of restarting.`
  ].join("\n")
}

async function main() {
  const { confirmed, resume } = parseRefreshArgs(process.argv.slice(2))

  if (!confirmed) {
    console.log(describePlan())
    return
  }

  // Stage the whole refresh, then swap. A failed or partial run leaves the previous
  // raw inputs — and therefore the committed artifacts — untouched.
  if (!resume) fs.rmSync(stagingDir, { recursive: true, force: true })
  ensureDirectory(stagingDir)

  const variantsDir = path.join(stagingDir, "variants")
  const { pageCount, variantCount } = await downloadVariantPages(variantsDir, { resume })

  const templates = collectTemplates(readStagedVariantPages(variantsDir))
  const { resolved, unresolved } = await downloadTemplateExpansions(templates, path.join(stagingDir, "template-expansions"))

  const manifest = {
    snapshotAt: new Date().toISOString(),
    source: "Commander Spellbook",
    sourceUrl: VARIANTS_ENDPOINT,
    license: "Commander Spellbook community data, retrieved from the public API; see https://commanderspellbook.com/",
    variantPageCount: pageCount,
    rawVariantCount: variantCount,
    templateCount: templates.length,
    resolvedTemplateCount: resolved,
    unresolvedTemplateCount: unresolved
  }
  fs.writeFileSync(path.join(stagingDir, "refresh-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`)

  fs.rmSync(rawInputDir, { recursive: true, force: true })
  fs.renameSync(stagingDir, rawInputDir)

  console.log(`Refresh complete: ${variantCount} raw variants across ${pageCount} pages into ${rawInputDir}.`)
  console.log(`Templates: ${resolved} resolved, ${unresolved} unresolved.`)
  console.log("Next: node scripts/build-commander-spellbook-combos.mjs")
}

const invokedPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : ""
if (import.meta.url === invokedPath) {
  main().catch((error) => {
    // Keep the staging directory. The swap never happened, so the committed
    // artifacts are still untouched, and the partial download is what makes
    // `--resume` cheaper than replaying the whole feed into the same throttle.
    console.error(error.message)
    if (fs.existsSync(stagingDir)) {
      console.error(`Partial download kept at ${stagingDir}; re-run with ${CONFIRM_FLAG} ${RESUME_FLAG} to continue.`)
    }
    process.exitCode = 1
  })
}
