# Slice F — Answer-quality comparison

## Status: planned

## Goal

Ship the opt-in, confirmation-gated live-provider A/B and record its reviewed
conclusion, so the enrichment's effect on answers is observed rather than assumed.

## Requirements

1. `scripts/compare-combo-answer-quality.mjs` answers each curated combo scenario
   twice against the configured live provider — once with the committed catalog
   loaded, once with combo enrichment disabled — and writes both answers side by
   side for human review.
2. Enrichment is disabled through backend runtime configuration only: build two
   configured apps in one process with different env objects
   (`COMBO_ENRICHMENT_ENABLED` true/false). No request field, response field, Zod
   schema, route, provider selection, or public contract changes.
3. The script refuses to contact the provider unless `--confirm-live-calls` is
   supplied, mirroring the corpus refresh's human-approved network gate. Without
   the flag it prints what it *would* do and exits 0.
4. Output goes to `output/combo-answer-quality/`, gitignored alongside the
   existing `output/prompt-preview/` and `output/retrieval-relevance-report.txt`
   entries. Only the dated human-reviewed conclusion becomes durable history.
5. Curated scenarios are committed (they are inputs, not output) and reuse the
   slice E eval fixtures where they fit rather than duplicating request payloads.
6. Never added to `npm run quality:check`, never asserted against a golden, never
   a build gate. The script's own unit tests cover flag gating and output shaping
   with a stubbed provider — they never make a network call.
7. The reviewed conclusion is recorded in this slice doc and carried into the
   cleanup receipt.

## Acceptance criteria

- [ ] Run without `--confirm-live-calls` makes zero network calls (asserted with a
      stubbed provider), prints the intended scenario list, and exits 0
- [ ] Run with the flag but no live provider configured fails with a clear message
      naming `ASK_AI_PROVIDER` rather than a stack trace
- [ ] Both legs execute in one process; the enriched leg's assembled prompt
      contains `COMMANDER SPELLBOOK COMBO CONTEXT` and the disabled leg's does not
- [ ] Disabling enrichment changes no request or response shape — the two legs'
      payloads differ only in prompt text
- [ ] Output is written under `output/combo-answer-quality/` and
      `git status --porcelain` is clean after a run
- [ ] `npm run quality:check` does not invoke the script (grep the script chain)
- [ ] `package.json` exposes the run as a named script consistent with
      `prompt:preview` / `retrieval:report` naming
- [ ] **Owner action:** one approved live run executed, both answer sets reviewed
      by a human, and the dated conclusion recorded below
- [ ] Conclusion states plainly whether the enrichment improved the answers,
      including a negative or inconclusive result — this is informational and does
      not block the ship (DEC-161)

## Reviewed conclusion

_Recorded after the owner-approved live run. Date, scenarios compared, and the
human verdict. Carried verbatim into the cleanup receipt._

## Verification

```bash
node scripts/compare-combo-answer-quality.mjs          # no flag: dry, no network
npm run test:scripts
npm run quality:check
```

## Files touched

- `scripts/compare-combo-answer-quality.mjs` (new)
- `scripts/compare-combo-answer-quality.test.mjs` (new)
- `scripts/fixtures/combo-answer-quality-scenarios.json` (new, curated inputs)
- `.gitignore`
- `package.json`

## PRD promotion checklist

Executed by `thejudge-cleanup`, not here. Listed so nothing is lost when the
package folder is deleted.

- [ ] `sections/system-map.md` — flip **Commander Spellbook combo artifact build**
      and **Commander Spellbook combo retrieval** from `planned` to `shipped`, and
      replace the `(planned)` path prefixes with real ones (doc-lifecycle's
      system-map promotion gate: code wired in **and** receipt written)
- [ ] `sections/goals-and-non-goals.md` — drop `(status: planned)` from the
      Commander Spellbook planned-capability line
- [ ] `sections/integrations-and-data.md` — Commander Spellbook Combo Data
      Strategy loses its "planned" framing; confirm the artifact paths as built
- [ ] `sections/decisions/combo-retrieval.md` — DEC-116 / DEC-161 stay
      `confirmed`; record any behavior that diverged from the decision as a new
      DEC rather than an edit
- [ ] `sections/functional-requirements.md` — reconcile REQ-093/094/095/146 Notes
      with the real script names, config flag, and artifact paths as shipped
- [ ] Receipt at `PRD/instructions/receipts/commander-spellbook-combos-<YYYY-MM-DD>.md`
      carrying slice F's reviewed conclusion verbatim
- [ ] Remove the slug row from `PRD/work/STATUS.md` and delete the package folder

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged unless slice scoped a change
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/commander-spellbook-combos/` ready to delete
