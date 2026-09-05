# Receipt — image-first-cards — 2026-09-05

**What happened:** Card tiles across the suite (Quick Question, In-Depth
Enrichment, View Context, zone strips, Scan review, Quick Lookup) still look
and behave exactly as before — the change is when a card's descriptive text
arrives. The app used to download the full descriptive text (oracle text, type
line, mana cost/value, colors, sub/supertypes) for all 33,399 cards before any
screen was usable. Now the up-front download only carries what a tile draws —
name, oracle id, image, colors — and a card's full detail loads on demand,
per card, from a new backend endpoint the first time its detail popup opens,
then stays cached for the session. Ask-ai now resolves a card's oracle text
itself, server-side, from the same backend data, instead of relying on the
client to send it, with the assembled prompt proven byte-identical to before.
Shipped to `main` in PR #185 (merge commit `d9f3a7a`, 2026-09-05).

**What it means for you:** First load of MTG Assistant or Quick Lookup is
lighter — the up-front card-metadata file is about 48% smaller, gzipped, than
before. Every card popup still shows the same information the instant you open
it; if you're offline or an image fails to load, the corner popup and the
image-fail fallback still work exactly as they did — name only, no forced
network call. Nothing else about the cards changed.

## Summary

- Date: 2026-09-05
- Slug: image-first-cards
- Status: **shipped**
- Cleanup mode: graph-controlled invocation (node 9, `close`), `graph-implement`
  run `graph-20260903-093903`. STATUS.ship-ready confirmed before cleanup.
- Package classification: autonomous — `README.md` carries `## Autonomous
  metadata` (`Autonomous base: origin/thejudge-auto/image-first-cards`), so the
  autonomous merge-proof gate below applies.

## What shipped

- **Slice A** — new read-only `GET /api/cards/:oracleId` endpoint
  (`apps/backend/src/routes/cardDetail.ts`) backed by a committed card-detail
  artifact (`scripts/build-card-detail-by-oracle-id.mjs` →
  `apps/backend/data/cardDetailByOracleId.json`); on-demand popup fetch wired
  into the shared `CardPresentation.tsx` across all six card surfaces; DEC-078
  offline resilience preserved (image-fail fallback stays name-only, no forced
  fetch; popup fetch degrades gracefully offline without blocking other
  controls).
- **Slice B** — `POST /api/ask-ai` resolves a card's oracle text server-side
  from the same backend artifact (`apps/backend/src/prompt/context.ts`)
  instead of reading it from the client-sent payload; the assembled prompt is
  proven byte-identical to the prior behavior via `npm run test:eval`; the
  client stops sending descriptive card fields.
- **Slice C** — the up-front `cardMetadata.json` slims to tile-only fields
  (`cardId`, `name`, `imageUrl`, `colors`); `scripts/build-card-metadata.mjs`
  asserts the gzipped reduction gate (NFR-019) at build time.
- All three slices' criteria files (`slice-a/b/c.criteria.json`) show every
  criterion `true`; full suite green at merge (frontend 1315 / backend 398 /
  scripts 436), live Playwright-verified per slice.

## NFR-019 recalibration (80% → ≥40% gzipped)

The refinement draft pinned NFR-019 to a firm ≥80%-gzipped-reduction gate,
reasoning from raw-byte savings but stamping it onto a gzipped assertion — not
a number the owner had independently chosen. Slice C's build measured the real
corpus at 48.1% gzipped reduction, making 80% structurally unreachable (removed
oracle text compresses well; the retained `cardId`/`imageUrl` fields barely do).
The owner recalibrated the threshold to **≥40% gzipped reduction** on
2026-09-04: same relative shape (so the gate stays correct as the Scryfall
corpus grows, unlike a fixed byte ceiling), with headroom below the measured
~48% for future data-refresh drift. `PRD/sections/non-functional-requirements.md`
NFR-019 states ≥40% with the provenance note; no 80% figure remains anywhere in
`PRD/sections/` or the build script (`MIN_GZIPPED_REDUCTION = 0.4` in
`scripts/build-card-metadata.mjs`).

## DEC-078 offline reconciliation

