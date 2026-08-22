import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import zlib from "node:zlib"
import test from "node:test"

import {
  BULK_EXPORT_URL,
  CONFIRM_FLAG,
  MAX_FETCH_ATTEMPTS,
  RETRY_BASE_DELAY_MS,
  backoffDelayMs,
  collectTemplates,
  describePlan,
  downloadTemplateExpansions,
  extractEnvelopeMetadata,
  fetchBufferWithRetry,
  fetchJsonWithRetry,
  parseRefreshArgs,
  parseRetryAfterMs
} from "./refresh-commander-spellbook-data.mjs"

/** Minimal stand-in for the parts of `Response` the retry loop touches. */
function response(status, { body = {}, headers = {} } = {}) {
  const normalized = new Map(Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]))
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: String(status),
    headers: { get: (name) => normalized.get(name.toLowerCase()) ?? null },
    json: async () => body
  }
}

function recordingSleep() {
  const waits = []
  return { waits, sleep: async (ms) => void waits.push(ms) }
}

test("the refresh makes no request without the confirmation flag", () => {
  assert.deepEqual(parseRefreshArgs([]), { confirmed: false })
  assert.deepEqual(parseRefreshArgs([CONFIRM_FLAG]), { confirmed: true })
})

test("the dry-run plan documents the bulk export URL and the confirmation flag", () => {
  const plan = describePlan()
  assert.match(plan, /no request has been made/)
  assert.ok(plan.includes(BULK_EXPORT_URL))
  assert.ok(plan.includes(CONFIRM_FLAG))
})

test("a 429 is retried and the eventual payload is returned", async () => {
  const { waits, sleep } = recordingSleep()
  const statuses = [429, 429, 200]
  let calls = 0

  const body = await fetchJsonWithRetry("https://example.test/variants/", {
    fetchImpl: async () => response(statuses[calls++], { body: { results: [{ id: 1 }] } }),
    sleepImpl: sleep,
    random: () => 0.5
  })

  assert.equal(calls, 3)
  assert.deepEqual(body, { results: [{ id: 1 }] })
  assert.equal(waits.length, 2)
  assert.ok(waits[1] > waits[0], "backoff should grow between attempts")
})

test("a bodiless 429 with no Retry-After falls back to exponential backoff", async () => {
  const { waits, sleep } = recordingSleep()
  let calls = 0

  await fetchJsonWithRetry("https://example.test/variants/", {
    // Exactly what the upstream ELB returns: 429, no Retry-After, zero-length body.
    fetchImpl: async () => response(calls++ === 0 ? 429 : 200),
    sleepImpl: sleep,
    baseDelayMs: 1000,
    random: () => 1
  })

  assert.deepEqual(waits, [1000])
})

test("a Retry-After delay in seconds wins over computed backoff", async () => {
  const { waits, sleep } = recordingSleep()
  let calls = 0

  await fetchJsonWithRetry("https://example.test/variants/", {
    fetchImpl: async () => (calls++ === 0 ? response(429, { headers: { "Retry-After": "7" } }) : response(200)),
    sleepImpl: sleep,
    random: () => 0.5
  })

  assert.deepEqual(waits, [7000])
})

test("retries stop at the attempt ceiling and surface the upstream status", async () => {
  const { waits, sleep } = recordingSleep()
  let calls = 0

  await assert.rejects(
    fetchJsonWithRetry("https://example.test/variants/", {
      fetchImpl: async () => {
        calls += 1
        return response(429)
      },
      sleepImpl: sleep,
      random: () => 0.5
    }),
    /429/
  )

  assert.equal(calls, MAX_FETCH_ATTEMPTS)
  assert.equal(waits.length, MAX_FETCH_ATTEMPTS - 1)
})

test("a non-retryable status fails on the first response", async () => {
  const { waits, sleep } = recordingSleep()
  let calls = 0

  await assert.rejects(
    fetchJsonWithRetry("https://example.test/variants/", {
      fetchImpl: async () => {
        calls += 1
        return response(404)
      },
      sleepImpl: sleep
    }),
    /404/
  )

  assert.equal(calls, 1, "a 404 should not be retried")
  assert.deepEqual(waits, [])
})

test("Retry-After parses seconds and HTTP dates, and rejects junk", () => {
  const now = Date.parse("2026-08-12T00:00:00Z")
  assert.equal(parseRetryAfterMs("3"), 3000)
  assert.equal(parseRetryAfterMs("0"), 0)
  assert.equal(parseRetryAfterMs("Wed, 12 Aug 2026 00:00:30 GMT", now), 30000)
  // A date already in the past clamps to zero rather than scheduling a negative wait.
  assert.equal(parseRetryAfterMs("Wed, 12 Aug 2026 00:00:00 GMT", now + 5000), 0)
  assert.equal(parseRetryAfterMs("-1"), null)
  assert.equal(parseRetryAfterMs("soon"), null)
  assert.equal(parseRetryAfterMs(""), null)
  assert.equal(parseRetryAfterMs(null), null)
})

