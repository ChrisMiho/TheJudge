# thejudge-implement-all reference

## Binding implementation constraints

1. No deterministic rules-engine, legality validation, or board-state simulation.
2. No API request/response shape changes without a cited confirmed decision.
3. No new product-facing endpoints without a cited confirmed decision.
4. Preserve stack ordering semantics across UI, API, prompt, and tests.
5. Any Scryfall download or network refresh requires explicit human approval.
6. Invocation authorizes scoped milestone commits, shared-branch pushes, PR creation, title updates, exceptional-event comments, and deletion only of later duplicate comments with the same marker and authenticated author. It never authorizes force-push, PR merge/close, or a merge into the recorded autonomous base.

Also preserve active product truth from the feature specs `PRD/sections/<feature>/README.md` (open `PRD/sections/decisions.md` only to resolve a cited `DEC-ID`) and `PRD/instructions/technical-design-rules.md`. For UI layout, containment, density, or “fill/stretch” slices, also read and follow `PRD/sections/screen-layout.md` (DEC-149 / REQ-126); do not invent sizes that contradict the catalog.

## Slice status

Use `planned` / `in-progress` / `done` / `blocked` as a single status line near the top of each slice doc. Preserve an existing format and change only its value. Keep the work package itself `active`; update only its README slice table and status notes.

Do not commit a `blocked` slice. Keep its local status/evidence in the worktree, add a blocker comment when the PR exists, and stop.

Stopping before a slice reaches `done` for any reason (session end, usage limit, blocker): append the `### Handoff` block defined in `PRD/instructions/workflow-reference.md` under the status line, in the worktree, before stopping.

## Git and worktree contract

### Preflight

