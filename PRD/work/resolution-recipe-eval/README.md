status: refined

# resolution-recipe-eval

Measure whether a layer-and-timing resolution recipe (eval-only arm R, amending REQ-230) helps GPT-6 Luna judge hard interactions better than the production prompt, in Quick Lookup and In-Depth. Measurement only.

- Idea: `IDEA.md`
- Intake (verbatim, evidence only): `intake/GRAPH-BRIEF.md`
- Design brief: `DESIGN-BRIEF.md`
- Proposal and owner questions: `GATE-QUESTIONS.md` (REQ-230, REQ-228, REQ-187, REQ-224, REQ-185; blockers G1, G2, G3-01 to G3-16, G4; G5 = the REQ-187 slot)
- Evidence (re-runnable, offline; build deletes it with the package): `evidence/` — cost dry runs and recorded Luna figures (`cost-anchor-dry-runs.txt`, `luna-token-stats.mjs`), G3 card oracle ids (`g3-card-ids.txt`, `resolve-g3-cards.mjs`)
- Next: `thejudge-quality-check PRD/work/resolution-recipe-eval/`
- Graph run ledger: `GRAPH-RUN.md`

## Preparation gate

- Quality-check: FAIL
- Checked artifact: `PRD/work/resolution-recipe-eval/DESIGN-BRIEF.md`
- Findings: F1 (blocking) the cost anchor and Luna reasoning-token figures name no command, flags or saved output; F2 (blocking, per gate-qc) Serra Angel not shown in the committed card data — driver check: it is there, oracle id `4b7ac066-e5c7-43e6-9e7e-2739b24a905d` ({3}{W}{W}, Flying, Vigilance) via `apps/frontend/public/data/cardMetadata.json` `cardId` → `apps/backend/data/cardDetailByOracleId.json.br`, so the fix is to cite oracle ids; F3 (minor) Grizzly Bears, Murder, Serra Angel, Forest, Island carry no oracle ids; F4 (minor) the brief's power/toughness fact cites G3-13 for Serra Angel, which is G3-11; F5 (minor) the REQ-230 diff hard-codes the 16 hard cases, and the G3 slots carry no per-slot recommendation. Full report: `QUALITY-CHECK.md`.

## Autonomous metadata

- Autonomous base: origin/thejudge-auto/resolution-recipe-eval
