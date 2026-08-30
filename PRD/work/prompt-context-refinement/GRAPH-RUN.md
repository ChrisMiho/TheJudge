# Graph run — prompt-context-refinement

- Run ID: `graph-20260830-154444`
- Profile: `unverified`
- Canary: `denied — hook live (universal: rm -rf; graph: nohup)`
- Autonomous base: `origin/thejudge-auto/prompt-context-refinement-v2`
- Staging: `.worktrees/.graph-intake/graph-20260830-154444/`
- Current node: `owner-action` (run one parked; gate-qc PASS)
- Next action: `/graph-run PRD/work/prompt-context-refinement/`

Note: this is a relaunch. The first attempt (`graph-20260830-152808`,
branch `thejudge-auto/prompt-context-refinement`) hit BLOCKED at node 2 on a
boundary-hook defect that wrongly denied the heartbeat read of
`.worktrees/.graph-node-calls.json` and then, via a path-blind denial key,
refused every later file-tool read. Fixed in PR #150 (merged) before this
relaunch. The stale first-attempt remote branch remains (the hook forbids
remote-branch deletion); it carries no PR.

## Node ledger

| # | Node | Model | Outcome | Heartbeat | Evidence | Date |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | preflight | haiku | ok | `0 → 6` | branch `thejudge-auto/prompt-context-refinement-v2` pushed to origin; auto-commit `1c5e1c6` (4 files); lock taken (pid 9629); both canaries denied | 2026-08-30 |
| 2 | shape | sonnet | ok | `0 → 23` | package `PRD/work/prompt-context-refinement/` created, commit `0046546`; `STATUS.ideation`; intake copied to `intake/`; 7 prior-run receipts cited in `IDEA.md`; actionable | 2026-08-30 |
| 3 | define | opus | ok | `0 → 43` | `DESIGN-BRIEF.md` + `RAG-DEFERRED.md` written; 5 new stable IDs in `PRD/sections/` (REQ-167/168/169, FLOW-023, NFR-018); `GATE-QUESTIONS.md` written (non-empty diff); `STATUS.refined`; no blocker | 2026-08-30 |
| 4 | gate-qc | sonnet | failed | `0 → 47` | FAIL: REQ-167 (multi-card combo matching) contradicts unamended REQ-094 (single-card combo matching); both current-state truth, no supersession note, multi-card match semantics unspecified. `STATUS.refining`. Loop 1 of 3 to define | 2026-08-30 |
| 3 | define | opus | ok | `0 → 27` | Loop-1 fix: REQ-094 `mode: "lookup"` criterion amended (qualify-on-any-one + attached-card coverage ranking) with reciprocal REQ-167 amend note; REQ-167 combo criterion tightened; DESIGN-BRIEF assumption #7 recorded; no blocker; `STATUS.refined` | 2026-08-30 |
| 4 | gate-qc | sonnet | ok | `0 → 20` | PASS (re-grade): REQ-094/REQ-167 mutually consistent, multi-card combo semantics fully specified, no regressions in REQ-168/169, FLOW-023, NFR-018, RAG split. `STATUS.refined`. Run one stops here | 2026-08-30 |

## Open gate

- **What the owner does:** answer the five decisions in
  `PRD/work/prompt-context-refinement/GATE-QUESTIONS.md` — write `accept`,
  `edit`, or `reject` on each `Verdict:` line (add a `Reason:` for edit/reject),
  then resume the run.
- **What stopped the run:** run one drove `preflight → shape → define →
  gate-qc` and stopped at the first quality-check PASS, by design — no script can
  decide whether the proposed product truth is the product the owner wants. The
  five decisions: REQ-167 (Quick Question accepts several cards, no game state —
  including the REQ-094 combo-matching amendment), REQ-168 (the rules guardrail
  stops refusing valid Magic phrases like "combo"), REQ-169 (a readable
  prompt-layout spec), FLOW-023 (the multi-card Quick Question flow), NFR-018
  (validate prompt quality against real worked rules solutions). Observation #1's
  mechanic-definition enrichment is RAG-shaped and filed to `RAG-DEFERRED.md`.
