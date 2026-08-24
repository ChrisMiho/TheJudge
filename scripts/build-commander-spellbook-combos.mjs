import fs from "node:fs"
import path from "node:path"
import zlib from "node:zlib"
import { pathToFileURL } from "node:url"
import { format as prettierFormat } from "prettier"

import { streamJsonArrayObjects } from "./lib/stream-json-array.mjs"

const defaultRawInputDir = path.resolve("apps/backend/data/commander-spellbook")
const defaultDetailPath = path.resolve("apps/backend/data/commanderSpellbookCombos.json.gz")
const defaultIndexPath = path.resolve("apps/backend/data/commanderSpellbookComboIndex.json.gz")

/**
 * Variants below this deck count are left out of the committed artifacts.
 *
 * Upstream's `popularity` is the number of decks running the combo. At 0 it is
 * a combo the corpus knows about and nobody plays: on the 2026-08-22 snapshot
 * that was 44,810 of 106,182 variants — 42.2% of the corpus and 33.6MB of the
 * 76.9MB detail artifact.
 *
 * The cut exists because the whole corpus no longer fits in a Lambda deployment
 * package: `UpdateFunctionCode` caps a direct upload at 70,167,211 bytes and the
 * detail artifact alone compresses to 73.1MB. A threshold of 1 is the smallest
 * cut that clears it, and it drops only combos no deck runs.
 *
 * Raise it to shrink the artifact further; every step is priced in
 * `PRD/instructions/receipts/`. Set it to 0 to keep everything, which currently
 * does not deploy.
 */
export const MIN_VARIANT_POPULARITY = 1

export const SOURCE_NAME = "Commander Spellbook"
export const SOURCE_URL = "https://json.commanderspellbook.com/variants.json.gz"
export const COMBO_PERMALINK_PREFIX = "https://commanderspellbook.com/combo/"

/**
 * Upstream starting-zone vocabulary, verbatim from `ZoneLocation` in
 * `spellbook/models/ingredient.py`. Canonical order for every serialized array.
 */
export const ZONE_IDS = Object.freeze(["H", "B", "C", "E", "G", "L"])

/**
 * Only these four zones carry card state upstream (`Ingredient.CARD_STATE_FIELDS`).
 * Hand and command deliberately have no state field, so an ingredient limited to
 * them carries no state key at all rather than an empty string.
 */
export const CARD_STATE_ZONE_KEYS = Object.freeze({
  B: "battlefield",
  E: "exile",
  G: "graveyard",
  L: "library"
})

/**
 * `Variant.Status` values are short codes, not the enum member names:
 * NEW='N', DRAFT='D', NEEDS_REVIEW='NR', OK='OK', EXAMPLE='E', RESTORE='R',
 * NOT_WORKING='NW'. The public API only ever serves 'OK' and 'E'.
 */
export const KNOWN_VARIANT_STATUSES = Object.freeze(["N", "D", "NR", "OK", "E", "R", "NW"])
export const ACCEPTED_VARIANT_STATUS = "OK"
export const EXAMPLE_VARIANT_STATUS = "E"

/**
 * Editorial fields upstream nulls for EXAMPLE variants; OK variants must carry
 * strings. Upstream renders these **camelCase** on the wire — DRF's
 * `CamelCaseJSONRenderer` renames every serializer field above the model — so
 * the upstream key here must never regress to the snake_case name its Python
 * serializer declares (DEC-162).
 */
const REQUIRED_TEXT_FIELDS = Object.freeze([
  ["description", "steps"],
  ["manaNeeded", "manaNeeded"],
  ["easyPrerequisites", "easyPrerequisites"],
  ["notablePrerequisites", "notablePrerequisites"],
  ["notes", "notes"]
])

function sortedObject(entries) {
  const result = {}
  for (const key of Object.keys(entries).sort((a, b) => a.localeCompare(b))) {
    result[key] = entries[key]
  }
  return result
}

function sortZones(zones) {
  const permitted = new Set(zones)
  return ZONE_IDS.filter((zone) => permitted.has(zone))
}

