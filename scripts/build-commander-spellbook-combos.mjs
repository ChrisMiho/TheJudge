import fs from "node:fs"
import path from "node:path"
import { pathToFileURL } from "node:url"
import { format as prettierFormat } from "prettier"

const defaultRawInputDir = path.resolve("apps/backend/data/commander-spellbook")
const defaultDetailPath = path.resolve("apps/backend/data/commanderSpellbookCombos.json")
const defaultIndexPath = path.resolve("apps/backend/data/commanderSpellbookComboIndex.json")

export const SOURCE_NAME = "Commander Spellbook"
export const SOURCE_URL = "https://backend.commanderspellbook.com/"
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

/** Editorial fields upstream nulls for EXAMPLE variants; OK variants must carry strings. */
const REQUIRED_TEXT_FIELDS = Object.freeze([
  ["description", "steps"],
  ["mana_needed", "manaNeeded"],
  ["easy_prerequisites", "easyPrerequisites"],
  ["notable_prerequisites", "notablePrerequisites"],
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
    const rawState = rawIngredient[`${stateKey}_card_state`]
    if (typeof rawState === "string" && rawState.trim().length > 0) {
      cardState[stateKey] = rawState
    }
  }
  return sortedObject(cardState)
}

function readIngredientZones(rawIngredient, context) {
  const rawZones = rawIngredient?.zone_locations
  if (!Array.isArray(rawZones) || rawZones.length === 0) {
    throw new Error(`${context}: zone_locations must be a non-empty array.`)
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
  const cardId = rawIngredient?.card?.oracle_id
  if (typeof cardId !== "string" || cardId.length === 0) {
    throw new Error(`${context}: card.oracle_id is required.`)
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
    mustBeCommander: rawIngredient?.must_be_commander === true
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

  // `scryfall_api` is the only authoritative expansion upstream exposes; no public
  // serializer surfaces Template.replacements, so a template without it stays
  // unresolved rather than being hand-mapped.
  const scryfallApi = typeof rawIngredient.template.scryfall_api === "string" ? rawIngredient.template.scryfall_api : null
  const expansion = templateExpansions.get(templateId)
  const oracleIds = expansion ? [...expansion].sort((a, b) => a.localeCompare(b)) : []
  const unresolved = oracleIds.length === 0

  return {
    templateId,
    templateName,
    quantity: readIngredientQuantity(rawIngredient, `${context} ${templateId}`),
    zones,
    cardState: projectIngredientState(rawIngredient, zones),
    mustBeCommander: rawIngredient?.must_be_commander === true,
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

/** @param {{ rawVariants: unknown[], templateExpansions: Map<number, string[]>, snapshot: object }} options */
export function buildComboArtifacts({ rawVariants, templateExpansions, snapshot }) {
  const { accepted, rejected } = partitionVariantsByStatus(rawVariants)

  const variants = accepted
    .map((rawVariant) => projectVariant(rawVariant, templateExpansions))
    .sort((a, b) => a.variantId.localeCompare(b.variantId))

  const seenVariantIds = new Set()
  for (const variant of variants) {
    if (seenVariantIds.has(variant.variantId)) {
      throw new Error(`Commander Spellbook variant ${variant.variantId} appears more than once in the raw input.`)
    }
    seenVariantIds.add(variant.variantId)
  }

  const manifest = sortedObject({
    generatedBy: "scripts/build-commander-spellbook-combos.mjs",
    license: typeof snapshot?.license === "string" ? snapshot.license : null,
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

  return {
    detail: { manifest, variants },
    index: {
      manifest,
      byOracleId: toSortedMembership(byOracleId),
      byTemplateOracleId: toSortedMembership(byTemplateOracleId),
      templates: serializedTemplates,
      unresolvedTemplateIds: Object.values(serializedTemplates)
        .filter((template) => template.unresolved)
        .map((template) => template.templateId)
    }
  }
}

/**
 * Read the gitignored raw refresh output. Returns `null` when no refresh has run,
 * which the caller treats as "preserve whatever is already committed".
 */
export function readRawInputs(rawInputDir) {
  const manifestPath = path.join(rawInputDir, "refresh-manifest.json")
  const variantPaths = listJsonFiles(path.join(rawInputDir, "variants"))

  if (!fs.existsSync(manifestPath) || variantPaths.length === 0) {
    return null
  }

  const snapshot = readJsonFile(manifestPath)
  const rawVariants = []
  for (const variantPath of variantPaths) {
    const page = readJsonFile(variantPath)
    if (!Array.isArray(page?.results)) {
      throw new Error(`Malformed Commander Spellbook raw input ${variantPath}: expected a "results" array.`)
    }
    rawVariants.push(...page.results)
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

async function writeArtifact(filePath, value) {
  ensureParentDirectory(filePath)
  const output = await prettierFormat(JSON.stringify(value), { parser: "json", printWidth: 120 })
  fs.writeFileSync(filePath, output)
  return Buffer.byteLength(output)
}

function validateExistingArtifact(filePath, label) {
  if (!fs.existsSync(filePath)) {
    console.warn(`No existing ${label} artifact found to preserve: ${filePath}`)
    return false
  }
  const artifact = JSON.parse(fs.readFileSync(filePath, "utf8"))
  if (typeof artifact !== "object" || artifact === null || Array.isArray(artifact)) {
    throw new Error(`Unexpected ${label} artifact shape in ${filePath}; expected a JSON object.`)
  }
  console.log(`Preserved existing ${label} artifact: ${filePath} (${formatBytes(fs.statSync(filePath).size)}).`)
  return true
}

/** @param {{ rawInputDir?: string, detailPath?: string, indexPath?: string }} [options] */
export async function runBuild(options = {}) {
  const rawInputDir = options.rawInputDir ?? defaultRawInputDir
  const detailPath = options.detailPath ?? defaultDetailPath
  const indexPath = options.indexPath ?? defaultIndexPath

  const rawInputs = readRawInputs(rawInputDir)

  if (!rawInputs) {
    console.warn(`Commander Spellbook raw inputs not found: ${rawInputDir}`)
    const detailPresent = validateExistingArtifact(detailPath, "combo detail")
    const indexPresent = validateExistingArtifact(indexPath, "combo index")

    if (detailPresent && indexPresent) {
      return { preserved: true, variantCount: null }
    }

    // Bootstrap: emit a valid empty corpus so the runtime loader and `data:build`
    // have a well-formed artifact before the owner-approved production refresh.
    const { detail, index } = buildComboArtifacts({
      rawVariants: [],
      templateExpansions: new Map(),
      snapshot: { snapshotAt: null, license: null }
    })
    await writeArtifact(detailPath, detail)
    await writeArtifact(indexPath, index)
    console.log(`Wrote empty Commander Spellbook corpus placeholder: ${detailPath}, ${indexPath}`)
    return { preserved: false, variantCount: 0 }
  }

  const { detail, index } = buildComboArtifacts(rawInputs)

  const detailBytes = await writeArtifact(detailPath, detail)
  const indexBytes = await writeArtifact(indexPath, index)

  console.log(`Commander Spellbook variants: ${detail.variants.length}`)
  console.log(`Rejected non-OK variants: ${detail.manifest.rejectedVariantCount}`)
  console.log(`Unresolved templates: ${index.unresolvedTemplateIds.length}`)
  console.log(`Detail bytes: ${detailBytes} (${formatBytes(detailBytes)}); wrote ${detailPath}`)
  console.log(`Index bytes: ${indexBytes} (${formatBytes(indexBytes)}); wrote ${indexPath}`)

  return { preserved: false, variantCount: detail.variants.length }
}

const invokedPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : ""
if (import.meta.url === invokedPath) {
  runBuild().catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
}
