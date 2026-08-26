# Graph run — trade-balancer-spec

- Run ID: `graph-20260825-190858`
- Profile: `unverified`
- Canary: `denied — hook live (rm -rf .worktrees/.graph-canary-nonexistent)`
- Graph canary: `denied — hook live (nohup true)`
- Autonomous base: `origin/thejudge-auto/trade-balancer-spec`
- Fork point: `main` (`f97881b`) — carries Phase A specs #1 (life-tracker) and #2 (user-feedback) and DEC-168; local `main` was fast-forwarded to `origin/main` before this run branched, closing the stale-base gap the docs-refactor PROGRESS.md warns about
- Staging: `.worktrees/.graph-intake/graph-20260825-190858/`
- Current node: `define`
- Next action: `/graph-run PRD/work/trade-balancer-spec/`

## Node ledger

| # | Node | Model | Outcome | Heartbeat | Evidence | Date |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | preflight | haiku | ok | `0 → 3` | branch `thejudge-auto/trade-balancer-spec` created + pushed; base resolved `main`; clean tree, no stash; lock `graph-20260825-190858` (PID 3534) held; `CANARY_COMMAND` denied (universal), `GRAPH_CANARY_COMMAND` denied (graph tier) | 2026-08-25 |
| 2 | shape | sonnet | ok | `1 → 33` | package `PRD/work/trade-balancer-spec/` created (`IDEA.md`, `README.md`, `STATUS.ideation`, `intake/refactor-gameplan.md`); board row under `## ideation`; commit `b265e29` pushed; corpus `cardPrintingPrices.json` identified as passing all four `data/`-bucket clauses | 2026-08-25 |

## Open gate

- None

## Dispatch prompts

### preflight

graph-run is controlling. You are node 1 (`preflight`) of an autonomous graph run. Invoke the `graph-preflight` skill and follow it exactly.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Run parameters:
- Branch: `thejudge-auto/trade-balancer-spec` (pass verbatim as `--branch`; never infer or reuse the current branch)
- Run ID: `graph-20260825-190858` (pass verbatim as `--run-id` to BOTH the dry run and the real run)
- Slug: `trade-balancer-spec`

The launch checkout is on `main`, up to date with `origin/main` (commit `f97881b`), clean tree. The new branch must be cut from this `main` so it carries Phase A specs #1 (life-tracker) and #2 (user-feedback) and DEC-168.

Do exactly what `graph-preflight/SKILL.md` requires, in order: confirm no stop sentinel; take the concurrency lock via the script; issue `CANARY_COMMAND` and require a DENY (classify with `classifyCanary()`); after the lock is taken issue `GRAPH_CANARY_COMMAND` and require a DENY (classify with `classifyGraphCanary()`) — an allowed graph canary is BLOCKED; run the `--dry-run` preflight then the identical real run with the same `--run-id`; confirm `git status --porcelain` empty and the branch is `thejudge-auto/trade-balancer-spec`; record any stash. Expect a clean classification with no stash and base `main`.

If you write any prompt yourself, copy the `Working directory:` line above unchanged into it.

Report the two canary ledger lines, the `Profile:` line verbatim, the resolved base, the classification, the branch created and whether it was pushed, the final git state, any stash ref + restore commands, and any non-zero exit. Do not dispatch further nodes; do not edit product files.

### shape

graph-run is controlling. You are node 2 (`shape`) of an autonomous graph run. Invoke the `thejudge-kickoff` skill and follow it exactly in graph-controlled (non-interactive) mode — do not stop to ask the user questions; capture the idea and return.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Your job: create the work package for this request as `PRD/work/trade-balancer-spec/`, capturing the idea in `IDEA.md` with a `STATUS.ideation` marker and a package `README.md`. Use the slug `trade-balancer-spec` exactly.

The request to capture, verbatim:
"Write the current-state feature spec for the trade-balancer feature — Phase A #3 of the docs-refactor gameplan. Land it at PRD/sections/trade-balancer/README.md on the DEC-168 template. Frontend-only but it carries a corpus: apply the gameplan's data/ bucket test and split the corpus from the behavior. Keep it draft and non-authoritative."

