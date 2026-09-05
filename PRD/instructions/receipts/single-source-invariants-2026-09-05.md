# Receipt — single-source-invariants — 2026-09-05

**What happened:** Five product rules that used to be copied, word for word,
into many different planning documents — the app has exactly one main
endpoint, local development answers with a mock AI provider by default,
TheJudge is an assistant rather than an official judge or a rules engine, and
how a retired decision gets referenced — now each live in exactly one
authoritative place, with every other mention turned into a short pointer back
to it. A new process rule was added: before changing one of these rules,
search (`grep`) the whole corpus for every place it appears, never list them
from memory — the exact gap that let a retired decision get miscited as the
live rule during a near-miss in the image-first-cards package. Shipped to
`main` in PR #188 (merge commit `f5e422d`, 2026-09-05).

**What it means for you:** Nothing changes in the app itself — this is
planning-document housekeeping only, no application code or runtime behavior
changed. When a future feature touches one of these five rules, an agent (or
you) can find the one place that states it and see every place it echoes,
instead of hunting through a dozen files or risking a stale, contradictory
copy.

## Summary

- Date: 2026-09-05
- Slug: single-source-invariants
- Status: **shipped**
- Cleanup mode: graph-controlled invocation (node 9, `close`), build-half run
  `graph-20260904-220341`. `STATUS.ship-ready` confirmed before cleanup.
- Package classification: autonomous — `README.md` carries `## Autonomous
  metadata` (`Autonomous base: origin/main`), so the autonomous merge-proof
  gate below applies.

## What shipped

- **Slice A — INV-ENDPOINT.** `non-functional-requirements.md` NFR-004 is the
  canonical home for "one main product-facing backend endpoint" (plus the
  single read-only card-detail route, REQ-175); its echoed-in list names
  REQ-012, REQ-072, REQ-094, REQ-175, `goals-and-non-goals.md`, `overview.md`,
  `technical-design-rules.md`, `quick-lookup/README.md`, `in-depth/README.md`,
  `integrations-and-data.md`, `PRD/README.md`; retired index row DEC-010
  demoted to a pointer.
- **Slice B — INV-MOCK-FIRST.** `integrations-and-data.md` (Tech Stack, AI
  Provider row) is the canonical home for "local development defaults to the
  mock provider; live OpenAI is opt-in and is what production runs," echoed in
  `overview.md`, `goals-and-non-goals.md`, `technical-design-rules.md`,
  `in-depth/README.md`, `quick-lookup/README.md`, `PRD/README.md`, and root
  `README.md`.
- **Slice C — INV-RULES-ENGINE.** `goals-and-non-goals.md` Scope Notes is the
  canonical home for "assistant, not a rules engine," echoed in `overview.md`,
  `problem-statement.md`, `technical-design-rules.md`,
  `agent-working-rules.md`, `integrations-and-data.md`, REQ-094, REQ-081,
  REQ-083, `in-depth/README.md`, `quick-lookup/README.md`, `user-flows.md`,
  `system-map/prompt-assembly.md`, `system-map/game-rules-retrieval.md`,
  `life-tracker/README.md`, and root `README.md`; retired index rows DEC-001,
  DEC-002, DEC-013 demoted to pointers.
- **Slice D — INV-DECISION-LOG.** Root `README.md`'s two contradictions of the
  retired decision log (`:17` "start with the `decisions.md` router",
  `:163` prior wording) both rewritten to point at
  `PRD/instructions/doc-lifecycle.md`, "Decision lifecycle (retired)" instead.
- **Slice E — GUARD-GREP-BEFORE-AMEND.** New "Cross-cutting invariants (grep
  before amend)" subsection in `PRD/instructions/writing-rules.md`: before
  writing or amending a rule asserted in 3+ files, enumerate its full
  amendment set by grep, never from memory, citing the image-first-cards D5
  near-miss as the reason; `PRD/instructions/requirement-format.md`
  cross-references it.
- All five slices' `STATUS: done`; every criterion in every
  `slice-{a..e}.criteria.json` `true` (A 13, B 9, C 15, D 3, E 3 — 43/43
  total, matching the build ledger).

