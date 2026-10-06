# Shared Chrome — current-state feature spec

- Status: current-state feature spec — precedence #1 and Read-First #1 for what
  this feature does today. Decision bodies are retired: `PRD/sections/decisions.md`
  is now precedence #2, a historical index that resolves a cited `DEC` ID to a
  one-line summary, no longer an override. The cited `REQ`/`FLOW`/`NFR` remain the
  granular backing; keep this file correct in step with them as behavior changes,
  editing in place — never by recording a new decision.
- Backed by: DEC-078, DEC-079, DEC-081, DEC-085, DEC-095, DEC-104, DEC-109,
  DEC-110, DEC-111, DEC-117, DEC-118, DEC-119, DEC-121, DEC-122, DEC-123,
  DEC-124, DEC-125, DEC-126, DEC-127, DEC-129, DEC-130, DEC-131, DEC-133,
  DEC-134, DEC-135, DEC-137, DEC-138, DEC-140, DEC-141, DEC-142, DEC-143,
  DEC-144, DEC-145, DEC-146, DEC-147, DEC-148, DEC-149, DEC-150, DEC-151,
  DEC-152, DEC-153, DEC-156, DEC-157, DEC-158, DEC-159, DEC-160, REQ-058,
  REQ-059, REQ-060, REQ-067, REQ-089, REQ-090, REQ-096, REQ-099, REQ-113,
  REQ-114, REQ-115, REQ-116, REQ-117, REQ-118, REQ-119, REQ-122, REQ-123,
  REQ-124, REQ-126, REQ-127, REQ-128, REQ-131, REQ-135, REQ-140, REQ-141,
  REQ-142, FLOW-010, FLOW-016, FLOW-017, FLOW-018, NFR-001, NFR-006, NFR-011,
  NFR-014

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

- Built: the suite's single navigation affordance is the **☰ Menu button** at the
  left of a banner header flush with the top edge of the screen (outside the page
  padding) — at least 44px, about a quarter larger than the former
  corner rail on a phone and a third on desktop — with the brand centred (a
  breathing orb with the colour's badge, the wordmark, "MTG Assistant") on a lit
  band carrying a hairline of the colour's light and the profile's own element.
  Selecting ☰ opens the Menu tray, which slides in from the left: full height of
  the visible shell side below `768px`, a floating inset rounded card sized to its
  content at `768px`+. The step-name text renders as an in-flow eyebrow above each
  step's own content, not in header chrome. (REQ-207, DEC-109, DEC-133)
- Built: the tray lists **Ask a Question, Question History, Life Tracker, Trade
  Balancer** — then the **Send feedback** action entry (which opens the feedback
  modal without switching the active destination), then the palette-only Theme
  band. Ask a Question is `quick-lookup`'s Menu label and reads current while
  `in-depth` is open too, since `in-depth` has no row of its own (REQ-206);
  Question History is a fixed row, not a registry entry, opening the active
  destination's own history trigger (REQ-213). Rows render full-bleed, separated
  by rules that meet the tray's left wall; the active entry keeps a check mark and
  quiet fill. The no-stored-preference default is still `quick-lookup`. (REQ-067,
  REQ-206, REQ-213, DEC-135, DEC-104, DEC-095)
- Built: the browser tab itself carries personality and stays synced to the active
  colour profile. The app ships a favicon carrying TheJudge's own mark with the
  active profile's element (reusing the REQ-201 motif / REQ-207 brand art, local
  static art, no CDN), drawn in the active profile's accent in place of the
  browser's default blank icon; the document title on the tab is a single branded
  string with a touch of personality rather than a bare placeholder; and a
  `theme-color` meta tints the mobile browser bar to the active accent. All of it
  updates through the single theme apply point (`applyPalette`) on mount and on
  every profile change, so switching Theme re-skins the tab (including a custom
  Colorless colour, REQ-099) with no page reload; all tab colour derives from the
  one token source with no hard-coded per-profile hex (REQ-216), and there is no
  web app manifest or animated icon. (REQ-219, REQ-200, REQ-201, REQ-207, REQ-216,
  REQ-099)
