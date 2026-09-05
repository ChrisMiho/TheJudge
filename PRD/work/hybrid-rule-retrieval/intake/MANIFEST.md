# Intake manifest — graph-20260905-173655

- Run ID: `graph-20260905-173655`
- Slug: `hybrid-rule-retrieval` (proposed by the driver)
- Branch: `thejudge-auto/hybrid-rule-retrieval`
- Origin: owner handoff via `/graph-kickoff`, 2026-09-05

## Primary intake (staged verbatim)

- `rag-rule-retrieval-2026-09-05.md` — copied byte-for-byte from
  `PRD/instructions/receipts/rag-rule-retrieval-2026-09-05.md` on `main`
  (`cmp` clean). The receipt of the prior run this request follows on from.
  Evidence, not authority: every product decision it raises is made at the
  `define` gate.

## Owner's request (verbatim from the launch command)

> Make Ask AI's semantic rule retrieval safe to turn on. The rag-rule-retrieval
> run shipped an opt-in local embedding model (EMBEDDING_PROVIDER=local) that
> lifts recall@5 on the 156-pair benchmark from 0.58 to 0.85 but loses the exact
> rule on short lookup-mode questions: two of eight labelled fixtures drop rule
> 702.2b from the top five because a card name plus one keyword carries too
> little meaning for cosine ranking alone. Four items, one spec: (1) a hybrid
> score that blends lexical and semantic ranking so lookup-mode questions keep
> the exact rule while long questions keep the semantic gain, measured on the
> same benchmark and the labelled fixtures; (2) once hybrid holds, make the
> system3-expected-recall and system3-noise-excluded checks gate test:eval on
> the semantic path instead of report-only, and add one labelled fixture for a
> multi-keyword card; (3) relieve the Lambda package budget, which sits at
> 118.10 of 120 MB data after the 130 MB runtime-and-model reserve, by
> shrinking the 75 MB combos artifact, loading the model from S3 at cold start,
> or storing vectors in a smaller number format, decided by measurement before
> the next data refresh; (4) measure Lambda cold-start latency with the model
> loaded and record it against the existing latency requirement. Success is a
> measured case for setting EMBEDDING_PROVIDER=local as the default.
