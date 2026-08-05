# DESIGN-BRIEF: center-menu-tab-prominence-followup

Status: approved (user explicit approval 2026-08-04).

## Problem

The shipped DEC-122 Menu drawer looks good as a left-edge slide-in, but its partial height leaves a hard cutoff above the bottom of the outer app shell. Live use wants the open Menu to read as the full left side of that shell — flush with the shell’s bottom-left corner — without squaring over the shell’s curved edge. Life Tracker (full-bleed, no `.page-card`) must get the same full-side treatment.

## Outcome

1. Open Menu tray always stretches the full left side of the outer shell (`.page-card` on standard destinations; full-bleed outer shell on Life Tracker), even when destination/Theme content does not fill the height.
2. On tall/scrollable destinations, the tray sizes to the **visible** shell side (viewport ∩ shell), staying flush with the on-screen top and bottom of the outer component — not the full scrollable document height of the shell.
3. Bottom-left is flush with the shell corner and uses the same bottom-left radius as the shell so the tray does not overwrite the curved edge (mirrors today’s top-left radius treatment).
4. Unused lower tray area may carry a quiet, non-interactive decorative TheJudge brand mark; skip or omit only when it fights a short shell.

## Confirmed choices

| Question | Choice |
| --- | --- |
| Empty vertical space below Theme | Always stretch; empty space is fine |
| Tall / scrollable shells | Visible shell side only (viewport ∩ shell), not full scroll height |
| Life Tracker (full-bleed) | Same full left-side treatment as standard `.page-card` destinations |
| Lower empty area decoration | Quiet decorative TheJudge brand mark (non-interactive); omit if it fights short shells |
| EnrichmentStep brand-block consolidation | Out of scope (still parked) |
| Contracts | No Ask AI / provider / prompt-assembly / registry / Theme content changes |

## Product truth

| ID | Role |
| --- | --- |
| DEC-133 | New — full-height shell-docked Menu tray; visible-bounds on tall shells; matching bottom-left radius; optional quiet brand mark; applies to standard and full-bleed shells (amends DEC-122 partial-height / corner clauses) |
| REQ-113 | New — acceptance criteria for full-height tray geometry, corner flush, visible-bounds, brand mark, Life Tracker parity |
| REQ-067 / REQ-089 | Narrowly amended notes for full-height tray (registry/Theme/docking otherwise unchanged) |
| DEC-122 | Narrowly amended by DEC-133 for open-tray height and bottom-left corner treatment; corner rail, slide motion, brand centering, eyebrow remain |

## Non-goals

- Redesigning destination list, action entries, or Theme section contents
- Consolidating `EnrichmentStep.tsx` duplicated brand-block JSX
- Step-progress indicator
- Changing History zone behavior beyond shared taller-tray geometry / mutual exclusivity already established
- Backend / contract / prompt / provider changes
- Free-floating Menu chrome disconnected from the outer shell (DEC-109 remains in force)

## Verification (package-level)

1. Open Menu on a standard `.page-card` destination: tray fills top→bottom of the card; bottom-left radius matches the card; no square overhang past the curve.
2. Open Menu on a tall scrolled destination: tray tracks the visible card side (not mile-tall full scroll height); remains flush with on-screen top/bottom of the shell.
3. Open Menu on Life Tracker (full-bleed): same full left-side + bottom-left radius treatment.
4. When content is shorter than the tray, unused lower area shows a quiet non-interactive brand mark (or is empty only when a short shell cannot host it cleanly).
5. Destination select / Theme / History mutual exclusivity / reduced-motion slide unchanged; `npm run quality:check` (or frontend workspace equivalent for touched areas) green.
