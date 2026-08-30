# Graph run — prompt-context-refinement

- Run ID: `graph-20260830-154444`
- Profile: `unverified`
- Canary: `denied — hook live (universal: rm -rf; graph: nohup)`
- Autonomous base: `origin/thejudge-auto/prompt-context-refinement-v2`
- Staging: `.worktrees/.graph-intake/graph-20260830-154444/`
- Current node: `define`
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

## Open gate

- None

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

## Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
| "my updated observations and some ideas id like to start tackling first, there are already a lot of prompt refinement docs generated, they may be useful, but they do not define our gameplan, we are leveraging them for context on the application, but i want a fresh gameplan for approaching these issues, if something falls into the rag category, that can be put into its own markdown file and noted to be worked on later" | answered-once | shape | — |
| "if something falls into the rag category, that can be put into its own markdown file and noted to be worked on later" | answered-once | define | — |
