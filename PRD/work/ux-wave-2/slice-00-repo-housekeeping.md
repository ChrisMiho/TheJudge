# Slice 00 — Repo housekeeping

status: pending

**Prerequisites:** None  
**Next slice:** [slice-01-backend-contract.md](./slice-01-backend-contract.md)

## Goal

Clean git baseline before product work: kickoff skill on `main`, stale branches removed, feature branch created, **and UX Wave 2 planning docs committed and pushed** so they survive cleanup.

## Tasks

### A — Kickoff skill (separate PR)

- [ ] Open PR: `workflow/next-iteration` → `main` (**kickoff skill only** — do not include `PRD/work/` in this PR)
- [ ] Merge when CI/green

### B — Feature branch + planning docs (do this before deleting branches)

- [ ] `git checkout main && git pull origin main`
- [ ] `git checkout -b workflow/ux-wave-2`
- [ ] Stage and commit planning docs:
  ```bash
  git add PRD/work/ux-wave-2/
  git commit -m "Add UX Wave 2 sequential implementation slices."
  ```
- [ ] `git push -u origin workflow/ux-wave-2`

> **Why before cleanup:** `PRD/work/ux-wave-2/` is currently **untracked**. Untracked files usually stay in your working tree when switching branches, but they are **not on the remote** until committed and pushed. Pushing now prevents loss if you reset, re-clone, or work from another machine.

### C — Branch cleanup (after B is pushed)

- [ ] Delete merged/stale branches (local + remote where safe):
  - `workflow/next-iteration`
  - `skills/workflow-acceleration`
  - `feat/openai-migration`
  - `may-08-2026`
  - `origin/workflow/new-gameplan-iteration` if still present
- [ ] `git fetch --prune`
- [ ] Confirm still on `workflow/ux-wave-2` with planning docs present

## Validation gate

```bash
git branch -vv          # on workflow/ux-wave-2, tracking origin
git status              # clean
git log main..HEAD --oneline   # empty or only intentional commits
```

Manual:

- [ ] Kickoff skill files exist on `main` under `.claude/skills/kickoff/`
- [ ] `PRD/work/ux-wave-2/` exists on remote `origin/workflow/ux-wave-2`
- [ ] Stale remote branches from list above are gone (or consciously kept)

## Done when

- Working on `workflow/ux-wave-2` from latest `main`
- Kickoff skill merged to `main`
- **UX Wave 2 slice docs committed and pushed** on `workflow/ux-wave-2`
- No unmerged obsolete branches cluttering `git branch -a`

## Out of scope

- Any product code or PRD promotion
- Deleting `main` or force-pushing
