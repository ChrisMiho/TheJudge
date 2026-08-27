# Shared Chrome — current-state feature spec

- Status: draft, derived, non-authoritative view. On any conflict, the cited
  `DEC`/`REQ`/`FLOW`/`NFR` wins — `PRD/sections/decisions.md` stays precedence #1
  and Read-First #1. Correct this file against those sources, not the other
  way around.
- Backed by: DEC-085, DEC-095, DEC-104, DEC-109, DEC-110, DEC-111, DEC-117,
  DEC-118, DEC-121, DEC-122, DEC-123, DEC-124, DEC-125, DEC-126, DEC-127,
  DEC-129, DEC-130, DEC-131, DEC-133, DEC-134, DEC-135, DEC-137, DEC-138,
  DEC-140, DEC-141, DEC-142, DEC-143, DEC-144, DEC-145, DEC-146, DEC-147,
  DEC-148, DEC-149, DEC-150, DEC-151, DEC-153, DEC-156, DEC-157, DEC-158,
  DEC-159, DEC-160, REQ-067, REQ-089, REQ-090, REQ-096, REQ-113, REQ-114,
  REQ-115, REQ-116, REQ-117, REQ-118, REQ-119, REQ-122, REQ-123, REQ-124,
  REQ-126, REQ-127, REQ-128, REQ-131, REQ-135, REQ-140, REQ-141, REQ-142,
  FLOW-010, FLOW-016, FLOW-017, FLOW-018, NFR-001, NFR-006, NFR-011, NFR-014

## What it is

The frame every feature lives inside. A player never opens "shared chrome" — they
open Quick Question, In-Depth Question, the Life Tracker, or the Trade Balancer,
and each one appears inside the same outer shell, reached through the same
top-left Menu rail, sized by the same layout rules, and — for the two ask flows —
answered inside the same chat workspace with the same history drawer, the same
View Context overlay, and the same card-detail popup. This spec owns that shared
frame: the suite shell and its mock-mode banner, the feature-portal Menu rail and
sliding tray, the routing that makes destinations addressable and the placeholder
shown while a destination's code loads, the Theme section, the conversation
history drawer, the shared answered-conversation workspace, the View Context /
adaptive-context overlay, the suite-wide card-detail popup, the one shared overlay
close control, and the **shared layout language** (viewport bands, hybrid %
model, fit rule, anti-overcalibration) that every screen row is measured against.

Shared chrome is the sixth Phase A spec on purpose. The first five each had to
reach for this frame without owning it — life-tracker's full-bleed shell
exception, quick-lookup's reuse of the `ConversationWorkspace` / View Context /
card-detail popup, scan's cross-destination camera surface, trade-balancer and
user-feedback's shared shell bounds. This file consolidates those reach-arounds
into one authoritative view of the chrome itself. It is chrome only: nothing here
changes `AskAiRequest`, `GameContext`, prompt assembly, the provider boundary,
`POST /api/ask-ai`, or any product-facing endpoint. It carries **binding
constraint 7's split** — per-screen rows stay with their feature (Quick Question,
In-Depth's steps, Life Tracker, Trade Balancer, Scan camera, Feedback modal keep
their own `screen-layout.md` rows), while shared chrome and the shared layout
language live here.

## How it works

### The suite shell and mock-mode banner

- Built: portal destinations that use the standard shell mount inside `PageShell`
  (`.portal-shell-bounds` / `.page-card`) — the outer content frame. Life Tracker
  and Trade Balancer render as full-bleed destinations against the outer shell
  instead of the standard card. (DEC-145, REQ-124, DEC-117)
