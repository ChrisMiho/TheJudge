# GAMEPLAN — quick-lookup-spec

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

## What ships

Nothing new. This package's deliverables are already written, on disk, and
owner-accepted at the define gate (16→6-section acceptance, 2026-08-26, 0
edits, 0 rejects — see the package README's define-gate record):
`PRD/sections/quick-lookup/README.md` (321 lines, DEC-168 template — the
behavior spec) and one `PRD/README.md` Section Inventory row. Neither is
committed yet — `git status` shows `PRD/sections/quick-lookup/` untracked
and `PRD/README.md` modified — the driver commits both at publish-before-
build, before build runs.

This is the same shape as Phase A #1–#4 (life-tracker, user-feedback,
trade-balancer, scan): refinement wrote the whole spec at `define` because
DEC-168 already existed, so there is nothing left to author. Quick Lookup
diverges from all four in one way: it is the gameplan's first **full-
backend-path** spec — its subject runs the entire Ask AI backend (request
validation → branching prompt assembly → retrieval → provider boundary), so
the spec carries a sixth structural section, `## The full backend path
(request → assembly → retrieval → provider → response)`, positioned between
`## How it works` and `## Measured bounds` — analogous to how scan's
"How scan feeds each destination" was the extra section for a feature
reached from more than one screen. All three slices below are verify-only:
confirm the already-written content is correct and complete against its
cited sources, the DEC-168 template, and — for the backend-path section
specifically — the actual `apps/backend/src/` files it names; close any
confirmed, sourced gap with a bounded additive correction only.

## Architecture / data flow

Not applicable — no runtime component, no code path change, no data flow
change. This is a documentation-verification task over already-written
`PRD/sections/quick-lookup/README.md` content, including direct reads of the
actual backend source files (`apps/backend/src/validation/askAiRequest.ts`,
`apps/backend/src/prompt/*.ts`, `apps/backend/src/gameRulesRetrieval.ts`,
`apps/backend/src/providers/*.ts`) that the spec's backend-path section
describes — never a code change, never a test run against those files
beyond `grep`/reading them.

## Slices

| Slice | Scope | Dependency |
| --- | --- | --- |
| A | Verify the spec's UI-facing content — header (`Status:`/`Backed by:`), **What it is**, all five **How it works** subsections, **Measured bounds**, **Rejected alternatives and deferred scope**, and the frontend portion of **Where it lives** — against the cited `DEC`/`REQ`/`FLOW`/`NFR` sources, `system-map.md`, `screen-layout.md`, `open-questions.md`, and the DEC-168 template shape. | none |
| B | Verify **The full backend path** section against the actual `apps/backend/src/` files it names — validation, prompt assembly, retrieval, provider boundary, off-domain guardrail, golden fixtures — and the backend portion of **Where it lives**. Independently confirm (or, if it does not hold, correct) a known candidate gap identified at map-out time: the section never mentions the Commander Spellbook combo-retrieval branch that the lookup code path actually runs. | none |
| C | Verify the `PRD/README.md` Section Inventory row for `sections/quick-lookup/`, then prove the whole package's diff since its fork point touched nothing outside the licensed documentation set. | none |

Parallel-ready: A checks the UI-facing spec content, B checks the backend-
path section against real source, C checks the nav row and diff scope. None
reads or depends on another's output; each touches a distinct part of the
one spec file (or, for C, a distinct file).

## Known candidate finding for slice B (verify independently, do not trust this)

Map-out time found a real, sourced content gap in **The full backend path**
section: it never mentions Commander Spellbook combo retrieval, but the
lookup code path actually runs it.

- **The confirmed decision.** `PRD/sections/decisions/combo-retrieval.md`
  DEC-116 (confirmed): "Lookup mode requires both explicit combo intent and
  an attached card." `PRD/sections/functional-requirements.md` REQ-094
  (line ~2184): "for `mode: 'lookup'`, combo retrieval runs only when combo
  intent is explicit and one card is attached; every candidate must contain
  the attached card as an exact ingredient or authoritative template match"
  and "lookup mode with no attached card and lookup questions without combo
  intent retrieve no combo catalog data." REQ-095 governs the shared prompt-
  enrichment section format (`COMMANDER SPELLBOOK COMBO CONTEXT —
  COMMUNITY-SOURCED`).
- **The confirmed code path.** `apps/backend/src/prompt/preparation.ts`'s
  `prepareLookupPromptInput` (~line 146) calls `resolveLookupComboCandidates`
  (~line 124), which — when `options.comboCatalog` is present — calls
  `selectComboCandidates(catalog, { mode: "lookup", instances: context.card
  ? [...] : [], questionText: request.question, hasExplicitIntent:
  hasExplicitComboIntent(request.question), attachedCardId:
  context.card?.cardId })`. The result (`comboCandidates`) is threaded into
  `buildLookupPromptText` alongside rulings/topics/supplemental rules — it is
  not a dead branch or game-mode-only helper.
