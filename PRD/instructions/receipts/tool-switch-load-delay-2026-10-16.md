# Receipt — tool-switch-load-delay (2026-10-16)

**What happened:** Every tool in the app now opens without a "Loading…" screen. Once the first screen is up, the app quietly downloads the code of every other tool in the background. After that, it downloads the card list once and shares it between Quick Question, the In-depth question flow and the Trade Balancer. On a slow phone network the old wait was 0.7 s per tool; the tools now open in about 40 ms or less. The first screen loads as fast as before.

**What it means for you:** Nothing to do except merge PR #314. After the merge, hopping from the question flow to the Life Tracker to the Trade Balancer shows no "Loading…" screen. A Life Tracker landing now also downloads the card list (about 1.96 MB, once per visit), which you accepted.

- Date: 2026-10-16
- Slug: `tool-switch-load-delay`
- Status: shipped
- PR: https://github.com/ChrisMiho/TheJudge/pull/314 (open at close; the owner's merge lands code, truth, and this receipt together)
- Docs PR: #313 (merged; the `define` gate, NFR-014 verdict `edit`)
- Review: APPROVE, 29/29 criteria (A1-A10, B1-B10, C1-C9), 0 Critical, 0 Important, 2 Minor

## Actions taken

- Slices A (shared card list), B (tiered background download) and C (live verification) built and reviewed on `thejudge-auto/tool-switch-load-delay-work`. A review loop fixed one Important finding (criterion C2 wording reconciled to `DESIGN-BRIEF.md` lines 318-321 and re-measured on Slow 4G + CPU 4x).
- Durable product truth applied at `build` (Diffs 1-4 of `GATE-QUESTIONS.md`); confirmed present at close, nothing re-written and nothing left to promote.
- Receipt written; board row removed from `PRD/work/STATUS.md`; `PRD/work/tool-switch-load-delay/` removed with `git rm`.

## Durable truth confirmed present (no promotion needed)

| Diff | File | Check |
| --- | --- | --- |
| 1 | `PRD/sections/non-functional-requirements.md` (NFR-014) | present: tiered background download constraint at line 240, cost line, REQ-064 and REQ-067 dependencies |
| 2 | `PRD/sections/shared-chrome/README.md` | present: tiered background download bullet at line 102 |
| 3 | `PRD/sections/screen-layout.md` | present: row at line 73 carries the no-fallback-after-background-download wording |
| 4 | `trade-balancer/README.md` (lines 63, 190, 202), `functional-requirements.md` (REQ-064, line 1512), `user-flows.md`, `system-map.md` (Trade Balancer entry), `integrations-and-data.md` (line 165) | present: all seven hunks reworded to the shared, once-per-page card list |

`system-map.md` has no `planned`/`partial` entry for this package, so no status flip applies.

## Files

Created or changed by the code PR (excluding the work folder): `apps/frontend/src/lib/cardMetadataStore.ts` and `.test.ts` (new), `apps/frontend/src/components/portal/cardMetadataSharing.test.tsx` (new), `destinationRegistry.tsx` and test, `DestinationOutlet.tsx` and test, `MtgAssistantApp.tsx`, `quick-lookup/QuickLookupApp.tsx` and test, `trade/TradeBalancer.tsx`, `App.zoneFlow.test.tsx`, `apps/frontend/src/test/setup.ts`, and the eight `PRD/sections/` files named in the table above.

Created by close: this receipt. Updated by close: `PRD/work/STATUS.md`. Deleted by close: every tracked path under `PRD/work/tool-switch-load-delay/` (DESIGN-BRIEF.md, GAMEPLAN.md, GATE-QUESTIONS.md, GRAPH-RUN.md, IDEA.md, QUALITY-CHECK.md, README.md, STATUS.ship-ready, evidence/measurements.md, the three slice docs, three `slice-*.criteria.json`, `slice-c.evidence.md`). The gitignored browser captures in `PRD/work/tool-switch-load-delay/.playwright-mcp/` (first-screen.js, measure-slow-after-list.js, life-tracker-landing-after-change.png and others) go with the folder and are not kept.

## Verification

