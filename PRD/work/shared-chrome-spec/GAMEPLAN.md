# GAMEPLAN — shared-chrome-spec

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

## What ships

Nothing new. This package's deliverable is already written, committed, and
owner-accepted at the define gate (14/14 sections accepted, 2026-08-27, 0
edits, 0 rejects — see the package README / `GRAPH-RUN.md` define-gate
record): `PRD/sections/shared-chrome/README.md` (442 lines, DEC-168
template — the current-state chrome spec), committed in `0445150`. What is
not yet committed is one `PRD/README.md` Section Inventory row.

This is the same shape as Phase A #1–#5 (life-tracker, user-feedback,
trade-balancer, scan, quick-lookup): refinement wrote the whole spec at
`define` because DEC-168 already existed, so there is nothing left to
author. Shared chrome diverges from all five in subject, not structure: it
is not one player-facing destination but the frame every destination mounts
into (suite shell, mock-mode banner, routing + load fallback, Menu rail +
tray, Theme section, the shared answered-conversation workspace, the
history drawer, the View Context overlay, the suite-wide card-detail popup
and shared close control), plus the `## Shared layout language` section
(viewport bands, hybrid % model, fit rule, anti-overcalibration) — the
gameplan's binding constraint 7 rows that belong to shared chrome rather
than a single feature. All slices below are verify-only: confirm the
already-written content is correct and complete against its cited sources
and the DEC-168 template; close any confirmed, sourced gap with a bounded
additive correction only.

## Architecture / data flow

Not applicable — no runtime component, no code path change, no data flow
change. This is a documentation-verification task over already-committed
`PRD/sections/shared-chrome/README.md` content, including direct reads of
the actual frontend source files it names under
`apps/frontend/src/components/portal/`, `apps/frontend/src/components/`,
`apps/frontend/src/hooks/`, and `apps/frontend/src/lib/` — never a code
change, never a test run against those files beyond `grep`/`find`/reading
them.

## A concurrent package shares this branch — read before running any diff-scope check

