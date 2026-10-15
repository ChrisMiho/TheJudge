# Ask box shows real text instead of a hint, and the In-depth button shrinks

Intake (evidence only): `intake/owner-request.md`.

## Problem

The owner sees the Ask box (the question composer on Ask a Question) filled with real text where the grey hint should be. The In-depth button beside it also sits shrunk to its ◈ glyph. Reported on desktop and mobile; not yet reproduced. It may be one cause (the box really holds text, so the button collapses by design) or two.

## Outcome

An empty, unfocused Ask box shows the hint as grey placeholder text only. The field itself is empty, the In-depth button shows its full label (◈ In-depth) at rest, and the button shrinks only once the player focuses the box or types. Same on desktop and phone.

## Non-goals

No fix is chosen here; refinement reproduces it live in a browser first. No change to the tiered hint wording, the REQ-206 collapse rule itself, or dictation behavior unless the reproduction shows they are the cause.

## Where it lives (unverified leads)

- Mount: `apps/frontend/src/components/portal/quick-lookup/QuickLookupApp.tsx` (~line 706, `<ComposerPill ... placeholders={QUESTION_PLACEHOLDER_TIERS}>`; `question` state starts `""` at line 107; `hydrateFromLookupDraft` at ~158 can set it from a saved draft). Other mounts: `EnrichmentStep.tsx` (~913), `FollowUpComposer.tsx`.
- `apps/frontend/src/components/ComposerPill.tsx`: tiered hint, `placeholderFloorForViewport` (line 27), layout effect rewriting `textarea.placeholder` (~129-176), `placeholder=` prop (line 227, `Listening…` while dictating), `data-fill` = "0" when empty else "some" (line 188).
- In-depth collapse is pure CSS, `apps/frontend/src/styles/flow.css` ~282-289: label hides when `.q-box:has(textarea:focus)` or `.q-box:not([data-fill="0"])`. So the button shrinks on focus or any non-empty value, never on bare focus-within. Phones under 480px already hide the label (line ~281). Hint colour: line 223 `.q-box textarea::placeholder`.
- PRD: REQ-206 (Ask box / send pill, `PRD/sections/user-flows.md`, `system-map.md`).

## Tests that pin it

`apps/frontend/src/components/ComposerPill.test.tsx`: `data-fill` "0"/"some" (lines ~99, ~128, ~261); collapse CSS regex test at ~236; tiered placeholder-at-width tests at ~461-485; dictation `Listening…` tests. Also `QuickLookupApp.test.tsx` and `EnrichmentStep.test.tsx` touch the composer.

## Prior run

- `PRD/instructions/receipts/indepth-chip-collapse-2026-10-05.md` (built the label-collapse rule on focus or text)
- `PRD/instructions/receipts/anchor-ask-composer-2026-10-05.md` (anchored Ask composer frame, PR #262)
- `PRD/instructions/receipts/card-search-and-send-pill-2026-10-13.md` (send pill on no-mic browsers, PR #305)
- `PRD/instructions/receipts/in-depth-spec-2026-08-28.md` (In-depth spec)
- `PRD/instructions/receipts/ui-pass-2-2026-10-04.md` (question box polish)
- `PRD/instructions/receipts/green-mobile-branch-declutter-2026-10-04.md` (phone composer path, REQ-207)