- Frontend tests: 152 files / 1639 tests pass (builder and reviewer both re-ran).
- `npm run typecheck`, eslint, format, `npm run quality:check`: 0.
- Live checks (slice C, `slice-c.evidence.md`, now deleted with the folder): tools open within 100 ms with no "Loading…" frame at Fast 4G and Slow 4G with CPU 4x; tier order holds on Quick Question and Life Tracker landings; card list requested exactly once; no `GET /api/health` before the balancer opens. Browser closed, preview servers stopped, ports released.
- PR #314 CI at review: backend, frontend shards 1-3, static pass (coverage-merge pending).
- `.graph-evidence.jsonl` holds 0 entries for the build half (known gap: criteria are self-reported; review is the gate).

## Follow-up items

- Minor (review): the A6 test does not assert that search is disabled while the card list loads. The code gates it at `TradeBalancer.tsx:434`; add the assertion.
- Minor (review): a card-list download already in flight when a lazy load is rejected can leave a rejection that sticks. Pre-existing and outside the rubric; review recommends handling in-flight lazy rejection (clear the cached promise on failure) as its own change.
- Brief follow-up F1 (rest): Brotli compression and trimming the card list (about 1.96 MB gzipped) remain out of scope.
- Brief follow-up F2: caching headers for the card list and tool code remain out of scope.

## Graph run

- Run ID: `graph-20261016-050510` (build half) | Profile: `loaded (env sentinel)` at node 1, build half `unverified` | Terminal state: COMPLETE — land: the owner's merge of https://github.com/ChrisMiho/TheJudge/pull/314
- Spec-forming half run ID: `graph-20261016-040838` (preflight, shape, define, gate-qc); docs PR #313
- PR: https://github.com/ChrisMiho/TheJudge/pull/314

### Node ledger

