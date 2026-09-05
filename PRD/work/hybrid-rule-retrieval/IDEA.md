# IDEA: hybrid-rule-retrieval

**Problem.** When a player asks a short lookup-mode question — a card name,
type line, and one keyword, nothing else — Ask AI's opt-in semantic rule
search (`EMBEDDING_PROVIDER=local`) can miss the exact rule it should surface,
because that little text carries too little meaning for pure cosine ranking.
Two of eight labelled fixtures drop rule 702.2b from the top five this way,
even though the same semantic mode lifts overall recall from 0.58 to 0.85 on
the 156-pair benchmark. The shipped default (`mock`, keyword-only) is
unaffected and stays exactly as accurate as before; this is about making the
better, opt-in mode safe to turn on for everyone.

**Outcome.** A hybrid score that blends keyword and semantic ranking so short
lookup questions keep finding the exact rule while long questions keep the
semantic gain, measured on the same benchmark and fixtures; the two eval
checks that watch this path (`system3-expected-recall`,
`system3-noise-excluded`) move from report-only to gating `test:eval` once
hybrid holds, plus one new labelled fixture for a multi-keyword card; the
Lambda package relieved from its current 118.10 of 120 MB data-budget squeeze
by a measured choice among shrinking the 75 MB combo artifact, loading the
model from S3 at cold start, or a smaller vector number format; and Lambda
cold-start latency measured with the model loaded and checked against the
existing AI-latency requirement. Success is a measured case for setting
`EMBEDDING_PROVIDER=local` as the default.

**Non-goals.** Not building a new corpus or prompt section (the parked
mechanic-definition RAG idea is explicitly out of scope, per REQ-181's notes).
Not changing the request/response contract, the frontend, or any UI. Not
deciding here whether `local` actually becomes the default, what the hybrid
blend weights are, or which Lambda-budget lever to pull — those are `define`
gate product decisions this idea only bounds with evidence.

## The four items

1. Hybrid lexical+semantic score for System 3 rule retrieval, so lookup-mode
   short queries keep the exact rule while long queries keep the semantic
   lift. Measured on the committed 156-pair benchmark and the eight labelled
   fixtures.
2. Once hybrid holds, gate `test:eval` on `system3-expected-recall` and
   `system3-noise-excluded` for the semantic path (currently report-only per
   REQ-032), and add one labelled fixture for a multi-keyword card.
3. Relieve the Lambda package budget (NFR-017: 118.10 of 120 MB data budget
   after the 130 MB runtime-and-model reserve) by measuring and choosing among
   shrinking the 75 MB combo artifact, loading the model from S3 at cold
   start, or a smaller vector number format — before the next data refresh.
4. Measure Lambda cold-start latency with the model loaded and record it
   against the existing AI-latency requirement (NFR-002).

## Prior run

- `PRD/instructions/receipts/rag-rule-retrieval-2026-09-05.md` — the run that
  shipped REQ-181 (`EMBEDDING_PROVIDER=local`, System 3 semantic-primary
  ranking) and recorded the exact recall numbers and lookup-mode regression
  this idea now addresses. The intake's staged primary document.
- `PRD/instructions/receipts/supplemental-game-rules-retrieval-2026-06-05.md`
  — an earlier System 3 supplemental-rules retrieval run (keyword match:
  retrieval, rule).
- `PRD/instructions/receipts/prompt-context-retrieval-tuning-2026-06-18.md` —
  earlier retrieval/report-parity tuning on the same eval harness (keyword
  match: retrieval, prompt-context).
- `PRD/instructions/receipts/prompt-context-refinement-2026-08-31.md` —
  earlier prompt-context work (keyword match: prompt-context).
- `PRD/instructions/receipts/general-game-rules-prompt-2026-06-05.md` —
  earlier game-rules prompt work (keyword match: rule).
- `PRD/instructions/receipts/phase-scoped-prompt-context-2026-06-06.md` —
  earlier prompt-context work (keyword match: prompt-context).
- `PRD/instructions/receipts/quick-lookup-2026-08-01.md` — earlier Quick
  Lookup work, the destination lookup-mode questions ship through (keyword
  match: lookup).
- `PRD/instructions/receipts/quick-lookup-spec-2026-08-27.md` — the Quick
  Lookup current-state spec consolidation (keyword match: lookup).

These are offered as input, not scope; only `rag-rule-retrieval` is the direct
predecessor this idea follows on from.
