// Builds the FRESH combo artifacts (from today's raw download) into scratch, then
// measures alternative detail encodings that keep per-variant random access.
import fs from "node:fs"
import path from "node:path"
import zlib from "node:zlib"
import { performance } from "node:perf_hooks"
import { runBuild, readVariantDetail } from "/Users/chrismiho/Coding/Projects/TheJudge/scripts/build-commander-spellbook-combos.mjs"

const repo = "/Users/chrismiho/Coding/Projects/TheJudge"
const scratch = process.argv[2]
const detailPath = path.join(scratch, "fresh-combos.json.gz")
const indexPath = path.join(scratch, "fresh-index.json.gz")
const mb = (b) => (b / 1048576).toFixed(2) + "MB"

if (!fs.existsSync(detailPath) || !fs.existsSync(indexPath)) {
  console.log("building fresh combo artifacts into scratch...")
  await runBuild({ rawInputDir: path.join(repo, "apps/backend/data/commander-spellbook"), detailPath, indexPath })
}
const freshDetail = fs.readFileSync(detailPath)
const freshIndexGz = fs.readFileSync(indexPath)
const index = JSON.parse(zlib.gunzipSync(freshIndexGz).toString())
console.log(`\nFRESH baseline: detail ${mb(freshDetail.length)} (per-record gzip), index ${mb(freshIndexGz.length)}, variants ${index.manifest.variantCount}`)
console.log(`committed today: detail 78587668 (${mb(78587668)}), index 4511236 (${mb(4511236)})`)

const variantIds = Object.keys(index.detailOffsets)
const variants = variantIds.map((id) => readVariantDetail(freshDetail, ...index.detailOffsets[id]))
const jsons = variants.map((v) => JSON.stringify(v))
const rawTotal = jsons.reduce((a, s) => a + Buffer.byteLength(s), 0)
console.log(`raw JSON total: ${mb(rawTotal)}`)

// ---- byte share by field (raw) ----
const share = {}
for (const v of variants) {
  for (const [k, val] of Object.entries(v)) share[k] = (share[k] ?? 0) + Buffer.byteLength(JSON.stringify(val))
}
let templOracleIdBytes = 0, templOracleIdCount = 0, templIngredients = 0
for (const v of variants)
  for (const t of v.templateIngredients) {
    templIngredients += 1
    templOracleIdCount += t.oracleIds.length
    templOracleIdBytes += Buffer.byteLength(JSON.stringify(t.oracleIds))
  }
console.log("\n== raw byte share by field ==")
for (const [k, b] of Object.entries(share).sort((a, b) => b[1] - a[1])) console.log(`  ${k.padEnd(22)} ${mb(b).padStart(9)}  ${((b / rawTotal) * 100).toFixed(1)}%`)
console.log(`  templateIngredients[].oracleIds: ${mb(templOracleIdBytes)} across ${templIngredients} template ingredients (${templOracleIdCount} ids) — duplicated from index.templates`)

// ---- slim projection: drop what the index / id already carries ----
function slim(v) {
  const { sourceUrl, ...rest } = v
  return {
    ...rest,
    templateIngredients: v.templateIngredients.map(({ oracleIds, scryfallApi, unresolved, templateName, ...t }) => t)
  }
}
const slimJsons = variants.map((v) => JSON.stringify(slim(v)))
const slimRaw = slimJsons.reduce((a, s) => a + Buffer.byteLength(s), 0)
console.log(`\nslim raw JSON total: ${mb(slimRaw)} (drops sourceUrl + template oracleIds/name/scryfallApi/unresolved — all rejoinable from index.templates)`)

// ---- codecs ----
const codecs = {
  gzip9: (buf) => zlib.gzipSync(buf, { level: 9 }),
  brotli11: (buf) =>
    zlib.brotliCompressSync(buf, {
      params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11, [zlib.constants.BROTLI_PARAM_SIZE_HINT]: buf.length }
    }),
  zstd19: (buf) => zlib.zstdCompressSync(buf, { params: { [zlib.constants.ZSTD_c_compressionLevel]: 19 } })
}
const decoders = { gzip9: zlib.gunzipSync, brotli11: zlib.brotliDecompressSync, zstd19: zlib.zstdDecompressSync }

function perRecord(list, codec) {
  let total = 0
  for (const s of list) total += codecs[codec](Buffer.from(s)).length
  return total
}
function blocks(list, k, codec) {
  const out = []
  for (let i = 0; i < list.length; i += k) out.push(codecs[codec](Buffer.from(list.slice(i, i + k).join("\n"))))
  return out
}
function randomAccessMs(blockBufs, codec, samples = 40) {
  const t0 = performance.now()
  for (let i = 0; i < samples; i++) {
    const b = blockBufs[Math.floor(Math.random() * blockBufs.length)]
    const text = decoders[codec](b).toString("utf8")
    JSON.parse(text.split("\n")[0])
  }
  return ((performance.now() - t0) / samples).toFixed(2)
}

console.log("\n== per-record (current layout) ==")
for (const codec of ["gzip9", "brotli11", "zstd19"]) {
  const t0 = performance.now()
  const full = perRecord(jsons, codec)
  const t1 = performance.now()
  const sl = perRecord(slimJsons, codec)
  console.log(`  ${codec.padEnd(9)} full ${mb(full).padStart(9)}  slim ${mb(sl).padStart(9)}   (${Math.round(t1 - t0)}ms)`)
}

console.log("\n== block layout (K variants per compressed block, random access = read block + decompress) ==")
for (const k of [32, 128, 512]) {
  for (const codec of ["gzip9", "brotli11", "zstd19"]) {
    const t0 = performance.now()
    const fullBlocks = blocks(jsons, k, codec)
    const t1 = performance.now()
    const full = fullBlocks.reduce((a, b) => a + b.length, 0)
    const slimBlocks = blocks(slimJsons, k, codec)
    const sl = slimBlocks.reduce((a, b) => a + b.length, 0)
    const ra = randomAccessMs(fullBlocks, codec)
    console.log(`  K=${String(k).padEnd(4)} ${codec.padEnd(9)} full ${mb(full).padStart(9)}  slim ${mb(sl).padStart(9)}   compress ${Math.round(t1 - t0)}ms, random access ${ra}ms/variant`)
  }
}

console.log("\n== whole-corpus single stream (lower bound, no random access) ==")
for (const codec of ["gzip9", "zstd19"]) {
  const buf = Buffer.from(jsons.join("\n"))
  const t0 = performance.now()
  const out = codecs[codec](buf)
  console.log(`  ${codec.padEnd(9)} ${mb(out.length)} (${Math.round(performance.now() - t0)}ms)`)
}

console.log("\n== zstd dictionary support in this Node? ==")
try {
  const dict = Buffer.from(jsons.slice(0, 200).join("\n"))
  const out = zlib.zstdCompressSync(Buffer.from(jsons[5000]), { dictionary: dict })
  console.log(`  zstdCompressSync accepted a dictionary option; sample ${Buffer.byteLength(jsons[5000])} -> ${out.length} bytes`)
  const back = zlib.zstdDecompressSync(out, { dictionary: dict })
  console.log(`  roundtrip ok: ${back.toString() === jsons[5000]}`)
} catch (e) {
  console.log(`  not supported: ${e.message}`)
}
