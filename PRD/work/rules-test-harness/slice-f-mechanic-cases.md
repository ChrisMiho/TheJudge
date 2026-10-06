# Slice F — 255 mechanic cases and the coverage gate in quality:check

## Status: done

## Goal

Every real Magic mechanic in the committed rule index has at least one rules test case, drafted for the owner to approve. From this slice on, a pull request fails if a real mechanic has no case.

## Depends on

Slices A through E. Authoring needs the loader (A), the gate and vector build (B), the coverage report (E).

## Product truth applied at build (A21)

REQ-188 (functional-requirements, the first diff in the REQ-188 slot), REQ-223, NFR-018 (both its diff in `non-functional-requirements.md` and the goals-and-non-goals Non-Goals line in the same slot), and the system-map `## Eval harness` summary edit (the second diff in the REQ-222 slot). Re-derive each by intent against current truth. After this slice the B entry's `partial` status stays until cleanup promotes it.

The build re-derives each edit by intent against current `PRD/sections/` truth, together with the code in this slice's work. `GATE-QUESTIONS.md` holds the approved diff (every verdict `accept`).

## Requirements

1. Author 255 cases, all `review.status` `draft` (no agent sets `approved`), one per mechanic not yet covered: 258 in the index, minus 701.45 Assemble and 702.158 Space Sculptor (Q-007 accept), minus 702.19 Trample (already covered by a migrated case). Split by family: 701 actions 66 (701.2-701.68 minus 701.45); 702.2-702.100 keyword abilities 98 (minus Trample); 702.101-702.192 keyword abilities 91 (minus Space Sculptor). 66 + 98 + 91 = 255. Each family ends with the coverage command rerun and a green `quality:check`.
2. Each case's `expected.decidingRuleIds` lists its mechanic's own 701/702 rule (so the derived `mechanic:` tag and the ratchet both work). Answer route per mechanic (M3): 226 by a WotC ruling on a card carrying the keyword (tier 2, ruling text verbatim); about 30 by a ruling on a card whose oracle text names the mechanic (confirm case by case that the ruling is about the mechanic, otherwise fall back to the rule's own text as tier 1); 2 by the rule's own text only (701.32 Set in Motion, 702.59 Recover; tier 1). Questions are written in the project's own words; answers are official text verbatim (the licensing constraint).
3. Every named card is attached (`cards`). Every case passes the card check. Build each case's frozen query vector (slice B's command). Record the ratchet baseline with slice B's raise command; a mechanic whose own rule does not reach the prompt is recorded as a miss, not hidden.
4. Include the Attraction mechanics (701.51, 701.52, 702.159) and Infinity (702.186) as real mechanics (Q-007 accept, findings 1 and 3).
5. Run `npx prettier --write` on authored case files and generated vector and baseline files; `format:check` is part of `quality:check`.
6. Wire the coverage gate into `quality:check` (a `node --test` test under `scripts/` that runs the gate against the real corpus, so `test:scripts` carries it), and rewrite `coverage.json` with the coverage command.
7. The five newer-than-index mechanics (Heal, Recruit, Power-up, Teamwork, Storied) are not in the index and get no case; that is a finding for the deferred rules-data refresh, not this run (finding 5).

## Acceptance criteria

- [x] **F1.** The corpus holds 273 cases after F (18 migrated + 255 mechanic drafts); every one of the 255 new cases is `draft`
- [x] **F2.** The coverage report shows 66 actions, 98 abilities in 702.2-702.100 and 91 in 702.101-702.192 newly covered, and no mechanic uncovered except the two excluded ids
- [x] **F3.** The coverage gate runs in `quality:check` (through `test:scripts`) and passes
- [x] **F4.** Every case passes the card check and has a frozen query vector; the ratchet baseline is recorded for all 273
- [x] **F5.** Each mechanic case lists its mechanic's own 701/702 rule in `expected.decidingRuleIds`, and its derived `mechanic:` tag matches (loader test over the real corpus)
- [x] **F6.** Authored case files and generated vector and baseline files pass `format:check`
- [x] **F7.** The 30 text-route mechanics were each checked: the ruling used is about the mechanic, or the case falls back to the rule's own text as tier 1 (dated observation line in `slice-f.evidence.md`)
- [x] **F8.** REQ-188, REQ-223, NFR-018, the goals-and-non-goals Non-Goals line and the system-map `## Eval harness` summary are applied by intent against current truth
- [x] **F9.** `npm run quality:check` is green

## Verification

```bash
npm run eval:rules-coverage
npm run test:scripts
npm --workspace apps/backend run test
npx prettier --check apps/backend/src/eval
npm run quality:check
```

## Build note (graph node 6)

The repo's format gate is `npm run format:check` (Prettier over JSON and YAML only). `npx prettier --check apps/backend/src/eval` also lists TypeScript files that were never Prettier-formatted before this package, so the build verified the authored files with `npx prettier --check "apps/backend/src/eval/**/*.json"` and `npm run format:check` instead. Each mechanic case carries an optional `source.pool` of `mechanic`, which the coverage report counts by (see the corpus README). Evidence for F7 and the route split: `slice-f.evidence.md`.

## Files touched

- apps/backend/src/eval/worked-solutions/*.case.json (255 new)
- apps/backend/src/eval/rules-gate/ (vectors, baseline regenerated)
- apps/backend/src/eval/answer-quality/coverage.json
- scripts/ (the quality:check wiring test for the coverage gate)
- PRD/sections/functional-requirements.md, non-functional-requirements.md, goals-and-non-goals.md, system-map.md
