import assert from "node:assert/strict"
import test from "node:test"

import {
  CONFIRM_FLAG,
  MAX_FETCH_ATTEMPTS,
  RESUME_FLAG,
  RETRY_BASE_DELAY_MS,
  VARIANTS_ENDPOINT,
  VARIANTS_REQUEST_DELAY_MS,
  backoffDelayMs,
  describePlan,
  fetchJsonWithRetry,
  parseRefreshArgs,
  parseRetryAfterMs,
  resumeStateFromStagedPages
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
  assert.deepEqual(parseRefreshArgs([]), { confirmed: false, resume: false })
  assert.deepEqual(parseRefreshArgs([CONFIRM_FLAG]), { confirmed: true, resume: false })
  assert.deepEqual(parseRefreshArgs([CONFIRM_FLAG, RESUME_FLAG]), { confirmed: true, resume: true })
  // Resume alone is still gated by REQ-093 approval.
  assert.deepEqual(parseRefreshArgs([RESUME_FLAG]), { confirmed: false, resume: true })
})

test("the dry-run plan documents both the confirmation and resume flags", () => {
  const plan = describePlan()
  assert.match(plan, /no request has been made/)
  assert.ok(plan.includes(CONFIRM_FLAG))
  assert.ok(plan.includes(RESUME_FLAG))
})

test("the variants cursor is paced more slowly than Scryfall's allowance", () => {
  // Regression guard: a 100 ms pace is what the upstream ELB throttled with a 429.
  assert.ok(VARIANTS_REQUEST_DELAY_MS >= 250)
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

test("resume with no staged pages starts from the feed head", () => {
  const state = resumeStateFromStagedPages([], () => {
    throw new Error("should not read")
  })
  assert.deepEqual(state, { pageCount: 0, variantCount: 0, nextUrl: VARIANTS_ENDPOINT, complete: false })
})

test("resume continues from the last staged page's cursor", () => {
  const pages = {
    "page-0001.json": { results: [{ id: 1 }, { id: 2 }], next: "https://example.test/?offset=2" },
    "page-0002.json": { results: [{ id: 3 }], next: "https://example.test/?offset=3" }
  }

  const state = resumeStateFromStagedPages(Object.keys(pages), (name) => pages[name])

  assert.deepEqual(state, {
    pageCount: 2,
    variantCount: 3,
    nextUrl: "https://example.test/?offset=3",
    complete: false
  })
})

test("a staged run whose last page has no cursor is already complete", () => {
  const pages = {
    "page-0001.json": { results: [{ id: 1 }], next: "https://example.test/?offset=1" },
    "page-0002.json": { results: [{ id: 2 }], next: null }
  }

  const state = resumeStateFromStagedPages(Object.keys(pages), (name) => pages[name])

  assert.equal(state.complete, true)
  assert.equal(state.nextUrl, null)
  assert.equal(state.variantCount, 2)
})

test("a torn final page is dropped and the run resumes from its predecessor", () => {
  const pages = {
    "page-0001.json": { results: [{ id: 1 }], next: "https://example.test/?offset=1" },
    "page-0002.json": null // interrupted mid-write
  }

  const state = resumeStateFromStagedPages(Object.keys(pages), (name) => {
    if (pages[name] === null) throw new SyntaxError("Unexpected end of JSON input")
    return pages[name]
  })

  assert.equal(state.pageCount, 1)
  assert.equal(state.variantCount, 1)
  assert.equal(state.nextUrl, "https://example.test/?offset=1")
})

test("a corrupt page that is not the last one fails loudly instead of silently truncating", () => {
  const pages = {
    "page-0001.json": null,
    "page-0002.json": { results: [{ id: 2 }], next: null }
  }

  assert.throws(
    () =>
      resumeStateFromStagedPages(Object.keys(pages), (name) => {
        if (pages[name] === null) throw new SyntaxError("Unexpected end of JSON input")
        return pages[name]
      }),
    /page-0001\.json is unreadable/
  )
})
