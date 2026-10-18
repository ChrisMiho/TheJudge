# Slice K: Game setup header, computed style

Result: the Game setup sheet's header `<p>` ("Life Tracker") and `<h2>` ("Game Setup") have the same computed style before and after the eight utility classes were removed. 597 properties each, at 390x844 and at 1440x900: 0 differ.

## Method

- The app served from this worktree on an owned port; Life Tracker opened; the Game setup sheet opened; for the two header elements (`[data-testid="life-tracker-game-setup"] .sheet-legacy-head p` and `... h2`) every property `getComputedStyle` lists was read, before the edit (the tip after slice J) and after it, at both viewport sizes. Raw JSON is throwaway, under `PRD/work/codebase-cleanup-pass/.playwright-mcp/`.
- Before, the `<p>` carried `text-xs font-bold uppercase tracking-[0.14em] text-accent-soft` and the `<h2>` `text-xl font-black text-zinc-100`. After, neither carries a class. The head rule in `index.css` (`[data-testid="life-tracker-game-setup"] .sheet-legacy-head p` and `h2`) sets every property those classes set, at higher specificity.

## The one difference

598 names appear in the lists; one is not a rendered property: the custom property `--tw-text-opacity: 1`, which Tailwind's colour utilities define so their own colour expression can read it. The two elements have no children and no other rule reads that variable, so nothing on screen depends on it. The other 597 properties, including `color`, `font-size`, `font-weight`, `letter-spacing`, `text-transform`, `line-height` and `margin`, are identical.