DEC-078's offline scanning guarantee is **reconciled, not reversed**. The
on-demand popup fetch is new network-dependent behavior for the descriptive
block, but the image-fail fallback stays name-only with no forced fetch, and
the surface stays usable offline exactly as before — only the popup's
descriptive text depends on the network when it is opened. Two `- Owner note:`
veto flags were added to REQ-058 and FLOW-006 during refinement flagging this
popup-fetch/offline tension explicitly for the owner, rather than silently
resolving it. `PRD/sections/scan/README.md` (lines 112–114): "popup fetches its
descriptive fields on demand by oracle id (REQ-175, FLOW-024) ... the entry
falls back to the card name only, with no fetch triggered."

## Verification

- PR #185 **MERGED** into `main` on 2026-09-05 (merge commit `d9f3a7a`),
  confirmed via `gh pr view 185` (`state: MERGED`, `baseRefName: main`,
  `mergeCommit.oid: d9f3a7a10fd137231ca3bfdb49076804b0e964ef`).
- `git merge-base --is-ancestor d9f3a7a HEAD` on this checkout: true.
- Durable product truth present on this branch (confirmed by direct grep
  against live `PRD/sections/` — see `## Durable truth confirmed` below).
- Node-7 review (opus, fresh context, read-only): **APPROVE**, no
  Critical/Important findings across all five focus areas (DEC-078 offline
  honored, on-demand endpoint wired across shared surfaces, ask-ai
  byte-identical server-side, NFR-019 ≥40% with no lingering 80%, applied truth
  matches the approved proposal). One Minor (stale "80%" in the ephemeral
  `slice-c` work doc and its criteria file) — resolved by this cleanup's
  deletion of the whole work folder.

## Durable truth confirmed

Every item below was checked against live `PRD/sections/` on this branch — none
was rewritten by this cleanup, all were applied at `build` together with the code:

- **REQ-174** (new) — `functional-requirements.md` (§ REQ-174), cited from
  `user-flows.md`, `non-functional-requirements.md` (NFR-019), and
  `quick-lookup/README.md`.
- **REQ-175** (new) — `functional-requirements.md` (§ REQ-175, the
  `GET /api/cards/:oracleId` route), cited from `user-flows.md`,
  `screen-layout.md`, `goals-and-non-goals.md`, `technical-design-rules.md`.
- **REQ-176** (new) — `functional-requirements.md` (§ REQ-176, ask-ai
  server-side resolution), cited from `integrations-and-data.md` and the
  amended REQ-167 lookup-mode shape.
- **REQ-167** (amend) — `functional-requirements.md` (~line 3832): lookup
  request cards carry identity only; descriptive block resolved server-side by
  `cardId` from `cardDetailByOracleId.json`.
- **REQ-128 / REQ-125 / FLOW-001** (amend) — `functional-requirements.md` /
  `user-flows.md`: corner popup on-demand fetch (REQ-128), name-only image-fail
  fallback (REQ-125, FLOW-001).
- **REQ-058** (amend) — the second authoritative popup requirement (shared
  across `ZoneCardPicker`/`ScanReviewBubble`/`EnrichmentStep`) present in
  `user-flows.md`, `functional-requirements.md`, `system-map.md`,
  `integrations-and-data.md`, `in-depth/README.md`, `shared-chrome/README.md`.
- **FLOW-024** (new) / **FLOW-002 / FLOW-006** (amend) — present across
  `user-flows.md`, `screen-layout.md`, `system-map.md`,
  `functional-requirements.md`, `integrations-and-data.md`,
  `quick-lookup/README.md`, `non-functional-requirements.md`,
  `scan/README.md`, `shared-chrome/README.md`, `in-depth/README.md`.
- **`screen-layout.md`** (amend) — line 101: on-demand load-state constraint on
  the card-detail popup (quiet, no branded splash/spinner takeover/progress
  bar/layout shift).
- **`scan/README.md`** and **`shared-chrome/README.md`** (derived sources,
  DEC-168 lockstep) — both amended: name-only fallback with no fetch, on-demand
  descriptive fetch by oracle id.
- **NFR-019** — `non-functional-requirements.md` (§ NFR-019): ≥40% gzipped
  reduction, firm pass/fail gate, provenance note included, no 80% remaining.
