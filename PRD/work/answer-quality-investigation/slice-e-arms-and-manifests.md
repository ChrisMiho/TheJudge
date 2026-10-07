# Slice E — Diagnostic arms and manifests

## Status: planned

## Dependencies

Slices A (arm key), C (judge and record shape), D (trace feeds manifest selection)

## Goal

Test-only prompt variants separate presentation from evidence, confined to a committed diagnostic case set, with a held-out set kept away from them.

## Requirements

1. REQ-230 (new) and REQ-185 amend: arms A, B, C, D, P per brief section 4.6 as pure functions from the prompt prepared by the checkout and its committed data; revision id on every record; nothing under `apps/backend/src/prompt/`, routes or providers changes.
2. Arm B groups, reorders and headers the same evidence units without adding, removing or rewording; its exact grouping is chosen from observed prompts and frozen under a revision id. Arm C = A plus the case's deciding-rule bundle (rule, parent, lettered subrules, de-duplicated, in rule-index format). Arm D = C's evidence in B's presentation. Arm P = A with one preamble sentence replaced from an owner-approved correction file; built but refused until that file exists.
3. Arms C, D, P run only on the diagnostic manifest; records marked `diagnostic: true`; no arm sees the reference answer; held-out manifest runs only arm A.
4. A seeded, recorded command writes two committed ID-and-hash manifests under `apps/backend/src/eval/answer-quality/manifests/`: diagnostic (~47) and held-out (80, rules-section-stratified, disjoint). Sizes adjustable only from measured counts with a recorded reason.
5. Wire `--arm` into experiment mode. Offline only.

## Acceptance criteria

- [ ] E1: A test shows, for every diagnostic case, arm B's evidence units equal arm A's, arm C adds only bundle rules, and arm D's units equal C's
- [ ] E2: A test shows no arm output or arm input contains any reference answer text
- [ ] E3: A test shows arm P is refused until the approved correction file exists
- [ ] E4: A test shows arms C, D, P are refused on a case outside the diagnostic manifest and diagnostic records carry `diagnostic: true`
- [ ] E5: A test asserts the diagnostic and held-out manifests are disjoint, hold ids and hashes only, and held-out runs only arm A
- [ ] E6: The manifest generator is seeded and re-running it reproduces both committed files byte-for-byte
- [ ] E7: Arm records carry an arm revision id; `apps/backend/src/prompt/`, routes and providers have no diff versus origin/main
- [ ] E8: Typecheck passes

## Verification

```bash
npm run test:scripts
build-answer-quality-manifests
git diff --stat origin/main
npm run typecheck
```

No live OpenAI call; fake clients and stored fixtures only.

## Files touched

- `scripts/lib/diagnostic-arms.mjs (new)`
- `scripts/lib/diagnostic-arms.test.mjs (new)`
- `scripts/build-answer-quality-manifests.mjs (new)`
- `apps/backend/src/eval/answer-quality/manifests/diagnostic.json (new)`
- `apps/backend/src/eval/answer-quality/manifests/held-out.json (new)`
- `scripts/eval-answer-quality.mjs`
- `package.json`
