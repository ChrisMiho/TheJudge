# Game plan — luna-answer-budget

Player-facing result: a question gets answered by GPT-6 Luna inside one 30-second budget, a slow answer is never restarted, and a spent budget reads "Miho is working on it" (504).

## Architecture

- One overall deadline per AI call in the OpenAI provider. It covers every attempt; fast failures retry inside what is left; an expired budget always maps to PROVIDER_TIMEOUT.
- Config: `OPENAI_TIMEOUT_MS` now means the overall budget (default 30000); retries default 1, 0 allowed.
- Deploy: Lambda limit 40 s, model gpt-6-luna, set by deploy and by a bootstrap re-run.
- Prompt: the layers sentence is corrected; 31 prompt goldens change by that one line.
- Eval: default lineup gpt-6-luna, judge gpt-6.1-sol, compare report labels the 30 s production timeout.
- Product truth: the ten accepted slots in `GATE-QUESTIONS.md` are applied to `PRD/sections/` by intent, with the code in slices A, C and D.

## Data flow

Question -> prompt builder (corrected layers sentence) -> provider (deadline over all attempts, retry only inside it) -> answer or PROVIDER_TIMEOUT (504). The `{ answer }` contract and the mock do not change. No reasoning-effort value is sent.

## Slices

| Slice | Goal | Depends on |
| --- | --- | --- |
| A | Provider deadline, config, factory, credentials script, budget product truth | none |
| B | Deploy and bootstrap scripts, docs, env example | none |
| C | Layers sentence, 31 goldens, REQ-230 note | none |
| D | Eval defaults, compare report, eval product truth, ship gates | none (touches `functional-requirements.md` like A and C; edit different requirements) |

All four are parallel-ready. Sequential order A, B, C, D avoids merge friction in `functional-requirements.md`.

## Constraints

- No criterion needs a paid eval run, a live provider call or an aws command. The post-deploy check is an owner step for the receipt.
- Every deliverable lives outside `PRD/work/`; the package is deleted before merge.
- Do not touch REQ-014, REQ-023 (40-second waiting-panel line stays) or the error taxonomy.
- Notes for the receipt: the brief's REQ-230 wording is looser than the slot (the slot only appends a note); the intake's REQ-178 is REQ-022; reserved-concurrency risk (five slow answers hold slots up to about 30 s).

## Verification checklist

- [ ] `npm --workspace apps/backend run typecheck` and `npm --workspace apps/backend run test`
- [ ] `npm run test:scripts`
- [ ] `bash -n scripts/aws-deploy.sh && bash -n scripts/aws-bootstrap.sh`
- [ ] `git diff --numstat -- apps/backend/src/eval/fixtures` shows 31 one-line changes
- [ ] Brief amendment-set grep shows every amend row done
- [ ] `npm run quality:check`
