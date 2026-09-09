import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import test from "node:test"
import zlib from "node:zlib"

import {
  ACCEPTED_VARIANT_STATUS,
  COMBO_BLOCK_SIZE,
  EXAMPLE_VARIANT_STATUS,
  MIN_VARIANT_POPULARITY,
  buildComboArtifacts,
  meetsPopularityFloor,
  partitionVariantsByStatus,
  projectIngredientState,
  readRawInputs,
  readVariantAtPosition,
  runBuild,
  serializeVariantDetail,
  trimCommittedArtifacts
} from "./build-commander-spellbook-combos.mjs"

const fixturesDir = path.resolve("apps/backend/src/commanderSpellbook/__fixtures__")
const sampleInputDir = path.join(fixturesDir, "raw-sample")

function makeTempDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "combo-build-"))
  test.after(() => fs.rmSync(dir, { recursive: true, force: true }))
  return dir
}

function outputPaths(dir) {
  return {
    detailPath: path.join(dir, "commanderSpellbookComboBlocks.br"),
    indexPath: path.join(dir, "commanderSpellbookComboIndex.json.br")
  }
}

/**
 * Test-only convenience: decompress the index (one brotli member, read whole)
 * and every variant named in its `variantPositions` directory (each fetched
 * from its own block by position) back into a `{ manifest, variants }` shape,
 * so most assertions below read exactly as they did before the block-layout
 * storage format existed. The runtime loader (slice B) never does this "read
 * everything" reconstruction — it fetches one block at a time, on demand.
 */
function reconstructArtifacts(paths) {
  const index = JSON.parse(zlib.brotliDecompressSync(fs.readFileSync(paths.indexPath)).toString("utf8"))
  const detailBuffer = fs.readFileSync(paths.detailPath)
  const variantIds = Object.keys(index.variantPositions).sort((a, b) => a.localeCompare(b))
  const variants = variantIds.map((variantId) =>
    readVariantAtPosition(detailBuffer, index.blocks, index.variantPositions[variantId])
  )
  return { detail: { manifest: index.manifest, variants }, index }
}

async function buildFromFixture(fixtureName) {
  const outputDir = makeTempDir()
  const paths = outputPaths(outputDir)
  await runBuild({ rawInputDir: path.join(fixturesDir, fixtureName), ...paths })
  return { ...paths, ...reconstructArtifacts(paths) }
}

function copyDirectory(source, destination) {
  fs.cpSync(source, destination, { recursive: true })
}

test("build is deterministic for identical raw inputs", async () => {
  const first = await buildFromFixture("raw-sample")
  const second = await buildFromFixture("raw-sample")

  assert.ok(fs.readFileSync(first.detailPath).equals(fs.readFileSync(second.detailPath)))
  assert.ok(fs.readFileSync(first.indexPath).equals(fs.readFileSync(second.indexPath)))
})

test("the detail artifact groups variants into 128-variant NDJSON blocks, one brotli member per block", () => {
  const variants = Array.from({ length: 300 }, (_, index) => ({
    variantId: `v-${String(index).padStart(4, "0")}`,
    value: index
  }))

  const { detailBuffer, blockDirectory, positions } = serializeVariantDetail(variants)

  // 300 variants at 128/block -> 3 blocks (128, 128, 44).
  assert.equal(blockDirectory.length, 3)
  assert.equal(positions["v-0000"], 0)
  assert.equal(positions["v-0299"], 299)

  // Each block decodes on its own, independent of every other block's bytes,
  // and splits into exactly the expected number of NDJSON lines.
  const expectedLineCounts = [128, 128, 44]
  blockDirectory.forEach((block, blockIndex) => {
    const member = detailBuffer.subarray(block.offset, block.offset + block.length)
    const lines = zlib.brotliDecompressSync(member).toString("utf8").split("\n")
    assert.equal(lines.length, expectedLineCounts[blockIndex])
    const first = JSON.parse(lines[0])
    assert.equal(first.variantId, `v-${String(blockIndex * COMBO_BLOCK_SIZE).padStart(4, "0")}`)
  })

  // Whole-buffer size cannot equal compressing the same content as one member
  // for a corpus this size where cross-block boundaries still exist.
  const singleStreamEquivalent = zlib.brotliCompressSync(Buffer.from(JSON.stringify(variants), "utf8"))
  assert.notEqual(detailBuffer.length, singleStreamEquivalent.length)
})

