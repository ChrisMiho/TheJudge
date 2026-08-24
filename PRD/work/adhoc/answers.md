# Open questions — CLOSED

Updated 2026-08-23. **All questions answered — nothing open.** The plan lives in
`refactor-gameplan.md`; this file is kept as the record of what was asked and
how it was decided across five rounds.

Nothing has been acted on.

---

## Settled this round

| Ref | Ruling |
| --- | --- |
| NN2a | The code-health review is **codebase-wide**, not per-feature |
| NN2b | The `feedback` feature is renamed **`user-feedback`** |
| NN2c | Code health means **the same need served in two places** — duplication and consolidation, not style or lint |

### You were right to make it codebase-wide, and for a reason worth stating

Per-feature reviews would have structurally missed exactly what you are looking
for. If the same need is served twice across two different features, six
isolated passes each see one half and neither sees the duplication. Only a
whole-codebase pass catches it.

**Your corpus already records one instance.** DEC-159 found the same hardcoded
close-button class string duplicated verbatim in four places. It was caught by
luck during a UI review, not by any systematic check. That is the failure mode
this audit exists to close.

### This changes what the shakedown run should be

I had proposed the first Phase A feature spec as the shakedown. **The codebase
audit is a better first run**, on three counts:

1. **It is read-only.** A guardrail problem on the first real run cannot damage
   anything, because the run writes one document and touches no product code.
2. **It exercises the whole machinery** end to end — preflight, the gate, the
   PR, the ledger — which is what you actually want to observe.
3. **It informs Phase A rather than following it.** Knowing what is genuinely
   shared versus accidentally duplicated is what tells you whether something
   belongs in a feature spec, the shared-chrome bucket, or the machinery layer.
   Running it after Phase A means discovering bucket mistakes too late.

**Recommendation.** Codebase audit is run one. Phase A starts after it, informed
by what it found.

---

## Final choice — answered

### NN5. What order do the seven feature specs get written?

Seven directories now: `quick-lookup`, `in-depth`, `life-tracker`,
`trade-balancer`, `scan`, `user-feedback`, and shared chrome.

**Recommendation.** `life-tracker` first — self-contained, frontend-only, no
backend or prompt entanglement, and short enough that your first spec gate walk
is a genuinely small read. Then `user-feedback`, `trade-balancer`, `scan`,
`quick-lookup`, shared chrome, and `in-depth` last as the largest and most
entangled.

Shared chrome sits late deliberately: it is easier to write once you have seen
which chrome the individual feature specs kept reaching for.

**Answer:** Recommendation sounds good
