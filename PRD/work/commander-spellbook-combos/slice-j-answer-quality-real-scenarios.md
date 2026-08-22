# Slice J — Answer-quality comparison with real oracle ids; ship gates

## Status: done

J1–J5 (code and verification) are complete. J6 and J7 are owner-only manual
criteria — per this package's own established precedent, an owner-action
checkpoint does not block shipping the surrounding code; see
`## Owner-action checkpoints` in the package README.

## Goal

Replace slice F outright. Fix the answer-quality comparison so its two legs
can actually differ, then close the package: this is the final slice.

## Requirements

1. DEC-161, REQ-146 — the comparison script's curated scenarios currently
   reference the eval fixtures' synthetic oracle ids (`eval-oracle-a`, …),
   which exist in no real corpus; both A/B legs would produce byte-identical
   prompts and spend live provider calls proving nothing.
2. Slice E's finding (verified 2026-08-12) — the eval catalog stays
   independent from the production artifact; scenarios get real oracle ids
   through inline `request` payloads, not by pointing the eval fixtures at
   real cards.
3. Two owner-action checkpoints remain, and neither this slice nor any
   agent may self-authorize either:
   - **Production corpus refresh** — actually invoking the live bulk-export
     download for real. This slice's own verification runs against
     realistic sample/fixture-scale data (slices G–I), not the live network.
     The real committed corpus lands only when the owner explicitly approves
     that specific live call, separate from the architecture approval
     already given for DEC-162.
   - **Live provider A/B** — costs money, needs `ASK_AI_PROVIDER=openai` and
     a real key; the script ships complete and refuses to run without
     `--confirm-live-calls`. The owner triggers the run and reviews the
     output; its *conclusion* informs the ship decision without blocking it
     (DEC-161).

## Acceptance criteria

- [x] J1 — curated comparison scenarios reference real oracle ids present in
      the corpus built by slice G, supplied via inline `request` payloads —
      not via the eval fixtures. **As built:** all 6 scenarios rewritten with
      inline requests using real oracle ids/variants from a real bulk-export
      fetch (2026-08-22): `5702-8097` (Avatar of Growth + Springheart Nantuko,
      no template) covers complete/partial/wrong-zone/lookup scenarios;
      `2178-4247-6542--110` (a real variant with a genuinely unresolved
      template — no query, no mapping) covers the unresolved-template
      scenario.
- [x] J2 — with a real corpus loaded, the two legs (`COMBO_ENRICHMENT_ENABLED`
      on vs. off) produce genuinely different assembled prompts for at least
      one curated scenario — proof the fix works, checked against prompt
      text, not the live provider. Proved directly in
      `comboPromptIntegration.test.ts` using the real scenario JSON.
- [x] J3 — the script still refuses to contact the provider without
      `--confirm-live-calls`, and comparison output still writes to
      gitignored `output/combo-answer-quality/`.
- [x] J4 — `npm run quality:check` is green.
- [x] J5 — the full package diff (`git diff --name-only
      origin/feature/enhancement-bangers...HEAD` — the recorded autonomous
      base, not literal `main`) touches only files named across slices A–J's
      `## Files touched` plus this package's own docs and already-promoted
      `PRD/sections/`. Verified file by file.
- [x] J6 (manual) — the owner has explicitly approved running the real
      production corpus refresh (the live bulk-export download), separately
      from the architecture decisions already recorded in DEC-162. **Done
      2026-08-22:** 106,182 real variants committed; see DESIGN-BRIEF's
      `### Measured 2026-08-22` note for the real committed size and two bugs
      the live run surfaced (a V8 string-length limit, and one Scryfall query
      404 that used to abort the whole refresh).
- [ ] J7 (manual) — the live provider A/B has been run and its conclusion
      recorded, per DEC-161.

## Verification

```bash
npm --workspace apps/backend run test -- commanderSpellbook prompt eval
npm --workspace apps/backend run typecheck
npm run lint
npm run quality:check
```

## Files touched

- `scripts/compare-combo-answer-quality.mjs`
- `apps/backend/src/eval/fixtures/commander-spellbook-*` (verification only — no expected content change; slice E's independence from production data is preserved, not "fixed")

## PRD promotion checklist — for `thejudge-cleanup`

- [ ] `PRD/sections/decisions/combo-retrieval.md` — DEC-116, DEC-161, DEC-162
      already present and confirmed (committed in `05895b5`); no new decision
      needed for this package.
- [ ] `PRD/sections/functional-requirements.md` — REQ-093, REQ-094, REQ-095,
      REQ-146 already present and confirmed; no renumbering.
- [ ] `PRD/sections/user-flows.md` — FLOW-015 already present and confirmed.
- [ ] `PRD/sections/integrations-and-data.md` — Commander Spellbook data
      strategy section already corrected for bulk export / camelCase /
      `data:refresh` wiring; confirmed, not re-edited.
- [ ] `PRD/sections/system-map.md` — flip the two Commander Spellbook entries
      ("Commander Spellbook combo artifact build" and "Commander Spellbook
      combo retrieval") from `(planned)` to shipped, once slices G–J's code
      is merged.
- [ ] Receipt at `PRD/instructions/receipts/commander-spellbook-combos-<date>.md`,
      written before the folder is deleted, listing every file created,
      updated, and deleted, and the verification results — including whether
      the two owner-action checkpoints (J6, J7) were completed before ship
      or are carried forward as recorded follow-ups.
- [ ] `PRD/work/commander-spellbook-combos/` deleted with `git rm -r`, and the
      slug removed from every section of `PRD/work/STATUS.md`.
- [ ] No `## Graph run` section: this package predates `graph-run` and holds
      no `GRAPH-RUN.md`. Do not add an empty one.

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged unless slice scoped a change
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/commander-spellbook-combos/` ready to delete
