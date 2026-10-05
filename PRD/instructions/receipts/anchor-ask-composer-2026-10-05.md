# Receipt — anchor-ask-composer — 2026-10-05

**What happened:** Typing a long question in Quick lookup or In-depth used to slide the whole page, pushing the cards off screen and the send button below the fold. The Ask screen is now an anchored frame: the question box stays pinned at the bottom and grows upward in place, the card stage shrinks to make room, and the In-depth chip and mic|send pill stay put, including above the phone keyboard. Code PR: https://github.com/ChrisMiho/TheJudge/pull/262 (open, not yet merged).

**What it means for you:** Merge PR #262 to ship it. After that, typing a long question never moves the page or hides the send button.

## Summary

- Date: 2026-10-05
- Slug: anchor-ask-composer
- Status: **shipped**
- PR: https://github.com/ChrisMiho/TheJudge/pull/262
- Cleanup mode: graph-controlled (node 8, `close`), PR-ready path; receipt and package deletion ride in the code PR before the owner's merge.
- Durable truth applied at build and confirmed present: REQ-218 (new), REQ-110/129/206 (amended) in `functional-requirements.md`, plus `screen-layout.md`, `quick-lookup/README.md`, `in-depth/README.md`, `user-flows.md`. No promotion needed.
- Verification: slices A-D done, all criteria files `true`, review APPROVE (attempt 2).
- Files: deleted `PRD/work/anchor-ask-composer/` (whole folder); updated `PRD/work/STATUS.md` (board row removed); created this receipt. `system-map.md` has no entry for this slug, so no flip.

## Graph run

- Run ID: `graph-20261003-205515` (build half `graph-20261005-133503`) | Profile: `loaded (env sentinel)` | Terminal state: COMPLETE — land: the owner's merge of https://github.com/ChrisMiho/TheJudge/pull/262

### Node ledger