test("backoff grows exponentially and stays within its jitter band", () => {
  assert.equal(backoffDelayMs(1, 1000, () => 1), 1000)
  assert.equal(backoffDelayMs(1, 1000, () => 0), 500)
  assert.equal(backoffDelayMs(3, 1000, () => 1), 4000)
  assert.equal(backoffDelayMs(3, 1000, () => 0), 2000)
  assert.equal(backoffDelayMs(1, RETRY_BASE_DELAY_MS, () => 1), RETRY_BASE_DELAY_MS)
})

test("a 429 is retried and the eventual gzip payload is returned as a buffer", async () => {
  const { waits, sleep } = recordingSleep()
  const original = Buffer.from(JSON.stringify({ timestamp: "t", version: "v", variants: [] }))
  const gzipped = zlib.gzipSync(original)
  const statuses = [429, 200]
  let calls = 0

  const buffer = await fetchBufferWithRetry(BULK_EXPORT_URL, {
    fetchImpl: async () =>
      statuses[calls++] === 429
        ? response(429)
        : { ok: true, status: 200, statusText: "200", headers: { get: () => null }, arrayBuffer: async () => gzipped },
    sleepImpl: sleep,
    random: () => 0.5
  })

  assert.equal(calls, 2)
  assert.ok(zlib.gunzipSync(buffer).equals(original))
  assert.equal(waits.length, 1)
})

test("collectTemplates reads a flat variant array, not a paginated results wrapper", async () => {
  const variants = [
    { id: "1", requires: [{ template: { id: 5, name: "Persist Creature", scryfallApi: "https://api.scryfall.com/x" } }] },
    { id: "2", requires: [{ template: { id: 5, name: "Persist Creature", scryfallApi: "https://api.scryfall.com/x" } }] },
    { id: "3", requires: [{ template: { id: 9, name: "No query", scryfallApi: null } }] },
    { id: "4", requires: [] }
  ]

  const templates = await collectTemplates(variants)

  assert.deepEqual(
    templates.map((template) => template.templateId),
    [5, 9]
  )
  assert.equal(templates[0].scryfallApi, "https://api.scryfall.com/x")
  assert.equal(templates[1].scryfallApi, null)
})

test("collectTemplates never reads the Python serializer's snake_case scryfall_api", async () => {
  const templates = await collectTemplates([
    { id: "1", requires: [{ template: { id: 1, name: "X", scryfall_api: "https://api.scryfall.com/wrong-case" } }] }
  ])
  assert.equal(templates[0].scryfallApi, null)
})

test("collectTemplates consumes an async iterable identically to a plain array", async () => {
  async function* stream() {
    yield { id: "1", requires: [{ template: { id: 5, name: "T", scryfallApi: "https://api.scryfall.com/x" } }] }
  }
  const templates = await collectTemplates(stream())
  assert.deepEqual(
    templates.map((template) => template.templateId),
    [5]
  )
})

test("extractEnvelopeMetadata reads timestamp and version from the document's head, without a full parse", () => {
  // A trailing "variants" array far too large to ever materialize as one JS
  // string in a real run — this proves the function only looks at the head.
  const hugeSuffix = `,"variants":[${'{"id":"x"},'.repeat(1000)}{"id":"y"}]}`
  const head = '{"timestamp":"2026-08-22T19:12:35.233842+00:00","version":"6.2.5"'
  const bytes = Buffer.from(head + hugeSuffix, "utf8")

  assert.deepEqual(extractEnvelopeMetadata(bytes), {
    timestamp: "2026-08-22T19:12:35.233842+00:00",
    version: "6.2.5"
  })
})

test("extractEnvelopeMetadata returns nulls when the fields are missing or malformed", () => {
  assert.deepEqual(extractEnvelopeMetadata(Buffer.from("{}", "utf8")), { timestamp: null, version: null })
})

test("a template Scryfall rejects outright (a 404, a query it no longer accepts) is left unresolved, not fatal to the whole refresh", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "combo-refresh-"))
  const templates = [
    { templateId: 1, name: "Bad query", scryfallApi: "https://api.scryfall.com/bad" },
    { templateId: 2, name: "Good query", scryfallApi: "https://api.scryfall.com/good" }
  ]

  const { resolved, unresolved } = await downloadTemplateExpansions(templates, dir, {
    expandTemplateImpl: async (template) => {
      if (template.templateId === 1) throw new Error("Request failed for https://api.scryfall.com/bad: 404 Not Found")
      return ["oracle-1", "oracle-2"]
    }
  })

  assert.equal(unresolved, 1)
  assert.equal(resolved, 1)
  assert.ok(fs.existsSync(path.join(dir, "000002.json")), "the good template's expansion is still written")
  assert.ok(!fs.existsSync(path.join(dir, "000001.json")), "the bad template writes nothing")
})