- Built: when the app is built or run with the mock AI provider, a persistent,
  non-dismissible mock-mode banner renders at the top of every screen —
  `⚖️ MOCK MODE · the real Judge is off duty — these rulings are pretend`. The
  mock/live signal is build-time configuration from the single `ASK_AI_PROVIDER`
  source of truth (`vite.config.ts` bridges it to `import.meta.env.VITE_ASK_AI_PROVIDER`,
  `env.ts` resolves the `isMockProvider` boolean), never inferred from `DEV`,
  `MODE`, `NODE_ENV`, the deploy host, or the answer text. It is presentation
  only — no backend health endpoint, no change to mock-response content. (DEC-085,
  REQ-123)
- Built: the banner mounts once in `PageShell`, so it covers the empty/home
  state, every staged step, and the answered workspace with no per-screen wiring;
  page content is offset (`data-mock-banner`) so the fixed strip never obscures a
  header, and it layers below the Menu's z-index. **Known gap (REQ-123):** the
  offset guarantee holds for destinations rendered through `PageShell`'s standard
  path; full-bleed destinations (Life Tracker, Trade Balancer) measured header
  controls covered by the fixed banner, with more than one banner node mounted at
  once. (DEC-085, REQ-123)

### Destination routing and the load fallback

- Built: the four registered destinations are addressable at flat top-level URLs
  — `/quick-lookup`, `/in-depth`, `/life-tracker`, `/trade-balancer` — via
  `react-router`, and the **URL is the source of truth** for the active
  destination. Paths are declared literally per registry entry (never derived from
  id or label). A deep link lands directly on that destination; an unknown path
  redirects to `/`; a bare `/` resolves through the guarded `sessionStorage`
  load/validate/fallback to the first registered destination. Selecting a
  destination pushes a history entry, so browser back/forward moves between
  destinations. (DEC-157, REQ-140)
- Built: the router supplies location and history only. `DestinationOutlet`'s
  **keep-alive mounting is unchanged** — every visited destination stays mounted
  and inactive ones are hidden, because `<Routes>`-style unmounting would break
  DEC-095's in-session state preservation. (DEC-157, REQ-140)
- Built: each destination sits behind a `React.lazy` boundary with its **own**
  per-destination `Suspense` fallback (a single boundary around the outlet would
  blank already-loaded siblings). The fallback occupies the destination content
  region **inside** the existing shell — the shell, corner rail, and brand block
  stay mounted and visible; it never replaces or resizes the shell and never
  renders as a full-viewport takeover. It reserves the region so the shell does
  not jump height when the chunk resolves, and appears at most **once per
  destination per session** (keep-alive means a revisited destination is already
  loaded). It stays quiet — no branded splash, progress bar, or motion beyond the
  CSS-motion rules. (DEC-157, NFR-014)
- Built: `vite.config.ts` declares function-form `manualChunks` — a `scan` group
  covering the scan surface shared across the scanning destinations (wider than
  `src/lib/scan/**`; includes `hooks/useScanCapture.ts` and
  `components/ScanCameraSurface.tsx`) and a `vendor` group for framework code
  (`react`, `react-dom`, `react/jsx-runtime`, `react-router`). (DEC-157, NFR-014)

### The Menu corner rail and tray

- Built: the suite's single navigation affordance is a **top-left corner rail** —
  a radial-gradient glow anchored at the header corner that fades to fully
  transparent well inside its own box, with no border and no separate button on
  top; the glow area itself is the trigger. Selecting it opens a **full-height
  left tray** of the outer shell that slides in from the left edge
  (`transform: translateX`), staying docked inline per-screen and never fixed to
  the viewport (a `fixed` fallback survives in code only as a defensive net for a
  hypothetical headerless destination). The brand block centers in the header row;
  the step-name text renders as an in-flow eyebrow above each step's own content,
  not in header chrome. (DEC-122, DEC-109, DEC-133)
- Built: the tray lists the registered destinations in registry order — **Quick
  Question, In-Depth Question, Life Tracker, Trade Balancer** — then the **Send
  feedback** action entry (which opens the feedback modal without switching the
  active destination), then the palette-only Theme section. Rows render full-bleed,
  separated by rules that meet the tray's left wall; the active entry keeps a check
  mark and quiet fill. Registry order also supplies the no-stored-preference
  default: **Quick Question** leads and is the default destination. (DEC-135,
  DEC-104, DEC-095)
