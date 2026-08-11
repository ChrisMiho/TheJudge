// Combo enrichment answer-quality comparison (REQ-146, DEC-161).
//
// Answers each curated scenario twice against the configured live provider — once
// with the committed combo catalog loaded, once with combo enrichment disabled —
// and writes both answers side by side for human review.
//
// Informational only. This is never part of `npm run quality:check`, is never
// asserted against a golden, and never gates a build. Only the dated
// human-reviewed conclusion becomes durable history.
//
// Enrichment is toggled through backend runtime configuration alone: two
// configured apps are built in one process with different env objects. No
// request field, response field, Zod schema, route, or provider selection
// changes between the legs.
//
// Costs money, so it refuses to contact the provider without --confirm-live-calls:
//   npm run combo:answer-quality                          # dry: prints the plan
//   npm run combo:answer-quality -- --confirm-live-calls  # live
//
// Run via tsx so the backend TypeScript modules resolve. The TS imports are
// deliberately *dynamic* and confined to the live path, so `node --test` can
// import this module and exercise the pure logic without a TypeScript loader and
// without ever reaching a network call.

import { mkdir, readFile, writeFile } from "node:fs/promises"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")

export const CONFIRM_FLAG = "--confirm-live-calls"
export const DEFAULT_OUTPUT_DIR = "output/combo-answer-quality"
export const SCENARIOS_PATH = join(repoRoot, "scripts/fixtures/combo-answer-quality-scenarios.json")
export const EVAL_FIXTURES_DIR = join(repoRoot, "apps/backend/src/eval/fixtures")
export const COMBO_SECTION_MARKER = "COMMANDER SPELLBOOK COMBO CONTEXT"

export function parseArgs(argv) {
  const getFlag = (name) => {
    const index = argv.indexOf(name)
    return index !== -1 && index + 1 < argv.length ? argv[index + 1] : undefined
  }

  return {
    confirmed: argv.includes(CONFIRM_FLAG),
    outputDir: resolve(repoRoot, getFlag("--output-dir") ?? DEFAULT_OUTPUT_DIR),
    scenarioFilter: getFlag("--scenario")
  }
}

/** Scenarios reference an eval fixture by id, or carry an inline request. */
export async function loadScenarios({ scenariosPath = SCENARIOS_PATH, fixturesDir = EVAL_FIXTURES_DIR } = {}) {
  const parsed = JSON.parse(await readFile(scenariosPath, "utf8"))
  if (!Array.isArray(parsed?.scenarios)) {
    throw new Error(`Malformed scenarios file ${scenariosPath}: expected a "scenarios" array.`)
  }

  const scenarios = []
  for (const scenario of parsed.scenarios) {
    if (typeof scenario?.id !== "string" || scenario.id.length === 0) {
      throw new Error(`Malformed scenario in ${scenariosPath}: every scenario needs an id.`)
    }

    let request = scenario.request
    if (!request && typeof scenario.fixture === "string") {
      const fixturePath = join(fixturesDir, `${scenario.fixture}.fixture.json`)
      request = JSON.parse(await readFile(fixturePath, "utf8")).request
    }
    if (!request) {
      throw new Error(`Scenario ${scenario.id} has neither an inline request nor a resolvable fixture.`)
    }

    scenarios.push({ id: scenario.id, rationale: scenario.rationale ?? "", request })
  }

  return scenarios
}

export function describePlan(scenarios, outputDir) {
  return [
    "Combo answer-quality comparison plan (no provider request has been made):",
    "",
    ...scenarios.map((scenario, index) => `  ${index + 1}. ${scenario.id} — ${scenario.rationale}`),
    "",
    `  Each scenario is answered twice: once with COMBO_ENRICHMENT_ENABLED=true and`,
    `  once with COMBO_ENRICHMENT_ENABLED=false, both against the configured live provider.`,
    `  Output would be written to ${outputDir}/`,
    "",
    `Re-run with ${CONFIRM_FLAG} to make the ${scenarios.length * 2} live provider calls.`
  ].join("\n")
}

/**
 * Fail with an actionable message rather than a stack trace from deep inside the
 * provider factory when the live provider is not configured.
 */
export function assertLiveProviderConfigured(env) {
  const provider = env.ASK_AI_PROVIDER?.trim().toLowerCase()

  if (provider !== "openai") {
    throw new Error(
      `A live answer-quality comparison needs a live provider, but ASK_AI_PROVIDER is ${
        provider ? `"${provider}"` : "unset"
      }. Set ASK_AI_PROVIDER=openai (with OPENAI_API_KEY and OPENAI_MODEL) and re-run.`
    )
  }

  const missing = ["OPENAI_API_KEY", "OPENAI_MODEL"].filter((name) => !env[name]?.trim())
  if (missing.length > 0) {
    throw new Error(`ASK_AI_PROVIDER=openai also requires ${missing.join(" and ")}. Set them and re-run.`)
  }
}

