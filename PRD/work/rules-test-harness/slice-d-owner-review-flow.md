# Slice D — Owner review flow: render and apply

## Status: planned

## Goal

The owner gets a batch of pending cases to read, fills in approve, reject or edit for each, and one command writes the verdicts into the case files. Approving a case records the fingerprint of the text the owner saw. An approved case whose official text later changed comes back in the next batch marked stale.

## Depends on

Slice A (loader, stale comparison). Slice C is a soft dependency: after an approve, C's filter selects the case again.

## Product truth applied at build (A21)

None. REQ-224 is applied in slice E, where its coverage-file step lands (A21). Slice D builds steps 1 to 4 of the flow; E adds step 5 (A20).

## Requirements

1. Render command (proposed `npm run eval:rules-review:render`) writes pending cases in batches to a gitignored `output/rules-review/` file (add the ignore line to `.gitignore`). Pending means every `draft`, every `approved` case slice A's stale comparison flags, and, on request, `needs-edit` cases. Batches are grouped by mechanic, then by rules section. A stale case is marked stale and its entry names each changed dependency and shows that dependency's current committed text. Each case carries a verdict slot: approve, reject, or edit with a required note.
2. Apply command (proposed `npm run eval:rules-review:apply`) reads a filled batch and writes `review.status` (`approved`, `rejected`, `needs-edit`), `review.reviewedOn` and the note into each case file. On `approve` it also re-records the case's `snapshot` hashes from committed data. It changes no other field and is the only command that writes `snapshot` after a case is authored (the 18 migrations at slice A count as authoring).
3. Refusals, each reported: a case id it cannot find; a case whose question or `expected.answer` changed since the render; a case whose committed rule, oracle or ruling text changed since the render; an `edit` with no note. An `edit` never changes a tier-1 or tier-2 reference answer to non-official text; the rework may change the question, the attached cards or the official source, and the case returns to `draft`.
4. No agent verdict: nothing in this slice, or any later slice, sets a case `approved` except through the apply command (and the slice A carve-out for the 18).
5. The apply command's `coverage.json` rewrite is added in slice E, which creates that file (A20).

## Acceptance criteria

- [ ] **D1.** Round-trip test: render a batch, fill verdicts, apply; the apply changes only `review.*`, plus `snapshot` on an `approve` verdict
- [ ] **D2.** Stale path test: a fixture approved case whose ruling hash no longer matches is rendered marked stale with the changed dependency's current text; applying `approve` re-records its hashes, after which slice A's stale comparison passes and slice C's filter selects it again
- [ ] **D3.** Refusal tests: unknown case id, question changed since render, `expected.answer` changed since render, committed rule/oracle/ruling text changed since render, and `edit` with no note are each refused and reported
- [ ] **D4.** An `edit` verdict leaves the case at `draft` and never replaces a tier-1 or tier-2 reference answer with non-official text (test)
- [ ] **D5.** Batches are grouped by mechanic then rules section, and `output/rules-review/` is gitignored
- [ ] **D6.** Tests place per A3: logic needing no TypeScript runs under `test:scripts` (`node --test`, injected fakes); anything needing TypeScript is a backend vitest test
- [ ] **D7.** `npm run quality:check` is green

## Verification

```bash
npm run test:scripts
npm --workspace apps/backend run test
npm run quality:check
```

## Files touched

- scripts/rules-review.mjs (or two scripts: render, apply) (new)
- scripts/lib/rules-review.mjs (new) and its test
- package.json (script entries)
- .gitignore (output/rules-review/)