- Built: the tray fills the visible shell side (viewport ∩ shell on tall
  scrollable pages), with matching top- and bottom-left shell radii and an optional
  quiet, non-interactive brand mark in unused lower space. It is opaque across its
  full painted bounds — no destination text, control, or artwork remains legible
  through it — and its painted content does not overflow the shell/viewport bottom.
  (DEC-133, DEC-147, REQ-113, REQ-122)
- Built: on the two conversation-bearing destinations (In-Depth Question, Quick
  Question) the rail splits into **side-by-side Menu + History zones** in a single
  `2.75rem`-tall band, Menu leading and History trailing. Life Tracker and Trade
  Balancer keep the single-zone Menu-only rail. Suite chrome's interactive box may
  not extend past the affordance it paints: the single-zone rail's interactive box
  is `5.5rem × 3.5rem` while its gradient keeps painting at `5.5rem × 10.5rem` as
  `pointer-events: none` decoration; compliance is verified by hit-testing, not by
  eye. (DEC-137, DEC-126, REQ-114, REQ-113)
- Built: while the tray is open, neither the Menu trigger nor the History zone is
  visible or hit-testable (`aria-hidden`, `tabIndex={-1}`, `visibility: hidden`,
  `pointer-events: none`), and the tray fully occludes the under-rail History zone.
  The tray closes exclusively by outside click / Escape — the rail icons are not
  the open-state close control. Menu↔History mutual exclusivity still applies when
  History is opened by other means. (DEC-150, DEC-140, DEC-147, REQ-115, REQ-127,
  REQ-122)
- Built: the active-destination choice persists across a refresh within the same
  tab via guarded `sessionStorage` (demoted to the bare-`/` fallback under
  DEC-157); each destination's staged/conversation/follow-up state still resets on
  reload, except browser-local saved conversation history. A brand-new tab opens on
  the first registered destination only when it opens a bare `/` — a deep link
  overrides it by design. (DEC-111, DEC-157, REQ-090)

### Theme section

- Built: palette selection lives as a **Theme** section inside the Menu tray,
  below the destination and action-entry list — there is no standalone floating
  theme control anywhere in the app. Palette values, browser-local persistence, and
  corrupt/missing-value fallback to the default are unchanged from the former
  corner control; only the picker's host moved. (DEC-110, DEC-089-consolidation via
  REQ-089)
- Built: automatic fluid responsive presentation replaced the former
  Desktop/Mobile density control — one semantic component tree, mobile-first CSS,
  shared fluid tokens, and structural media queries only where layout cannot
  interpolate; no UA sniffing, JS device detection, or separate mobile/desktop
  trees. The Theme section exposes no layout/profile control. (DEC-117, REQ-096,
  NFR-011)
