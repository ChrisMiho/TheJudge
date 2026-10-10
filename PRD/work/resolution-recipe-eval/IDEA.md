# resolution-recipe-eval

Problem: Luna misses hard layer and timing interactions (Necropotence + Silence + Borne Upon a Wind scored 2, 0, 0), and the production prompt gives only a short, vague layers paragraph. Outcome: a measurement, not a product change. An eval-only diagnostic arm R (full layer list with 7a-7d, a timing list, and a "list every effect, place it, resolve in order" instruction) is compared against production (arm A) on GPT-6 Luna in Quick Lookup and In-Depth, on owner-approved hard cases with repeats, an A-vs-A noise floor, answer time against the 30 s budget, and a cost dry run. The report says ship, don't ship, or test more. Non-goals: changing the production prompt, routes or providers; tagging cards with layers in code (no rules engine); any live OpenAI call in the build; touching the held-out manifest.

Owner request: 2026-10-10. Full intake: `intake/GRAPH-BRIEF.md` (evidence, not authority).

## Prior run
- PRD/instructions/receipts/answer-quality-investigation-2026-10-07.md
- PRD/instructions/receipts/ai-answer-quality-baseline-2026-09-07.md
- PRD/instructions/receipts/luna-answer-budget-2026-10-09.md