function ensureParentDirectory(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function readJsonFile(filePath) {
  let contents
  try {
    contents = fs.readFileSync(filePath, "utf8")
  } catch (error) {
    throw new Error(`Unable to read Commander Spellbook raw input ${filePath}: ${error.message}`, { cause: error })
  }
  try {
    return JSON.parse(contents)
  } catch (error) {
    throw new Error(`Malformed Commander Spellbook raw input ${filePath}: ${error.message}`, { cause: error })
  }
}

/** Read only the first `maxBytes` of a file — never the whole thing, which may be too large to hold as one JS string. */
function readFilePrefix(filePath, maxBytes) {
  const fd = fs.openSync(filePath, "r")
  try {
    const size = Math.min(maxBytes, fs.fstatSync(fd).size)
    const buffer = Buffer.alloc(size)
    fs.readSync(fd, buffer, 0, size, 0)
    return buffer.toString("utf8")
  } finally {
    fs.closeSync(fd)
  }
}

function listJsonFiles(directory) {
  if (!fs.existsSync(directory)) return []
  return fs
    .readdirSync(directory)
    .filter((entry) => entry.endsWith(".json"))
    .sort((a, b) => a.localeCompare(b))
    .map((entry) => path.join(directory, entry))
}

/**
 * Project one upstream ingredient (card or template) onto TheJudge's camelCase
 * shape. Zone-scoped card state is never collapsed: an ingredient permitting
 * several zones keeps each zone's state under its own key.
 */
export function projectIngredientState(rawIngredient, zones) {
  const cardState = {}
  for (const zone of zones) {
    const stateKey = CARD_STATE_ZONE_KEYS[zone]
    if (!stateKey) continue
    const rawState = rawIngredient[`${stateKey}CardState`]
    if (typeof rawState === "string" && rawState.trim().length > 0) {
      cardState[stateKey] = rawState
    }
  }
  return sortedObject(cardState)
}

function readIngredientZones(rawIngredient, context) {
  const rawZones = rawIngredient?.zoneLocations
  if (!Array.isArray(rawZones) || rawZones.length === 0) {
    throw new Error(`${context}: zoneLocations must be a non-empty array.`)
  }
  for (const zone of rawZones) {
    if (!ZONE_IDS.includes(zone)) {
      throw new Error(`${context}: unrecognized zone location "${zone}".`)
    }
  }
  return sortZones(rawZones)
}

function readIngredientQuantity(rawIngredient, context) {
  const quantity = rawIngredient?.quantity
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new Error(`${context}: quantity must be a positive integer.`)
  }
  return quantity
}

function projectCardIngredient(rawIngredient, variantId) {
  const context = `Commander Spellbook variant ${variantId} card ingredient`
  const cardId = rawIngredient?.card?.oracleId
  if (typeof cardId !== "string" || cardId.length === 0) {
    throw new Error(`${context}: card.oracleId is required.`)
  }
  const cardName = rawIngredient?.card?.name
  if (typeof cardName !== "string" || cardName.length === 0) {
    throw new Error(`${context} ${cardId}: card.name is required.`)
  }
  const zones = readIngredientZones(rawIngredient, `${context} ${cardId}`)

  return {
    cardId,
    cardName,
    quantity: readIngredientQuantity(rawIngredient, `${context} ${cardId}`),
    zones,
    cardState: projectIngredientState(rawIngredient, zones),
    mustBeCommander: rawIngredient?.mustBeCommander === true
  }
}

function projectTemplateIngredient(rawIngredient, variantId, templateExpansions) {
  const context = `Commander Spellbook variant ${variantId} template ingredient`
  const templateId = rawIngredient?.template?.id
  if (!Number.isInteger(templateId)) {
    throw new Error(`${context}: template.id is required.`)
  }
  const templateName = rawIngredient?.template?.name
  if (typeof templateName !== "string" || templateName.length === 0) {
    throw new Error(`${context} ${templateId}: template.name is required.`)
  }
  const zones = readIngredientZones(rawIngredient, `${context} ${templateId}`)

  // `scryfallApi` is the only authoritative expansion upstream exposes; no public
  // serializer surfaces Template.replacements, so a template without it stays
  // unresolved rather than being hand-mapped.
  const scryfallApi = typeof rawIngredient.template.scryfallApi === "string" ? rawIngredient.template.scryfallApi : null
  const expansion = templateExpansions.get(templateId)
  const oracleIds = expansion ? [...expansion].sort((a, b) => a.localeCompare(b)) : []
  const unresolved = oracleIds.length === 0

  return {
    templateId,
    templateName,
    quantity: readIngredientQuantity(rawIngredient, `${context} ${templateId}`),
    zones,
    cardState: projectIngredientState(rawIngredient, zones),
    mustBeCommander: rawIngredient?.mustBeCommander === true,
    scryfallApi,
    unresolved,
    oracleIds
  }
}

