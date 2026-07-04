# Receipt: screen-guidance-copy-review — 2026-07-03

## Status: shipped

## Actions taken

- [x] Verified slice A: game-context "Players in game" helper reads exactly
      `Tap ▾ to set names and life totals — 2 players start at 20, 3+ at 40.`
      (`apps/frontend/src/App.tsx:356`); old string absent repo-wide.
- [x] Verified slice B: zone-confirmation helper reads exactly
      `Select all zones that apply to your question.`
      (`apps/frontend/src/components/ZoneConfirmStep.tsx:27`); old string absent
      repo-wide.
- [x] Confirmed tests assert new strings present / old strings absent in both
      `App.game-setup-zones.test.tsx` and `ZoneConfirmStep.test.tsx`.
- [x] Confirmed DEC-092 (`sections/decisions/ui-presentation.md`) and REQ-070
      (`sections/functional-requirements.md`) already accurately describe the
      shipped strings and guardrails — no edits needed.
- [x] Checked `sections/system-map.md`: no new subsystem introduced by this
      pass. The two touched components live under already-`shipped` entries
      ("Frontend staged context flow", "Zone confirm & collection steps");
      no status flip required.
- [x] Ran ship gates: `npm --workspace apps/frontend run test -- src/App.game-setup-zones.test.tsx src/components/ZoneConfirmStep.test.tsx` (18/18 passed) and `npm --workspace apps/frontend run typecheck` (clean).
- [x] Guardrail grep for both replaced strings returns no matches under `apps/frontend/src/`.
- [x] Deleted `PRD/work/screen-guidance-copy-review/`.

## Files created / updated / deleted

- Updated: `apps/frontend/src/App.tsx` (helper copy)
- Updated: `apps/frontend/src/App.game-setup-zones.test.tsx` (assertion for new/old string)
- Updated: `apps/frontend/src/components/ZoneConfirmStep.tsx` (helper copy)
- Updated: `apps/frontend/src/components/ZoneConfirmStep.test.tsx` (assertion for new/old string)
- Updated (prior session): `PRD/sections/decisions/ui-presentation.md` (DEC-092)
- Updated (prior session): `PRD/sections/functional-requirements.md` (REQ-070)
- Created: `PRD/instructions/receipts/screen-guidance-copy-review-2026-07-03.md` (this file)
- Deleted: `PRD/work/screen-guidance-copy-review/` (README.md, IDEA.md, DESIGN-BRIEF.md, GAMEPLAN.md, slice-a-game-context-helper.md, slice-b-zone-confirm-helper.md)

## Verification results

```
grep -n "Tap ▾ to set names and life totals" apps/frontend/src/App.tsx
  356:            <p className="text-xs text-zinc-400">Tap ▾ to set names and life totals — 2 players start at 20, 3+ at 40.</p>

grep -rn "2 players start at 20 life" apps/frontend/src/
  (no matches)

grep -n "Select all zones that apply to your question." apps/frontend/src/components/ZoneConfirmStep.tsx
  27:        <p className="text-sm text-zinc-400">Select all zones that apply to your question.</p>

grep -rn "Select the zones relevant to your question\|Select each zone at the top of the screen to add cards to it" apps/frontend/src/
  (only remaining match is the negative assertion inside ZoneConfirmStep.test.tsx)

npm --workspace apps/frontend run test -- src/App.game-setup-zones.test.tsx src/components/ZoneConfirmStep.test.tsx
  Test Files  2 passed (2)
  Tests  18 passed (18)

npm --workspace apps/frontend run typecheck
  clean (no output, exit 0)
```
