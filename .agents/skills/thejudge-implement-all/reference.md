# thejudge-implement-all reference

## Binding implementation constraints

1. No deterministic rules-engine, legality validation, or board-state simulation.
2. No API request/response shape changes without a cited confirmed decision.
3. No new product-facing endpoints without a cited confirmed decision.
4. Preserve stack ordering semantics across UI, API, prompt, and tests.
5. Any Scryfall download or network refresh requires explicit human approval.
6. Invocation authorizes scoped milestone commits, package-branch pushes, PR creation, title updates, exceptional-event comments, and deletion only of later duplicate comments with the same marker and authenticated author. It never authorizes force-push, PR merge/close, or a merge into any base branch.

Also preserve active product decisions from `PRD/sections/decisions/` and `PRD/instructions/technical-design-rules.md`.

## Slice status

Use `planned` / `in-progress` / `done` / `blocked` as a single status line near the top of each slice doc. Preserve an existing format and change only its value. Keep the work package itself `active` while any registered slice is not `done`; update only its README slice table and status notes.

Do not commit a `blocked` slice. Keep its local status/evidence in the worktree, add a blocker comment when the PR exists, and stop.

Stopping before a slice reaches `done` for any reason (session end, usage limit, blocker): append the `### Handoff` block defined in `PRD/instructions/workflow-reference.md` under the status line, in the worktree, before stopping.

## Git and worktree contract

### Preflight

1. Confirm `origin`, GitHub authentication, push access, and permission to query, create, edit, and comment on pull requests. Capture `<feature-base>` from the current non-detached local branch, unless an explicit base was supplied; an explicit base must equal the current branch.
2. Require a clean launch checkout and a remote `origin/<feature-base>` at the same commit as local `HEAD`. If it is dirty, ahead, behind, detached, or has no remote tracking branch, block and report it. Never copy, stash, or commit its files implicitly.
3. Fetch `origin/<feature-base>`. Derive the package branch as `thejudge-auto/<slug>`; it is unique to this work package and never shared with another package.
4. Resolve any supplied PR before branch setup. It must be open, in `origin`, have head `thejudge-auto/<slug>`, and base `<feature-base>`. Block on a closed PR, fork, base mismatch, or head mismatch; never repoint, join, or reuse it.
5. Read the package README's `### Implementation handoff` before creating a
   worktree. If its `Worktree` path exists and `git worktree list --porcelain`
   confirms that it checks out `thejudge-auto/<slug>`, reopen that retained
   worktree and preserve its local handoff/uncommitted state. Otherwise create
   the package branch from `origin/<feature-base>` in one isolated worktree.
   If the exact package branch already exists, create the worktree from it only
   after the matching-PR check succeeds. Multiple worktrees cannot check out
   the same local branch; if an existing package worktree is not usable, block
   and report it rather than creating a second one.
6. Confirm the selected GAMEPLAN, slice docs, and relevant baseline exist unchanged at that remote start point. Record the launch checkout's status and do not alter, stage, stash, or commit its files.

Keep the worktree after completion and report its path. Do not delete worktrees or local branches automatically.

### Package-branch publication

- Stage every intended slice output, including required config/scripts and status files. Inspect `git diff --cached`; require no relevant unstaged or non-ignored untracked changes, so the worktree being tested matches the index.
- Run the slice verification and `npm run quality:check` after staging. Commit only while both pass on that exact tree.
- Before pushing, fetch and rebase onto `origin/<feature-base>`.
- Resolve rebase conflicts by preserving both flows' intended behavior. Abort and block when intent cannot be determined from confirmed decisions and tests.
- Recheck that the non-ignored worktree matches the index after testing and immediately before commit.
- A rebase or conflict resolution invalidates earlier verification. Rerun the slice verification and `npm run quality:check`; amend the unpushed milestone only after the corrected tree is green.
- Push `HEAD:thejudge-auto/<slug>` without force. A rejected non-fast-forward push starts another fetch/rebase/verify/push cycle.
- Never use `--force` or `--force-with-lease` on the package branch.

## PR discovery and lifecycle

