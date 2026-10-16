# IDEA: in-depth-context-spacing — waiting bubble on one row

Owner words (verbatim copy in `intake/owner-request.md`): when the first message is sent and the funny phrases show while the model works, "align the icon, text, and timer, so its all on the same row … right now, its stacked a bit and id like to see how it looks more streamlined". An experiment: the owner wants to look at it, not a fixed design.

## What the player sees today

After a player sends a first question, the form is replaced by one waiting bubble (`AskAiWaitingPanel`). Top to bottom it shows: the small ringed seal (28 px, ring turns, two motes drift up), then the rotating phrase on its own line (ink-in, the old line lifts away), then the elapsed clock at the foot, right-aligned, large monospace (`1.5rem`). Three rows in a one-column grid with a `0.5rem` gap and `1rem` padding.

## Outcome wanted

Seal, phrase and clock sit on one row, so the bubble reads cleaner and shorter. Refinement decides how (phrase width, long phrases wrapping, clock size and side, phone width) after looking at it live in a browser. This idea does not pick the design.

## Non-goals

- No change to the phrases, their six thresholds (0/3/8/15/25/40 s), or their order.
- No change to timing, the elapsed-clock logic, or the lift-away delay (280 ms).
- No change to the animations (ink-in, lift, ring turn, motes, edge breathe); same CSS-only rules (NFR-006), same reduced-motion behaviour.
- No change to `aria-live` / `aria-atomic` on the phrase.
- No new waiting-panel variant (REQ-092 constraint: reuse `AskAiWaitingPanel` as-is).

## Where the bubble appears (one shared component)

`apps/frontend/src/components/AskAiWaitingPanel.tsx` is the only implementation. Three render sites, two flows:

1. In-depth flow, first submit: `apps/frontend/src/components/EnrichmentStep.tsx` ~line 718, as `pendingFeedback` inside `ConversationWorkspace` while `isSubmitting`.
2. In-depth flow, fallback: `EnrichmentStep.tsx` ~line 880, in place of the form when no answer yet and `isSubmitting`.
3. Ask a Question (Quick Lookup), first submit: `apps/frontend/src/components/portal/quick-lookup/QuickLookupApp.tsx` ~line 702 (REQ-092).

Follow-up questions use an inline spinner, never this panel (DEC-041; `PRD/sections/in-depth/README.md` ~lines 276-290), so they are out of scope.

Does the owner's wording cover each? The slug names In-depth, but the sentence says "the initial message … the funny phrases", which is the first-submit wait in both flows. One component serves all three sites, so the change lands on all of them unless refinement says otherwise. Ask a Question is covered by the description of the symptom, not by the slug; refinement should confirm with the owner that it is wanted there too.

## Styles

- `apps/frontend/src/index.css`: `.wait-inscription-bubble` (~line 204, grid, gap 0.5rem, padding 1rem; ~3080 adds `position: relative` and the breathing `::after`), `.wait-inscription-clock` (~218: monospace 1.5rem; ~3093: `text-align: right`), `.wait-inscription-message-stack` (~2987, `position: relative`; the lifting line is absolute over it), `.wait-inscription-seal` (~2997, 28 px), `.wait-inscription-line` (~212).
- `apps/frontend/src/styles/flow.css` ~397-449: `.msg.judge.waiting`, `.wait-foot`, `.wait-time`, `.wait-line` are the approved mockup's rules, imported by `main.tsx`. Nothing in `apps/frontend/src` renders those class names (grep of tsx/ts finds none), so they are a leftover copy of the mockup, not the live panel. Their `.wait-foot` is a flex row with the clock at the end, a hint of the mockup's intent. Verify live in refinement.
- The mockup source is `docs/design/ui-reimagining/direction-1/flow.js` (~lines 175-222) and `flow.css`: seal beside a `div` holding "TheJudge" label, phrase lines, then `.wait-foot` (dots + clock). REQ-206 / REQ-209 screens follow the direction-1 pages (`quick-question.html`, `in-depth-question.html`).

