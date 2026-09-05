# Slice C — Clean the junk out of the rule index

## Status: planned

## Goal

Strip the Comprehensive Rules table of contents and bare heading-only
entries out of the built rule index, and stop a curated parent rule from
letting its own lettered sub-rules reappear as supplemental excerpts.

## Requirements

1. In `scripts/build-game-rules.mjs`, skip the source document's table of
   contents when building `gameRulesRuleIndex.json` (measured before this
   change, 2026-09-05: 3,432 entries, 3,285 distinct ids, 147 duplicates,
   every one a TOC line shadowing the real rule).
2. Omit heading-only entries — an entry whose text is nothing but its own
   numbered heading (measured before this change: 626 entries under 60
   characters; the build test names the exact heading-only count it
   removes, not the full under-60 set, since some short entries carry real
   text).
3. Add a build test asserting both properties (zero duplicate rule ids, no
   heading-only entry) that fails if a future Comprehensive Rules refresh
   reintroduces either.
4. In `apps/backend/src/gameRulesRetrieval.ts`, change System 3's exclusion
   of curated-baseline rule ids from exact-id match to rule-number prefix
   match, so curating `603.1` also excludes `603.1a`.
5. Preserve the build's existing graceful degradation: a missing or
   unparsable Comprehensive Rules source keeps the prior committed
   artifacts and exits 0.
6. Apply this step's `PRD/sections/` amendment: the new `REQ-179` entry only
   (`functional-requirements.md`, append after REQ-178). The prefix-dedup
   wording that also appears in `REQ-022` and
   `system-map/game-rules-retrieval.md` is bundled into Slice E's edit of
   those locations — do not touch them here. Exact accepted wording is in
   `GATE-QUESTIONS.md` under `## REQ-179`.

## Acceptance criteria

- [ ] C1 — the built `gameRulesRuleIndex.json` contains zero duplicate rule
      ids (from 147 before this slice)
- [ ] C2 — the build omits heading-only entries; no searchable entry lacks
      rule content
- [ ] C3 — a build test asserts both C1 and C2 and fails on a reintroduced
      TOC line or heading-only entry
- [ ] C4 — System 3 excludes a candidate rule when its id or any parent rule
      id is already selected by the curated baseline (prefix match,
      replacing exact-id-only)
- [ ] C5 — measured on the Slice A benchmark, clean and multi-card recall@5
      do not regress below the values recorded after Slice B
- [ ] C6 — `npm --workspace apps/backend run test:eval` stays green; any
      golden prompt fixture change is an intentional, reviewed consequence
      of removing a junk excerpt
- [ ] C7 — the build's missing/unparsable-source degrade-gracefully behavior
      is unchanged (exits 0, keeps prior committed artifacts)
- [ ] C8 — `functional-requirements.md` carries the new `REQ-179` entry
      matching `GATE-QUESTIONS.md`
- [ ] C9 — `npm run quality:check` is green

## Verification

```bash
node scripts/build-game-rules.mjs
node --test scripts/build-game-rules.test.mjs
npm --workspace apps/backend run test:eval
npm run quality:check
```

## Files touched

- `scripts/build-game-rules.mjs`
- `scripts/build-game-rules.test.mjs` (new or extended)
- `apps/backend/data/gameRulesRuleIndex.json` (rebuilt artifact)
- `apps/backend/src/gameRulesRetrieval.ts` (exclusion set: prefix match)
- `apps/backend/src/gameRulesRetrieval.test.ts`
- `PRD/sections/functional-requirements.md` (REQ-179 new)
