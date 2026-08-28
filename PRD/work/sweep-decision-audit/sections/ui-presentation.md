# Sweep finding — ui-presentation

- Corpus file: /Users/chrismiho/Coding/Projects/TheJudge/PRD/sections/decisions/ui-presentation.md
- Scored against: 7 current-state specs under PRD/sections/<feature>/README.md
- Items: 13

## DEC-079 — not-absorbed
No spec cites DEC-079 or states an app-wide decorative-motion baseline (hover/press/focus micro-interactions, entrance/exit transitions, add/remove/success/error cues across the four staged steps); the specs mention motion only in narrow, pre-existing spots owned by other DECs (waiting panel DEC-031, follow-up spinner DEC-041, conversation-append animation DEC-123, feedback-modal open/close DEC-105) — the broadening itself is missing.

## DEC-085 — absorbed
`shared-chrome/README.md` documents the mock-mode banner in full — the exact copy, the `ASK_AI_PROVIDER` → `VITE_ASK_AI_PROVIDER` → `env.ts` build-time resolution chain, single `PageShell` mount, and even records the known full-bleed-destination coverage gap.

## DEC-092 — absorbed
`in-depth/README.md` carries both enhanced helper strings verbatim (players-in-game and zone-confirmation) and correctly threads the DEC-153 carve-out for the Send Request label/pointer, matching the decision's guardrails.

## DEC-117 — absorbed
`shared-chrome/README.md` states the automatic fluid responsive presentation replacing the Desktop/Mobile density control, one component tree, no UA sniffing/JS device detection, and lists it among rejected alternatives (former density preference retired).

## DEC-120 — absorbed
`in-depth/README.md` fully describes the synchronized secondary-details disclosure — compact baseline per player, one shared arrow state expanding/collapsing Poison/Energy/Experience/Commander damage/counters for all players, collapsed-by-default reset behavior.

## DEC-128 — absorbed
`in-depth/README.md`'s Measured bounds section records the post-fix containment geometry (56×44 outer toggle, 44×44 per-player, 78px selects, 720px for three expanded players, measured identical at 390×844 and 1440×900), which is the shipped state DEC-128's containment fix produced.

## DEC-145 — absorbed
`shared-chrome/README.md` states the `min(48rem, 92vw)` desktop shell cap, the 768px-at-1440px measurement (vs former 670px), and the deliberate non-fill of vertical dead space below staged content.

## DEC-149 — absorbed
`shared-chrome/README.md`'s "Shared layout language" section reproduces the catalog's viewport bands, hybrid % model, fit rule, and anti-overcalibration language, and cites `screen-layout.md` as the layout-direction authority throughout the file.

## DEC-151 — absorbed
`shared-chrome/README.md` and `in-depth/README.md` both describe the three levers — compact/container-relative images, suite-wide corner detail popup, horizontal add-order zone strip — and correctly note DEC-151 superseded DEC-148.

## DEC-156 — absorbed
`shared-chrome/README.md` documents all three refinements (Remove-card-only sidebar, themed circular X close control, bounded stacked poison/energy/experience dropdowns); `in-depth/README.md` confirms the dropdown ranges and commander-damage exception.

## DEC-158 — absorbed
`shared-chrome/README.md` states the popup now renders through the `AdaptiveContextDialog` overlay family sized to its own content rather than `absolute inset-0`, and records the superseded 92×128px/356px-overflow measurement as historical.

## DEC-159 — absorbed
`shared-chrome/README.md` names the one shared theme-derived close-control component and its full adopter list, including Life Tracker's `CounterPanel`/`GameSetupModal` (though `life-tracker/README.md` itself is silent on it — captured only through shared-chrome's ownership).

## DEC-160 — absorbed
`shared-chrome/README.md`, `in-depth/README.md`, `scan/README.md`, and `quick-lookup/README.md` all cite DEC-160's container-relative image sizing replacing the `max-h-32` pixel cap, with surface-specific measured results (shell-column ~300px, zone-strip tile ~144px, scan review row-width).