- Built: below `768px` the tray fills the visible shell side (viewport ∩ shell on
  tall scrollable pages), with matching top- and bottom-left shell radii; at
  `768px`+ it is a floating card inset from the viewport edges, rounded, sized to
  its content. Either way it is opaque across its full painted bounds — no
  destination text, control, or artwork remains legible through it — its painted
  content does not overflow the shell/viewport bottom, and its lower space carries
  the colour's scene at a whisper. (DEC-133, DEC-147, REQ-113, REQ-122, REQ-207)
- Built: every destination — including the two conversation-bearing ones, In-Depth
  Question and Quick Question — carries the same single ☰ trigger; the former
  split Menu + History band is retired (REQ-213: History is a Menu row, not a
  second rail zone). Suite chrome's interactive box may not extend past the
  affordance it paints: the ☰ button's interactive box equals its painted bounds,
  at least 44px, with the banner's decorative band and element art
  `pointer-events: none`; compliance is verified by hit-testing, not by eye.
  (REQ-114, REQ-207, REQ-213)
- Built: while the tray is open, the ☰ trigger is covered and not hit-testable
  (`aria-hidden`, `tabIndex={-1}`, `visibility: hidden`, `pointer-events: none`).
  The tray closes on its ✕, an outside click, or Escape; choosing Question History
  closes the tray before its sheet opens. (DEC-150, DEC-140, DEC-147, REQ-115,
  REQ-127, REQ-122, REQ-213)
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
- Built: the Theme section is one segmented band the tray's width, six equal cells
  (never narrower than 40px), sliding with an arrow at each end when six no longer
  fit; it takes a normal inset rather than the rail-clearing row inset. (REQ-131,
  REQ-207, DEC-135)
- Built: the catalog is six globally shared MTG-color profiles, ordered **White,
  Blue, Black, Red, Green, Colorless**, with Blue the default; each supplies curated
  `accent` / `accent-strong` / `accent-soft` / `accent-contrast` values through the
  existing four-token contract, and each Theme cell's light shows that profile's
  `accent-soft` value. Colorless alone exposes an inline full-spectrum custom-color
  input plus **Reset to gray**: a chosen custom RGB is applied to `accent` /
  `accent-strong` / `accent-soft` unchanged, with no contrast validation or
  correction, and it persists independently of the fixed catalog, surviving switches
  to other profiles and back. Loading a retired or otherwise unsupported stored
  palette ID (the former Violet/Emerald/Amber/Rose catalog) deletes that stored
  value and falls back to Blue. (DEC-119, REQ-099)
- Built: an unchosen cell is a faint wash of its colour with its symbol in the
  colour's light; the chosen cell is filled with the colour's light, the symbol
  dark on it, with a small glow; no colour names or blurb (hover titles and
  accessible names carry them). When Colorless is selected, its custom-color input
  and Reset control render **centered underneath** the band, wrapping cleanly.
  (DEC-152, REQ-131, REQ-207)

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
- Built: the follow-up composer/workspace carries the same restrained
  ambient-accent treatment as the context trigger — a low-intensity accent at rest,
  strengthened on hover/`focus-visible`, sustained while current — reusing the
  existing four palette tokens with no new token roles. (DEC-081, REQ-060)
- Built: the answered-workspace top clearance for View Context matches the
  **post-DEC-137 side-by-side rail footprint**: the corner rail participates in
  layout (`position: relative`) so the header owns its 44px band, and the shared
  `--layout-surface-gap` owns the spacing — no rail-sized compensating constant.
  History↔View Context non-overlap still holds. (DEC-141, REQ-116, DEC-129)

### Question History (REQ-213 — superseded the per-flow history drawer)

- Built: any conversation that reaches at least one successful answer auto-saves to
  a browser-local, single-device history list, capped at the **20 most recent**
  completed entries across both question kinds (a 21st prunes the oldest). Each entry
  stores flow/mode, the frozen context snapshot (`GameContext` or attached cards), the
  full message thread, and a created/updated timestamp; reads are guarded try/catch
  with corrupt entries dropped. (DEC-124, FLOW-016, DEC-103-precedent)