test("the index carries a variantId to integer-position directory, and a block byte-offset directory", async () => {
  const { index } = await buildFromFixture("raw-sample")

  assert.deepEqual(Object.keys(index.variantPositions).sort(), ["1000-2000", "1000-4000", "1000-5000"])
  const positionsUsed = new Set(Object.values(index.variantPositions))
  assert.deepEqual([...positionsUsed].sort((a, b) => a - b), [0, 1, 2])

  assert.equal(index.blocks.length, 1)
  for (const { offset, length } of index.blocks) {
    assert.ok(Number.isInteger(offset) && offset >= 0)
    assert.ok(Number.isInteger(length) && length > 0)
  }
})

test("serializeVariantDetail and readVariantAtPosition round-trip without touching other blocks", () => {
  const variants = [
    { variantId: "a", value: "first" },
    { variantId: "b", value: "second" }
  ]
  const { detailBuffer, blockDirectory, positions } = serializeVariantDetail(variants)

  // Both fit in one block (well under 128), but the round trip must still
  // resolve each line correctly by position.
  assert.equal(blockDirectory.length, 1)
  assert.deepEqual(readVariantAtPosition(detailBuffer, blockDirectory, positions.a), variants[0])
  assert.deepEqual(readVariantAtPosition(detailBuffer, blockDirectory, positions.b), variants[1])
})

test("the eval catalog's variant and ingredient key shape matches the real build's output", async () => {
  // apps/backend/src/eval/fixtures/commander-spellbook-eval-catalog.json is
  // deliberately independent of the production artifact (so a corpus refresh
  // never churns a prompt golden), but its shape must still match what this
  // build actually emits, or the eval harness would be exercising a contract
  // the runtime loader does not produce.
  const evalCatalogPath = path.resolve(
    "apps/backend/src/eval/fixtures/commander-spellbook-eval-catalog.json"
  )
  const evalCatalog = JSON.parse(fs.readFileSync(evalCatalogPath, "utf8"))
  const evalVariant = evalCatalog.variants[0]
  const evalTemplateVariant = evalCatalog.variants.find((variant) => variant.templateIngredients.length > 0)

  const { detail } = await buildFromFixture("raw-real-excerpt")
  const realVariant = detail.variants[0]
  const realTemplateVariant = detail.variants.find((variant) => variant.templateIngredients.length > 0)

  assert.deepEqual(Object.keys(evalVariant).sort(), Object.keys(realVariant).sort())
  assert.deepEqual(
    Object.keys(evalVariant.cardIngredients[0]).sort(),
    Object.keys(realVariant.cardIngredients[0]).sort()
  )
  assert.ok(evalTemplateVariant && realTemplateVariant, "both catalogs must exercise a template ingredient")
  assert.deepEqual(
    Object.keys(evalTemplateVariant.templateIngredients[0]).sort(),
    Object.keys(realTemplateVariant.templateIngredients[0]).sort()
  )
})

test("the build succeeds against a verbatim real-upstream excerpt", async () => {
  const { detail } = await buildFromFixture("raw-real-excerpt")

  assert.equal(detail.variants.length, 2)
  const withTemplate = detail.variants.find((variant) => variant.templateIngredients.length > 0)
  assert.ok(withTemplate, "the real excerpt's template-requiring variant must still parse")
  assert.equal(withTemplate.templateIngredients[0].templateName, "Persist Creature")
})

