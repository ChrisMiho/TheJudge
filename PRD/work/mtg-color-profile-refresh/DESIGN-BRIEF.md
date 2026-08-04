# MTG Color Profile Refresh — Design Brief

## Status

- Product design: approved 2026-08-03
- Work package: refined
- Next gate: `$thejudge-quality-check PRD/work/mtg-color-profile-refresh/`

## Outcome

Refresh the five fixed Magic-color profiles so White reads as a truer white and Blue, Black, Red,
and Green recover the vivid neon energy of the earlier theme catalog. Black intentionally moves
from muted plum toward playful saturated purple. Colorless and every theme-selection behavior stay
unchanged.

## Approved approach

Amend the existing authoritative WUBRGC catalog in place. Keep the four-token frontend contract
(`accent`, `accent-strong`, `accent-soft`, `accent-contrast`) and use more saturated fixed values
rather than adding shadows, bloom, profile-specific component rules, new token roles, or a color
generation system.

The Theme-menu preview swatch for each refreshed WUBRG profile matches that profile's new
`accent-soft` value. This keeps the picker preview aligned with the most vivid expression of the
selected profile. Colorless keeps its existing fixed swatch and tokens.

Rejected alternatives:

- changing runtime tokens while retaining the old picker swatches, because White would still show
  a yellow picker marker and the previews would no longer represent the refreshed profiles
- adding CSS box-shadow/text-shadow glow, because the requested neon quality is a color direction,
  not a new presentation effect
- changing only `accent-soft`, because the primary and strong gradient endpoints would retain the
  muted/earthy identity the refresh is intended to replace

## Approved fixed catalog

| Profile | Picker swatch | `accent` | `accent-strong` | `accent-soft` | `accent-contrast` |
| --- | --- | --- | --- | --- | --- |
| White | `#FAF8F2` | `#EDE7D6` | `#B0A382` | `#FAF8F2` | `#09090B` |
| Blue | `#38E1FF` | `#0050D8` | `#1E3A9C` | `#38E1FF` | `#FFFFFF` |
| Black | `#C77DFF` | `#7C3AED` | `#2E1A47` | `#C77DFF` | `#FFFFFF` |
| Red | `#FF4D6D` | `#C10230` | `#7A0424` | `#FF4D6D` | `#FFFFFF` |
| Green | `#4AFFA0` | `#0A7A42` | `#0A5C33` | `#4AFFA0` | `#FFFFFF` |
| Colorless | `#71717A` | `#52525B` | `#27272A` | `#E4E4E7` | `#FFFFFF` |

Profile direction:

- White removes most of the yellow cast while retaining enough warmth to stay distinct from the
  neutral Colorless profile.
- Blue uses a deeper saturated primary blue and electric-cyan highlight.
- Black uses vivid violet as its primary color, a purple-tinted near-black strong endpoint, and an
  orchid highlight. This intentionally supersedes the prior muted-plum, not-bright-purple note.
- Red keeps its successful red identity while sharpening it with a hot-red highlight.
- Green moves away from earthy grass tones toward saturated emerald and neon green.

## Contrast contract

NFR-011's 4.5:1 minimum remains a hard constraint for `accent-contrast` against both `accent` and
`accent-strong`. The approved WUBRG values were recomputed with the same WCAG relative-luminance
formula used by `apps/frontend/src/lib/theme/palettes.test.ts`:

| Profile | Contrast against `accent` | Contrast against `accent-strong` |
| --- | ---: | ---: |
| White | 16.11:1 | 7.97:1 |
| Blue | 6.69:1 | 9.81:1 |
| Black | 5.70:1 | 15.50:1 |
| Red | 6.33:1 | 11.23:1 |
| Green | 5.42:1 | 8.10:1 |

The existing custom-Colorless exception remains unchanged: a user-selected custom RGB is applied
without contrast validation or correction.

## Scope and behavior

- Change the fixed `swatch`, `accent`, `accent-strong`, and `accent-soft` values for White, Blue,
  Black, Red, and Green to the approved catalog above.
- Preserve every `accent-contrast` value and all fixed Colorless values.
- Preserve WUBRGC order, Blue default, profile IDs, persistence, fallback, Colorless customization,
  global token reach, and semantic token roles.
- Keep every consumer surface structurally and behaviorally unchanged; consumers continue to read
  the shared catalog and CSS variables.
- Amend DEC-119 and REQ-099 rather than creating new IDs because this changes approved catalog
  values, not the theme architecture or behavior.
- Keep NFR-011's existing constraint language; the approved values satisfy it without an exception.
- Add no FLOW entry because profile selection, customization, reset, and reload behavior do not
  change.

The checked-out implementation's current `accent-soft` values differ from the pre-refresh values
recorded in DEC-119/REQ-099. The approved matrix above replaces both baselines and becomes the
single target for the later implementation, avoiding any attempt to restore the stale documented
values first.

## Failure behavior

No failure behavior changes. Unsupported profile fallback, malformed custom Colorless cleanup,
unavailable-storage degradation, and deliberately uncorrected custom Colorless contrast all retain
their existing DEC-119/REQ-099 contracts.

## Verification focus

- exact WUBRG swatch and four-token values plus unchanged fixed Colorless values
- WUBRGC order and Blue default remain unchanged
- the five refreshed picker swatches equal their respective `accent-soft` values
- `accent-contrast` clears 4.5:1 against `accent` and `accent-strong` for all fixed profiles
- Black remains visibly distinct from Colorless and the neutral slate shell
- representative existing consumers retint through the shared tokens with no local hardcoded-value
  changes
- Colorless customization, persistence, reset, and malformed/unavailable-storage behavior remain
  unchanged
- no request, schema, prompt, provider, backend, card-data, scan-engine, or data-pipeline changes

## Non-goals

- CSS shadow, bloom, halo, or animation effects
- new token roles, profile-specific component rules, or a color-generation engine
- changes to Colorless fixed values or custom-Colorless behavior
- customization of the five fixed Magic profiles
- profile order, naming, default, persistence, or fallback changes
- palette-tinted page backgrounds, light mode, per-player themes, or per-flow palettes
- backend/API/schema/prompt/provider/card-data/scanner-engine changes

## Product-truth references

- DEC-119 — authoritative WUBRGC catalog and unchanged theme behavior
- REQ-099 — exact catalog values, contrast, and verification contract
- NFR-011 — fixed-profile contrast and custom-Colorless exception
- FLOW-007 — unchanged selection/customization/reset/reload flow
- DEC-066 / DEC-068 / DEC-081 / DEC-110 — existing mechanism, reach, ambient treatment, and Menu
  placement
- REQ-044 / REQ-046 / REQ-060 — existing theme mechanism and surface contracts