- Built: Question History is a Menu row directly under Ask a Question, opened on the
  shared sheet (REQ-208), always present on every destination — including empty
  history, every pre-submit step, and immediately after Start Over — and must not
  overlap View Context. There is no separate History rail zone; choosing the row
  closes the Menu tray first, so the two never overlap. The sheet lists saved
  conversations of **both kinds in one list**, most-recent-first, each row showing a
  small fan of the conversation's cards, the question, the ruling's first line, and a
  meta line (kind, cards, the game context for In-depth, follow-ups, when). (DEC-126,
  DEC-129, DEC-134, REQ-208, REQ-213, FLOW-016)
- Built: below `600px` a tap on a row closes the sheet and reopens that conversation
  live in its own flow immediately — the one the entry belongs to, switching
  destination first when it is the other one. From `600px` the sheet is two panes: the
  list (a tap only selects) and the selected conversation read in full, with **Open
  conversation** (the same live reopen) and **Delete this question** at its foot. An
  Ask a Question conversation reopens on the Ask a Question page with its cards in the
  strip, the thread, and "Reopened from your history" under the title; an In-depth
  conversation reopens in In-depth details' chat with View Context available, flow
  advanced to the station that hosts it. (REQ-213, FLOW-016)
- Built: each flow keeps exactly one browser-local **Draft** slot snapshotting
  mid-flight staging (typed question, optional cards, staged game/zones/enrichment,
  current step) so Menu navigation, reload, or opening a saved conversation do not
  wipe pre-submit work. Question History lists each flow's Draft as its own row above
  the saved conversations; selecting it restores that flow's staged state (switching
  destination first when needed) and does not count toward the 20-entry cap. Draft
  auto-hydrates the mid-flight UI on destination mount (reload or Menu return), and
  also on an explicit Draft-row select while that destination is already active — a
  mount-only effect would miss the latter. Opening a saved conversation from mid-flight
  staging silently snapshots Draft first, in either flow. (DEC-130, DEC-138, FLOW-017,
  REQ-213)
- Built: each completed row — the row's own delete control below `600px`, or **Delete
  this question** in the reading pane from `600px` — asks first through the shared
  confirm sheet (REQ-208) before removing the entry; deleting the active completed
  conversation clears its own flow's workspace to its clean pre-answer state without
  re-saving the deleted thread, even when Question History deleted it from a different
  flow than the one currently open. The prune-at-20 cap is preserved; Draft rows are
  not deletable via this control. (DEC-143, REQ-118, REQ-208, FLOW-018, REQ-213)

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
- Built: View Context, Question History, and the Menu tray all dismiss on
  outside/scrim click in addition to Close and Escape, without closing on clicks inside
  the panel surface — one shared outside-click implementation across the overlay family.
  (DEC-142, REQ-117, REQ-135, REQ-213)
- Built: opening View Context on a resumed lookup card never white-screens the app —
  `CardSelectionPreview` tolerates missing/undefined `colors` / `supertypes` /
  `subtypes` and other optional fields, falling back to N/A-style empty handling instead
  of throwing; persistence prefers storing the full `CardMetadataItem` shape used at
  submit time. (DEC-144, REQ-119)
- Built: the View Context trigger and the open context sheet/drawer carry the
  restrained ambient-accent layer from the selected theme palette — a low-intensity
  palette accent at rest, a strengthened accent on hover/`focus-visible`, and a
  sustained-but-still-restrained treatment while open (current state). Touch and
  keyboard users get the same active/focus/current feedback; hover is never the
  sole carrier of state. Reuses the existing four palette tokens with no new token
  roles and no palette-tinted page background; static surrounding chrome stays
  neutral. (DEC-081, REQ-060)

### Card detail popup (suite-wide) and the shared close control