- Built: the Theme section's palette orbs sit on one row within the tray; the
  section takes a normal inset rather than the rail-clearing row inset (it sits well
  below the rail's icon zone). (REQ-131, DEC-135)

### The shared answered-conversation workspace

- Built: after the first successful answer, In-Depth Question and Quick Question
  render the **same** chat-first `ConversationWorkspace` rather than each keeping a
  separate answered-state assembly. The scrollable message log is the dominant
  surface; the follow-up composer docks within the workspace as a rounded pill (not
  viewport-fixed); retry/error placement, Start Over, the context trigger, and the
  New-response affordance occupy stable workspace rows. (DEC-118, DEC-127)
- Built: assistant turns render as sanitized structured markdown (GFM; no raw HTML
  execution) as plain flowing text with no bubble; user turns are solid
  accent-colored right-aligned bubbles — the wire contract stays a plain `{ answer }`
  string, only the rendering changes. Appended messages auto-scroll only when the
  reader is within 64px of the bottom; a farther-up reader keeps their exact scroll
  position and gets one New-response control that scrolls to and focuses the newest
  assistant message. Motion is `auto` under reduced motion; only newly appended
  messages animate. (DEC-123, DEC-118, DEC-127, NFR-006)
- Built: short threads still fill the available workspace height (no dead band
  below a short card); desktop Start Over stays reachable in the workspace chrome,
  and mobile Start Over is a compact control above the 44px touch floor. (DEC-131,
  DEC-127, NFR-001)
- Built: the answered-workspace top clearance for View Context matches the
  **post-DEC-137 side-by-side rail footprint**: the corner rail participates in
  layout (`position: relative`) so the header owns its 44px band, and the shared
  `--layout-surface-gap` owns the spacing — no rail-sized compensating constant.
  History↔View Context non-overlap still holds. (DEC-141, REQ-116, DEC-129)

### Conversation history drawer

- Built: any conversation that reaches at least one successful answer auto-saves to
  a browser-local, single-device history list, capped at the **20 most recent**
  completed entries (a 21st prunes the oldest). Each entry stores flow/mode, the
  frozen context snapshot (`GameContext` or attached card), the full message thread,
  and a created/updated timestamp; reads are guarded try/catch with corrupt entries
  dropped. Selecting an entry restores its frozen context, mode, and thread and
  re-enables follow-ups exactly as a freshly-answered conversation. (DEC-124,
  FLOW-016, DEC-103-precedent)
- Built: the drawer opens from the **History zone of the Menu corner rail** on
  In-Depth Question and Quick Question, always present — including empty history,
  every pre-submit step, and immediately after Start Over — and must not overlap
  View Context. It presents as a left-edge, full-height drawer at every viewport,
  mutually exclusive with the Menu tray via `LeftEdgeDrawerContext`. Selecting a
  saved conversation on In-Depth from any staged step lands the flow on the answered
  workspace in the same action. (DEC-126, DEC-129, DEC-134, DEC-125, FLOW-016)
- Built: each conversation-bearing destination keeps exactly one browser-local
  **Draft** slot snapshotting mid-flight staging (typed question, optional card,
  staged game/zones/enrichment, current step) so Menu navigation, reload, or opening
  a saved conversation do not wipe pre-submit work. The drawer lists Draft as its own
  row, distinct from completed entries; selecting it restores staged state. Draft
  auto-hydrates the mid-flight UI on destination mount (reload or Menu return). The
  first successful submit clears Draft and the conversation enters completed history;
  Draft does not count toward the 20-entry cap. Opening a saved conversation from
  mid-flight staging silently snapshots Draft first, in both destinations. (DEC-130,
  DEC-138, FLOW-017)
- Built: each completed row exposes a delete control, distinct from select-to-resume,
  that confirms before removing the entry; deleting the active completed conversation
  clears the workspace to its clean pre-answer state without re-saving the deleted
  thread. The prune-at-20 cap is preserved; Draft rows are not deletable via this
  control. (DEC-143, REQ-118, FLOW-018)

### View Context / adaptive-context overlay

- Built: frozen flow context moves behind a compact **View Context** trigger before
  the message log, opening `AdaptiveContextDialog` — one semantic modal tree that CSS
  presents as a **bottom sheet below `768px`** and a **right-side drawer at `768px+`**
  (no JS viewport-mode selection). It has an accessible name, traps Tab focus,
  dismisses on Escape or its close control, and restores focus to the trigger. In-Depth
  always supplies a phase + populated-zone-count trigger backed by the full read-only
  setup/zone/card/enrichment detail; Quick Question supplies a card-name trigger reusing
  the shared read-only card presentation when a card is attached, and renders no trigger
  or container without a card. (DEC-118, DEC-141)
- Built: View Context, the History drawer, and the Menu tray all dismiss on
  outside/scrim click in addition to Close and Escape, without closing on clicks inside
  the panel surface — one shared outside-click implementation across the overlay family.
  (DEC-142, REQ-117, REQ-135)
- Built: opening View Context on a resumed lookup card never white-screens the app —
  `CardSelectionPreview` tolerates missing/undefined `colors` / `supertypes` /
  `subtypes` and other optional fields, falling back to N/A-style empty handling instead
  of throwing; persistence prefers storing the full `CardMetadataItem` shape used at
  submit time. (DEC-144, REQ-119)

### Card detail popup (suite-wide) and the shared close control

- Built: whenever a card image is shown anywhere in the suite, a compact corner control
  (top-right of the image) opens a **dismissible detail popup** carrying oracle text and
  other locally carried descriptive fields (no new fetch; a missing image keeps the
  text-first fallback). The popup renders through a portal into the `AdaptiveContextDialog`
  overlay family — a bottom sheet below `768px`, a side panel at `768px+`, sized to its
  **own content** — not `absolute inset-0` over the image's box. Stacked oracle/detail
  under the image is not the default density path. This is one shared component across all
  six card surfaces (Quick Question card search, In-Depth Enrichment, the card inside View
  Context, the In-Depth zone selected-card/add preview, the In-Depth zone strip, and Scan
  review). (DEC-151, DEC-158, REQ-128)
- Built: the shared `CardPresentation` renders only a small **Remove card** control beside
  the image; every other field it once showed lives in the corner popup. Its image sizes
  **relative to its container** (not a fixed pixel cap), so each surface grows to what its
  own layout affords — the shell-column surfaces to a legibility floor (~300px at 390×844,
  growing at desktop) while the zone strip's `w-40`/160px tile keeps its width with a
  ~144px image. REQ-129's no-page-scroll and first-viewport criteria are the binding
  ceiling; where container sizing would violate them, the hosting screen's
  `screen-layout.md` row records a bounded cap — never a component fork or size prop.
  (DEC-156, DEC-160, DEC-151, REQ-141)
- Built: every overlay close control — View Context, the history drawer, the card popup,
  the feedback modal, and Life Tracker's counter and game-setup panels — renders through
  **one shared component** whose color derives from the active theme palette, replacing the
  copy-pasted zinc chrome and the former text "Close" buttons, at or above the 44px touch
  floor. (DEC-159, DEC-156, REQ-142)

## Shared layout language

This is the size-and-containment language every screen row across the suite is
measured against. It is authoritative for layout **direction** under DEC-149 /
REQ-126; binding presentation DECs still own their specifics, and this language
does not override them. The catalog home is `PRD/sections/screen-layout.md`.

- **Viewport bands.** Product intent uses CSS viewport width, not device
  detection: phone `< 768px`, tablet `768–1023px`, desktop `≥ 1024px`. Fluid
  interpolation inside a band; hard switches reserved for non-interpolating
  structure (the `768px` context sheet-vs-drawer boundary). (DEC-149, DEC-117,
  DEC-118)
- **Hybrid % model.** Outer shell width sizes as a % of the viewport with rem/`min()`
  caps so ultra-wide screens produce no content-less bands; inner panels/workspaces
  size as a % of the shell, not a second grab at the full viewport. Phone shell ≈ 100%
  of viewport width (minus page padding); tablet/desktop shell ≈ 92%, capped at
  `min(48rem, 92vw)`. Prose-dominant regions keep a maximum reading measure inside the
  shell. Height is content-sized for staged/pre-submit steps — the shell is not
  stretched to absorb lower dead space; vertical fill applies only where a screen row
  cites it (answered workspace, Life Tracker one-screen table, scan camera chrome).
  (DEC-145, REQ-124, DEC-149)
- **Fit rule (default).** No document/page scroll for primary UI — chrome plus the
  screen's primary controls fit the first viewport. Long content scrolls inside a
  bounded region (chat thread, history list, zone grid, overlay body); nested region
  scroll is allowed, a second page-length scroll beneath stranded controls is not.
  Exceptions must be explicit on the screen row. (DEC-149)
- **Anti-overcalibration.** "Fill available space" means the shell or named region,
  not chrome-to-chrome unless the row says full-bleed. Do not stretch a control or
  column across unused viewport just because width is available; prefer tuning a row's
  % / cap over inventing a one-off full-bleed layout mid-bugfix. (DEC-149)

## Measured bounds

Bounds travel with a surface only while that surface still exists in code.
Pixel/rem figures here are the current shipped configuration, outcome-validated,
not product truth.

- Suite shell width: phone ≈ 100% viewport (minus page padding); desktop
  `min(48rem, 92vw)` — 768px at a 1440px viewport (was 670px under the former `42rem`
  column), and the cap still binds on ultra-wide displays. (DEC-145, REQ-124,
  `screen-layout.md`)
- Single-zone Menu rail (Life Tracker, Trade Balancer): interactive box `5.5rem × 3.5rem`;
  gradient paints at `5.5rem × 10.5rem` as `pointer-events: none` decoration, so the
  variant's appearance is byte-for-byte unchanged. (DEC-137, REQ-114)
- Split Menu+History rail (In-Depth, Quick Question): two zones side-by-side, each
  `2.75rem × 2.75rem`, in one `2.75rem` band — required because only 70px exists between
  the rail top and the step eyebrow while two stacked 44px zones need 88px. (DEC-137)
- Menu tray: full height of the visible shell side; opaque across its painted bounds;
  painted content does not overflow the shell/viewport bottom. Theme orbs on one row.
  (DEC-133, DEC-147, REQ-113, REQ-122, REQ-131)
- History drawer width: phone `min(22rem, 88vw)`; desktop `min(30rem, 90vw)`; left-edge
  full-height at every viewport, no `max-height` cap. Completed-history retention: 20
  entries, oldest pruned; plus at most one Draft row per destination (not counted toward
  the 20). (DEC-134, DEC-124, DEC-130)
- View Context overlay: phone bottom sheet caps so a dismissible scrim of **≥25% of
  viewport height** remains at 390×844 — i.e. ≤`75dvh`, tightening the shipped
  `min(85dvh, 48rem)`; desktop right drawer within workspace rules. The frozen card inside
  sizes to the sheet's own content column and never consumes the ≥25% scrim floor. (REQ-135,
  DEC-118, DEC-160, DEC-142)
