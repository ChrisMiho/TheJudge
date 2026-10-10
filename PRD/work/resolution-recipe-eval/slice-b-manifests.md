# Slice B — Manifests: recorded append and verifying check

## Status: planned

## Goal

New approved cases can join the committed diagnostic set as a recorded group
without re-drawing the held-out set, and `--check` verifies what is committed
instead of failing on a fresh draw.

## Requirements

1. `--append-diagnostic <ids> --reason <text>` adds approved cases to the committed diagnostic manifest as a recorded group; it refuses any held-out or non-approved id.
2. `--check` verifies the committed files (every listed case present with matching question and answer hashes) and reports drift without failing; a re-draw keeps appended groups.
3. Update the usage header of `scripts/build-answer-quality-manifests.mjs`, the test named at brief row 72, and the manifests paragraph of `apps/backend/src/eval/worked-solutions/README.md`.
4. Apply the accepted REQ-230 block lines for appended groups and the new `--check` meaning in `PRD/sections/functional-requirements.md`.

## Acceptance criteria

- [ ] Append of an approved id adds a group with its reason and leaves the held-out manifest byte-identical (test)
- [ ] Append refuses a held-out id and refuses a non-approved id (tests)
- [ ] A re-draw keeps appended groups (test)
- [ ] `--check` exits 0 on the committed files and prints drift as information (test, plus a run on the repo)
- [ ] The test formerly named for byte-for-byte reproduction is renamed to the verification meaning
- [ ] The REQ-230 appended-group and `--check` lines match the accepted block

## Verification

```bash
node --test scripts/build-answer-quality-manifests.test.mjs
npm run eval:answer-quality:manifests -- --check
```

## Files touched

- `scripts/build-answer-quality-manifests.mjs`, `scripts/build-answer-quality-manifests.test.mjs`
- `apps/backend/src/eval/worked-solutions/README.md`
- `PRD/sections/functional-requirements.md` (REQ-230)