- **PR:** docs-only design PR into `main` — https://github.com/ChrisMiho/TheJudge/pull/151.
  It stays open; the owner does **not** merge it yet — implementation grows into
  it and it merges last.
- **Resume command:** `/graph-run PRD/work/prompt-context-refinement/`
  (run two applies the answered verdicts via `graph-gate-review`, re-grades at
  `gate-qc`, then continues `plan → build → review → land → close`).

## Dispatch prompts

### preflight

graph-run is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

You are node 1 (`preflight`) of an autonomous graph run (relaunch after a boundary-hook fix merged as PR #150). Invoke the `graph-preflight` skill and follow it exactly. Do not improvise repairs; if a step fails, stop and report verbatim.

Inputs for this run:
- Branch to create: `thejudge-auto/prompt-context-refinement-v2`
- Run ID: `graph-20260830-154444`
- Slug: `prompt-context-refinement`
- Base: current branch (`main`)

Procedure (from the graph-preflight skill):
1. Run the dry run, report the classification, resolved base, planned commands, and the profile lines verbatim.
2. If action is `blocked`, stop and report the offending paths — do not hand-resolve.
3. Otherwise re-run identically without `--dry-run`, same `--run-id`.
4. Take the concurrency lock as the script does; report `classifyLock()` result.
5. Issue BOTH liveness canaries as real Bash tool calls and require the hook to DENY each.
6. Confirm end state: `git status --porcelain` (empty) and `git branch --show-current` (the requested branch).

The heartbeat read of `.worktrees/.graph-node-calls.json` is expected to be ALLOWED now (merged fix); if denied, stop and report, because the fix is not in effect.

Copy the `Working directory:` line above, unchanged, into any prompt you write.

### shape

graph-run is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

You are node 2 (`shape`) of an autonomous graph run. Invoke the `thejudge-kickoff` skill and follow it exactly in graph mode. Do NOT ask the user questions — graph-run is controlling; capture the idea into the package and return.

Package details:
- Slug: `prompt-context-refinement`
- Run ID: `graph-20260830-154444`

The owner's request, verbatim:
"my updated observations and some ideas id like to start tackling first, there are already a lot of prompt refinement docs generated, they may be useful, but they do not define our gameplan, we are leveraging them for context on the application, but i want a fresh gameplan for approaching these issues, if something falls into the rag category, that can be put into its own markdown file and noted to be worked on later"

Intake staged: primary handoff `.worktrees/.graph-intake/graph-20260830-154444/promptRefinement-notes.md` and manifest `MANIFEST.md`. Copy into the package `intake/` and cite; do NOT open the cited context docs as authority.

Context documents (cite by path, NOT settled truth): `PRD/work/promptRefinement.md`, `PRD/work/promptRefinement-analysis.md`, `PRD/work/promptRefinement-enhancements.md`.

Owner scope instruction (input, not pre-authorization): RAG-category items are split into their own markdown file and noted for later. Observation #1 (mechanic-keyword enrichment) is the owner's own flagged RAG candidate.

Kickoff work: create `PRD/work/prompt-context-refinement/` with `IDEA.md` (five observations), `STATUS.ideation`; copy staged intake and cite; grep `PRD/instructions/receipts/` for prior runs and write one `## Prior run` line per match; return `NO ACTIONABLE PACKAGE` if not actionable.

Copy the `Working directory:` line above, unchanged, into any prompt you write.

### define

graph-run is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

You are node 3 (`define`) of an autonomous graph run. Invoke the `thejudge-refinement` skill and follow it exactly in graph mode. Do NOT ask the user questions and do NOT pause for approval — graph-run is controlling. Apply the assumption ladder in `PRD/instructions/preparation-contract.md` per question, fresh at the moment each arises. If and only if a question meets the three-condition genuine-blocker test, stop and report it as a blocker (the driver will park) — never invent a standing rule for a class of decisions.

Package: `PRD/work/prompt-context-refinement/` (STATUS.ideation)
Run ID: `graph-20260830-154444`

Read `IDEA.md` and `intake/promptRefinement-notes.md` — the owner's five observations about the rules-question prompt/context pipeline. `IDEA.md` also lists 7 relevant prior-run receipts; treat those receipts as background context, not as settled truth to re-adopt wholesale.

Your job: shape a DESIGN-BRIEF.md plus aligned `PRD/sections/` updates (REQ/FLOW/NFR as the feature specs require) that give the owner a fresh gameplan for these issues. Set STATUS.refining while in flux and STATUS.refined on completion.

Owner scope instructions (inputs, not pre-authorizations of product decisions):
1. RAG-CATEGORY ITEMS ARE SPLIT OUT, NOT FOLDED IN. Any observation or sub-idea that belongs to retrieval-augmented generation / corpus-retrieval work is written into its own markdown file in the package (e.g. RAG-DEFERRED.md) and noted to be worked on later — it does NOT become part of this gameplan's design brief or PRD/sections truth. Observation #1 (identify every MTG mechanic keyword and guarantee its definition is enriched into the prompt) is the owner's own flagged RAG candidate; evaluate it and, if it is RAG-shaped, file it there. Use your judgment per item; if genuinely unsure whether an item is in-scope vs. RAG-deferred and it blocks the brief, treat it as a blocker and report rather than guessing.
2. The prior promptRefinement docs in `PRD/work/` are cited background only. Do not treat them as product authority.

The five observations, in brief (full text in the notes):
1. Mechanic-keyword enrichment gap — quick-question path lacked context for a keyword; wants every relevant mechanic's definition guaranteed in the prompt. (Owner's flagged RAG candidate.)
2. Prompt spec/legibility — wants a readable spec/outline of the backend prompt layout, annotating which sections appear on which path.
3. Guardrail tuning — a valid MTG phrase ('combo') was rejected as 'not a mechanic'; wants common non-official-but-valid phrases handled without odd refusals.
4. External validation data — public worked-solutions to hard rules questions could validate/tune the prompt.
5. Quick-question multi-card context — referencing other cards is a gamble; idea to let users add all cards they want to discuss and drop the rest of game context.