Find an open PR in the `origin` repository whose head is
`thejudge-auto/<slug>` and whose base is exactly `<feature-base>`. Scan its
body and comments for the canonical `registered:<slug>` marker. A PR with the
same head but any other base is a blocker, never a candidate to join.

- No PR: after the first green milestone reaches GitHub, create one with the title/body below.
- Existing PR, work-package marker absent: before implementation, add one registration comment containing the work-package goal and GAMEPLAN summary. Re-query unresolved blockers; set `🔴 BLOCKED` if any exist, otherwise `🟡 IN PROGRESS`. Re-query once more and restore `🔴 BLOCKED` if a blocker crossed the update.
- Existing marker: do not post another registration comment. When registered work is active, use the same blocker-aware title update.
- Create race: re-query the PR after creation fails. Join only a winner with the exact package head and feature base; otherwise stop as blocked.
- Blocker: when a valid package PR exists, post one idempotent blocker comment, then set its title status to `🔴 BLOCKED`. When no valid package PR exists, write the required local handoff and report the blocker; never comment on, retitle, close, or repoint a wrong-base PR.
- Resolved blocker: post one resolution comment. Return the title to `🟡 IN PROGRESS` only when no unresolved blocker marker remains and registered work is still active.
- Ready: use the race-safe loop below. Set the complete canonical title; do not preserve a stale descriptor, slug, base, icon, or status text.

Never merge, close, or auto-approve the PR.

### Race-safe READY loop

1. Publish any remaining green milestone through the normal non-force push loop, after rebasing onto the current `origin/<feature-base>`.
2. Fetch and capture the package-branch head `H`, feature-base head `F`, registered-work marker `R`, and unresolved blockers `B` (blocker IDs without matching resolution markers).
3. Require the clean contributor branch at `H`, no local commits ahead, and `H` based on `F`. Confirm the package's registered slices are all `done`, require `B` empty, then run `npm run quality:check` on that exact head.
4. Immediately before editing the title, re-query `H`, `F`, `R`, and `B`. If any differs, restart.
5. Set `🟢 READY TO MERGE`, then re-query once more. If anything changed or work is no longer ready, restore `🔴 BLOCKED` when blockers exist, otherwise `🟡 IN PROGRESS`, and restart or stop on the blocker.

Title priority is always `🔴 BLOCKED` > `🟡 IN PROGRESS` > `🟢 READY TO MERGE`. Every registration posts its marker before a blocker-aware title update; every blocker posts its marker before setting `🔴 BLOCKED`. Re-query after title changes and restore the higher-priority state when events cross.

## PR title

```text
[THEJUDGE-AUTO][🟡 IN PROGRESS] <Feature name> (<work-slug>)
[THEJUDGE-AUTO][🔴 BLOCKED] <Feature name> (<work-slug>)
[THEJUDGE-AUTO][🟢 READY TO MERGE] <Feature name> (<work-slug>)
```

## Initial PR body

```markdown
<!-- thejudge-auto:v1:registered:<work-slug> -->

## Automated implementation

### Feature
- Work package: `<work-slug>`
- GAMEPLAN: `PRD/work/<work-slug>/GAMEPLAN.md`
- Package branch: `thejudge-auto/<work-slug>`
- PR base branch: `<feature-base>`
- Base commit: `<origin/feature-base-sha>`

<Concise feature goal>

### Gameplan
- Slice A — <title>
- Slice B — <title>

### Quality gates
- Slice verification: `<commands from slice docs>`
- Repository verification: `npm run quality:check`

### Implementation policy
One green milestone commit per slice; single-agent sequential implementation;
feature-base rebase and reverification before push; manual merge only.

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
- Starting feature-base head: `<sha>`

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

## [THEJUDGE-AUTO] Feature-base conflict resolved

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

Slice B passes its verification and the full quality gate, so the agent creates
its single milestone commit. A fetch reveals the feature base advanced. The
agent rebases B onto that base, resolves the overlap, reruns the full quality
gate, and pushes successfully. It posts a conflict-resolution comment because
the resolution was exceptional, then proceeds to the next dependency-ready
slice without posting a routine progress comment.
