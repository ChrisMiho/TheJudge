# Personalization decisions

Frontend-only user personalization behavior that changes app presentation without changing game context, API contracts, prompt assembly, or backend behavior.

### DEC-066
- Decision: Theme customization uses a global frontend-only palette control with predefined swatches and browser-local persistence.
- Status: confirmed
- Context: The app currently ships with a single fixed blue color theme. Users should be able to personalize the app's visual feel without introducing account preferences, arbitrary color input, or a larger settings system. A global control in the app chrome keeps the feature discoverable across the staged flow and answered state while preserving the lightweight core product loop.
- Impact:
  - frontend defines one authoritative set of named palette tokens, including the existing blue default
  - a compact global theme/settings affordance exposes palette swatches from the app chrome
  - selecting a palette applies immediately to primary accent surfaces and persists in browser-local storage
  - missing, corrupt, or unsupported stored values fall back to the default palette
  - no `AskAiRequest`, Zod schema, backend route, prompt assembly, provider, card metadata, or data-pipeline behavior changes
- Related requirements:
  - REQ-044
  - FLOW-007
  - NFR-011
- Notes:
  - approved approach: Option A, global theme control
  - placement superseded by DEC-110 (`decisions/navigation.md`): the picker no longer lives in its own corner control and is hosted inside the feature-portal Menu instead; the palette-token/persistence/fallback content on this page is otherwise unchanged
  - non-goals: arbitrary RGB/hex picker, per-component overrides, server-synced preferences, account settings, dark/light mode redesign

### DEC-067
- Decision: The staged data-collection screens present the active step name inline to the right of the `TheJudge` / `MTG Assistant` brand block in a single header row, rather than stacked below it as a standalone heading.
- Status: confirmed
- Context: Each staged step screen (game context, zone confirmation, zone collection, enrichment) previously rendered the step name as a separate heading below the brand block, consuming vertical space above the working area on small mobile screens. Promoting the step name into the brand header row tightens the chrome and keeps the active step legible at a glance without changing step names, ordering, or flow logic.
- Impact:
  - the brand block (`TheJudge` + `MTG Assistant` subtitle) stays the dominant element on the left; the step name aligns to the right of the same row, vertically centered and styled as a secondary label that is smaller than the brand title but clearly legible
  - applies to the four staged steps: game context, zone confirmation, zone collection, and enrichment
  - the enrichment screen's `View all cards` / `Card-by-card` view-mode toggle stays in its own row below the header; only the step name moves into the header row
  - on widths too narrow for a single row, the step name wraps/stacks under the brand block rather than clipping or truncating
  - the answered-state conversation header (`isConversationActive`) is unchanged: it remains a slim brand-only header with no step name
  - presentation only — no change to step names, step ordering, flow logic, `AskAiRequest`, Zod schemas, `GameContext`, prompt assembly, provider selection, backend routes, card metadata, or data-pipeline behavior
- Related requirements:
  - REQ-045
  - FLOW-001
- Notes:
  - approved approach: right-aligned secondary-weight step name, toggle kept below, graceful wrap on narrow screens
  - non-goals: renaming steps, changing step order or flow logic, restyling anything beyond the header layout, altering the answered-state header

