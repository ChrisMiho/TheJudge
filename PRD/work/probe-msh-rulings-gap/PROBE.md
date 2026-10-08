# Probe: why three MSH mechanics were excluded from the rules test corpus in PR #273

- Date: 2026-10-07
- Question: the owner can find heal, Power-up and Teamwork in the official Comprehensive Rules, so why did PR #273 exclude them as "no official text"? And can case authoring start with Scryfall and fall back to official Wizards text when Scryfall has nothing?
- Mode: answer (no brief written)
- What ran:
  - read PR #273 (branch `chore/data-refresh-2026-10-07`): `excluded-mechanics.json`, commit message, the three new draft cases
  - read REQ-185 tier rules (`PRD/sections/functional-requirements.md` lines 4388–4423) and `apps/backend/src/eval/worked-solutions/README.md`
  - read rule text for 701.69 / 702.193 / 702.194 from the PR branch's `apps/backend/data/gameRulesRuleIndex.json`
  - read the two approved "rule's own text" precedent cases: `recover-rule-text`, `set-in-motion-rule-text`
  - live Scryfall API: MSH set size, rulings for three sample cards, comparison against a set released 2026-10-02
  - fetched the WotC Marvel Super Heroes Release Notes (magic.wizards.com, 2026-06-12)
  - Gatherer card page: could not be fetched (inconclusive)
- Findings: `FINDINGS-msh-rulings-source.md`

## Outcome (2026-10-07)

Owner decision: un-exclude all three and cover them. Done on PR #273's branch, commit 7611b56a (pushed, PR comment added): four tier-1 rule-text drafts (heal-wolverine-fierce-fighter, power-up-abomination-activate-once, power-up-captain-marvel-cost-reduction-by-type, teamwork-repulsor-blast-total-power), excluded list back to two, coverage 262/262, baseline 295/399 with every new case hitting, `npm run quality:check` green. The release-notes fallback (Option A in the findings) stays open as a possible REQ-185 amendment; nothing was built for it.
