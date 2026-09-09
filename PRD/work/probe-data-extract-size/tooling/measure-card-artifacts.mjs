// Measures the per-card artifacts (rulings, detail, prices, game rules, combo index)
// under gzip / brotli / zstd, and tests the "one merged per-card file" hypothesis.
import fs from "node:fs"
import path from "node:path"
import zlib from "node:zlib"
import { performance } from "node:perf_hooks"

const repo = "/Users/chrismiho/Coding/Projects/TheJudge"
const data = path.join(repo, "apps/backend/data")
const mb = (b) => (b / 1048576).toFixed(2) + "MB"

const codecs = {
  gzip9: (buf) => zlib.gzipSync(buf, { level: 9 }),
  brotli11: (buf) =>
    zlib.brotliCompressSync(buf, {
      params: {
        [zlib.constants.BROTLI_PARAM_QUALITY]: 11,
        [zlib.constants.BROTLI_PARAM_LGWIN]: 24,
        [zlib.constants.BROTLI_PARAM_SIZE_HINT]: buf.length
      }
    }),
  zstd19: (buf) => zlib.zstdCompressSync(buf, { params: { [zlib.constants.ZSTD_c_compressionLevel]: 19 } })
}
const decoders = { gzip9: zlib.gunzipSync, brotli11: zlib.brotliDecompressSync, zstd19: zlib.zstdDecompressSync }

function measure(label, buf) {
  const row = { label, raw: buf.length }
  for (const [name, fn] of Object.entries(codecs)) {
    const t0 = performance.now()
    const out = fn(buf)
    const t1 = performance.now()
    const d0 = performance.now()
    decoders[name](out)
    const d1 = performance.now()
    row[name] = out.length
    row[name + "_ms"] = Math.round(t1 - t0)
    row[name + "_dec_ms"] = Math.round(d1 - d0)
  }
  console.log(
    `${label.padEnd(34)} raw ${mb(row.raw).padStart(9)} | gzip9 ${mb(row.gzip9).padStart(8)} (${row.gzip9_ms}ms/dec ${row.gzip9_dec_ms}ms) | brotli11 ${mb(row.brotli11).padStart(8)} (${row.brotli11_ms}ms/dec ${row.brotli11_dec_ms}ms) | zstd19 ${mb(row.zstd19).padStart(8)} (${row.zstd19_ms}ms/dec ${row.zstd19_dec_ms}ms)`
  )
  return row
}

const rulingsRaw = fs.readFileSync(path.join(data, "cardRulingsByOracleId.json"))
const detailRaw = fs.readFileSync(path.join(data, "cardDetailByOracleId.json"))
const pricesRaw = zlib.gunzipSync(fs.readFileSync(path.join(data, "cardPrintingPricesByOracleId.json.gz")))
const indexRaw = zlib.gunzipSync(fs.readFileSync(path.join(data, "commanderSpellbookComboIndex.json.gz")))

console.log("== per-file codec comparison ==")
measure("cardRulingsByOracleId.json", rulingsRaw)
measure("cardDetailByOracleId.json", detailRaw)
measure("cardPrintingPrices (raw json)", pricesRaw)
measure("comboIndex (raw, prettier)", indexRaw)
measure("comboIndex (minified)", Buffer.from(JSON.stringify(JSON.parse(indexRaw.toString()))))
for (const f of ["gameRulesRuleIndex.json", "gameRulesRuleEmbeddings.json", "gameRulesTokenStats.json", "gameRulesByTopic.json"]) {
  measure(f, fs.readFileSync(path.join(data, f)))
}

console.log("\n== merged per-card file hypothesis ==")
const rulings = JSON.parse(rulingsRaw.toString())
const detail = JSON.parse(detailRaw.toString())
const prices = JSON.parse(pricesRaw.toString())
const ids = new Set([...Object.keys(rulings), ...Object.keys(detail), ...Object.keys(prices.byOracleId)])
console.log(`oracle ids: rulings ${Object.keys(rulings).length}, detail ${Object.keys(detail).length}, prices ${Object.keys(prices.byOracleId).length}, union ${ids.size}`)
const merged = { snapshotDate: prices.snapshotDate, byOracleId: {} }
for (const id of [...ids].sort()) {
  merged.byOracleId[id] = {
    ...(detail[id] ?? {}),
    rulings: rulings[id] ?? [],
    printings: prices.byOracleId[id]?.printings ?? []
  }
}
const mergedBuf = Buffer.from(JSON.stringify(merged))
const separate = measure("separate: rulings+detail+prices", Buffer.concat([rulingsRaw, detailRaw, pricesRaw]))
const m = measure("merged one-file-per-card", mergedBuf)
console.log(`merged vs separate delta: gzip9 ${mb(m.gzip9 - separate.gzip9)}, brotli11 ${mb(m.brotli11 - separate.brotli11)}, zstd19 ${mb(m.zstd19 - separate.zstd19)}`)

console.log("\n== prices structural variants ==")
let printings = 0
for (const e of Object.values(prices.byOracleId)) printings += e.printings.length
console.log(`printings: ${printings}`)
// (a) set names moved to a lookup table
const setNames = {}
const pricesNoSetName = { snapshotDate: prices.snapshotDate, sets: setNames, byOracleId: {} }
for (const [id, e] of Object.entries(prices.byOracleId)) {
  pricesNoSetName.byOracleId[id] = e.printings.map((p) => {
    setNames[p.set] = p.setName
    return [p.id, p.set, p.collectorNumber, p.usd, p.usdFoil]
  })
}
measure("prices: set table + tuple rows", Buffer.from(JSON.stringify(pricesNoSetName)))

console.log("\n== combo index structural variant ==")
const index = JSON.parse(indexRaw.toString())
const variantIds = Object.keys(index.detailOffsets)
const pos = new Map(variantIds.map((v, i) => [v, i]))
const offsets = variantIds.map((v) => index.detailOffsets[v])
const lengths = offsets.map(([, l]) => l)
const packed = {
  manifest: index.manifest,
  variantIds,
  detailLengths: lengths, // offsets are the prefix sum
  byOracleId: Object.fromEntries(Object.entries(index.byOracleId).map(([k, v]) => [k, v.map((id) => pos.get(id))])),
  byTemplateOracleId: Object.fromEntries(
    Object.entries(index.byTemplateOracleId).map(([k, v]) => [k, v.map((id) => pos.get(id))])
  ),
  templates: Object.fromEntries(
    Object.entries(index.templates).map(([k, t]) => [k, { ...t, variantIds: t.variantIds.map((id) => pos.get(id)) }])
  ),
  unresolvedTemplateIds: index.unresolvedTemplateIds
}
measure("comboIndex: positional ints", Buffer.from(JSON.stringify(packed)))
let templOracleBytes = 0
for (const t of Object.values(index.templates)) templOracleBytes += JSON.stringify(t.oracleIds).length
console.log(`index.templates oracleIds bytes (raw): ${mb(templOracleBytes)}; byTemplateOracleId keys: ${Object.keys(index.byTemplateOracleId).length}`)