### DEC-068
- Decision: The single-color palette personalization from DEC-066 is broadened in reach so one palette choice produces a coherent themed experience: remaining hardcoded primary-accent surfaces, the previously-fixed semantic green ("success/ready/lock") states, and the scanner UI all consume the existing palette tokens; the dominant page background is neutralized to slate rather than palette-tinted. This refines/extends DEC-066 and supersedes none of it.
- Status: confirmed
- Context: DEC-066 shipped a global palette control driving four accent tokens, but only a narrow set of "primary accent" surfaces consumed them, so a chosen color read as disconnected rather than as a coherent theme. Several dominant or meaning-bearing surfaces ignored the palette: the page background gradient was hardcoded to a blue end-stop (`…to-blue-950`) that fought non-blue palettes, success/ready/lock states were hardcoded emerald, and the optional scanner path used hardcoded sky/emerald. This decision broadens which surfaces respond to the existing one-color choice without introducing a larger theming model.
- Impact:
  - reuses the existing four palette tokens (`--accent` / `--accent-strong` / `--accent-soft` / `--accent-contrast`, exposed as Tailwind `accent` / `accent-strong` / `accent-soft` / `accent-contrast`); no new token roles are added, and palette definitions keep their single authoritative frontend source
  - broader reach is achieved by migrating hardcoded color sites onto those tokens (including via Tailwind alpha, e.g. `bg-accent/15`, `text-accent-soft`, `text-accent-contrast`), not by adding palette values
  - page background: the hardcoded `to-blue-950` gradient end-stop on the staged screens and answered view is neutralized to a slate tone so the backdrop stops biasing non-blue palettes; the background is NOT palette-tinted
  - semantic states: previously-fixed emerald "success / Ready to decrypt / Answer / scan-lock / add-to-stack confirm" affordances move onto the palette; where two accent-bearing elements are adjacent, visual hierarchy is preserved via `accent` vs `accent-soft`/`accent-strong` rather than two distinct hues
  - scanner: `ScanCameraSurface` (capture pill, reticle, lock/progress, thumbs-up confirmation) and `ScanReviewBubble` migrate from hardcoded sky/emerald to palette tokens
  - the selection control, persistence, fallback, and FLOW-007 mechanism are unchanged — only which surfaces respond changes; neutral slate chrome (cards, panels, borders) stays neutral by design
  - frontend-only — no change to `AskAiRequest`, Zod schemas, `GameContext`, prompt assembly, provider selection, backend routes, card metadata, scan-matching engine, or data-pipeline behavior
  - re-themed surfaces must preserve readable contrast and touch-friendly controls across every palette, including amber and rose
- Related requirements:
  - DEC-066
  - REQ-044
  - REQ-046
  - NFR-011
- Notes:
  - approved scope calls: background stays neutral (blue bias removed), semantic green states re-themed, scanner UI included in theme reach, existing token set reused
  - non-goals (unchanged from DEC-066): arbitrary RGB/hex picker, per-component overrides, server-synced preferences, account settings, dark/light mode redesign, palette-tinted backgrounds, new theming framework
  - placement superseded by DEC-110 (`decisions/navigation.md`): the picker's host moves from its own corner control into the feature-portal Menu; the broadened token-reach content on this page is otherwise unchanged
  - DEC-081 later narrows the "neutral slate chrome stays neutral" boundary: static chrome remains neutral, while only the closed surface inventory in REQ-060 may use restrained palette-derived borders, glows, and icon accents

### DEC-075
- Superseded by DEC-117.

### DEC-076
- Decision: The staged data-collection flow receives a presentation-only compaction pass across game context, zone collection, enrichment list mode, and scan-focused zone-collection chrome. Zone confirmation is excluded from screen-specific control compaction; DEC-117 may still apply the automatic responsive shell around it.
- Status: confirmed
- Context: Routine setup work forces document scroll on desktop and mobile because screens stack generous padding, unbounded lists, and redundant chrome — especially enrichment list mode, zone collection with scan open, and game context (hero image, duplicate panels). This pass reduces vertical space without changing flow logic or payloads.
- Impact:
  - **game context:** cat-wizard hero hidden by default; revealed after 10 clicks on the `TheJudge` brand title during the game-context step only, session-only with no localStorage and no hint; turn phase and active player merged into one panel (`grid-cols-1 sm:grid-cols-2`); combat sub-step remains full-width below when phase is `combat`; `(recommended)` removed from active-player labeling; wider expand/collapse and add/remove player buttons
  - **zone collection:** card list becomes a 2-column tile grid showing at most 4 cards (2×2) before internal scroll, including stack; remove buttons and stack-position labels preserved
  - **zone collection chrome:** remove the empty-state `Select a suggestion to preview and add a card to …` placeholder; search and suggestions are sufficient affordance
  - **scan focus:** while scan is open, hide search input, scan entry button, zone card list, owner select, card preview, and outer staged-flow navigation/action buttons outside the camera surface; remove the `Scan card` heading; place **Exit scan** at the camera top-right; keep the scan-local **Capture** button and other scan-local controls available; offset the scan review bubble so controls do not overlap; remove the low-confidence "Use manual search" escalation prompt — manual search is reached via **Exit scan** while the camera is open (DEC-050); manual tap-to-capture on the scan screen is unchanged (DEC-052)
  - **enrichment:** in **View all cards** mode only, each zone's card list caps at 4 visible full-width edit rows with internal scroll; card-by-card wizard mode unchanged
  - **zone confirmation:** no screen-specific control compaction; DEC-117/REQ-096 may apply automatic shell spacing while its control layout and flow behavior remain unchanged
  - presentation only — no change to step names, step ordering, flow logic, `AskAiRequest`, Zod schemas, `GameContext`, prompt assembly, provider selection, backend routes, card metadata, scan matching/stabilizer logic, or data-pipeline behavior
