# GAMEPLAN — scan-camera-desktop-sizing-regression

Two independently fixable regressions in `ScanCameraSurface`, both introduced by commit `666ac18`: (1) the mobile-tuned viewport-height clamp on the scan video has no desktop breakpoint, so desktop inherits mobile sizing and renders oversized/distorted; (2) the DEC-090 mute toggle is still visually clipped by the top-left status/convergence indicator box when it grows to its two-line searching state. Fix 1 is a regression against REQ-068's own desktop-fallback acceptance criterion (no new REQ). Fix 2 is DEC-093/REQ-071 (already drafted during refinement): drop the generic `"Searching for a card…"` label while searching, showing only the active hint/nudge/cue or nothing.

Source of truth: `DESIGN-BRIEF.md`, REQ-068 (desktop-fallback clause), REQ-071, DEC-090, DEC-093.

## Architecture

Both fixes are localized, copy/CSS-only edits inside a single component, `apps/frontend/src/components/ScanCameraSurface.tsx`, on two independent codepaths:

1. **Video sizing (Slice A)** — the `<video>` element's Tailwind className. Today it is a single unconditional class list: `h-[clamp(20rem,calc(100dvh-17rem),42rem)] !max-h-none w-full bg-zinc-950 object-cover` (line ~437). Slice A breakpoint-scopes this: the mobile clamp stays as the base (unprefixed) classes below `md:` (768px — the desktop threshold; the desktop screenshot that surfaced the regression was ~1524px wide, well above the DEC-090 phone-width targets of ≤360/390/414px, and the codebase has no existing `md:`/`lg:` precedent to contradict), and at `md:` and above it falls back to the pre-`666ac18` proportion-stable `aspect-[3/4]` sizing (auto height, no viewport-height clamp), preserving `object-cover` and no distortion/scroll at any width.
2. **Indicator copy (Slice B)** — the `indicatorText` computation (`ScanCameraSurface.tsx` ~lines 420-425) and its render (~line 466). Today the `isSearching` branch always falls through to the literal `"Searching for a card…"`. Slice B changes that branch to reuse the already-computed `searchingNudge`/`inZoneCue` (hint/nudge over in-zone cue, matching existing priority) instead of the generic label, and the `<span>{indicatorText}</span>` render becomes conditional so an empty searching state renders no text node. `locking` and `camera-error` branches are untouched.

Both fixes touch only `ScanCameraSurface.tsx` and its co-located test file. Neither changes scanner behavior, detection, the stabilizer/lock gate, `AskAiRequest`, Zod schemas, `GameContext`, prompt assembly, or any endpoint (constraint shared by REQ-068 and REQ-071).

### Data flow

No data-flow change — this is presentation-only. Both edits read existing state (`convergence`, `status`, viewport width via CSS breakpoint) with no new props, hooks, or state.

## Files touched

- `apps/frontend/src/components/ScanCameraSurface.tsx` — video className (Slice A), `indicatorText` + render (Slice B)
- `apps/frontend/src/components/ScanCameraSurface.test.tsx` — update the existing sizing assertion (Slice A) and every existing assertion that expects the literal `"Searching for a card…"` string across the `convergence indicator`, `condition hints`, `detector nudge`, and `positive in-zone cue` describe blocks (Slice B), plus new tests for both fixes' acceptance criteria

## Reuse (before creating)

- Existing `searchingNudge`/`inZoneCue` derivation already implements DEC-093's priority order (nudge/hint over in-zone cue) — Slice B reuses it as-is for the searching branch of `indicatorText`; no new derivation logic.
- Stock Tailwind default breakpoints (`tailwind.config.ts` defines no custom `screens`) — Slice A uses the plain `md:` prefix.

## Dependency waves

| Wave | Slices | Rationale |
| --- | --- | --- |
| 1 | A, B | No logical cross-deps: Slice A only touches the `<video>` className; Slice B only touches `indicatorText`/its render. Both land in the same two files, so implement one PR at a time to avoid a diff clash, but neither blocks the other. |

## Verification checklist

- [ ] Mobile (below `md:`) keeps the `666ac18` clamp classes (`h-[clamp(20rem,calc(100dvh-17rem),42rem)] !max-h-none`); nothing clips or scrolls on short viewports (Slice A).
- [ ] Desktop (`md:` and above) falls back to `aspect-[3/4]`-equivalent proportion-stable sizing; `object-cover` preserved, no distortion (Slice A).
- [ ] While `isSearching`, the indicator box never renders the literal `"Searching for a card…"` string (Slice B).
- [ ] Hint/nudge/in-zone cue still render with correct priority and unchanged wording while searching (Slice B).
- [ ] `locking` and `camera-error` indicator copy are byte-for-byte unchanged (Slice B).
- [ ] `npm --workspace apps/frontend run test -- src/components/ScanCameraSurface.test.tsx` green.
- [ ] `npm run quality:check` green for touched areas.
- [ ] Final slice: PRD promotion (system-map.md "Responsive scan-layout closeout" entry) + ship gates.
