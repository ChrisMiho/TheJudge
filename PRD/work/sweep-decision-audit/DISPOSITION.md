# Disposition — decision-audit contentious items

The 34 non-`absorbed` verdicts from `ROLLUP.md`, each with a **recommended
disposition** and a blank **Your call** for you to accept or override.

This doubles as the **apply contract**. Once dispositions are settled, a fan-out
apply pass reads this file: `fix-spec` rows group by `Target spec` (one agent per
file, edits the README), `mark-obsolete` rows annotate the decision in the
corpus, `out-of-scope` rows get a one-line "lives in <X>, not a feature spec"
note (or nothing). Sweep itself never edits — this grid is the seam.

**Dispositions:** `fix-spec` (real player-facing gap → add to a spec) ·
`fix-doc` (real gap, but not product-facing → into an instructions doc) ·
`out-of-scope` (correctly absent — tooling/hosting/non-scored doc) ·
`mark-obsolete` (superseded → retire in corpus).

**Your call:** leave blank to accept the recommendation, or write your own
disposition + any note. Reject a verdict by writing `reject: <why>`.

Split: **15 fix-spec · 5 fix-doc · 11 out-of-scope · 3 mark-obsolete.**

Owner calls so far:
- Cursor-runtime rows (DEC-115, DEC-165) locked out-of-scope — runtime retired.
- 3 obsolete rows left as-is — no corpus edit this pass.
- 5 graph rows (DEC-154/163/164/166/167) moved to fix-doc → graph-workflow-contract.md.
- Lambda rows (DEC-084, DEC-169) stay out-of-scope — fold into docs when implemented.

Apply touches the **15 fix-spec + 5 fix-doc** rows.

---

## fix-spec — real spec gaps (15)