- Related requirements:
  - REQ-056
  - FLOW-001
  - FLOW-002
  - FLOW-006
  - DEC-067
  - DEC-050
  - DEC-052
  - DEC-117
  - REQ-096
- Notes:
  - scroll caps (4 zone tiles, 4 enrichment rows per zone) apply across automatic responsive widths
  - non-goals: viewport locking, sticky footers, `dvh` page-shell redesign, changing zone-confirmation control structure, or scan-engine changes

### DEC-078
- Decision: Card presentation in zone collection, expanded scan review, and enrichment is image-first and responsive. An available card image is centered at **80% of its card container width**, preserves the source card's intrinsic aspect ratio, and shows the complete image without cropping. Image mode hides duplicated card identity labels; an accessible three-dot control swaps the image for every available locally carried metadata field and back again. When an image URL is absent or the image fails to load, including offline, the same readable metadata panel appears directly and expands to the available card container width. Remove and workflow-specific controls remain visible. Every image-bearing or metadata card container also uses a restrained thin ring derived from the existing card `colors`: one identity color, a stable WUBRG-ordered multicolor gradient, or cool light silver-gray when colors are empty, missing, or unrecognized.
- Status: confirmed
- Context: The existing 56px zone/scan thumbnails and 64px enrichment thumbnails were too small to make the specific printing art legible. Initial implementation at a fixed 96px still left printed cards unreadable and duplicated labels crowded the surfaces. Responsive manual review established an image-first layout at 80% of each container as the usable balance across narrow and desktop widths. Existing `colors` metadata adds a light identity cue without adding true color-identity data or changing any product contract.
- Impact:
  - applies to card images in `ZoneCardPicker` card tiles, expanded `ScanReviewBubble` entries, and `EnrichmentStep` card rows
  - all three surfaces use the same centered 80%-of-container image width rather than fixed or surface-specific thumbnail sizes
  - images preserve intrinsic card aspect ratio and use uncropped rendering so the complete printing remains visible
  - image mode omits duplicated name, owner/zone, and oracle labels; the printed card remains the primary identity presentation
  - an accessible three-dot metadata control replaces an available image with every locally carried field that is present—name, mana cost, mana value, type line, oracle text, colors, supertypes, and subtypes—and toggles back to the image
  - a missing or failed image never renders a broken-image icon or reserves an empty image gap; it enters the same metadata presentation directly
  - metadata expands to the available width of its zone tile, scan-review entry, or enrichment header
  - Remove, stack position where applicable, enrichment fields, and other workflow controls remain rendered and usable
  - **zone collection:** preserve the two-column grid and bottom-to-top stack ordering; center the responsive image; keep the grid as the internal scroll owner within a viewport-relative cap
  - **scan review:** use a 320px panel with a viewport-safe width cap; each entry uses the shared responsive presentation and Remove control; long sessions scroll inside the panel before it exceeds the camera viewport
  - **enrichment:** use the shared responsive presentation in both **View all cards** and **Card-by-card** modes; keep enrichment fields full-width below
  - the complete card container—not only the image—uses a thin, low-opacity ring; the same boundary applies when the image is replaced by the text-first fallback
  - white, blue, black, red, and green map to warm ivory, blue, muted violet-charcoal, red, and green; multicolor cards use a stable WUBRG-ordered gradient containing their present colors
  - empty, missing, or unrecognized colors use a cool light silver-gray ring that remains visually distinct from the warm ivory used for white cards
  - identity rings are decorative and independent from the active app theme; they do not replace the card name/text, tint the container background, add a glow or animation, or become the sole card-identity cue
  - responsive image sizing, metadata-toggle/error handling, color mapping, and ring treatment are defined once and reused by all three surfaces
  - `CardSelectionPreview` is unchanged
  - presentation only — no image caching, connectivity detection, explicit image retry, runtime metadata refresh, or change to card identity, printing-image selection, `ZoneCardItem`, `CardMetadataItem`, `AskAiRequest`, Zod schemas, `GameContext`, prompt assembly, provider selection, backend routes, scan matching/stabilizer logic, or data-pipeline behavior
