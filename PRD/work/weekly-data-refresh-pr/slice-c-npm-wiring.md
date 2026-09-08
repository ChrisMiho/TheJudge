# Slice C — npm script wiring

## Status: done

## Goal

Wire `scripts/refresh-and-open-pr.mjs` to a named npm script so the owner runs
one command weekly, consistent with the repo's `data:*` script naming.

## Requirements

1. Add a `"data:refresh-pr": "node scripts/refresh-and-open-pr.mjs"` entry to
   `package.json`'s `scripts` block, placed near the other `data:*` entries
   (after `data:refresh-combos`, matching the file's existing grouping).
2. Do not alter any existing script entry's command string.
3. Never invoke the new script for real in this slice's own verification — the
   entry existing and pointing at the right file is a static check, not a run.

## Acceptance criteria

- [ ] C1: `npm pkg get scripts.data:refresh-pr` prints
      `"node scripts/refresh-and-open-pr.mjs"`
- [ ] C2: `git diff --unified=0 -- package.json` shows the new script line as
      the only change to `scripts`, no existing entry's value changed

## Verification

```bash
npm pkg get scripts.data:refresh-pr
git diff --unified=0 -- package.json
```

## Files touched

- `package.json`
