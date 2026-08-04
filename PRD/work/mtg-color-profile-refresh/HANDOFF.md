# Handoff — MTG Color Profile Refresh

Session state as of 2026-08-03, handing off from Claude Code to Codex. This work has **not**
reached the "present design summary, wait for approval" gate yet — the user was shown a proposed
value table and preview artifact and has not yet confirmed it. Resume there; do not re-run the
clarifying-questions round below, it's already answered.

## What's confirmed (do not re-ask)

Three clarifying questions were asked and answered before any proposal was drafted:

1. **Glow scope** — "neon glow" means more saturated/vivid hex values within the existing flat
   four-token system. **No new CSS effect** (no box-shadow/text-shadow bloom). This stays a
   values-only change.
2. **Black direction** — the user explicitly wants to **override** REQ-099's existing note ("near-
   black strong token with muted plum/mauve identity, not a bright purple theme"). Black should
   move to a more saturated, vivid purple. The DESIGN-BRIEF/REQ-099 update must record this as an
   intentional supersession of that prior note, not silently drop it.
3. **Contrast floor** — NFR-011's 4.5:1 contrast requirement (accent-contrast vs. accent, and vs.
   accent-strong) stays a **hard constraint**, no exception for the neon direction. Every proposed
   value below was chosen to clear it.

Scope is explicitly: White gets less yellow/more true-white; Blue, Red, Green get more saturated/
neon; Black gets more purple in addition to more neon. Colorless is untouched (not mentioned by
the user). No change to the four-token architecture, persistence, Colorless customization, global
reach, or any consumer surface — this is a `DEC-119`/`REQ-099` value-table amendment only.

## Contrast method (must match the existing test)

`apps/frontend/src/lib/theme/palettes.test.ts` computes WCAG relative-luminance contrast and
asserts `contrastRatio(accentContrast, accent) >= 4.5` and `contrastRatio(accentContrast,
accentStrong) >= 4.5` for every profile. `accent-soft` has no direct contrast assertion in that
file — it's the token with the most room to go vividly "neon" since it isn't gated. All proposed
values below were verified against this exact formula (script used this session:
`/private/tmp/.../scratchpad/contrast.js`, not persisted — recompute if needed).

## Proposed value table (shown to user, not yet approved)

| Profile | accent | accent-strong | accent-soft | accent-contrast | contrast (accent / strong) |
|---|---|---|---|---|---|
| White | `#EDE7D6` | `#B0A382` | `#FAF8F2` | `#09090B` (unchanged) | 16.11 / 7.97 |
| Blue | `#0050D8` | `#1E3A9C` | `#38E1FF` | `#FFFFFF` (unchanged) | 6.69 / 9.81 |
| Black | `#7C3AED` | `#2E1A47` | `#C77DFF` | `#FFFFFF` (unchanged) | 5.70 / 15.50 |
| Red | `#C10230` | `#7A0424` | `#FF4D6D` | `#FFFFFF` (unchanged) | 6.33 / 11.23 |
| Green | `#0A7A42` | `#0A5C33` | `#4AFFA0` | `#FFFFFF` (unchanged) | 5.42 / 8.10 |

Current (shipped) values for reference — `apps/frontend/src/lib/theme/palettes.ts`:

| Profile | accent | accent-strong | accent-soft | accent-contrast |
|---|---|---|---|---|
| White | `#F3E6B3` | `#C6A15B` | `#FFF8DC` | `#09090B` |
| Blue | `#0369A1` | `#1D4ED8` | `#7DD3FC` | `#FFFFFF` |
| Black | `#6B4F70` | `#241F29` | `#D8B4E2` | `#FFFFFF` |
| Red | `#B91C1C` | `#7F1D1D` | `#FCA5A5` | `#FFFFFF` |
| Green | `#15803D` | `#14532D` | `#86EFAC` | `#FFFFFF` |
| Colorless | `#52525B` | `#27272A` | `#D4D4D8` | `#FFFFFF` | — unchanged, not part of this refresh |

Rationale per profile:
- **White** — desaturated the yellow cast on all three warm-toned tokens; `accent-soft` moves from
  cornsilk (`#FFF8DC`) to a near-neutral warm white (`#FAF8F2`).
- **Blue / Red / Green** — `accent`/`accent-strong` were pushed more saturated but kept dark/rich
  enough to hold the 4.5:1 floor against white text; `accent-soft` (unconstrained) carries the
  actual neon punch — electric cyan-blue, hot pink-red, bright neon green.
- **Black** — `accent` moves from muted plum (`#6B4F70`) to vivid violet (`#7C3AED`);
  `accent-strong` stays near-black but purple-tinted (`#2E1A47`) rather than the prior grayish
  `#241F29`, so it keeps the "near-black" character the original decision wanted while reading as
  purple, not neutral. `accent-soft` moves to a bright orchid/lavender neon (`#C77DFF`).

A preview artifact was published this session showing current-vs-proposed swatches on the app's
dark shell plus a soft-glow chip demo (glow is presentation-only in the artifact, not shipped
CSS): `https://claude.ai/code/artifact/68430fd6-5100-4121-8ee0-e6a44f468adf` — this is a private
Claude-side artifact; Codex cannot fetch it directly. If the user wants Codex to see it, ask them
to paste the values/screenshot, or regenerate a preview from the table above.

## Not yet done — resume here

1. Get explicit user sign-off on the value table above (or a revised one) before writing anything
   to `PRD/sections/`.
2. Write `PRD/work/mtg-color-profile-refresh/DESIGN-BRIEF.md` per
   `.claude/skills/thejudge-refinement/` conventions (or the Codex equivalent), referencing this
   as an amendment to `DEC-119` (`sections/decisions/personalization.md`) and `REQ-099`
   (`sections/functional-requirements.md`) — not a new DEC/REQ number, since the mechanism is
   unchanged and only the value table + the Black "not bright purple" note are being superseded.
   Add a router index line update in `sections/decisions.md` only if `DEC-119`'s summary line
   needs to change; otherwise the domain-file body update is sufficient (`instructions/doc-
   lifecycle.md`).
3. Update `NFR-011`'s notes if needed — the 4.5:1 floor language itself doesn't change, just
   confirm the new values still satisfy it (already verified above).
4. Update `apps/frontend/src/lib/theme/palettes.ts` and its test assertions
   (`apps/frontend/src/lib/theme/palettes.test.ts`, the `"asserts the approved fixed token
   values"` test) to the approved final values — this is the only source-of-truth file plus its
   direct test; no other consumer file should need hardcoded-value changes since everything reads
   through the token roles.
5. Normal gates apply after that: `$thejudge-quality-check` (or Cursor/Claude equivalent) before
   mapping slices, since this still touches `sections/` product truth even though it's a small
   change.

## Repo conventions worth knowing (for the Codex session)

- `PRD/work/unified-mtg-color-themes/` is fully shipped (all 4 slices done) and just awaiting
  `/thejudge-cleanup` — unrelated to this refresh, don't touch it as part of this work.
- Decision bodies live in `PRD/sections/decisions/<domain>.md` (this one: `personalization.md`);
  `PRD/sections/decisions.md` is only the router/index table.
- Stable IDs are never renumbered — this refresh should read as an amendment to DEC-119/REQ-099,
  not new IDs, since scope/mechanism/acceptance-criteria shape are unchanged and only the value
  table (plus the Black direction note) changes.
