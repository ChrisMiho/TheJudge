# Slice B — Compact answered-workspace top clearance

## Status: done

## Goal

Retarget answered-workspace top clearance so View Context sits under the post–DEC-137 side-by-side
rail footprint instead of the tall pre–DEC-137 stacked-rail band, without reintroducing
History↔View Context overlap (DEC-141 / REQ-116).

## Requirements

1. Replace `.adaptive-context-trigger`'s
   `margin-top: calc(clamp(4.75rem, 4.1rem + 2.5vw, 6.25rem) - var(--layout-panel-padding))`
   with clearance sized to the current side-by-side rail interactive height (`2.75rem` band),
   accounting for `--layout-panel-padding` the same way the old rule did.
2. On resumed and freshly answered Quick Question and In-Depth Question conversations, there must
   be no large unused empty band between the step eyebrow/header region and View Context (or the
   first thread content when View Context is absent) attributable to oversized rail clearance.
3. History icon/hit-target must still not overlap, clip into, or sit on the border of View Context
   (REQ-107 / DEC-129) at desktop and ~390×844.
4. Short-thread fill / Start Over reachability from REQ-109 remain satisfied.
5. Presentation only — no history semantics or Ask AI contract changes.

## Depends on

**Slice A** — both slices edit `apps/frontend/src/index.css`. Implement after A lands (or rebase
carefully if parallelized).

## Acceptance criteria

- [ ] Computed `margin-top` for `.adaptive-context-trigger` is derived from the side-by-side rail
      height (`2.75rem` footprint), not the retired stacked-rail clamp
- [ ] Resumed/answered Quick and In-Depth workspaces no longer show a large empty top band above
      View Context
- [ ] At desktop and ~390×844, History does not overlap or clip View Context
- [ ] REQ-109 short-thread fill / Start Over reachability still holds
- [ ] Existing conversation-workspace / portal presentation tests stay green (updated only where
      they assert the old clearance math)

## Verification

```bash
npm --workspace apps/frontend run test -- FeaturePortalMenu
npm --workspace apps/frontend run test -- ConversationWorkspace
npm --workspace apps/frontend run test -- App.responsive-presentation
npm run quality:check
```

Manual check (optional but useful): resume a Quick or In-Depth conversation, confirm the
eyebrow→View Context gap is tight, then resize to ~390×844 and confirm History still clears View
Context.

## Files touched

- `apps/frontend/src/index.css` (`.adaptive-context-trigger` only; leave portal-menu rules from A alone
  unless a comment cross-reference needs updating)
- Tests that assert the old clearance clamp / answered layout spacing
