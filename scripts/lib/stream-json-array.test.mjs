import assert from "node:assert/strict"
import test from "node:test"

import { streamJsonArrayObjects } from "./stream-json-array.mjs"

async function collect(text, chunkSize = 7) {
  async function* chunks() {
    for (let index = 0; index < text.length; index += chunkSize) {
      yield text.slice(index, index + chunkSize)
    }
  }
  const results = []
  for await (const object of streamJsonArrayObjects(chunks())) results.push(object)
  return results
}

test("parses a bare top-level array of objects", async () => {
  const objects = await collect(JSON.stringify([{ id: 1 }, { id: 2 }, { id: 3 }]))
  assert.deepEqual(
    objects.map((o) => o.id),
    [1, 2, 3]
  )
})

test("parses an array nested inside an object member, ignoring surrounding scalar fields", async () => {
  const text = JSON.stringify({ timestamp: "t", version: "v", variants: [{ id: "a" }, { id: "b" }], aliases: [] })
  const objects = await collect(text)
  assert.deepEqual(
    objects.map((o) => o.id),
    ["a", "b"]
  )
})

test("does not split on a brace or bracket inside a string value", async () => {
  const text = JSON.stringify([{ id: 1, notes: "contains { a brace }, a [bracket], and \\\"quotes\\\"" }, { id: 2 }])
  const objects = await collect(text, 3)
  assert.equal(objects.length, 2)
  assert.ok(objects[0].notes.includes("{ a brace }"))
})

test("handles chunk boundaries falling mid-token, at every possible split point", async () => {
  const text = JSON.stringify([{ id: 1, name: "Thassa's Oracle" }, { id: 2, name: "Demonic Consultation" }])
  for (let chunkSize = 1; chunkSize <= text.length; chunkSize += 1) {
    const objects = await collect(text, chunkSize)
    assert.deepEqual(
      objects.map((o) => o.id),
      [1, 2],
      `failed at chunkSize=${chunkSize}`
    )
  }
})

test("yields nothing for an empty array", async () => {
  const objects = await collect(JSON.stringify({ variants: [] }))
  assert.deepEqual(objects, [])
})

test("throws when the input ends before the array closes, rather than silently yielding fewer objects", async () => {
  const full = JSON.stringify({ timestamp: "t", variants: [{ id: 1 }, { id: 2 }] })
  // Cut strictly after the array opens but before it closes, so the array is
  // definitely started and definitely unclosed — not "no array found at all".
  const arrayStart = full.indexOf("[")
  const truncated = full.slice(0, arrayStart + Math.floor((full.length - arrayStart) / 2))
  await assert.rejects(collect(truncated), /never closed/)
})

test("throws even when truncation happens between two complete objects, not mid-object", async () => {
  const full = JSON.stringify({ variants: [{ id: 1 }, { id: 2 }] })
  const cutAfterFirstObject = full.indexOf("},") + 1
  await assert.rejects(collect(full.slice(0, cutAfterFirstObject)), /never closed/)
})

test("stops after the target array closes, ignoring any array that follows it", async () => {
  const text = JSON.stringify({ variants: [{ id: 1 }], aliases: [{ id: "should-not-appear" }] })
  const objects = await collect(text)
  assert.deepEqual(
    objects.map((o) => o.id),
    [1]
  )
})
