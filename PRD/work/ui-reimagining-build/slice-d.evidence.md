# Slice D — manual evidence

2026-10-01 D9 — prompt fixture: added `buildAskAiRequest` tests in
`apps/frontend/src/lib/contextFlow/flow.test.ts` ("sends the Stack's cards in exactly
the order given, reflecting any reorder" and "sends a non-Stack zone's cards in the
order given too, with no meaning assigned to it"). Confirmed `npx vitest run
src/lib/contextFlow/flow.test.ts` passes (37 tests): the Stack array order a player
leaves it in (after any drag or card-menu reorder) reaches `gameContext.zones.stack`
unchanged — `buildAskAiRequest` performs no sort of its own — and a non-Stack zone's
order likewise passes through unchanged, confirming A10 ("non-Stack order stays
cosmetic, no prompt-meaning change") at the request-building layer the backend prompt
assembler reads from. `npm --workspace apps/backend run test` (unchanged from slice
C's 40 files / 504 tests) confirms no backend/prompt code was touched by this slice,
so the golden prompts stay byte-identical.

2026-10-01 D10 — in the browser (dev server on ports 3104/5276, mock mode,
`/in-depth`), at 390×844: walked Game → Zones (checked Stack) → Cards, added three
cards to the Stack (Opt, Lightning Bolt, Counterspell) via search. Confirmed the
stations rail shows all four stations with 1/2/3 reachable and 4 disabled until
Context is actually reachable, and the shelf tagged them BOTTOM / 2ND / TOP in
bottom-to-top order — matching `stackPositionTag`. Dragged Opt (BOTTOM) past
Counterspell (TOP) via a real `PointerEvent` sequence (`pointerdown` → `pointermove`
× 2 → `pointerup`, dispatched on the shelf tile's DOM node — Playwright's own
`browser_drag` action resolved to the wrong sub-element for an unlabelled `generic`
node, so the pointer sequence was dispatched directly to exercise the same handler a
real touch/mouse drag reaches): the shelf re-tagged live to Lightning Bolt=BOTTOM,
Counterspell=2ND, Opt=TOP, with no reload. Opened Lightning Bolt's card menu
(`Card actions for Lightning Bolt`) and confirmed it showed Move to pills for every
other zone, a Down/Up/To top reorder group, Card details, and "Remove from the
Stack"; tapped **↑ Up** and confirmed the shelf re-tagged live again
(Counterspell=BOTTOM, Lightning Bolt=2ND, Opt=TOP) and the menu closed. Both the drag
path and the card-menu button path land on the same `toIndexAfterRemoval` contract
and both visibly renumbered the shelf's BOTTOM…TOP tags — satisfying D4 and D10.
Screenshots: `PRD/work/ui-reimagining-build/.playwright-mcp/slice-d-stack-before-drag-390x844.png`,
`slice-d-stack-after-reorder-390x844.png`.

Found and fixed during this pass: `.zone-card-tile img` had no
`pointer-events: none` / `-webkit-user-drag: none`, so a real mouse/touch drag
starting on the card image would have raced the browser's own native image-drag
ghost instead of reaching the pointer-based reorder handler (the same failure mode
the direction-1 mockup's own round-9 comment names). Fixed in `apps/frontend/src/index.css`
(`.zone-card-tile` gets `touch-action: pan-x; user-select: none`, `.zone-card-tile img`
gets `pointer-events: none` plus the drag-suppressing properties) before the browser
pass above, which is what let the dispatched pointer sequence reach the tile's
handler instead of the (now inert) image.

2026-10-01 D11 — cleanup: `browser_close` called after the last interaction
(confirmed "No open tabs"). The dev-server instance (ports 3104/5276) was started by
this session as a tracked background task (`b0ce5k9vp`) and stopped via `TaskStop`;
`lsof -i :3104 -i :5276` empty after. Reviewable capture: none named by slice D's doc
(no REQ-202 Life Tracker pair is listed for this slice — slice D touches no shared
chrome/token/stylesheet beyond the new `.stations-rail-*`/`.zone-card-tile` CSS
hooks, which are scoped to In-depth details only). Disposable captures:
`PRD/work/ui-reimagining-build/.playwright-mcp/slice-d-stack-before-drag-390x844.png`,
`slice-d-stack-after-reorder-390x844.png`. The Playwright MCP server also wrote its
own console/snapshot logs to the launch checkout's root `.playwright-mcp/` (its own
cwd) during this slice's browser pass — one misstep mid-pass also wrote a screenshot
there directly (a relative `filename` resolved against the MCP server's cwd, the
launch checkout, not this worktree); both the stray screenshot and this pass's
timestamped console/page logs were identified (today's timestamp, `18-47` through
`18-51`) and removed, restoring
`cd /Users/chrismiho/Coding/Projects/TheJudge && git status --porcelain` to exactly
` M scripts/lib/boundary-rules.mjs` (the owner's pre-existing cap-raise edit). Every
capture taken after that point used an absolute path rooted in this worktree.