function projectProducedEffects(rawVariant) {
  const produces = Array.isArray(rawVariant?.produces) ? rawVariant.produces : []
  const names = produces
    .map((entry) => entry?.feature?.name)
    .filter((name) => typeof name === "string" && name.length > 0)
  return [...new Set(names)].sort((a, b) => a.localeCompare(b))
}

/**
 * Project one reviewed (`OK`) upstream variant. Callers filter by status first;
 * this throws when an accepted variant is missing the editorial fields that only
 * EXAMPLE variants are allowed to null.
 */
export function projectVariant(rawVariant, templateExpansions) {
  const variantId = typeof rawVariant?.id === "string" ? rawVariant.id : String(rawVariant?.id ?? "")
  if (variantId.length === 0) {
    throw new Error("Commander Spellbook variant is missing its id.")
  }

  const projected = {
    variantId,
    sourceUrl: `${COMBO_PERMALINK_PREFIX}${variantId}/`,
    popularity: Number.isInteger(rawVariant?.popularity) ? rawVariant.popularity : 0
  }

  for (const [upstreamKey, projectedKey] of REQUIRED_TEXT_FIELDS) {
    const value = rawVariant?.[upstreamKey]
    if (typeof value !== "string") {
      throw new Error(
        `Commander Spellbook variant ${variantId} has status ${ACCEPTED_VARIANT_STATUS} but ${upstreamKey} is not a string; ` +
          "reviewed variants must carry every editorial field."
      )
    }
    projected[projectedKey] = value
  }

  const cardIngredients = (Array.isArray(rawVariant?.uses) ? rawVariant.uses : [])
    .map((ingredient) => projectCardIngredient(ingredient, variantId))
    .sort((a, b) => a.cardId.localeCompare(b.cardId))

  if (cardIngredients.length === 0) {
    throw new Error(`Commander Spellbook variant ${variantId} lists no card ingredients.`)
  }

  const templateIngredients = (Array.isArray(rawVariant?.requires) ? rawVariant.requires : [])
    .map((ingredient) => projectTemplateIngredient(ingredient, variantId, templateExpansions))
    .sort((a, b) => a.templateId - b.templateId)

  projected.producedEffects = projectProducedEffects(rawVariant)
  projected.cardIngredients = cardIngredients
  projected.templateIngredients = templateIngredients

  return projected
}

/**
 * Partition raw variants by upstream status. `OK` is accepted, `E` (EXAMPLE) is
 * rejected as expected data, and anything outside the upstream vocabulary fails
 * the build loudly rather than silently thinning the corpus.
 */
export function partitionVariantsByStatus(rawVariants) {
  const accepted = []
  let rejected = 0

  for (const rawVariant of rawVariants) {
    const status = rawVariant?.status
    const variantId = rawVariant?.id ?? "<missing id>"
    if (typeof status !== "string" || !KNOWN_VARIANT_STATUSES.includes(status)) {
      throw new Error(
        `Commander Spellbook variant ${variantId} has unrecognized status ${JSON.stringify(status)}; ` +
          `expected one of ${KNOWN_VARIANT_STATUSES.join(", ")}.`
      )
    }
    if (status === ACCEPTED_VARIANT_STATUS) {
      accepted.push(rawVariant)
    } else {
      rejected += 1
    }
  }

  return { accepted, rejected }
}