- Answered-workspace top clearance: shared `--layout-surface-gap` — measured 8px at 390×844
  and 16px at 1440×900, with the rail's bottom 12px / 32px above View Context and no overlap;
  the retired `calc(2.75rem - var(--layout-panel-padding))` rail-sized constant must not be
  reintroduced. Auto-scroll near-bottom threshold: remaining distance ≤ 64px. (DEC-141,
  REQ-116, DEC-118, `screen-layout.md`)
- Card detail popup: bottom sheet below `768px` / side panel at `768px+`, content-sized,
  close control laid out inside its own bounds at every width. Superseded geometry:
  `absolute inset-0` over the image, measured **92×128px holding 356px of content** with its
  44px close X overflowing its container by 37px. (DEC-158, DEC-151, REQ-128)
- Shared card image (all six surfaces): container-relative, aspect-preserved, uncropped —
  no `max-h-32` pixel cap; shell-column surfaces render ~300px at 390×844 (REQ-141's
  legibility floor) and grow at desktop, while the zone strip tile stays `w-40`/160px with a
  ~144px image. REQ-129's no-page-scroll/first-viewport criteria bind first; a violated surface
  records a bounded cap on its own catalog row. (DEC-160, REQ-141)
- Mock-mode banner: full-viewport-width strip; content offset so it never covers a header on
  the standard `PageShell` path. **Known gap (REQ-123):** full-bleed destinations (Life Tracker,
  Trade Balancer) measured header controls covered and more than one banner node mounted. (DEC-085,
  REQ-123)
