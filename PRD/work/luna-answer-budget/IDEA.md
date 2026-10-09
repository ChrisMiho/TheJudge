# Luna answer budget

Problem: live answers use GPT-4.1, which got 120 of 126 hard rules questions right. A long answer is cut off at 15 s, retried, then killed by the 20 s server limit, so the player sees "Miho is working on it". The built-in rules summary also wrongly says state-based actions use the layer system.

Outcome: live answers move to GPT-6 Luna at its default effort (125 of 126 right). Each answer gets one 30-second budget, with retries only inside it. The Lambda limit rises to about 40 s. NFR-002 (the "under 3 seconds" latency target) is amended. The layers sentence is corrected. Eval defaults follow the deployed model.

Non-goals: no reasoning-effort setting, no retrieval change, no excerpt-cap change, no new UI, no paid call in the build.

Intake (evidence, not authority): `intake/GRAPH-BRIEF.md`. It cites `PRD/work/probe-luna-time-limit/FINDINGS-time-limit.md` and `PRD/work/probe-answer-quality/REPORT.md` (paths recorded only, not opened).

## Prior run

- `PRD/instructions/receipts/answer-quality-investigation-2026-10-07.md` (answer-quality eval tooling and requirements)
- `PRD/instructions/receipts/ai-answer-quality-baseline-2026-09-07.md` (gpt-4.1 baseline, 15 s timeout era)
- `PRD/instructions/receipts/rule-excerpt-cap-ten-2026-09-10.md` (cap of ten, REQ-182 caveat on the deployed model)
