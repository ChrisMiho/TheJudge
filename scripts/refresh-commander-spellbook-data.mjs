import fs from "node:fs"
import path from "node:path"
import { pathToFileURL } from "node:url"

const rawInputDir = path.resolve("apps/backend/data/commander-spellbook")
const stagingDir = `${rawInputDir}.tmp`

export const VARIANTS_ENDPOINT = "https://backend.commanderspellbook.com/variants/"
export const SCRYFALL_REQUEST_DELAY_MS = 100
export const CONFIRM_FLAG = "--confirm-live-calls"

/**
 * REQ-093 gates every Commander Spellbook / Scryfall retrieval on explicit human
 * approval, so this script is never wired into `data:build` and refuses to make a
 * single request without the confirmation flag.
 */
export function parseRefreshArgs(argv) {
  return { confirmed: argv.includes(CONFIRM_FLAG) }
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

async function fetchJson(url) {
  const response = await fetch(url, createRequestOptions())
  if (!response.ok) {
    throw new Error(`Request failed for ${url}: ${response.status} ${response.statusText}`)
  }
  return response.json()
}

/** Walk DRF's `next` cursor until the feed is exhausted, writing one file per page. */
async function downloadVariantPages(targetDir) {
  ensureDirectory(targetDir)
  let url = VARIANTS_ENDPOINT
  let pageNumber = 0
  let variantCount = 0

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
    if (url) await delay(SCRYFALL_REQUEST_DELAY_MS)
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
    `Re-run with ${CONFIRM_FLAG} to perform the live retrieval (REQ-093 human-approved network access).`
  ].join("\n")
}

async function main() {
  const { confirmed } = parseRefreshArgs(process.argv.slice(2))

  if (!confirmed) {
    console.log(describePlan())
    return
  }

  // Stage the whole refresh, then swap. A failed or partial run leaves the previous
  // raw inputs — and therefore the committed artifacts — untouched.
  fs.rmSync(stagingDir, { recursive: true, force: true })
  ensureDirectory(stagingDir)

  const variantsDir = path.join(stagingDir, "variants")
  const { pageCount, variantCount } = await downloadVariantPages(variantsDir)

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
    fs.rmSync(stagingDir, { recursive: true, force: true })
    console.error(error.message)
    process.exitCode = 1
  })
}