- **One-endpoint-rule amendments** — `REQ-012`, `REQ-072`
  (`functional-requirements.md`), `NFR-004` (`non-functional-requirements.md`,
  "one main product-facing backend endpoint, plus the read-only card-detail
  retrieval route (REQ-175)"), `goals-and-non-goals.md` (line 39),
  `technical-design-rules.md` (line 12) — all four consistently authorize the
  second, read-only `GET /api/cards/:oracleId` route alongside the one
  product-facing endpoint.

Nothing was found missing. No promotion was needed at this cleanup.

## Autonomous merge-proof gate

- **Base check (discrepancy, documented and resolved via direct evidence):**
  the recorded `Autonomous base: origin/thejudge-auto/image-first-cards` is
  **stale** — it still exists on `origin` (not deleted) but is an orphaned
  ledger-tracking branch (tip `cff3dbf9`, last commit "review APPROVE → PARK at
  land") that never received the code. Per the ledger's own "Build-half base
  note" and "Open gate" `## Note:`, PR #185 was **retargeted from that
  intermediate base straight to `main`** "so it is a single merge," which
  orphaned the recorded base branch (`git merge-base --is-ancestor
  origin/thejudge-auto/image-first-cards d9f3a7a` = false; it shares no history
  with the merge and contains none of the REQ-174 etc. truth). Applying the
  same evidentiary standard the gate uses for a base that "resolves nowhere":
  the merge commit `d9f3a7a` is a verified ancestor of this checkout's `HEAD`
  (`git merge-base --is-ancestor d9f3a7a HEAD` = true), and the recorded base
  name plus the merge SHA are both recorded here for traceability. The stale
  base branch is left untouched on `origin` (never delete a remote branch).
- **Implementation PR:** #185 merged, base `main`, verified via `gh pr view 185
  --json state,baseRefName,mergedAt,mergeCommit` (`state: MERGED`,
  `baseRefName: main`, merge commit `d9f3a7a10fd137231ca3bfdb49076804b0e964ef`).
- **Worktree:** `.worktrees/implement-image-first-cards` at `37d5aed`, a
  verified ancestor of `main` (fully merged). `git status --porcelain` showed
  only two empty, content-free untracked directories
  (`apps/backend/data/scryfall`, `apps/frontend/data/`) — leftover artifacts of
  the Scryfall-bulk build scripts, not uncommitted work; both removed with the
  worktree.
- **Runtime cleanup:** Slice A criterion A13 and Slice C criterion C10 both
  record `browser_close` called, owned dev server(s) stopped, and ports
  released, per `PRD/instructions/runtime-process-hygiene.md`.

## Actions taken

- Wrote this receipt (before any delete).
- Confirmed durable `PRD/sections/` truth present (no rewrite — see
  `## Durable truth confirmed`).
- Removed the `image-first-cards` row from `PRD/work/STATUS.md`
  (`## ship-ready`).
- Deleted the work package: `git rm -r PRD/work/image-first-cards/`.
- Removed the merged worktree `.worktrees/implement-image-first-cards` (two
  untracked symlinks to the main checkout's own Scryfall-bulk cache directories
  were the only non-git content; deleted with the worktree, nothing lost).
- `git branch -d thejudge-auto/image-first-cards-work` refused: git's safety
  check compares against the branch's configured upstream
  (`origin/thejudge-auto/image-first-cards`, the stale base — see the merge-proof
  section above), not against `HEAD`, even though `git merge-base --is-ancestor
  thejudge-auto/image-first-cards-work HEAD` is true. Per contract, `-D` is never
  used to force past this. The local branch `thejudge-auto/image-first-cards-work`
  is left in place, harmless (its remote counterpart was already deleted when
  PR #185 merged). The stale local/remote base branch
  `thejudge-auto/image-first-cards` was also left untouched (unmerged into
  `main`, and remote branches are never deleted by cleanup).

## Files

- Created: `PRD/instructions/receipts/image-first-cards-2026-09-05.md` (this receipt)
- Updated: `PRD/work/STATUS.md` (`## ship-ready` row removed)
- Deleted: `PRD/work/image-first-cards/` (entire package, including
  `GRAPH-RUN.md`, `GATE-QUESTIONS.md`, `DESIGN-BRIEF.md`, `GAMEPLAN.md`,
  `IDEA.md`, `README.md`, `STATUS.ship-ready`, `intake/`, slice docs, and
  criteria files)

## Graph run

- Run ID: `graph-20260903-093903` | Profile: `loaded (env sentinel)` | Terminal state: shipped (PR #185 merged into `main` at `d9f3a7a`, 2026-09-05)

### Node ledger

| # | Node | Model | Outcome | Heartbeat | Evidence | Date |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | preflight | haiku | ok | `degraded (no run state)` | branch `thejudge-auto/image-first-cards` pushed (auto-commit `a9b09c7`); canary denied both tiers; profile env sentinel present | 2026-09-03 |
| 2 | shape | sonnet | ok | `degraded (no run state)` | package created (`IDEA.md`, `STATUS.ideation`, `intake/GRAPH-BRIEF.md`); commit `5e0d9a6`; 6 prior-run receipts recorded; DEC-151 confirmed live-cited | 2026-09-03 |
| 3 | define | opus | ok | `1 → 31` | `STATUS.refined`; `DESIGN-BRIEF.md` + `GATE-QUESTIONS.md` (12 stable-id slots); commit `28ddc9f`; oracle-id join verified from live sections, not the un-opened FINDINGS files | 2026-09-03 |
| 4 | gate-qc | sonnet | failed | `? → 42` | FAIL loop 1/3: REQ-175 new route conflicts with the one-endpoint rule (DEC-010) with no gate slot; REQ-176 diff misses `quick-lookup` lookup-card shape; NFR-019 cites NFR-018 not NFR-014; `STATUS.refining`; commit `079a647` | 2026-09-03 |
| 3 | define | opus | ok | `? → 48` | attempt 2: all 3 FAIL findings cleared — no new route (card detail via lazy static artifact, DEC-010 intact), endpoint alt surfaced as new `D5` fork; REQ-176 quick-lookup diff added; NFR-019 → NFR-014; `STATUS.refined`; commit `9d030f1`; 13 gate slots | 2026-09-03 |
| 4 | gate-qc | sonnet | failed | `? → 37` | FAIL loop 2/3: prior 3 findings confirmed fixed; new finding — REQ-176 amends derived `quick-lookup/README.md` but not its authoritative source REQ-167 (`functional-requirements.md` ~L3829), so per DEC-168 the two contradict on lookup-card `oracleText`; `STATUS.refining`; commit `35ec3a6` | 2026-09-03 |
| 3 | define | opus | ok | `? → 23` | attempt 3: added `REQ-167 (amend)` gate slot so authoritative REQ matches derived `quick-lookup` spec; ran full derived-spec↔source-REQ audit (no other contradictions), recorded as recurrence guard in brief; `STATUS.refined`; commit `0910f0a`; 14 gate slots | 2026-09-03 |
| 4 | gate-qc | sonnet | failed | `? → 47` | FAIL loop 3/3: REQ-167 finding confirmed fixed, all quoted blocks re-verified faithful; new finding — new visible loading state on card-detail popup + Quick Lookup pre-submit needs a `screen-layout.md` catalog constraint (REQ-126/DEC-149) or explicit out-of-scope reason; `STATUS.refining`; commit `75c219a` | 2026-09-04 |
| 3 | define | opus | ok | `? → 29` | attempt 4 (final loop): added `screen-layout.md` load-state constraint gate slot on both surfaces; 4 completeness sweeps pass — sweep (b) also closed a quick-lookup preview-prose derived-spec gap (folded into FLOW-024); `STATUS.refined`; commit `83286e7`; 15 gate slots | 2026-09-04 |
| 4 | gate-qc | sonnet | ok | `? → 45` | PASS, no findings: every diff's Current text verified verbatim vs live source; all cross-refs resolve; every user-visible surface has a screen-layout row or reasoned exemption; derived↔source REQs in lockstep; run stops at PASS → docs PR + `owner-action` park | 2026-09-04 |
| — | gate-review | sonnet | ok | `0 → 37` | build half: owner's 15 verdicts applied inside `GATE-QUESTIONS.md` (12 accept, 3 edit: D3/D5/NFR-019; 0 reject); `PRD/sections/` untouched; `STATUS.refined` restored; commit `b16c139` pushed to base | 2026-09-04 |
| 4 | gate-qc | sonnet | failed | `0 → 9` | FAIL, build-half re-grade (attempt 5): `GATE-QUESTIONS.md` itself is sound — REQ/FLOW/NFR diffs consistently implement name-only (D3) and the endpoint (D5), every quoted "Current" block re-verified verbatim vs live source, all cross-refs resolve, DEC-010→REQ-012/NFR-004 substitution confirmed factually correct (DEC-010 is a retired bodyless row); but `DESIGN-BRIEF.md` was never updated after the gate — it still narrates "no new endpoint"/static artifact (D5) and "name + oracle id" fallback (D3) in 7 places, contradicting the finalized proposal; package `README.md` summary carries the same D5 staleness; minor: one-endpoint-rule amendments given as prose arrows, not Current:/Proposed: blocks; `STATUS.refining`; cannot loop to `define` (build half) — parks at `owner-action`; commit `97ce6b4` | 2026-09-04 |
| — | gate-review | sonnet | ok | `0 → 39` | attempt 2 (driver reconcile, not park): synced `DESIGN-BRIEF.md` + `README.md` narrative to the finalized D3/D5 gate answers — 9 stale spots fixed (7 flagged + 2 swept); minor one-endpoint amendments (REQ-012/REQ-072/NFR-004/`goals-and-non-goals.md`/`technical-design-rules.md`) reformatted to 6 Current:/Proposed: blocks from live source; `PRD/sections/` zero diff; `STATUS.refining` unchanged; commit `36d5c05` |
| 4 | gate-qc | sonnet | failed | — | FAIL (attempt 6, re-grade after reconcile): all three attempt-5 findings confirmed resolved — D5 endpoint narration, D3 name-only narration, and the REQ-012/REQ-072/NFR-004/`goals-and-non-goals.md`/`technical-design-rules.md` Current:/Proposed: reformat all verified verbatim against live source, all 24 cross-refs resolve, both screen-layout.md rows exist, REQ-167/DEC-168 lockstep holds; but the cross-cutting "locally carried descriptive fields" / local-metadata-fallback rule D1/D3 reverse is grepped incomplete — REQ-058 (a second authoritative requirement governing the same popup across `ZoneCardPicker`/`ScanReviewBubble`/`EnrichmentStep`), FLOW-002 (zone-collection inspect/remove), FLOW-006 (scan review, a surface the brief's own screen-layout section claims is covered), and derived `scan/README.md` all still assert local-carry/local-metadata-fallback language with no amendment; `DESIGN-BRIEF.md`'s completeness sweeps (a) and (b) are therefore incorrect; `STATUS.refining` unchanged; cannot loop to `define` (build half) — parks at `owner-action`; commit `14eafbd` | 2026-09-04 |
| — | refine | opus | ok | `n/a (interactive)` | owner confirmed direction, proceed; completed the corner-popup/fallback amendment set — D1/D3 applied across REQ-058, FLOW-002, FLOW-006, two missed REQ-128 spots, derived `scan/README.md` + `shared-chrome/README.md` (sources in lockstep, DEC-168); DEC-078 offline guarantee reconciled with owner-veto notes on REQ-058/FLOW-006; `STATUS.refined`; commit `cf5b9a0` | 2026-09-04 |
| 4 | gate-qc | sonnet | ok | `0 → 62` | PASS (attempt 7): amendment set verified complete — all named + derived locations amended in lockstep, 38 diff blocks' Current text verbatim, 26 cross-refs resolve, screen-layout coverage complete, DEC-078 reconciliation sound; incidental README `status:` line fix; `STATUS.refined`; commit `87af556` → continue to `plan` | 2026-09-04 |
| 5 | plan | sonnet | ok | `0 → 51` | `GAMEPLAN.md` + 3 slice docs + 3 criteria files; dependency-safe order A→B→C (A endpoint/artifact/on-demand popup, B ask-ai server-side gated by byte-identical `test:eval`, C slim list gated by NFR-019 80%-gzipped); criteria: A 13 / B 8 / C 10; `STATUS.active`; board → active; no commit (driver publishes) | 2026-09-04 |
| 6 | build | sonnet | failed | `0 → 152` | attempt 1 STALLED (harness stream watchdog, 600s no-progress; infra, not a logic failure) mid-Slice-A while debugging QuickLookup/interaction-flow test failures. Worktree `.worktrees/implement-image-first-cards` has Slice A largely implemented but uncommitted (21 files: `cardDetail.ts` + `routes/cardDetail.ts`+test, `build-card-detail-by-oracle-id.mjs`, `cardDetailByOracleId.json`, `CardPresentation.tsx`+tests, `lib/cardDetail.ts`, route wiring); no commits, no PR. Driver renamed worktree branch → `thejudge-auto/image-first-cards-work`, WIP preserved; re-dispatching build attempt 2 to resume with anti-stall guardrails | 2026-09-04 |
| 6 | build | sonnet | parked | `0 → 491` | attempt 2 (resume): Slice A DONE (13/13 criteria, live Playwright verified — on-demand load, offline degrade, image-fail name-only zero-fetch; REQ-175/FLOW-024 new + 9 amended across 11 `PRD/sections/` files; commit `28e4eef`) and Slice B DONE (8/8 criteria, `test:eval` byte-identical proof; fixed 2 real bugs — `colors` kept locally + `FrozenAskAiContext` trimmed shape; REQ-176 new + REQ-167/integrations/quick-lookup amended; commit `0bea2f3`). Both pushed to `-work`, PR #185 opened → base. Slice C BLOCKED on a genuine owner decision: NFR-019's ≥80%-gzipped-reduction gate is structurally unreachable — measured 48.1% (removed oracle text compresses well; kept `cardId`/`imageUrl` barely do); C code green but uncommitted, PRD truth for C held. 4 options in PR #185 blocker comment. Parks at `owner-action` | 2026-09-04 |
| 6 | build | sonnet | ok | `0 → 187` | attempt 3 (resume after owner recalibrated NFR-019 → ≥40%): Slice C committed (`37d5aed`) — `CardMetadataItem` slimmed, build-script floor 0.8→0.4, gate now passes at 48.1% ≥ 40%; NFR-019 truth applied fresh to `non-functional-requirements.md` at ≥40% (no lingering 80%) + REQ-174 new + integrations/system-map amendments; fixed a real combo-quality test regression the slim caused; all 10 Slice-C criteria true; full suite green (fe 1315 / be 398 / scripts 436), Playwright-verified; PR #185 un-blocked, all 3 slices A+B+C present. Build complete → review | 2026-09-04 |
| 7 | review | opus | ok | `0 → 31` | APPROVE — no Critical/Important. All 5 focus areas pass: DEC-078 offline honored (name-only fallback, no forced fetch; `CardPresentation.tsx:275-287`), on-demand `GET /api/cards/:oracleId` wired across all shared surfaces, ask-ai byte-identical server-side (client stops sending text), NFR-019 gate ≥40% (build script + `non-functional-requirements.md`, no lingering 80%), applied PRD truth matches approved proposal. One Minor (non-blocking): stale "80%" in the ephemeral `slice-c` work doc + `slice-c.criteria.json` C3 — no effect on shipped deliverable, deleted at cleanup. Every criteria.json entry met. → land | 2026-09-04 |
| 8 | land | human | ok | `n/a` | owner tested the stack live (OpenAI profile) and merged PR #185 into `main` — merge commit `d9f3a7a` (2026-09-05). The one human step. → close | 2026-09-05 |

### Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
| Image-first cards: slim the up-front card list and fetch card detail on demand from a new backend card endpoint, moving ask-ai's card-text read server-side | answered-once | shape | — |
| recalibrate NFR-019's first-load gate — the 80% gzipped-reduction target is unreachable (measured 48%); keep it relative, set the floor to ≥40% | answered-once | build | — |
| recalibrate NFR-019's first-load gate — the 80% gzipped-reduction target is unreachable (measured 48%); keep it relative, set the floor to ≥40% | answered-once | build | — |

## Intake

- `intake/GRAPH-BRIEF.md` — staged graph brief, handed to this run as
  `PRD/work/probe-slow-load-vs-rag/GRAPH-BRIEF.md` (copied verbatim into the
  package at node 2 from `.worktrees/.graph-intake/graph-20260903-093903/`)
