# Slice F — Wait inscription

## Status: planned

## Goal

While the judge is thinking, the wait inks itself in, inside the judge's
bubble — replacing the separate waiting panel — using the same CSS-only
motion rule as the ambient scene.

## Dependencies

Slice C (Ask a Question's chat), slice E (In-depth details' chat, which the
brief says shares the same chat as Ask a Question).

## Requirements

Realises these `GATE-QUESTIONS.md` ids, applied to `PRD/sections/` by intent
together with the code:

1. REQ-023 — the wait inks itself in, inside the judge's bubble. It keeps
   its place (replacing the submit form, per `A13`) and the chat opens on
   the first answer as today.
2. NFR-006 — the new wait and the colour scene stay CSS-only motion
   (`transform`/`opacity`), honouring `prefers-reduced-motion`. The scene's
   own CSS-only rule shipped in slice A; this slice is where the rule's
   second named case (the wait) is realised and the requirement text is
   completed.

## Files touched

- `apps/frontend/src/components/AskAiWaitingPanel.tsx` (+ `.test.tsx`) —
  ink-in animation inside the bubble, reduced-motion fallback.
- `apps/frontend/src/lib/askAiWaitStages.ts` — thresholds (0/3/8/15/25/40s)
  stay; only the presentation changes.
- `PRD/sections/functional-requirements.md`,
  `PRD/sections/non-functional-requirements.md` — apply REQ-023 and
  NFR-006 by intent.

## Tests

- `AskAiWaitingPanel.test.tsx` — ink-in stages at existing thresholds, still
  under reduced motion.

## Acceptance criteria

- [ ] F1. `npm run quality:check` passes.
- [ ] F2. `npm --workspace apps/frontend run test` passes.
- [ ] F3. The wait renders inside the judge's bubble, replacing the
      composer, at the existing 0/3/8/15/25/40s thresholds.
- [ ] F4. `PRD/sections/` carries REQ-023 and NFR-006 by intent.
- [ ] F5 (manual). Browser scenario: the wait's ink-in motion is CSS-only
      (`transform`/`opacity`, no canvas/script loop) and stills under
      `prefers-reduced-motion: reduce`.
- [ ] F6 (manual). No REQ-202 pair required — this slice touches only
      `AskAiWaitingPanel.tsx` and its own styles, not shared chrome, the
      token set, or the shared stylesheet; recorded here as the explicit
      scope decision the gameplan requires.
- [ ] F7 (manual). Cleanup evidence recorded: browser closed, owned servers
      stopped, ports released, capture output path named.

## Verification

```bash
npm run quality:check
npm --workspace apps/frontend run test
```

## Files touched

(see above)
