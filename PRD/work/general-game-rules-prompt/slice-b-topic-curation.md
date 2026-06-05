# Slice B — Topic manifest curation and committed artifact

## Status: planned

## Goal

Curate ~20–28 general CR topics, human-sign-off verbatim excerpts, and commit `gameRulesByTopic.json` within the 18–22k char library budget.

## Requirements

1. [REQ-022](../../sections/functional-requirements.md) — excerpts are verbatim WotC CR prose for rule numbers in `gameRulesTopicManifest.json`.
2. [DEC-030](../../sections/decisions.md) — topic rule numbers curated and human-signed-off during this slice.
3. Cover candidate areas from [DESIGN-BRIEF.md](./DESIGN-BRIEF.md): stack/timing, abilities, combat keywords, curated layers (`613.x`), zones/damage.
4. Full library char sum documented in this slice doc (or a `CHAR-BUDGET.md` note in the work folder — ephemeral, not promoted).
5. No paraphrase; rule bodies match CR source exactly (whitespace normalization only if build script already defines it — document any normalization).

## Acceptance criteria

- [ ] `gameRulesTopicManifest.json` lists ~20–28 topics with stable kebab-case `id`, human-readable `title`, and `ruleNumbers` arrays.
- [ ] `npm run data:build` (with local gitignored `cr/source.txt` from human-approved refresh) produces `gameRulesByTopic.json`.
- [ ] Committed `gameRulesByTopic.json` has one entry per manifest topic, sorted by `id`, each with non-empty verbatim `excerpt`.
- [ ] Total library excerpt chars are 18,000–22,000 (record exact count in slice Status note when complete).
- [ ] Every `ruleNumbers` entry appears at the start of a line in its topic `excerpt` (e.g. `405.1.`).
- [ ] Build re-run is deterministic (same input → same artifact bytes).
- [ ] `.prettierignore` includes `gameRulesByTopic.json` if file size/format warrants it (match `cardRulingsByOracleId.json` policy).

## Verification

```bash
# Requires human-approved prior: npm run data:refresh (local cr/source.txt)
npm run data:build

# Confirm artifact shape and topic count
node -e "
const t = require('./apps/backend/data/gameRulesByTopic.json');
const chars = t.reduce((n,x) => n + (x.excerpt?.length ?? 0), 0);
console.log('topics:', t.length, 'excerpt chars:', chars);
if (t.length < 20 || t.length > 28) process.exitCode = 1;
if (chars < 18000 || chars > 22000) process.exitCode = 1;
"

# Build graceful degradation still passes without CR source
rm -f apps/backend/data/cr/source.txt
npm run data:build
```

Manual: spot-check 3 random topics — compare `excerpt` against local `cr/source.txt` for verbatim match.

## Files touched

- `apps/backend/data/gameRulesTopicManifest.json`
- `apps/backend/data/gameRulesByTopic.json` (new — committed)
- `.prettierignore` (if needed)
- `PRD/work/general-game-rules-prompt/slice-b-topic-curation.md` (char totals in Status note)

## Tests

- Reuse slice A build-script unit tests; add fixture asserting manifest topic count and excerpt presence when given sample CR text.
- No new runtime tests in this slice (Slice C).

## Notes

- **Human gate:** run `npm run data:refresh` only with explicit approval; agents must not download CR in unattended CI.
- If a rule number cannot be extracted cleanly, adjust `ruleNumbers` or split topics — do not paraphrase.
- Slice C depends on this committed artifact for integration tests.
