---
status: active
---

# responsive-containment-and-density

Fix clipped content, overlay collisions, wasted viewport space, and PR #75's
follow-up density/copy findings across all four portal destinations at phone and
desktop widths. Evidence gathered with Playwright MCP at 390×844 and 1440×900.

See `IDEA.md`, `DESIGN-BRIEF.md`, `GAMEPLAN.md`.

**Resuming in a fresh session?** Read [`issues.md`](./issues.md) (the work list origin),
then this table and `GAMEPLAN.md`. `HANDOFF.md` and `DESIGN-BRIEF.md` hold prior-session
context; `issues.md` items are now fully absorbed into the slice table below.

## Slice table

| Slice | Status | Objective | Depends on |
| --- | --- | --- | --- |
| [A](./slice-a-autogrow-collapse-fix.md) | done | Auto-grow hook never pins a collapsed height (REQ-120) | — |
| [B](./slice-b-composer-composition.md) | done | Pre-submit composer composition (REQ-121, DEC-146) | A |
| [C](./slice-c-menu-tray-containment.md) | planned | Menu tray rail-hide while open (REQ-127, DEC-150) | — |
| [D](./slice-d-banner-header-clearance.md) | done | Banner clears every destination header (REQ-123) | C |
| [E](./slice-e-viewport-fill.md) | done | Desktop shell width cap (REQ-124, DEC-145) | D |
| [F](./slice-f-card-detail-height.md) | planned | Compact card images + suite-wide detail popup (REQ-128/129, DEC-151) | — |
| [I](./slice-i-horizontal-zone-strip.md) | planned | Horizontal In-Depth zone-card strip (REQ-130, DEC-151) | F |
| [G](./slice-g-roster-containment.md) | planned | In-Depth player-details alignment (REQ-106, DEC-128) | — |
| [J](./slice-j-theme-orb-row.md) | planned | Theme orb single row (REQ-131, DEC-152) | — |
| [K](./slice-k-send-request-label.md) | planned | Send Request label + Enrichment ready copy (REQ-132, DEC-153) | — |
| [L](./slice-l-composer-growth-ceiling.md) | planned | Composer growth ceiling accounts for chrome below the field (REQ-110) | — |
| [H](./slice-h-full-flow-verification.md) | planned | Full-flow re-verification and ship gates | C, F, I, G, J, K, L |

## Implementation map

| Area | Path |
| --- | --- |
| Auto-grow hook | `apps/frontend/src/hooks/useAutoGrowTextarea.ts` |
| Pre-submit composers | `apps/frontend/src/components/EnrichmentStep.tsx`, `apps/frontend/src/components/portal/quick-lookup/QuickLookupApp.tsx`, `apps/frontend/src/components/ComposerSubmitButton.tsx` |
| Reference composer (do not change) | `apps/frontend/src/components/FollowUpComposer.tsx` |
| Menu tray + Theme | `apps/frontend/src/components/portal/FeaturePortalMenu.tsx`, `apps/frontend/src/components/portal/ThemeSection.tsx`, `apps/frontend/src/index.css` |
| Reference overlay (do not change) | `apps/frontend/src/components/ConversationHistoryDrawer.tsx` |
| Shell + banner | `apps/frontend/src/components/PageShell.tsx`, `apps/frontend/src/index.css` |
| Card detail + zone strip | `apps/frontend/src/components/CardPresentation.tsx`, `apps/frontend/src/components/CardSelectionPreview.tsx`, `apps/frontend/src/components/ZoneCardPicker.tsx` |
| Roster | `apps/frontend/src/components/portal/MtgAssistantApp.tsx`, `apps/frontend/src/components/PlayerRosterEditor.tsx` |

## Preparation gate

- Quality-check: **FAIL** (2026-08-05 re-refinement) — DEC-078 Decision lead still mandates 80% + three-dot swap against DEC-151; FLOW-002/FLOW-006 still describe 2-column/80%/three-dot; REQ-012 visible label **Decrypt Stack** contradicts DEC-153/REQ-132 **Send Request**; REQ-070 preserve-Decrypt-Stack constraint conflicts for that control; `system-map.md` card-presentation summary still 80%/toggle.
- QC FAIL consistency sync applied (same session): DEC-078 Decision lead, FLOW-002/006, REQ-012, REQ-070, `system-map.md`, DEC-078 router line, plus DEC-076/REQ-056 zone-collection grid → horizontal strip — re-run quality-check.
- Quality-check: **FAIL** (2026-08-05, second pass) — prior sync items cleared; remaining: **DEC-092** Decision/Notes still preserve visible **Decrypt Stack** without a DEC-153 carve-out, so agents can refuse **Send Request**.
- DEC-092 Decision/Impact/Notes + router index synced to DEC-153 / REQ-132 carve-out (explicit approval 2026-08-05); package returned to `refined`.
- Quality-check: **FAIL** (2026-08-05, third pass) — prior Decrypt Stack carve-out cleared; remaining: **REQ-070** AC still requires the context-enrichment screen helper text stay byte-for-byte unchanged, which blocks **DEC-153 / REQ-132** Enrichment ready-copy. DEC-092 Notes carve out only the visible **Send Request** label, not that ready-copy change.
- REQ-070 AC/Constraints/Notes + DEC-092 Impact/Notes synced (explicit approval 2026-08-05) to carve the Enrichment ready-state helper text's pointer to the send control out of the byte-for-byte context-enrichment preserve, same class as the Send Request label carve-out; package returned to `refined`.
- Quality-check: **PASS** (2026-08-05, fourth pass) — cross-checked `decisions/navigation.md`, `decisions/conversation-ux.md`, `decisions/personalization.md`, `functional-requirements.md` (REQ-012, REQ-070, REQ-106, REQ-110, REQ-115, REQ-122, REQ-125–132), `screen-layout.md`, `system-map.md`, `user-flows.md` (FLOW-002, FLOW-006), and the `decisions.md` router against the re-refined brief. No residual old-behavior language (80% image, three-dot toggle, 2-column grid, Decrypt Stack visible label, box-bottom/trigger∩row proxies); no dangling DEC/REQ IDs; `screen-layout.md` carries rows for the tray, card popup, composer, and zone-collection changes per DEC-149's gate; stack ordering / API / prompt assembly untouched, matching the brief's non-goals; no open questions introduced.

## Next

`/thejudge-implement-all PRD/work/responsive-containment-and-density/` (or
`/thejudge-implement PRD/work/responsive-containment-and-density/ slice C` for one
slice at a time — C, F, G, J, K, and L are parallel-ready; I depends on F; H is last).