The design brief and any `PRD/sections/` truth you propose are reviewed by the owner at the `define` gate — write to the plain-language standard. Every new stable ID you add to `PRD/sections/` becomes an owner gate question, so make each one a real, owner-answerable product decision.

Report back: the artifacts written, each `PRD/sections/` file touched with the new stable IDs, the RAG-deferred file and what you filed there, the final STATUS marker, and any blocker you are reporting. Copy the `Working directory:` line above, unchanged, into any prompt you write.

### gate-qc

graph-run is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

You are node 4 (`gate-qc`) of an autonomous graph run. Invoke the `thejudge-quality-check` skill and follow it exactly in graph mode. Do NOT ask the user questions — graph-run is controlling. Produce a PASS/FAIL report only; do not write a GAMEPLAN or slice docs.

Package: `PRD/work/prompt-context-refinement/` (STATUS.refined)
Run ID: `graph-20260830-154444`

Validate `PRD/work/prompt-context-refinement/DESIGN-BRIEF.md` for PRD alignment and agent-readiness, per the quality-check contract. The refinement proposed 5 new stable IDs in `PRD/sections/` (REQ-167, REQ-168, REQ-169, FLOW-023, NFR-018) and split observation #1 into RAG-DEFERRED.md; check the brief is internally consistent with those, that each requirement is implementable and testable, that dependencies/supersedes are correct, and that nothing is under-specified for map-out.

On PASS: leave STATUS.refined. On FAIL: set STATUS.refining and list every issue precisely enough that refinement can fix it.

