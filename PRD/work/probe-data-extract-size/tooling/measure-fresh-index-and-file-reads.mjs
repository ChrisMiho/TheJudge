import fs from "node:fs"
import path from "node:path"
import zlib from "node:zlib"
import { performance } from "node:perf_hooks"
import { readVariantDetail } from "/Users/chrismiho/Coding/Projects/TheJudge/scripts/build-commander-spellbook-combos.mjs"

const scratch = process.argv[2]
const mb = (b) => (b / 1048576).toFixed(2) + "MB"
const brotli = (buf) =>
  zlib.brotliCompressSync(buf, {
    params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11, [zlib.constants.BROTLI_PARAM_SIZE_HINT]: buf.length }
  })

// ---- fresh index ----
const freshIndexRaw = zlib.gunzipSync(fs.readFileSync(path.join(scratch, "fresh-index.json.gz")))
const index = JSON.parse(freshIndexRaw.toString())
console.log(`fresh index raw ${mb(freshIndexRaw.length)}; gzip(committed style) ${mb(fs.statSync(path.join(scratch, "fresh-index.json.gz")).size)}; brotli11 ${mb(brotli(freshIndexRaw).length)}`)
const sections = {}
for (const [k, v] of Object.entries(index)) sections[k] = Buffer.byteLength(JSON.stringify(v))
console.log("fresh index raw bytes by section:", Object.fromEntries(Object.entries(sections).map(([k, v]) => [k, mb(v)])))
console.log(`byTemplateOracleId keys ${Object.keys(index.byTemplateOracleId).length}, templates ${Object.keys(index.templates).length}, byOracleId keys ${Object.keys(index.byOracleId).length}`)

const variantIds = Object.keys(index.detailOffsets)
const pos = new Map(variantIds.map((v, i) => [v, i]))
const packed = {
  manifest: index.manifest,
  variantIds,
  byOracleId: Object.fromEntries(Object.entries(index.byOracleId).map(([k, v]) => [k, v.map((id) => pos.get(id))])),
  byTemplateOracleId: Object.fromEntries(Object.entries(index.byTemplateOracleId).map(([k, v]) => [k, v.map((id) => pos.get(id))])),
  templates: Object.fromEntries(Object.entries(index.templates).map(([k, t]) => [k, { ...t, variantIds: t.variantIds.map((id) => pos.get(id)) }])),
  unresolvedTemplateIds: index.unresolvedTemplateIds,
  blockLengths: [] // filled below
}

// ---- build a real block file (K=128, brotli) and time file-backed random reads ----
const detail = fs.readFileSync(path.join(scratch, "fresh-combos.json.gz"))
const jsons = variantIds.map((id) => JSON.stringify(readVariantDetail(detail, ...index.detailOffsets[id])))
const K = 128
const blockPath = path.join(scratch, "fresh-combos.blocks.br")
const blocks = []
let cursor = 0
const blockDir = [] // [offset, length]
const t0 = performance.now()
for (let i = 0; i < jsons.length; i += K) {
  const b = brotli(Buffer.from(jsons.slice(i, i + K).join("\n")))
  blocks.push(b)
  blockDir.push([cursor, b.length])
  cursor += b.length
}
fs.writeFileSync(blockPath, Buffer.concat(blocks))
console.log(`block file (K=${K}, brotli11): ${mb(cursor)} in ${blocks.length} blocks, build ${Math.round(performance.now() - t0)}ms`)
packed.blockLengths = blockDir.map(([, l]) => l)
const packedBuf = Buffer.from(JSON.stringify(packed))
console.log(`fresh index, positional ints + block lengths: raw ${mb(packedBuf.length)}, brotli11 ${mb(brotli(packedBuf).length)}, gzip9 ${mb(zlib.gzipSync(packedBuf, { level: 9 }).length)}`)

// file-backed read: open, positional read of the block, decompress, pick the line — like catalog.ts does today per variant
function readVariantFromBlocks(variantIndex) {
  const blockNo = Math.floor(variantIndex / K)
  const [offset, length] = blockDir[blockNo]
  const fd = fs.openSync(blockPath, "r")
  try {
    const buf = Buffer.alloc(length)
    fs.readSync(fd, buf, 0, length, offset)
    const lines = zlib.brotliDecompressSync(buf).toString("utf8").split("\n")
    return JSON.parse(lines[variantIndex % K])
  } finally {
    fs.closeSync(fd)
  }
}
const samples = 200
let t1 = performance.now()
for (let i = 0; i < samples; i++) {
  const vi = Math.floor(Math.random() * variantIds.length)
  const v = readVariantFromBlocks(vi)
  if (v.variantId !== variantIds[vi]) throw new Error("mismatch")
}
console.log(`file-backed random variant read (block K=${K} brotli): ${((performance.now() - t1) / samples).toFixed(2)}ms avg over ${samples}`)
t1 = performance.now()
for (let i = 0; i < samples; i++) {
  const id = variantIds[Math.floor(Math.random() * variantIds.length)]
  const [offset, length] = index.detailOffsets[id]
  const fd = fs.openSync(path.join(scratch, "fresh-combos.json.gz"), "r")
  const buf = Buffer.alloc(length)
  fs.readSync(fd, buf, 0, length, offset)
  fs.closeSync(fd)
  JSON.parse(zlib.gunzipSync(buf).toString())
}
console.log(`file-backed random variant read (current per-record gzip): ${((performance.now() - t1) / samples).toFixed(2)}ms avg over ${samples}`)