- Related requirements:
  - REQ-058
  - REQ-008
  - REQ-048
  - DEC-018
  - DEC-070
  - DEC-076
  - FLOW-001
  - FLOW-002
  - FLOW-006
- Notes:
  - responsive card heights use viewport-relative internal scroll caps in zone collection and enrichment
  - fallback content renders only fields already present on the card; absent optional metadata does not produce invented values or require a fetch
  - this uses the existing `colors` array, not true MTG color identity; adding a `colorIdentity` field is out of scope
  - card colors use stable semantic presentation constants rather than the user-selectable palette tokens

### DEC-081
- Decision: The selected theme palette extends into a restrained ambient accent layer across the four staged screens and the answered/conversation view. Only the closed minimum surface inventory in REQ-060 shows a low-intensity palette accent at rest, strengthens that accent on hover/focus where interactive, and retains a stronger restrained treatment while selected or current. Static chrome stays neutral. In the answered view, DEC-118 replaces the former inline frozen-context disclosure surface with the context trigger plus its adaptive sheet/drawer while retaining the follow-up composer/workspace treatment. This extends DEC-066/DEC-068 and uses DEC-079's existing motion baseline; it supersedes only DEC-068's blanket exclusion of neutral borders for the listed surfaces.
- Status: confirmed
- Context: The shipped theme palette reaches primary actions, status states, and scanner chrome, but much of the surrounding experience remains visually disconnected from the selected palette. The approved direction is restrained ambient theming: enough persistent accent to make the palette feel coherent, with enhanced feedback during interaction, without tinting the page background or turning every neutral surface into saturated theme chrome.
- Impact:
  - applies across game context, zone confirmation, zone collection, enrichment, and the answered/conversation view
  - the exhaustive REQ-060 inventory is: game context's player-count disclosure row and phase/active-player control group (including conditional combat step); every zone-confirmation option row; every zone-collection tab and the active zone card-picker container; enrichment's view-mode control and rendered card-enrichment/question-submission working containers; and the answered/conversation view's context trigger, open context sheet/drawer, and follow-up composer/workspace
  - enrichment current-state treatment follows the rendered mode: wizard card editing makes only the card-enrichment container current, list mode makes both the card-enrichment and question-submission containers current simultaneously, and completed wizard work makes only the question-submission container current
  - agents must not infer additional ambient-accent surfaces from broad categories; surfaces outside that inventory remain neutral unless another existing requirement already themes them
  - hover and `focus-visible` strengthen the same palette treatment; selected/current states may sustain the stronger restrained treatment so interaction hierarchy remains legible
  - touch and keyboard users receive equivalent active/focus/current-state feedback; hover is never the sole carrier of state or meaning
  - generic non-interactive page chrome, the dominant slate background, body text, and inactive structural containers remain neutral
  - card-identity rings from DEC-078 remain derived from card colors, independent from the app palette, and free of palette glow/animation; surrounding interactive treatment must not replace or obscure those rings
  - palette emphasis may color existing DEC-079 transitions and state-change cues, but adds no new motion trigger, timing system, animation library, or required animation; `prefers-reduced-motion` behavior remains authoritative
  - reuses the existing four palette tokens (`accent`, `accent-strong`, `accent-soft`, `accent-contrast`) through shared semantic styling; no new palette values or token roles
  - scanner reticle, convergence, lock/progress, and thumbs-up confirmation motion remain unchanged; existing DEC-068 scanner palette reach is preserved
  - frontend presentation only — no change to workflow logic, `AskAiRequest`, Zod schemas, `GameContext`, prompt assembly, provider selection, backend routes, card metadata, scan matching/stabilizer logic, stack ordering, or data-pipeline behavior
