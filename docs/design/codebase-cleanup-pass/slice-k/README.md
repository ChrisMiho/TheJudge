# Slice K: Life Tracker cleanups

Players see no change. The Life Tracker's Game setup header loses eight utility classes that did nothing (the stylesheet rule already sets every property), an unused index file is deleted, and the Life Tracker hook moves next to the other hooks.

## Proof it looks the same (REQ-202)

- Screenshot pairs with the Game setup sheet open: `before-390x844.png` / `after-390x844.png` and `before-1440x900.png` / `after-1440x900.png` in this folder. As in slice J's pairs, the ambient backdrop and the header orb animate, so a few pixels differ between any two captures; the layout, the sheet and its text match.
- `computed-style-summary.md` in this folder: the header `<p>` and `<h2>` have an identical computed style before and after (597 properties each, at both sizes). The one name that differs is Tailwind's internal `--tw-text-opacity` variable, which nothing reads.
- The Life Tracker tests (8 files, 200 tests) and the full frontend suite (156 files, 1,671 tests) pass with the same counts as before; typecheck, lint and the production build exit 0.

## What changed

- `PlayerLifeTrackerApp.tsx`: the header `<p>` and `<h2>` lose their classes; one import line points at the moved hook.
- Deleted `lib/lifeTracker/index.ts` (nothing imported `lib/lifeTracker` as a whole).
- Moved `lib/lifeTracker/useLifeTracker.ts` and its test to `hooks/` with their imports corrected; `vite.config.ts` pins the moved test to jsdom at its new path.
- One test assertion follows the change: "uses accent-soft for the dark Game Setup modal's accent heading" checked for the `text-accent-soft` class; it now checks that the heading has no class and that the stylesheet rule sets `color: var(--accent-soft)`.
