/**
 * Stream-parse the first top-level JSON array of objects found in an
 * async-iterable of text chunks, yielding one parsed object at a time.
 *
 * Exists because the Commander Spellbook bulk export's real size (measured
 * 2026-08-22: ~634MB decompressed JSON, well past V8's ~536MB max string
 * length) makes `JSON.parse(wholeFileAsOneString)` fail outright — this
 * package's second scale surprise the DEC-162 amendment's smaller sample
 * measurements did not catch, since only a real end-to-end live refresh
 * exercises the actual file size. Never materializes more than one array
 * element's text at a time.
 *
 * Adapted from the identical technique already proven in
 * `build-card-metadata.mjs` for Scryfall's default-cards bulk file, which
 * parses a bare `[...]` array. This generalizes it to also work when the
 * array is nested one level inside an object member — `{"variants":[...]}`
 * — by scanning for the first `[` rather than assuming the document root
 * *is* the array.
 */
export async function* streamJsonArrayObjects(chunks) {
  let startedArray = false
  let collectingObject = false
  let inString = false
  let escapeNext = false
  let depth = 0
  let objectBuffer = ""

  for await (const chunk of chunks) {
    for (let index = 0; index < chunk.length; index += 1) {
      const char = chunk[index]

      if (!startedArray) {
        if (char === "[") startedArray = true
        continue
      }

      if (!collectingObject) {
        if (char === "{") {
          collectingObject = true
          inString = false
          escapeNext = false
          depth = 1
          objectBuffer = "{"
        } else if (char === "]" && depth === 0) {
          return
        }
        continue
      }

      objectBuffer += char

      if (escapeNext) {
        escapeNext = false
        continue
      }

      if (char === "\\") {
        if (inString) escapeNext = true
        continue
      }

      if (char === "\"") {
        inString = !inString
        continue
      }

      if (!inString) {
        if (char === "{") {
          depth += 1
        } else if (char === "}") {
          depth -= 1

          if (depth === 0) {
            collectingObject = false
            yield JSON.parse(objectBuffer)
            objectBuffer = ""
          }
        }
      }
    }
  }

  // The only clean exit is the `]` branch above, which `return`s immediately.
  // Reaching here means the input ended without ever closing the array —
  // truncated mid-object, truncated between objects, or the array was never
  // found at all. A truncated corpus must fail loudly, not be silently
  // reinterpreted as "zero variants" (or however many completed before the
  // cut), which a downstream build would otherwise ship as if it were real.
  if (startedArray) {
    throw new Error("Unexpected end of input while streaming a JSON array: the array was never closed.")
  }
}
