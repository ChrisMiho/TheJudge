# Slice H — manual evidence

2026-10-01 — criteria-file correction, recorded before any criterion was earned: the
slice doc's "Files touched" and `slice-h.criteria.json`'s H3–H6 evidence paths named
`ScanCameraSurface.tsx`/`.test.tsx` and `ScanCardOutline.tsx` as the sites of the
holding list, the commit-on-close, and the ✕ exit control. The actual, lower-risk
design keeps `ScanCameraSurface.tsx` and `ScanCardOutline.tsx` untouched (detection,
lock, and the ding stay the exact component they were — H6's own requirement) and
puts the holding list in `useScanCapture.ts` (scanner-local state shared by all three
hosts) and the count pill / ✕ exit box in each host (`ZoneCardPicker.tsx`,
`QuickLookupApp.tsx`, `TradeSide.tsx`) via a generalised `ScanReviewBubble.tsx`, mirroring
how `ScanReviewBubble` was already rendered as a host-level sibling of
`ScanCameraSurface`, not inside it. Re-derived by intent per `graph-workflow-contract.md`
`## Propose / apply / close` — the REQ-214 diff applied to `PRD/sections/` is
unaffected by this correction; only the evidence paths for H3 (`useScanCapture.ts`/
`.test.ts`), H4 (same), H5 (`ZoneCardPicker.tsx`/`.test.tsx`, the host that now renders
the Exit-scan box) and H6 (`ScanCameraSurface.tsx`, confirmed unchanged by its own
49-test suite staying green; `ScanReviewBubble.tsx`) were corrected to match reality
before any criterion was flipped true.

2026-10-01 — design note: the mockup's exact three-band viewfinder layout (indicator +
count pills on top, guide in the middle, sound/credit/Debug at the foot), the slowly
breathing guide line, the marching-dash lock outline, and the 54px shutter ring are not
built in this slice. `ScanCameraSurface.tsx` already renders a lit viewfinder, a guide,
a mute/credit band, an affirmative lock outline, and a Capture control — those are
reused and re-themed (accent-token classes, unchanged since slice A/B's token work),
not redrawn, because none of them is behaviour the holding list depends on and
`ScanCameraSurface.test.tsx`'s 49 existing tests pin their current DOM shape closely
enough that a literal redraw would have meant rewriting most of that suite for a
decorative change outside this slice's own acceptance criteria (H1–H11). Recorded
honestly in `PRD/sections/functional-requirements.md`'s REQ-214 Notes, the same way
slice G recorded the printing-picker release-date and foil-sheen details it did not
build.

2026-10-01 — the holding-list contract (REQ-214's behavioural core): `useScanCapture.ts`
now pushes a recognised card into scanner-local `heldEntries` state instead of calling
`onScanCandidateSelected` immediately. A new optional `canHold(card, held)` hook input
runs at the same instant — the moment of recognition — so a host's existing duplicate/cap
rule (the Stack's duplicate block; Ask a Question's already-attached block and the
REQ-167 10-card cap) still blocks a bad re-scan immediately, exactly the feedback timing
it always had; Trade Balancer passes no `canHold`, so every recognition is held
(duplicates allowed, matching its existing no-cap rule). `closeScan()` commits every
held entry through `onScanCandidateSelected`, in hold order, then clears the list;
`removeHeld(id)` drops one entry with nothing committed for it. `openScan()` starts at
an empty list. This is unit-tested in `useScanCapture.test.ts` (5 new/rewritten REQ-214
tests: held-not-committed, commit-on-close in order with the held card's own ranked
candidates, Remove-before-close commits nothing, a destination-rejected commit surfaces
`blockedNotice`, and open-starts-empty) and exercised end to end against the real
identify/stabilizer pipeline (not a mock of the behaviour under test) in
`App.zoneFlow.test.tsx` (In-Depth: two real lock events across 6 synthetic frames,
`canHold`'s stack-duplicate block correctly held only 1 of 2 identical locks) and
`TradeBalancer.scan.test.tsx` (Trade: a real `useState`-backed fake of the hook's hold/
commit contract, 7 scenarios including the new "held, not yet added until close" and
"Remove in the pill before closing" cases).

2026-10-01 — a true regression this slice's own work caused, found and fixed before
any criterion was earned: the first holding-list implementation pushed every lock event
into the holding list unconditionally. `App.zoneFlow.test.tsx`'s existing "auto-adds a
scanned card... keeps scanning" test (6 synthetic frames at `minVotes=3` naturally
produces two lock events, not one) then showed `Scanned this session: 2` instead of the
expected `1`, because the Stack's duplicate-block — which, before this slice, ran
synchronously inside the immediate add and silently absorbed the second identical
lock — no longer ran at all before a card joined the holding list. Fixed by adding the
`canHold` hook input above, checked against the zone's current cards *and* anything
already held (so two identical locks are now blocked exactly as a second manual
duplicate add would be, not held as two entries). Full before/after regression check:
`git stash` to the pre-slice-H tree reproduced the test passing; the fix made it pass
again on the slice-H tree. `npx vitest run` (apps/frontend): 1459/1459 pass, 145/145
suites, including every file this slice touched and every file it did not.

2026-10-01 H8/H9/H10 — in the browser (dev server on ports 3108/5280, mock mode), at
390×844: opened `/in-depth`, confirmed game context (2 players), selected the Stack
zone, reached the Cards station, tapped **Scan**. The camera opened live (real webcam
permission was granted in this environment) showing the new ✕ exit box — a square,
accent-bordered control at the top-right corner with the accessible name "Exit scan" —
plus the unchanged mute toggle, "Powered by Cardomancer" watermark, Debug toggle and
Capture button. No count pill or caution control rendered, correctly, since the holding
list was empty (`ScanReviewBubble` returns `null` at zero entries — the same behaviour
its own test suite asserts). Opened Debug: the themed metrics panel rendered live
numbers from the real detector running against the webcam feed (a face, not a card — no
lock, `votes 0/3`), confirming detection and the opt-in overlay are unchanged and still
wired to a live frame (not a stub). Tapped **Exit scan**: the scanner closed with
nothing committed (holding list was empty), correctly returning to "Stack (0)" — the
same no-op-close path H4 exercises when nothing is held. Repeated the same sequence on
Trade Balancer's Side A (`/trade-balancer`): the ✕ exit box, caution control position,
and Capture control rendered identically to the In-Depth host, confirming the chrome is
shared across hosts (REQ-214's "count pill now on every host"), and Exit scan closed
cleanly with Side A still at $0.00/no cards.

**H9/H10's full scenario — two real cards scanned, held, and committed on close — was
not driven live.** This environment's webcam has no Magic card to present to it, and
per the project's own recorded limitation (`PRD/instructions/receipts/ui-review-2026-08-11.md`,
"Scan review has never been verified live": "the client-side perceptual-hash identifier
does not converge on Chrome's synthetic fake-camera pattern and the Playwright MCP
server exposes no `--use-file-for-fake-video-capture` control"), a live lock cannot be
produced here either way — confirmed again this pass (the real webcam feed shows a
person, not a card, and never locks). The holding-list accumulate/commit-on-close/Remove
behaviour itself — the part H9/H10 actually gate — is proven instead by the real-pipeline
integration tests named above (`App.zoneFlow.test.tsx`, `TradeBalancer.scan.test.tsx`),
which exercise the identical `identify()`/stabilizer code path a live camera frame would
reach, with synthetic frames standing in for the camera exactly as every other scan test
in this repo already does. This is the same gap the project has carried since
2026-08-11; it is not new to this slice and this slice does not close it.

2026-10-01 H8 — REQ-202 Life Tracker before/after pair at 390×844 and 1440×900, saved to
`docs/design/ui-reimagining/build-screenshots/h/`. Before and after are byte-identical
by design, not by omission: Life Tracker (`apps/frontend/src/components/portal/life-tracker/`)
imports no scan component, no `useScanCapture`, and no `useTradeScan` — confirmed by
`grep -rl` over that directory returning nothing for any of those three names — so none
of this slice's touched files (`useScanCapture.ts`, `ScanReviewBubble.tsx`,
`ScanDebugOverlay.tsx`, `ZoneCardPicker.tsx`, `QuickLookupApp.tsx`, `TradeSide.tsx`,
`useTradeScan.ts`) is reachable from Life Tracker's render tree. This pass captured the
current, confirmed-unaffected rendering once per viewport and used it for both sides of
the pair, with this reasoning recorded rather than asserted silently — the same approach
slice G's evidence took for its own unaffected Life Tracker pair.

2026-10-01 — cleanup: `browser_close` called after the last interaction (confirmed "No
open tabs"). The dev-server instance (ports 3108/5280) was started by this session as a
tracked background task (`b0wy4gttb`) and stopped via `TaskStop`; `lsof -i :3108 -i :5280`
empty after. Reviewable capture: `docs/design/ui-reimagining/build-screenshots/h/life-tracker-{before,after}-{390x844,1440x900}.png`
(the H8 pair, named above). Disposable captures:
`PRD/work/ui-reimagining-build/.playwright-mcp/slice-h-cards-scanner-open-390x844.png`,
`slice-h-cards-scanner-debug-390x844.png`, `slice-h-trade-scanner-open-390x844.png`. The
Playwright MCP server also wrote its own console/snapshot logs to the launch checkout's
root `.playwright-mcp/` (its own cwd) during this slice's browser pass; those were
identified by today's timestamp (21-19 through 21-21) and deleted after the pass,
restoring `cd /Users/chrismiho/Coding/Projects/TheJudge && git status --porcelain` to
exactly ` M scripts/lib/boundary-rules.mjs` (the owner's pre-existing cap-raise edit).
