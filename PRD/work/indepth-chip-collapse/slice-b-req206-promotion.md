# Slice B — REQ-206 apply and ship gates

## Status: done

## Goal

Durable product truth says the chip is state-aware, and the package is ready to close.

## Requirements

1. Re-read the current REQ-206 line in `PRD/sections/functional-requirements.md` (anchor-ask-composer, PR #262, has merged; the line already has the ring-based character budget, live region and downward growth).
2. Replace only the sub-clause `(labelled or icon-only at each width as the mockup shows)` with: `(labelled or icon-only by width and composer state: the "In-depth" label shows only while the box is empty and the question field is unfocused, and the chip collapses to the ◈ glyph alone once the question field is focused or the box holds text, freeing the single-row width for the question; keyboard focus on the chip, microphone or send control does not collapse it; the `<480px` always-icon-only rule is unchanged; the chip's accessible name is unaffected)`. Leave the rest of the line intact.
3. Append the approved Notes bullet to REQ-206 (text in `GATE-QUESTIONS.md`, "amended by `indepth-chip-collapse`"), keeping the textarea-scoped selector wording. Do NOT replay the frozen replace-anchor.
4. Confirm no other PRD file needs an edit (`quick-lookup/README.md` does not carry the detail).

## Acceptance criteria

- [x] REQ-206's acceptance line contains the state-aware sub-clause and no longer contains `labelled or icon-only at each width as the mockup shows`
- [x] The rest of that REQ-206 line (ring-based character budget, live region, downward growth) is byte-identical to before (`git diff` shows only the sub-clause changed on that line)
- [x] REQ-206 Notes carries the `indepth-chip-collapse` bullet naming the textarea-focus scoping and the mockup departure
- [x] `grep -n "at each width as the mockup shows" PRD/sections/` returns no hit
- [x] `npm run quality:check` is green

## Verification

```bash
grep -n "at each width as the mockup shows" PRD/sections/functional-requirements.md
git diff --stat PRD/sections/
npm run quality:check
```

## Files touched

- `PRD/sections/functional-requirements.md`

## PRD promotion checklist (executed in cleanup)

- [x] REQ-206 truth present in `PRD/sections/` (applied here at build)
- [x] Receipt written; STATUS.md board row moved; `PRD/work/indepth-chip-collapse/` deleted

## Ship gates

- [x] Slice acceptance criteria satisfied and verified
- [x] Tests updated; `npm run quality:check` green for touched areas
- [x] Public contract unchanged unless slice scoped a change
- [x] No secrets committed
- [x] Durable outcomes promoted; `PRD/work/indepth-chip-collapse/` ready to delete
