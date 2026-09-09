import fs from "node:fs"
import path from "node:path"
import zlib from "node:zlib"
import { pathToFileURL } from "node:url"

import { streamJsonArrayObjects } from "./lib/stream-json-array.mjs"

const defaultRawInputDir = path.resolve("apps/backend/data/commander-spellbook")
const defaultDetailPath = path.resolve("apps/backend/data/commanderSpellbookComboBlocks.br")
const defaultIndexPath = path.resolve("apps/backend/data/commanderSpellbookComboIndex.json.br")

/**
 * Variants below this deck count are left out of the committed artifacts.
 *
 * Upstream's `popularity` is the number of decks running the combo. At 0 it is
 * a combo the corpus knows about and nobody plays: on the 2026-08-22 snapshot
 * that was 44,810 of 106,182 variants — 42.2% of the corpus and 33.6MB of the
 * 76.9MB detail artifact.
 *
 * Set to 0: the full reviewed corpus is the standing state (REQ-093). This is
 * no longer a standing trim — the S3-staged Lambda deploy (REQ-165) raised
 * the real ceiling to Lambda's 250MB unzipped deployment-package quota, well
 * past the whole corpus's size. The constant stays a functioning **emergency
 * valve**: raise it only if `scripts/lambda-package-budget.test.mjs` — the
 * pre-merge guardrail that measures the real quota — ever fires again, then
 * re-run with `--trim-committed` (see `trimCommittedArtifacts` below) to
 * re-emit the committed artifacts at the raised floor without a live refresh.
 * Every step is priced in `PRD/instructions/receipts/`.
 */
export const MIN_VARIANT_POPULARITY = 0

export const SOURCE_NAME = "Commander Spellbook"
export const SOURCE_URL = "https://json.commanderspellbook.com/variants.json.gz"
export const COMBO_PERMALINK_PREFIX = "https://commanderspellbook.com/combo/"

/**
 * Detail records are grouped into fixed blocks of this many variants (in
 * `variantId` order) before brotli-compression, so the compressor sees the
 * text neighbouring combos share instead of starting cold on every record
 * (DEC-162's named fix for when per-variant gzip size became a problem — it
 * has). A variant's position in the sorted variant list determines its block
 * (`position >> 7`) and line within that block (`position & 127`) — valid
 * because 128 === 2**7.
 */
export const COMBO_BLOCK_SIZE = 128

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
 * Brotli-compress one buffer with the fixed, named parameters this package
 * uses everywhere: quality 11 (max) and a size hint set to the raw input
 * length, no `dictionary` option. Node 22 (CI) silently ignores a brotli
 * dictionary while Node 24 (Lambda) honours it, which would make CI and
 * Lambda disagree — so this build never sets one.
 */
export function brotliCompress(buffer) {
  return zlib.brotliCompressSync(buffer, {
    params: {
      [zlib.constants.BROTLI_PARAM_QUALITY]: 11,
      [zlib.constants.BROTLI_PARAM_SIZE_HINT]: buffer.length
    }
  })
}

/**
 * Group sorted variants (in `variantId` order) into fixed blocks of
 * `COMBO_BLOCK_SIZE`. Records inside a block are newline-delimited JSON, one
 * variant per line; each block is brotli-compressed as one member. Returns
 * the concatenated buffer of all block members, the block directory
 * (`[{ offset, length }]` byte ranges into that buffer, in block order), and
 * each variant's integer position — its index in the given (sorted) variant
 * list, from which block (`position >> 7`) and line (`position & 127`) are
 * always derivable, correct after any re-block.
 */
export function serializeVariantDetail(variants) {
  const positions = {}
  variants.forEach((variant, index) => {
    positions[variant.variantId] = index
  })

  const chunks = []
  const blockDirectory = []
  let cursor = 0
  for (let start = 0; start < variants.length; start += COMBO_BLOCK_SIZE) {
    const blockVariants = variants.slice(start, start + COMBO_BLOCK_SIZE)
    const ndjson = blockVariants.map((variant) => JSON.stringify(variant)).join("\n")
    const compressed = brotliCompress(Buffer.from(ndjson, "utf8"))
    blockDirectory.push({ offset: cursor, length: compressed.length })
    chunks.push(compressed)
    cursor += compressed.length
  }

  return { detailBuffer: Buffer.concat(chunks), blockDirectory, positions }
}

