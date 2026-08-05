# GAMEPLAN: chrome-hit-areas-and-mid-flight-exits

Design source: [`DESIGN-BRIEF.md`](./DESIGN-BRIEF.md). Evidence: [`IDEA.md`](./IDEA.md).

## Architecture

Three independent frontend-only corrections. No backend, contract, prompt, Zod, or data-pipeline
surface is touched by any slice.

| Slice | Area | Product truth |
| --- | --- | --- |
| A | Feature-portal corner rail geometry | `DEC-137`, `REQ-114` |
| B | Mid-flight Draft on history-select | `DEC-138`, `REQ-108` |
| C | Counter panel surface | `DEC-139`, `REQ-082` |

### Slice A — rail

Two variants of one component, corrected differently:

```
.portal-menu-rail (single-zone: Life Tracker, Trade Balancer)
  ├─ decorative layer  5.5rem × 10.5rem  gradient   pointer-events: none
  └─ interactive box   5.5rem ×  3.5rem  icon band  ← was 5.5rem × 10.5rem

.portal-menu-rail-split (two-zone: In-Depth, Quick Question)
  └─ single 2.75rem-tall band, 5.5rem wide
       ├─ zone: Menu     2.75rem × 2.75rem   ← was stacked
       └─ zone: History  2.75rem × 2.75rem   ← was stacked
```

The split rail's `clamp()` height and the stacked `border-top` separator are both retired; the
separator becomes a vertical rule between side-by-side zones.

### Slice B — draft

`saveDraft` is inserted ahead of `restoreConversation` in both history-select handlers. The
existing `isActive`-edge effect is untouched — this adds a second write site, it does not move the
first one.

```
handleSelectHistoryEntry(entry)
  ├─ if pre-submit staging present → saveDraft({ mode, ...staging })   ← new
  └─ restoreConversation(entry) … (unchanged)
```

The staging-presence test must match the existing `hasStaging` predicate in each destination's
`isActive` effect rather than inventing a second definition — a duplicated predicate across two
write sites is the exact defect `technical-design-rules.md` calls out under *reuse before
creating*. Extract it once per destination and call it from both sites.

### Slice C — counter panel

The overlay's positioning wrapper stops bottom-anchoring and content-sizing; the surface fills the
available shell height and keeps its existing internal scroll.

## Data flow

No new state, no new storage keys, no new props crossing a component boundary. Slice B reuses
`saveDraft` / `GameDraftState` / `LookupDraftState` from
`lib/conversationHistory/persistence.ts` exactly as the existing Menu-leave path does.

## Slice independence

All three touch disjoint files and may be implemented in any order or concurrently. Sequenced A →
B → C only because A carries the highest user-facing severity.

| Slice | Files | Overlaps |
| --- | --- | --- |
| A | `index.css`, `FeaturePortalMenu.tsx` + tests | none |
| B | `MtgAssistantApp.tsx`, `QuickLookupApp.tsx` + tests | none |
| C | `CounterPanel.tsx` + tests | none |

## Verification checklist

- [ ] A: single-zone rail overlap with the Life Tracker life control measures **exactly zero**
- [ ] A: split rail's interactive box ends above the step-name eyebrow's top edge
- [ ] A: both split zones ≥ 44 × 44; single-zone rail ≥ 44px in both dimensions
- [ ] A: single-zone rail's icon position and gradient rendering unchanged
- [ ] B: history-select from staging writes `thejudge.conversationDraft.game` **and** `…lookup`
- [ ] B: empty staging writes no Draft; already-answered conversation writes no Draft
- [ ] B: the restored conversation still lands correctly (DEC-134 unbroken)
- [ ] C: panel surface height derives from the shell, not its content, at 2/4/6 players
- [ ] C: no dead scrim band above the panel
- [ ] `npm run quality:check` green
- [ ] Test titles follow `PRD/instructions/test-naming.md` (`Frontend - Portal`, `Frontend - MTG Assistant`, `Frontend - Quick Lookup`)

## Regression risk

- **A** is the only slice that changes rendered output (split rail arrangement). Existing suites
  asserting `.portal-menu-rail-zone` presence and the stacked `border-top` separator will need
  updating — `FeaturePortalMenu.test.tsx`, `App.responsive-presentation.test.tsx`,
  `App.mtg-color-themes.test.tsx` all reference rail classes.
- **B** must not disturb the `isActive`-edge effect; `App.mid-flight-draft.test.tsx` covers the
  existing Menu-leave and reload paths and must stay green unmodified.
- **C** must not alter counter semantics; `CounterPanel.test.tsx` behavior assertions stay green.

## Non-goals

Per `DESIGN-BRIEF.md`: no rail visual-language redesign beyond the forced split-rail arrangement,
no destination-content insets, no confirm dialog or toast on the mid-flight exit, no `"me"`-map
work, no DEC-131 lower-half fill, no backend/contract change.
