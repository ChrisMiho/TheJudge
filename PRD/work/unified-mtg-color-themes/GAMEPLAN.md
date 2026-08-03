status: active

# Unified MTG Color Themes — GAMEPLAN

Frontend-only evolution of the shipped global theme system. Replace the retired generic palette
catalog with the approved White/Blue/Black/Red/Green/Colorless profiles, keep the existing four
CSS token roles and global reach, and add deliberately permissive Colorless-only customization.

Sources of truth: DEC-119 (`sections/decisions/personalization.md`), REQ-099
(`sections/functional-requirements.md`), FLOW-007 (`sections/user-flows.md`), NFR-011
(`sections/non-functional-requirements.md`), plus DEC-066/068/081/110 and REQ-044/046/060.

## Architecture

### Current shape

- `apps/frontend/src/lib/theme/palettes.ts` owns the ordered five-profile catalog and the
  four-token `Palette` contract. Values are stored as CSS-ready `"R G B"` channel triples.
- `themePrefs.ts` reads/writes only `thejudge.theme.paletteId`; unsupported values currently fall
  back to Blue without deleting the invalid entry.
- `useThemePalette.ts` owns selected-profile React state, applies a fixed palette immediately, and
  persists the selected id. `applyPalette.ts` is the single document-root write boundary.
- `ThemeSection.tsx` renders the catalog; `FeaturePortalMenu.tsx` hosts it; `App.tsx` owns the hook
  and passes the selected id and callback into the portal.
- Tailwind aliases the four root variables as `accent`, `accent-strong`, `accent-soft`, and
  `accent-contrast`. Existing destinations and scanner surfaces already consume those aliases.
- Some Life Tracker dark surfaces and the conversation user bubble use the wrong foreground role
  for the approved Black profile and need role normalization, not profile-specific styling.

### Target shape

1. **Authoritative theme domain (Slice A).** `palettes.ts` exposes exactly the fixed WUBRGC catalog,
   Blue default, strict six-digit RGB-hex parsing, and a pure Colorless resolver that either returns
   the fixed gray palette or copies one custom RGB unchanged into `accent`, `accentStrong`, and
   `accentSoft` while retaining white `accentContrast`. `themePrefs.ts` adds a separate custom-RGB
   key and deletes invalid selected ids or malformed custom values on load. The root CSS defaults
   match the approved Blue values to avoid a pre-effect visual mismatch.

2. **Runtime customization and Theme UI (Slice B).** `useThemePalette` owns both selected id and
   optional custom Colorless RGB. Selection, custom updates, and reset all apply through the same
   `applyPalette` boundary. `ThemeSection` renders six profiles in WUBRGC order and exposes a native
   color input plus `Reset to gray` only while Colorless is selected. The portal keeps the Theme
   controls available long enough to customize Colorless; destination selection behavior is
   unchanged.

3. **Semantic token-role normalization (Slice C).** Dark surfaces use `text-accent-soft`, light
   surfaces use `text-accent-strong`, and filled accent controls use `text-accent-contrast`.
   Normalize only mismatched existing consumers, chiefly Life Tracker dark chrome and the filled
   conversation user bubble. Do not add tokens, profile selectors, component overrides, ambient
   surfaces, or fixed color constants.

4. **Representative reach and closure (Slice D).** Add cross-destination tests proving one selected
   profile retints In-Depth Question, Quick Question, Player Life Tracker, portal chrome, and scanner
   accents without resetting destination/workflow state. Run the complete frontend and repository
   gates, perform the required Black-versus-Colorless manual review, and leave an explicit cleanup
   handoff.

## Data flow

```text
localStorage selected id ──load/delete invalid──┐
                                               ├──▶ useThemePalette state
localStorage custom RGB ──load/delete malformed┘          │
                                                          ▼
Theme profile click / Colorless input / reset ──▶ resolvePalette(id, customRgb)
                                                          │
                                              applyPalette(document root)
                                                          │
                         --accent / --accent-strong / --accent-soft / --accent-contrast
                                                          │
                                                          ▼
             Tailwind accent aliases ──▶ all existing shared consumers in every destination
```

- Selecting a fixed profile persists only the profile id; the remembered Colorless RGB remains
  untouched.
- Selecting Colorless resolves the remembered custom RGB when present, otherwise fixed gray.
- Changing the native input persists the RGB separately and immediately reapplies Colorless.
- Reset deletes only the custom RGB and immediately reapplies fixed Colorless gray.
- Failed storage access is caught at the preference boundary; React state and document-root styling
  still update for the session.

## Contract and scope guardrails

- Preserve the four existing CSS token roles and the single `applyPalette` document-root boundary.
- Preserve Blue as the default and exact fixed token values from DEC-119/REQ-099.
- Custom Colorless receives no contrast warning, rejection, correction, tint/shade derivation, or
  validation beyond rejecting malformed persisted data during load.
- Do not expand REQ-060's ambient-surface inventory, tint the neutral slate page background, recolor
  card-identity rings, or change scanner behavior/motion.
- No backend, endpoint, `AskAiRequest`, schema, prompt, provider, metadata, scan-engine, stack-order,
  or data-pipeline change.
- The refinement comparison image is planning-only and disappears with this work folder at cleanup;
  no Magic symbols, logos, card art, or new product asset ships.

## Slice dependency map

| Slice | Depends on | Sequential blocker |
| --- | --- | --- |
| A — Profile catalog and persistence foundation | — | — |
| B — Colorless runtime and Theme controls | A | Consumes Slice A's resolver, storage API, and six-profile catalog. |
| C — Semantic token-role normalization | B | Must verify the finalized fixed/custom runtime against real rendered controls. |
| D — Global reach, verification, and ship closure | A, B, C | Exercises the complete catalog, interaction, and normalized consumers end to end. |

This package is intentionally sequential: each later slice verifies contracts or rendered behavior
introduced by the earlier slice, and the shared App/portal tests must remain green at every handoff.

## Verification checklist

- [ ] Exact WUBRGC order, approved fixed values, Blue default, and absence of retired definitions are
      asserted in `palettes.test.ts`.
- [ ] Every fixed profile's `accentContrast` clears 4.5:1 against both `accent` and `accentStrong`;
      Black and Colorless fixed tokens are distinct.
- [ ] Unsupported/retired selection values are deleted and fall back to Blue; malformed custom RGB
      is deleted and resolves to fixed Colorless gray.
- [ ] Colorless custom RGB applies unchanged to the three color roles, retains white contrast,
      persists independently, survives switching away/back, and reset deletes only the custom key.
- [ ] Storage read/write failures never block render or session-only selection/customization.
- [ ] Theme UI renders six ordered labeled controls, a Colorless-only native color input, and
      `Reset to gray` with accessible labels and touch-friendly controls.
- [ ] Token-role assertions cover representative dark text, light text, and filled controls; no
      profile-specific class branches or new token roles exist.
- [ ] Representative integration coverage includes In-Depth Question, Quick Question, Player Life
      Tracker, feature-portal chrome, and scanner accents while preserving active state.
- [ ] Neutral page background, card-identity rings, scanner behavior/motion, and backend/public
      contracts remain unchanged.
- [ ] Manual visual check: Black is legible on representative dark and light surfaces and remains
      visibly distinct from both Colorless and the slate shell across the named destinations.
- [ ] `npm run quality:check` and `git diff --check` pass in the final slice.
