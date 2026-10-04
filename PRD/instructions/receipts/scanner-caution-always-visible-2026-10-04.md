# Receipt: scanner-caution-always-visible — 2026-10-04

**What happened:** The scanner's "experimental" caution triangle now shows from
the moment the scanner opens — on every scanner (Trade Balancer, In-Depth card
picker, Quick Lookup) — so a player whose scans never lock still gets warned.
That fix already shipped in code through the ui-pass-2 package (slice E, PR
#254), so this package closes as already-shipped: it only reconciles the
product-truth docs to the shipped behaviour and deletes the work folder.

**What it means for you:** Nothing new to merge for the behaviour — it is
already live on `main`. Merging this PR brings the written product truth
(`functional-requirements.md`, `scan/README.md`, `screen-layout.md`) into
agreement with what the app already does, and clears the work package.

- Date: 2026-10-04
- Slug: scanner-caution-always-visible
- Status: shipped (feature delivered by ui-pass-2 slice E, PR #254; this PR is docs-only — PRD reconciliation + package close)
- PR: #256 (closing PR — `thejudge-auto/scanner-caution-always-visible-work` → `main`)

## Why this closed as already-shipped

The build half cut its branch from `origin/main` after PR #254 (ui-pass-2) and
PR #255 (this package's docs proposal) had both merged. The build-half `gate-qc`
re-grade then found the feature already present in code: ui-pass-2 slice E
(commit `0ee1928`, merged in PR #254) removed the
`if (entries.length === 0) return null` guard in the shared
`apps/frontend/src/components/ScanReviewBubble.tsx`, so the caution triangle
renders from scanner open on all three surfaces at once (the component is shared
by `TradeSide`, `ZoneCardPicker`, and `QuickLookupApp`). The warning still opens
only on a triangle tap; the count pill still appears on the first held card.
That is REQ-214 exactly as this package proposed it — including B1 (all surfaces,
fix the shared component once) and B2 (count pill unchanged, triangle and pill
adjacent when both present).

Because the code was already done, there was nothing for `build` to write. The
only residual was product-truth drift: slice E amended `user-flows.md` (scan
Main Flow steps 1 & 5) but not the other three truth files, which still
described the old "caution beside the count pill / hidden until a card is held"
behaviour. The owner chose to close as already-shipped and reconcile those three
files as doc-hygiene, which this PR does.

## Actions taken

- Applied the owner-approved REQ-214 amendment (accept) to the three PRD files
  slice E left unreconciled, by intent against current live truth:
  - `PRD/sections/functional-requirements.md` — REQ-214 Description and
    Acceptance Criteria now describe the always-on caution control.
  - `PRD/sections/scan/README.md` — the count-pill Built bullet now states the
    always-on caution triangle, with the count pill alongside it once it appears.
  - `PRD/sections/screen-layout.md` — the scan Chrome row now puts the always-on
    caution control in the top-right, count pill alongside once held.
- `PRD/sections/user-flows.md` — already reconciled by slice E (PR #254); not
  re-edited.
- Stripped the `scanner-caution-always-visible` row from `PRD/work/STATUS.md`.
- Wrote this receipt and deleted `PRD/work/scanner-caution-always-visible/`.
- `PRD/sections/system-map.md` — no flip: the Card scanning surface is already
  recorded as shipped; REQ-214 is a functional requirement, not a planned
  system-map entry.

## Files changed

- Updated: `PRD/sections/functional-requirements.md`, `PRD/sections/scan/README.md`, `PRD/sections/screen-layout.md`, `PRD/work/STATUS.md`
- Created: `PRD/instructions/receipts/scanner-caution-always-visible-2026-10-04.md`
- Deleted: `PRD/work/scanner-caution-always-visible/` (IDEA.md, README.md, DESIGN-BRIEF.md, GATE-QUESTIONS.md, GRAPH-RUN.md, STATUS.owner-action, intake/)

## Verification

- Docs-only change: no code touched, so `typecheck` / `lint` / `coverage:check`
  / `test:scripts` are unaffected. `npm run format:check` green (it covers
  json/yaml; there is no markdown linter in `quality:check`, so PRD prose is not
  machine-gated).
- The shipped behaviour was verified in code: the `if (entries.length === 0)
  return null` guard is absent from `ScanReviewBubble.tsx` on this branch's base,
  and the caution triangle renders unconditionally with the count pill gated on
  `entries.length > 0` — confirmed against ui-pass-2 slice E (commit `0ee1928`).

## Graph run

- Run ID: `graph-20261004-154238` | Profile: `loaded (env sentinel)` | Terminal state: PARKED (build-half gate-qc FAIL — feature already shipped), then owner-directed close as already-shipped — land: the owner's merge of PR #256

### Node ledger

| # | Node | Model | Outcome | Heartbeat | Evidence | Date |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | preflight | haiku | ok | `0 → 11` | branch `thejudge-auto/scanner-caution-always-visible` cut from origin/main, pushed from `.worktrees/kickoff-scanner-caution-always-visible`; lock taken pid 53602; canary denied both tiers (universal rm -rf, graph nohup); Profile loaded (env sentinel); launch checkout untouched (on main) | 2026-10-04 |
| 2 | shape | sonnet | ok | `0 → 10` | package `PRD/work/scanner-caution-always-visible/` created (IDEA.md, README.md, STATUS.ideation, intake/request.md, intake/observations.md); board row added under `## ideation`; 2 receipt matches noted (trade-balancer-first-card-ux-2026-09-10, ui-look-translation-2026-10-02); intake copied→committed→staged-copy-deleted; commit a50d541 | 2026-10-04 |
| 3 | define | opus | ok | `0 → 41` | DESIGN-BRIEF.md + GATE-QUESTIONS.md written; one stable-id proposal amending REQ-214 (caution triangle shows from scanner open) with complete 4-spot diff (functional-requirements.md Description+Acceptance, scan/README.md, user-flows.md, screen-layout.md); B1 scope fork (all surfaces vs Trade Balancer only, recommend all — shared component + no-fork rule) and B2 (count-pill default) in `## Blocker questions`; PRD/sections/ untouched; STATUS.refined; no run-halting blocker; commit 4e92284 | 2026-10-04 |
| 4 | gate-qc | sonnet | ok | `0 → 10` | PASS — DESIGN-BRIEF + GATE-QUESTIONS checked; all 4 REQ-214 diff spots anchor against live PRD (functional-requirements.md 5486/5493, scan/README.md 107-111, user-flows.md 131/136, screen-layout.md 213); REQ-214 confirmed right owner (already says "every host that scans"); no other live spot needs amending; code claim re-verified (ScanReviewBubble.tsx:40 null-return); B1/B2 well-formed; one minor non-blocking nit (scan/README wording "Beside the count pill" while pill may be absent — note for build); no changes/commit; STATUS.refined stood → moved to owner-action at park | 2026-10-04 |
| — | gate-review | sonnet | ok | `0 → 32` | build-half claim: kickoff worktree removed, `thejudge-auto/scanner-caution-always-visible-work` cut from origin/main (README base→origin/main, ledger worktree→implement; commit 212d57f), pushed; lock taken pid 32963; graph canary `nohup true` denied (graph tier live). graph-gate-review applied 3 verdicts (REQ-214 accept, B1 all surfaces, B2 keep pill as-is), 0 edit/reject IDs; reconciled B2 wording in GATE-QUESTIONS.md diffs 3 & 5 (alongside the count pill once it appears) + DESIGN-BRIEF count-pill/A1/A2; PRD/sections/ untouched; STATUS.refined restored; board row owner-action→refined; commit 3175d92 | 2026-10-04 |
| 4 | gate-qc | sonnet | failed | `0 → 11` | FAIL (build-half re-entry) — premise invalidated: the always-on caution shipped in CODE while this package was in flight. ui-pass-2 slice E (commit 0ee1928, merged in PR #254 2026-10-04 23:08Z) removed `ScanReviewBubble.tsx`'s `if (entries.length === 0) return null` null-return, so the caution triangle now shows from scanner open on all three surfaces (shared component). Slice E also amended `user-flows.md` (steps 1 & 5), so the proposal's diff-4b (user-flows.md step-5 removal) no longer anchors. Slice E did NOT touch the other three PRD files — `functional-requirements.md` REQ-214 Acceptance (5493), `scan/README.md` (108-111), `screen-layout.md` (213) still describe the old "caution beside the count pill / hidden until held" behaviour, now contradicting the shipped code + user-flows.md. No code left to build; residual is PRD-truth reconciliation only. STATUS→refining (by node) → owner-action (at park) | 2026-10-04 |
| — | close | sonnet | ok | n/a | owner-directed close as already-shipped (force override, not under graph control): applied the 3 leftover REQ-214 PRD amendments (functional-requirements.md, scan/README.md, screen-layout.md) by intent against live truth; wrote this receipt (ledgers folded verbatim); stripped board row; `git rm -r PRD/work/scanner-caution-always-visible/`; opened the closing docs PR into main | 2026-10-04 |

### Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
| "In the Trade Balancer card scanner, the “experimental” caution triangle only shows after a card has been scanned, so people whose scans fail never get warned. Make it always visible in the scanner's top-right from the moment it opens (like the direction-1 mockup), with the warning popping up only when the triangle is tapped." | answered-once | shape | — |

## Intake

- `intake/request.md` — the verbatim owner request (pasted in the launch request)
- `intake/observations.md` — a referenced ui-pass-2 feedback list (pasted in the launch request); only the scanner-caution item applied to this package