test("a real-shaped excerpt reverted to snake_case field names fails the build loudly", async () => {
  const outputDir = makeTempDir()
  const snakeCaseDir = path.join(outputDir, "raw-snake-case-regression")
  copyDirectory(path.join(fixturesDir, "raw-real-excerpt"), snakeCaseDir)

  const envelope = JSON.parse(fs.readFileSync(path.join(snakeCaseDir, "variants.json"), "utf8"))
  for (const variant of envelope.variants) {
    for (const ingredient of variant.uses ?? []) {
      ingredient.zone_locations = ingredient.zoneLocations
      delete ingredient.zoneLocations
    }
  }
  fs.writeFileSync(path.join(snakeCaseDir, "variants.json"), JSON.stringify(envelope))

  await assert.rejects(
    () => runBuild({ rawInputDir: snakeCaseDir, ...outputPaths(makeTempDir()) }),
    /zoneLocations must be a non-empty array/
  )
})

test("accepts only OK variants and rejects EXAMPLE", async () => {
  const { detail } = await buildFromFixture("raw-sample")
  const variantIds = detail.variants.map((variant) => variant.variantId)

  assert.deepEqual(variantIds, ["1000-2000", "1000-4000", "1000-5000"])
  assert.ok(!variantIds.includes("1000-3000"), "the EXAMPLE variant must not be emitted")
  assert.equal(detail.manifest.rejectedVariantCount, 1)
  assert.ok(!JSON.stringify(detail).includes("Example Rejected Card"))
})

test("EXAMPLE is the short upstream status code, not the enum name", () => {
  assert.equal(EXAMPLE_VARIANT_STATUS, "E")
  assert.equal(ACCEPTED_VARIANT_STATUS, "OK")

  const { accepted, rejected } = partitionVariantsByStatus([{ id: "a", status: "OK" }, { id: "b", status: "E" }])
  assert.equal(accepted.length, 1)
  assert.equal(rejected, 1)
})

test("an unrecognized status fails the build naming the status and variant id", async () => {
  const outputDir = makeTempDir()
  await assert.rejects(
    () => runBuild({ rawInputDir: path.join(fixturesDir, "raw-unrecognized-status"), ...outputPaths(outputDir) }),
    (error) => error.message.includes("PENDING") && error.message.includes("9000-1000")
  )
})

test("a multi-zone ingredient keeps one state string per zone", async () => {
  const { detail } = await buildFromFixture("raw-sample")
  const variant = detail.variants.find((entry) => entry.variantId === "1000-2000")
  const multiZone = variant.cardIngredients.find((ingredient) => ingredient.cardName === "Underworld Breach")

  assert.deepEqual(multiZone.zones, ["B", "G"])
  assert.deepEqual(multiZone.cardState, {
    battlefield: "untapped and with no counters on it",
    graveyard: "with at least three other cards in your graveyard"
  })
})

test("hand and command ingredients carry no state key, and mustBeCommander survives", async () => {
  const { detail } = await buildFromFixture("raw-sample")

  const handIngredient = detail.variants
    .find((entry) => entry.variantId === "1000-2000")
    .cardIngredients.find((ingredient) => ingredient.cardName === "Demonic Consultation")
  assert.deepEqual(handIngredient.zones, ["H"])
  assert.deepEqual(handIngredient.cardState, {})
  assert.equal(handIngredient.mustBeCommander, false)

  const commanderIngredient = detail.variants
    .find((entry) => entry.variantId === "1000-4000")
    .cardIngredients.find((ingredient) => ingredient.cardName === "Kenrith, the Returned King")
  assert.deepEqual(commanderIngredient.zones, ["C"])
  assert.deepEqual(commanderIngredient.cardState, {})
  assert.equal(commanderIngredient.mustBeCommander, true)
})

test("an empty upstream state string produces no key rather than an empty value", () => {
  const state = projectIngredientState(
    { battlefieldCardState: "", graveyardCardState: "milled", exileCardState: "   " },
    ["B", "G", "E"]
  )
  assert.deepEqual(state, { graveyard: "milled" })
})

