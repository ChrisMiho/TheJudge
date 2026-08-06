# Slice E — Viewport fill on both axes

## Status: done

## Goal

Replace the fixed narrow column and top-anchored composition so the shell uses the
viewport it is given (REQ-124, DEC-145).

## Requirements

1. The shell width becomes a fluid cap of `min(90rem, ~92vw)`. `.page-card` is
   currently `max-width: 42rem` (672px) — the measured 670px column.
2. Pre-submit staged steps (Game context, Zone confirmation, Zone collection,
   Enrichment, Quick Question landing) absorb available vertical space rather than
   top-anchoring a content-sized card above an empty region.
3. Prose-dominant regions keep their own maximum reading measure inside the widened
   shell rather than running the full shell width.
4. Mechanism stays fluid CSS on one component tree — no layout-density storage,
   `data-layout-density`, UA sniffing, or JS device detection (NFR-001, DEC-117).

## Acceptance criteria

- [ ] At 1440×900 the measured shell width is at least 1200px (baseline defect:
      670px, leaving 770px / 53% unused)
- [ ] At 2560px wide the shell does not exceed 90rem (1440px) — the cap still binds
- [ ] At 390×844 no pre-submit staged step leaves more than 120px of unused vertical
      space below its content (baseline defect: 359px on zone collection; 320px on
      Game context and Quick Question)
- [ ] At 1440×900 no pre-submit staged step leaves more than 150px of unused vertical
      space below its content (baseline defect: 366px)
- [ ] No horizontal document overflow at any tested viewport
      (`documentElement.scrollWidth <= clientWidth`)
- [ ] Life Tracker still fits one screen (DEC-136) and the answered conversation
      workspace's fill behavior (DEC-127, DEC-131) does not regress
- [ ] No `data-layout-density`, UA sniffing, or JS device detection introduced

## Verification

```bash
npm --workspace apps/frontend run test
npm run quality:check
```

Playwright MCP at 390×844, 1440×900, and 2560×1440: walk every pre-submit staged
step, `browser_evaluate` shell width and unused vertical space below content, plus
screenshots of each step at each viewport.

## Files touched

- `apps/frontend/src/index.css` (`.page-shell`, `.page-card`, `.portal-shell-bounds`)
- `apps/frontend/src/components/PageShell.tsx`
- staged-step components as needed for vertical fill
- affected component tests

## Dependencies

- Slice D — both slices edit shell rules in `apps/frontend/src/index.css`, and the
  banner offset participates in the same vertical budget this slice rebalances.

## Scope change during implementation (2026-08-05)

The slice was written as "viewport fill on both axes". Both halves were built and shown to
the product owner, who rejected the wide setting on sight: at `90rem` (1325px) every
control became a band, most visibly a 1277px "Confirm game context" button — *"stretched
without the ability to actually fill that content in a usable way"*. Stretching the card
vertically drew the same objection: it measures well (359px unused → 24px) but frames an
empty region rather than removing it.

To-scale mocks of all five candidate widths were built at
[`mocks/width-options.html`](./mocks/width-options.html) and reviewed. The deciding
measure was **rendered CTA width**, not percentage of viewport filled:

| Setting | Shell | Unused | CTA width | Outcome |
| --- | --- | --- | --- | --- |
| 42rem (today) | 670px | 770px · 53% | 622px | baseline |
| **48rem** | **768px** | **672px · 47%** | **718px** | **chosen** |
| 64rem | 1024px | 416px · 29% | 976px | bands |
| 90rem | 1325px | 115px · 8% | 1277px | rejected on sight |

Outcome: **horizontal cap only, at `min(48rem, 92vw)`. Vertical fill dropped**, by explicit
product-owner decision — the space stays until there is step-level content for it.
`DEC-145` and `REQ-124` were rewritten to match; DEC-145 now supersedes only the
horizontal half of DEC-131's non-goal.

## Verified (2026-08-05)

| Measure | Viewport | Before | After |
| --- | --- | --- | --- |
| Shell width | 1440×900 | 670px | **768px** |
| Unused horizontal | 1440×900 | 770px (53%) | 672px (47%) |
| CTA rendered width | 1440×900 | 622px | 718px (reads as a button) |
| Shell width (cap binds) | 2560×1440 | — | **768px** |
| Shell width (unchanged) | 390×844 | 359px | 359px |

- No horizontal document overflow at 390×844, 1440×900, or 2560×1440.
- Full frontend suite: 1187/1188 pass — the one failure is the pre-existing
  `App.feedback` env-dependent test documented in slice A.
- Vertical: 359px below content at 1440×900, unchanged and accepted (DEC-145).
