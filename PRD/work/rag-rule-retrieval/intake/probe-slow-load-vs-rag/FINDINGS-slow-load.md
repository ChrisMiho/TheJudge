# Findings: slow first page-load (deployed app)

## Root cause — confirmed on the live distribution

CloudFront serves `cardMetadata.json` **uncompressed** on first load.

Live headers, `https://d36yuv4ycof5gd.cloudfront.net/data/cardMetadata.json`,
request `Accept-Encoding: gzip, br`:

```
content-type: application/json
content-length: 16443342        <- 16.4 MB, raw
(no content-encoding)           <- NOT compressed
(no cache-control)
```

A JS bundle beside it on the same distribution **is** compressed:

```
/assets/vendor-BVF4lV-E.js  ->  content-encoding: gzip
```

**Why the difference:** CloudFront's automatic compression only applies to
objects **≤ 10 MB**. `cardMetadata.json` is 16.4 MB, so it falls through the
ceiling and ships raw. The JS bundles are under the cap and get gzipped.

The same ceiling hits the other large data assets when their destinations
load: `cardScanMap.json` (21 MB, scan) and `cardPrintingPrices.json`
(38 MB, Trade Balancer).

## Why "slow first, fast after"

No explicit `cache-control`, so the browser heuristically caches the big file
after the first download. Second visit reads from browser cache — fast. A
genuinely fresh visitor pays the full 16.4 MB every time.

## The payload itself

`cardMetadata.json` = 33,399 card records, each carrying `oracleText`,
`imageUrl`, `typeLine`, mana fields, colors, subtypes. Fetched whole on entry
to MTG Assistant and Quick Lookup, then `JSON.parse`d on the main thread.

Compressibility (measured locally):

| Form | Size | vs. raw |
| --- | --- | --- |
| raw | 16.4 MB | 1× |
| gzip | 4.0 MB | 4.1× smaller |
| brotli q5 | 3.2 MB | 5.1× smaller |

## Fix ladder (cheapest first)

1. **Serve the large data assets compressed.** CloudFront won't auto-compress
   over 10 MB, so pre-compress at deploy: upload a gzip/brotli variant with
   `Content-Encoding: gzip` (or brotli) set on the S3 object, in the
   `s3 sync` step. 16.4 MB → ~4 MB with zero app-code change. Biggest win per
   unit effort.
2. **Set explicit long-lived `Cache-Control` (immutable, content-hashed
   filename)** so repeat and cross-page loads are guaranteed cache hits, not
   heuristic.
3. **Parse off the main thread / stream** so the 16 MB `JSON.parse` doesn't
   freeze the first interaction after download.
4. **Only later, if still heavy:** trim or split the record (autocomplete
   needs name + id + a little; full oracle text + image URL for 33k cards is
   most of the bytes and is needed only for selected cards).

Rungs 1–2 are small, deploy-layer changes and capture most of the win.