test("ingredient quantities survive per ingredient", async () => {
  const { detail } = await buildFromFixture("raw-sample")
  const monolith = detail.variants
    .find((entry) => entry.variantId === "1000-4000")
    .cardIngredients.find((ingredient) => ingredient.cardName === "Basalt Monolith")

  assert.equal(monolith.quantity, 2)
})

test("a query-backed template expands to a deduplicated sorted oracle-id list", async () => {
  const { detail, index } = await buildFromFixture("raw-sample")
  const template = detail.variants
    .find((entry) => entry.variantId === "1000-4000")
    .templateIngredients.find((ingredient) => ingredient.templateId === 12)

  assert.equal(template.unresolved, false)
  assert.deepEqual(template.oracleIds, [
    "bbbbbbbb-0000-4000-8000-000000000001",
    "bbbbbbbb-0000-4000-8000-000000000002"
  ])
  assert.deepEqual(index.templates["12"].oracleIds, template.oracleIds)
  for (const oracleId of template.oracleIds) {
    assert.deepEqual(index.byTemplateOracleId[oracleId], ["1000-4000"])
  }
})

test("a template with no query and no mapping is retained as unresolved", async () => {
  const { detail, index } = await buildFromFixture("raw-sample")
  const template = detail.variants
    .find((entry) => entry.variantId === "1000-5000")
    .templateIngredients.find((ingredient) => ingredient.templateId === 99)

  assert.equal(template.unresolved, true)
  assert.equal(template.scryfallApi, null)
  assert.deepEqual(template.oracleIds, [])
  assert.deepEqual(index.unresolvedTemplateIds, [99])
  assert.equal(index.templates["99"].unresolved, true)
})

test("the index maps each oracle id to its variants", async () => {
  const { index } = await buildFromFixture("raw-sample")

  assert.deepEqual(index.byOracleId["aaaaaaaa-0000-4000-8000-000000000001"], ["1000-2000"])
  assert.deepEqual(Object.keys(index.byOracleId), [...Object.keys(index.byOracleId)].sort())
})

test("no image, price, or printing identity reaches either artifact", async () => {
  const { detail, index } = await buildFromFixture("raw-sample")
  const serialized = `${JSON.stringify(detail)}${JSON.stringify(index)}`

  for (const forbidden of ["imageUrl", "image_uri", "cards.scryfall.io", "prices", "tcgplayer", "used_face", "usedFace"]) {
    assert.ok(!serialized.includes(forbidden), `${forbidden} must not appear in a committed artifact`)
  }
})

test("editorial fields and produced effects are projected onto camelCase", async () => {
  const { detail } = await buildFromFixture("raw-sample")
  const variant = detail.variants.find((entry) => entry.variantId === "1000-2000")

  assert.equal(variant.manaNeeded, "{U}{B}")
  assert.equal(variant.easyPrerequisites, "All permanents are untapped.")
  assert.equal(variant.notablePrerequisites, "Your library has at most five cards.")
  assert.ok(variant.steps.startsWith("Cast Demonic Consultation"))
  assert.ok(variant.notes.includes("still be on the stack"))
  assert.equal(variant.popularity, 900)
  assert.equal(variant.sourceUrl, "https://commanderspellbook.com/combo/1000-2000/")
  assert.deepEqual(variant.producedEffects, ["Draw your library", "Win the game"])
})

test("an OK variant missing an editorial field is an integrity failure", () => {
  assert.throws(
    () =>
      buildComboArtifacts({
        rawVariants: [
          {
            id: "7000-1000",
            status: "OK",
            description: null,
            manaNeeded: "{R}",
            easyPrerequisites: "",
            notablePrerequisites: "",
            notes: "",
            uses: [],
            requires: []
          }
        ],
        templateExpansions: new Map(),
        snapshot: {}
      }),
    /7000-1000 has status OK but description is not a string/
  )
})

