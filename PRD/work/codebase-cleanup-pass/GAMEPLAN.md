# Gameplan — codebase-cleanup-pass

A behavior-preserving health pass. Players see no change, except that In-Depth combo matching gets faster (slice E). Source of truth for what to change: `DESIGN-BRIEF.md`. This file says how the eleven slices are built, in what order, and how each is proven.

## Build order and dependencies

Slices are built strictly in order A to K, one commit series per slice, on branch `thejudge-auto/codebase-cleanup-pass-work`. Each slice stands alone: if the build stops after any slice, what landed is complete and proven.

| Slice | Title | Depends on | Why the order matters |
| --- | --- | --- | --- |
| A | Backend tests faster, no leaked temp folders | none | Speeds every later backend run |
| B | Frontend tests: lighter setup, shared helpers | none | Speeds every later frontend run |
| C | Checks that already pass are switched on | none | Later slices are then held to the stricter checks |
| D | Ship only what runs; scripts share helpers | A (touches `scripts/lib/fake-embedding-model.mjs`) | A adds cleanup to that file first |
| E | Combo matching skips incomplete combos | none | Edits `commanderSpellbook/matcher.ts` before G |
| F | Prompt pipeline written once | none | Edits `prompt/promptFormatting.ts` before G |
| G | Rule search scoring, guarded by an order snapshot | E, F | G drops one export from `matcher.ts` after E and exports from `promptFormatting.ts` after F |
| H | In-Depth question flow loses dead wiring | none | |
| I | Scanner hook keeps only what screens use | none | |
| J | Dead and duplicated styles go | B (shared CSS test helpers) | Browser-risk slice |
| K | Life Tracker cleanups | J | Browser-risk slice; touches `index.css` consumers J already settled |

## Rules every slice follows (from the brief)

1. Players see no change. A finding whose proof fails (golden prompt moves, order snapshot moves, built CSS or computed style differs, a test count drops) is reverted and recorded in the slice's evidence log, never bent to pass.
2. `apps/backend/src/eval/fixtures/*.prompt.golden.txt` and `*.context.golden.json` stay byte-identical across the whole package. Check: `git diff --stat origin/main -- apps/backend/src/eval/fixtures` prints nothing.
3. No `PRD/sections/` edits. No `GATE-QUESTIONS.md` exists.
4. Protected paths are never edited: `scripts/graph-boundary-hook.mjs`, `.claude/**`, `CLAUDE.md`, every `thejudge-*` and `codehealth` skill.
5. Stay out of the four pending briefs' files except the regions each slice names.
6. No new dependency (slice C declares packages the lockfile already resolves).
7. Test titles follow `PRD/instructions/test-naming.md`: outermost `describe` is `Frontend - <Feature>` or `Backend - <Feature>`.
8. Never run: `npm run data:refresh`, data rebuilds, paid evals, deploys.
9. Re-read every cited line number before editing; the brief marks which were confirmed and which are the probes' numbers.

## Per-slice routine

1. Record the baseline on the current tip before editing: the slice's test counts and timings, written to `PRD/work/codebase-cleanup-pass/slice-<letter>.evidence.md`.
2. Make the change in small commits. Run the slice's verification commands after each.
3. Tick a criterion in `slice-<letter>.criteria.json` only after its evidence exists (command run in this worktree, or dated observation line in the evidence log for `manual` criteria).
4. Set the slice doc's `## Status:` to `done` and update the README slice table.
5. If a finding's proof fails, revert that finding, write the reason in the evidence log, and record it in the slice doc under `## Reverted findings`. The slice still closes.

## Where deliverables live (important)

`thejudge-cleanup` deletes `PRD/work/codebase-cleanup-pass/` on this branch before the owner merges. Anything the code PR must still carry therefore lives outside `PRD/work/`:

- **Kept (committed):** `docs/design/codebase-cleanup-pass/slice-j/` and `docs/design/codebase-cleanup-pass/slice-k/`. Each holds the REQ-202 Life Tracker before/after screenshot pairs at 390x844 and 1440x900 (`before-390x844.png`, `after-390x844.png`, `before-1440x900.png`, `after-1440x900.png`), and a `README.md` with the PR-ready summary. Slice J also keeps `computed-style-summary.md` (element count per tool and colour profile, and the result of the before/after comparison; the raw dumps are throwaway).
- **Throwaway (inside `PRD/work/codebase-cleanup-pass/.playwright-mcp/`):** raw browser captures and raw computed-style JSON dumps used only during verification. They are deleted with the package.
- The PR description for J and K must state that the Life Tracker table's elements are part of the computed-style dump (slice J) and that the screenshot pairs are attached from `docs/design/codebase-cleanup-pass/`.

## Browser verification (slices J and K)

Per `PRD/instructions/runtime-process-hygiene.md`: start the dev server from this worktree on an owned port. Capture "before" on the untouched tip before the slice's first edit, then "after" with the same procedure. Close the browser with `browser_close`, stop the owned server, confirm the port is released, and record the capture path in the evidence log. The cleanup-evidence criterion in J and K covers this.

## Verification checklist for the whole package (end of slice K)

- `npm run typecheck`, `npm run lint`, `npm run format:check` exit 0.
- `npm --workspace apps/backend run test`, `npm --workspace apps/frontend run test`, `npm run test:scripts` green.
- `npm --workspace apps/frontend run build` prints zero CSS warnings.
- Eval goldens byte-identical to `origin/main`.
- `git status --porcelain` empty after the final commit; no file under `PRD/sections/` or protected paths changed (`git diff --stat origin/main -- PRD/sections .claude CLAUDE.md scripts/graph-boundary-hook.mjs` prints nothing).

## Not built here

See the brief's disposition table and follow-ups. Post-merge owner steps (live In-Depth question and CloudWatch tail after the CI deploy; counting `$TMPDIR` after the next local `npm test`; resuming held `codehealth` items) are not build criteria.

## PRD promotion checklist (executed in cleanup)

None. The package changes no product truth. Cleanup verifies that `docs/design/codebase-cleanup-pass/` is present and deletes `PRD/work/codebase-cleanup-pass/`.