/**
 * Decompress one variant's record from a detail buffer, given the block
 * directory and the variant's integer position. Test and tooling use only:
 * the runtime loader does the equivalent read lazily from disk, one block at
 * a time, never from a buffer holding the whole corpus.
 */
export function readVariantAtPosition(detailBuffer, blockDirectory, position) {
  const blockIndex = position >> 7
  const lineIndex = position & 127
  const block = blockDirectory[blockIndex]
  if (!block) {
    throw new Error(`No block at index ${blockIndex} for position ${position}.`)
  }
  const member = detailBuffer.subarray(block.offset, block.offset + block.length)
  const lines = zlib.brotliDecompressSync(member).toString("utf8").split("\n")
  const line = lines[lineIndex]
  if (line === undefined) {
    throw new Error(`No line ${lineIndex} in block ${blockIndex} for position ${position}.`)
  }
  return JSON.parse(line)
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
 * the block/position directories — is computed from `variants` alone, which is
 * what makes filtering that one list (and re-blocking through this same path) a
 * complete edit rather than a partial one.
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

  // Every committed variant id is listed exactly once, in variantId order
  // (`variantIds` below); a variant's integer position in that array is what
  // every other membership structure in this index carries instead of the id
  // string itself — the positional-int compaction that drops cold-start
  // parsing of the index from ~47 MB to ~12 MB. `variants` is already sorted
  // by variantId (the caller's contract), so a variant's array index here is
  // exactly the position `serializeVariantDetail` derives block/line from.
  const positionByVariantId = new Map(variants.map((variant, index) => [variant.variantId, index]))
  const toPosition = (variantId) => positionByVariantId.get(variantId)

  const toSortedPositionMembership = (membership) => {
    const result = {}
    for (const oracleId of [...membership.keys()].sort((a, b) => a.localeCompare(b))) {
      result[oracleId] = [...membership.get(oracleId)].map(toPosition).sort((a, b) => a - b)
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
      variantIds: [...template.variantIds].map(toPosition).sort((a, b) => a - b)
    }
  }

  const { detailBuffer, blockDirectory } = serializeVariantDetail(variants)

  return {
    detailBuffer,
    index: {
      manifest,
      byOracleId: toSortedPositionMembership(byOracleId),
      byTemplateOracleId: toSortedPositionMembership(byTemplateOracleId),
      templates: serializedTemplates,
      unresolvedTemplateIds: Object.values(serializedTemplates)
        .filter((template) => template.unresolved)
        .map((template) => template.templateId),
      blocks: blockDirectory,
      variantIds: variants.map((variant) => variant.variantId)
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

/** The index is a single minified, brotli-compressed JSON document — it is read whole, every time. */
function writeIndexArtifact(filePath, value) {
  ensureParentDirectory(filePath)
  const compressed = brotliCompress(Buffer.from(JSON.stringify(value), "utf8"))
  fs.writeFileSync(filePath, compressed)
  return compressed.length
}

/** The detail artifact is already compressed bytes (concatenated brotli block members); write it verbatim. */
function writeDetailArtifact(filePath, detailBuffer) {
  ensureParentDirectory(filePath)
  fs.writeFileSync(filePath, detailBuffer)
  return detailBuffer.length
}

/**
 * Read and structurally validate an already-committed index artifact, for the
 * "preserve what's there" path when no raw refresh has run. Returns `null`
 * (after logging) when the file is absent; throws when present but malformed,
 * which the caller treats as "cannot preserve, must bootstrap".
 */
function readExistingIndexArtifact(filePath) {
  if (!fs.existsSync(filePath)) {
    console.warn(`No existing combo index artifact found to preserve: ${filePath}`)
    return null
  }
  const artifact = JSON.parse(zlib.brotliDecompressSync(fs.readFileSync(filePath)).toString("utf8"))
  if (typeof artifact !== "object" || artifact === null || Array.isArray(artifact)) {
    throw new Error(`Unexpected combo index artifact shape in ${filePath}; expected a JSON object.`)
  }
  console.log(`Preserved existing combo index artifact: ${filePath} (${formatBytes(fs.statSync(filePath).size)}).`)
  return artifact
}

/**
 * Structurally validate an already-committed detail artifact against a known
 * block directory: every block must brotli-decode on its own. Concatenated
 * brotli members (unlike gzip) cannot be decoded as one stream, so validation
 * always goes block-by-block against the paired index's directory.
 */
function validateExistingDetailArtifact(filePath, blockDirectory) {
  if (!fs.existsSync(filePath)) {
    console.warn(`No existing combo detail artifact found to preserve: ${filePath}`)
    return false
  }
  const bytes = fs.readFileSync(filePath)
  for (const { offset, length } of blockDirectory ?? []) {
    zlib.brotliDecompressSync(bytes.subarray(offset, offset + length))
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
 * that floor would have produced. Blocks are fixed groups of 128 in `variantId`
 * order, so a trim cannot splice a block in place — it filters the survivors,
 * re-serializes the sorted list, and rewrites through the same
 * `assembleComboArtifacts` code path a fresh build uses.
 *
 * @param {{ detailPath?: string, indexPath?: string, minPopularity?: number }} [options]
 */
export async function trimCommittedArtifacts(options = {}) {
  const detailPath = options.detailPath ?? defaultDetailPath
  const indexPath = options.indexPath ?? defaultIndexPath
  const minPopularity = options.minPopularity ?? MIN_VARIANT_POPULARITY

  const index = JSON.parse(zlib.brotliDecompressSync(fs.readFileSync(indexPath)).toString("utf8"))
  const detailBuffer = fs.readFileSync(detailPath)
  const variantIds = Array.isArray(index?.variantIds) ? index.variantIds : []
  const blockDirectory = index?.blocks ?? []

  const kept = []
  let dropped = 0
  variantIds.forEach((variantId, position) => {
    const variant = readVariantAtPosition(detailBuffer, blockDirectory, position)
    if (meetsPopularityFloor(variant, minPopularity)) kept.push(variant)
    else dropped += 1
  })
  kept.sort((a, b) => a.variantId.localeCompare(b.variantId))

  const rebuilt = assembleComboArtifacts({
    variants: kept,
    rejected: Number.isInteger(index?.manifest?.rejectedVariantCount) ? index.manifest.rejectedVariantCount : 0,
    snapshot: { snapshotAt: index?.manifest?.snapshotAt ?? null, license: index?.manifest?.license ?? null },
    minPopularity: Number.isInteger(minPopularity) && minPopularity > 0 ? minPopularity : 0,
    belowPopularityFloor: (Number.isInteger(index?.manifest?.belowPopularityFloorCount) ? index.manifest.belowPopularityFloorCount : 0) + dropped
  })

  const detailBytes = writeDetailArtifact(detailPath, rebuilt.detailBuffer)
  const indexBytes = writeIndexArtifact(indexPath, rebuilt.index)

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

    let indexArtifact = null
    try {
      indexArtifact = readExistingIndexArtifact(indexPath)
    } catch (error) {
      console.warn(`Existing combo index artifact failed validation: ${indexPath}: ${error.message}`)
    }

    let detailPresent = false
    if (indexArtifact) {
      try {
        detailPresent = validateExistingDetailArtifact(detailPath, indexArtifact.blocks)
      } catch (error) {
        console.warn(`Existing combo detail artifact failed validation: ${detailPath}: ${error.message}`)
      }
    }

    if (detailPresent && indexArtifact) {
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
    writeIndexArtifact(indexPath, index)
    console.log(`Wrote empty Commander Spellbook corpus placeholder: ${detailPath}, ${indexPath}`)
    return { preserved: false, variantCount: 0 }
  }

  const { detailBuffer, index } = buildComboArtifacts(rawInputs)

  const detailBytes = writeDetailArtifact(detailPath, detailBuffer)
  const indexBytes = writeIndexArtifact(indexPath, index)

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
