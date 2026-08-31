# Receipt — prompt-context-refinement

**What happened:** Quick Question (the short-form rules-lookup path) now lets a
player attach up to five cards instead of one, and answers combo questions
about them even when the cards don't fully assemble a known combo — it names
what's missing and what would fill that role, instead of staying silent. The
guardrail that used to reject valid Magic language (asking about a "combo"
came back "combo isn't a mechanic") now recognizes common phrasing, backed by
a maintained glossary explaining what each phrase means. A new readable
prompt-layout doc replaces "an overwhelming amount of json" for anyone
inspecting what the backend actually sends the model. A worked-solutions
evaluation set (real hard rules questions with published answers, sourced and
licensed) now exists to validate answer quality going forward. All five
slices shipped, 28/28 acceptance criteria met, full suite green, and an
independent review approved the work with no blocking findings.

**What it means for you:** both PRs are already merged — #152 landed the
implementation on this package's branch, and #151 already carried that branch
into `main`. Because #151 merged before this cleanup ran (out of the usual
order), this cleanup's own changes — this receipt, the durable-truth check,
and deleting the work folder — aren't on `main` yet. The graph-run driver will
push this branch and open one more small `…-v2` → `main` PR for you to merge;
after that, everything from this feature is fully closed out.

---

- Date: 2026-08-31
- Slug: `prompt-context-refinement`
- Status: shipped — all 5 slices' acceptance criteria met (28/28), independent
  review APPROVE, `npm run quality:check` green
- Run: graph-run, Run ID `graph-20260830-154444` (run three, resumed from the
  `owner-action`/`land` park)

## What shipped, by axis

1. **Multi-card lookup — backend** (REQ-167, REQ-094 amended, REQ-095;
   slice A). `askAiRequest.ts`'s lookup schema takes a bounded list of at most
   5 oracle-level cards in place of the single optional card (a 6th is
   rejected). Zero- and one-card lookup behave exactly as before. With 2+
   cards, every attached card gets full metadata + WotC rulings, and the
   System 3 supplemental-rules query is built from the question plus every
   attached card's oracle text and type line. Combo matching qualifies a
   candidate on containing *any one* attached card, ranks candidates covering
   more of the attached set ahead of those covering fewer (before Commander
   Spellbook popularity), and classifies a candidate **complete** only when
   every ingredient slot is filled somewhere in the attached set — otherwise
   **partial**, and the answer names each missing ingredient's own identity or
   template/category (never a card recommendation).
2. **Multi-card lookup — frontend** (REQ-167, FLOW-023; slice B). The
   pre-submit view supports adding/previewing/removing multiple cards via
   typed search or camera scan; a 6th add attempt is blocked with a stated
   "you've added 5 cards" message. Submit carries the full attached list;
   follow-ups re-send the frozen 5-card set. Verified live with Playwright MCP
   at 390×844 and 1440×900 (5 real cards added, 6th blocked, frozen follow-up
   confirmed from the backend request log; the existing per-image cap already
   holds for the multi-card strip, recorded on `screen-layout.md`).
3. **Guardrail phrasing + glossary** (REQ-168; slice C). The lookup guardrail
   stays a single instruction line in the assembled prompt (no classifier, no
   detection branch) but its wording now covers common non-official Magic
   phrasing (combo, aggro/control/ramp/tempo/stax, etc.), each backed by a new
   maintained glossary doc (`PRD/sections/system-map/lookup-phrasing-glossary.md`)
   that names the category, its example phrases, and what each phrase means.
   The off-domain refusal persona is still reserved for genuinely non-Magic
   input (golden fixture confirms it).
4. **Prompt-layout spec** (REQ-169; slice D). A new doc
   (`PRD/sections/system-map/prompt-layout-spec.md`) lists every prompt
   section in real assembly order with a plain one-line description and a
   presence matrix across the four paths (game, lookup-with-cards,
   lookup-no-card, follow-up), checked against the code and against real
   `npm run prompt:preview` output — not written from memory. Cross-linked
   from `prompt-assembly.md`, `quick-lookup/README.md`, `in-depth/README.md`.
   Docs-only; no code, contract, or runtime change.