`thejudge-auto/shared-chrome-spec` also carries `lambda-s3-deploy`'s
committed work (DEC-169, REQ-165, NFR-017 in `decisions.md`,
`decisions/deployment.md`, `functional-requirements.md`,
`non-functional-requirements.md` — commit `0445150` and folded into the
branch before this package's `define` gate). The owner explicitly recorded
this as intentional (`GRAPH-RUN.md`, "record owner decision — lambda side
work is intentional, push branch", 2026-08-27). That means a diff against
`$(git merge-base HEAD origin/main)` over the whole protected-file set is
**not** empty and must not be read as a scope violation — it contains
`lambda-s3-deploy`'s legitimate, already-owner-approved changes.

Slice C's diff-scope proof therefore uses **`HEAD` at map-out time
(`ee6e33f`)** as its baseline, not the branch fork point. `ee6e33f` is the
commit that resolved this package's define gate — everything this package's
own slices touch from here forward is what must stay in scope. Record this
SHA before starting slice C; if slice A or B lands a bounded correction
first, `ee6e33f` still remains the correct fixed baseline (it predates every
slice in this GAMEPLAN).

## Slices

| Slice | Scope | Dependency |
| --- | --- | --- |
| A | Verify the spec's structural-chrome content — header/Backed-by (structural half), **What it is**, the first four **How it works** subsections (suite shell + mock-mode banner; destination routing + load fallback; Menu corner rail + tray; Theme section), **Shared layout language**, the structural-chrome portion of **Measured bounds** and **Rejected alternatives**, and the structural-chrome portion of **Where it lives** — against cited sources and the actual `apps/frontend/src/` tree. | none |
| B | Verify the spec's conversation/overlay-chrome content — header/Backed-by (conversation half), the remaining four **How it works** subsections (shared answered-conversation workspace; conversation history drawer; View Context / adaptive-context overlay; card detail popup + shared close control), the conversation-chrome portion of **Measured bounds** and **Rejected alternatives**, and the conversation-chrome portion of **Where it lives** — against cited sources and the actual `apps/frontend/src/` tree. | none |
| C | Verify the two scope-boundary bullets in **Rejected alternatives and deferred scope** (deferred/out-of-scope; per-feature surfaces not owned here), verify the `PRD/README.md` Section Inventory row for `sections/shared-chrome/`, and prove the package's diff from the `ee6e33f` baseline touched nothing outside the licensed set — correctly excluding `lambda-s3-deploy`'s already-committed, owner-approved changes. | none |

Parallel-ready: A checks the structural half of the spec, B checks the
conversation/overlay half, C checks the scope-boundary bullets, the nav row,
and the diff proof. None reads or depends on another's output; each touches
a distinct part of the one spec file (or, for C, a distinct file). The split
between A and B follows the spec's own citation grouping — DEC-095/104/109/
110/111/121/122/133/135/137/140/147/150/157 (navigation chrome) plus
DEC-085/117/145/148/149 (shell/banner/layout-direction sizing) sit with A;
DEC-118/123/124/125/126/127/129/130/131/134/138/141/142/143/144/146/153
(conversation/drawer/overlay chrome) plus DEC-151/156/158/159/160
(popup/close-control sizing) sit with B — matching the spec's own
"Navigation chrome DECs" / "Conversation/drawer/overlay chrome DECs" /
"Shared sizing / banner / popup DECs" backing groups recorded in the
package README and DESIGN-BRIEF.

## Runtime / browser risk

None. This package is documentation-only — no UI surface change, nothing
browser-observable (the spec is a consolidated *description* of shipped
chrome, not a change to it). No Playwright verification is required
(`PRD/instructions/runtime-process-hygiene.md`).

## Verification checklist (package-level, restated from DESIGN-BRIEF)

- The spec's header carries a `Status:` line stating draft/derived/non-
  authoritative with the cited `DEC`/`REQ`/`FLOW`/`NFR` winning any
  conflict and `PRD/sections/decisions.md` as precedence #1, and a `Backed
  by:` line citing exactly the ID set the file's header currently records
  (40 DEC, 22 REQ, 4 FLOW, 4 NFR per the quality-check gate log) — no more,
  no fewer, unless a slice's bounded correction changes it (coordinate via
  a fresh read before finishing, not by assuming another slice has or has
  not run).
- The file's top-level sections are present, in order: What it is, How it
  works (eight subsections), Shared layout language, Measured bounds,
  Rejected alternatives and deferred scope, Where it lives.
- Every **How it works** bullet traces to its cited source's actual text —
  no invented capability, no dropped behavior.
- Every stable ID token present in the spec resolves to a real,
  pre-existing ID in its home file — no minted ID anywhere in the file.
- **Where it lives** names every file `system-map.md` and the actual
  repository tree confirm belongs to shared chrome.
- The two scope-boundary bullets (deferred/out-of-scope; per-feature
  surfaces not owned here) correctly exclude In-Depth's roster disclosure
  (DEC-120/DEC-128/REQ-100/REQ-106), its staged-step eyebrow content
  (REQ-045), its zone-collection add-action reachability (REQ-125),
  DEC-156 clause 3 (bounded poison/energy/experience dropdowns), and the
  Send-feedback modal (DEC-104/DEC-105, FLOW-014, owned by
  `user-feedback/`) — matching the package README's excluded-as-per-feature
  list.
- From the `ee6e33f` baseline, `git diff` shows no change under `apps/`,
  and no change to any existing `DEC`/`REQ`/`FLOW`/`NFR` body,
  `system-map.md`, `screen-layout.md`, `open-questions.md`, or
  `goals-and-non-goals.md`.
- `PRD/README.md` has exactly one Section Inventory row for
  `sections/shared-chrome/`.

## Corpus checks this repo already runs

No `apps/` test suite applies. Verification uses `grep` / `find` /
`git diff --stat` / `git diff` structural checks against the PRD markdown
files and the frontend source files the spec cites, read directly — never a
build, a frontend test run, or a browser session. This matches how
life-tracker-spec, user-feedback-spec, trade-balancer-spec, scan-spec, and
quick-lookup-spec before it were verified.

## Baseline reference

Map-out baseline: `ee6e33f` (`docs(shared-chrome-spec): resolve define gate
— 14/14 sections accepted`) — the commit that closed this package's define
gate. This is the fixed reference point for slice C's diff-scope proof (see
the concurrent-package note above); it is deliberately **not**
`$(git merge-base HEAD origin/main)`, which would also capture
`lambda-s3-deploy`'s legitimate, already-committed, owner-approved changes.

## Next step

`/thejudge-implement PRD/work/shared-chrome-spec/ slice A` (Claude Code) or
`$thejudge-implement PRD/work/shared-chrome-spec/ slice A` (Codex). Slices B
and C have no ordering dependency on A or on each other.

Orchestrated mode: this package returns to `graph-run` for independent
review, fresh verification, and publication — not published directly by
this skill.