1. Confirm `origin`, the recorded autonomous base ref, GitHub authentication, and push access.
2. Fetch `origin/<recorded base>` and the requested shared branch.
3. Derive the shared branch as `thejudge-auto/<slug>` unless the user supplied a branch or PR. **If the resolved shared branch equals the recorded autonomous base, block before worktree creation and report it: a pull request's head and base cannot be the same ref, so this branch can never open a clean PR.** Supply a distinct branch — conventionally `<recorded-base>-work` — and restart. The collision arises whenever the recorded base is itself a `thejudge-auto/<slug>` branch, which every graph run's base is; graph runs avoid it by supplying `thejudge-auto/<slug>-work` explicitly. Left unguarded, the skill would improvise — pushing some slices straight onto the base and the rest onto an ad-hoc fork — so the PR never shows the full deliverable (observed on `life-tracker-spec` PR #105 and `user-feedback-spec` PR #107).
4. Create a unique local contributor branch and an isolated worktree at `.worktrees/implement-<slug>`. Multiple worktrees cannot check out the same local branch. Refuse to create or adopt a worktree at any path outside the repo-local `.worktrees/` root — a sibling directory such as `../<repo>-worktrees/`, a temp/scratchpad path, or an absolute path elsewhere on disk are all blockers, not adoptable states. This mirrors the identical preflight refusal `thejudge-prepare` applies to preparation worktrees.
5. Base the contributor branch on `origin/<shared-branch>` when it exists; otherwise use `origin/<recorded base>`.
6. Confirm the selected GAMEPLAN, slice docs, and relevant baseline exist unchanged at that remote start point. If the launch checkout has relevant modified or untracked inputs, block and report them; never copy, stash, or commit them implicitly.
7. Record the launch checkout's status and do not alter, stage, stash, or commit its files.
8. If `.worktrees/prepare-<slug>` exists for this package, verify its preparation PR merged into the recorded autonomous base and that the worktree is clean, then remove that preparation worktree and its local branch (per `preparation-contract.md`'s "Worktree retention" section). This implementation's own worktree is separate and unaffected by that check.

If a PR number is supplied, resolve it before branch setup. Require an open PR in the `origin` repository whose base equals the recorded autonomous base; adopt its exact head branch. If both PR and branch are supplied, they must match. Block on closed PRs, forks, base mismatch, or head mismatch.

Keep the worktree after completion and report its path. Do not delete worktrees or local branches automatically.

### Shared-branch publication

- Stage every intended slice output, including required config/scripts and status files. Inspect `git diff --cached`; require no relevant unstaged or non-ignored untracked changes, so the worktree being tested matches the index.
- Run the slice verification and `npm run quality:check` after staging. Commit only while both pass on that exact tree.
- Before pushing, fetch and rebase onto `origin/<shared-branch>` when it exists. Until then, rebase onto `origin/<recorded base>`; if the shared ref appears during the race, rebase onto it before retrying.
- Resolve rebase conflicts by preserving both flows' intended behavior. Abort and block when intent cannot be determined from confirmed decisions and tests.
- Recheck that the non-ignored worktree matches the index after testing and immediately before commit.
- A rebase or conflict resolution invalidates earlier verification. Rerun the slice verification and `npm run quality:check`; amend the unpushed milestone only after the corrected tree is green.
- Push `HEAD:<shared-branch>` without force. A rejected non-fast-forward push starts another fetch/rebase/verify/push cycle.
- Never use `--force` or `--force-with-lease` on the shared branch.

## PR discovery and lifecycle

Find an open PR in the `origin` repository whose head is the shared branch and whose base is the recorded autonomous base (for example `origin/feature/example`; `main` is only ever an example value here, never an assumed default). Scan both its body and comments for canonical `registered:<slug>` markers.

- No PR: after the first green milestone reaches GitHub, create one with the title/body below.
- Existing PR, work-package marker absent: before implementation, add one registration comment containing the work-package goal and GAMEPLAN summary. Re-query unresolved blockers; set `BLOCKED` if any exist, otherwise `IN PROGRESS`. Re-query once more and restore `BLOCKED` if a blocker crossed the update.
- Existing marker: do not post another registration comment. When registered work is active, use the same blocker-aware title update.
- Create race: re-query the PR after creation fails; join the winner rather than retrying duplicate creation.
- Blocker: post one idempotent blocker comment, then set the title status to `BLOCKED`.
- Resolved blocker: post one resolution comment. Return the title to `IN PROGRESS` only when no unresolved blocker marker remains and registered work is still active.
- Ready: use the race-safe loop below. Preserve the PR's original feature descriptor and change only the status prefix.

Never merge, close, or auto-approve the PR.

### Race-safe READY loop

1. Publish any remaining green milestone through the normal non-force push loop.
2. Fetch and capture remote head `H`, registered-work markers `R`, and unresolved blockers `B` (blocker IDs without matching resolution markers).
3. Rebase the clean contributor branch onto `H`; require no local commits ahead. Confirm every slice registered by `R` is `done`, require `B` empty, then run `npm run quality:check` on that exact shared head.
4. Immediately before editing the title, re-query head, `R`, and `B`. If any differs, restart.
5. Set `READY`, then re-query once more. If anything changed or work is no longer ready, restore `BLOCKED` when blockers exist, otherwise `IN PROGRESS`, and restart or stop on the blocker.

Title priority is always `BLOCKED` > `IN PROGRESS` > `READY`. Every registration posts its marker before a blocker-aware title update; every blocker posts its marker before setting `BLOCKED`. Re-query after title changes and restore the higher-priority state when events cross.

## PR title

```text
[THEJUDGE-AUTO][IN PROGRESS] <Feature name> (<work-slug>)
[THEJUDGE-AUTO][BLOCKED] <Feature name> (<work-slug>)
[THEJUDGE-AUTO][READY] <Feature name> (<work-slug>)
```

## Initial PR body

The body opens with the PR-body plain-language block from
`PRD/instructions/plain-language-standard.md` — *What this is · What you need to
do · What it changes* — written in product terms with any cited `REQ`/`DEC`
substance inlined. The `## Automated implementation` machine detail below it is
unchanged; the plain-language block sits above it so the owner reads the ask
first, the record second.

```markdown
<!-- thejudge-auto:v1:registered:<work-slug> -->

## What this is
<One or two plain sentences: what the feature does for a player or the owner.>

## What you need to do
<The owner's action — review the diff, then merge when green — or "Nothing yet"
while work is in progress.>

## What it changes
<What a player or the owner will see or be able to do that they could not before.>

## Automated implementation

### Feature
- Work package: `<work-slug>`
- GAMEPLAN: `PRD/work/<work-slug>/GAMEPLAN.md`
- Shared branch: `<shared-branch>`
- Autonomous base: `<origin/branch>`
- Base commit: `<origin/<recorded base>-sha>`

<Concise feature goal>

### Gameplan
- Slice A — <title>
- Slice B — <title>

### Quality gates
- Slice verification: `<commands from slice docs>`
- Repository verification: `npm run quality:check`

### Implementation policy
One green milestone commit per slice; single-agent sequential implementation;
shared-branch rebase and reverification before push; manual merge only.

### Registered work packages
- `<work-slug>` — initial
```

Do not spend tokens posting ordinary progress or completion comments. Commits, checks, and the `READY` title provide that record.

## Exceptional-event comments

Every comment starts with a stable hidden marker. Derive `<stable-id>` deterministically from immutable event identity: event type, work slug, slice, and normalized failing operation or affected decision key. Conflict IDs use the upstream SHA plus the original local milestone SHA, not a rewritten result SHA. Reuse the same event ID across retries and paired resolutions.

Before posting, search for the marker and update or skip the existing comment. After posting, re-query all comments with that marker. The lowest GitHub comment ID is canonical; delete only later duplicates authored by the current authenticated actor. Never delete another actor's comment. Never include secrets or large raw logs.

### Additional work package

```markdown
<!-- thejudge-auto:v1:registered:<work-slug> -->

## [THEJUDGE-AUTO] Work package registered

- Work package: `<work-slug>`
- GAMEPLAN: `PRD/work/<work-slug>/GAMEPLAN.md`
- Starting shared head: `<sha>`

### Goal
<Concise goal>

### Planned slices
- A — <title>
- B — <title>
```

### Blocker or resolution

```markdown
<!-- thejudge-auto:v1:blocker:<work-slug>:<slice>:<stable-id> -->

## [THEJUDGE-AUTO] Blocker — <work-slug> / Slice <letter>

### Failure
<Command or operation and concise evidence>

### Attempts
- <Action and result>

### Impact
No milestone was pushed and no later slice started. <State whether an unpushed local milestone exists.>

### Needed resolution
<Concrete decision or external change>
```

A resolution comment uses the same fields, a `resolution` marker, and links the blocker comment.

### Scope or decision update

```markdown
<!-- thejudge-auto:v1:decision:<work-slug>:<stable-id> -->

## [THEJUDGE-AUTO] Scope or decision update

### Discovery
<What was learned>

### Plan impact
<Changed scope, dependency, or sequencing>

### Action and verification impact
<What changed, why, and how coverage changed>
```

### Conflict resolution

```markdown
<!-- thejudge-auto:v1:conflict:<work-slug>:<slice>:<upstream-sha>:<original-local-sha> -->

## [THEJUDGE-AUTO] Shared-branch conflict resolved

- Work package / slice: `<work-slug>` / `<letter>`
- Upstream head: `<sha>`
- Resulting head: `<sha>`
- Conflicting files: `<paths>`

### Resolution
<How both flows' intent was preserved>

### Post-resolution verification
- Passed: `npm run quality:check`
```

## Example lifecycle

Slice B passes its verification and the full quality gate, so the agent creates its single milestone commit. A fetch reveals another worktree pushed Slice C first. The agent rebases B onto the new shared head, resolves the overlap, reruns the full quality gate, and pushes successfully. It posts a conflict-resolution comment because the resolution was exceptional, then proceeds to the next dependency-ready slice without posting a routine progress comment.