- Routing: flat top-level paths `/quick-lookup`, `/in-depth`, `/life-tracker`, `/trade-balancer`;
  deep links resolve (CloudFront maps 403/404 → `/index.html` 200); the Suspense fallback appears at
  most once per destination per session (keep-alive mounting). (DEC-157, REQ-140, NFR-014)
- Touch targets stay ≥ 44px and body/supporting text does not shrink below the `text-sm`/`text-xs`
  floor across all chrome (NFR-001, DEC-117).

## Rejected alternatives and deferred scope

- **Top-middle Menu tab with a widen-and-glow prominence pass — closed door.** The Menu began
  as a centered header tab (DEC-095/DEC-109); DEC-121 approved a thicker-border/medium-glow ~25%
  widen that was never implemented. DEC-122 pivoted the whole trigger to a top-left corner rail
  with a sliding drawer and a different visual language (radial fade, no border), so none of the
  tab's width/border/glow treatment carries forward. This bound no longer attaches to any surface.
  (DEC-122, DEC-121)
- **Partial-height floating Menu drawer — closed door.** DEC-122's partial-height drawer read as
  a hard bottom cutoff; DEC-133 made the open Menu a full-height left tray of the outer shell,
  sized to the visible shell side on tall pages, with matching corner radii. (DEC-133)
