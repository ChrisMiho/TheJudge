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

- Autonomous base: origin/thejudge-auto/trade-balancer-price-slim

## Preparation gate

- Quality-check: INCOMPLETE — the reshape re-check did not finish. Attempt 1 exhausted its tool-call cap (71/60) by spawning verification sub-forks that looped, and the boundary hook blocked a re-dispatch under the denied-command-retry rule. No PASS/FAIL verdict was produced. (The pre-reshape frontend-slim design did pass gate-qc; that verdict does not carry to this design.)
- Checked artifact: `PRD/work/trade-balancer-price-slim/DESIGN-BRIEF.md`
- Findings: none produced — a fresh quality-check run is required before build.
