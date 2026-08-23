# Codebase duplication audit

## Problem

The codebase has no systematic check for the same need being served by two or
more separate implementations. `DEC-159` shows the failure mode concretely: a
hardcoded close-button class string duplicated verbatim in four places, plus
two separate `Close` buttons doing the same job, found only by chance during a
UI review. Nothing currently catches this class of problem on purpose.

## Outcome

One read-only document, produced by reading `apps/frontend`, `apps/backend`,
and `scripts` (excluding `node_modules`, `dist`, build artifacts, and
committed data corpora), that lists every place the same need is served by
two or more implementations. Each finding names the duplicated need in one
sentence, every location that serves it, whether it looks intentional or
accidental, a suggested consolidation and roughly what it would touch, and a
small/medium/large size estimate. Findings are ranked by how much complexity
consolidation would remove, not by duplicated line count. Distinguish this
from healthy, deliberate reuse — `DEC-157` records `useScanCapture.ts` and
`ScanCameraSurface.tsx` as reuse working as intended, not a finding.

## Non-goals

- Not a lint or style pass — naming, formatting, and idiom preferences are out
  of scope.
- Not a refactor — this package reads code and writes one document. It
  changes no product code. Any consolidation work is a separate package,
  decided by the owner afterward.
- Not a bug hunt — correctness defects are noted only if they fall out of the
  duplication analysis for free.

## Citations (not opened)

- `DEC-159` — precedent: the close-button duplication this audit exists to
  systematically catch.
- `DEC-157` — precedent: measured import-graph reuse that should be reported
  as healthy, not flagged.
- `PRD/work/adhoc/refactor-gameplan.md` — downstream context only; explicitly
  out of scope for this package.

## Open questions for refinement

- Where does the finished audit document live, and under what name? This
  package produces no code, so the usual `DESIGN-BRIEF.md` → `GAMEPLAN.md` →
  slices path (which assumes an eventual code change) does not fit cleanly.
  Refinement needs to decide the deliverable's file and whether/how it gets
  promoted into `PRD/sections/` (e.g. `system-map.md`) once written.
- What exactly falls under "committed data corpora" for the exclusion list?
  Candidates include `apps/frontend/public/data/cardMetadata.json`,
  `apps/backend/data/cardRulingsByOracleId.json`,
  `apps/frontend/public/data/cardhashes.bin`,
  `cardhashManifest.json`/`cardhashSkiplist.json`, and possibly golden
  fixtures under `apps/backend/src/eval/fixtures/`. The intake names the
  category but not its exact boundary.
- Does "scripts" scope mean the `scripts/` directory tree only, or does it
  also include script definitions inlined in `package.json` (root and
  per-workspace)?

## Prior run matches (keyword search over `PRD/instructions/receipts/`)

- `PRD/instructions/receipts/consolidate-shared-logic-2026-06-18.md` — titled
  "Consolidate Shared Logic and Remove Duplication"; strongest match.
- `PRD/instructions/receipts/center-menu-tab-prominence-followup-2026-08-05.md`
- `PRD/instructions/receipts/frontend-routing-and-code-splitting-2026-08-17.md`
- `PRD/instructions/receipts/palette-color-customization-expansion-2026-06-25.md`
- `PRD/instructions/receipts/prompt-context-retrieval-tuning-2026-06-18.md`
- `PRD/instructions/receipts/scan-ux-responsiveness-2026-06-23.md`
- `PRD/instructions/receipts/scan-camera-desktop-sizing-regression-2026-07-04.md`
- `PRD/instructions/receipts/scan-duplicate-card-identity-2026-06-30.md`
- `PRD/instructions/receipts/test-suite-hygiene-2026-07-01.md`
- `PRD/instructions/receipts/ui-flare-chat-motion-2026-08-03.md`