| # | Node | Model | Outcome | Heartbeat | Evidence | Date |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | preflight | haiku | ok | `0 → 7` | branch `thejudge-auto/anchor-ask-composer` pushed (`0d5f2e5`) from `.worktrees/kickoff-anchor-ask-composer`; launch checkout untouched (`fix/desktop-close-search-chips`); universal canary denied, graph canary denied, lock `free → taken` | 2026-10-03 |
| 2 | shape | sonnet | ok | `0 → 8` | package `PRD/work/anchor-ask-composer/` created (IDEA.md, README.md, STATUS.ideation, intake/GRAPH-BRIEF.md); committed `2e2a2ca`; 7 prior-run matches recorded in IDEA.md | 2026-10-03 |
| 3 | define | opus | ok | `0 → 43` | DESIGN-BRIEF.md + GATE-QUESTIONS.md (REQ-218 new, REQ-110/129/206 amend) written; STATUS.refined; committed `4281967`; zero PRD/sections edits confirmed via `git diff --name-only origin/main...HEAD`; no blocker | 2026-10-03 |
| 4 | gate-qc | sonnet | failed | `0 → 17` | FAIL — 4 findings (wrong fit variant: brief/REQ-218 name `page-content-wide-fit`, Ask screens use `narrow` → `narrow-fit`, width must not change; In-depth per-page variant unspecified vs DEC-145 content-sized Game/Zones/Cards; broken diff wording in quick-lookup README; screen-layout Notes cell contradicts new cells); STATUS.refining; committed `cb8db5c`; loops to define attempt 2 | 2026-10-03 |
| 3 | define | opus | ok | `0 → 32` | attempt 2 — all 4 gate-qc findings fixed (`narrow-fit` + width-unchanged criterion; frame only at In-depth Enrichment station; reworded README diff; screen-layout Notes reconciled); same 4 ids (REQ-218 new, REQ-110/129/206 amend), no new ids; STATUS.refined; committed `4334ae1`; no blocker | 2026-10-03 |
| 4 | gate-qc | sonnet | failed | `0 → 20` | attempt 2 — prior 4 findings confirmed resolved; 1 new finding: `.page-content-narrow-fit` has a desktop override (`index.css:4244`, `width: min(31.5rem,92vw)` for the scanner) that would narrow the Ask column 36rem→31.5rem at ≥720px, contradicting the brief's width-unchanged intent; fix = keep Ask at 36rem (scope scanner override / distinct fit class) + add a 1440px width criterion; STATUS.refining; committed `045194e`; loops to define attempt 3 | 2026-10-03 |
| 3 | define | opus | ok | `0 → 32` | attempt 3 — width-override finding fixed: REQ-218 now requires re-scoping the global `narrow-fit` 31.5rem override to the scanner host (`:has(.scan)` / modifier) so Ask inherits the 36rem cap and the scanner stays 31.5rem; added a measured 1440px width criterion; brief propagated; same 4 ids, no new ids, no `-` anchors touched; STATUS.refined; committed `277aaab`; no blocker | 2026-10-03 |
| 4 | gate-qc | sonnet | ok | `0 → 11` | attempt 3 — **PASS**, no findings; all 17 proposed diff `-` anchors verified against current PRD/sections (functional-requirements, screen-layout, quick-lookup, in-depth, user-flows); REQ-218 free (last is REQ-216; REQ-217 held by life-tracker run); nothing applied to PRD/sections; STATUS.refined; committed `d8b4458` | 2026-10-03 |
| — | gate-review | sonnet | ok | `0 → 8` | build half (run graph-20261005-133503): 4 verdicts applied (all accept — REQ-218 new, REQ-110/129/206 amend), 0 edit/reject; `## Gate verdicts` recorded; no brief reconciliation (all accepts); STATUS.owner-action → refined; board row moved; committed `72b3d44` | 2026-10-05 |
| 4 | gate-qc | sonnet | ok | `0 → 9` | build-half re-grade — **PASS**, no findings; all 69 proposed diff `-` anchors re-verified against current PRD/sections (functional-requirements, screen-layout, quick-lookup, in-depth, user-flows); the 4 accept verdicts introduce no inconsistency; REQ-218 id still free; STATUS.refined; non-blocking build note — place REQ-218 between REQ-217 and REQ-219 (the diff says after REQ-216 but ids shifted since it was authored); no commit (no artifact) | 2026-10-05 |
| 5 | plan | sonnet | ok | `0 → 14` | 4 slices mapped (A scope scanner 31.5rem override + Ask `narrow-fit` frame + 1440px width criterion; B frame In-depth Enrichment station only, DEC-145 holds for Game/Zones/Cards; C `visualViewport` keyboard hook; D apply PRD/sections diffs REQ-218/110/129/206 + screen-layout/quick-lookup/in-depth/user-flows, final measured pass, ship gates); `slice-{a,b,c,d}.criteria.json` emitted, all criteria `false`; REQ-218 placement note carried to GAMEPLAN + slice D; STATUS.active; committed `4ab8916`; no blocker | 2026-10-05 |
| 6 | build | sonnet | ok | `0 → 98` | slices A–D implemented end to end; all criteria earned (A1–A8, B1–B7, C1–C4, D1–D7 true, no `false` remaining); PRD/sections truth applied by intent (REQ-218 new between REQ-217/219, REQ-110/129/206 amended; screen-layout, quick-lookup, in-depth, user-flows); REQ-206 chip clause kept at approved width-only wording (indepth sub-clause not pre-applied); scanner 31.5rem override scoped via `:has(> .idq > .flow-head .scan-exit)`; new `useVisualViewportHeight` hook; measured 1440×716 + 390×740 (Ask/In-depth col 576px, scanner 504px; send pill on-screen; keyboard-stub pill bottom 359.8/397.6 < 400); `npm run quality:check` + frontend suite (1538) + `test:scripts` (595) green; STATUS.ship-ready; **code PR #262** open (`thejudge-auto/anchor-ask-composer-work → main`, 64c846c). Return-side (REQ-193): launch porcelain identical before/after; product writes all inside the worktree (stray gitignored Playwright auto-snapshots landed in the pre-existing launch-root `.playwright-mcp/` scratch — no tracked change, assertion holds) | 2026-10-05 |
| 7 | review | opus | failed | `0 → 28` | **LOOP TO BUILD** (loop 1 of 2) — slices A/B/C PASS; one Important finding inside slice D's criteria (D-1): REQ-110 amendment in `functional-requirements.md` applied incorrectly — `- Acceptance Criteria:` header dropped and not re-added; first criterion malformed as `-  - as the user types…` (literal `-  - ` prefix, line 2702); stale duplicate bullet left (line 2707 `…while the field is expanded`) beside the new line 2706 (`…while the box is expanded`). Drifts from approved GATE-QUESTIONS REQ-110 diff; no Critical. Focus checks clean: REQ-206 chip clause width-only (collapse not pre-applied), REQ-218 between REQ-217/219, scanner 31.5rem scoped to host, other 4 edits match intent | 2026-10-05 |
| 6 | build | sonnet | ok | `0 → 7` | attempt 2 — D-1 fix: REQ-110 Acceptance Criteria corrected in `functional-requirements.md` (restored `- Acceptance Criteria:` header; fixed malformed `-  - ` first bullet to a nested bullet; deleted stale duplicate `…while the field is expanded`, keeping `…while the box is expanded`); now matches approved GATE-QUESTIONS REQ-110; only REQ-110 changed (1 hunk, 2+/2−); `npm run quality:check` green (595 pass); slice D criteria stay true; committed `25b5bdc`, pushed, PR #262 updated. Return-side (REQ-193): launch porcelain identical; sole product write `functional-requirements.md` inside the worktree | 2026-10-05 |
| 7 | review | opus | ok | `0 → 13` | attempt 2 — **APPROVE**; D-1 fully fixed (REQ-110 Acceptance Criteria now matches approved GATE-QUESTIONS block: `- Acceptance Criteria:` header + 5 nested bullets, no malformed prefix, no duplicate); fix diff confined to the REQ-110 block, no new drift; focus checks re-confirmed (REQ-206 chip clause width-only, REQ-218 between REQ-217/219 at line 5630, scanner 31.5rem scoped to `.scan-exit` host so Ask stays 36rem); no Critical/Important remaining; advance to close | 2026-10-05 |

### Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
| "Anchor the Quick + In-depth question box so typing a long question grows it in place instead of scrolling the card stage off-screen" | answered-once | shape | — |

## Intake

- `intake/GRAPH-BRIEF.md` — the owner's graph-run brief supplied at kickoff (staged at `.worktrees/.graph-intake/graph-20261003-205515/`).
