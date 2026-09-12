# Slice D — prd-truth-apply

## Status: planned

## Goal

Record what slices A, B, and C actually shipped as durable product truth:
REQ-197, REQ-198, and REQ-199 in `PRD/sections/functional-requirements.md`;
DEC-084 amended in place in `PRD/sections/decisions/deployment.md`; and the
two `PRD/sections/system-map.md` entries updated. This is the one slice that
carries the PRD apply-by-intent step for this package.

## Requirements

1. `GATE-QUESTIONS.md`'s accepted diffs for REQ-197, REQ-198, REQ-199,
   DEC-084, and the two `system-map.md` entries are the *starting point*, not
   a blind replay. Before writing, re-check each diff's file paths, header
   values, and dates against what slices A/B/C actually shipped (exact new
   file names, the `security.txt` `Expires:` date chosen in slice B, the
   runbook's actual path from slice C) and correct anything that drifted.
2. Append REQ-197, REQ-198, and REQ-199 to
   `PRD/sections/functional-requirements.md` using the template in
   `PRD/instructions/requirement-format.md`, carrying the REQ-198 owner edit
   verbatim (the `security.txt` contact is the app's Send feedback action,
   `Contact: https://mtgjudge.gg/`, no email).
3. Amend DEC-084 in place in `PRD/sections/decisions/deployment.md` per the
   accepted diff: the `Decision` parenthetical names the response headers
   policy as a fourth attached thing; the `Impact` bullets restate why the
   bare apex stays the one canonical address and name the new hygiene
   bullet; `Related requirements` gains REQ-197/198/199; `Notes` gains the
   2026-09-11 measurement entry. No new `DEC-###` is minted (decision log is
   retired per `PRD/instructions/requirement-format.md`).
4. Amend `PRD/sections/system-map.md`'s `## AWS production deployment` and
   `### Serverless hosting` entries: `Backed by` gains REQ-197/198/199 on
   both; `Summary` gains the headers-policy and static-files sentences;
   `Lives in` gains the actual new file paths slices A/B/C created.
5. Every acceptance criterion in REQ-197/198/199 as recorded is checkable
   against what actually shipped — if a slice's implementation diverged from
   `GATE-QUESTIONS.md` in a material way (a different file name, a different
   header value), the REQ text reflects reality, and this slice's own
   `## Requirements` note names the divergence.

## Acceptance criteria

- [ ] D1 — `PRD/sections/functional-requirements.md` contains REQ-197,
      REQ-198, and REQ-199 entries following the requirement template, with
      REQ-198's Contact line matching the owner's edit verbatim (no email
      address).
- [ ] D2 — `PRD/sections/decisions/deployment.md`'s DEC-084 entry is amended
      in place (Decision, Impact, Related requirements, Notes) per the
      accepted `GATE-QUESTIONS.md` diff; no new `DEC-###` entry exists
      anywhere in `PRD/sections/`.
- [ ] D3 — `PRD/sections/system-map.md`'s `## AWS production deployment` and
      `### Serverless hosting` entries carry REQ-197/198/199 in `Backed by`,
      the updated `Summary` sentences, and a `Lives in` list matching the
      actual files slices A/B/C created.
- [ ] D4 — every file path named in the new REQ-197/198/199 acceptance
      criteria and the amended system-map `Lives in` list exists in the
      repository (no aspirational path left over from the proposal).
- [ ] D5 — `npm run quality:check` passes.

## Verification

```bash
npm run quality:check
```

## Files touched

- `PRD/sections/functional-requirements.md` (edit — append REQ-197, REQ-198, REQ-199)
- `PRD/sections/decisions/deployment.md` (edit — DEC-084 amended in place)
- `PRD/sections/system-map.md` (edit — two entries amended)

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged unless slice scoped a change
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/domain-corporate-network-reachability/` ready to delete
