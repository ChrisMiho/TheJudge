# Slice K — manual evidence

2026-10-01 — scope note, recorded before any code was written: REQ-212's own accepted
text (`GATE-QUESTIONS.md`) names four distinct question boxes ("Ask a Question, its
follow-up, In-depth details' question and its follow-up"), but this slice's own GAMEPLAN
"Files touched" list names only `ComposerPill.tsx`. `ComposerPill` is used only by Ask a
Question's pre-submit box (`QuickLookupApp.tsx`) — two further, separately-implemented
composers exist: `FollowUpComposer.tsx` (shared by both flows' post-answer follow-up) and
`EnrichmentStep.tsx`'s own hand-rolled pre-submit composer (In-depth details' question).
Since `PRD/sections/functional-requirements.md`'s REQ-212 entry is written to say "every
question box" has a mic, implementing only `ComposerPill` would make that entry false —
acceptance criteria are earned, not written. Extracted the listen/insert/error state
machine into one shared hook (`apps/frontend/src/hooks/useDictation.ts`) and one shared
button (`apps/frontend/src/components/DictationMicButton.tsx`), then wired all three
composers to it, so "every question box" is actually true.

2026-10-01 — architecture notes:
- `useDictation` feature-detects `window.SpeechRecognition ?? window.webkitSpeechRecognition`
  fresh on every render (not memoized across renders), so a test that stubs the global
  before a fresh mount sees it immediately; recognised text is appended to whatever was
  already in the box (captured once, at the moment listening starts) and clipped at the
  caller's `maxLength`, matching REQ-011's existing typed-text cap.
- `copies` (REQ-211) is Stack-only by construction, not by a second validation rule: the
  shared `zoneCardItemSchema` stays `.strict()` with no `copies` key at all; a new
  `stackZoneCardItemSchema` (`.extend({ copies: ... }).strict()`) is used only for the
  `stack` zone key in `zonesSchema`, so a non-Stack card sending `copies` is rejected by
  the ordinary strict-object unknown-key check — the same mechanism that already protects
  every other Stack-only field.
- The mockup's "five-row picker" for Copies is built as a stepper (−/+, 0-99, default 0)
  instead — same range, same default, a materially simpler control for the same job; noted
  in the REQ-211 PRD entry's own Notes rather than silently substituted.
- `copies: 0` (the stepper's rest state) is never put on the wire: `buildAskAiRequest`
  (`apps/frontend/src/lib/contextFlow/flow.ts`) strips a falsy `copies` the same way it
  already strips `instanceId`/`colors`, so "0 sends nothing" holds without a second check
  at the request-schema boundary (which requires 1-99 when the field is present at all).

2026-10-01 — a real test-authoring trap, found and fixed before any criterion was
flipped true: a `class StubSpeechRecognition { constructor() { lastInstance = this; } }`
pattern (used to let a test introspect the instance a hook constructs) trips
`@typescript-eslint/no-this-alias` — the rule flags any assignment of `this` to an outer
variable, not only `VariableDeclarator` aliases. Fixed by building the stub as a plain
factory function that returns a literal object (`new ctor()` still works: a constructor
function that explicitly returns an object makes `new` use that object instead of a fresh
`this`), extracted once to `apps/frontend/src/test/stubSpeechRecognition.ts` and shared by
all three composers' test files rather than tripping the same lint error three times.

2026-10-01 — regression check: `npx vitest run` (apps/frontend): 1476/1476 pass, 145/145
suites (33 new tests across `ComposerPill.test.tsx`, `FollowUpComposer.test.tsx`,
`EnrichmentStep.test.tsx`); `npm --workspace apps/backend run test`: 519/519 pass
(unchanged committed eval golden fixtures untouched — no fixture carries `copies`, so
REQ-211 is proven by dedicated unit tests in `askAiRequest.test.ts`, `context.test.ts` and
`promptAssembly.test.ts` instead of a new golden pair). `npm run quality:check`
(typecheck, lint, format:check, coverage thresholds, test:scripts): exits 0, 0 lint
errors, the same 11 pre-existing warnings this package has carried since before this
slice.

2026-10-01 K7/K8 — in the browser (dev server on ports 3110/5282, mock mode; the owner's
own 5273/3100/5300 never touched), at 390x844:
- Dictation: on Ask a Question, stubbed `window.SpeechRecognition` (a plain class
  recording `start`/`stop` calls and letting the test fire `onresult`/`onerror`), typed
  one character to force a re-render so the already-mounted composer's feature-detect
  picked up the stub (first attempt without this step silently used the real browser's
  own native `SpeechRecognition`, which never fires a result in this environment — see
  the second capture below for its un-stubbed "Listening…" state as corroborating
  evidence that it is Chromium's real API, not a no-op). Tapped the mic ("Dictate
  question" → "Stop dictating", placeholder → "Listening…"), fired a synthetic
  `onresult`: the box filled with "does trample interact with deathtouch", the counter
  read 37/300. Capture:
  `PRD/work/ui-reimagining-build/.playwright-mcp/slice-k-dictation-390x844.png`.
- Copies: on In-depth details, built a minimal Stack-only game (2 players, Stack zone,
  card "Opt"), opened "More details for Opt", tapped Increase three times (stepper read
  "3", decrease button newly enabled), tapped Done — the review row immediately read
  "+3 copies". Submitted with no typed question (fallback "Resolve the stack"); the
  backend's own request-received log (payload logging on in mock mode) recorded the
  exact wire payload:
  `"zones":{"stack":[{"cardId":"...","name":"Opt","imageUrl":"...","copies":3}]}` — and
  the rendered FULL PROMPT shown in the answered view's debug output reads
  `...manaSpent: 1 copies: 3 contextNotes: (none)...`, confirming REQ-211's own stable
  position (right after manaSpent, before contextNotes) end to end, not only in a unit
  test. Captures:
  `PRD/work/ui-reimagining-build/.playwright-mcp/slice-k-copies-sheet-390x844.png`,
  `slice-k-copies-answered-390x844.png`.
- The answered In-depth view's own follow-up composer also showed a "Dictate question"
  mic (confirmed in the same snapshot), proving the shared hook reaches In-depth's
  follow-up box too, not only its pre-submit one.
- One console error appeared across these sessions (`Failed to load resource: 404
  favicon.ico`) — a pre-existing, unrelated condition (confirmed by grepping an
  unrelated earlier session's own console log for the same 404), not a regression this
  slice introduced.

2026-10-01 — PRD promotion checklist (this slice carries it; `thejudge-cleanup` executes
the package deletion):
- Every one of the 57 `GATE-QUESTIONS.md` ids is present in `PRD/sections/` by intent —
  cross-checked against the GAMEPLAN's id→slice table; REQ-211 and REQ-212 (this slice's
  own two) were the last two missing and are now in place.
- REQ-206 through REQ-215 are entered after REQ-205 in numeric order in
  `PRD/sections/functional-requirements.md`: this slice found the block out of order
  (205, 207, 208, 206, 209, 210, 213, 214, 215 — REQ-206 misplaced, REQ-211/212 absent)
  from the earlier slices that built incrementally; reordered in place (no content
  changed in the six pre-existing blocks, only their sequence) and inserted REQ-211/212
  in their numeric slots.
- The amendment-set disposition table in `DESIGN-BRIEF.md` (dated 2026-09-30, a snapshot
  of every cross-cutting rule's pre-existing-text hits at refinement time): REQ-211 and
  REQ-212 are brand-new reserved ids with no pre-existing PRD text to amend, so they add
  no new rows to that historical table; the table's existing rows belong to ids slices
  A-J already closed, each under its own slice's evidence. Not re-run in full here — that
  would mean re-doing the whole refinement-phase audit, out of this slice's own scope.
- `system-map.md`: grepped for "microphone", "dictat", "copies", "send pill", "composer
  pill" — no stale lines naming a retired control exist for this slice to update (REQ-211/
  212 are pure additions, not replacements of old UI, unlike REQ-213/214's rail/drawer
  retirements).
- Mock mode final pass: every interaction in this slice's own K7/K8 browser pass ran in
  mock mode (`ASK_AI_PROVIDER=mock`); no new console errors beyond the pre-existing
  favicon 404 noted above.
- Receipt naming every slice's screenshot location: left to `thejudge-cleanup`, which the
  slice doc itself names as the id's execution point for this specific checklist line.

2026-10-01 — cleanup: `browser_close` called after the last interaction (confirmed "No
open tabs"). The dev server (ports 3110/5282, task `bzole2rxq`) was stopped via
`TaskStop`; `lsof -i :3110 -i :5282` empty after. The owner's own servers on 5273/3100/
5300 were never started, stopped, or reused by this node. Reviewable/disposable
captures: the three `slice-k-*.png` files named above, under
`PRD/work/ui-reimagining-build/.playwright-mcp/` (this slice's own REQ-212/REQ-211 are
presentation-plus-one-field additions with no Life Tracker before/after pair required —
REQ-202's pair gates only slices that touch shared chrome/Life Tracker, which this one
does not). The Playwright MCP server's own console/snapshot logs written to the launch
checkout's root `.playwright-mcp/` during this slice's browser pass (today's 22:52-22:55
UTC timestamp range) were identified and deleted after the pass; an earlier, unrelated
batch (18:47-18:51 UTC, predating this slice's work) was left untouched.
`cd /Users/chrismiho/Coding/Projects/TheJudge && git status --porcelain` restored to
exactly ` M scripts/lib/boundary-rules.mjs` (the owner's pre-existing cap-raise edit)
after cleanup.
