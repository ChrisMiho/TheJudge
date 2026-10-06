---
status: refining
---

# niche-interaction-rule-tests

Add tests that check whether the right Comprehensive Rules reach the prompt for the hard interactions a tester reported (Academy Manufactor with Esix, Fractal Bloom; Silence with Necropotence and Borne Upon a Wind).

- Idea: `IDEA.md`
- Owner intake (evidence only, never authority): `intake/` — the owner's note (`feedback.md`), three Discord screenshots of the tester's verdict, and a fourth added mid-run (`screenwriter_temp_1791299243121.jpg`) with the tester's two verbatim prompts; it supersedes IDEA.md's "exact inputs unknown"
- Design brief: `DESIGN-BRIEF.md`; proposed product truth: `GATE-QUESTIONS.md` (`REQ-220`)
- Define-node measurement script: `measure-retrieval.mjs` (offline; `npx tsx PRD/work/niche-interaction-rule-tests/measure-retrieval.mjs`)
- Starting evidence in the repo: worked-solutions gold set and retrieval check, `apps/backend/src/eval/worked-solutions/README.md` (REQ-185 through REQ-190, NFR-018)

## Autonomous metadata

- Autonomous base: origin/thejudge-auto/niche-interaction-rule-tests

## Preparation gate

- Quality-check: FAIL
- Checked artifact: `PRD/work/niche-interaction-rule-tests/DESIGN-BRIEF.md`
- Findings:
  1. (Important) Dangling evidence path. REQ-220's validity criterion and brief Scope item 2 require each case's `source` block to name the intake evidence path (`PRD/work/niche-interaction-rule-tests/intake/screenwriter_temp_1791299243121.jpg`). Cleanup deletes `PRD/work/<slug>/` (graph-workflow-contract.md, cleanup's `## Intake` receipt section, DEC-167), so committed cases and durable REQ-220 would point at a deleted file; every existing gold case cites data that stays committed. Fix: `source` carries reporter (tester feedback), date (2026-10-06), channel in words, and the CR rule ids the labels come from, plus a line that the screenshot is preserved only in the cleanup receipt's `## Intake` section, not as a repo path. Apply in brief Scope 2 and in the REQ-220 diff in `GATE-QUESTIONS.md`.
  2. (Minor, agent-readiness) Ambiguous card list. Academy Manufactor, Esix, Fractal Bloom reads as three cards; it is two (Academy Manufactor, and Esix, Fractal Bloom — the comma is part of the name). Name the two cards explicitly in REQ-220's case bullet, the brief's case table, and Scope 1, so the `cards` list has two entries.
  3. (Minor) Wrong requirement credited for the lexical-fallback refusal. REQ-220 says the run refuses a lexical fallback as REQ-185's retrieval check does; REQ-185 says nothing about it. It is REQ-188 (`assertQueryEmbedded`, `describeRetrieval`), implemented in `scripts/lib/prompt-fidelity.mjs` and `scripts/eval-worked-solutions.mjs`. Cite REQ-188 and/or those helpers instead.