test("the manifest carries the snapshot timestamp, attribution, and license", async () => {
  const { detail, index } = await buildFromFixture("raw-sample")

  assert.equal(detail.manifest.snapshotAt, "2026-08-11T00:00:00.000Z")
  assert.equal(detail.manifest.source, "Commander Spellbook")
  assert.ok(detail.manifest.license.includes("commanderspellbook.com"))
  assert.equal(detail.manifest.variantCount, 3)
  assert.deepEqual(index.manifest, detail.manifest)
})

test("absent raw inputs leave existing artifacts untouched and exit 0", async () => {
  const outputDir = makeTempDir()
  const paths = outputPaths(outputDir)
  await runBuild({ rawInputDir: path.join(fixturesDir, "raw-sample"), ...paths })

  const detailBefore = fs.readFileSync(paths.detailPath)
  const indexBefore = fs.readFileSync(paths.indexPath)

  const result = await runBuild({ rawInputDir: path.join(outputDir, "absent"), ...paths })

  assert.equal(result.preserved, true)
  assert.ok(fs.readFileSync(paths.detailPath).equals(detailBefore))
  assert.ok(fs.readFileSync(paths.indexPath).equals(indexBefore))
})

test("absent raw inputs with no artifacts bootstrap a valid empty corpus", async () => {
  const outputDir = makeTempDir()
  const paths = outputPaths(outputDir)

  const result = await runBuild({ rawInputDir: path.join(outputDir, "absent"), ...paths })

  assert.equal(result.variantCount, 0)
  const { detail, index } = reconstructArtifacts(paths)
  assert.deepEqual(detail.variants, [])
  assert.deepEqual(index.byOracleId, {})
  assert.deepEqual(index.unresolvedTemplateIds, [])
  assert.deepEqual(index.variantPositions, {})
  assert.deepEqual(index.blocks, [])
  assert.equal(detail.manifest.snapshotAt, null)
})

test('a raw input missing its "variants" array fails without touching existing artifacts', async () => {
  const outputDir = makeTempDir()
  const paths = outputPaths(outputDir)
  await runBuild({ rawInputDir: sampleInputDir, ...paths })
  const detailBefore = fs.readFileSync(paths.detailPath)

  await assert.rejects(
    () => runBuild({ rawInputDir: path.join(fixturesDir, "raw-malformed-page"), ...paths }),
    /expected a "variants" array/
  )
  assert.ok(fs.readFileSync(paths.detailPath).equals(detailBefore))
})

test("a truncated raw input fails without touching existing artifacts", async () => {
  const workDir = makeTempDir()
  const paths = outputPaths(workDir)
  await runBuild({ rawInputDir: sampleInputDir, ...paths })
  const detailBefore = fs.readFileSync(paths.detailPath)
  const indexBefore = fs.readFileSync(paths.indexPath)

  // Syntactically invalid JSON cannot be committed (format:check parses every
  // .json in the repo), so the truncated input is produced here instead.
  const truncatedDir = path.join(workDir, "raw-truncated")
  copyDirectory(sampleInputDir, truncatedDir)
  const variantsPath = path.join(truncatedDir, "variants.json")
  fs.writeFileSync(variantsPath, fs.readFileSync(variantsPath, "utf8").slice(0, 200))

  await assert.rejects(() => runBuild({ rawInputDir: truncatedDir, ...paths }), /Malformed Commander Spellbook raw input/)

  assert.ok(fs.readFileSync(paths.detailPath).equals(detailBefore))
  assert.ok(fs.readFileSync(paths.indexPath).equals(indexBefore))
})

test("readRawInputs returns null when no refresh has run", async () => {
  const emptyDir = makeTempDir()
  assert.equal(await readRawInputs(emptyDir), null)
})