/**
 * Gzip-compress each variant's JSON **individually** and concatenate the
 * compressed members into one buffer, rather than gzipping one JSON array as
 * a single stream. Gzip members are self-contained: decompressing a byte
 * slice that holds exactly one member never touches any other member's
 * bytes. That is what lets the runtime loader (slice H) fetch one variant's
 * detail via a positional file read plus a single `gunzipSync`, without ever
 * holding the other ~105k variants' bytes resident — the full detail catalog
 * measured ~868MB RSS in the DEC-162 amendment, against ~95MB RSS for the
 * index alone, and at most five variants ever enter a prompt.
 *
 * The returned `detailOffsets` (`variantId -> [offset, length]`) is what the
 * index artifact carries so the loader never has to scan the detail file to
 * find a variant.
 */
export function serializeVariantDetail(variants) {
  const chunks = []
  const detailOffsets = {}
  let cursor = 0
  for (const variant of variants) {
    const compressed = zlib.gzipSync(Buffer.from(JSON.stringify(variant), "utf8"))
    detailOffsets[variant.variantId] = [cursor, compressed.length]
    chunks.push(compressed)
    cursor += compressed.length
  }
  return { detailBuffer: Buffer.concat(chunks), detailOffsets }
}

/**
 * Decompress one variant's record from a detail buffer at its recorded
 * offset/length. Test and tooling use only: the runtime loader does the
 * equivalent read lazily from disk, one variant at a time, never from a
 * buffer holding the whole corpus.
 */
export function readVariantDetail(detailBuffer, offset, length) {
  const member = detailBuffer.subarray(offset, offset + length)
  return JSON.parse(zlib.gunzipSync(member).toString("utf8"))
}

/** @param {{ rawVariants: unknown[], templateExpansions: Map<number, string[]>, snapshot: object, minPopularity?: number }} options */
export function buildComboArtifacts({ rawVariants, templateExpansions, snapshot, minPopularity = MIN_VARIANT_POPULARITY }) {
  const { accepted, rejected } = partitionVariantsByStatus(rawVariants)

  const projected = accepted
    .map((rawVariant) => projectVariant(rawVariant, templateExpansions))
    .sort((a, b) => a.variantId.localeCompare(b.variantId))

  const seenVariantIds = new Set()
  for (const variant of projected) {
    if (seenVariantIds.has(variant.variantId)) {
      throw new Error(`Commander Spellbook variant ${variant.variantId} appears more than once in the raw input.`)
    }
    seenVariantIds.add(variant.variantId)
  }

  // Duplicate detection runs over the whole accepted set, before the floor: a
  // corpus that repeats a variant is malformed whether or not anyone plays it.
  const variants = projected.filter((variant) => meetsPopularityFloor(variant, minPopularity))

  return assembleComboArtifacts({
    variants,
    rejected,
    snapshot,
    minPopularity: Number.isInteger(minPopularity) && minPopularity > 0 ? minPopularity : 0,
    belowPopularityFloor: projected.length - variants.length
  })
}

/**
 * Whether a projected variant is popular enough to commit.
 *
 * A missing or non-integer `popularity` reads as 0 — the same value
 * `projectVariant` already substitutes — so an upstream field that goes absent
 * drops the variant rather than silently keeping the whole corpus.
 */
export function meetsPopularityFloor(variant, minPopularity) {
  if (!Number.isInteger(minPopularity) || minPopularity <= 0) return true
  const popularity = Number.isInteger(variant?.popularity) ? variant.popularity : 0
  return popularity >= minPopularity
}

/**
 * Build the index and detail artifacts from variants that are already projected.
 *
 * Split out of `buildComboArtifacts` so the same assembly serves both a fresh
 * refresh and a re-emit that trims already-committed artifacts. Every derived
 * structure below — oracle and template membership, the template directory, and
 * the byte-offset directory — is computed from `variants` alone, which is what
 * makes filtering that one list a complete edit rather than a partial one.
 *
 * @param {{ variants: object[], rejected: number, snapshot: object }} options
 */
