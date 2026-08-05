---
status: refining
---

# responsive-containment-and-density

Fix clipped content, overlay collisions, and wasted viewport space across all four
portal destinations at phone and desktop widths. Evidence gathered with Playwright
MCP at 390×844 and 1440×900.

See `IDEA.md`, `DESIGN-BRIEF.md`, `GAMEPLAN.md`.

**Resuming in a fresh session?** Read [`issues.md`](./issues.md) (the work list), then
[`HANDOFF.md`](./HANDOFF.md) (the context needed to work it).

## Slice table

| Slice | Status | Objective | Depends on |
| --- | --- | --- | --- |
| [A](./slice-a-autogrow-collapse-fix.md) | done | Auto-grow hook never pins a collapsed height (REQ-120) | — |
| [B](./slice-b-composer-composition.md) | done | Pre-submit composer composition (REQ-121, DEC-146) | A |
| [C](./slice-c-menu-tray-containment.md) | blocked | Menu tray opacity, bounds, hit area (REQ-122, DEC-147) | — |
| [D](./slice-d-banner-header-clearance.md) | done | Banner clears every destination header (REQ-123) | C |
| [E](./slice-e-viewport-fill.md) | done | Desktop shell width cap (REQ-124, DEC-145) | D |
| [F](./slice-f-card-detail-height.md) | blocked | Card detail height reduction (REQ-125, DEC-148) | E |
| [G](./slice-g-roster-containment.md) | done | In-Depth roster containment (REQ-106, DEC-128) | — |
| [H](./slice-h-full-flow-verification.md) | done | Full-flow re-verification and ship gates | A–G |

## Implementation map

| Area | Path |
| --- | --- |
| Auto-grow hook | `apps/frontend/src/hooks/useAutoGrowTextarea.ts` |
| Pre-submit composers | `apps/frontend/src/components/EnrichmentStep.tsx`, `apps/frontend/src/components/portal/quick-lookup/QuickLookupApp.tsx` |
| Reference composer (do not change) | `apps/frontend/src/components/FollowUpComposer.tsx` |
| Menu tray | `apps/frontend/src/components/portal/FeaturePortalMenu.tsx`, `apps/frontend/src/index.css` |
| Reference overlay (do not change) | `apps/frontend/src/components/ConversationHistoryDrawer.tsx` |
| Shell + banner | `apps/frontend/src/components/PageShell.tsx`, `apps/frontend/src/index.css` |
| Card detail | `apps/frontend/src/components/CardPresentation.tsx`, `apps/frontend/src/components/CardSelectionPreview.tsx` |
| Roster | `apps/frontend/src/components/portal/MtgAssistantApp.tsx`, `apps/frontend/src/components/PlayerRosterEditor.tsx` |

## Next

`/thejudge-implement-all PRD/work/responsive-containment-and-density/`

## Preparation gate

- Quality-check: **FAIL** (2026-08-05) — DEC-147 clause 3 contradicted DEC-135's row-inset resolution; REQ-121/122/124/125 carried non-verifiable acceptance criteria; DEC-131 lacked a supersession note.
- Quality-check: **PASS** (2026-08-05, after in-session fixes) — clause 3 reworded to extend DEC-135's inset to interactive bounds with no row movement; all four requirements given numeric thresholds; DEC-131 annotated. No contradictions with active DECs, no forbidden design drift, no open questions.

## Audit findings (Playwright MCP, 2026-08-05)

| ID | Finding | Measured evidence | Viewports |
| --- | --- | --- | --- |
| F1 | Shared question composer pins `height: 0px` and clips typed content | `style.height="0px"`, `clientHeight` 12 vs `scrollHeight` 32 → 20px hidden | both |
| F2 | Composer textarea squeezed by inline CTA on phone widths | textarea 136px of a 340px row (40%); CTA 128px + counter 34px inline; question wraps to 5 lines with ~200px unused | mobile |
| F3 | Feature tray has no scrim, is translucent, overlaps its own toggle, and overflows | `scrimPresent:false`, `bg rgba(24,24,27,0.95)`, `backdropFilter:none`; 10 page elements ghost through; toggle overlaps first menu item by 88px; tray bottom 889 vs vh 844 (mobile) and 957 vs 900 (desktop) | both |
| F4 | Mock-mode banner covers Life Tracker / Trade Balancer headers | "Switch feature" 24px covered, `h1` 9px, ⚙ 12px (Life Tracker); "Switch feature" 11px (Trade Balancer) | both |
| F5 | Shell leaves most of the viewport empty | Desktop 1440×900: shell 670px → 770px (53%) horizontal, 366px (41%) vertical dead. Mobile: 359px (43%) below content on zone collection | both |
| F6 | Card detail strands the primary CTA below the fold | "Add card" at y=1088 on an 844px viewport → 244px below fold; page 1286px; oracle text duplicated on art and in panel | mobile |
| F7 | In-Depth player rows break out of their panel (absorbed) | row content 322px in a 288px box (34px over); disclosure ▾ 8px past panel right border | mobile |

### F1 root cause

[`apps/frontend/src/hooks/useAutoGrowTextarea.ts:41`](../../../apps/frontend/src/hooks/useAutoGrowTextarea.ts)
reads `textarea.scrollHeight` on window resize. For a destination that is not active the
textarea is unrendered, so `scrollHeight` is `0` and the handler writes `height: 0px`.
The sizing effect depends only on `[value, textareaRef]`, so re-activating the
destination never recomputes and the field stays collapsed to padding-only.

Deterministic repro: load app → switch destination → resize window → switch back.

### Reference pattern already in the codebase

- `ConversationHistoryDrawer` renders opaque with a dimming scrim and correctly blocks
  pointer events on the page beneath — the target behavior for F3.
- `FollowUpComposer` uses a full-width input with a compact circular send control
  (230px textarea at a 390px viewport) — the target composition for F2.

## Absorbed package

`PRD/work/mobile-player-details-overflow/` is absorbed here (user decision,
2026-08-05). Its `DEC-128` / `REQ-106` are already promoted into `PRD/sections/`
(`decisions/ui-presentation.md`, `functional-requirements.md`, `user-flows.md`) and
carry forward as inherited product truth; F7 above is its defect, re-confirmed
unfixed during this sweep.
