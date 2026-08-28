# Sweep finding — personalization

- Corpus file: /Users/chrismiho/Coding/Projects/TheJudge/PRD/sections/decisions/personalization.md
- Scored against: 7 current-state specs under PRD/sections/<feature>/README.md
- Items: 9

## DEC-066 — absorbed
shared-chrome's Theme section (`shared-chrome/README.md` "Theme section") states palette values, browser-local persistence, and corrupt/missing-value fallback to default are unchanged from the original global control — the global-control, persistence, and fallback substance of DEC-066 is present.

## DEC-067 — obsolete
in-depth's staged-flow section explicitly notes the step name's header-row placement (inline right of the brand block) "is superseded to the eyebrow by DEC-122, owned by shared chrome" — the decision's shipped substance is stale, replaced by a later decision that is itself reflected in the specs.

## DEC-068 — partial
Scanner-reach substance is captured (`scan/README.md`: "the scanner's accent visuals... restyle with the selected app palette rather than fixed sky/emerald... (DEC-068, REQ-046)"), but the page-background neutralization to slate and the semantic-green ("success/ready/lock/confirm") states migrating onto the palette are not documented anywhere in the 7 specs.

## DEC-076 — partial
Most compaction items are captured in in-depth (cat-wizard hero reveal-after-10-clicks, enrichment View-all-cards 4-row cap) and scan (scan-focus hides search/list/nav, keeps Capture and Exit scan); zone-collection list geometry is correctly cross-referenced as superseded by DEC-151. Missing: the game-context turn-phase/active-player panel merge, the "(recommended)" label removal, and the zone-collection empty-state placeholder removal are not documented in any of the 7 specs.

## DEC-078 — partial
Image-first presentation is captured in shared-chrome (container-relative, aspect-preserved, uncropped images; corner-icon → dismissible popup; missing/failed image falls straight to the text-first fallback). Missing: the color-derived identity ring (per-card border color mapped from `colors` — warm ivory/blue/violet/red/green, WUBRG-ordered multicolor gradient, silver-gray fallback) is not documented anywhere in the 7 specs.

## DEC-081 — not-absorbed
The restrained ambient-accent layer — REQ-060's closed surface inventory, baseline-at-rest / stronger-on-hover-focus-current treatment, and "static chrome stays neutral" boundary — is not documented anywhere in the 7 specs; shared-chrome's Theme section only covers the picker itself, not ambient accent reach across the four staged screens and the answered view.

## DEC-091 — absorbed
in-depth's game-context section fully captures the 44×44px touch targets, the more-prominent expand/collapse triangle, and the minus-left/plus-right stepper reorder, citing DEC-091 directly.

## DEC-119 — not-absorbed
The six-profile WUBRGC catalog (White/Blue/Black/Red/Green/Colorless replacing Blue/Violet/Emerald/Amber/Rose), its curated hex values, the Colorless custom-RGB-with-no-validation behavior, and the retired-ID-falls-back-to-Blue rule are not documented anywhere in the 7 specs. shared-chrome's Theme section only says palette values/persistence/fallback are "unchanged from the former corner control" — it never names the current catalog, so this decision's actual shipped substance is absent from current-state truth.

## DEC-152 — partial
The single-row orb layout is captured (`shared-chrome/README.md`: "the Theme section's palette orbs sit on one row within the tray... (REQ-131, DEC-135)" and "Theme orbs on one row" in Measured bounds). Missing: the Colorless custom-color/Reset controls rendering centered underneath the orb row is not documented anywhere in the 7 specs.
