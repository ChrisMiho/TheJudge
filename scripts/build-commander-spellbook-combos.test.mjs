import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import test from "node:test"

import {
  ACCEPTED_VARIANT_STATUS,
  EXAMPLE_VARIANT_STATUS,
  buildComboArtifacts,
  partitionVariantsByStatus,
  projectIngredientState,
  readRawInputs,
  runBuild
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
    detailPath: path.join(dir, "commanderSpellbookCombos.json"),
    indexPath: path.join(dir, "commanderSpellbookComboIndex.json")
  }
}

async function buildFromFixture(fixtureName) {
  const outputDir = makeTempDir()
  const paths = outputPaths(outputDir)
  await runBuild({ rawInputDir: path.join(fixturesDir, fixtureName), ...paths })
  return {
    ...paths,
    detail: JSON.parse(fs.readFileSync(paths.detailPath, "utf8")),
    index: JSON.parse(fs.readFileSync(paths.indexPath, "utf8"))
  }
}

function copyDirectory(source, destination) {
  fs.cpSync(source, destination, { recursive: true })
}

test("build is deterministic for identical raw inputs", async () => {
  const first = await buildFromFixture("raw-sample")
  const second = await buildFromFixture("raw-sample")

  assert.equal(fs.readFileSync(first.detailPath, "utf8"), fs.readFileSync(second.detailPath, "utf8"))
  assert.equal(fs.readFileSync(first.indexPath, "utf8"), fs.readFileSync(second.indexPath, "utf8"))
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
    { battlefield_card_state: "", graveyard_card_state: "milled", exile_card_state: "   " },
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
            mana_needed: "{R}",
            easy_prerequisites: "",
            notable_prerequisites: "",
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

  const detailBefore = fs.readFileSync(paths.detailPath, "utf8")
  const indexBefore = fs.readFileSync(paths.indexPath, "utf8")

  const result = await runBuild({ rawInputDir: path.join(outputDir, "absent"), ...paths })

  assert.equal(result.preserved, true)
  assert.equal(fs.readFileSync(paths.detailPath, "utf8"), detailBefore)
  assert.equal(fs.readFileSync(paths.indexPath, "utf8"), indexBefore)
})

test("absent raw inputs with no artifacts bootstrap a valid empty corpus", async () => {
  const outputDir = makeTempDir()
  const paths = outputPaths(outputDir)

  const result = await runBuild({ rawInputDir: path.join(outputDir, "absent"), ...paths })

  assert.equal(result.variantCount, 0)
  const detail = JSON.parse(fs.readFileSync(paths.detailPath, "utf8"))
  const index = JSON.parse(fs.readFileSync(paths.indexPath, "utf8"))
  assert.deepEqual(detail.variants, [])
  assert.deepEqual(index.byOracleId, {})
  assert.deepEqual(index.unresolvedTemplateIds, [])
  assert.equal(detail.manifest.snapshotAt, null)
})

test("a page missing its results array fails without touching existing artifacts", async () => {
  const outputDir = makeTempDir()
  const paths = outputPaths(outputDir)
  await runBuild({ rawInputDir: sampleInputDir, ...paths })
  const detailBefore = fs.readFileSync(paths.detailPath, "utf8")

  await assert.rejects(
    () => runBuild({ rawInputDir: path.join(fixturesDir, "raw-malformed-page"), ...paths }),
    /expected a "results" array/
  )
  assert.equal(fs.readFileSync(paths.detailPath, "utf8"), detailBefore)
})

test("a truncated raw page fails without touching existing artifacts", async () => {
  const workDir = makeTempDir()
  const paths = outputPaths(workDir)
  await runBuild({ rawInputDir: sampleInputDir, ...paths })
  const detailBefore = fs.readFileSync(paths.detailPath, "utf8")
  const indexBefore = fs.readFileSync(paths.indexPath, "utf8")

  // Syntactically invalid JSON cannot be committed (format:check parses every
  // .json in the repo), so the truncated page is produced here instead.
  const truncatedDir = path.join(workDir, "raw-truncated")
  copyDirectory(sampleInputDir, truncatedDir)
  const pagePath = path.join(truncatedDir, "variants", "page-0001.json")
  fs.writeFileSync(pagePath, fs.readFileSync(pagePath, "utf8").slice(0, 200))

  await assert.rejects(() => runBuild({ rawInputDir: truncatedDir, ...paths }), /Malformed Commander Spellbook raw input/)

  assert.equal(fs.readFileSync(paths.detailPath, "utf8"), detailBefore)
  assert.equal(fs.readFileSync(paths.indexPath, "utf8"), indexBefore)
})

test("readRawInputs returns null when no refresh has run", () => {
  const emptyDir = makeTempDir()
  assert.equal(readRawInputs(emptyDir), null)
})

test("a duplicated variant id fails the build", () => {
  const duplicate = {
    id: "1",
    status: "OK",
    description: "steps",
    mana_needed: "",
    easy_prerequisites: "",
    notable_prerequisites: "",
    notes: "",
    uses: [{ card: { name: "A", oracle_id: "o1" }, zone_locations: ["B"], quantity: 1 }],
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
            mana_needed: "",
            easy_prerequisites: "",
            notable_prerequisites: "",
            notes: "",
            uses: [{ card: { name: "A", oracle_id: "o1" }, zone_locations: ["S"], quantity: 1 }],
            requires: []
          }
        ],
        templateExpansions: new Map(),
        snapshot: {}
      }),
    /unrecognized zone location "S"/
  )
})
