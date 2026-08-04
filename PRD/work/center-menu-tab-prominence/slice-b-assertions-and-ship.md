# Slice B — Assertions, regression, and ship closure

## Status: planned

## Dependencies

- Slice A — assertions must target the prominence class/selectors and values Slice A ships.

## Goal

Lock REQ-101 presentation with automated/stylesheet assertions, keep existing portal docking and interaction tests green, and hand off a cleanup-ready package.

## Requirements

1. Add automated or stylesheet assertions that cover: responsive width rules (below / at-or-above `768px`), thicker border treatment, and medium glow on the Menu trigger (extend `FeaturePortalMenu.test.tsx` and/or a focused CSS contract test in the ambient-accent style).
2. Keep existing portal docking tests green (`.portal-slot-tab` inline path, destination switch, reduced-motion coverage for `.portal-menu-motion`).
3. Confirm no Theme Layout / Desktop/Mobile / density control, no registry/dropdown redesign, and no backend/contract files changed.
4. Run frontend tests for touched areas and `npm run quality:check`.
5. Carry the PRD promotion checklist below for `thejudge-cleanup`; this slice does not write the receipt or delete the work folder.

## Acceptance criteria

- [ ] Assertions fail if the responsive padding rules, thicker border, or medium glow treatment are removed from the Menu trigger styles.
- [ ] `npm --workspace apps/frontend run test -- src/components/portal/FeaturePortalMenu.test.tsx` passes (including Chrome integration / docking cases).
- [ ] Any new CSS-contract test file (if added) passes under `npm --workspace apps/frontend run test`.
- [ ] `npm run quality:check` is green for touched areas.
- [ ] Diff review shows frontend presentation-only changes; no `AskAiRequest`, Zod, backend routes, registry destination list, or Theme density control introduced.
- [ ] Cleanup handoff records durable-truth review, dated receipt, system-map confirmation, and deletion of this work folder (executed later by cleanup).

## Verification

```bash
npm --workspace apps/frontend run test -- src/components/portal/FeaturePortalMenu.test.tsx
npm --workspace apps/frontend run test
npm run quality:check
git diff --check
git status --short
```

## Files touched

- `apps/frontend/src/components/portal/FeaturePortalMenu.test.tsx`
- Optionally a small CSS assertion helper/test under `apps/frontend/src/` if Slice A's class lives primarily in `index.css`
- No product-behavior files beyond what Slice A already changed (unless an assertion-only tweak to class names is required)

## PRD promotion checklist (executed by `thejudge-cleanup`, not this slice)

- [ ] Confirm DEC-121 in `sections/decisions/navigation.md` and its router line in `sections/decisions.md` match shipped visuals; edit only if behavior differs.
- [ ] Confirm REQ-101 in `sections/functional-requirements.md` matches verified padding/border/glow behavior and DEC-117 constraints.
- [ ] Confirm **Feature portal (app navigation)** in `sections/system-map.md` already describes DEC-121 / REQ-101 prominence and lists the CSS class / files under Lives in; keep Status `shipped` (already shipped subsystem — update summary/Lives-in only if the implemented class names need recording). Do not flip DEC/REQ Status fields.
- [ ] Write a dated receipt under `PRD/instructions/receipts/` named for `center-menu-tab-prominence`, including verification commands.
- [ ] Delete `PRD/work/center-menu-tab-prominence/` entirely after durable promotion and receipt creation.
- [ ] Remove the slug from `PRD/work/STATUS.md`; leave `PRD/README.md` unchanged unless navigation guidance genuinely changed.

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged unless slice scoped a change
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/center-menu-tab-prominence/` ready to delete
