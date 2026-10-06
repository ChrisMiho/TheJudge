# Slice G — 120 hard-area cases, tester cases, REQ-185 applied

## Status: done

## Goal

The corpus grows to 393 cases: 120 more cover the twelve rules areas players get wrong most, including the two tester cases the owner wants answered correctly. At least a third of the 120 are cases where the answer is 'no, it does not work', so the corpus cannot teach the AI that everything works.

## Depends on

Slices A through F. Last slice.

## Product truth applied at build (A21)

REQ-185 (functional-requirements entry), applied by intent against current truth. Its run-1 authoring criterion is true only once these 120 cases exist. Include the carve-out wording for the 18 first-ship cases (A1) and the README criterion.

The build re-derives each edit by intent against current `PRD/sections/` truth, together with the code in this slice's work. `GATE-QUESTIONS.md` holds the approved diff (every verdict `accept`).

## Requirements

1. Author 120 hard-area cases, all `draft`, over one list of twelve areas: copies (707), layers (613), continuous effects (611), replacement and prevention (614-616), triggered abilities (603), resolution (608), combat (508-510), state-based actions (704), double-faced cards (712), multiplayer (801), Two-Headed Giant (810), Commander (903). Every area is represented (A16).
2. 60 from unused CR `Example:` lines (113 unused of 126 in the hard areas; every area's lines before a second from the same rule; unused per area: combat 6, triggers 10, resolution 7, continuous effects 6, layers 10, replacement/prevention 13, SBA 1, copies 21, double-faced 10, multiplayer 15, two-headed giant 9, Commander 5). Tier 1, answer is the Example text verbatim.
3. 58 from WotC rulings that name a second committed card (2,651 in the hard areas), tier 2, ruling text verbatim, weighted toward replacement-effect ordering, cleanup-step timing, the post-2024 combat damage rule 510.1c and copy effects. Q-008 is accepted at 0 extra tier-3 drafts, so none of the 58 slots is swapped.
4. 2 tester cases as tier-3 drafts. Q1: Academy Manufactor with Esix, Fractal Bloom creating a Treasure (the owner picks the order of the replacement effects; Manufactor first gives three, Esix first gives one), deciding rules 614.1a, 616.1, 616.1e, 616.1f. Q2: the Silence, Necropotence, Borne Upon a Wind cleanup-step case specified in `### Tester case Q2` of the brief (cards all attached, expected outcome `works`, deciding rules 514.1, 514.2, 514.3a; `source.research` names "Jon's Rulemancer app, screenshots shared with the owner, 2026-10-06" in words, never the intake path; no text from Jon's app is copied; the answer is written from the CR derivation alone; Jon's two-step wording goes in `layers.variants`). Both stay `draft`; both are authored from the CR derivation, never from outside text.
5. At least a third of the 120 (40 or more) have `outcome` `does-not-work`; the coverage report counts per `outcome` and proves it. Supply is measured: 20 negative-phrased `Example:` lines, 1,232 negative-phrased two-card rulings (M16); each case's outcome is set when authored.
6. Every case passes the card check; build frozen query vectors; rewrite `coverage.json`; re-record the ratchet baseline at the end. `format:check` passes on all authored files.
7. Bring the corpus README up to REQ-185's README criterion, including slice D's and E's commands.
8. No live run is needed to merge (A6, non-goals): do not call a provider.
9. Promotion checklist for cleanup: confirm every stable ID this package applied is present in `PRD/sections/` and the system-map `Rules test corpus gates and review` entry is ready to promote from `partial` to `shipped` at cleanup under the promotion rule.

## Acceptance criteria

- [x] **G1.** The coverage report shows 120 hard-area cases split 60 `Example:` lines, 58 two-card rulings, 2 tester cases; the corpus holds 393 cases in total
- [x] **G2.** At least 40 of the 120 hard-area cases have `outcome` `does-not-work`, shown by the coverage report's per-outcome counts
- [x] **G3.** All twelve hard areas are represented, SBA by its one unused `Example:` line
- [x] **G4.** Q2 (Silence, Necropotence, Borne Upon a Wind) is a tier-3 `draft` with all three cards attached, outcome `works`, deciding rules 514.1, 514.2, 514.3a, `source.research` naming Jon's app in words and no copied text, and Jon's two-step wording in `layers.variants`
- [x] **G5.** Q1 (Academy Manufactor with Esix) is a tier-3 `draft` with deciding rules 614.1a, 616.1, 616.1e, 616.1f
- [x] **G6.** Every case passes the card check and has a frozen query vector; the ratchet baseline is re-recorded
- [x] **G7.** Both gates pass in `quality:check`: the offline prompt gate and the coverage gate
- [x] **G8.** The corpus README names format version 2, the loader, the review commands (slice D) and the coverage and staleness commands (slice E), meeting REQ-185's README criterion
- [x] **G9.** REQ-185 is applied to `PRD/sections/functional-requirements.md` by intent, with the 18-case carve-out wording
- [x] **G10.** No provider call was made during the slice: no `--confirm-live-calls` run (dated observation line in `slice-g.evidence.md`)

## Verification

```bash
npm run eval:rules-coverage
npm run test:scripts
npm --workspace apps/backend run test
npm run quality:check
```

## Files touched

- apps/backend/src/eval/worked-solutions/*.case.json (120 new)
- apps/backend/src/eval/worked-solutions/README.md
- apps/backend/src/eval/rules-gate/ (vectors, baseline regenerated)
- apps/backend/src/eval/answer-quality/coverage.json
- PRD/sections/functional-requirements.md (REQ-185)

## Ship gates

- [x] Slice acceptance criteria satisfied and verified
- [x] Tests updated; `npm run quality:check` green for touched areas
- [x] Public contract unchanged unless slice scoped a change
- [x] No secrets committed
- [x] Durable outcomes promoted; `PRD/work/rules-test-harness/` ready to delete