- **Stacked Menu-over-History rail zones with a fluid `clamp()` height — closed door.** DEC-126's
  stacked two-zone rail could not satisfy both the 44px touch floor and eyebrow clearance in the 70px
  available; DEC-137 moved the zones side-by-side in a fixed `2.75rem` band, retiring the clamp.
  (DEC-137, DEC-126)
- **Rail chrome whose interactive box exceeds its paint — closed door.** The rail's invisible
  gradient remainder intercepted destination taps (on Life Tracker, a life-adjust tap opened the
  Menu mid-game). DEC-137 capped the interactive box to the painted affordance and made hit-testing
  the compliance check. (DEC-137)
- **Menu trigger staying interactive as the open-state close control — closed door.** DEC-140 first
  kept the trigger interactive to close; DEC-150 hides the rail icons while the tray is open and makes
  outside-click / Escape the close path, retiring DEC-147's trigger∩row intersection proxy. (DEC-150,
  DEC-140, DEC-147)
- **`sessionStorage` as the source of truth for the active destination / no URL routing — closed
  door.** DEC-111 deliberately chose `sessionStorage` over routing; DEC-157 introduced flat
  `react-router` routes and made the URL authoritative, demoting `sessionStorage` to the bare-`/`
  fallback. `<Routes>`-style unmounting was rejected because it would break in-session state
  preservation — the library supplies location/history only. (DEC-157, DEC-111)
- **A single Suspense boundary around the outlet — closed door.** One boundary would suspend and
  blank already-loaded siblings; each destination gets its own per-destination boundary inside the
  keep-alive outlet. (DEC-157)
- **Standalone floating top-right theme control and a user density preference — closed door.** DEC-110
  folded palette selection into the Menu's Theme section; DEC-117 replaced the Desktop/Mobile density
  preference with automatic fluid responsive presentation and retired its storage/plumbing. No layout/
  profile control remains. (DEC-110, DEC-117, REQ-089, REQ-096)
- **Full-width in-body history trigger; per-flow answered-state assemblies — closed door.** DEC-125's
  full-width workspace-body history trigger was superseded by DEC-126's corner-rail History zone; the
  two ask flows share one `ConversationWorkspace` (DEC-118) rather than separate answered layouts.
  (DEC-126, DEC-125, DEC-118)
- **A bordered-panel chat thread capped at `max-h-96`; a fixed-viewport composer — closed door.**
  DEC-127 made the thread fill the workspace with a docked pill composer and stronger turn contrast;
  DEC-131 handled short-thread fill and Start Over reachability. (DEC-127, DEC-131)