Report back: the verdict, and on FAIL the complete issue list. Copy the `Working directory:` line above, unchanged, into any prompt you write.

### define (loop 2)

graph-run is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

You are node 3 (`define`) re-entered after a quality-check FAIL (loop 1 of 3). Invoke `thejudge-refinement` in graph mode. Do NOT ask the user questions. This is a TARGETED FIX of one finding, not a re-refinement: keep everything already written intact and change only what the finding requires. End at STATUS.refined.

Package: `PRD/work/prompt-context-refinement/` (STATUS.refining). Run ID: `graph-20260830-154444`.

The finding: REQ-167 makes lookup-mode combo matching work across all attached cards, but REQ-094 is unamended current-state truth and still says lookup combo retrieval runs only when one card is attached and every candidate must contain the attached card. Both stand as current-state truth and contradict. REQ-167 lists REQ-094 only as a dependency, adds no amend note, and never specifies how N attached cards map onto REQ-094's per-candidate rule.

Required fix (follow the corpus's forward-pointing-note convention, e.g. the amend notes at functional-requirements.md:1148 and :2099):
1. Add a forward-pointing amend note to REQ-094 and adjust its acceptance criteria so the multi-card lookup case is defined, not contradicted.
2. State the precise multi-card combo-match semantics: whether a candidate must contain all attached cards or any one; whether the at-most-five-variants ranking stays card-agnostic or gains per-card weighting; keep zero-card and single-card cases exactly as today. Record any assumption on the assumption ladder.
3. Make REQ-167 and REQ-094 mutually consistent, mirroring how REQ-167 already names its DEC-106/DEC-107 supersession.

Do NOT change REQ-168, REQ-169, FLOW-023, NFR-018, or RAG-DEFERRED.md unless strictly required. Prefer amending REQ-094 and tightening REQ-167 over new IDs. If the semantics genuinely meet the three-condition genuine-blocker test, stop and report a blocker instead of guessing.

Report back the exact IDs/lines changed, the semantics settled and why, any assumption recorded, and the final STATUS marker. Copy the `Working directory:` line above, unchanged, into any prompt you write.

### gate-qc (loop 2)

graph-run is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

You are node 4 (`gate-qc`) re-grading after a refinement fix (second gate-qc pass). Invoke `thejudge-quality-check` in graph mode. Do NOT ask the user questions. Produce a PASS/FAIL report only.

Package: `PRD/work/prompt-context-refinement/` (STATUS.refined). Run ID: `graph-20260830-154444`.

The prior FAIL: REQ-167 (multi-card lookup combo matching) contradicted unamended REQ-094 (single-card lookup combo matching). The fix amended REQ-094's lookup combo criterion (qualify-on-any-one across attached cards plus attached-card coverage ranking before popularity, single-card and zero-card cases unchanged) with a reciprocal amend note and REQ-167 added to REQ-094's dependencies; REQ-167's combo criterion was tightened to match.

Re-validate `DESIGN-BRIEF.md` against `PRD/sections/`, with attention to: REQ-094 and REQ-167 now mutually consistent with fully specified multi-card combo-match semantics; the rest of the brief (REQ-168, REQ-169, FLOW-023, NFR-018, RAG-DEFERRED split) still coherent and agent-ready; nothing regressed from the fix. On PASS leave STATUS.refined; on FAIL set STATUS.refining and list every issue.

Report back the verdict and, on FAIL, the complete issue list. Copy the `Working directory:` line above, unchanged, into any prompt you write.

## Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
| "my updated observations and some ideas id like to start tackling first, there are already a lot of prompt refinement docs generated, they may be useful, but they do not define our gameplan, we are leveraging them for context on the application, but i want a fresh gameplan for approaching these issues, if something falls into the rag category, that can be put into its own markdown file and noted to be worked on later" | answered-once | shape | — |
| "if something falls into the rag category, that can be put into its own markdown file and noted to be worked on later" | answered-once | define | — |
