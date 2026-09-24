# Slice G — gallery-and-ship-gates

## Status: done

## Goal

One entry point for the owner's review —
`docs/design/ui-reimagining/index.html`, linking every flow mockup and the
Life Tracker before/after pair — and confirmation that
this package delivered exactly what `DESIGN-BRIEF.md` promised: the approved
PRD truth applied once, direction 1 as clickable mockups, no app code. Carries
the PRD promotion checklist and the Ship gates block.

## Requirements

1. `docs/design/ui-reimagining/index.html` links to
   `direction-1/shared-chrome-menu.html`, `direction-1/quick-question.html`,
   `direction-1/in-depth-question.html`, and `direction-1/trade-balancer.html`,
   plus the Life Tracker before/after pair (`before/life-tracker-*.png` next
   to `after/life-tracker-*.png`) — each entry labeled with its flow name and
   a note that it is viewable at phone (390x844) and desktop (1440x900)
   width.
2. Every linked page opens without a console error and renders recognizably
   at both viewports.
3. PRD promotion checklist (confirms slice A's output, does not re-write it):
   `REQ-200`-`REQ-205` exist in `functional-requirements.md`; `REQ-044`,
   `REQ-046`, `REQ-056`, `REQ-060`, `REQ-099`, `REQ-124`, `REQ-129`,
   `REQ-130`, `REQ-167` carry their amendments; `NFR-011` and `FLOW-007`
   carry theirs; no feature `README.md` `Built:` line changed.
4. No path under `apps/frontend` or `apps/backend` differs from the merge
   base — this package ships no app code.
5. The package `README.md` names `docs/design/ui-reimagining/index.html` as
   the one entry point for the owner's review.

## Acceptance criteria

- [ ] G1 — `docs/design/ui-reimagining/index.html` links all four flow
      mockup pages and the Life Tracker before/after pair, each labeled with
      its flow name and viewport note.
- [ ] G2 (manual) — every linked page opens without a console error and
      renders recognizably at 390x844 and 1440x900.
- [ ] G3 (manual) — `REQ-200`-`REQ-205` and the eleven amendments
      (`REQ-044/046/056/060/099/124/129/130/167`, `NFR-011`, `FLOW-007`) are
      present in `PRD/sections/`, re-checked against `GATE-QUESTIONS.md`'s
      finalized blocks.
- [ ] G4 — no `PRD/sections/<feature>/README.md` `Built:` line was added or
      changed by this package.
- [ ] G5 — `git diff <merge-base>...HEAD -- apps/frontend apps/backend` is
      empty.
- [ ] G6 — the package `README.md` names
      `docs/design/ui-reimagining/index.html` as the entry point for the
      owner's review.
- [ ] G7 — `npm run quality:check` passes.

## Verification

```bash
npm run quality:check
git diff --stat "$(git merge-base HEAD origin/main)"...HEAD -- apps/frontend apps/backend
ls docs/design/ui-reimagining/index.html
```

## Files touched

- `docs/design/ui-reimagining/index.html` (new)
- `PRD/work/ui-reimagining/README.md` (edit — entry-point note)

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged unless slice scoped a change
- [ ] No secrets committed
- [ ] Durable outcomes promoted: the `docs/design/ui-reimagining/` tree
      (README, `direction-1/`, `before/`, `after/`, `index.html`) is present
      and committed outside the package folder; `PRD/work/ui-reimagining/`
      ready to delete
