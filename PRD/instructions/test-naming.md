# test-naming.md

## Purpose

Canonical rules for Vitest `describe` / `it` titles in `apps/frontend` and `apps/backend`. Apply on every new or edited `*.test.ts` / `*.test.tsx` file so CI output maps to layer and product feature.

## Hierarchy

Use nested suites. The outermost `describe` is always `Layer - Feature`. Nested `describe`s name the area or surface. `it` titles are verb-led behavior.

```ts
describe("Frontend - MTG Assistant", () => {
  describe("Answered state", () => {
    it("shows frozen context summary after Ask AI succeeds", () => {
      // ...
    });
  });
});
```

Vitest prints:

`Frontend - MTG Assistant > Answered state > shows frozen context summary after Ask AI succeeds`

| Segment | Rules |
|---|---|
| Layer | Exactly `Frontend` or `Backend` |
| Feature | From the closed vocabulary below |
| Nested `describe` | Area / surface (optional nesting depth) |
| `it` | Verb-led behavior; no planning IDs |

When a file has several top-level suites for the same feature, wrap them in one outer `describe("Layer - Feature", …)` rather than repeating the layer/feature prefix on every suite.

## Feature vocabulary (closed set)

**Frontend:** `MTG Assistant`, `Quick Lookup`, `Trade`, `Card Scan`, `Portal`, `Theme`, `Shared`

**Backend:** `Ask AI`, `Game Rules`, `Providers`, `Eval`, `Shared`

### Mapping heuristics

- Portal destinations → matching feature (`Quick Lookup`, `Trade`, `MTG Assistant`)
- Scanner UI + `lib/scan/**` → `Card Scan`
- Theme / density / palettes → `Theme`
- Portal chrome / registry / outlet → `Portal`
- Cross-cutting utils (search, env, motion foundation, errors, config) → `Shared`
- Prompt / ask-ai route / validation / mock → `Ask AI`
- Rules retrieval / topics → `Game Rules`

If a unit does not fit a product feature, use `Shared`. Do not invent new feature labels without updating this file.

## Anti-patterns

Do not put planning or era labels in titles:

- Slice / Slice-A / Slice-04
- STORY-*
- REQ-* / DEC-* (including parenthetical cites)
- MVP / MVP1 as suite framing

Provenance may stay in code comments when useful. User-visible product copy asserted in tests (for example an on-screen “MVP” string) is unrelated and may remain in expectations.

## Good / bad examples

| Bad | Good |
|---|---|
| `Slice-A: frozen context summary in answered state` | outer `Frontend - MTG Assistant`, nested `Answered state` / `Frozen context summary` |
| `STORY-074 target gating and pickers` | outer `Frontend - MTG Assistant`, nested `Target gating and pickers` |
| `ScanCameraSurface positive in-zone cue (slice B / REQ-054)` | outer `Frontend - Card Scan`, nested `Positive in-zone cue` |
| `retrieveSupplementalRules — IDF scoring (DEC-046)` | outer `Backend - Game Rules`, nested `IDF scoring` |
| `App MVP interaction flows` | outer `Frontend - MTG Assistant`, nested `Interaction flows` |

## Scope note

This convention covers printed suite titles only. Test filenames and directory layout are out of scope unless a separate decision changes them.
