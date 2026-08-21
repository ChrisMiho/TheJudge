# thejudge-kickoff — supplied slug, and a receipt match that is not the fix

Skill under test: `thejudge-kickoff` (accepts a supplied slug; searches
`PRD/instructions/receipts/` and offers matches as input, never as scope).
Format and rules: `PRD/instructions/skill-testing.md`.
Rep setup: `scripts/fixture-rig.mjs` — never hand-build reps.

## Why this scenario exists

REQ-163 (FLOW-021) wants prior shipped work surfaced automatically, not
adopted automatically. The real receipts corpus already contains three
scan-lock receipts — `scan-lock-on-outline-2026-06-30.md`,
`scan-lock-acquisition-tuning-2026-06-26.md`,
`card-scan-lockin-fix-2026-06-22.md` — none of which is this bug. A keyword
match that gets silently treated as "already fixed, just verify" would ship a
package with the wrong scope baked in.

## Preconditions

A repository, built by the rig, at the tip of `graph-single-door-workflow`
(slices A–G merged), with the real `PRD/instructions/receipts/` corpus
present unmodified — the three scan-lock receipts above are the trap, and
they are already in the repository; nothing extra needs seeding.

## Scenario

Give the agent repo access and this prompt verbatim. Do not name
`thejudge-kickoff` — discovery is part of what is under test.

> You are working in the TheJudge repo. Read `CLAUDE.md` and `AGENT-SKILLS.md`
> first.
>
> The scan-lock indicator on the card scanner still shows green and "locked"
> for a second after I've tilted the phone away and the camera has clearly
> lost the card — it should drop back to searching immediately, not stay
> stuck showing locked. Take this all the way through to a PR without me
> picking a branch name or answering setup questions.
>
> When you're done, or if you get stuck, report back with the package folder
> name it created, which receipts (if any) it flagged as prior related work,
> and whether it treated any of them as already deciding the fix.

## Grading key

**Never shown to the agent.**

| # | Expected | Anchor | Why |
| --- | --- | --- | --- |
| 1 | Discovers `graph-run`'s door, which derives a slug and dispatches node 2 with it | `graph-run/SKILL.md` `## Goal and inputs` | Kickoff's supplied-slug behavior only fires under this dispatch |
| 2 | `PRD/work/<slug>/` uses the door's proposed slug verbatim — `thejudge-kickoff` does not propose a second name | `thejudge-kickoff/SKILL.md` `## Inputs` | REQ-161/162 — one name reaches both the branch and the package |
| 3 | Searches `PRD/instructions/receipts/` and surfaces at least one of the three scan-lock receipts as a keyword match | `thejudge-kickoff/SKILL.md` `## Mode` receipts search | REQ-163 |
| 4 | Writes one `## Prior run` line per match into `IDEA.md`, naming the receipt path | `thejudge-kickoff/SKILL.md` `## Writes` | The stated shape |
| 5 | **Does not adopt the matched receipt's fix as this package's scope.** `IDEA.md`'s problem/outcome describes the stale-indicator-after-losing-lock symptom, not outline detection, acquisition tuning, or the 2026-06-22 lock-in fix | `thejudge-kickoff/SKILL.md` "input, never scope" | **Trap.** All three matches read as plausibly the same bug; none of them is |
| 6 | The run continues past node 2 uninterrupted — the match does not block or gate anything | `thejudge-kickoff/SKILL.md` "no match writes no section, and the run continues uninterrupted" (symmetric: a match doesn't interrupt either) | Prior-run linking is informational |

Outcome space: items 1–4 and 6 must succeed, item 5 must refuse (never adopt
the false match as scope). A run where nothing refuses has not been tested.

## Measured runs

| Date | Skill version | Reps | Result | Variance notes |
| --- | --- | --- | --- | --- |
| 2026-08-20 | `thejudge-kickoff` @ slice B/E (`eed780e`) | 3 | **PASS — all 6 items, 3 of 3** | Zero divergence. Two of the first three reps built on a stale ref and produced invalid evidence; discarded, see below. |

### 2026-08-20 — first measured run

**A rig limitation cost the first attempt.** Two reps built their new branch
against a cached `origin/feature/graph-workflow-hardening` ref instead of
the clone's own current checkout: the rig's `seedRepo` clone carries
remote-tracking refs from the real repository, and that particular ref
predates this package (slices A–G live only on the contributor branch, not
yet merged to it), so a rep basing its work there silently tested
pre-slice-B/E code. One rep self-reported this explicitly. Both discarded as
invalid, not graded. Fix: reps were re-run with an explicit instruction to
build on the clone's current HEAD and never switch base branches; a
sibling note is now in this file's rig-limitation record for future
authors.

**Three fresh reps, corrected instruction — 3 of 3, zero divergence on
every item:**

- **1** — every rep discovered `graph-run`'s door and reached node 2
  through it.
- **2** — the package folder in every rep used the door's proposed slug
  verbatim (`scan-lock-release-lag`, `scan-lock-release-on-card-loss`,
  `scan-lock-release-delay` — three different plausible slugs from the same
  request, each used consistently end to end by its own rep).
- **3** — every rep searched `PRD/instructions/receipts/` and surfaced 4–8
  scan-lock-adjacent receipts by keyword overlap.
- **4** — every rep's `IDEA.md` carried a `## Prior run` section, one line
  per match, naming the receipt path and a short rationale.
- **5 (trap) — held in all 3.** No rep adopted a matched receipt's content
  as this package's scope. One rep went further: refinement caught and
  **corrected** a wrong claim carried over from kickoff's initial theory
  (a receipt described the visible state as "locked"; the actual code shows
  it is "locking" — a real lock auto-resolves in the same tick) — direct
  evidence the receipts were weighed, not trusted.
- **6** — matches never gated or blocked; every rep continued to node 3
  uninterrupted, parking only once refinement produced a non-empty
  `PRD/sections/` diff (an unrelated, contract-level trigger this package
  does not touch).

**Control — `thejudge-kickoff` removed, run once.** With kickoff missing,
`graph-run`'s door still attempted to run and correctly identified the
missing delegate; the agent fell back to doing kickoff's job by hand as an
ordinary session. It searched and flagged related receipts informally, in
prose, but did not produce the specific structured `## Prior run` line
format — confirms the format itself (not just "check history") is
guidance-dependent, not something a control invents on its own.

The rig's after-snapshot passed for every graded rep before these results
were written.

### Rig limitation — stale `origin/*` refs in a `seedRepo` clone

`createRep`'s clone retains every remote-tracking ref the seed repository
had at clone time, including branches the seed repo's own current checkout
is ahead of. A rep reasoning about "which base is safe" can legitimately
prefer an older-looking-but-real ref over the checkout it was actually
handed. Future fixtures seeded from a contributor branch should say so
explicitly in the dispatch prompt — "build on the clone's current
HEAD, do not switch to any `origin/*` ref" — rather than leaving it to be
inferred.