export function assembleComboArtifacts({ variants, rejected, snapshot, minPopularity = 0, belowPopularityFloor = 0 }) {
  const manifest = sortedObject({
    belowPopularityFloorCount: belowPopularityFloor,
    generatedBy: "scripts/build-commander-spellbook-combos.mjs",
    license: typeof snapshot?.license === "string" ? snapshot.license : null,
    minPopularity,
    rejectedVariantCount: rejected,
    snapshotAt: typeof snapshot?.snapshotAt === "string" ? snapshot.snapshotAt : null,
    source: SOURCE_NAME,
    sourceUrl: SOURCE_URL,
    variantCount: variants.length
  })

  const byOracleId = new Map()
  const byTemplateOracleId = new Map()
  const templates = new Map()

  for (const variant of variants) {
    for (const ingredient of variant.cardIngredients) {
      if (!byOracleId.has(ingredient.cardId)) byOracleId.set(ingredient.cardId, new Set())
      byOracleId.get(ingredient.cardId).add(variant.variantId)
    }

    for (const ingredient of variant.templateIngredients) {
      if (!templates.has(ingredient.templateId)) {
        templates.set(ingredient.templateId, {
          templateId: ingredient.templateId,
          templateName: ingredient.templateName,
          scryfallApi: ingredient.scryfallApi,
          unresolved: ingredient.unresolved,
          oracleIds: ingredient.oracleIds,
          variantIds: new Set()
        })
      }
      templates.get(ingredient.templateId).variantIds.add(variant.variantId)

      for (const oracleId of ingredient.oracleIds) {
        if (!byTemplateOracleId.has(oracleId)) byTemplateOracleId.set(oracleId, new Set())
        byTemplateOracleId.get(oracleId).add(variant.variantId)
      }
    }
  }

  const toSortedMembership = (membership) => {
    const result = {}
    for (const oracleId of [...membership.keys()].sort((a, b) => a.localeCompare(b))) {
      result[oracleId] = [...membership.get(oracleId)].sort((a, b) => a.localeCompare(b))
    }
    return result
  }

  const serializedTemplates = {}
  for (const templateId of [...templates.keys()].sort((a, b) => a - b)) {
    const template = templates.get(templateId)
    serializedTemplates[String(templateId)] = {
      templateId: template.templateId,
      templateName: template.templateName,
      scryfallApi: template.scryfallApi,
      unresolved: template.unresolved,
      oracleIds: template.oracleIds,
      variantIds: [...template.variantIds].sort((a, b) => a.localeCompare(b))
    }
  }

  const { detailBuffer, detailOffsets } = serializeVariantDetail(variants)

  return {
    detailBuffer,
    index: {
      manifest,
      byOracleId: toSortedMembership(byOracleId),
      byTemplateOracleId: toSortedMembership(byTemplateOracleId),
      templates: serializedTemplates,
      unresolvedTemplateIds: Object.values(serializedTemplates)
        .filter((template) => template.unresolved)
        .map((template) => template.templateId),
      detailOffsets: sortedObject(detailOffsets)
    }
  }
}

/**
 * Read the gitignored raw refresh output. Returns `null` when no refresh has run,
 * which the caller treats as "preserve whatever is already committed". The bulk
 * export is one file, not a paginated cursor walk (DEC-162): `variants.json`
 * carries the whole `{ timestamp, version, variants: [...] }` envelope.
 */