test("readRawInputs streams an oversized variants.json without ever holding it as one JS string", async () => {
  // Regression guard for the real bulk export's actual size (~634MB
  // decompressed, measured 2026-08-22) exceeding V8's ~536MB max string
  // length. This fixture is far smaller, but still proves the read path is
  // the streaming one, not a `readFileSync(..., "utf8")` + `JSON.parse` that
  // merely happens to work at small scale.
  const dir = makeTempDir()
  fs.writeFileSync(path.join(dir, "refresh-manifest.json"), JSON.stringify({ snapshotAt: null, license: null }))
  const manyVariants = Array.from({ length: 500 }, (_, index) => ({
    id: `stream-${index}`,
    status: "OK",
    description: "steps",
    manaNeeded: "",
    easyPrerequisites: "",
    notablePrerequisites: "",
    notes: "",
    uses: [{ card: { name: "A", oracleId: `o${index}` }, zoneLocations: ["B"], quantity: 1 }],
    requires: []
  }))
  fs.writeFileSync(
    path.join(dir, "variants.json"),
    JSON.stringify({ timestamp: "t", version: "v", variants: manyVariants })
  )

  const rawInputs = await readRawInputs(dir)
  assert.equal(rawInputs.rawVariants.length, 500)
})

test("a duplicated variant id fails the build", () => {
  const duplicate = {
    id: "1",
    status: "OK",
    description: "steps",
    manaNeeded: "",
    easyPrerequisites: "",
    notablePrerequisites: "",
    notes: "",
    uses: [{ card: { name: "A", oracleId: "o1" }, zoneLocations: ["B"], quantity: 1 }],
    requires: []
  }

  assert.throws(
    () => buildComboArtifacts({ rawVariants: [duplicate, { ...duplicate }], templateExpansions: new Map(), snapshot: {} }),
    /appears more than once/
  )
})

test("an unrecognized zone location fails the build", () => {
  assert.throws(
    () =>
      buildComboArtifacts({
        rawVariants: [
          {
            id: "2",
            status: "OK",
            description: "steps",
            manaNeeded: "",
            easyPrerequisites: "",
            notablePrerequisites: "",
            notes: "",
            uses: [{ card: { name: "A", oracleId: "o1" }, zoneLocations: ["S"], quantity: 1 }],
            requires: []
          }
        ],
        templateExpansions: new Map(),
        snapshot: {}
      }),
    /unrecognized zone location "S"/
  )
})


function popularityVariant(id, popularity) {
  return {
    id,
    status: "OK",
    popularity,
    description: "steps",
    manaNeeded: "",
    easyPrerequisites: "",
    notablePrerequisites: "",
    notes: "",
    uses: [{ card: { name: `Card ${id}`, oracleId: `o-${id}` }, zoneLocations: ["B"], quantity: 1 }],
    requires: []
  }
}

test("with no options, the default floor keeps the full corpus", () => {
  // Slice C (REQ-093): MIN_VARIANT_POPULARITY defaults to 0, and
  // meetsPopularityFloor treats a floor <= 0 as "keep everything" — so
  // `data:build` running `runBuild` with no options now keeps the full
  // corpus by default, which is the intended standing state. Before Slice C
  // this same call (against a default of 2) dropped the popularity-0
  // variants; this test pins the new default's actual behavior rather than
  // the old one.
  const { index } = buildComboArtifacts({
    rawVariants: [popularityVariant("1", 0), popularityVariant("2", 5), popularityVariant("3", 0)],
    templateExpansions: new Map(),
    snapshot: {}
  })

  assert.equal(index.manifest.variantCount, 3)
  assert.equal(index.manifest.minPopularity, MIN_VARIANT_POPULARITY)
  assert.equal(index.manifest.belowPopularityFloorCount, 0)
  assert.deepEqual(Object.keys(index.variantPositions).sort(), ["1", "2", "3"])
})

