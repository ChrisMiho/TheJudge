# Work package status board

Skill-maintained. Glance with `ls PRD/work/*/STATUS.*` or this file.
Vocabulary and transition rules: `PRD/instructions/workflow-reference.md`.
Do not rename package folders to encode status.

## ship-ready

## active

## refined

## refining

## ideation

- [single-source-invariants](single-source-invariants/) — de-duplicate cross-cutting product-truth invariants (rules asserted in 3+ files, e.g. "one main endpoint") into one canonical home each + a grep-before-amend guardrail; bounded corpus hygiene, not an ID-system rewrite. Seeded 2026-09-04 from the image-first-cards D5 near-miss. To implement next, after image-first-cards ships.

## owner-action

- [image-first-cards](image-first-cards/) — Slices A + B built, verified, and pushed (PR #185: new `GET /api/cards/:oracleId` endpoint + on-demand popup across all surfaces; ask-ai resolves card text server-side, byte-identical proven). Slice C (slim the up-front list) is blocked on one owner decision: NFR-019's ≥80%-gzipped-reduction target is structurally unreachable — measured 48.1% (kept `cardId`/`imageUrl` barely compress), though the delivered 2.20 MB gzipped is inside NFR-019's own ~1–2 MB estimate. Pick how to restate NFR-019 (rec: an absolute ≤2.3 MB gzipped ceiling) — 4 options in `GRAPH-RUN.md` `## Open gate` / PR #185 blocker comment — then `/graph-implement PRD/work/image-first-cards/` commits C, reviews, and parks at land.

## deferred

## parked in ideasForLater

Moved out of the lifecycle on 2026-08-22 to clear the board. Artifacts are
preserved verbatim under `PRD/ideasForLater/<slug>/`, including each package's
`STATUS.*` marker file recording the stage it was at when parked. To resume
one, move the folder back to `PRD/work/<slug>/` and re-list it under the
matching heading above — the `thejudge-*` skills only look inside `PRD/work/`.

| Package | Stage when parked |
| --- | --- |
| [ai-answer-quality-baseline](../ideasForLater/ai-answer-quality-baseline/) | ideation |
| [card-collection-manager](../ideasForLater/card-collection-manager/) | ideation |
| [context-ai-photo-card-id](../ideasForLater/context-ai-photo-card-id/) | refining |
| [graph-workflow](../ideasForLater/graph-workflow/) | unregistered (braindump + spine plan, no `STATUS.*`) |
| [life-tracker-me-map-and-tray](../ideasForLater/life-tracker-me-map-and-tray/) | ideation |
| [scan-non-english-special-treatments](../ideasForLater/scan-non-english-special-treatments/) | ideation |
