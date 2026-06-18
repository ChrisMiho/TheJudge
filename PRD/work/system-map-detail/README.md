status: ideation

# system-map-detail

Deep per-subsystem behavior prose that the shallow `sections/system-map.md` catalog links to — how major subsystems actually work, in one read, without re-deriving from code. Split out of `prd-doc-traceability`.

## Source

- `IDEA.md` — problem, desired outcome, non-goals, dependencies, open questions

## Relationship to other work

- **`prd-doc-traceability` (`DEC-044`)** builds the shallow catalog (status + one-liner + location + backing IDs). This package is the depth layer that catalog links to.
- **`prompt-context-retrieval-tuning`** rewrites prompt assembly + System 2 / System 3. This package must come **after** it lands, so the volatile retrieval detail is written once.

## Priority coverage

Prompt assembly, System 2 (curated baseline), System 3 (supplemental retrieval), card rulings (System 1).

## Next

Refine via `thejudge-refinement` once `prompt-context-retrieval-tuning` has shipped and the shallow catalog exists.
