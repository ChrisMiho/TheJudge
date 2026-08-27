# Slice A — Verify the spec's structural-chrome content against its cited sources

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

## Status: planned

## Goal

Confirm `PRD/sections/shared-chrome/README.md` (already written, committed
in `0445150`, 442 lines) is complete and correct for the structural half of
the file: the structural portion of the header (`Status:`/`Backed by:`),
**What it is**, the first four **How it works** subsections (suite shell +
mock-mode banner; destination routing + load fallback; Menu corner rail +
tray; Theme section), the whole **Shared layout language** section, the
structural portion of **Measured bounds** and **Rejected alternatives and
deferred scope**, and the structural portion of **Where it lives** —
against the cited sources and the DEC-168 template. This slice does not
touch the conversation/overlay-chrome subsections (slice B owns those), the
two scope-boundary bullets in Rejected alternatives, or the
`PRD/README.md` row / diff-scope proof (slice C owns those). This slice
verifies; it does not author. Close any confirmed, sourced gap with a
bounded additive correction only.

## Requirements

1. Read the cited sources before checking a line:
   `PRD/sections/decisions/navigation.md` (DEC-095, DEC-104, DEC-109,
   DEC-110, DEC-111, DEC-121, DEC-122, DEC-133, DEC-135, DEC-137, DEC-140,
   DEC-147, DEC-150, DEC-157); `PRD/sections/decisions/ui-presentation.md`
   (DEC-085, DEC-117, DEC-145, DEC-148, DEC-149); `PRD/sections/decisions/
   conversation-ux.md` DEC-118 (background only, where cited alongside
   DEC-149/DEC-117 in Shared layout language — the conversation-chrome
   detail itself is slice B's scope). Confirm each home file at read time
   rather than trusting this list — it is a map-out pre-scout, not ground
   truth.
2. Read `PRD/sections/functional-requirements.md` for REQ-089, REQ-090,
   REQ-096, REQ-113, REQ-114, REQ-115, REQ-122, REQ-123, REQ-124, REQ-127,
   REQ-131, REQ-140. Read `PRD/sections/non-functional-requirements.md` for
   NFR-011, NFR-014. Read `PRD/sections/system-map.md`'s `## Feature portal
   (app navigation)` and `## Mock-mode banner` blocks. Read
   `PRD/sections/screen-layout.md`'s `## Shared layout language` and
   `### Shared chrome` rows.
3. Confirm the structural half of the header: the `Status:` line states the
   file is a draft, derived, non-authoritative view naming the cited
   `DEC`/`REQ`/`FLOW`/`NFR` as the winner on conflict and
   `PRD/sections/decisions.md` as precedence #1; every navigation-chrome and
   shell/banner/layout-direction ID in the `Backed by:` line (DEC-095,
   DEC-104, DEC-109, DEC-110, DEC-111, DEC-117, DEC-121, DEC-122, DEC-133,
   DEC-135, DEC-137, DEC-140, DEC-145, DEC-147, DEC-148, DEC-149, DEC-150,
   DEC-157, DEC-085, REQ-089, REQ-090, REQ-096, REQ-113, REQ-114, REQ-115,
   REQ-122, REQ-123, REQ-124, REQ-127, REQ-131, REQ-140, NFR-011, NFR-014)
   resolves to a real, pre-existing ID in its home file. Do not check the
   conversation/overlay/popup ID subset in this pass — slice B owns that
   half of the same `Backed by:` line.
4. Confirm the file's top-level sections are present, in order: **What it
   is**, **How it works** (with all eight subsection headings present, in
   order — slice B verifies the content of the last four), **Shared layout
   language**, **Measured bounds**, **Rejected alternatives and deferred
   scope**, **Where it lives**.
5. Confirm **What it is** accurately frames shared chrome as the frame
   every destination mounts into (suite shell, Menu rail, layout rules, and
   — for the two ask flows — the chat workspace/history drawer/View
   Context/card-detail popup), names all four registered destinations by
   name, and states the binding-constraint-7 split (per-screen rows stay
   with their feature; shared chrome and the shared layout language live
   here) — without inventing scope beyond that framing.
6. Confirm each of the first four **How it works** subsections against its
   cited sources, with no invented capability and no omission of a stated
   behavior:
   - **The suite shell and mock-mode banner** — DEC-145/REQ-124/DEC-117
     (standard `PageShell` mount vs. Life Tracker/Trade Balancer full-bleed
     exception), DEC-085/REQ-123 (persistent non-dismissible banner, single
     `ASK_AI_PROVIDER` source of truth, presentation-only), DEC-085/REQ-123
     (single mount in `PageShell`, `data-mock-banner` offset, the known gap
     on full-bleed destinations).
   - **Destination routing and the load fallback** — DEC-157/REQ-140 (four
     flat top-level URL routes, URL as source of truth, literal per-registry
     paths, deep-link/unknown-path/bare-`/` behavior, history push),
     DEC-157/REQ-140 (router supplies location/history only,
     `DestinationOutlet` keep-alive mounting unchanged), DEC-157/NFR-014
     (per-destination `React.lazy`/`Suspense` boundary, fallback occupies
     the content region inside the existing shell, at most once per
     destination per session, no branded splash), DEC-157/NFR-014
     (`vite.config.ts` function-form `manualChunks`: `scan` group, `vendor`
     group).
   - **The Menu corner rail and tray** — DEC-122/DEC-109/DEC-133 (top-left
     corner-rail trigger, full-height left tray sliding from the left edge,
     docked inline never viewport-fixed, brand block centered, step-name
     eyebrow placement), DEC-135/DEC-104/DEC-095 (registry-order destination
     list, Send-feedback action entry, Theme section, active-entry check
     mark, registry-order default), DEC-133/DEC-147/REQ-113/REQ-122 (tray
     fills the visible shell side, matching corner radii, opaque across
     painted bounds), DEC-137/DEC-126/REQ-114/REQ-113 (split Menu+History
     rail on conversation destinations, single-zone rail elsewhere,
     interactive-box-vs-paint distinction, hit-testing verification),
     DEC-150/DEC-140/DEC-147/REQ-115/REQ-127/REQ-122 (rail icons hidden
     while tray open, outside-click/Escape as the only close path, Menu↔
     History mutual exclusivity), DEC-111/DEC-157/REQ-090
     (`sessionStorage` persistence demoted to bare-`/` fallback, per-
     destination state reset on reload except saved history, deep-link
     override on a new tab).
   - **Theme section** — DEC-110/REQ-089 (Theme section inside the tray,
     no standalone floating control, palette values/persistence/fallback
     unchanged from the former control), DEC-117/REQ-096/NFR-011 (automatic
     fluid responsive presentation replacing the Desktop/Mobile density
     control, no UA sniffing/JS device detection/separate trees, no layout/
     profile control in the Theme section), REQ-131/DEC-135 (palette orbs
     on one row, normal inset rather than rail-clearing inset).
7. Confirm the whole **Shared layout language** section against its cited
   sources: viewport bands (DEC-149, DEC-117, DEC-118 background), hybrid %
   model (DEC-145, REQ-124, DEC-149), fit rule (DEC-149), anti-
   overcalibration (DEC-149) — and that it states it is authoritative for
   layout *direction* under DEC-149/REQ-126 without overriding binding
   presentation DECs' specifics.
8. Confirm the structural portion of **Measured bounds** against its cited
   sources: suite shell width, single-zone Menu rail geometry, split Menu+
   History rail geometry, Menu tray geometry, mock-mode banner strip +
   known gap, routing figures, and the touch-target/text-floor bullet
   (NFR-001, DEC-117) — do not check the conversation/overlay/popup bullets
   in this pass, only confirm this portion does not contradict slice B's
   portion.
9. Confirm the structural portion of **Rejected alternatives and deferred
   scope** matches its cited DECs' Context/Notes language exactly: the
   top-middle Menu tab closed door (DEC-122, DEC-121), the partial-height
   floating Menu drawer closed door (DEC-133), the stacked Menu-over-History
   rail zones closed door (DEC-137, DEC-126), the rail interactive-box-
   exceeds-paint closed door (DEC-137), the Menu-trigger-as-close-control
   closed door (DEC-150, DEC-140, DEC-147), the `sessionStorage`-as-source-
   of-truth/no-URL-routing closed door (DEC-157, DEC-111), the single-
   Suspense-boundary closed door (DEC-157), and the standalone floating
   theme control / density preference closed door (DEC-110, DEC-117,
   REQ-089, REQ-096) — nothing invented, nothing omitted. Do not check the
   two scope-boundary bullets (deferred/out-of-scope; per-feature surfaces)
   — slice C owns those.
10. Confirm the structural portion of **Where it lives** — the portal
    chrome under `apps/frontend/src/components/portal/`
    (`FeaturePortalMenu.tsx`, `ThemeSection.tsx`, `PortalSlot.tsx`,
    `ShellBounds.tsx`, `DestinationOutlet.tsx`, `destinationRegistry.tsx`),
    `apps/frontend/src/components/PageShell.tsx`,
    `apps/frontend/src/hooks/useActiveDestination.ts`,
    `apps/frontend/src/lib/portal/` (`types.ts`, `slotContext.tsx`,
    `activeDestinationPrefs.ts`, `leftEdgeDrawerContext.tsx`), header/eyebrow
    chrome (`StagedStepHeader.tsx`, `StepEyebrow.tsx`, `BrandMark.tsx`),
    `apps/frontend/src/App.tsx`, the mock banner
    (`apps/frontend/src/components/MockModeBanner.tsx`,
    `apps/frontend/src/lib/env.ts`, `apps/frontend/vite.config.ts`), routing
    (`react-router` in `App.tsx`, `manualChunks` in `vite.config.ts`), and
    the structural-chrome CSS classes (`.portal-menu-rail`,
    `.page-shell-bleed`, `.portal-shell-bounds`, `.step-eyebrow`,
    `.mock-mode-banner` in `apps/frontend/src/index.css`) — against
    `system-map.md`'s `## Feature portal (app navigation)` and `## Mock-mode
    banner` blocks and the actual repository tree. Confirm each named file
    exists (`find`/`ls`). Do not check the conversation-chrome file list in
    this same pass — slice B owns that half.
11. Confirm no new stable ID token (a `DEC-`, `REQ-`, `FLOW-`, `NFR-`, or
    `Q-` token followed by digits) appears anywhere in the file that does
    not already resolve to a real, pre-existing ID in its home file.
12. Touch only `PRD/sections/shared-chrome/README.md`, and only for a
    bounded additive correction confined to the sections this slice owns
    (structural header portion, What it is, the first four How it works
    subsections, Shared layout language, the structural portions of
    Measured bounds and Rejected alternatives, the structural portion of
    Where it lives) — no edit to the conversation/overlay subsections, no
    edit to the two scope-boundary bullets, no other file, no DEC/REQ/FLOW/
    NFR body edit, no `system-map.md`/`screen-layout.md`/
    `open-questions.md`/`goals-and-non-goals.md` edit, no `apps/` change, no
    new decision.

## Acceptance criteria

- [ ] A1 — The header's `Status:` line names the file draft, derived,
      non-authoritative, with the cited `DEC`/`REQ`/`FLOW`/`NFR` winning any
      conflict and `PRD/sections/decisions.md` as precedence #1, and every
      navigation-chrome and shell/banner/layout-direction ID in `Backed by:`
      (the 22-ID subset listed in requirement 3) resolves to a real,
      pre-existing ID in its home file.
- [ ] A2 — The file's top-level sections are present in order: What it is,
      How it works (all eight subsection headings present, in order),
      Shared layout language, Measured bounds, Rejected alternatives and
      deferred scope, Where it lives.
- [ ] A3 — **What it is** is confirmed accurate: names all four registered
      destinations, frames shared chrome as the mounting frame, and states
      the binding-constraint-7 split — no invented scope.
- [ ] A4 — Each of the first four **How it works** subsections is confirmed
      traceable to its cited sources' actual text (requirement 6's
      per-subsection list) — no invented capability, no dropped behavior.
- [ ] A5 — The **Shared layout language** section is confirmed against
      DEC-149, DEC-145, DEC-117, REQ-124, and its "authoritative for
      direction, not a presentation-DEC override" framing.
- [ ] A6 — The structural portion of **Measured bounds** (shell width, rail
      geometries, tray, mock banner, routing, touch-target/text floor) is
      confirmed against its cited sources and does not contradict slice B's
      portion.
- [ ] A7 — The structural portion of **Rejected alternatives and deferred
      scope** (the eight closed-door bullets in requirement 9) matches its
      cited DECs' Context/Notes language, with nothing invented or omitted.
- [ ] A8 — The structural portion of **Where it lives** names every file
      `system-map.md`'s `## Feature portal (app navigation)` and `## Mock-
      mode banner` blocks and the actual repository tree confirm belongs to
      shared chrome; each named file is confirmed to exist.
- [ ] A9 — No new (minted) stable ID token appears in the file — every ID
      token present resolves to a real, pre-existing ID in its home file —
      and this slice's diff touches only
      `PRD/sections/shared-chrome/README.md`, confined to the sections this
      slice owns, and only for bounded additive correction where genuinely
      needed — no `apps/` change, no edit to any existing DEC/REQ/FLOW/NFR
      body, no `system-map.md`/`screen-layout.md`/`open-questions.md`/
      `goals-and-non-goals.md` edit.

## Verification

```bash
grep -nE "^- Status:|Backed by:|^## " PRD/sections/shared-chrome/README.md
grep -n "^### DEC-095\|^### DEC-104\|^### DEC-109\|^### DEC-110\|^### DEC-111\|^### DEC-121\|^### DEC-122\|^### DEC-133\|^### DEC-135\|^### DEC-137\|^### DEC-140\|^### DEC-147\|^### DEC-150\|^### DEC-157" PRD/sections/decisions/navigation.md
grep -n "^### DEC-085\|^### DEC-117\|^### DEC-145\|^### DEC-148\|^### DEC-149" PRD/sections/decisions/ui-presentation.md
grep -n "^### DEC-118" PRD/sections/decisions/conversation-ux.md
grep -n "^### REQ-089\|^### REQ-090\|^### REQ-096\|^### REQ-113\|^### REQ-114\|^### REQ-115\|^### REQ-122\|^### REQ-123\|^### REQ-124\|^### REQ-127\|^### REQ-131\|^### REQ-140" PRD/sections/functional-requirements.md
grep -n "^### NFR-011\|^### NFR-014" PRD/sections/non-functional-requirements.md
grep -n "^## Feature portal\|^## Mock-mode banner" PRD/sections/system-map.md
grep -n "Shared layout language\|Shared chrome" PRD/sections/screen-layout.md
find apps/frontend/src/components/portal -maxdepth 1 -type f
ls apps/frontend/src/components/PageShell.tsx apps/frontend/src/components/MockModeBanner.tsx apps/frontend/src/hooks/useActiveDestination.ts apps/frontend/src/lib/env.ts apps/frontend/vite.config.ts apps/frontend/src/App.tsx
find apps/frontend/src/lib/portal -maxdepth 1 -type f
grep -n "portal-menu-rail\|page-shell-bleed\|portal-shell-bounds\|step-eyebrow\|mock-mode-banner" apps/frontend/src/index.css
grep -oE "(DEC|REQ|FLOW|NFR|Q)-[0-9]+" PRD/sections/shared-chrome/README.md | sort -u
git status --porcelain PRD/sections/ apps/
```

## Files touched

- `PRD/sections/shared-chrome/README.md` (verify; bounded additive
  correction only if genuinely needed, confined to the sections this slice
  owns)
