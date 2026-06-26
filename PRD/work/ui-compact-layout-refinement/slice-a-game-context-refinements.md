# Slice A — Game Context Refinements

## Status: done

## Goal

Compact the game context step (`App.tsx` game-context branch) with three presentation changes that reduce vertical space and improve tap targets without altering flow logic or payloads.

## Requirements

### A1 — Cat wizard Easter egg

- Hide `cats-homescreen.png` by default (no placeholder gap).
- Reveal after **10 clicks** on the `TheJudge` brand title while on the game context step.
- Once revealed, image stays visible for the browser session (`useState` in `App.tsx`; no localStorage; no hint text).
- Add optional `onBrandClick` to `StagedStepHeader`; render brand as a plain `<button>` when provided.

### A2 — Turn phase + active player side-by-side

- Merge the two separate bordered panels into one.
- `grid grid-cols-1 sm:grid-cols-2` for Turn phase and Active player (label-above-select pattern).
- Combat step select remains conditional, full-width below the grid when phase is `combat`.
- Remove `(recommended)` from all active-player labeling; remove duplicate inline `Active player` row.

### A3 — Wider player-control buttons

- Expand/collapse: `px-3 py-1.5 min-w-[2.4rem]`
- Add / Remove: `px-4 py-1.5 min-w-[2.75rem]`
- Same in both chunky and slim density modes.

## Acceptance criteria

- [ ] Cat image not in document on initial game-context render.
- [ ] 10 clicks on `TheJudge` brand reveals image with `src="/assets/cats-homescreen.png"`.
- [ ] Fewer than 10 clicks does not reveal image.
- [ ] `getByLabelText("Turn phase")` and `getByLabelText("Active player")` still work; `recommended` not in document.
- [ ] Existing add/remove player tests pass.

## Dependencies

- `parallel-ready`: DEC-067 (inline step header), DEC-066 (theme chrome pattern for reference only)

## Files touched

- `apps/frontend/src/App.tsx`
- `apps/frontend/src/components/StagedStepHeader.tsx`
- `apps/frontend/src/App.test.tsx`
- Optional: `apps/frontend/src/components/StagedStepHeader.test.tsx`

## Verification

```bash
npm --workspace apps/frontend run test -- src/App.test.tsx
npm --workspace apps/frontend run typecheck
```
