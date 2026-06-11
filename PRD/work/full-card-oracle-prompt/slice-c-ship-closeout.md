# Slice C — Ship + Closeout

## Status: pending

## Goal

Verify all slices, promote durable outcomes to `PRD/sections/`, write a ship receipt, and delete this work folder per doc lifecycle.

## Dependencies

- Slice A complete
- Slice B complete

## Ship checklist

### Code quality

- [ ] `npm run test` — all backend + frontend tests pass
- [ ] `npx tsc --noEmit -p apps/backend` — clean
- [ ] `npx tsc --noEmit -p apps/frontend` — clean
- [ ] No unintended changes outside slice file map

### Functional verification

- [ ] Mock provider answer includes `oracleText:` for every card in every populated zone
- [ ] `multi-zone` eval fixture passes all harness checks
- [ ] `full-context` eval fixture includes battlefield oracle
- [ ] Stack ordering and `manaSpent` checks still pass
- [ ] `cardId` does not appear in prompt text
- [ ] Follow-up chat with `conversationHistory` still renders `CONVERSATION HISTORY` section

### Manual spot-checks

- [ ] `npm run prompt:preview` — review 2–3 fixtures with non-stack cards
- [ ] Local mock decrypt with `main_1` phase, battlefield + hand cards — confirm prompt in answer blob

### PRD promotion

- [ ] Add **DEC-042** to `sections/decisions.md`
- [ ] Add **REQ-030** to `sections/functional-requirements.md`
- [ ] Update `sections/integrations-and-data.md` — all-zone card metadata + cap note
- [ ] Amend **DEC-030** note with temporary high cap values
- [ ] Resolve open questions from `README.md` (document choices in receipt)

### Doc lifecycle

- [ ] Write receipt: `PRD/instructions/receipts/full-card-oracle-prompt-YYYY-MM-DD.md`
- [ ] Remove entry from `PRD/README.md` active work table
- [ ] Delete `PRD/work/full-card-oracle-prompt/` folder

## Receipt template

Create `PRD/instructions/receipts/full-card-oracle-prompt-YYYY-MM-DD.md`:

```markdown
---
slug: full-card-oracle-prompt
date: YYYY-MM-DD
status: shipped
---

# Receipt — Full Card Oracle in Every Zone

## Ship Checklist

- [ ] Slice A, B, C acceptance criteria satisfied
- [ ] Tests pass; TypeScript clean
- [ ] Public contract unchanged (no API shape changes)
- [ ] Durable outcomes promoted to sections/

## Problem solved

Non-stack zone cards were omitted from LLM prompt oracle/metadata despite frontend sending full ZoneCardItem payloads. Phase-scoped defaults increased exposure.

## Actions taken

- Extended PromptContextZoneItem + normalizeZoneItem
- Unified zone card formatting with oracleText in all zones
- Raised MAX_* constants to testing values
- Updated buildQueryText for non-stack oracle
- Regenerated eval goldens

## Files created

(list any new test files)

## Files updated

(list primary files)

## Files deleted

- PRD/work/full-card-oracle-prompt/*

## Verification results

- npm run test: X/X pass
- tsc backend/frontend: clean
- prompt:preview: spot-checked fixtures

## Open questions resolved

(document caster/empty oracle/budget test strategy choices)
```

## Post-ship monitoring

Track during next manual testing session:

- Mock `promptChars` / `promptUtilizationPercent` in logs for typical vs heavy payloads
- Provider latency p50/p95 if using live OpenAI
- Whether 1M cap needs lowering before production scale

Re-tune caps in a future slice if needed — DEC-042 (full oracle in all zones) should **not** be rolled back when caps are tightened.

## Acceptance criteria

- [ ] All ship checklist items complete
- [ ] Receipt committed
- [ ] Work folder removed
- [ ] `PRD/README.md` no longer lists this package as active

## Verification

```bash
npm run test
npm run quality:check   # if available in repo
```

Confirm work folder gone:

```bash
test ! -d PRD/work/full-card-oracle-prompt && echo "work folder cleaned up"
```
