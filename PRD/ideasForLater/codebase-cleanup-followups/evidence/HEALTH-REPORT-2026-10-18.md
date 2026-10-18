# Health report — second pass, code-level quality, 2026-10-18

The rollup of four read-only probes run on 2026-10-18, on top of the 2026-10-17
pass (`HEALTH-REPORT.md`, which covered duplication across tool pages, loaded
data, and colour personalities). Full evidence is in the four `FINDINGS-*.md`
files staged beside this one; ids below (Q-, C-, K-, T-) point into them.

- `FINDINGS-frontend-code-quality.md` — Q-01…Q-19
- `FINDINGS-styling-organization.md` — C-01…C-13
- `FINDINGS-backend-code-quality.md` — K-01…K-19
- `FINDINGS-scripts-tooling-tests.md` — T-01…T-17

## The answer

The code compiles clean, lints clean, has no import cycles in the backend and
almost no `any`. What it carries is leftovers and repetition:

1. **Dead wiring from features that moved.** Question History's trigger, the
   In-Depth "Answer" plate, eight unused scanner-hook returns, three unused
   `onBack` props, dead CSS for states the UI no longer has (Q-01, Q-02, Q-04,
   Q-07, C-03, C-04).
2. **One real per-question cost.** Combo matching unpacks every combo a board
   card belongs to before filtering, 60–170 ms per In-Depth question with a
   heavily-comboed card on the board; a prefilter gives identical output (K-01).
3. **Code that has to change in several places at once.** Four near-copy prompt
   branches (K-02), 10–11 positional arguments on rule search (K-03), two
   question tools hand-writing the same draft plumbing (Q-03), five copies of the
   retry-on-failure loader (Q-14).
4. **One 5,400-line stylesheet** that is four screens glued together, plus ~260
   lines of dead or duplicated rules (C-01…C-08).
5. **Test and tooling waste.** Three test files set the backend suite's wall time
   by rebuilding the same input (T-01); 20 test files leak temp folders —
   40,213 entries, 760 MB on the owner's machine (T-02); tests and eval code ship
   in the Lambda package (K-08 / T-10); seven TypeScript flags and ~17 lint rules
   already pass but are off (T-07, T-08).

## Verified by the driver

- K-01: `commanderSpellbook/matcher.ts:373-386` — `getVariant` runs on every
  candidate before the `fullyAssigned` / intent filter. Confirmed.
- C-02: `styles/flow.css:446` `[hidden] { display: none !important; }`. Confirmed.
- Q-04: `EnrichmentStep.tsx:652` returns early on `isConversationActive`; the
  plate at `:878` sits after it; the hook sets `answer` with `visibleMessages`
  (`useAskAiSubmitOrchestration.ts:162,178`). Confirmed by reading.
- T-06: `types/build-card-metadata.d.ts` is a `declare module "*.mjs"` wildcard.
  Confirmed.
- K-08 / T-10: `apps/backend/tsconfig.json` includes all of `src`, build is
  `tsc -p tsconfig.json`. Confirmed.

## Not cleanup — needs the owner (out of scope for a behavior-preserving pass)

- **In-Depth scanner refuses a duplicate Stack card with no message**
  (`ZoneCollectionStep.tsx:130-141` → `useScanCapture.ts:499` `blockedNotice`,
  never rendered). PRD `scan/README.md:140-143` says it must surface a message.
  Code-read only; a bug for its own kickoff.
- Feedback from any tool carries the hidden In-Depth flow once In-Depth was
  visited (Q behavior list).
- Resuming an In-Depth history entry from Life Tracker queues a roster seed
  (Q-13 behavior list).
- Every "Behavior changes" / "Appearance changes" list in the four files.

## Files owned by the pending 2026-10-17 briefs

Popups (`SheetShell`, `FeaturePortalMenu`, View Context), card search
(`QuickLookupApp`, `ZoneCardPicker`, `ZoneCollectionStep`, `TradeSide`,
`TradeBalancer`, `MtgAssistantApp` card-list effect, `cardMetadataStore`),
card rings (`CardPresentation.tsx`, ring CSS / U-07 de-dup), backend health
(`gameRulesRetrieval.ts` loaders `:32-372`, `catalog.ts`, `createApp.ts`,
`errorHandler.ts`, `routes/askAi.ts`, `ruleLayout.ts`, `embeddingModel.ts`,
`validation/askAiRequest.ts`). Each finding's `Overlap:` line names the brief.
The scanner brief shipped in #320.

## Already healthy — do not "fix"

Each findings file ends with its own list. Headline: TypeScript and ESLint are
clean; no backend import cycles; colours and shadows are on tokens; every
swallowed `catch` states its reason; the OpenAI provider's deadline logic is
careful; the flat `scripts/` layout is not worth a bulk move (667 path
mentions, a protected hook that cannot move); per-card and keyword-set rule
selection is complex on purpose (each rule tied to a REQ).