export async function readRawInputs(rawInputDir) {
  const manifestPath = path.join(rawInputDir, "refresh-manifest.json")
  const variantsPath = path.join(rawInputDir, "variants.json")

  if (!fs.existsSync(manifestPath) || !fs.existsSync(variantsPath)) {
    return null
  }

  const snapshot = readJsonFile(manifestPath)

  // Streamed, never `readFileSync(..., "utf8")` + `JSON.parse`: the real bulk
  // export measures ~634MB decompressed (2026-08-22), past V8's ~536MB max
  // string length, so a full-file parse throws before it ever gets to the
  // "variants" array. `streamJsonArrayObjects` yields one variant at a time
  // regardless of file size.
  const rawVariants = []
  try {
    const stream = fs.createReadStream(variantsPath, { encoding: "utf8", highWaterMark: 1024 * 1024 })
    for await (const variant of streamJsonArrayObjects(stream)) rawVariants.push(variant)
  } catch (error) {
    throw new Error(`Malformed Commander Spellbook raw input ${variantsPath}: ${error.message}`, { cause: error })
  }
  if (rawVariants.length === 0 && fs.statSync(variantsPath).size > 0) {
    // An empty result from a non-empty file means no "variants" array was
    // ever found — `streamJsonArrayObjects` only detects that by scanning for
    // `[`, so a missing/renamed key looks identical to a genuinely empty one.
    // Read only a small prefix, never the whole file — it may be far too
    // large to hold as one JS string at all.
    if (!/"variants"\s*:\s*\[/.test(readFilePrefix(variantsPath, 4096))) {
      throw new Error(`Malformed Commander Spellbook raw input ${variantsPath}: expected a "variants" array.`)
    }
  }

  const templateExpansions = new Map()
  for (const expansionPath of listJsonFiles(path.join(rawInputDir, "template-expansions"))) {
    const expansion = readJsonFile(expansionPath)
    if (!Number.isInteger(expansion?.templateId)) {
      throw new Error(`Malformed Commander Spellbook raw input ${expansionPath}: templateId must be an integer.`)
    }
    const oracleIds = Array.isArray(expansion?.oracleIds)
      ? expansion.oracleIds.filter((oracleId) => typeof oracleId === "string" && oracleId.length > 0)
      : []
    if (oracleIds.length > 0) {
      templateExpansions.set(expansion.templateId, [...new Set(oracleIds)])
    }
  }

  return { snapshot, rawVariants, templateExpansions }
}

/** The index stays a single gzip-compressed JSON document — it is read whole, every time. */
async function writeIndexArtifact(filePath, value) {
  ensureParentDirectory(filePath)
  const formatted = await prettierFormat(JSON.stringify(value), { parser: "json", printWidth: 120 })
  const compressed = zlib.gzipSync(Buffer.from(formatted, "utf8"))
  fs.writeFileSync(filePath, compressed)
  return compressed.length
}

/** The detail artifact is already compressed bytes (concatenated gzip members); write it verbatim. */
function writeDetailArtifact(filePath, detailBuffer) {
  ensureParentDirectory(filePath)
  fs.writeFileSync(filePath, detailBuffer)
  return detailBuffer.length
}

function validateExistingIndexArtifact(filePath) {
  if (!fs.existsSync(filePath)) {
    console.warn(`No existing combo index artifact found to preserve: ${filePath}`)
    return false
  }
  const artifact = JSON.parse(zlib.gunzipSync(fs.readFileSync(filePath)).toString("utf8"))
  if (typeof artifact !== "object" || artifact === null || Array.isArray(artifact)) {
    throw new Error(`Unexpected combo index artifact shape in ${filePath}; expected a JSON object.`)
  }
  console.log(`Preserved existing combo index artifact: ${filePath} (${formatBytes(fs.statSync(filePath).size)}).`)
  return true
}

function validateExistingDetailArtifact(filePath) {
  if (!fs.existsSync(filePath)) {
    console.warn(`No existing combo detail artifact found to preserve: ${filePath}`)
    return false
  }
  const bytes = fs.readFileSync(filePath)
  if (bytes.length > 0) {
    // Decompresses every concatenated gzip member and throws on corruption.
    // The decompressed bytes are not one JSON document — each member is its
    // own record — so this validates well-formedness, not shape.
    zlib.gunzipSync(bytes)
  }
  console.log(`Preserved existing combo detail artifact: ${filePath} (${formatBytes(bytes.length)}).`)
  return true
}

/**
 * Re-emit already-committed artifacts at a popularity floor, without a refresh.
 *
 * A full rebuild needs the ~634MB raw bulk export, which is gitignored and only
 * present just after `data:refresh-combos`. Applying a floor to what is already
 * committed does not: every detail record is a projected variant, so reading
 * them back and re-running the same assembly produces exactly what a refresh at
 * that floor would have produced.
 *
 * @param {{ detailPath?: string, indexPath?: string, minPopularity?: number }} [options]
 */
export async function trimCommittedArtifacts(options = {}) {
  const detailPath = options.detailPath ?? defaultDetailPath
  const indexPath = options.indexPath ?? defaultIndexPath
  const minPopularity = options.minPopularity ?? MIN_VARIANT_POPULARITY

  const index = JSON.parse(zlib.gunzipSync(fs.readFileSync(indexPath)).toString("utf8"))
  const detailBuffer = fs.readFileSync(detailPath)
  const offsets = index?.detailOffsets ?? {}

  const kept = []
  let dropped = 0
  for (const variantId of Object.keys(offsets)) {
    const [offset, length] = offsets[variantId]
    const variant = readVariantDetail(detailBuffer, offset, length)
    if (meetsPopularityFloor(variant, minPopularity)) kept.push(variant)
    else dropped += 1
  }
  kept.sort((a, b) => a.variantId.localeCompare(b.variantId))

  const rebuilt = assembleComboArtifacts({
    variants: kept,
    rejected: Number.isInteger(index?.manifest?.rejectedVariantCount) ? index.manifest.rejectedVariantCount : 0,
    snapshot: { snapshotAt: index?.manifest?.snapshotAt ?? null, license: index?.manifest?.license ?? null },
    minPopularity: Number.isInteger(minPopularity) && minPopularity > 0 ? minPopularity : 0,
    belowPopularityFloor: (Number.isInteger(index?.manifest?.belowPopularityFloorCount) ? index.manifest.belowPopularityFloorCount : 0) + dropped
  })

  const detailBytes = writeDetailArtifact(detailPath, rebuilt.detailBuffer)
  const indexBytes = await writeIndexArtifact(indexPath, rebuilt.index)

  console.log(`Popularity floor: ${minPopularity} deck(s)`)
  console.log(`Kept ${kept.length} variants; left out ${dropped}`)
  console.log(`Detail bytes: ${detailBytes} (${formatBytes(detailBytes)}); wrote ${detailPath}`)
  console.log(`Index bytes: ${indexBytes} (${formatBytes(indexBytes)}); wrote ${indexPath}`)

  return { kept: kept.length, dropped, detailBytes, indexBytes }
}

/** @param {{ rawInputDir?: string, detailPath?: string, indexPath?: string }} [options] */
export async function runBuild(options = {}) {
  const rawInputDir = options.rawInputDir ?? defaultRawInputDir
  const detailPath = options.detailPath ?? defaultDetailPath
  const indexPath = options.indexPath ?? defaultIndexPath

  const rawInputs = await readRawInputs(rawInputDir)

  if (!rawInputs) {
    console.warn(`Commander Spellbook raw inputs not found: ${rawInputDir}`)
    const detailPresent = validateExistingDetailArtifact(detailPath)
    const indexPresent = validateExistingIndexArtifact(indexPath)

    if (detailPresent && indexPresent) {
      return { preserved: true, variantCount: null }
    }

    // Bootstrap: emit a valid empty corpus so the runtime loader and `data:build`
    // have a well-formed artifact before the owner-approved production refresh.
    const { detailBuffer, index } = buildComboArtifacts({
      rawVariants: [],
      templateExpansions: new Map(),
      snapshot: { snapshotAt: null, license: null }
    })
    writeDetailArtifact(detailPath, detailBuffer)
    await writeIndexArtifact(indexPath, index)
    console.log(`Wrote empty Commander Spellbook corpus placeholder: ${detailPath}, ${indexPath}`)
    return { preserved: false, variantCount: 0 }
  }

  const { detailBuffer, index } = buildComboArtifacts(rawInputs)

  const detailBytes = writeDetailArtifact(detailPath, detailBuffer)
  const indexBytes = await writeIndexArtifact(indexPath, index)

  console.log(`Commander Spellbook variants: ${index.manifest.variantCount}`)
  console.log(`Rejected non-OK variants: ${index.manifest.rejectedVariantCount}`)
  if (index.manifest.minPopularity > 0) {
    console.log(
      `Below popularity floor (<${index.manifest.minPopularity} decks), left out: ${index.manifest.belowPopularityFloorCount}`
    )
  }
  console.log(`Unresolved templates: ${index.unresolvedTemplateIds.length}`)
  console.log(`Detail bytes: ${detailBytes} (${formatBytes(detailBytes)}); wrote ${detailPath}`)
  console.log(`Index bytes: ${indexBytes} (${formatBytes(indexBytes)}); wrote ${indexPath}`)

  return { preserved: false, variantCount: index.manifest.variantCount }
}

const invokedPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : ""
if (import.meta.url === invokedPath) {
  const entry = process.argv.includes("--trim-committed") ? trimCommittedArtifacts : runBuild
  entry().catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
}