- Related requirements:
  - REQ-060
  - REQ-044
  - REQ-046
  - REQ-059
  - REQ-097
  - NFR-006
  - NFR-011
  - FLOW-001
  - FLOW-007
- Notes:
  - approved visual direction: restrained ambient accents (Option B), with a baseline accent at rest and stronger hover/focus/current treatment
  - rejected alternatives: interaction-only accents were too subtle to make the selected palette feel cohesive; full themed chrome was too loud and conflicted with the neutral-background hierarchy
  - non-goals: new palettes, picker changes, palette-tinted page backgrounds, theme-specific component overrides, changing card-identity colors, re-animating scanner internals, or introducing a theming/animation framework
  - DEC-118 changes the answered-view surface shape, not the palette model or intensity contract

### DEC-091
- Decision: The game-context "Players in game" disclosure row's three controls (expand/collapse toggle, add-player, remove-player) are enlarged to reliably-tappable targets, the expand/collapse arrow is made visibly larger and more prominent as an expander affordance, and the add/remove pair is reordered to `−` (remove) on the left and `+` (add) on the right to match stepper intuition. Presentation/ergonomics only. Refines DEC-076; supersedes none of it.
- Status: confirmed
- Context: DEC-076 tightened game-context chrome and called for "wider expand/collapse and add/remove player buttons," but in practice the three controls remain small and hard to tap accurately, the expander glyph (`▸`/`▾`) is too small to notice as an affordance, and the current add-then-remove (`+` left, `−` right) order reads as backwards versus the conventional minus-left/plus-right stepper. This is a focused ergonomics pass on those three controls and the arrow only; it changes no game-context logic, values, player min/max, or data model.
- Impact:
  - the three controls in the "Players in game" disclosure row (`App.tsx`) — the expand/collapse toggle, the add-player button, and the remove-last-player button — are enlarged so each presents a comfortable touch target of at least 44×44px across all supported responsive widths (DEC-117/REQ-096)
  - the expand/collapse arrow is rendered at a visibly larger, more prominent size so it reads clearly as an expander; its `aria-label`/`aria-expanded` semantics are unchanged
  - the add/remove pair is reordered so `−` (remove last player) is on the left and `+` (add player) is on the right, matching the conventional stepper layout; button labels, `aria-label`s, handlers (`addPlayer`/`removePlayer`), disabled logic (`MIN_PLAYERS`/`MAX_PLAYERS`), and accent/zinc styling roles are otherwise unchanged
  - existing ambient-accent treatment on the player-count disclosure row (DEC-081/REQ-060) and its motion classes (DEC-079/NFR-006) are preserved
  - frontend presentation only — no change to game-context logic, life-total/display-name behavior, player count bounds, `AskAiRequest`, Zod schemas, `GameContext`, prompt assembly, provider selection, backend routes, card metadata, scan logic, or data-pipeline behavior
- Related requirements:
  - REQ-069
  - REQ-056
  - REQ-060
  - DEC-076
  - DEC-117
  - DEC-081
  - REQ-096
  - NFR-001
  - FLOW-001
- Notes:
  - approved swap direction: minus-left / plus-right
  - non-goals: changing player min/max, life-total or display-name logic, redesigning the game-context screen beyond these three controls and the arrow, or any contract/prompt change