## Logic (do not need to change)

`apps/frontend/src/hooks/useElapsedWaitTimer.ts`, `apps/frontend/src/lib/askAiWaitStages.ts` (stages, `formatElapsed`).

## Requirement text that fixes the layout

REQ-023 (`PRD/sections/functional-requirements.md` ~line 418), last acceptance criterion: "the panel is drawn as the judge's bubble under the colour's seal: each threshold line inks itself in letter by letter with a glow that fades, the line before lifts and fades, the elapsed clock ticks at the bubble's foot, two motes of the colour's light drift up through it, a faint dashed ring turns round the seal, and the bubble's edge breathes in the colour's light; …"

- "under the colour's seal" fixes the message below the seal.
- "the elapsed clock ticks at the bubble's foot" fixes the clock below the phrase.

Both words describe the stacked layout, so a one-row layout contradicts REQ-023 as written; the amendment would be a refinement/define item. Also restated in `PRD/sections/in-depth/README.md` ~278-283 ("drawn as the judge's bubble under the colour's seal") and the code comment in `AskAiWaitingPanel.tsx` ("the colour's seal: a small ringed badge the message sits under", "The elapsed clock ticks at the bubble's foot (REQ-023)"). REQ-092 (~line 2190) only says the panel renders in the form's place and must be reused as-is; it names no layout. REQ-075 (~1826) says only "inline processing animation" for follow-ups and fixes no wait layout. Other places that restate REQ-023: `PRD/sections/system-map.md`, `PRD/sections/quick-lookup/README.md`, `PRD/sections/decisions.md` (DEC-031).

## Tests that pin the panel

- `apps/frontend/src/components/AskAiWaitingPanel.test.tsx`: aria-live region, stage messages, 0:00 / 1:05 clock, stage classes, seal + ring + two motes (`.wait-inscription-seal`, `-seal-ring`), ink-in class, italics on absurd line, lift-away timing, no canvas, CSS-only motion rules and reduced-motion rule (reads `index.css`; selector lists at ~line 5364 matter). No test asserts the stacking order itself.
- Also mention the panel: `ConversationWorkspace.test.tsx`, `QuickLookupApp.test.tsx`, `App.answered-state.test.tsx`, `App.game-setup-zones.test.tsx`, `App.ui-flare-chat-motion.test.tsx`, `src/test/motion-foundation.test.ts`, `reduced-motion.test.ts`.

## Prior run

- Prior run: `PRD/instructions/receipts/ask-ai-wait-animation-2026-06-05.md` — built the original panel (timer, aria-live, component tests).
- Prior run: `PRD/instructions/receipts/ui-reimagining-build-2026-10-02.md` — slice F (wait inscription) gave the panel its seal, ink-in and bubble treatment; REQ-023 accepted.
- Prior run: `PRD/instructions/receipts/ui-look-translation-2026-10-02.md` — updated `AskAiWaitingPanel.tsx` onto the shared panel tokens.
- Prior run: `PRD/instructions/receipts/ui-reimagining-2026-09-24.md` — the design run whose direction-1 mockup defines the waiting panel and its colour-themed edge.
- Prior run: `PRD/instructions/receipts/ui-refinement-2026-08-02.md` — verified the panel replaces the initial-submit form in Ask a Question (REQ-092).
- Prior run: `PRD/instructions/receipts/post-decrypt-follow-up-chat-2026-06-07.md` — DEC-041, panel only on the initial decrypt.
- Prior run: `PRD/instructions/receipts/ui-polish-subtle-effects-2026-06-29.md` — left `AskAiWaitingPanel` untouched by boundary audit.
- Prior run: `PRD/instructions/receipts/codebase-duplication-audit-2026-08-23.md` — noted the panel as one component rendered by both call sites.
- Prior run: `PRD/instructions/receipts/blue-ambient-personality-2026-10-05.md` — matched only on `blueInscription.ts` (theme file); likely irrelevant.