- Built: whenever a card image is shown anywhere in the suite, a compact corner control
  (top-right of the image) opens a **dismissible detail box** carrying oracle text and
  other descriptive fields fetched on demand by oracle id (REQ-175, FLOW-024) behind a
  brief loading state; a missing image keeps the name-first fallback, which shows the card
  name only (FLOW-001). The box renders in the shared sheet (REQ-208) — a bottom sheet
  below `600px`, a floating card centred in the viewport from `600px` up — sized to its
  **own content**, not `absolute inset-0` over the image's box. Stacked oracle/detail
  under the image is not the default density path. This is one shared component across all
  six card surfaces (Quick Question card search, In-Depth Enrichment, the card inside View
  Context, the In-Depth zone selected-card/add preview, the In-Depth zone strip, and Scan
  review). (DEC-151, DEC-158, REQ-128, REQ-208)
- Built: the shared `CardPresentation` renders only a small **Remove card** control beside
  the image; every other field it once showed lives in the corner popup. Its image sizes
  **relative to its container** (not a fixed pixel cap), so each surface grows to what its
  own layout affords — the shell-column surfaces to a legibility floor (~300px at 390×844,
  growing at desktop) while the zone strip's `w-40`/160px tile keeps its width with a
  ~144px image. REQ-129's no-page-scroll and first-viewport criteria are the binding
  ceiling; where container sizing would violate them, the hosting screen's
  `screen-layout.md` row records a bounded cap — never a component fork or size prop.
  (DEC-156, DEC-160, DEC-151, REQ-141)
- Built: every image-bearing or metadata card container on those six shared
  surfaces also carries a restrained, thin identity ring derived from the card's
  existing `colors`: one WUBRG hue for a monocolor card, a stable WUBRG-ordered
  gradient for multicolor, and a cool light silver-gray ring when colors are empty,
  missing, or unrecognized. The ring is decorative and independent of the active
  theme palette — it does not tint the container background, add a glow or
  animation, or stand in as the sole identity cue — and applies equally when the
  name-only fallback (the locally available card name, shown with no detail fetch
  on image failure) replaces a missing image. (DEC-078, REQ-058)
- Built: every overlay close control — View Context, the history drawer, the card popup,
  the feedback modal, and Life Tracker's counter and game-setup panels — renders through
  **one shared component** whose color derives from the active theme palette, replacing the
  copy-pasted zinc chrome and the former text "Close" buttons, at or above the 44px touch
  floor. (DEC-159, DEC-156, REQ-142)

### The shared sheet

- Built: one `SheetShell` component — a bottom sheet below `600px`, a floating card
  centred in the viewport from `600px` up (fading up into place), with a fixed head
  and foot and only the body scrolling; it traps focus, closes on ✕, Escape and
  outside tap, and restores focus. The card-detail box and Send feedback already
  host on it (REQ-128, REQ-087); Question History and Trade Balancer's printing
  picker host on it when those slices build (REQ-213, REQ-065). A shared
  `ConfirmSheet`, built on `SheetShell`, asks before a destructive action with a
  plain question, one clearing line, a keep action and a clear action, and is
  rendered only by a caller that has something to clear; Trade Balancer's New trade
  and Life Tracker's Reset/New game wire it up when those slices build. View
  Context keeps its own `768px` sheet/drawer. (REQ-208, REQ-128, REQ-087)

### Decorative motion baseline

- Built: shared chrome draws on the app-wide, CSS-only decorative-motion baseline —
  hover/press/focus micro-interactions, eased entrance/exit transitions, and
  add/remove/success/error state-change cues, rather than only basic show/hide. The
  Menu tray's slide-in, the overlay family's open/dismiss transitions, and the
  history-drawer and card-popup close controls all draw on this baseline. No
  animation library or framework is introduced; motion stays
  transform/opacity-driven for mobile performance and honors
  `prefers-reduced-motion` — no decorative motion is required to complete any flow.
  Functional wait-state motion (the ask-AI waiting panel, the inline follow-up
  spinner) predates this baseline and is unchanged by it. (DEC-079, REQ-059,
  NFR-006)
