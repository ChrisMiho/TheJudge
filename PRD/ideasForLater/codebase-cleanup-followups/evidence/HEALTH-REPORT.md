# Health report — whole-app pass, 2026-10-17

The rollup of three read-only probes. Full evidence (file:line, measurements) is in
the three `FINDINGS-*.md` files beside this one; finding ids below (D-, U-, B-, F-)
point into them.

## The answer

The app's foundations are sound. Loaded data is shared, not re-created: the card
list downloads once and every tool uses it, visited tools stay loaded so switching
tools costs nothing, the backend loads its data once per container, and every
colour personality comes from one switch (palette, favicon, tab tint, ring colours).
The bundle is well split.

The rot is in one place: **tool pages that built their own copy of a shared piece.**
The scanner panel, the card search box, the "Add card / Scan" chips, the card-list
loading code and the error-and-retry panel each exist two or three times, and the
copies have drifted into visibly different behaviour. Fixing those copies is the
cleanup that matters; the rest is tidy-up.

Of the August audit's 11 findings: 0 fixed, 4 changed (F-01 mostly fixed by
`SheetShell`; F-07, F-08, F-10 grew more copies), 7 still stand.

## Verified by the driver, not just the probes

- D-01: `lib/scan/loadScanMap.ts` and `loadHashDb.ts` cache the fetch promise and
  never clear it on failure; `cardMetadataStore.ts` does clear. Confirmed.
- U-01: `SheetShell.tsx:124-134` adds a `document` Escape listener per open sheet
  with no top-of-stack check. Confirmed.
- U-05: `PrintingPicker.tsx:124` passes `getCardIdentityRingStyle(undefined)`.
  Confirmed.
- U-07: `index.css` re-declares `.card-identity-ring::before { padding: 1px }`,
  overriding `flow.css`'s `var(--ring-w, 1px)`. Confirmed.
- B-01: `createApp.ts:48` is a bare `express.json()`; the error handler maps any
  non-`AppError` to 500 "Miho is working on it". Confirmed.

Not verified live: U-02 (In-Depth scanner ✕ over the caution triangle) is code-read;
check it in the browser at the start of that run.

## Ranked cleanup clusters — each its own `/graph-kickoff`

Ranked by what a player feels. Each needs an owner decision, so each goes through
the graph with a brief here.

| Rank | Cluster | What the player gets | Findings | Brief |
| --- | --- | --- | --- | --- |
| 1 | Scanner that recovers and runs lighter | One failed download no longer breaks scanning until reload; smaller first download; less phone work per frame; one scanner panel with the ✕ off the caution triangle | D-01, D-03, D-04, D-06, U-02 | `GRAPH-BRIEF-scanner.md` |
| 2 | Pop-ups close one at a time | Escape closes only the top pop-up; View Context behaves like every other sheet | U-01, U-06, F-01 | `GRAPH-BRIEF-popups.md` |
| 3 | One card search box | Same search on every tool (keys, Escape, thumbnails, failure message), faster typo matching | U-03, U-04/D-02, U-08, D-05, D-10, D-11 | `GRAPH-BRIEF-card-search.md` |
| 4 | Every card keeps its ring | Printing picker shows the real colour; two ringless surfaces get rings; no theme edge on a dragged card; front card ring width decided | U-05, U-07, U-13 | `GRAPH-BRIEF-card-rings.md` |
| 5 | Honest backend errors and health | Long chats get a clear message instead of "Miho is working on it"; a broken data file or search model is flagged instead of silently degrading answers | B-01, B-02, B-06, B-07, B-09, D-15 | `GRAPH-BRIEF-backend-health.md` |
| 6 | Split the big screens (later) | Nothing visible; makes the next change to In-Depth cheaper | U-09 | Not briefed yet; run after clusters 1 and 3, which remove much of the bulk |

Suggested order: 2 and 4 are small and independent, so either can go first.
1 and 3 both touch the three tool pages (`QuickLookupApp`, `ZoneCardPicker`/
`ZoneCollectionStep`, `TradeSide`), so run them one after the other, not at the
same time. 5 is backend-only and can run beside any of them.

## Behavior-preserving fixes — `codehealth` queue

These keep behaviour the same and fit one PR each. They avoid the files the
clusters above own, so they will not collide. `codehealth` picks its own target
each tick; seed it with this list.

| # | Target | Findings | Note |
| --- | --- | --- | --- |
| 1 | Guard tests for the lists both sides define (turn phases, combat steps, player labels, zone order) | F-02, F-04, F-05, F-06 | New tests only; no product code |
| 2 | One shared session cache for card detail and prices, plus a thin `apiGetJson` | D-07, D-09 | `CardPresentation.tsx` is also touched by cluster 4 — run after it |
| 3 | One Ask-AI request path in the submit hook; one 13 s retry constant | D-08 | |
| 4 | One safe-storage helper | F-08 | Five modules |
| 5 | One live-call confirmation gate for scripts | F-07 | Adding a cost cap to the combo comparison is a behaviour change — park it |
| 6 | Shared prompt-resource loader and request embedder for the backend and eval tools | B-03 | Also makes the combo comparison record the real prompt |
| 7 | Rule-search tools import the production vector-text formula and one split helper | B-04 | |
| 8 | Hoist repeated per-request work (retrieval query built 3×, two lookups rebuilt) | B-08 | |
| 9 | Script helpers: brotli JSON, repo root, `util.parseArgs`, imported prompt headings | B-10 | |
| 10 | Dead and stale: `aws-verify.mjs`, `leak-check.mjs`, stale 15 s comment | B-11 | The Bedrock template and secrets doc are an owner call |
| 11 | Theme plumbing: unused palette fields, one hex helper, BrandMark no-op | U-11 | Dropping `data-theme` needs test edits — leave it |
| 12 | `useMediaQuery` hook, shared breakpoints, reuse reduced-motion helper | U-10 | Fix the 600 vs 768 doc line |
| 13 | Dead CSS classes and `StepEyebrow` | U-12 | Check mockup-parity tests that read stylesheets first |
| 14 | Menu reads drafts on open, not every render | D-12 | |
| 15 | Two stray `};` in `index.css` keyframes (the two build warnings) | D-14 | |
| 16 | Error-and-retry panel component | F-10 | Keep each site's classes; unifying the look is a visual call |
| 17 | Card pixel dimensions defined once | F-09 | |
| 18 | Shared vitest coverage values | F-11 | Lowest priority |

Out of the queue on purpose: D-13 (test-only exports) needs test edits, which
`codehealth`'s no-test-change rule forbids. B-05 (which OpenAI key wins) is an
owner decision about dev tooling; sharing the parser can follow it.

## Already healthy — do not "fix"

The full lists are in each findings file. The headline ones: one card list per page;
#314's background download is the single loading path; tool switching reloads
nothing; one card-detail popup; `SheetShell` hosts ten pop-ups; one ring-colour
helper; one theme switch with a parity test; config read in one place; the backend
loads data once per container; evals import production code. The two search rankers
are separate on purpose (REQ-002) and the named colour exemptions in REQ-216 are
not violations.
