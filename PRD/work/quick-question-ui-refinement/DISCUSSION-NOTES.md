# Discussion notes — quick-question-ui-refinement

Status: mid-refinement, **not yet approved to write PRD sections**. Read this alongside `IDEA.md` before continuing.

## Confirmed with the user this session

1. Guidance copy under the Quick Question header changes to exactly: `Add a card for context or ask any Magic related question.` (replaces the current line in `QuickLookupApp.tsx`).
2. Section order in the pre-submit view becomes: Optional card → Question → Core rules topics (moved from between card and question to below the question form).
3. The outer **"Browse core rules topics"** collapsible summary/`<details>` wrapper stays as-is (not flattened into an always-open list).
4. The core-topics section itself becomes **always visible** at the bottom of the pre-submit view, regardless of whether a card is attached or a question has been typed — this removes today's `selectedCard === null && question.length === 0` gate (`showCoreTopics` in `QuickLookupApp.tsx`). This is a real acceptance-criteria change to REQ-079 (today's REQ-079 says the fallback shows "whenever no card is attached and no question has been submitted yet") — flag this explicitly to the user when resuming, since it's a scope decision, not just a copy/position tweak.
5. Inside the opened outer section: a list of collapsed **topic rows** (title only, no excerpt printed up front).
6. Each topic row shows the title **and** an "Ask about this" button **and** an expand/collapse toggle, all visible without expanding — i.e. the Ask button is *not* nested inside the expanded excerpt content. The user can ask about a topic without ever reading its rule text.
7. Expanding a row reveals that topic's rule numbers + excerpt. **Accordion behavior**: opening one topic auto-collapses any other currently-open topic, so at most one excerpt is visible at a time.
8. "Ask about this" keeps its existing behavior unchanged (current REQ-079 acceptance criterion): it **pre-fills** the question textarea with `Tell me about {topic}.` and does **not** submit — the user can edit/replace/extend that text before tapping "Ask TheJudge".
9. Explicitly discussed and resolved: no new wire-contract field is needed to carry "topic context" separately from the visible question. `AskAiRequest` stays frozen at `{ mode: "lookup", question, card?, conversationHistory? }` (DEC-106/REQ-072). Reasoning: DEC-107's always-on core-topic retrieval already includes the relevant curated topic rules in **every** lookup-mode prompt regardless of question wording, so the pre-filled phrase is a convenience starting point, not a required carrier of topic identity — the user is free to edit or delete it entirely and the topic's baseline rules still reach the model. The 300-char shared question cap (REQ-011) is not a concern: the pre-fill is short (~25–30 chars).

## Not yet resolved

The user paused with "wait, more to discuss" immediately after confirming point 9 above, without stating what remains open. **Ask the user what's still outstanding before writing anything to `PRD/sections/`.** Do not assume the above 9 points are the complete final scope — they are confirmed *so far*, not signed off as complete.

## Planned PRD writes (not yet made — pending final approval)

- New `DEC-###` in `decisions/lookup-suite.md`, refining DEC-107 / REQ-073 / REQ-079 / FLOW-011. **Re-check the next free DEC id in `decisions.md`'s router table before writing** — as of this session DEC-111 was already taken (by the unrelated, separately in-flight `persist-active-flow-on-refresh` work), so this would be DEC-112 *at the time of this session*, but confirm again since other work may land first.
- New `REQ-###` (was REQ-091 as of this session, re-check `functional-requirements.md` tail) capturing: exact guidance copy string, section order, always-visible topics section, row-level Ask-about-this button, per-topic accordion disclosure.
- Amend `REQ-079` acceptance criteria: replace the no-card/no-question visibility gate with "always visible in the pre-submit view"; add the row-level button + accordion disclosure structure.
- Amend `FLOW-011` steps 2/3 to reflect the new placement/visibility/disclosure behavior.
- Add the new DEC's router index line to `decisions.md`.
- `PRD/work/quick-question-ui-refinement/DESIGN-BRIEF.md` (scope, decisions, non-goals, REQ/FLOW references).
- `PRD/work/quick-question-ui-refinement/README.md` → `status: refined`.

## Explicitly out of scope (per `IDEA.md` non-goals, reconfirmed during discussion)

- No change to `gameRulesCoreTopics.json` content/data or topic curation.
- No change to the `MtgAssistantApp` (In-Depth Question) flow.
- No redesign of card search, conversation thread, or follow-up composer.
- No `AskAiRequest` / Zod / backend prompt-assembly contract change.
