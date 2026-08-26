---
status: active
---

# trade-balancer-spec

Write the current-state feature spec for the Trade Balancer feature — Phase A
#3 of the docs-refactor gameplan. Land it at
`PRD/sections/trade-balancer/README.md` on the DEC-168 template (the pattern
`sections/life-tracker/README.md` and `sections/user-feedback/README.md`
already established for Phase A #1 and #2). Frontend-only feature, but it
carries a corpus — apply the gameplan's `data/` bucket test and split the
corpus from the behavior. Consolidates current behavior only; kept draft and
non-authoritative, with `decisions.md` staying precedence #1.

## Backing sources (evidence, not yet read into a spec)

- `PRD/sections/decisions/trade-balancer.md` — DEC-087 (Card Trade Balancer:
  two-sided USD comparison, printing/foil/quantity, scan + manual-search
  input, missing-price handling), DEC-088 (printing-level price artifact:
  build, fields, lazy-load, no runtime sync)
- `PRD/sections/functional-requirements.md` — REQ-064 (two-sided trade
  balancer screen), REQ-065 (trade card entry — printing selection, foil
  toggle, quantity), REQ-066 (printing-level price data artifact), REQ-145
  (human-readable price freshness timestamp)
- `PRD/sections/user-flows.md` — FLOW-009 (build a two-sided trade and read
  the balance)
- `PRD/sections/non-functional-requirements.md` — NFR-013 (trade-price data
  footprint and freshness — lazy-load posture)
- `PRD/sections/system-map.md` — `## Trade balancer` entry (shipped; lists
  every source file and the destination-registry wiring)
- `PRD/sections/screen-layout.md` — `#### Trade Balancer` row (fit/containment
  bands, DEC-087, DEC-145, REQ-145)
- `PRD/sections/goals-and-non-goals.md` — pricing/printing-disambiguation
  non-goal narrowed by DEC-087

Shared/portal-level context (not owned by this feature, likely cited but not
consolidated here — the feature-portal spec, a later Phase A directory, owns
this):

- `PRD/sections/decisions/navigation.md` — DEC-089 (original top-level nav
  menu) was refined into the feature-portal package by DEC-095; trade-balancer
  registers as the `trade-balancer` destination there, not as its own nav
  chrome
- `PRD/sections/functional-requirements.md` — REQ-067 (feature portal — shared
  navigation, not trade-balancer-specific)
- `PRD/sections/user-flows.md` — FLOW-010 (switch destinations via the feature
  portal — shared flow)
- Routing: DEC-157 / REQ-140 give trade-balancer its flat URL
  (`/trade-balancer`), decided and owned at the portal/routing level
- `PRD/sections/decisions/ui-presentation.md` — DEC-145 (desktop shell width;
  general UI decision cited by the Trade Balancer screen-layout row, not
  trade-balancer-specific)

## Corpus — the `data/` bucket test

The gameplan's `data/` bucket membership test requires all four: an external
upstream source, a build/refresh command, a committed artifact, and content
that describes Magic, not TheJudge. Recording the check, not deciding the
spec's structure:

- External upstream source: Scryfall bulk data
  (`apps/frontend/data/scryfall/default-cards.json`, gitignored, same source
  the metadata pipeline already downloads)
- Build/refresh command: `scripts/build-card-prices.mjs`, wired into
  `npm run data:build`; refreshed via `npm run data:refresh`
  (Scryfall bulk download is human-approved before it runs, per DEC-088 and
  the root `README.md`'s data-pipeline notes)
- Committed artifact: `apps/frontend/public/data/cardPrintingPrices.json`
  (verified present in the working tree; one entry per paper printing —
  printing id, oracle id, name, set, collector number, image url, `usd` /
  `usd_foil`, plus a `snapshotDate`)
- Describes Magic, not TheJudge: yes — the artifact is per-printing card
  price/identity data, not TheJudge product configuration or behavior

All four hold, so this artifact qualifies for the gameplan's `data/` bucket.
The later spec must split this corpus out of the behavior doc rather than
describing the artifact's contents inline in `README.md` — mirroring how the
gameplan's Phase A file list carries `data/` as a sibling to each feature
directory. The exact split shape (a `data/` subfile vs. another structure) is
an authoring decision for refinement, not decided here.

## Reference implementation

`PRD/sections/life-tracker/README.md` and `PRD/sections/user-feedback/README.md`
(both DEC-168) are the worked templates: `Status:` / `Backed by:` header,
**What it is**, **How it works**, **Measured bounds**, **Rejected
alternatives and deferred scope**, **Where it lives**. Neither prior spec
carried a corpus, so trade-balancer is the first to exercise the corpus/
behavior split described above.

## Intake

- `intake/refactor-gameplan.md` — staged docs-refactor gameplan, copied
  verbatim from `.worktrees/.graph-intake/graph-20260825-190858/`. Evidence
  only, not authority. Do not open the documents it cites (`workflow.md`,
  `workflow-decomposition.md`, `answers.md`) — their paths only are recorded,
  in that file.

## Non-goals

No product-behavior decisions here. No `apps/` code change. No edit to
`PRD/sections/decisions/trade-balancer.md` or any other existing DEC/REQ/FLOW
body. No decision on the exact corpus/behavior split shape.

## Autonomous metadata

- Autonomous base: origin/thejudge-auto/trade-balancer-spec

## Preparation gate

- Quality-check: PASS
- Checked artifact: `PRD/work/trade-balancer-spec/DESIGN-BRIEF.md`
- Findings: none. Attempt 1 FAIL (Scope claimed two `PRD/README.md` nav rows;
  only one accepted/written) was fixed in `define` attempt 2 and re-verified
  clean in `gate-qc` attempt 2: Scope + assumption #5 now say one row,
  `PRD/README.md` confirmed to carry one Trade Balancer row, all cited IDs
  resolve with no contradiction to source bodies, and the corpus figures were
  re-verified against the committed artifact. (`gate-qc` PASS, 2026-08-25)

## Slices

| Slice | Scope | Dependency | Status |
| --- | --- | --- | --- |
| [A](./slice-a-verify-spec.md) | Verify `PRD/sections/trade-balancer/README.md` and `PRD/sections/trade-balancer/data/cardPrintingPrices.md` (both already committed) against their cited sources, the DEC-168 template, and the committed `cardPrintingPrices.json` artifact; close any confirmed, sourced gap with a bounded additive correction only. | none | planned |
| [B](./slice-b-diff-proof.md) | Verify the `PRD/README.md` Section Inventory row (already committed); prove the package-wide diff since its fork point touched nothing outside the licensed set. | none | planned |

GAMEPLAN: `PRD/work/trade-balancer-spec/GAMEPLAN.md`.

## Implementation map

- `PRD/sections/trade-balancer/README.md` — already written and committed
  (`41118d5`); verified (and, if needed, bounded-corrected) by slice A.
- `PRD/sections/trade-balancer/data/cardPrintingPrices.md` — already written
  and committed (`41118d5`); verified (and, if needed, bounded-corrected) by
  slice A.
- `PRD/README.md` — already carries one Section Inventory row for
  `sections/trade-balancer/`; verified by slice B, alongside the
  package-wide diff-scope proof.

## Next step

`/thejudge-implement PRD/work/trade-balancer-spec/ slice A` (Claude Code) or
`$thejudge-implement PRD/work/trade-balancer-spec/ slice A` (Codex). Slice B
has no ordering dependency on A.
