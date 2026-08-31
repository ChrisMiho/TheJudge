# Graph run — prompt-context-refinement

- Run ID: `graph-20260830-154444`
- Profile: `unverified`
- Canary: `denied — hook live (universal: rm -rf; graph: nohup)`
- Autonomous base: `origin/thejudge-auto/prompt-context-refinement-v2`
- Staging: `.worktrees/.graph-intake/graph-20260830-154444/`
- Current node: `build` (run two — 5 slices A–E mapped)
- Next action: `/graph-run PRD/work/prompt-context-refinement/`
- Run two: resumed 2026-08-30 from `owner-action`. Lock re-taken (pid 17131);
  graph canary re-proved (`nohup` denied). Gate fully answered: REQ-167 edit
  (cap 5 + partial-combo explanation), REQ-168 edit (explain what each phrase
  means), REQ-169 accept, FLOW-023 accept, NFR-018 accept (document source
  provenance).

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
| — | gate-review | sonnet | ok | `0 → 27` | Run two: applied owner verdicts (2 edit, 3 accept, 0 reject); REQ-167 cap→5 + partial-combo AC (flagged not-fully-specified), REQ-094 coupled note, REQ-168 phrase-explanations; gate resolved; `STATUS.refined`. See `## Gate verdicts` | 2026-08-30 |
| 4 | gate-qc | sonnet | failed | `0 → 18` | FAIL (run two re-grade): REQ-167/REQ-094 partial-combo behavior self-flagged not-fully-specified (no complete/partial meaning in board-less lookup); 5 points to settle. DESIGN-BRIEF stale (still ~6 cap; partial-combo gap not surfaced). `STATUS.refining`. Loop 2 of 3 to define | 2026-08-30 |
| 3 | define | opus | ok | `0 → 25` | Loop-2 fix: specified lookup complete/partial combo (complete = all slots matched in attached set, zone checks dropped; partial = admitted-but-missing; ranking = complete→coverage→fewer-missing→popularity→variant-id; missing named as role/template via REQ-095, not a card rec). No new stable ID (amended REQ-094/REQ-167, refs REQ-095). DESIGN-BRIEF fixed (cap 5, assumption #8). No blocker. `STATUS.refined` | 2026-08-30 |
| 4 | gate-qc | sonnet | ok | `0 → 16` | PASS (run two re-grade): partial-combo fully specified & implementable, REQ-094/REQ-167/REQ-095 consistent, DESIGN-BRIEF matches (cap 5), no regressions, no live not-specified flags. `STATUS.refined`. Run two continues to plan | 2026-08-30 |
| 5 | plan | sonnet | ok | `0 → 85` | `GAMEPLAN.md` + 5 slice docs (A multi-card backend, B multi-card UI+Playwright, C guardrail+glossary, D prompt-layout spec, E worked-solutions eval) + 5 `slice-*.criteria.json`; `STATUS.active`; order A→B→C→D→E | 2026-08-30 |

## Open gate

- **Status: resolved** 2026-08-30 by `graph-gate-review` — all 5 stable IDs
  answered (2 edit, 3 accept, 0 reject); verdicts applied, see
  `## Gate verdicts` below.
- **What the owner did:** answered the five decisions in
  `PRD/work/prompt-context-refinement/GATE-QUESTIONS.md` — `accept`,
  `edit`, or `reject` on each `Verdict:` line, with a `Reason:` for each edit.
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
  (run two continues at `gate-qc` to re-grade the two edits just applied, then
  continues `plan → build → review → land → close`).

## Gate verdicts

Applied by `graph-gate-review`, 2026-08-30, from the owner's answered
`GATE-QUESTIONS.md`.

| Stable ID | Verdict | Reason |
| --- | --- | --- |
| `REQ-167` | edit | "I wanna set a cap of 5 cards, and i was a little confused by what you mentioned about the combos... if it meets the criteria for an identified combo, then explain the combo. If it does not match the criteria for a combo, can we somehow callout what theyre missing or explain what parts do combo but what is possibly missing?... explain whats missing and how the combo could work and what would potentially fill that empty row, since we'd be able to tell which part is missing right?" |
| `REQ-168` | edit | "This sounds great, i think this should be expanded on however to explain what these phrases represent." |
| `REQ-169` | accept | "I may expand on explanations after the initial draft, but i like starting with concise explanations to start." |
| `FLOW-023` | accept | "sounds great" |
| `NFR-018` | accept | "Please make sure to document where these use cases are retrieved from so that they can be validated." |

Applied, inside each ID's recorded diff only, in `PRD/sections/functional-requirements.md`:

- **REQ-167** — AC bullet 2: cap changed from a suggested "~6, tuned at
  implementation" to a fixed **5 cards**. New AC bullet + Notes entry: lookup
  combo answers must explain a fully-assembled combo, and for a partial match
  must name the missing ingredient(s) and what would fill them — flagged
  **not fully specified**: "complete vs. partial" has no defined meaning yet
  for a mode with no board state, so full/partial classification and
  selection mechanics need a `define` loop (and re-grade at `gate-qc`) before
  `map-out`.
- **REQ-094** (coupled amendment, covered by the REQ-167 verdict) — added a
  matching "not yet specified" note under the `mode: "lookup"` Notes bullet,
  pointing at the same gap so implementation cannot silently read the
  unamended "contains at least one" criterion as already answering the
  owner's partial-combo ask.
- **REQ-168** — AC bullet 2 (the maintained phrasing doc) reworded from
  "categories (with examples)" to require each category carry its example
  phrases **and a plain-language explanation of what the phrase means**, so
  the doc reads as a glossary. This is a complete, text-level correction —
  no further specification needed. Notes entry added recording the change.
- **REQ-169, FLOW-023, NFR-018** — accept; no `PRD/sections/` changes. The
  NFR-018 reason (document where worked-solution sources come from) is
  recorded above for the next phase to see, but is not written into
  `PRD/sections/` because the recorded verdict is `accept`, not `edit` — a
  verdict is applied exactly as marked, never inferred from its reason text.

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

### gate-review (run two)

graph-run is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

You are the gate-review step of run two. Invoke the `graph-gate-review` skill and follow it exactly. Do NOT ask the user questions. Read every verdict FROM the answered `PRD/work/prompt-context-refinement/GATE-QUESTIONS.md` (never from this prompt). Apply each accept/edit/reject inside that ID's recorded diff only; write `## Gate verdicts`, resolve `## Open gate`, restore status to refined (marker, README, board row), hand back the resume command. Two verdicts are edit with substantive reasons — apply the owner's correction faithfully without watering down or expanding; where full specification needs reshaping beyond a text correction, apply what fits the diff and flag that it needs the gate-qc re-grade (and possibly a define loop). Do not write DESIGN-BRIEF.md, do not reshape beyond the diff, do not advance a node. Package `PRD/work/prompt-context-refinement/`, run id `graph-20260830-154444`. Copy the `Working directory:` line above, unchanged, into any prompt you write.

### gate-qc (run two)

graph-run is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

You are node 4 (`gate-qc`) re-grading in run two after gate-review applied the owner verdicts. Invoke `thejudge-quality-check` in graph mode. Do NOT ask the user questions. PASS/FAIL only. Changes: REQ-167 cap fixed at 5 plus a new partial-combo criterion (explain a fully-assembled combo; for a partial match, name the missing ingredient(s) and what would fill them) that gate-review flagged as not fully specified — full/partial classification has no defined meaning in a board-less lookup; REQ-094 coupled note added; REQ-168 phrasing doc must explain what each phrase means; REQ-169/FLOW-023/NFR-018 accepted unchanged. Re-validate `DESIGN-BRIEF.md` against `PRD/sections/`, judging honestly whether the partial-combo behavior is now implementable-and-testable or still under-specified. On PASS leave STATUS.refined; on FAIL set STATUS.refining and list every issue precisely. Package `PRD/work/prompt-context-refinement/`, run id `graph-20260830-154444`. Copy the `Working directory:` line above, unchanged, into any prompt you write.

### define (run two, loop 2)

graph-run is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

You are node 3 (`define`) re-entered after a quality-check FAIL (run two, gate-qc→define loop 2 of 3). Invoke `thejudge-refinement` in graph mode. Do NOT ask the user questions. Targeted specification of one finding; keep everything else intact; end at STATUS.refined. Package `PRD/work/prompt-context-refinement/` (STATUS.refining), run id `graph-20260830-154444`.

The owner accepted REQ-167 and, in an edit verdict, asked that a combo lookup explain a fully-assembled combo and, when partial, name what is missing and what would fill it. gate-review applied the intent but flagged it not-fully-specified; gate-qc FAILed for that. Specify it precisely, grounded in existing REQ-094 (combo machinery) and REQ-095 (present/missing rendering), applying the assumption ladder per point and recording assumptions:
1. Define complete for a board-less lookup candidate (all ingredient slots matched in the attached set; drop REQ-094 zone/quantity checks lookup has no data for).
2. Define partial admission/selection (qualify-on-any-one admits; partial when a slot is unmatched).
3. Fold attached-card coverage into REQ-094's at-most-five ranking for lookup; state precedence and tie-breaking.
4. Define naming the missing role as the missing ingredient's identity/template/category (the REQ-095 present/missing labeling), NOT a card recommendation — a suggestion engine is out of scope.
5. Decide whether REQ-095 already renders the lookup answer text or a new AC is needed.

Also fix stale DESIGN-BRIEF.md (cap ~6 to fixed 5; surface the partial-combo behavior). Prefer amending REQ-167/REQ-094 and referencing REQ-095 over any new stable ID (a new ID makes a new owner gate question); do not touch REQ-168/REQ-169/FLOW-023/NFR-018; remove the not-fully-specified self-flags once specified. Park only on a genuine three-condition blocker. Report the IDs/lines changed, the mechanics settled with evidence, assumptions, whether a new ID was unavoidable, DESIGN-BRIEF fixes, and the final STATUS. Copy the `Working directory:` line above, unchanged, into any prompt you write.

### gate-qc (run two, loop 3)

graph-run is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

You are node 4 (`gate-qc`) re-grading in run two after define loop 2 specified the lookup partial-combo behavior. Invoke `thejudge-quality-check` in graph mode. Do NOT ask the user questions. PASS/FAIL only. The prior FAIL was that the partial-combo answer for a board-less lookup was self-flagged not-fully-specified; the define loop settled it grounded in REQ-094 and REQ-095 with no new stable ID (complete = all slots matched in the attached set, zone/quantity checks dropped; partial = admitted-but-missing; ranking = complete then coverage then fewer-missing then popularity then variant-id; missing role named as ingredient identity/template via REQ-095, not a card recommendation; REQ-095 already renders the lookup text). DESIGN-BRIEF updated (cap fixed at 5, partial-combo surfaced, assumption 8). Re-validate DESIGN-BRIEF against PRD/sections: partial-combo implementable/testable with no remaining not-specified flags, REQ-094/REQ-167/REQ-095 consistent, DESIGN-BRIEF matches (cap 5), REQ-168/REQ-169/FLOW-023/NFR-018 unregressed. On PASS leave STATUS.refined; on FAIL set STATUS.refining and list every issue. Package `PRD/work/prompt-context-refinement/`, run id `graph-20260830-154444`. Copy the `Working directory:` line above, unchanged, into any prompt you write.

### plan

graph-run is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

You are node 5 (`plan`). Invoke `thejudge-map-out` in graph mode. Do NOT ask the user questions. Package `PRD/work/prompt-context-refinement/` (STATUS.refined), run id `graph-20260830-154444`. The README `## Preparation gate` records Quality-check: PASS — verify it before writing any planning artifact; you cannot self-certify it. Create GAMEPLAN.md, lettered slice docs, and each slice's criteria.json (criteria initialised false with evidence blocks), set STATUS.active. Slice these roughly-independent items sensibly for sequential single-agent implementation, foundational first: REQ-167 + FLOW-023 (bounded 5-card lookup, per-card enrichment + retrieval, combo qualify-on-any-one + coverage ranking + complete/partial answer naming the missing role via REQ-095, not a card recommendation; the pre-submit multi-card add strip, with the screen-layout pre-submit single-card image-cap row needing re-measurement); REQ-168 (guardrail wording + a glossary phrasing doc); REQ-169 (readable prompt-layout spec, docs only); NFR-018 (committed worked-solutions eval set with documented provenance, test data only). Keep REQ-169 and NFR-018 as their own slices; REQ-168 its own small slice; do not expand scope beyond the approved requirements. Report the GAMEPLAN summary, slice list with coverage, criteria.json confirmation, and the final STATUS. Copy the `Working directory:` line above, unchanged, into any prompt you write.

## Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
| "my updated observations and some ideas id like to start tackling first, there are already a lot of prompt refinement docs generated, they may be useful, but they do not define our gameplan, we are leveraging them for context on the application, but i want a fresh gameplan for approaching these issues, if something falls into the rag category, that can be put into its own markdown file and noted to be worked on later" | answered-once | shape | — |
| "if something falls into the rag category, that can be put into its own markdown file and noted to be worked on later" | answered-once | define | — |
