# Idea: standalone code-health workflow

**Problem.** `overnight-codehealth` drives the graph skills (`graph-kickoff` +
`graph-implement`), but the graph is a *feature engine* built for behavior-changing
product work: product-truth gates, the base→main guard for dependent specs, and one
evolving PR the owner merges last. Code-health work is the opposite — behavior-preserving,
independent (non-overlapping files), and wants many concurrent PRs. The mismatch is
structural, not cosmetic: `graph-preflight`'s base→main guard refuses any fresh run while
any `thejudge-auto/*`→main PR is open, so the first target of a night blocks every later
one. Both of 2026-09-01's overnight runs died this way (0 and 1 target).

**Outcome.** A purpose-built code-health workflow that owns its own loop: pick one
behavior-preserving target → branch off fresh `origin/main` → refactor → full suite +
live checks → open one PR per target → never merge. Independent targets no longer block
each other because there is no base→main guard and no evolving base branch. It keeps the
two things that make overnight autonomy safe: the **behavior-preserving classification
gate** (anything that would change game behavior parks for the owner and never ships) and
the **build/test rigor** (full `quality:check` + live-backend/MCP checks +
verification-before-completion). It reuses the guardrail profile
(`.claude/graph-profile.json` — caps, protected-path denials, kill switch, hook canary),
the stop sentinel, and `thejudge-investigate`/`thejudge-sweep` for target ranking.

**Non-goals.** Not a change to the graph feature lifecycle (graph-kickoff/graph-implement
stay as-is for product features). Not a merging or gate-answering loop — it opens PRs and
stops; the owner merges. No product-truth (`PRD/sections/`) edits, no DESIGN-BRIEF/docs-PR
ceremony, no `PRD/work/<slug>/` packages per target. Not a weakening of the
behavior-preserving gate or the build rigor to move faster.