test("a trimmed variant leaves no trace in any derived structure", () => {
  // Membership, the template directory, and the position directory are all
  // built from the same variant list, so filtering it must be complete
  // rather than leaving an oracle id pointing at a variant the detail
  // artifact no longer has. Exercises the emergency-valve path directly with
  // an explicit floor: the default floor is 0 (Slice C), which filters
  // nothing, so a real drop needs `minPopularity` passed the way
  // `--trim-committed` would.
  const { index } = buildComboArtifacts({
    rawVariants: [popularityVariant("1", 0), popularityVariant("2", 5)],
    templateExpansions: new Map(),
    snapshot: {},
    minPopularity: 1
  })

  const referenced = new Set(Object.values(index.byOracleId).flat())
  for (const variantId of referenced) {
    assert.ok(variantId in index.variantPositions, `${variantId} is referenced but has no position entry`)
  }
  assert.ok(!index.byOracleId["o-1"], "a dropped variant must not keep its oracle membership")
})

test("the floor can be switched off, and then nothing is dropped", () => {
  const { index } = buildComboArtifacts({
    rawVariants: [popularityVariant("1", 0), popularityVariant("2", 5)],
    templateExpansions: new Map(),
    snapshot: {},
    minPopularity: 0
  })

  assert.equal(index.manifest.variantCount, 2)
  assert.equal(index.manifest.minPopularity, 0)
  assert.equal(index.manifest.belowPopularityFloorCount, 0)
})

test("a duplicate is still a build failure even below the floor", () => {
  // Duplicate detection runs over the accepted set before the filter: a corpus
  // that repeats a variant is malformed whether or not anyone plays it.
  assert.throws(
    () =>
      buildComboArtifacts({
        rawVariants: [popularityVariant("dup", 0), popularityVariant("dup", 0)],
        templateExpansions: new Map(),
        snapshot: {}
      }),
    /appears more than once/
  )
})

test("a variant with no popularity field reads as unplayed, not as unknown", () => {
  assert.equal(meetsPopularityFloor({}, 1), false)
  assert.equal(meetsPopularityFloor({ popularity: "900" }, 1), false)
  assert.equal(meetsPopularityFloor({ popularity: 1 }, 1), true)
  assert.equal(meetsPopularityFloor({ popularity: 0 }, 0), true)
})

test("--trim-committed re-blocks (filter survivors, re-serialize, rewrite) rather than splicing", async () => {
  const outputDir = makeTempDir()
  const paths = outputPaths(outputDir)

  // Build a corpus of 5 popularity-varying variants spanning what would be
  // one block, then trim at a floor that drops some of them.
  const rawVariants = [
    popularityVariant("a-1", 0),
    popularityVariant("a-2", 5),
    popularityVariant("a-3", 0),
    popularityVariant("a-4", 10),
    popularityVariant("a-5", 0)
  ]
  const templateExpansions = new Map()
  const { detailBuffer, index } = buildComboArtifacts({ rawVariants, templateExpansions, snapshot: {} })
  fs.mkdirSync(path.dirname(paths.detailPath), { recursive: true })
  fs.writeFileSync(paths.detailPath, detailBuffer)
  fs.writeFileSync(
    paths.indexPath,
    zlib.brotliCompressSync(Buffer.from(JSON.stringify(index), "utf8"))
  )

  const result = await trimCommittedArtifacts({ ...paths, minPopularity: 1 })

  assert.equal(result.kept, 2)
  assert.equal(result.dropped, 3)

  const { detail, index: trimmedIndex } = reconstructArtifacts(paths)
  assert.deepEqual(
    detail.variants.map((v) => v.variantId).sort(),
    ["a-2", "a-4"]
  )
  // Re-blocked, positions renumbered from 0 for the surviving, sorted set.
  assert.deepEqual(Object.keys(trimmedIndex.variantPositions).sort(), ["a-2", "a-4"])
  assert.deepEqual(new Set(Object.values(trimmedIndex.variantPositions)), new Set([0, 1]))
})
