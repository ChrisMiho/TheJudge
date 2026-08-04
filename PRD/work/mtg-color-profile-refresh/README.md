status: refined

# MTG Color Profile Refresh

This work package refreshes the fixed WUBRG profile values within the existing unified MTG theme
system.

## Refined outcome

- Make White more neutral and true-white while preserving separation from Colorless.
- Give Blue, Red, and Green more saturated neon energy.
- Move Black from muted plum to a more playful vivid purple with a purple-tinted near-black strong
  endpoint.
- Align each refreshed WUBRG Theme-menu swatch with its new `accent-soft` highlight.
- Preserve the four-token architecture, fixed Colorless profile/customization, global reach,
  persistence, and the hard 4.5:1 fixed-profile contrast floor.

## Product truth

- DEC-119
- REQ-099
- NFR-011
- FLOW-007 (unchanged)

See `DESIGN-BRIEF.md` for the approved exact values, scope, contrast evidence, and verification
boundaries.

## Slice table

| Slice | Name | Depends on | Status |
| --- | --- | --- | --- |
| A | Fixed catalog refresh and ship closure | — | done |

The package is one atomic slice because the authoritative catalog and its direct regression test
form a single implementation seam; there is no independent second objective or dependency blocker.

## Implementation map

| Slice | New files | Files edited |
| --- | --- | --- |
| A | — | `apps/frontend/src/lib/theme/palettes.ts`, `apps/frontend/src/lib/theme/palettes.test.ts` |

## Next step

```text
$thejudge-implement PRD/work/mtg-color-profile-refresh/ slice A
```

For one unattended agent completing every remaining slice (currently only A):

```text
$thejudge-implement-all PRD/work/mtg-color-profile-refresh/
```
