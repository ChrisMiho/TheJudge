# Quick Question UI Refinement — DESIGN BRIEF

## Scope

A presentation-only refinement of Quick Lookup's pre-submit view (`QuickLookupApp.tsx`). Three changes, confirmed across two refinement sessions:

1. Guidance copy under the header becomes an exact fixed string.
2. Section order becomes card → question → topics (topics section moves below the question, always visible).
3. The topics section ("General rules topics", renamed) becomes concise by default with per-row accordion disclosure, and its action button locks a fixed phrase into a **non-editable pill** next to the Question field instead of pre-filling editable text.

Item 3's mechanism was the main design question this session: the original pass kept "ask about this" as an editable pre-fill (any typed word could silently erase the topic pick, and once the topics section moved below the question, the tap gave no visible confirmation it worked). The resolved design locks the phrase visibly, lets the user still add their own text alongside it, and scrolls/focuses the question field on selection so the action reads as connected to its effect.

## Decisions

- **DEC-112** (`decisions/lookup-suite.md`) — "General rules topics" section (renamed, reordered below the question, always-visible, row-level accordion) plus the "Use this topic" locked-pill mechanism: non-editable phrase pill inline with the Question label, its own remove control, one pill at a time, supplementary textarea text untouched, smooth-scroll + focus on selection, client-side composition into one `question` string. Refines DEC-107/REQ-079.

## Requirements & flow

- **REQ-073** (amended) — exact guidance-copy string; card → question → topics section order.
- **REQ-079** (amended) — "General rules topics" section: always-visible (old no-card/no-question gate removed), collapsed rows with title + action button + expand toggle visible without expanding, per-row accordion.
- **REQ-091** (new) — the "Use this topic" locked-pill mechanism: label, pill content/placement, remove control, single-pill-at-a-time swap, supplementary-text preservation, placeholder copy, submit-enablement change, scroll/focus behavior, client-side question composition, shared character cap applied to the composed string.
- **FLOW-011** (amended, steps 2–4 and edge cases) — reflects the new layout order, the always-visible topics section, and the locked-pill interaction.

## Design direction (for map-out; not yet product truth)

- `QuickLookupApp.tsx`: reorder JSX so the "General rules topics" `<details>` renders after the question `<form>`; drop the `showCoreTopics` gate so it always renders.
- Topic-row state: collapsed by default; expanding one topic sets it as the sole open id (accordion), independent of any locked pill.
- Question-field state: introduce a `lockedTopic: { id, title } | null` alongside the existing `question` (free-text) state. The pill renders `Tell me about {lockedTopic.title}.` when non-null; its remove control sets `lockedTopic` to `null`. Selecting a new topic replaces `lockedTopic` only — `question` (the textarea's own content) is untouched.
- Submit composition: `composedQuestion = [lockedTopic ? \`Tell me about ${lockedTopic.title}.\` : null, question.trim() || null].filter(Boolean).join(" ")`; `canSubmit = composedQuestion.length > 0`. `composedQuestion` (not raw `question`) is what's trimmed against `MAX_QUESTION_LENGTH` and sent as `AskAiRequest.question`.
- Placeholder copy swaps based on `lockedTopic` presence (e.g. generic prompt vs. "Add anything specific — or leave this blank and just ask.").
- Selecting a topic triggers a scroll (`scrollIntoView({ behavior: "smooth", block: "..." })`, respecting reduced-motion per existing NFR-006 conventions) targeting the question field's container, then focuses the textarea.
- No new component library; reuse existing pill/badge visual language already present in the app's theme tokens if one exists, otherwise a small inline styled span.

## Non-goals (v1)

No change to `gameRulesCoreTopics.json` content/curation. No change to the In-Depth Question (`MtgAssistantApp`) flow. No redesign of card search, conversation thread, or follow-up composer. No `AskAiRequest` / Zod / backend prompt-assembly contract change (DEC-106 stays frozen — composition happens client-side before the request is built).

## Reused, unchanged

- `buildLookupAskAiRequest` / `AskAiRequest` shape (DEC-106) — receives the already-composed question string, no signature change required beyond what it already accepts.
- Card search/scan, conversation thread, follow-up composer (REQ-073/REQ-075 chrome).
- `gameRulesByTopic` / `gameRulesCoreTopics.json` curated source and data-build pipeline (DEC-030/DEC-012).
- REQ-011's shared 300-character cap — applied to the composed string rather than the raw textarea.

## Open questions

None. All three IDEA.md outcomes and the locked-pill mechanism were resolved this session; see `decisions/lookup-suite.md#DEC-112` for the full rationale.