export function formatScenarioReport({ scenario, enriched, disabled }) {
  const sectionState = (leg) => (leg.promptText?.includes(COMBO_SECTION_MARKER) ? "present" : "absent");

  return [
    `=== ${scenario.id} ===`,
    scenario.rationale ? `Rationale: ${scenario.rationale}` : "",
    `Combo section — enrichment on: ${sectionState(enriched)}; enrichment off: ${sectionState(disabled)}`,
    "",
    "--- WITH COMBO ENRICHMENT ---",
    enriched.answer,
    "",
    "--- WITHOUT COMBO ENRICHMENT ---",
    disabled.answer,
    ""
  ]
    .filter((line) => line !== "")
    .join("\n")
}

export function formatComparisonReport(results, { generatedAt }) {
  const header = [
    "COMBO ENRICHMENT ANSWER-QUALITY COMPARISON",
    `Generated: ${generatedAt}`,
    `Scenarios: ${results.length}`,
    "",
    "Informational only (DEC-161). This is not a build gate and is never asserted",
    "against a golden. Review both answers per scenario and record a dated verdict",
    "in the work package's slice F doc.",
    ""
  ].join("\n")

  return `${[header, ...results.map(formatScenarioReport)].join("\n")}\n`
}

/**
 * Build the two legs as configured apps differing only by env, then answer each
 * scenario over HTTP on an ephemeral port. Imported dynamically so this module
 * stays loadable under plain `node --test`.
 */
async function buildLiveLegs(env) {
  const { createConfiguredApp } = await import("../apps/backend/src/runtime/createConfiguredApp.ts")
  const { loadComboCatalog } = await import("../apps/backend/src/commanderSpellbook/catalog.ts")
  const { preparePromptInput } = await import("../apps/backend/src/prompt/preparation.ts")

  // A live provider returns only `{ answer }` — the prompt is never in the
  // response, and adding it would change the contract. So the leg reconstructs
  // the prompt locally from the same modules and the same catalog the app loaded,
  // purely so the reviewer can see whether a combo section was actually supplied.
  const comboCatalog = loadComboCatalog(
    join(repoRoot, "apps/backend/data/commanderSpellbookCombos.json"),
    join(repoRoot, "apps/backend/data/commanderSpellbookComboIndex.json")
  )

  const start = async (comboEnrichmentEnabled) => {
    const runtime = createConfiguredApp(repoRoot, {
      ...env,
      COMBO_ENRICHMENT_ENABLED: comboEnrichmentEnabled ? "true" : "false"
    })
    const server = await new Promise((resolveServer) => {
      const listener = runtime.app.listen(0, () => resolveServer(listener))
    })
    const { port } = server.address()

    return {
      comboVariantCount: runtime.comboVariantCount,
      async ask(request) {
        const response = await fetch(`http://127.0.0.1:${port}/api/ask-ai`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(request)
        })
        const body = await response.json()
        const { promptText } = preparePromptInput(request, {
          comboCatalog: comboEnrichmentEnabled ? comboCatalog : undefined
        })
        return { answer: body.answer ?? JSON.stringify(body), promptText, status: response.status }
      },
      async close() {
        await new Promise((resolveClose) => server.close(resolveClose))
      }
    }
  }

  const enriched = await start(true)
  const disabled = await start(false)
  return { enriched, disabled }
}

/** @param {{ argv?: string[], env?: NodeJS.ProcessEnv, buildLegs?: Function, log?: Function }} [options] */
export async function runComparison(options = {}) {
  const {
    argv = process.argv.slice(2),
    env = process.env,
    buildLegs = buildLiveLegs,
    log = console.log,
    generatedAt = new Date().toISOString()
  } = options

  const { confirmed, outputDir, scenarioFilter } = parseArgs(argv)
  const allScenarios = await loadScenarios()
  const scenarios = scenarioFilter
    ? allScenarios.filter((scenario) => scenario.id === scenarioFilter)
    : allScenarios

  if (scenarios.length === 0) {
    throw new Error(`No scenario matched --scenario ${scenarioFilter}.`)
  }

  if (!confirmed) {
    log(describePlan(scenarios, outputDir))
    return { ran: false, scenarioCount: scenarios.length, outputPath: null }
  }

  assertLiveProviderConfigured(env)

  const legs = await buildLegs(env)
  const results = []
  try {
    for (const scenario of scenarios) {
      log(`Answering ${scenario.id} with enrichment on...`)
      const enriched = await legs.enriched.ask(scenario.request)
      log(`Answering ${scenario.id} with enrichment off...`)
      const disabled = await legs.disabled.ask(scenario.request)
      results.push({ scenario, enriched, disabled })
    }
  } finally {
    await legs.enriched.close?.()
    await legs.disabled.close?.()
  }

  await mkdir(outputDir, { recursive: true })
  const outputPath = join(outputDir, `comparison-${generatedAt.replace(/[:.]/g, "-")}.txt`)
  await writeFile(outputPath, formatComparisonReport(results, { generatedAt }), "utf8")

  log("")
  log(`Wrote ${results.length} scenario comparisons to ${outputPath}`)
  log("Review both answers per scenario and record a dated verdict in slice F.")

  return { ran: true, scenarioCount: scenarios.length, outputPath }
}

const invokedPath = process.argv[1] ? new URL(`file://${resolve(process.argv[1])}`).href : ""
if (import.meta.url === invokedPath) {
  runComparison().catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
}
