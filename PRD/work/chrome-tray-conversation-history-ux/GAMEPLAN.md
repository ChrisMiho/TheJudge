# GAMEPLAN: chrome-tray-conversation-history-ux

Design source: [`DESIGN-BRIEF.md`](./DESIGN-BRIEF.md). Quality gate: [`QUALITY-CHECK.md`](./QUALITY-CHECK.md) (PASS).

## Architecture

Five frontend-only corrections. No backend, Ask AI contract, Zod schema, prompt, or provider
surface is touched by any slice.

| Slice | Area | Product truth |
| --- | --- | --- |
| A | Menu tray occludes under-rail History | `DEC-140`, `REQ-115` |
| B | Compact answered top clearance | `DEC-141`, `REQ-116` |
| C | Resilient resumed card context preview | `DEC-144`, `REQ-119` |
| D | Outside/scrim dismiss for View Context + History | `DEC-142`, `REQ-117` |
| E | Delete completed history entries | `DEC-143`, `REQ-118`, `FLOW-018` |

### Slice A — tray occlusion

Today `.portal-menu-rail` stacks at `z-index: 3` above `.portal-menu-drawer` at `z-index: 2`, so
History paints through and remains clickable while Menu is open.

```
Menu open (broken today)
  rail z=3  →  Menu zone + History zone both receive hits
  drawer z=2 → paints under History

Menu open (target)
  tray surface covers History; History is not visible through the tray and is not clickable
  Menu zone remains the close control
```

Implement by open-state stacking and/or inerting the History zone while Menu is open — do not
merge History into the tray, and do not change Menu outside-click-to-close.

### Slice B — clearance

`.adaptive-context-trigger` still uses the pre–DEC-137 stacked-rail clearance:

```css
margin-top: calc(clamp(4.75rem, 4.1rem + 2.5vw, 6.25rem) - var(--layout-panel-padding));
```

Retarget to the post–DEC-137 side-by-side rail footprint (`2.75rem` interactive band) while
preserving DEC-129 History↔View Context non-overlap.

### Slice C — preview crash

`CardSelectionPreview.formatMetaList` assumes `colors` / `supertypes` / `subtypes` are always
arrays. Incomplete frozen cards throw and white-screen View Context. Harden the preview; keep
full `CardMetadataItem` on save/restore when available at submit. No Scryfall re-fetch.

### Slice D — scrim dismiss

Both overlays already close on Close + Escape. Wire the dimmed overlay root (outside the panel
surface) to the same close path, with focus restore unchanged. Surface clicks must not close.

### Slice E — delete

```
History row → Delete → confirm → deleteHistoryEntry(id)
  ├─ non-active → list/storage update only
  └─ active completed → remove + startOver()/clean pre-answer state
                       (must not re-save the deleted thread)
```

Draft rows stay outside this control (DEC-130/138). Reuse the existing history storage key and
guarded persistence pattern.

## Data flow

| Slice | New state / storage |
| --- | --- |
| A–D | None — presentation/interaction only |
| E | `deleteHistoryEntry(id)` against `thejudge.conversationHistory.entries`; drawer gains an `onDeleteEntry` (or equivalent) callback into both conversation apps |

No new storage keys. No sync. No accounts.

## Slice independence

| Slice | Files | Blocker |
| --- | --- | --- |
| A | `FeaturePortalMenu.tsx`, `index.css` (portal-menu-*), tests | — |
| B | `index.css` (`.adaptive-context-trigger`), clearance/overlap tests | **A** — shared `index.css` |
| C | `CardSelectionPreview.tsx` (+ test); optional save-path check in Quick Lookup | — (parallel-ready with A/B/D) |
| D | `AdaptiveContextDialog.tsx`, `ConversationHistoryDrawer.tsx` (+ tests) | — (parallel-ready with A/B/C) |
| E | `persistence.ts`, `ConversationHistoryDrawer.tsx`, both apps (+ tests) | **D** — shared drawer |

Default sequence: **A → B → C → D → E**. C may run anytime relative to A/B/D; E must follow D.

## Verification checklist

- [ ] A: with Menu open on Quick/In-Depth, History does not paint through the tray
- [ ] A: `elementFromPoint` over History's former center returns tray/menu UI, not History
- [ ] A: click on that point does not open History; Menu still toggles closed
- [ ] A: Menu-only destinations (Life Tracker, Trade Balancer) do not regress DEC-133/137
- [ ] B: `.adaptive-context-trigger` margin is sized to the side-by-side rail, not the old clamp
- [ ] B: no large empty band above View Context on resumed/answered chats; DEC-129 non-overlap holds
- [ ] C: View Context with missing meta arrays renders without throw/white-screen
- [ ] D: scrim click closes View Context and History; Close + Escape still work; focus restores
- [ ] E: confirm-then-delete removes entry; active delete clears workspace without re-save; Draft untouched
- [ ] `npm run quality:check` green
- [ ] Test titles follow `PRD/instructions/test-naming.md`

## Regression risk

- **A** changes open-state stacking/hit-testing that `FeaturePortalMenu.test.tsx` and theme/responsive
  suites may assert via CSS text or class presence — update assertions, preserve intent.
- **B** must not reintroduce History↔View Context overlap; keep REQ-107/109 fill/reachability green.
- **D** must not break focus trap or Menu↔History mutual exclusivity (`useLeftEdgeDrawer`).
- **E** must not write the deleted thread back via `onConversationUpdated` / `saveHistoryEntry` when
  clearing the active conversation — clear id / call `startOver` in an order that avoids a save.

## Non-goals

Per `DESIGN-BRIEF.md`: no Menu visual redesign, no cross-device history, no bulk delete/search/export,
no Ask AI contract changes, no DEC-131 lower-half fill.
