status: active

# MTG Color Profile Refresh — GAMEPLAN

Frontend-only value refresh of the shipped WUBRGC theme catalog. Update the five fixed Magic-color
profiles to the approved vivid palette, keep Colorless and all theme behavior unchanged, and lock
the catalog with exact-value and contrast regression coverage.

Sources of truth: DEC-119 (`sections/decisions/personalization.md`), REQ-099
(`sections/functional-requirements.md`), NFR-011 (`sections/non-functional-requirements.md`), and
FLOW-007 (`sections/user-flows.md`), plus the approved matrix in `DESIGN-BRIEF.md`.

## Architecture

### Current shape

- `apps/frontend/src/lib/theme/palettes.ts` is the single authoritative ordered WUBRGC catalog.
  Picker previews use each profile's hexadecimal `swatch`; runtime CSS variables use decimal
  `"R G B"` channel triples for `accent`, `accentStrong`, `accentSoft`, and `accentContrast`.
- `apps/frontend/src/lib/theme/palettes.test.ts` already asserts profile order/default, exact fixed
  token values, fixed-profile contrast, Black-versus-Colorless distinction, and Colorless custom
  resolution behavior.
- `applyPalette.ts` writes the four runtime roles to document-root CSS variables. Theme selection,
  persistence, Colorless customization, and all rendered consumers read the catalog through the
  existing shared theme path; none needs a structural change for a values-only refresh.

### Target shape

1. Update only the White, Blue, Black, Red, and Green `swatch`, `accent`, `accentStrong`, and
   `accentSoft` values in `palettes.ts`, converting the approved hex values to the file's existing
   decimal channel-triple representation.
2. Preserve every profile id/name, WUBRGC order, Blue default, all `accentContrast` values, the
   complete fixed Colorless object, public `Palette` shape, helpers, persistence, fallback, and
   custom-Colorless resolution.
3. Amend the direct catalog test first so it asserts every swatch and four-token value, proves each
   refreshed WUBRG swatch resolves to its `accentSoft` channels, retains the 4.5:1 fixed-profile
   contrast gate, and keeps Black distinct from Colorless.
4. Rely on the existing shared application path for global retinting; do not edit consumer
   components, CSS effects, theme storage, backend code, or public contracts.

## Data flow

```text
approved DEC-119 / REQ-099 hex matrix
                 │
                 ├── swatch hex ─────────────▶ Theme-menu preview
                 │
                 └── decimal channel triples ▶ PALETTES
                                                │
                                                ▼
                                       applyPalette(document root)
                                                │
                         --accent / --accent-strong / --accent-soft / --accent-contrast
                                                │
                                                ▼
                             existing Tailwind aliases and shared consumers
```

The refresh changes catalog data at the first shared boundary. Selection and persistence still
store only profile identity (plus the existing independent custom-Colorless value), so no migration
or runtime state transition is introduced.

## Contract and scope guardrails

- Preserve the four existing CSS token roles and the single `PALETTES` source of truth.
- Preserve all fixed Colorless values and its custom RGB apply/persist/restore/reset behavior.
- Preserve WUBRGC order, Blue default, profile ids/names, unsupported-id cleanup, storage failure
  behavior, and the fixed-profile 4.5:1 contrast floor.
- Add no shadow, bloom, halo, animation, new token role, profile-specific component rule, generated
  palette logic, or local consumer color constant.
- Do not expand REQ-060's ambient inventory, tint the neutral slate background, recolor card
  identity rings, or change scanner behavior/motion.
- No request, schema, prompt, provider, backend, card-data, scan-engine, stack-order, or data-pipeline
  change.

## Slice dependency map

| Slice | Depends on | Sequential blocker |
| --- | --- | --- |
| A — Fixed catalog refresh and ship closure | — | — |

One slice is intentional: the catalog and its direct regression test form one atomic source-of-truth
change, and there is no second independent implementation objective worth a separate handoff.

## Verification checklist

- [ ] Exact WUBRGC order, names, swatches, four-token values, and Blue default are asserted.
- [ ] White/Blue/Black/Red/Green swatches convert exactly to their `accentSoft` channel triples;
      fixed Colorless retains its existing independent swatch and token values.
- [ ] Every fixed profile's `accentContrast` clears 4.5:1 against both `accent` and `accentStrong`.
- [ ] Black remains numerically and visually distinct from fixed Colorless and the neutral slate
      shell.
- [ ] Colorless custom resolution, selection, persistence, reset, malformed-value cleanup, and
      unavailable-storage degradation remain green through the unchanged existing tests.
- [ ] Representative existing consumers retint through shared variables with no consumer-local
      hardcoded value changes.
- [ ] Targeted frontend tests, the full repository quality gate, and `git diff --check` pass.
- [ ] Manual Theme-menu and representative-surface review confirms the intended White and vivid
      Blue/Black/Red/Green direction without new glow effects.
