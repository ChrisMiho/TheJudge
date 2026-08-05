# DESIGN-BRIEF: assistant-chat-shell-followup

Status: approved (user explicit approval 2026-08-04; Draft model clarified same day after quality-check FAIL).

## Problem

Post-ship review of the shared chat shell (DEC-118–127) against the Claude/ChatGPT-like goal still surfaces layout and history-access defects. Captures live in `issues/`. Both In-Depth Question and Quick Question are affected; shared-surface fixes should cover both where the bug is shared.

## Outcome

1. History rail is always available on In-Depth Question and Quick Question (including empty history, pre-submit steps, and after Start Over), without overlapping View Context.
2. Mid-flight staging (anything before first successful submit) is preserved as a single **Draft** history entry per destination so Menu navigation away and page reload do not wipe card-scan / zones / enrichment / typed question work; Draft auto-hydrates on destination mount.
3. Answered workspace fills available height when content is short; desktop keeps Start Over in view; mobile Start Over is smaller to reduce accidental taps.
4. Pre-submit question composers grow with typed text up to available space without causing page scroll.

## Confirmed choices

| Question | Choice |
| --- | --- |
| History visibility | Always visible on In-Depth + Quick Question (empty state OK), like Menu |
| Draft purpose | Snapshot mid-flight staging so Menu leave (and reload) do not wipe pre-submit work |
| Draft write / replace | Single slot updates as staging changes; after answered Start Over, new mid-flight staging overwrites Draft; first successful submit clears Draft |
| Start Over availability | Unchanged — answered-only (REQ-029 / DEC-040); no mid-flight Start Over / New conversation invent |
| Draft on reload / Menu return | Auto-hydrate mid-flight UI from Draft (DEC-103 style); History still lists Draft for explicit select |
| Pre-submit empty lower-half fill (`3.png` / `5.png` screen fill) | Out of scope — other UI-refinement work |
| Answered fill + Start Over chrome | In scope for shared `ConversationWorkspace` (mobile + desktop) |
| Shared fix | Prefer shared workspace / shared composer patterns so one fix covers both flows |
| Contracts | No Ask AI / provider / prompt-assembly changes |

## Product truth

| ID | Role |
| --- | --- |
| DEC-129 | New — History rail always on for In-Depth + Quick Question; no overlap with View Context (amends DEC-126 visibility) |
| DEC-130 | New — Single Draft slot per destination for mid-flight snapshot across Menu leave/reload (auto-hydrate); Start Over stays answered-only (extends DEC-124) |
| DEC-131 | New — Answered chrome: short-thread fill, desktop Start Over in-viewport, smaller mobile Start Over; pre-submit question fields grow without page scroll (refines DEC-118/127) |
| REQ-107 | New — Always-visible History + non-overlap |
| REQ-108 | New — Draft persistence / auto-hydrate / single-slot replace |
| REQ-109 | New — Answered fill + Start Over sizing/visibility |
| REQ-110 | New — Growing pre-submit question field (Enrichment + Quick Question) |
| FLOW-017 | New — Preserve/resume Draft across Menu leave, reload, and History select |
| REQ-029 / REQ-103 / FLOW-016 | Amended for Draft + always-on History (REQ-103 description tightened for pre-submit always-on) |
| DEC-124 / DEC-126 / DEC-127 / DEC-111 notes | Narrowly amended by DEC-129–131; retention cap and drawer mechanics otherwise unchanged |

## Issue map

| Capture | Theme |
| --- | --- |
| `issues/1.png` | History icon overlaps View Context (desktop; verify mobile) |
| `issues/2.png` | History unavailable after Start Over until new submit |
| `issues/3.png` | Pre-submit question box does not grow (mobile Enrichment; also desktop) |
| `issues/4.png` | Short answered thread does not fill viewport |
| `issues/5.png` | Quick Question shares pre-submit growth / history-access issues |

## Non-goals

- Pre-submit staged screens filling empty lower-half dead space (owned elsewhere)
- Ask AI contracts, Zod, prompt assembly, providers, backend routes
- Multi-draft backlog, cross-device sync, account/auth, editing restored frozen context
- Pre-submit Start Over / New conversation control
- Outer app-shell redesign, Life Tracker / Trade Balancer chrome
- Reopening markdown rendering or drawer breakpoint mechanics beyond availability/Draft/layout polish

## Verification (package-level)

1. Desktop + mobile (~390×844): History rail visible on In-Depth and Quick Question at every step, including empty history, pre-submit, and immediately after Start Over; no overlap with View Context.
2. Stage mid-flight → leave via Menu → return → mid-flight UI restored from Draft; History shows **Draft**; reload with Draft present auto-hydrates the same way; after answered Start Over, new staging overwrites Draft (no second unfinished entry).
3. Answered workspace with short thread fills available height; desktop Start Over remains reachable without scrolling the page away; mobile Start Over is visually smaller than today’s full-width large control.
4. Enrichment optional question and Quick Question question fields grow with long text until bottom chrome, without document scroll.
5. `npm run quality:check` (or frontend workspace equivalent for touched areas) green.