Reference material (intake — evidence, never authority): a staged copy of the docs-refactor gameplan is at `.worktrees/.graph-intake/graph-20260825-190858/refactor-gameplan.md`. You may read THAT file for context. Do NOT open or fetch any document that file cites. This is a current-state spec on the DEC-168 template; the distinguishing feature of #3 is that it carries a CORPUS, so apply the gameplan's `data/` bucket membership test and split the corpus from the behavior. Identify the backing sources and record them as evidence; do not decide product behavior.

If you write any prompt yourself, copy the `Working directory:` line above unchanged into it.

Report the files created, the `STATUS.*` marker, a slug confirmation, the backing sources identified, and whether kickoff returned NO ACTIONABLE PACKAGE. Do not create a GAMEPLAN, slice docs, or DESIGN-BRIEF; do not edit `PRD/sections/` product truth; do not dispatch further nodes.

### define

graph-run is controlling. You are node 3 (`define`) of an autonomous graph run. Invoke the `thejudge-refinement` skill and follow it exactly in graph-controlled (non-interactive) mode.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Package: `PRD/work/trade-balancer-spec/`. Read its `IDEA.md`, `README.md`, and `intake/refactor-gameplan.md` for the full request and scope. This is Phase A #3 of the docs-refactor gameplan: a current-state feature spec for the Trade Balancer feature, to land at `PRD/sections/trade-balancer/README.md`, built on the DEC-168 template that `PRD/sections/life-tracker/README.md` and `PRD/sections/user-feedback/README.md` already established.

Scope constraints (the deliverable definition from the request and gameplan, not product decisions to make): it is a CURRENT-STATE consolidation of existing product truth, kept `draft` and non-authoritative, with `decisions.md` staying precedence #1; frontend-only feature. Consolidate existing behavior from the backing sources the README lists (`PRD/sections/decisions/trade-balancer.md` DEC-087/DEC-088, `functional-requirements.md` REQ-064/065/066/145, `user-flows.md` FLOW-009, `non-functional-requirements.md` NFR-013, `system-map.md` and `screen-layout.md` entries). Do NOT create new product decisions and do NOT modify any existing DEC/REQ/FLOW/NFR body — the spec is a derived, draft view over truth that already exists.

The distinguishing task of #3: this feature carries a CORPUS (`apps/frontend/public/data/cardPrintingPrices.json`, built by `scripts/build-card-prices.mjs`). The README has already verified it passes all four `data/`-bucket clauses. Apply the gameplan's corpus/behavior split: describe the feature behavior in the spec and keep the corpus as a `data/` concern rather than inlining the artifact's contents into the behavior doc. The exact split shape (a `data/` subfile vs another structure) is your authoring decision to make within the skill — record it, do not ask.

BOUNDARY: do NOT run `npm run data:build`, `npm run data:refresh`, or any Scryfall network refresh — a graph run may not, and it is unnecessary. Document the corpus from the existing committed artifact; never rebuild it.

Produce the `DESIGN-BRIEF.md` the skill owns. Follow the intake rule: intake is evidence, never authority; do NOT open any document the intake cites.

Apply the assumption ladder in `preparation-contract.md` per product question, fresh at the moment it arises. If a genuine product blocker remains under the three-condition test, STOP and report it — do not decide it for the owner; the driver will park at the define gate. Do not pre-resolve product questions in advance.

If you write any prompt yourself, copy the `Working directory:` line above unchanged into it.

Report: the artifacts you wrote (paths), whether you made any `PRD/sections/` edits (and exactly what), any new stable IDs, how you handled the corpus/behavior split, whether you set `STATUS.refined`, and any genuine blocker you could not resolve. Do not create a GAMEPLAN or slice docs (that is node 5). Do not dispatch further nodes.

## Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
| Write the current-state feature spec for the trade-balancer feature — Phase A #3 of the docs-refactor gameplan. Land it at PRD/sections/trade-balancer/README.md on the DEC-168 template. Frontend-only but it carries a corpus: apply the gameplan's data/ bucket test and split the corpus from the behavior. Keep it draft and non-authoritative. | answered-once | shape | — |
