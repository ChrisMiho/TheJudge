# Intake brief — remove-dead-card-back-detector

**Type:** pure behavior-preserving refactor (dead-code deletion). No product-truth change.

## Target
Delete the unreachable `isCardBack` method and its supporting dead state from the
frontend scan card identifier.

## Exact files
- `apps/frontend/src/lib/scan/identify.ts`
  - `export const CARD_BACK_THRESHOLD = 100;` (line 27)
  - `isCardBack(cardImg: RgbImage): { isBack: boolean; distance: number }` method (lines 231–241)
  - The private `cardBack` field (line 213) becomes read-only-nowhere once `isCardBack`
    is gone; drop its assignment too if it leaves no reader. **Keep** the constructor's
    `CARD_BACK_ID` filter (lines 219–220 / the surrounding loop) that excludes the card
    back from the searchable DB — that path is live in `identify()` and must not change.

## Evidence
- Source-wide grep (`apps/frontend/src`, `apps/backend/src`, `scripts`) shows `isCardBack`
  appears only at its definition; it is called from nowhere in source or tests.
- `CARD_BACK_THRESHOLD` is exported but referenced only inside the dead method (line 240).
- The only other grep hits are minified `apps/frontend/dist/` bundles — generated build
  output, not references; they regenerate on build.

## Behavior-preserving proof (why PRD/sections/ stays empty)
Removing an uncalled public method, its export-only constant, and the private state that
only that method read deletes no path the app or the test suite executes. Player-facing
scan/identify behavior is unchanged, and `PRD/sections/` describes no card-back-detection
feature to alter. This is a pure refactor with zero product-truth surface.

## Scope guardrail
No change to API responses, prompts, rules content, scoring, or any player-facing output.
If refinement finds any reader of the removed symbols outside generated `dist/`, stop and
surface it rather than proceeding.
