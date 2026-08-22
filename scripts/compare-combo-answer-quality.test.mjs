import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import test from "node:test"

import {
  CONFIRM_FLAG,
  assertLiveProviderConfigured,
  describePlan,
  formatComparisonReport,
  loadScenarios,
  parseArgs,
  runComparison
} from "./compare-combo-answer-quality.mjs"

const LIVE_ENV = { ASK_AI_PROVIDER: "openai", OPENAI_API_KEY: "sk-test", OPENAI_MODEL: "gpt-test" }

/**
 * A stubbed pair of legs. It records every call and never opens a socket, so a
 * regression that reintroduced a real request would fail rather than quietly
 * spend money.
 */
function stubLegs({ enrichedSection = true } = {}) {
  const calls = []
  const leg = (name, withSection) => ({
    async ask(request) {
      calls.push({ leg: name, request })
      return {
        answer: `${name} answer`,
        promptText: withSection ? "PROMPT\nCOMMANDER SPELLBOOK COMBO CONTEXT — COMMUNITY-SOURCED\n..." : "PROMPT\n...",
        status: 200
      }
    },
    async close() {
      calls.push({ leg: name, closed: true })
    }
  })

  return { legs: { enriched: leg("enriched", enrichedSection), disabled: leg("disabled", false) }, calls }
}

function makeTempDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "combo-ab-"))
  test.after(() => fs.rmSync(dir, { recursive: true, force: true }))
  return dir
}

test("parseArgs requires the explicit confirmation flag", () => {
  assert.equal(parseArgs([]).confirmed, false)
  assert.equal(parseArgs(["--scenario", "wrong-zone"]).confirmed, false)
  assert.equal(parseArgs([CONFIRM_FLAG]).confirmed, true)
  assert.equal(parseArgs(["--scenario", "wrong-zone"]).scenarioFilter, "wrong-zone")
})

test("the curated scenarios carry inline requests with real oracle ids, not the slice E eval fixtures", async () => {
  // DEC-162: the eval fixtures' synthetic oracle ids (eval-oracle-a, ...) exist
  // in no real corpus, so scenarios that pointed at them would make both A/B
  // legs answer from an identical (empty) enrichment and spend live provider
  // calls proving nothing. Every scenario now carries its request inline.
  const scenarios = await loadScenarios()

  assert.ok(scenarios.length >= 6)
  for (const scenario of scenarios) {
    assert.ok(scenario.request, `${scenario.id} resolved no request`)
    assert.ok(scenario.rationale.length > 0, `${scenario.id} has no rationale`)
  }
  assert.ok(scenarios.some((scenario) => scenario.request.mode === "lookup"))
  assert.ok(scenarios.some((scenario) => scenario.request.gameContext))

  const serialized = JSON.stringify(scenarios)
  assert.ok(!serialized.includes("eval-oracle-"), "no scenario may reference the eval fixtures' synthetic oracle ids")
  // Real Commander Spellbook oracle ids are UUIDs; the synthetic eval ids never were.
  const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
  assert.ok(uuidPattern.test(serialized), "expected at least one real UUID-shaped oracle id across the scenarios")
})

test("a run without the confirmation flag makes zero provider calls and exits 0", async () => {
  const { legs, calls } = stubLegs()
  const lines = []

  const result = await runComparison({
    argv: [],
    env: {},
    buildLegs: async () => legs,
    log: (line) => lines.push(line)
  })

  assert.equal(result.ran, false)
  assert.equal(result.outputPath, null)
  assert.equal(calls.length, 0, "no leg may be asked anything without the flag")
  assert.match(lines.join("\n"), /no provider request has been made/)
  assert.match(lines.join("\n"), /--confirm-live-calls/)
})

test("the dry-run plan lists every scenario it would run", async () => {
  const scenarios = await loadScenarios()
  const plan = describePlan(scenarios, "/tmp/example")

  for (const scenario of scenarios) {
    assert.ok(plan.includes(scenario.id), `plan omits ${scenario.id}`)
  }
  assert.ok(plan.includes(String(scenarios.length * 2)), "plan should state the live call count")
})

test("a dry run does not require a live provider to be configured", async () => {
  const { legs, calls } = stubLegs()

  await runComparison({ argv: [], env: {}, buildLegs: async () => legs, log: () => {} })

  assert.equal(calls.length, 0)
})

test("a confirmed run without a live provider fails naming ASK_AI_PROVIDER", async () => {
  const { legs, calls } = stubLegs()

  await assert.rejects(
    () => runComparison({ argv: [CONFIRM_FLAG], env: {}, buildLegs: async () => legs, log: () => {} }),
    (error) => error.message.includes("ASK_AI_PROVIDER") && !error.message.includes("at ")
  )
  assert.equal(calls.length, 0, "the provider check must run before any leg is built or asked")
})