| Item | Section | Verdict | Target spec | Fix note | Your call |
| --- | --- | --- | --- | --- | --- |
| DEC-028 | capture-and-stack | partial | in-depth | Add zone-collection non-blocking nudge + enrichment pre-decrypt summary of populated zones & fallback question. | |
| DEC-116 | combo-retrieval | partial | in-depth / quick-lookup | Add build-time template-ingredient resolution rule (unresolved templates usable for explicit retrieval, can't auto-complete). | |
| DEC-131 | conversation-ux | partial | quick-lookup | Restate composer grow-with-content for Quick Question's field; add DEC-131 to Backed-by. | |
| DEC-146 | conversation-ux | partial | quick-lookup | State compact-submit / full-width-field composer row for Quick Question; add DEC-146 to Backed-by. | |
| DEC-153 | conversation-ux | partial | quick-lookup | Add Built line for the visible Send Request label on Quick Question's initial submit; add DEC-153 to Backed-by. | |
| DEC-027 | game-context-model | partial | in-depth | Add prompt-text player-reference resolution (Player N (Name) format) + empty/whitespace/label-identical = unset rule. | |
| DEC-068 | personalization | partial | scan | Document background neutralization to slate + semantic-green states migrating to palette. | |
| DEC-076 | personalization | partial | in-depth | Document game-context panel merge, '(recommended)' label removal, zone-collection empty-state placeholder removal. | |
| DEC-078 | personalization | partial | shared-chrome | Document the color-derived identity ring around card containers. | |
| DEC-152 | personalization | partial | shared-chrome | Document Colorless custom-color / Reset controls centered under the orb row. | |
| DEC-081 | personalization | not-absorbed | shared-chrome | Document the restrained ambient-accent layer (REQ-060 inventory: rest/hover/focus/current). | |
| DEC-119 | personalization | not-absorbed | shared-chrome | Document the six-profile WUBRGC catalog, hex values, Colorless custom-RGB, retired-ID fallback. | |
| DEC-033 | providers-and-contract | partial | in-depth | Borderline (dev-facing) — document optional context/diagnostics/enrichmentDebug sidecar fields + mock-only scoping, or move to out-of-scope. | |
| DEC-071 | providers-and-contract | not-absorbed | scan | Document choosePreferredCard standard-print tiebreak in the metadata build. | |
| DEC-079 | ui-presentation | not-absorbed | shared-chrome | Document the app-wide decorative-motion baseline (hover/press/focus, entrance/exit, add/remove/success/error cues). | |

## fix-doc — graph workflow, into an instructions doc (5)

Not product-facing, so not a feature spec. Owner wants the graph workflow's
intended operation and overall flow captured in a durable doc. Recommended home:
extend `PRD/instructions/graph-workflow-contract.md` with an "Overall flow"
section (kickoff → preflight → refine → gate → build → review → merge) and cite
each DEC in the relevant section. (Alt: a new short `graph-workflow-overview.md`.)

| Item | Section | Verdict | Target doc | Fix note | Your call |
| --- | --- | --- | --- | --- | --- |
| DEC-154 | doc-process | not-absorbed | graph-workflow-contract.md | Contract-centered agent-workflow lifecycle (worktrees, autonomous prep/implement/cleanup, verification gates) — the flow the graph automates. | fix-doc per owner |
| DEC-163 | doc-process | not-absorbed | graph-workflow-contract.md | graph-run / graph-preflight workflow over the thejudge-* lifecycle. | fix-doc per owner |
| DEC-164 | doc-process | not-absorbed | graph-workflow-contract.md | Graph-workflow boundaries moved from prose to enforced scripts/hooks. | fix-doc per owner |
| DEC-166 | doc-process | not-absorbed | graph-workflow-contract.md | Graph safety boundaries in a committed PreToolUse hook. | fix-doc per owner |
| DEC-167 | doc-process | not-absorbed | graph-workflow-contract.md | graph-run as single intake door; thejudge-prepare retired as entry point. | fix-doc per owner |

## out-of-scope — correctly absent (11)

| Item | Section | Verdict | Lives in | Note | Your call |
| --- | --- | --- | --- | --- | --- |
| DEC-162 | combo-retrieval | partial | system-map.md | Corpus-build/artifact-format substance; delegated outside the 7 feature specs. | |
| DEC-054 | scanning | partial | data/cardhashes.md | Resumable/budget-bounded build mechanics; delegated outside the scored specs. | |
| DEC-084 | deployment | not-absorbed | docs/aws/ | Serverless hosting architecture; decision's own notes say it belongs in docs/aws/. | out-of-scope — folds into docs when Lambda is implemented, per owner |
| DEC-169 | deployment | not-absorbed | docs/aws/ | S3-staged Lambda deploy-artifact mechanics; deploy pipeline, not product. | out-of-scope — folds into docs when Lambda is implemented, per owner |
| DEC-044 | doc-process | not-absorbed | system-map.md | PRD-tooling catalog; not player-facing. | |
| DEC-048 | doc-process | not-absorbed | system-map/*.md | Per-subsystem detail-file template; PRD tooling. | |
| DEC-063 | doc-process | not-absorbed | decisions/ | Decisions-corpus file structure; not product substance. | |
| DEC-086 | doc-process | not-absorbed | CI / tests | quality:check coverage reorg; tooling. | |
| DEC-115 | doc-process | not-absorbed | .claude/skills/ | Terse skill-response discipline; agent workflow. Old canonical clause pointed at .cursor/, superseded by DEC-165. | out-of-scope ✓ — Cursor retired per owner |
| DEC-155 | doc-process | not-absorbed | CI | GitHub Actions sharding; tooling. | |
| DEC-165 | doc-process | not-absorbed | repo | .cursor/ removal, .claude/skills/ canonical; runtime tooling. | out-of-scope ✓ — Cursor retired per owner |

## mark-obsolete — superseded (3)

| Item | Section | Verdict | Superseded by | Note | Your call |
| --- | --- | --- | --- | --- | --- |
| DEC-067 | personalization | obsolete | DEC-122 | Step-name header placement → eyebrow; original inline-right-of-brand no longer applies. | leave as-is — no action per owner |
| DEC-121 | navigation | obsolete | DEC-122 | Superseded outright per its own Notes; shared-chrome names it a closed door. | leave as-is — no action per owner |
| DEC-089 | trade-balancer | obsolete | DEC-122/110/095/157/111 | Superseded by shipped shared-chrome nav (corner rail, folded theme, four destinations, persisted active). | leave as-is — no action per owner |
