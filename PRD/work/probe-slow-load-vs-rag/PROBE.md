# Probe: slow first page-load vs. RAG — which first?

**Question (owner):** The deployed app is slow to load each page on a fresh
visit, then fast afterward. I also want to build RAG. Which is higher priority,
and what's the path forward?

**Mode:** Answer, then Brief. The prioritization answer stands (compression
first, separately); the owner then approved building the on-demand card-detail
redesign, so `GRAPH-BRIEF.md` captures that build. Compression stays a separate
out-of-scope fix.

## What ran

1. Measured the runtime data assets the frontend fetches
   (`apps/frontend/public/data/`): `cardMetadata.json` 16.4 MB,
   `cardPrintingPrices.json` 38 MB, `cardScanMap.json` 21 MB.
2. Traced the fetch: `MtgAssistantApp.tsx:265` and `QuickLookupApp.tsx:182`
   pull the full 16.4 MB `cardMetadata.json` on first entry to those
   destinations. Route JS chunks are small and lazy-loaded (not the cause).
3. **Live CloudFront header check** (`d36yuv4ycof5gd.cloudfront.net`) — the
   root cause, see FINDINGS.
4. Verified the RAG state against the repo and the existing
   `probe-prompt-data-optimization` findings (retrieval today is local lexical;
   embeddings are an end-state, gated behind a query-construction fix).

## Answer

Fix the slow load first. It is a confirmed, user-facing CloudFront
misconfiguration with a small fix. RAG is a large, already-parked design whose
first blocker isn't the scorer. The two don't compete for the same work.

Evidence: `FINDINGS-slow-load.md` (this folder) +
`../probe-prompt-data-optimization/FINDINGS-prompt-anatomy.md` (RAG).
