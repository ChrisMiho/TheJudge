status: refined

# Trade Balancer price artifact slim

Make the Trade Balancer open fast by moving pricing to the backend and deleting
the committed ~38 MB frontend price file (`cardPrintingPrices.json`). Prices are
served from a committed backend artifact on demand (one card at a time, cached
per session, mirroring the card-detail route), card identity comes from the slim
shared `cardMetadata` index, and player-facing behavior is unchanged. See
`DESIGN-BRIEF.md` for the reshaped design and `GATE-QUESTIONS.md` for the
proposed product-truth amendments.

> **Reshaped 2026-09-07.** This supersedes the earlier frontend-only slim
> (derive `imageUrl`, reconstruct `name`/`setName`, keep it frontend-only). The
> owner decided to move pricing to the backend instead; `IDEA.md` and the intake
> record the original framing.

## Autonomous metadata

- Autonomous base: origin/main

## Preparation gate

- Quality-check: PASS (build-half re-grade, run graph-20260907-235620, of the gate-finalized proposal — all ten verdicts accept, BLOCK-01 = A, nothing changed since the kickoff-half PASS; every load-bearing diff re-verified byte-for-byte against live PRD/sections and the cited code)
- Checked artifact: `PRD/work/trade-balancer-price-slim/DESIGN-BRIEF.md`
- Findings: none
