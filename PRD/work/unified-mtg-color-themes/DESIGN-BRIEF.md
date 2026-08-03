# Unified MTG Color Themes — Design Brief

## Status

- Product design: approved 2026-08-03
- Work package: refined
- Next gate: `$thejudge-quality-check PRD/work/unified-mtg-color-themes/`

## Outcome

Unify TheJudge's existing palette consumers around six globally shared MTG-inspired profiles: White, Blue, Black, Red, Green, and Colorless. The feature evolves the existing four-token frontend theme system rather than introducing per-flow styles or a generated theming engine. Blue remains the app default; the five fixed Magic-color profiles receive curated contrast, while Colorless adds an intentionally permissive custom-RGB path.

## Approved approach

Extend the existing authoritative palette catalog and four CSS token roles (`accent`, `accent-strong`, `accent-soft`, `accent-contrast`). Do not add profile-specific component overrides, per-flow palettes, or new token roles. Normalize current consumers only where they use a token role against the wrong surface: dark surfaces use `accent-soft` for accent text, light surfaces use `accent-strong`, and filled controls use `accent-contrast`.

Rejected alternatives:

- per-profile component styling, because it would fragment the shared system and create six sets of exceptions
- an automatic contrast/color-generation engine, because custom Colorless is intentionally allowed to look imperfect and does not justify a larger theming framework

## Fixed profile catalog

Profiles appear in WUBRGC order. These values are the approved authoritative definitions:

| Profile | `accent` | `accent-strong` | `accent-soft` | `accent-contrast` |
| --- | --- | --- | --- | --- |
| White | `#F3E6B3` | `#C6A15B` | `#FFF8DC` | `#09090B` |
| Blue | `#0369A1` | `#1D4ED8` | `#7DD3FC` | `#FFFFFF` |
| Black | `#6B4F70` | `#241F29` | `#D8B4E2` | `#FFFFFF` |
| Red | `#B91C1C` | `#7F1D1D` | `#FCA5A5` | `#FFFFFF` |
| Green | `#15803D` | `#14532D` | `#86EFAC` | `#FFFFFF` |
| Colorless | `#52525B` | `#27272A` | `#D4D4D8` | `#FFFFFF` |

The curated foreground/background pairs clear a 4.5:1 contrast baseline at both primary gradient endpoints. White uses warm ivory and restrained gold so it does not collapse into Colorless. Black uses a near-black strong token plus muted plum/mauve accents so it reads as Black against the slate shell without becoming neutral gray.

The approved visual exploration is [`references/black-profile-contrast-study.png`](references/black-profile-contrast-study.png). Its three panels compare Plum Black, Silver Black, and Umber Black on the same dark shell. Plum Black is the selected direction; the generated layout, icons, and component details are illustrative and do not add product scope.

## Colorless customization

- Selecting Colorless with no saved custom value applies the fixed neutral-gray profile above.
- The Colorless selection exposes an inline native full-spectrum color input and a `Reset to gray` action in the existing Theme section.
- A chosen RGB is applied unchanged to `accent`, `accent-strong`, and `accent-soft`; `accent-contrast` remains white.
- The app does not validate, reject, warn about, lighten/darken, or otherwise repair a custom choice. Poor custom contrast is accepted product behavior.
- The custom RGB persists separately from the selected profile and is remembered when the user switches away and back.
- Reset removes only the saved custom RGB and immediately reapplies the fixed Colorless token set.

## Persistence and fallback

- The existing selected-profile browser preference remains the authority; Blue remains its default.
- The retired Violet, Emerald, Amber, and Rose definitions are removed, not mapped to new profiles.
- When a retired or otherwise unsupported stored profile ID is loaded, the app deletes that selection value and falls back to Blue.
- A malformed custom RGB is deleted and Colorless falls back to its fixed gray values.
- Unavailable browser storage or failed reads/writes never block render or alter workflow state; a selection may remain session-only.

## Global reach and surface behavior

The selected profile continues to apply to every existing consumer of the shared accent tokens. Acceptance coverage explicitly includes:

- In-Depth Question across staged and answered states
- Quick Question
- Player Life Tracker
- feature-portal Menu and Theme section
- scanner accents and confirmation states

This work may correct mismatched token-role usage needed for fixed-profile legibility, but it does not broaden REQ-060's closed ambient-surface inventory. The page background remains neutral slate; static chrome remains neutral except where an existing requirement already consumes palette tokens; card-identity rings remain independent; scanner behavior and motion do not change.

## Failure behavior

- unsupported selected profile: delete the stored selection and use Blue
- malformed custom RGB: delete the custom value and use fixed Colorless gray
- unavailable storage: continue with default/session state and no user-facing failure
- custom low contrast: apply exactly as chosen; no warning or correction

## Verification focus

- exact WUBRGC catalog order, fixed token values, and Blue default
- fixed-profile foreground/background contrast at both primary gradient endpoints
- Black legibility on representative dark and light surfaces and visual separation from Colorless
- immediate global retint without resetting any destination or workflow state
- Colorless picker application, independent persistence, switch-away/back restoration, and Reset to gray
- retired/unknown selection deletion, Blue fallback, malformed-custom deletion, and storage-unavailable behavior
- representative integration coverage for In-Depth, Quick, Life Tracker, portal, and scanner consumers
- no backend, request, prompt, provider, metadata, scan-engine, or data-pipeline change

## Non-goals

- per-player themes or saved player profiles
- per-flow or per-component palettes
- Magic mana symbols, logos, or card art
- custom colors on the five fixed Magic profiles
- contrast guarantees or correction for a custom Colorless RGB
- palette-tinted page backgrounds or changes to the REQ-060 surface inventory
- light mode, server synchronization, accounts, or a theming framework
- backend/API/schema/prompt/provider/card-data/scanner-engine changes

## Product-truth references

- DEC-119 — unified MTG profiles and permissive Colorless customization
- REQ-099 — exact catalog, behavior, persistence, and verification contract
- FLOW-007 — selection/customization/reset/reload flow
- NFR-011 — fixed-profile contrast and custom-profile exception
- DEC-066 / DEC-068 / DEC-081 / DEC-110 — existing global palette mechanism, reach, ambient treatment, and Menu placement
- REQ-044 / REQ-046 / REQ-060 — existing theme mechanism and surface contracts
