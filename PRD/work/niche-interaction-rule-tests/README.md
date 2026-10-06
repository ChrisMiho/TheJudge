---
status: refined
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