test("a confirmed run with the mock provider is refused", async () => {
  assert.throws(
    () => assertLiveProviderConfigured({ ASK_AI_PROVIDER: "mock" }),
    /ASK_AI_PROVIDER is "mock"/
  )
})

test("a confirmed openai run missing credentials names the missing variables", () => {
  assert.throws(
    () => assertLiveProviderConfigured({ ASK_AI_PROVIDER: "openai" }),
    /OPENAI_API_KEY and OPENAI_MODEL/
  )
  assert.throws(
    () => assertLiveProviderConfigured({ ASK_AI_PROVIDER: "openai", OPENAI_API_KEY: "sk-test" }),
    /OPENAI_MODEL/
  )
  assert.doesNotThrow(() => assertLiveProviderConfigured(LIVE_ENV))
})

test("a confirmed run answers every scenario on both legs and writes one report", async () => {
  const { legs, calls } = stubLegs()
  const outputDir = makeTempDir()

  const result = await runComparison({
    argv: [CONFIRM_FLAG, "--output-dir", outputDir],
    env: LIVE_ENV,
    buildLegs: async () => legs,
    log: () => {},
    generatedAt: "2026-08-11T00:00:00.000Z"
  })

  assert.equal(result.ran, true)
  const asks = calls.filter((call) => call.request)
  assert.equal(asks.length, result.scenarioCount * 2)
  assert.equal(asks.filter((call) => call.leg === "enriched").length, result.scenarioCount)
  assert.equal(asks.filter((call) => call.leg === "disabled").length, result.scenarioCount)
  assert.ok(fs.existsSync(result.outputPath))
})

test("both legs receive byte-identical request payloads", async () => {
  const { legs, calls } = stubLegs()
  const outputDir = makeTempDir()

  await runComparison({
    argv: [CONFIRM_FLAG, "--output-dir", outputDir, "--scenario", "wrong-zone"],
    env: LIVE_ENV,
    buildLegs: async () => legs,
    log: () => {},
    generatedAt: "2026-08-11T00:00:00.000Z"
  })

  const asks = calls.filter((call) => call.request)
  assert.equal(asks.length, 2)
  assert.equal(JSON.stringify(asks[0].request), JSON.stringify(asks[1].request))
})

test("both legs are closed even when a scenario throws", async () => {
  const closed = []
  const legs = {
    enriched: {
      async ask() {
        throw new Error("provider exploded")
      },
      async close() {
        closed.push("enriched")
      }
    },
    disabled: {
      async ask() {
        return { answer: "", promptText: "" }
      },
      async close() {
        closed.push("disabled")
      }
    }
  }

  await assert.rejects(
    () =>
      runComparison({
        argv: [CONFIRM_FLAG, "--output-dir", makeTempDir()],
        env: LIVE_ENV,
        buildLegs: async () => legs,
        log: () => {}
      }),
    /provider exploded/
  )
  assert.deepEqual(closed.sort(), ["disabled", "enriched"])
})

test("the report records the combo section as present only on the enriched leg", () => {
  const report = formatComparisonReport(
    [
      {
        scenario: { id: "example", rationale: "why this scenario exists" },
        enriched: { answer: "A", promptText: "x COMMANDER SPELLBOOK COMBO CONTEXT y" },
        disabled: { answer: "B", promptText: "x y" }
      }
    ],
    { generatedAt: "2026-08-11T00:00:00.000Z" }
  )

  assert.match(report, /Combo section — enrichment on: present; enrichment off: absent/)
  assert.match(report, /--- WITH COMBO ENRICHMENT ---\nA/)
  assert.match(report, /--- WITHOUT COMBO ENRICHMENT ---\nB/)
  assert.match(report, /Informational only \(DEC-161\)/)
  assert.match(report, /why this scenario exists/)
})

test("an unknown --scenario filter fails instead of silently doing nothing", async () => {
  const { legs } = stubLegs()

  await assert.rejects(
    () => runComparison({ argv: ["--scenario", "does-not-exist"], env: {}, buildLegs: async () => legs, log: () => {} }),
    /No scenario matched/
  )
})

test("quality:check never invokes this script", () => {
  const packageJson = JSON.parse(fs.readFileSync(path.resolve("package.json"), "utf8"))
  const expand = (script, seen = new Set()) =>
    script
      .split("&&")
      .flatMap((part) => {
        const match = /npm run ([\w:-]+)/.exec(part.trim())
        if (match && !seen.has(match[1])) {
          seen.add(match[1])
          return expand(packageJson.scripts[match[1]] ?? "", seen)
        }
        return [part.trim()]
      })
      .join(" ")

  const qualityChain = expand(packageJson.scripts["quality:check"])
  assert.ok(!qualityChain.includes("compare-combo-answer-quality"))
  assert.ok(!qualityChain.includes("combo:answer-quality"))
  assert.ok(packageJson.scripts["combo:answer-quality"], "the run must still be exposed as a named script")
})