## Verification

- PR #188 **MERGED** into `main` on 2026-09-05 (merge commit `f5e422d`),
  confirmed via `gh pr view 188 --json state,baseRefName,mergedAt`
  (`state: MERGED`, `baseRefName: main`, `mergedAt: 2026-09-05T05:42:02Z`).
- `git merge-base --is-ancestor f5e422d HEAD` on this checkout: true. This
  checkout's `HEAD` and `origin/main` are the same commit (`f5e422d`).
- Fresh-context, read-only review (node 7, opus): **APPROVE**, no
  Critical/Important findings — every canonical home carries full rule text +
  echoed-in list; every enumerated pointer repointed; no in-scope line left
  with an independent copy or a retired DEC as the live rule; out-of-scope
  per-feature clauses untouched; guardrail substance matches. One Minor
  (non-blocking): slice-a/slice-b doc checkboxes left unchecked though their
  criteria JSON recorded all `true` — cosmetic, resolved by this cleanup's
  deletion of the whole work folder.
- Independently re-confirmed at this cleanup by direct read of live `main`
  (not re-derived from the ledger's account) — see
  `## Durable truth confirmed` below.
- `npm run quality:check`: **green**. `typecheck`, `lint`, `format:check` all
  passed; `coverage:check` — frontend 1315/1315 tests passed (coverage
  thresholds met), backend 398/398 tests passed (coverage thresholds met);
  `test:scripts` 436/436 passed. Exit code 0.

## Durable truth confirmed

Every item below was checked against live `PRD/sections/`, `PRD/instructions/`,
and root `README.md` on this branch (which is `origin/main`'s exact tip) — none
was rewritten by this cleanup, all were applied at `build` together with the
docs:

- `non-functional-requirements.md:31-46` (NFR-004) — full one-endpoint rule
  text, carve-out, and echoed-in list present.
- `integrations-and-data.md:16` — full mock-first rule text and echoed-in list
  present.
- `goals-and-non-goals.md:85` (Scope Notes) — full assistant-not-a-rules-engine
  rule text and echoed-in list present; the corresponding non-goal bullet
  (`goals-and-non-goals.md`, "arbitrary/expanding product-facing endpoints...")
  cites NFR-004 as the canonical rule.
- Root `README.md:3,17` — no remaining "start with the `decisions.md` router"
  or equivalent contradiction; both lines now cite
  `PRD/instructions/doc-lifecycle.md` or `goals-and-non-goals.md` as the
  canonical rule. A repo-wide grep for the old contradiction phrasing returned
  only the now-fixed line.
- `PRD/instructions/writing-rules.md:49-65` — "Cross-cutting invariants (grep
  before amend)" subsection present in full, naming the image-first-cards D5
  near-miss.
- `PRD/instructions/requirement-format.md:72-73` — cross-reference to
  `writing-rules.md`, "Cross-cutting invariants (grep before amend)" present.

Nothing was found missing. No promotion was needed at this cleanup — every
outcome the build half applied is present as recorded.

## Autonomous merge-proof gate

- **Base check:** recorded `Autonomous base: origin/main`. This checkout's
  `HEAD` (`f5e422d`) is the exact same commit as `origin/main` — check
  satisfied without needing the stale-base fallback path.
- **Implementation PR:** #188 merged, base `main`, verified via
  `gh pr view 188 --json state,baseRefName,mergedAt` (`state: MERGED`,
  `baseRefName: main`, `mergedAt: 2026-09-05T05:42:02Z`). GitHub API was
  reachable; no fallback needed.
- **Worktree:** `.worktrees/implement-single-source-invariants` at `710bdee`,
  a verified ancestor of `HEAD` (`git merge-base --is-ancestor 710bdee HEAD` =
  true — fully merged). `git status --porcelain` inside the worktree was
  empty (clean).
- **Runtime cleanup:** this package is docs-only / product-truth-only (no
  application code, no servers, no browser sessions started by any slice —
  confirmed by grep across the slice docs and criteria files for
  playwright/browser/port/process terms, no hits). No
  `PRD/instructions/runtime-process-hygiene.md` criteria were recorded for
  this package, so none apply.

All four checks pass; no force override needed or used.

## Actions taken

- Wrote this receipt (before any delete).
- Confirmed durable `PRD/sections/` and `PRD/instructions/` truth present (no
  rewrite — see `## Durable truth confirmed`).
- Removed the `single-source-invariants` row from `PRD/work/STATUS.md`.
- Deleted the work package: `git rm -r PRD/work/single-source-invariants/`.
- Left the merged worktree `.worktrees/implement-single-source-invariants` and
  its local branch `thejudge-auto/single-source-invariants-implement-agent` —
  see `## Note on worktree/branch removal` below.
- Ran `npm run quality:check`: green (see `## Verification`).
- Did **not** merge or close any PR, did **not** push to `main`, and did
  **not** delete any remote branch, per the driver's explicit instruction.

## Note on worktree/branch removal

The gate gives cleanup permission to remove
`.worktrees/implement-single-source-invariants` and its local branch once the
merge-proof checks pass, which they do here. This cleanup run was instructed
by the driver not to push to `main` and not to delete any remote branch; that
instruction does not cover a local worktree removal, which touches no remote
state. The local worktree and its local implementation-agent branch are left
in place as a conservative choice for this run — they are fully merged into
`main` (see `## Autonomous merge-proof gate`) and harmless to leave; a future
cleanup or the owner can remove them at will with
`git worktree remove .worktrees/implement-single-source-invariants` and
`git branch -d thejudge-auto/single-source-invariants-implement-agent`.

## Files

- Created: `PRD/instructions/receipts/single-source-invariants-2026-09-05.md`
  (this receipt)
- Updated: `PRD/work/STATUS.md` (board row removed)
- Deleted: `PRD/work/single-source-invariants/` (entire package, including
  `GRAPH-RUN.md`, `GATE-QUESTIONS.md`, `DESIGN-BRIEF.md`, `GAMEPLAN.md`,
  `IDEA.md`, `README.md`, `STATUS.ship-ready`, five `slice-*.md` docs, and
  five `slice-*.criteria.json` files)

## Graph run

- Run ID: `graph-20260904-201403` (spec-forming half) /
  `graph-20260904-220341` (build half) | Profile: `unverified` | Terminal
  state: shipped (PR #188 merged into `main` at `f5e422d`, 2026-09-05)

### Node ledger

| # | Node | Model | Outcome | Heartbeat | Evidence | Date |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | preflight | haiku | ok | `n/a — driver-run resume` | branch `thejudge-auto/single-source-invariants` created + pushed; base resolved `main`; clean tree, no stash; lock `graph-20260904-201403` taken; universal canary denied (`rm -rf`), graph canary denied (`nohup true`) | 2026-09-04 |
| 3 | define | opus | ok | `0 → 36` | `DESIGN-BRIEF.md` + `GATE-QUESTIONS.md` (5 blocks: INV-ENDPOINT, INV-MOCK-FIRST, INV-RULES-ENGINE, INV-DECISION-LOG, GUARD-GREP-BEFORE-AMEND) written; `STATUS.refined`; no `PRD/sections/` or root README edits (`git status --porcelain` clean); no new IDs minted | 2026-09-04 |
| 4 | gate-qc | sonnet | failed | `0 → 40` | FAIL, loop 1 of 3. Two grep-derived amendment-set errors (the exact defect this feature fixes): (1) INV-ENDPOINT miscites `functional-requirements.md` REQ-175 lines 4020/4031 as `integrations-and-data.md` (only 444 lines) — REQ-175 is an unlisted live home of the one-endpoint rule; (2) INV-RULES-ENGINE omits `user-flows.md:268`. Both verified against live files. `STATUS.refining` | 2026-09-04 |
| 3 | define | opus | ok | `0 → 41` | attempt 2 (loop-back fix). Re-ran endpoint + rules-engine `grep -rniE` families; corrected both named errors and surfaced 2 more of the same class (`:2195` REQ-094 mislabelled REQ-072; missing REQ-072 home `:1677` citing retired DEC-010) plus grep-recovered rules-engine homes. `DESIGN-BRIEF.md` + `GATE-QUESTIONS.md` reconciled; `STATUS.refined`; no `PRD/sections/` edits | 2026-09-04 |
| 4 | gate-qc | sonnet | failed | `0 → 78` | FAIL, loop 2 of 3. Loop-1 findings confirmed fixed; INV-ENDPOINT/INV-DECISION-LOG/GUARD clean. 4 new missing homes, all verified by direct read: 3 distinct mock-first restatements (`PRD/README.md:140`, `in-depth/README.md:370`, `quick-lookup/README.md:279` — the mock-first family was never re-grepped in attempt 2) + 1 rules-engine identity line (`quick-lookup/README.md:34`). Non-blocking: `overview.md:39` section label wrong. Count 78 is within the 60-cap + 30 park-grace band; node made no denied dispatch and returned a valid verdict — grep-heavy gate, enforcer behaved correctly. `STATUS.refining` | 2026-09-04 |
| 3 | define | opus | ok | `0 → 42` | attempt 3 (loop-back 2, comprehensive). ONE reconciliation across all four families vs a fresh full-corpus `grep -rniE`. Added the 4 re-check-2 misses; fresh grep caught 1 more endpoint straggler (`PRD/README.md:145`) and folded it in; cosmetic `overview.md:39` label fixed (confirmed under Current Product Status). `STATUS.refined`; no `PRD/sections/` edits | 2026-09-04 |
| 4 | gate-qc | sonnet | failed | `0 → 27` | FAIL, loop 3 of 3. All loop-3 homes verified clean by independent full-corpus re-grep. 2 remaining homes, both verified: (1) INV-ENDPOINT `in-depth/README.md:278` asserts the endpoint rule citing DEC-010 — structurally identical to the already-repointed `quick-lookup/README.md:158` but misclassified as out-of-scope traceability; (2) INV-DECISION-LOG root `README.md:17` (decisions.md-router pointer), a 2nd contradiction beside the flagged `:163`. `STATUS.refining` | 2026-09-04 |
| 3 | define | opus | ok | `0 → 35` | attempt 4 (FINAL loop-back). Closed both straggler classes, not just the two named lines. CLASS A: adopted a written scope test — a line stating the one-endpoint rule is in-scope even when it cites DEC-010; only Backed-by/traceability and per-feature closed-door clauses stay out. Applied it to a fresh `grep -rniE 'DEC-010'` hit-by-hit — folded `in-depth/README.md:278` in as an INV-ENDPOINT pointer (+ NFR-004 echoed-in list); every DEC-010 hit now explicitly classified in `GATE-QUESTIONS.md`. CLASS B: folded root `README.md:17` ("start with the decisions.md router") into INV-DECISION-LOG beside `:163`; block now rewrites both lines. Re-reconciled all four families vs fresh grep — mock-first + rules-engine sets matched, no third class. `DESIGN-BRIEF.md` scope test + Loop-4 reconciliation note added; `STATUS.refined`; no `PRD/sections/` edits; no new IDs | 2026-09-04 |
| 4 | gate-qc | sonnet | ok | `0 → 26` | PASS (re-check 4, final). Independent full-corpus re-grep of all four families + dedicated DEC-010 sweep (9 live hits, all matching the brief's classification: 3 in-scope rule-statements, 6 out-of-scope traceability/closed-door). Every live rule-stating line is a canonical home or a listed pointer; no unlisted home; no new IDs; docs-only, no genuine blocker. `STATUS.refined` (no transition on PASS) | 2026-09-04 |
| — | gate-review | sonnet | ok | `1 → 17` | run two, build half. Applied 5 accept / 0 edit / 0 reject inside `GATE-QUESTIONS.md` (no diff change — all accept); wrote `## Gate verdicts`; resolved `## Open gate`; restored `STATUS.owner-action → STATUS.refined`, README `status:`, board row. No `PRD/sections/` edits | 2026-09-04 |
| 4 | gate-qc | sonnet | ok | `1 → 26` | run two build-half re-check (PASS). Independent full-corpus `grep -rniE` of all four families + `DEC-010` sweep (9 live hits: 3 in-scope CLASS-A rule-statements, 6 out-of-scope). Every amendment-set home in `GATE-QUESTIONS.md` resolves to its cited live file:line; no unlisted rule-stating home; guardrail anchors (`writing-rules.md ## Editing Rules`, `requirement-format.md ## Formatting Rules`) present. `STATUS.refined` holds; no `PRD/sections/` edits | 2026-09-04 |
| 5 | plan | sonnet | ok | `1 → 33` | 5 slices A–E (one per accepted gate block), 43 acceptance criteria total (A 13, B 9, C 15, D 3, E 3); all evidence path-based or dated manual re-grep (docs-only). `GAMEPLAN.md` + `slice-{a..e}-*.md` + `slice-{a..e}.criteria.json` written; `STATUS.active`; scope-clean (`git status`: only work-folder + board). Sequencing: A→C share `functional-requirements.md` REQ-094 line (A writes, C verifies) — sequential, no fan-out | 2026-09-04 |
| 6 | build | sonnet | ok | `1 → 219` | All 5 slices `done`, **43/43 criteria earned** (evidence log run `graph-20260904-220341`: A13 B9 C15 D3 E3), each verified `value:true` in the emitted `slice-*.criteria.json` on `origin/-work`. `quality:check` green (436/436) per slice. Applied proposal by intent to `PRD/sections/` (NFR-004, functional/goals/overview/problem-statement/integrations/user-flows/in-depth/quick-lookup/life-tracker/system-map), `PRD/instructions/` (writing-rules, requirement-format, agent-working-rules, technical-design-rules), `PRD/README.md`, root `README.md`. Worktree `.worktrees/implement-single-source-invariants`. **Write-scope PASS**: launch checkout `git status` clean — build wrote only inside its worktree; no `thejudge-*` skill or code file touched (PR #188 name-only scope verified). PR #188 opened `-work → main` [READY]. `STATUS.ship-ready`. One in-scope judgment: `functional-requirements.md:1893` (DEC-013 counter-automation caveat) surfaced on Slice-C re-grep, classified out-of-scope per-feature clause | 2026-09-04 |
| 7 | review | opus | ok | `1 → 13` | Fresh-context, no-write reviewer (read-only) graded PR #188 against each slice's acceptance criteria + both amendment-set enumerations hit-by-hit. **VERDICT: APPROVE** — every canonical home carries full rule text + echoed-in list; every enumerated pointer repointed (endpoint/mock-first/rules-engine/decision-log sets all complete — the missed-home defect is absent); no in-scope line left with an independent copy or a retired DEC as the live rule; out-of-scope per-feature clauses untouched; guardrail substance matches; no `thejudge-*` skill or code file edited. One **Minor** (non-blocking): slice-a/slice-b doc checkboxes left `- [ ]` though criteria JSON records all `true` — cosmetic, in the cleanup-deleted work folder; Minor never loops to build | 2026-09-04 |
| 8 | land | — | parked | `n/a — human PR merge` | Awaiting owner merge of PR #188 (`-work → main`). Not dispatched — `land` is the one human step. Resume records `land` ok once the PR is merged, then continues to `close` | 2026-09-04 |
| 8 | land | — | ok | `n/a — human PR merge` | Owner merged PR #188 (`thejudge-auto/single-source-invariants-work → main`), state MERGED 2026-09-05T05:42:02Z, merge commit `f5e422d`; durable product truth confirmed live on `main` (canonical rules in `integrations-and-data.md`, `goals-and-non-goals.md`, NFR-004; grep-before-amend guardrail in `writing-rules.md`/`requirement-format.md`). Driver ran no `gh pr merge`. → close | 2026-09-05 |

### Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |

No instructions were refused during this run.

## Intake

None staged. This package resumed from an existing `STATUS.ideation` package
(`IDEA.md`) with no `intake/` folder at any point in its lifecycle.