- **The system-map entry the spec should cite.** `PRD/sections/system-map.md`
  `## Commander Spellbook combo retrieval` (line 539): "Backend-only, static
  Commander Spellbook prompt enrichment shared by In-Depth Question and
  Quick Question. ... lookup mode requires both combo intent and an attached
  card." `Lives in:` names `apps/backend/src/commanderSpellbook/`
  (`catalog.ts`, `intent.ts`, `matcher.ts`, `zones.ts`, `formatting.ts`) and
  `apps/backend/src/prompt/` (`preparation.ts`, `promptAssembly.ts`,
  `promptDiagnostics.ts`).
- **Dedicated golden coverage the spec's fixture bullet omits.**
  `apps/backend/src/eval/fixtures/commander-spellbook-lookup-attached-
  intent.fixture.json` and `commander-spellbook-lookup-unrelated.fixture.json`
  exist and are lookup-mode-specific; the spec's "Golden regression coverage"
  bullet cites only `quick-lookup-{card,no-card,off-domain}` fixtures.
- **What is not affected.** `FLOW-011`'s body (checked directly) makes no
  mention of combo retrieval at all — the package README's citation of a
  "combo-retrieval branch... cross-referenced against the Commander Spellbook
  system-map entry" points at the system-map block and DEC-116/REQ-094, not
  at FLOW-011 itself. This does not change FLOW-011 and needs no correction
  there.

If slice B's independent re-check confirms this (re-read DEC-116, REQ-094,
REQ-095, the system-map block, and the `preparation.ts` call sites directly —
do not trust this pre-scout), the bounded, sourced correction is: add a short
subsection (for example `### Combo enrichment`) to **The full backend path**
between "Branching prompt assembly" and "Off-domain guardrail" (or fold it
into "Branching prompt assembly" as an additional bullet — an authoring
choice for the implementing agent, not a new decision), citing DEC-116,
REQ-094, REQ-095, and `preparation.ts`'s `resolveLookupComboCandidates`; add
the two `commander-spellbook-lookup-*` fixtures to the golden-coverage
bullet; add DEC-116, REQ-094, REQ-095 to the spec's `Backed by:` header line;
and add `apps/backend/src/commanderSpellbook/` to the backend-path portion of
**Where it lives**. This is additive only — no existing bullet is rewritten,
no `DEC-107`/`DEC-106` framing changes, and the correction states only what
the cited sources and code already say.

## Runtime / browser risk

None. This package is documentation-only — no UI surface change, nothing
browser-observable. No Playwright verification is required
(`PRD/instructions/runtime-process-hygiene.md`).

## Verification checklist (package-level, restated from DESIGN-BRIEF)

- The spec's header carries a `Status:` line stating draft/derived/non-
  authoritative with the cited `DEC`/`REQ`/`FLOW` winning any conflict, and a
  `Backed by:` line citing exactly the ID set the file's header records (plus
  DEC-116/REQ-094/REQ-095 if slice B's correction lands).
- The spec's six top-level sections are present, in order: What it is, How
  it works, The full backend path, Measured bounds, Rejected alternatives
  and deferred scope, Where it lives.
- Every **How it works** bullet traces to its cited source's actual text.
- Every bullet in **The full backend path** traces to the actual behavior of
  the named `apps/backend/src/` file, read directly — not to the requirement
  summary alone.
- Every stable ID token present in the spec resolves to a real, pre-existing
  ID in its home file — no minted ID.
- **Where it lives** names every file `system-map.md` and the actual
  repository tree confirm belongs to the feature.
- `git diff` since the package's fork point shows no change under `apps/`,
  and no change to any existing `DEC`/`REQ`/`FLOW`/`NFR` body,
  `system-map.md`, `screen-layout.md`, `open-questions.md`, or
  `goals-and-non-goals.md`.
- `PRD/README.md` has exactly one Section Inventory row for
  `sections/quick-lookup/`.

## Corpus checks this repo already runs

No `apps/` test suite applies. Verification uses `grep` / `git diff --stat`
/ `git diff` structural checks against the PRD markdown files and the
backend source files the spec cites, read directly — never a build, a
backend test run, or any network refresh. This matches how life-tracker-
spec, user-feedback-spec, trade-balancer-spec, and scan-spec before it were
verified.

## Fork-point reference

This branch forked from `origin/main` at `d049593` (Merge PR #114, the
scan-spec close). Confirmed at map-out time: `git merge-base HEAD
origin/main` resolves to `d049593`, and the diff from that point (including
the not-yet-committed working-tree changes the driver will commit at
publish-before-build) touches exactly `PRD/README.md` (+1 line) and
`PRD/sections/quick-lookup/README.md` (new, 321 lines) outside
`PRD/work/quick-lookup-spec/` bookkeeping — nothing under `apps/`, nothing in
any existing `DEC`/`REQ`/`FLOW`/`NFR` body, `system-map.md`,
`screen-layout.md`, `open-questions.md`, or `goals-and-non-goals.md`.

## Next step

`/thejudge-implement PRD/work/quick-lookup-spec/ slice A` (Claude Code) or
`$thejudge-implement PRD/work/quick-lookup-spec/ slice A` (Codex). Slices B
and C have no ordering dependency on A or on each other.

Orchestrated mode: this package returns to `graph-run` for independent
review, fresh verification, and publication — not published directly by
this skill.