| # | Node | Model | Outcome | Heartbeat | Evidence | Date |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | preflight | haiku | ok | `0 → 8` | branch `thejudge-auto/tool-switch-load-delay` pushed (`git ls-remote` → `21243d52`) from `.worktrees/kickoff-tool-switch-load-delay`; launch checkout still on `main`; lock `.worktrees/.graph-run.lock` runId `graph-20261016-040838` | 2026-10-15 |
| 2 | shape | sonnet | ok | `0 → 14` | `PRD/work/tool-switch-load-delay/` (IDEA.md, README.md, STATUS.ideation) and board row committed `f5cf16f6`, pushed | 2026-10-15 |
| 3 | define | opus | ok | `0 → 76` | `DESIGN-BRIEF.md`, `GATE-QUESTIONS.md` (one block, `NFR-014` amendment), `evidence/measurements.md` (live mtgjudge.gg + local preview, throttled and unthrottled), `STATUS.refined`, board row; committed `cf3c434c`, pushed `ed3e96b8..cf3c434c`; worktree `git status --porcelain` empty; port 4917 free | 2026-10-15 |
| 4 | gate-qc | sonnet | ok | `0 → 16` | PASS — `QUALITY-CHECK.md` committed `80112ad7` (on origin); README `## Preparation gate` recorded by the driver | 2026-10-15 |
| 5 | gate-review | sonnet | ok | `0 → 25` | build half run `graph-20261016-050510`: kickoff worktree removed clean (`git worktree remove`); claim commit `8abc7f2d` on `thejudge-auto/tool-switch-load-delay-work` cut from `origin/main` `a6b127da` (docs PR #313 merge), pushed; lock taken from the launch root; graph canary `nohup true` denied; `graph-gate-review` commit `063915ff` (= origin tip): 0 accept / 1 edit / 0 reject (NFR-014 widened to three tiers); `### Brief reconciliation` 15 passages in `DESIGN-BRIEF.md`; `STATUS.refined` only marker; board row under refined; `git diff --stat origin/main HEAD -- PRD/sections apps scripts` empty; worktree and launch-checkout porcelain empty | 2026-10-15 |
| 4 | gate-qc (build half, attempt 1) | sonnet | failed | `0 → 20` | FAIL — 4 blocking, 2 advisory; `QUALITY-CHECK.md` overwritten, commit `e256532b` (= origin tip); `STATUS.refining`; README `## Preparation gate` FAIL recorded by the driver; loops to `define` (FAIL 1 of 3) | 2026-10-15 |
| 3 | define (build half, attempt 1) | opus | ok | `0 → 53` | commit `24176fc1` (= origin tip): all 6 findings addressed in `DESIGN-BRIEF.md`, `GATE-QUESTIONS.md` (Diff 4 under NFR-014 rewording the REQ-064 ping overlap; NFR-014 verdict and reason untouched), `evidence/measurements.md` (live-site Life Tracker landing, read-only); new blocker question `Q-014` with blank slots (`GATE-QUESTIONS.md:202-252`: does a Life Tracker landing also download the card list in the background); `STATUS.refining`; `git diff --stat origin/main HEAD -- PRD/sections apps scripts` empty; porcelain empty both checkouts | 2026-10-15 |
| 4 | gate-qc (build half, attempt 2) | sonnet | failed | `0 → 17` | FAIL — 1 blocking (`integrations-and-data.md:165` missing from Diff 4 and the dispositions table), 3 advisory; attempt-1 findings 1, 2, 4, 5, 6 resolved; Diff 4 applies cleanly; Q-014 meets the plain-language standard; `QUALITY-CHECK.md` commit `6edb3a71` (= origin tip); `STATUS.refining`; README `## Preparation gate` FAIL recorded by the driver; loops to `define` (FAIL 2 of 3) | 2026-10-15 |
| 3 | define (build half, attempt 2) | opus | ok | `0 → 42` | commit `df85db45` (= origin tip): blocker fixed (Diff 4 hunk for `integrations-and-data.md:165`, intro count corrected), 3 advisories fixed (criteria 3, 4, 6); widened disposition grep over `PRD/sections/` → 96 hits, each dispositioned in `DESIGN-BRIEF.md`; Q-014 unchanged, slots blank at return; `STATUS.refining`; `git diff --stat origin/main HEAD -- PRD/sections apps scripts` empty; porcelain empty both checkouts. Owner then answered Q-014 in session (accept, transcribed by the driver) | 2026-10-15 |
| 5 | gate-review (build half, attempt 2) | sonnet | ok | `0 → 38` | driver verdict commit `9a969584` (Q-014 accept); `graph-gate-review` commit `f3d1d4c1` (= origin tip): Q-014 accept applied, diffs unchanged (already written for yes), `### Brief reconciliation` 13 passages (pending/no-answer wording removed), `Q-014` row in `## Gate verdicts`; `STATUS.refined` only marker; board row under refined; `git diff --stat origin/main HEAD -- PRD/sections apps scripts` empty; porcelain empty both checkouts | 2026-10-15 |
| 4 | gate-qc (build half, attempt 3) | sonnet | ok | `0 → 15` | PASS, no findings — `QUALITY-CHECK.md` commit `c96c77c4` (= origin tip); all 13 diff blocks match current `PRD/sections/` once each; tier order holds on every landing; README `## Preparation gate` PASS recorded by the driver | 2026-10-15 |
| 5 | plan | sonnet | ok | `0 → 26` | commit `4bd23212` (= origin tip): `GAMEPLAN.md`, `slice-a-shared-card-list.md` (Diff 4), `slice-b-background-download.md` (Diffs 1-3), `slice-c-live-verification.md` (promotion check, ship gates); `slice-a.criteria.json` 10, `slice-b.criteria.json` 10, `slice-c.criteria.json` 9 (7 manual), every `value` false; `STATUS.active` only marker; board row under active; worktree porcelain empty (published for `build`); launch-checkout porcelain empty | 2026-10-15 |
| 6 | build | sonnet | ok | `0 → 145` | PR https://github.com/ChrisMiho/TheJudge/pull/314 (open, base `main`); commits `8cff69ca` (A), `547d85ee` (B), `4b721b75` (C) = origin tip; 29/29 criteria `value: true` (A 10, B 10, C 9); `.graph-evidence.jsonl` holds 0 entries for this run id (known build-half gap: criteria are self-reported, review is the gate); reported `npm --workspace apps/frontend run test` 152 files / 1639 tests pass, `npm run typecheck` 0, `npm run quality:check` 0, build 0; C1-C7 dated observations in `slice-c.evidence.md`; Diffs 1-4 applied to `PRD/sections/`; `STATUS.ship-ready`; return side: launch-checkout porcelain empty before and after (identical), `classifyBuildWrites` over 41 reported paths → `ok`, 0 outside `.worktrees/implement-tool-switch-load-delay/`; worktree porcelain empty | 2026-10-15 |
| 7 | review | opus | failed | `0 → 32` | CHANGES REQUESTED: 1 Important (C2 not met on Slow 4G + CPU 4x per `slice-c.evidence.md:9` — `Loading card list…` 1-2 frames, continuing-tap times unrecorded — and so C9), 3 Minor (A4 test thin; missing space `MtgAssistantApp.tsx:40`; in-flight lazy rejection sticks, outside rubric). A1-A10, B1-B10, C1, C3-C8 met; reviewer re-ran frontend tests 152/1639 pass, typecheck, format, lint 0 errors. Driver check: `DESIGN-BRIEF.md:318-321` (QC-passed) conditions the clause on the balancer opening after the list has arrived; `slice-c-live-verification.md:18` and `slice-c.criteria.json` C2 dropped that condition at `plan` — a transcription gap, settled by the brief and the owner's NFR-014 reason (list trimming out of scope). Launch and worktree porcelain empty (no reviewer writes). Loops to `build` (return 1 of 2) | 2026-10-15 |
| 6 | build (attempt 2) | sonnet | ok | `0 → 24` | commit `04b71b78` (= origin tip): C2 reworded in `slice-c-live-verification.md` and `slice-c.criteria.json` to `DESIGN-BRIEF.md:318-321`, re-earned on Slow 4G + CPU 4x (Life Tracker 40 ms, Trade Balancer 32 ms, In-Depth 32 ms, Quick Question 9 ms, 0 code `Loading…` frames; list not yet arrived at those taps; after list `responseEnd` the balancer opened in 71 ms with 0 `Loading card list…` frames), dated lines in `slice-c.evidence.md`; C2, C9 true (29/29); Minor fixes in `cardMetadataSharing.test.tsx` and `MtgAssistantApp.tsx:40`; reported frontend tests 152/1639 pass, `npm run quality:check` 0; preview port 4941 released, `browser_close` called; return side: launch-checkout porcelain empty before and after, 5 committed paths plus gitignored captures all inside `.worktrees/implement-tool-switch-load-delay/`; worktree porcelain empty; `STATUS.ship-ready` | 2026-10-16 |
| 7 | review (attempt 2) | opus | ok | `0 → 25` | APPROVE: 29/29 met (A1-A10, B1-B10, C1-C9), 0 Critical / 0 Important, 2 Minor (A6 test does not assert search disabled while loading — code gates it at `TradeBalancer.tsx:434`; in-flight lazy rejection sticks, pre-existing and outside the rubric); C2 wording confirmed to match `DESIGN-BRIEF.md:318-321`, no other criterion reworded; reviewer re-ran frontend tests 152/1639, typecheck, eslint, format 0; ports 4931/4932/4941 free; PR #314 CI backend, frontend shards 1-3, static pass (coverage-merge pending); launch and worktree porcelain empty | 2026-10-16 |

### Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
| owner launch request (verbatim in IDEA.md): why is there such a delay when going from the question flow to the life tracker to the trade balancer, can we fix it | answered-once | shape | — |
| owner mid-run note: the delay is seen on the live server — relayed to define as a measurement target | answered-once | define | — |
| owner build signal: merged, go ahead (docs PR #313 merged) | answered-once | gate-review | — |
| owner answer to blocker Q-014: Q-014 yes, Life Tracker landings download it too — transcribed by the driver into the Q-014 verdict slot as `accept` | answered-once | define | — |
| owner clarification on Q-014: asked whether the Life Tracker did it last; the driver explained the card list stays tier 3, downloaded last after the landing screen and every tool's code; owner confirmed: yes, last is what I meant, continue | answered-once | gate-review | — |
