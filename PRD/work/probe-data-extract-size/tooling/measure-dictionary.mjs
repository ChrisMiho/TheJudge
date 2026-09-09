// Per-record compression with a SHARED DICTIONARY (keeps today's one-record reads)
// versus the chosen 128-block brotli layout. Reads the fresh artifacts a prior probe built.
import fs from "node:fs"
import path from "node:path"
import zlib from "node:zlib"
import { performance } from "node:perf_hooks"
import { readVariantDetail } from "/Users/chrismiho/Coding/Projects/TheJudge/scripts/build-commander-spellbook-combos.mjs"

const scratch = "/private/tmp/claude-501/-Users-chrismiho-Coding-Projects-TheJudge/aa7d5658-000a-40b8-8449-be2dc906b33a/scratchpad"
const mb = (b) => (b / 1048576).toFixed(2) + "MB"
const detail = fs.readFileSync(path.join(scratch, "fresh-combos.json.gz"))
const index = JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(scratch, "fresh-index.json.gz"))).toString())
const ids = Object.keys(index.detailOffsets)
const bufs = ids.map((id) => Buffer.from(JSON.stringify(readVariantDetail(detail, ...index.detailOffsets[id]))))
console.log(`node ${process.version}; variants ${bufs.length}; raw ${mb(bufs.reduce((a, b) => a + b.length, 0))}`)

// Dictionary = evenly spaced sample records concatenated (no trainer in Node). Sizes: 32 KB, 110 KB, 512 KB.
function sampleDict(targetBytes) {
  const out = []; let total = 0; const step = Math.max(1, Math.floor(bufs.length / Math.ceil(targetBytes / 1700)))
  for (let i = 0; i < bufs.length && total < targetBytes; i += step) { out.push(bufs[i]); total += bufs[i].length + 1 }
  return Buffer.concat(out)
}
const zstd = (lvl) => ({ name: `zstd${lvl}`, c: (b, d) => zlib.zstdCompressSync(b, { dictionary: d, params: { [zlib.constants.ZSTD_c_compressionLevel]: lvl } }), d: (b, d) => zlib.zstdDecompressSync(b, { dictionary: d }) })
const brotli = (q) => ({ name: `brotli${q}`, c: (b, d) => zlib.brotliCompressSync(b, { dictionary: d, params: { [zlib.constants.BROTLI_PARAM_QUALITY]: q } }), d: (b, d) => zlib.brotliDecompressSync(b, { dictionary: d }) })

function measure(codec, dict, subsetEvery = 1) {
  const t0 = performance.now(); let total = 0; let n = 0
  const list = subsetEvery === 1 ? bufs : bufs.filter((_, i) => i % subsetEvery === 0)
  const outs = list.map((b) => { const o = codec.c(b, dict); total += o.length; n++; return o })
  const ct = performance.now() - t0
  // random access: decode one record
  const t1 = performance.now(); for (let i = 0; i < 200; i++) codec.d(outs[(i * 7919) % outs.length], dict); const ra = (performance.now() - t1) / 200
  const ok = codec.d(outs[0], dict).equals(list[0])
  const scaled = total * (bufs.length / n)
  console.log(`  ${codec.name.padEnd(9)} dict ${mb(dict.length).padStart(8)}  total ${mb(scaled).padStart(9)}${subsetEvery > 1 ? ` (scaled from 1/${subsetEvery})` : ""}  compress ${(ct * (bufs.length / n) / 1000).toFixed(0)}s${subsetEvery > 1 ? " est" : ""}  read ${ra.toFixed(3)}ms  roundtrip ${ok}`)
}
console.log("\n== per-record + shared dictionary (random access = one record, as today) ==")
for (const kb of [32, 110, 512]) {
  const dict = sampleDict(kb * 1024)
  measure(zstd(19), dict)
  measure(brotli(11), dict, 20)
}
console.log("\n== reference: 128-block brotli11 (chosen) = 12.99MB, 0.34ms read (measured earlier); per-record gzip today = 90.96MB ==")
