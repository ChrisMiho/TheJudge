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
  - non-goals: arbitrary RGB/hex picker, per-component overrides, server-synced preferences, account settings, dark/light mode redesign

### DEC-067
- Decision: The staged data-collection screens present the active step name inline to the right of the `TheJudge` / `Stack Assistant` brand block in a single header row, rather than stacked below it as a standalone heading.
- Status: confirmed
- Context: Each staged step screen (game context, zone confirmation, zone collection, enrichment) previously rendered the step name as a separate heading below the brand block, consuming vertical space above the working area on small mobile screens. Promoting the step name into the brand header row tightens the chrome and keeps the active step legible at a glance without changing step names, ordering, or flow logic.
- Impact:
  - the brand block (`TheJudge` + `Stack Assistant` subtitle) stays the dominant element on the left; the step name aligns to the right of the same row, vertically centered and styled as a secondary label that is smaller than the brand title but clearly legible
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