- Built: behind every page plays the chosen colour's **ambient scene** — two
  drifting haze sheets, a field of glowing dust, the colour's badge large, blurred
  and faint in the centre, and the colour's element (White beams, Blue runes, Black
  fog, Red embers, Green leaves, Colorless turning geometry) — drawn by one
  hand-written canvas renderer ported from the mockup (`AmbientScene`), one
  density and one opacity number per scene, one still frame under reduced
  motion, and at a whisper inside the Menu tray. Blue preserves its small floating
  invented runes; at desktop canvas widths (1024px+) its connected dust nodes
  form more frequent shifting constellations through an area-scaled connection
  range capped at 240px, with phone/tablet connections unchanged. One larger,
  quiet inscription at a time writes, holds and dissolves, cycling without
  consecutive repeats through ring (single/nested), triangle, diamond, hexagon,
  ellipse and overlapping loops. Their complete rotating envelopes stay in the
  wide side gutters or low on narrow canvases and in the tray; tray node
  connections remain disabled. The ground is one
  flat colour per profile from the REQ-200 token set; one typeface (Inter,
  self-hosted) serves titles and body; no surface carries corner decoration.
  (REQ-207, REQ-200, REQ-201, NFR-006)

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
- Menu trigger: the ☰ button at the banner's left, at least 44px, interactive box
  equal to its painted bounds; the banner's band and element art take no pointer
  events. Superseded geometry: the single-zone corner rail (`5.5rem × 3.5rem`
  interactive, gradient painted at `5.5rem × 10.5rem`). (REQ-114, REQ-207)
- Superseded geometry: the split Menu+History rail (In-Depth, Quick Question) —
  two zones side-by-side, each `2.75rem × 2.75rem`, in one `2.75rem` band. REQ-213
  retires it: History is a Menu row, not a second rail zone, so every destination
  carries the single ☰ trigger above. (DEC-137, REQ-114, REQ-213)
- Menu tray: below `768px` full height of the visible shell side; at `768px`+ a
  floating card sized to its content; opaque across its painted bounds; painted
  content does not overflow the shell/viewport bottom. Theme band cells ≥40px,
  sliding with arrows when six do not fit. (DEC-133, DEC-147, REQ-113, REQ-122,
  REQ-131, REQ-207)
- Question History: the shared sheet (REQ-208) — bottom sheet below `600px`, floating
  centred card with two panes from `600px` (the list, and the selected conversation read
  in full with Open conversation / Delete this question). Superseded geometry: a left-edge
  full-height drawer, phone `min(22rem, 88vw)` / desktop `min(30rem, 90vw)`, no
  `max-height` cap. Completed-history retention: 20 entries across both question kinds,
  oldest pruned; plus at most one Draft row per flow (not counted toward the 20). (DEC-124,
  DEC-130, DEC-134, REQ-208, REQ-213)
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
- Card detail popup: the shared sheet (REQ-208) — bottom sheet below `600px` / floating
  centred card from `600px`, content-sized, close control laid out inside its own bounds
  at every width. Superseded geometry: `absolute inset-0` over the image, measured
  **92×128px holding 356px of content** with its 44px close X overflowing its container by
  37px (DEC-158); the `768px` side panel is further superseded by REQ-208's `600px`
  centred card. (DEC-158, DEC-151, REQ-128, REQ-208)
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
and detail popup in `apps/frontend/src/components/CardPresentation.tsx` (which exports
both `CardPresentation` and the co-located `CardDetailPopup` component — not a separate
file), and the one shared overlay close control
(`apps/frontend/src/components/OverlayCloseButton.tsx`) adopted across those overlays
plus `apps/frontend/src/components/feedback/FeedbackModal.tsx` and Life Tracker's
`apps/frontend/src/components/portal/life-tracker/CounterPanel.tsx` and its
co-located `GameSetupModal` component (defined within `PlayerLifeTrackerApp.tsx` in
that same directory, not a separate file). Routing is
`react-router` in `App.tsx` with `manualChunks` in `apps/frontend/vite.config.ts`; the
shared CSS (`.portal-menu-rail`, drawer, `.page-shell-bleed`, `.portal-shell-bounds`,
`.step-eyebrow`, `.mock-mode-banner`, `--layout-surface-gap`) is in
`apps/frontend/src/index.css`. See `PRD/sections/system-map.md`'s
`## Feature portal (app navigation)`, `## Follow-up chat`, and `## Mock-mode banner`
blocks for the full file lists, and `PRD/sections/screen-layout.md`'s
`## Shared layout language` and `### Shared chrome` rows for the layout bands.
