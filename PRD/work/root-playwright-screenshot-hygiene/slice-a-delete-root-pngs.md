# Slice A — Delete unreferenced root PNGs

## Status: planned

## Goal

Delete the 33 confirmed-unreferenced, untracked, gitignored root-level `*.png` files.

## Requirements

1. Re-verify (do not trust a stale list) that every root-level `*.png` is untracked and ignored: `git status --porcelain --ignored=matching -- '*.png'` — every entry must show `!!`.
2. Re-verify no in-repo references before deleting: for each root PNG filename, `grep -rl <filename> --exclude-dir=node_modules --exclude-dir=.git .` must return zero matches.
3. Delete only root-level PNGs (files directly in the repo root, not the tracked assets under `apps/frontend/public/assets/` or `apps/frontend/src/lib/scan/__fixtures__/`, and not PNGs inside any subdirectory).
4. Do not touch `.gitignore` — the existing `/*.png` root rule already covers this; no change needed.

## Acceptance criteria

- [ ] `git ls-files -- '*.png'` output is unchanged (still exactly the 5 pre-existing tracked PNGs: `apps/frontend/public/assets/cats-homescreen.png` and the 4 `apps/frontend/src/lib/scan/__fixtures__/detector/real/*.png` fixtures)
- [ ] `git status --porcelain --ignored=matching -- '*.png'` at repo root shows no more `!!` entries for root-level files (only non-root ignored PNG paths, if any, remain — expected: none)
- [ ] `git status --porcelain` (unfiltered) shows no diff from the deletion (files were untracked/ignored, so nothing to stage or commit)
- [ ] No `grep -rl` match existed for any deleted filename before deletion (confirms nothing broke)

## Verification

```bash
git status --porcelain --ignored=matching -- '*.png'
git ls-files -- '*.png'
git status --porcelain
```

## Files touched

- 33 root-level `*.png` files (delete only — no code or committed files change)