5. **Worked-solutions eval set** (NFR-018; slice E). A committed set of real
   hard rules questions with published worked solutions, each documenting its
   source/provenance and confirming licensing permits committing it, running
   through the existing eval harness with no new runtime dependency or live
   call. `npm run quality:check` stays unaffected — the set is a non-gating,
   opt-in validation track.

Refinement (the design brief and the REQ-167/REQ-094/REQ-095/REQ-168/REQ-169/
FLOW-023/NFR-018 edits) was authored inside this graph run (nodes 3–4, two
runs of gate-qc loops plus a gate-review applying the owner's verdicts) and
landed on `main` via PR #151 before this cleanup ran.

## Durable truth — verified, not re-minted

`PRD/sections/functional-requirements.md` (REQ-167, REQ-094 amended,
REQ-169, REQ-168), `PRD/sections/user-flows.md` (FLOW-023), and
`PRD/sections/non-functional-requirements.md` (NFR-018) all carry their full,
current bodies at `HEAD` — written during `define`/`gate-review`, already on
`main` via PR #151. Confirmed present and accurate against the shipped code
at cleanup (`grep -n` on each ID; REQ-094/REQ-167's mutual amend notes and the
complete/partial lookup-combo semantics read consistently). No new stable ID
was minted at cleanup, and none was needed.

**`PRD/sections/system-map.md` promotion gate: no flip needed.** This
feature's two touched catalog entries — **Quick Lookup** and **Commander
Spellbook combo retrieval** — were already `Status: shipped` before this
package started (both predate it); this work amends already-shipped
functionality rather than promoting something newly built from `planned` or
`partial`. Neither entry carried a `planned`/`partial` tag to flip. (Their
`Summary`/`Lives in` prose still describes the pre-multi-card shape and could
be refreshed in a future pass, but that's a content-freshness note, not a
status-promotion action, and was out of this cleanup's scope.)

## Actions taken

- [x] Verified all 5 slices' criteria files: `slice-a.criteria.json` (7/7),
      `slice-b.criteria.json` (7/7), `slice-c.criteria.json` (5/5),
      `slice-d.criteria.json` (5/5), `slice-e.criteria.json` (4/4) — 28/28
      criteria `true`, no `false` remaining.
- [x] Independent node-7 review (opus, no-write reviewer) verdict: **APPROVE**
      — all 5 slices PASS against their acceptance criteria; no
      Critical/Important findings; 1 Minor (expected slice A/C interaction,
      no action needed).
- [x] Autonomous merge-proof gate — all four checks verified independently at
      cleanup; see `## Merge-proof gate` below.
- [x] Durable-truth verification: REQ-167/REQ-094/REQ-095/REQ-168/REQ-169/
      FLOW-023/NFR-018 confirmed present and accurate at `HEAD`; no edit made.
- [x] System-map promotion gate checked: no `planned`/`partial` → `shipped`
      flip needed (see above).
- [x] `PRD/work/prompt-context-refinement/GRAPH-RUN.md`'s `## Node ledger` and
      `## Instruction ledger` folded verbatim into `## Graph run` below,
      before the package folder was deleted.
- [x] `## Intake` recorded below, before delete.
- [x] `PRD/work/STATUS.md` — removed the `prompt-context-refinement` row from
      the `## owner-action` section (its only listing).
- [x] `PRD/work/prompt-context-refinement/` deleted via `git rm -r`.
- [x] `.worktrees/implement-prompt-context-refinement/` removed (clean,
      fully merged per merge-proof check 3) via `git worktree remove`, and its
      local branch `implement/prompt-context-refinement-1788133896` removed
      via `git branch -d`. No remote branch was deleted.
- [x] `npm run quality:check` re-run independently at cleanup, after the
      delete — see `## Verification results` below.
- [x] All of the above committed on the current branch
      `thejudge-auto/prompt-context-refinement-v2`. Not pushed; no PR opened
      or merged by this node — the graph-run driver owns that step.

## Merge-proof gate

1. **Current branch equals recorded base.** `git branch --show-current` →
   `thejudge-auto/prompt-context-refinement-v2`, matching `README.md`'s
   `Autonomous base: origin/thejudge-auto/prompt-context-refinement-v2`
   exactly. **Met** — direct path, no deleted-base fallback needed.
2. **PR merged into the recorded base, verified via `gh`.** GitHub API was
   reachable. `gh pr view 152 --json state,baseRefName,mergedAt,mergeCommit` →
   `state: MERGED`, `baseRefName: thejudge-auto/prompt-context-refinement-v2`,
   `mergedAt: 2026-08-31T02:11:40Z`, merge commit
   `f3d3dc8c7bdb3cdeb1763fa3c0ea08bf922c89d1`. **Met.** (`gh pr view 151` also
   confirmed `MERGED`, base `main`, `mergedAt: 2026-08-31T04:27:47Z`, merge
   commit `c99ae0350ea83311fecad4dd500b4fedd4a3ed96` — the design+implementation
   already reaching `main`, per the order wrinkle noted above.)
3. **Worktree fully merged.** `.worktrees/implement-prompt-context-refinement/`
   reports empty `git status --porcelain`, and
   `git log --oneline origin/thejudge-auto/prompt-context-refinement-v2..HEAD`
   run from inside it returns nothing — its tip is not ahead of the merged
   base. **Met.**
4. **Runtime-cleanup criteria.** Slice B's recorded evidence
   (`slice-b.evidence.md`, entry B7): `browser_close` was called after the
   last interaction ("No open tabs" confirmed); the dev server background task
   (ports 3911/5911, started and owned by that agent) was stopped via
   `TaskStop`; `lsof -i :3911 -i :5911` returned no listeners afterward,
   confirming both ports released; screenshot captures were written under the
   package's own `.playwright-mcp/` and left untracked/ignored, none staged.
   **Met.**

## Files created

- `PRD/instructions/receipts/prompt-context-refinement-2026-08-31.md` (this
  file)

## Files updated

- `PRD/work/STATUS.md` — removed the `prompt-context-refinement` row from the
  `## owner-action` section

## Files deleted

- `PRD/work/prompt-context-refinement/` (entire work folder, via `git rm -r`):
  `README.md`, `DESIGN-BRIEF.md`, `GAMEPLAN.md`, `GATE-QUESTIONS.md`,
  `GRAPH-RUN.md`, `IDEA.md`, `RAG-DEFERRED.md`, `STATUS.owner-action`,
  `STATUS.ship-ready`, `slice-a-multi-card-backend.md` +
  `slice-a.criteria.json`, `slice-b-multi-card-frontend.md` +
  `slice-b.criteria.json` + `slice-b.evidence.md`,
  `slice-c-guardrail-phrasing.md` + `slice-c.criteria.json` +
  `slice-c.evidence.md`, `slice-d-prompt-layout-spec.md` +
  `slice-d.criteria.json` + `slice-d.evidence.md`,
  `slice-e-worked-solutions-eval.md` + `slice-e.criteria.json`,
  `intake/MANIFEST.md`, `intake/promptRefinement-notes.md`
- `.worktrees/implement-prompt-context-refinement/` (autonomous implementation
  worktree, clean and fully merged per merge-proof check 3) and its local
  branch `implement/prompt-context-refinement-1788133896`
- No `.worktrees/prepare-prompt-context-refinement/` existed at cleanup time.
- No local `thejudge-auto/prompt-context-refinement-v2-work` head was present;
  the PR head branch lives only on `origin`
  (`origin/thejudge-auto/prompt-context-refinement-v2-work`). No remote
  branch was deleted by this node.

## Verification results

- Criteria files: 28/28 `true` across `slice-{a,b,c,d,e}.criteria.json`, no
  `false` remaining.
- `gh pr view 152 --json state,baseRefName,mergedAt,mergeCommit` → `MERGED`,
  base `thejudge-auto/prompt-context-refinement-v2`, merge
  `f3d3dc8c7bdb3cdeb1763fa3c0ea08bf922c89d1`.
- `gh pr view 151 --json state,baseRefName,mergedAt,mergeCommit` → `MERGED`,
  base `main`, merge `c99ae0350ea83311fecad4dd500b4fedd4a3ed96`.
- `git -C .worktrees/implement-prompt-context-refinement status --porcelain`
  → empty.
- `git -C .worktrees/implement-prompt-context-refinement log --oneline origin/thejudge-auto/prompt-context-refinement-v2..HEAD`
  → empty (not ahead).
- `npm run quality:check` (re-run independently at cleanup, after the delete)
  → see result recorded by the driver in its report of this run (exit code
  and suite counts).

## Graph run

- Run ID: `graph-20260830-154444` | Profile: `unverified` | Terminal state: `COMPLETE` — all nodes ok through `close`; package cleaned up. Cleanup (this receipt + package deletion) is delivered to `main` by a fresh `…-v2`→main PR the owner merges, because #151 was merged before `close` ran.

### Node ledger

| # | Node | Model | Outcome | Heartbeat | Evidence | Date |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | preflight | haiku | ok | `0 → 6` | branch `thejudge-auto/prompt-context-refinement-v2` pushed to origin; auto-commit `1c5e1c6` (4 files); lock taken (pid 9629); both canaries denied | 2026-08-30 |
| 2 | shape | sonnet | ok | `0 → 23` | package `PRD/work/prompt-context-refinement/` created, commit `0046546`; `STATUS.ideation`; intake copied to `intake/`; 7 prior-run receipts cited in `IDEA.md`; actionable | 2026-08-30 |
| 3 | define | opus | ok | `0 → 43` | `DESIGN-BRIEF.md` + `RAG-DEFERRED.md` written; 5 new stable IDs in `PRD/sections/` (REQ-167/168/169, FLOW-023, NFR-018); `GATE-QUESTIONS.md` written (non-empty diff); `STATUS.refined`; no blocker | 2026-08-30 |
| 4 | gate-qc | sonnet | failed | `0 → 47` | FAIL: REQ-167 (multi-card combo matching) contradicts unamended REQ-094 (single-card combo matching); both current-state truth, no supersession note, multi-card match semantics unspecified. `STATUS.refining`. Loop 1 of 3 to define | 2026-08-30 |
| 3 | define | opus | ok | `0 → 27` | Loop-1 fix: REQ-094 `mode: "lookup"` criterion amended (qualify-on-any-one + attached-card coverage ranking) with reciprocal REQ-167 amend note; REQ-167 combo criterion tightened; DESIGN-BRIEF assumption #7 recorded; no blocker; `STATUS.refined` | 2026-08-30 |
| 4 | gate-qc | sonnet | ok | `0 → 20` | PASS (re-grade): REQ-094/REQ-167 mutually consistent, multi-card combo semantics fully specified, no regressions in REQ-168/169, FLOW-023, NFR-018, RAG split. `STATUS.refined`. Run one stops here | 2026-08-30 |
| — | gate-review | sonnet | ok | `0 → 27` | Run two: applied owner verdicts (2 edit, 3 accept, 0 reject); REQ-167 cap→5 + partial-combo AC (flagged not-fully-specified), REQ-094 coupled note, REQ-168 phrase-explanations; gate resolved; `STATUS.refined`. See `## Gate verdicts` | 2026-08-30 |
| 4 | gate-qc | sonnet | failed | `0 → 18` | FAIL (run two re-grade): REQ-167/REQ-094 partial-combo behavior self-flagged not-fully-specified (no complete/partial meaning in board-less lookup); 5 points to settle. DESIGN-BRIEF stale (still ~6 cap; partial-combo gap not surfaced). `STATUS.refining`. Loop 2 of 3 to define | 2026-08-30 |
| 3 | define | opus | ok | `0 → 25` | Loop-2 fix: specified lookup complete/partial combo (complete = all slots matched in attached set, zone checks dropped; partial = admitted-but-missing; ranking = complete→coverage→fewer-missing→popularity→variant-id; missing named as role/template via REQ-095, not a card rec). No new stable ID (amended REQ-094/REQ-167, refs REQ-095). DESIGN-BRIEF fixed (cap 5, assumption #8). No blocker. `STATUS.refined` | 2026-08-30 |
| 4 | gate-qc | sonnet | ok | `0 → 16` | PASS (run two re-grade): partial-combo fully specified & implementable, REQ-094/REQ-167/REQ-095 consistent, DESIGN-BRIEF matches (cap 5), no regressions, no live not-specified flags. `STATUS.refined`. Run two continues to plan | 2026-08-30 |
| 5 | plan | sonnet | ok | `0 → 85` | `GAMEPLAN.md` + 5 slice docs (A multi-card backend, B multi-card UI+Playwright, C guardrail+glossary, D prompt-layout spec, E worked-solutions eval) + 5 `slice-*.criteria.json`; `STATUS.active`; order A→B→C→D→E | 2026-08-30 |
| 6 | build | sonnet | ok | `0 → 550` | All 5 slices; 28/28 criteria true; `npm run quality:check` green (432 script + 391 backend + 1302 frontend tests); PR #152 (`…-v2-work`→`…-v2`) opened; `STATUS.ship-ready` (worktree); write-scope OK (launch checkout clean, all writes in `.worktrees/implement-prompt-context-refinement/`) | 2026-08-30 |
| 7 | review | opus | ok | `0 → 42` | APPROVE (no-write reviewer): all 5 slices PASS against their acceptance criteria; no Critical/Important findings; 1 Minor (expected slice A/C interaction, no action). Cap enforced, oracle-only shape, qualify-on-any-one + coverage ranking, missing-role not a card rec, single/no-card paths unchanged. Advances to `land` | 2026-08-30 |
| 8 | land | (human) | ok | — | owner merged PR #152 (`…-v2-work`→`…-v2`) 2026-08-31T02:11:40Z and PR #151 (`…-v2`→`main`) 2026-08-31T04:27:47Z (merge `c99ae03`). `gh pr view` confirms both `MERGED`. Launch checkout reconciled: local ledger commits rebased onto `origin/…-v2` (which carries #152); HEAD clean, ahead 3 (ledger-only). Note: #151 merged before `close`, so cleanup reaches main via a fresh PR | 2026-08-31 |

**Node 9's row was written by the driver after the fact, not by the run.**
The run cannot record its own final node: node 9 deletes
`PRD/work/<slug>/`, and `GRAPH-RUN.md` lives inside it, so there is no
ledger left to write the `close` row into. This matches the same structural
gap recorded in `lambda-s3-deploy-2026-08-29.md` and other prior receipts.
Node 9, for the record: `close` | sonnet | ok | — | receipt
`PRD/instructions/receipts/prompt-context-refinement-2026-08-31.md` written;
all four merge-proof checks verified independently (see `## Merge-proof gate`
above); durable `PRD/sections/` truth confirmed accurate, no edit needed; no
system-map flip needed; `PRD/work/prompt-context-refinement/` deleted via
`git rm -r`; `.worktrees/implement-prompt-context-refinement/` and local
branch `implement/prompt-context-refinement-1788133896` removed; `PRD/work/STATUS.md`
board row removed; `npm run quality:check` re-run (exit 0). Committed as
`6bce5d9` on `thejudge-auto/prompt-context-refinement-v2`; the driver then
pushed `origin/…-v2` and opened the `…-v2`→main cleanup PR.

### Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
| "my updated observations and some ideas id like to start tackling first, there are already a lot of prompt refinement docs generated, they may be useful, but they do not define our gameplan, we are leveraging them for context on the application, but i want a fresh gameplan for approaching these issues, if something falls into the rag category, that can be put into its own markdown file and noted to be worked on later" | answered-once | shape | — |
| "if something falls into the rag category, that can be put into its own markdown file and noted to be worked on later" | answered-once | define | — |

## Intake

- `intake/promptRefinement-notes.md` — staged handoff from
  `.worktrees/.graph-intake/graph-20260830-154444/promptRefinement-notes.md`
  (the owner's updated observations, per the `shape` node dispatch)
- `intake/MANIFEST.md` — manifest for the same staged intake handoff