- **Card detail popup bound to the image's box (`absolute inset-0`) — closed door.** The 92×128px popup
  overflowed its content 2.8× with an unusable close X; DEC-158 freed it into the overlay family, sized
  to its own content. (DEC-158, DEC-151)
- **A fixed `max-h-32` pixel cap on the shared card image — closed door.** It produced an identical
  92×128px render at every width and surface; DEC-160 replaced it with container-relative sizing so each
  surface grows to what its container affords. (DEC-160, DEC-151)
- **Deferred / out of scope for this view:** deep-linkable in-flow state (staged context and conversation
  are deliberately not serialized into the URL — a privacy surface of its own, DEC-157); nested/parameterized
  routes and search-param state; cross-device sync, accounts, or server-side storage for history/Draft; a
  multi-draft backlog; a shared drawer-primitive/icon-button component extraction (left as future code-health).
- **Per-feature surfaces that stay with their own specs — not owned here:** In-Depth Question's roster
  secondary-details disclosure and its containment (DEC-120 / DEC-128 / REQ-100 / REQ-106), its staged-step
  eyebrow content (REQ-045), its zone-collection add-action reachability (REQ-125), and DEC-156's clause 3
  bounded poison/energy/experience dropdowns are In-Depth Game Context concerns; the Send-feedback modal
  (DEC-104/DEC-105, FLOW-014) is owned by `user-feedback/`. This spec cites the chrome those features mount
  into, not their per-screen bodies.

## Where it lives

The portal chrome lives under `apps/frontend/src/components/portal/`
(`FeaturePortalMenu.tsx`, `ThemeSection.tsx`, `PortalSlot.tsx`, `ShellBounds.tsx`,
`DestinationOutlet.tsx`, `destinationRegistry.tsx`) with `apps/frontend/src/components/PageShell.tsx`,
`apps/frontend/src/hooks/useActiveDestination.ts`, and `apps/frontend/src/lib/portal/`
(`types.ts`, `slotContext.tsx`, `activeDestinationPrefs.ts`, `leftEdgeDrawerContext.tsx`);
header/eyebrow chrome in `apps/frontend/src/components/{StagedStepHeader,StepEyebrow,BrandMark}.tsx`
and the shell wiring in `apps/frontend/src/App.tsx`. The mock banner is
`apps/frontend/src/components/MockModeBanner.tsx` (mount + offset in `PageShell`,
resolver in `apps/frontend/src/lib/env.ts`, define bridge in `apps/frontend/vite.config.ts`).
The shared conversation chrome lives in
`apps/frontend/src/components/{ConversationWorkspace,ConversationThread,ConversationHistoryDrawer,AdaptiveContextDialog,FrozenGameContextDetails,FollowUpComposer,ComposerSubmitButton,CardSelectionPreview}.tsx`,
`apps/frontend/src/hooks/{useAskAiSubmitOrchestration,useAutoGrowTextarea}.ts`, and
`apps/frontend/src/lib/conversationHistory/persistence.ts`; the shared card presentation
and detail popup in `apps/frontend/src/components/` (`CardPresentation`, `CardDetailPopup`),
and the one shared overlay close control adopted across those overlays plus
`FeedbackModal.tsx` and Life Tracker's `CounterPanel`/`GameSetupModal`. Routing is
`react-router` in `App.tsx` with `manualChunks` in `apps/frontend/vite.config.ts`; the
shared CSS (`.portal-menu-rail`, drawer, `.page-shell-bleed`, `.portal-shell-bounds`,
`.step-eyebrow`, `.mock-mode-banner`, `--layout-surface-gap`) is in
`apps/frontend/src/index.css`. See `PRD/sections/system-map.md`'s
`## Feature portal (app navigation)`, `## Follow-up chat`, and `## Mock-mode banner`
blocks for the full file lists, and `PRD/sections/screen-layout.md`'s
`## Shared layout language` and `### Shared chrome` rows for the layout bands.
