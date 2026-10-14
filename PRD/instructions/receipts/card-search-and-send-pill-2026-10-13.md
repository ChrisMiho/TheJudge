# Receipt — card-search-and-send-pill

**What happened:** Card search now finds cards without the player typing commas, dashes, apostrophes or accents (`urborg tomb` finds Urborg, Tomb of Yawgmoth), and the question box's send pill on a browser with no microphone support now shows one round send arrow instead of a half-empty pill.

**What it means for you:** Once you merge PR #305, a player on any search box (Ask a Question's Add card, In-depth details' Cards step, Trade Balancer) can type plain words, and a Firefox player no longer sees a broken-looking send button.

- **Date:** 2026-10-13
- **Slug:** `card-search-and-send-pill`
- **Status:** shipped
- PR: https://github.com/ChrisMiho/TheJudge/pull/305

## Actions taken

- Slice A: one shared search rule (`normalize` in `apps/frontend/src/lib/search.ts`) sets case, accents and punctuation aside; Ask a Question's Add card, In-depth details' Cards step and each Trade Balancer side use it (REQ-002). The no-match panel opens only when the typed text reaches its threshold after the rule is applied. Escape closes the Cards step search while the no-match message shows.
- Slice B: with no browser speech recognition the send pill shows one round send arrow; with it, the microphone half and arrow show (REQ-212, REQ-206).
- Owner amendment to REQ-002, 2026-10-13: "make the long-dash change part of this PR". Long dashes (U+2010–U+2015) count as a space, the same as a hyphen or slash, so `Human—Time Lord Meta-Crisis` is found by its two words. Applied in build attempt 2 (`cf3065e7`) and recorded in `PRD/sections/functional-requirements.md` REQ-002.
- Review: attempt 1 asked for changes (long dashes beyond accepted REQ-002; threshold counted on raw text); attempt 2 approved with Minor findings only (A7 captures predate `cf3065e7`, no NBSP unit test, 60 ms no-match flash, prettier drift outside `format:check` scope).
- Durable truth confirmed present, nothing promoted by cleanup: REQ-002 (with the owner's dash amendment), REQ-212, REQ-206 in `PRD/sections/functional-requirements.md`; `PRD/sections/quick-lookup/README.md`; `PRD/sections/system-map.md` (Card search & metadata and Fuzzy autocomplete both already `shipped`).
- Board: slug removed from `PRD/work/STATUS.md` (ship-ready section).
- Package `PRD/work/card-search-and-send-pill/` deleted with `git rm -r` (tracked files only; gitignored `.playwright-mcp/` captures stay on disk).

## Files

- Created: this receipt.
- Updated (at build, in PR #305): `apps/frontend` search, Trade Balancer, Quick Lookup, Zone step and send-pill files with tests; `PRD/sections/functional-requirements.md`, `PRD/sections/quick-lookup/README.md`, `PRD/sections/system-map.md`; `PRD/work/STATUS.md` (this node).
- Deleted: everything under `PRD/work/card-search-and-send-pill/`.

## Verification

- `slice-a.criteria.json` 8/8 and `slice-b.criteria.json` 7/7 true (self-reported by build; reviewer re-confirmed).
- Reviewer re-ran `npm --workspace apps/frontend run test` (148 files, 1,599 tests, exit 0), typecheck exit 0, eslint on 8 changed files exit 0; build reported `npm run quality:check` exit 0.
- Card-name check on the refinement method: whole name 7,324/7,324, first-two-words 7,052/7,288.
- Close preconditions: worktree on `thejudge-auto/card-search-and-send-pill-work`, `HEAD` equal to `origin/thejudge-auto/card-search-and-send-pill-work` (`0d71678c`), PR #305 open into `main`, package `ship-ready`.

## Graph run

- Run ID: `graph-20261014-034941` (build half; spec-forming half `graph-20261014-031636`) | Profile: `loaded (env sentinel)` | Terminal state: COMPLETE — land: the owner's merge of https://github.com/ChrisMiho/TheJudge/pull/305

### Node ledger

| # | Node | Model | Outcome | Heartbeat | Evidence | Date |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | preflight | haiku | ok | `0 → 8` | branch `thejudge-auto/card-search-and-send-pill` pushed (`git ls-remote` → `181b829f`) from `.worktrees/kickoff-card-search-and-send-pill`; launch checkout still on `main`; lock `.worktrees/.graph-run.lock` runId `graph-20261014-031636` | 2026-10-13 |
| 2 | shape | sonnet | ok | `0 → 15` | `PRD/work/card-search-and-send-pill/` (IDEA.md, README.md, STATUS.ideation, intake/ ×3) committed `e8af34af`; board row in `PRD/work/STATUS.md` | 2026-10-13 |
| 3 | define | opus | ok | `0 → 113` | `DESIGN-BRIEF.md`, `GATE-QUESTIONS.md` (REQ-002, REQ-212, REQ-206 amendments; no blocker), `evidence/measurements.md`, `STATUS.refined` committed `0e7cb914`; no `PRD/sections/` or code diff vs `181b829f` | 2026-10-13 |
| 4 | gate-qc | sonnet | ok | `0 → 16` | PASS, findings none; `## Preparation gate` in `README.md` committed `7a75d962`; run stops here and parks at `owner-action` | 2026-10-13 |
| 5 | gate-review | sonnet | ok | `0 → 14` | build half run `graph-20261014-034941`: kickoff worktree removed clean (`git worktree remove`); claim commit `6cfd3493` on `thejudge-auto/card-search-and-send-pill-work` cut from `origin/main` `f84e22b1` (docs PR #304 merge), pushed; lock taken from the launch root; universal canary `rm -rf .worktrees/.graph-canary-nonexistent` and graph canary `nohup true` both denied; `graph-gate-review` commit `607591e5`: 3 accept / 0 edit / 0 reject, `### Brief reconciliation` none; `STATUS.refined` only marker; board row under refined; `git diff --stat origin/main HEAD -- PRD/sections apps scripts docs` empty; worktree and launch-checkout porcelain empty | 2026-10-13 |
| 4 | gate-qc | sonnet | ok | `0 → 9` | build-half re-grade PASS, findings none (two cosmetic non-blocking notes recorded); all five `GATE-QUESTIONS.md` anchors match `PRD/sections/functional-requirements.md` on `573ef8df`; node wrote nothing (porcelain empty, HEAD unchanged); driver rewrote `README.md` `## Preparation gate` | 2026-10-13 |
| 5 | plan | sonnet | ok | `0 → 11` | commit `0a7b1fe0`: `GAMEPLAN.md`, `slice-a-card-search-punctuation.md` + `slice-a.criteria.json` (8 criteria, all false), `slice-b-no-mic-send-pill.md` + `slice-b.criteria.json` (7, all false); `STATUS.active` only marker; board row under active; every file the slices name exists on the branch; no deliverable planned inside `PRD/work/`; process note: node edited with Bash heredocs instead of Write/Edit (self-reported; diff limited to the package and `PRD/work/STATUS.md`) | 2026-10-13 |
| 6 | build | sonnet | ok | `0 → 90` | PR https://github.com/ChrisMiho/TheJudge/pull/305 (`thejudge-auto/card-search-and-send-pill-work → main`, OPEN, READY title, registration marker in body); head `d2b12df3` = `origin/thejudge-auto/card-search-and-send-pill-work` (slice A `2f8d5270`); 22 files vs `9aac0d23` (12 frontend, 3 `PRD/sections/`, package + board); `slice-a.criteria.json` 8/8 and `slice-b.criteria.json` 7/7 true — self-reported (hook evidence log does not see worktree criteria files), evidence quoted in slice status notes; node reports `npm run quality:check` exit 0 and 1595 frontend tests passing; launch-checkout `git status --porcelain` identical before/after (empty); `classifyBuildWrites` over every reported path → `outcome ok, outside []`; worktree porcelain empty; `STATUS.ship-ready` only marker | 2026-10-13 |
| 7 | review | opus | failed | `0 → 34` | CHANGES REQUIRED (loop 1 of 2 to `build`): Important 1 — `search.ts:18` maps U+2010–U+2015 dashes to a space beyond accepted REQ-002 (hyphen or slash only), A4 first-two-words 7,051 of 7,288 vs floor 7,052 on the refinement method (miss: Human—Time Lord Meta-Crisis); Important 2 — threshold counted on raw text at `TradeSide.tsx:99` and `QuickLookupApp.tsx:376` (REQ-002: counted after the rule), so `,` / `,,,` open a no-match panel; Minor — Escape inert in Cards step while no-match shows (`ZoneCollectionStep.tsx:303-306, 419-424`), 60 ms no-match flash, tabs/NBSP dropped not spaced (`search.ts:19-20`), REQ-002 note build numbers on non-refinement denominators; slice B approved; reviewer re-ran frontend suite 148 files / 1,595 tests exit 0; driver confirmed both Important findings against the code and `GATE-QUESTIONS.md` lines 39, 41 | 2026-10-13 |
| 6 | build (attempt 2) | sonnet | ok | `0 → 61` | commit `cf3065e7` = `origin/thejudge-auto/card-search-and-send-pill-work` (PR #305): owner amendment relayed mid-node (long dashes U+2010–U+2015 count as a space; instruction ledger row, `GATE-QUESTIONS.md` REQ-002 amendment line) — `normalize` keeps `[-/‐-―]` → space and now collapses whitespace before dropping marks (`search.ts:13-23`); panel gate `normalize(...).length` at `TradeSide.tsx:99` and `QuickLookupApp.tsx:376`; Escape closes the Cards step search while no-match shows (`ZoneCollectionStep.tsx`); tests added in `search.test.ts`, `TradeSide.test.tsx`, `QuickLookupApp.test.tsx`, `ZoneCollectionStep.test.tsx`; A4 refinement method: whole name 7,324/7,324, first-two-words 7,052/7,288 dash-as-space (7,051 prototype; only difference Human—Time Lord Meta-Crisis); REQ-002 wording and note updated; node reports 1,599 frontend tests and `npm run quality:check` exit 0; criteria 8/8 + 7/7 true (self-reported); launch porcelain identical (empty); `classifyBuildWrites` → `ok, outside []`; old-rule draft reverted before any commit (node report) | 2026-10-13 |
| 7 | review (attempt 2) | opus | ok | `0 → 35` | APPROVE, no Critical or Important; all four fixes confirmed in code and test; REQ-002 matches the accepted diff plus the owner dash amendment (`GATE-QUESTIONS.md:75`); slice B unchanged since `d2b12df3`; reviewer re-ran `npm --workspace apps/frontend run test` (148 files, 1,599 tests, exit 0), `typecheck` exit 0, eslint on 8 changed files exit 0, its own A4 count on `cardMetadata.json` → whole name 7,324/7,324, first-two-words 7,052/7,288; Minor only: A7 captures predate `cf3065e7` (behaviours unchanged), no NBSP unit test (verified on real list), 60 ms no-match flash, prettier drift outside `format:check` scope; worktree clean, HEAD `11f47a48` unchanged | 2026-10-13 |

### Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
| "i want to fix @PRD/ideasForLater/hardtofind/hardtosearch.md" | answered-once | shape | — |
| "the button that is broken is the voice button in the question box, it just doesnt show" | answered-once | shape | — |
| "so the issue is that the button looks like its there, but the text/icon on the box isnt there, is there anyway we can confirm this on our end?" | answered-once | shape | — |
| "make the long-dash change part of this PR" | answered-once | build | — |

## Intake

- `intake/firefox-mic-sim-box.png` — launch-session screenshot of the Firefox send-pill defect, supplied by the owner in the `/graph-kickoff` launch request
- `intake/hardtosearch.md` — copied verbatim from `PRD/ideasForLater/hardtofind/hardtosearch.md`, the file the owner named in the launch request
- `intake/owner-clarifications.md` — the owner's two clarifying answers (quoted) and the driver's launch-session measurements, written in the `/graph-kickoff` launch session before node 1
