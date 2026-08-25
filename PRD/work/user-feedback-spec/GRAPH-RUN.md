# Graph run — user-feedback-spec

- Run ID: `graph-20260825-150903`
- Profile: `unverified`
- Canary: `denied — hook live (rm -rf .worktrees/.graph-canary-nonexistent)`
- Graph canary: `denied — hook live (nohup true)`
- Autonomous base: `origin/thejudge-auto/user-feedback-spec`
- Parent branch (fork point): `thejudge-auto/life-tracker-spec` — its work is already in `origin/main` via PR #106 (DEC-168 + life-tracker spec); our branch is a clean ancestor of `origin/main` (0 ahead, 1 behind)
- Staging: `.worktrees/.graph-intake/graph-20260825-150903/`
- Current node: `build` — plan complete 2026-08-25 (2 verify-only slices, `STATUS.active`); publishing before build
- Next action: `/graph-run PRD/work/user-feedback-spec/`

## Node ledger

| # | Node | Model | Outcome | Heartbeat | Evidence | Date |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | preflight | haiku | ok | `0 → 4` | branch `thejudge-auto/user-feedback-spec` created + pushed; forked from `thejudge-auto/life-tracker-spec`; clean tree, no stash; lock `graph-20260825-150903` held | 2026-08-25 |
| 2 | shape | sonnet | ok | `1 → 40` | package `PRD/work/user-feedback-spec/` created (`IDEA.md`, `README.md`, `STATUS.ideation`, `intake/refactor-gameplan.md`); board row under `## ideation`; commit `2e1c452` pushed | 2026-08-25 |
| 3 | define | opus | ok — gate (parked) | `1 → 33` | `DESIGN-BRIEF.md` written; new `PRD/sections/user-feedback/README.md` (144 lines, DEC-168 template) + one `PRD/README.md` Section Inventory row; **no new stable IDs**, no existing DEC/REQ/FLOW/NFR body modified; `git diff -- PRD/sections/` non-empty → parked at the `define` gate; `STATUS.refined` → `STATUS.owner-action` | 2026-08-25 |
| 4 | gate-qc | sonnet | ok — PASS | `0 → 25` | `thejudge-quality-check` PASS on `DESIGN-BRIEF.md`, findings: none; brief cross-checked against DEC-104/105, REQ-086/087/088, FLOW-014, NFR-001/006, DEC-168 template rules; no new IDs, no `PRD/sections/` edits; `STATUS.refined` unchanged (PASS does not advance status) | 2026-08-25 |
| 5 | plan | sonnet | ok | `0 → 33` | `thejudge-map-out`: `GAMEPLAN.md`, `slice-a-verify-spec.md`+`slice-a.criteria.json` (A1–A9, all `false`), `slice-b-diff-proof.md`+`slice-b.criteria.json` (B1–B5, all `false`); both slices **verify-only** (deliverable already committed at `562d1c6`), parallel-ready; A5 embeds the sourced `useFeedbackForm.ts` gap as a bounded additive correction (not a blocker); `STATUS.refined` → `STATUS.active`; board row moved to `## active`; all writes inside `PRD/work/user-feedback-spec/` + board file | 2026-08-25 |

## Gate verdicts

Walked at owner-chosen granularity: **per behavior surface** (9 units). Refinement
minted no new stable IDs, so the reviewable units are the new file's sections
rather than minted `DEC`/`REQ`/`FLOW`/`NFR` ids. All accepted — the run's text
stands, no `PRD/sections/` change applied.

| Reviewed unit (`PRD/sections/user-feedback/README.md`) | Verdict | Reason |
| --- | --- | --- |
| Header + `## What it is` | accept | — |
| `## How it works › Entry point` | accept | — |
| `## How it works › The feedback modal` | accept | — |
| `## How it works › App-state snapshot and disclosure` | accept | — |
| `## How it works › Delivery` | accept | — |
| `## How it works › Graceful no-op when unconfigured` | accept | — |
| `## Measured bounds` | accept | — |
| `## Rejected alternatives and deferred scope` | accept | — |
| `## Where it lives` | accept | — |

## Open gate

**RESOLVED 2026-08-25** — 9 units walked, 9 accepted, 0 edited, 0 rejected. No
stable ID burned. `PRD/sections/` unchanged. Status restored to `refined`; run
resumes at `gate-qc`. The recorded diff below stays as the evidence of what was
walked.

**Gate:** `define` — non-empty `PRD/sections/` diff awaiting owner review.

**Question for the owner:** review the new draft feature spec below. Accept it as
written, edit it, or reject it. It is a current-state consolidation of the
Feedback & Bug Report feature on the DEC-168 template, kept `draft` /
non-authoritative with `PRD/sections/decisions.md` at precedence #1.

**New stable IDs:** none. Refinement minted no new `DEC`/`REQ`/`FLOW`/`NFR`/`Q`.
The spec is a derived view that cites only existing IDs (DEC-104, DEC-105,
REQ-086, REQ-087, REQ-088, FLOW-014, NFR-001, NFR-006). No existing body was
modified.

**Two observations for the owner (do not change the mechanical park — they are
context for the gate walk):**

1. **The full spec was authored at `define`, not at `build`.** This diverges from
   the life-tracker precedent (Phase A #1), where node 3 wrote only the
   `DESIGN-BRIEF.md` plus the new DEC-168 decision, and the spec file itself was
   written later at node 6 (`build`) as slice A. Here DEC-168 already exists, so
   refinement produced no new decision and instead consolidated the whole spec at
   `define`. The effect: the owner reviews the actual spec at this gate (arguably
   the gate's intent), and the later `build` node has correspondingly less to
   author — likely just the `PRD/README.md` Section Inventory row plus the
   package-wide diff-scope proof, mirroring life-tracker's slice B.
2. **The diff carries no new stable IDs**, so `graph-gate-review`'s ID-by-ID walk
   maps onto the new file's behavior sections rather than minted IDs. Walk the
   spec's `## What it is` / `## How it works` (five surfaces) / `## Measured
   bounds` / `## Rejected alternatives and deferred scope` / `## Where it lives`
   as the reviewable units, and record one verdict for the file (or per section
   if you want finer granularity).

**Also in the working tree (outside `PRD/sections/`, not part of this gate's
diff but landing with the spec):** one navigation row added to `PRD/README.md`'s
Section Inventory (DEC-168 pattern, navigation only).

**Complete `PRD/sections/` diff (verbatim, never summarized):**

```diff
diff --git a/PRD/sections/user-feedback/README.md b/PRD/sections/user-feedback/README.md
new file mode 100644
index 0000000..bf88a3f
--- /dev/null
+++ b/PRD/sections/user-feedback/README.md
@@ -0,0 +1,144 @@
+# Feedback & Bug Report — current-state feature spec
+
+- Status: draft, derived, non-authoritative view. On any conflict, the cited
+  `DEC`/`REQ`/`FLOW` wins — `PRD/sections/decisions.md` stays precedence #1
+  and Read-First #1. Correct this file against those sources, not the other
+  way around.
+- Backed by: DEC-104, DEC-105, REQ-086, REQ-087, REQ-088, FLOW-014, NFR-001,
+  NFR-006
+
+## What it is
+
+A one-tap way for a player to report a bug or send feedback without leaving
+what they were doing. From the feature-portal menu they pick **Send feedback**,
+a modal opens over the current screen, and they choose a category (Bug /
+Suggestion / Other), type a message, and optionally leave a reply email. The
+report is delivered to the owner's inbox, and it carries a disclosed snapshot
+of what the app was doing — the screen, the in-progress game, the typed
+question, the conversation so far — so the owner can actually reproduce the
+problem. Everything happens in the browser: there is no backend route, no
+account, and no server-side storage.
+
+## How it works
+
+### Entry point
+
+- Built: **Send feedback** is a feature-portal **action entry**, not a
+  destination. Selecting it runs a handler that opens the feedback modal and
+  closes the menu; it does not switch the active view or reset any mode's
+  in-session state. The entry sits in the same portal menu as the destinations
+  and obeys the same non-overlap bounds and touch sizing. (DEC-104, REQ-086)
+- Built: the action-entry kind is an additive amendment to the destination
+  registry (DEC-095). v1 registers exactly one action entry — Send feedback;
+  the destination list is unchanged. (DEC-104, REQ-086)
+
+### The feedback modal
+
+- Built: the modal opens over the current screen, so the user keeps their
+  place — no view switch, no reload, no loss of in-progress state. (REQ-087,
+  FLOW-014)
+- Built: capture fields are a category select (Bug / Suggestion / Other), a
+  required freeform message, and an optional reply email (blank = anonymous).
+  (DEC-105, REQ-087)
+- Built: validation is inline — submit is blocked until the message is
+  non-empty after trim; when a reply email is present it must be a valid email
+  format. (REQ-087, FLOW-014)
+- Built: the modal is accessible and theme-aware — focus is trapped inside it,
+  Esc closes it, focus is restored to the portal trigger on close, and its
+  open/close motion is CSS-only and reduced-motion-aware. It is touch-friendly
+  on mobile. (REQ-087, NFR-001, NFR-006)
+
+### App-state snapshot and disclosure
+
+- Built: each report attaches a snapshot of current app state — screen/step,
+  in-progress game context and typed question, zones/cards/enrichment,
+  conversation history (if any), provider mode (mock/live), active portal
+  destination, and environment (user-agent, viewport, route, timestamp,
+  build/version). (DEC-105, REQ-088)
+- Built: the snapshot is disclosed to the user before submit — a one-line
+  notice that current app state is attached, plus an expandable
+  human-readable summary showing exactly what is included. The summary shows
+  the same content that is serialized for delivery. (REQ-087, REQ-088,
+  FLOW-014)
+- Built: the modal reads app state only through a lazy `getFeedbackContext()`
+  callback the app shell supplies, built by a pure builder; the modal never
+  reaches into flow internals, and building or sending the snapshot never
+  mutates app state. (DEC-105, REQ-087, REQ-088)
+
+### Delivery
+
+- Built: submit POSTs a JSON payload to `https://formspree.io/f/<id>`, where
+  `<id>` is a public, non-secret form id read from
+  `VITE_FEEDBACK_FORMSPREE_ID`. The snapshot rides as one JSON-stringified
+  field alongside category, message, and reply email, so the report is
+  actionable and reproducible. (DEC-105, REQ-088)
+- Built: delivery is frontend-only — it adds no backend route, no SES, no
+  secret, and changes no existing contract or product-facing endpoint. The
+  form id is configuration, committed to `.env.example` and shipped in the
+  client bundle. (DEC-105, REQ-088)
+- Built: the submit lifecycle is idle → sending → success acknowledgement or
+  inline error. Success, network error, and rate-limit resolve distinctly and
+  surface inline; on error the draft is preserved so the user can retry.
+  (REQ-087, REQ-088, FLOW-014)
+
+### Graceful no-op when unconfigured
+
+- Built: when `VITE_FEEDBACK_FORMSPREE_ID` is empty or unset (the local/mock
+  baseline), submit is disabled/no-op with an explanatory hint and never
+  throws or crashes dev. The feature ships complete in this state; the owner's
+  out-of-band Formspree setup and id handoff — not further engineering — is
+  what turns delivery on. (DEC-105, REQ-088)
+
+## Measured bounds
+
+This feature carries no pixel-measured bounds; its fixed constraints are the
+capture set and the delivery shape.
+
+- Category set: exactly Bug / Suggestion / Other. Message required (non-empty
+  after trim); reply email optional but, when present, must be valid email
+  format. (DEC-105, REQ-087)
+- Delivery endpoint: `https://formspree.io/f/<id>`, `<id>` =
+  `VITE_FEEDBACK_FORMSPREE_ID`, treated as public non-secret configuration; the
+  snapshot travels as a single JSON-stringified field. (REQ-088)
+- Live delivery confirmed 2026-08-05: form id `xdenozlb`, local and production
+  build env configured, live-send smoke (modal submit through inbox delivery)
+  verified end to end. (DEC-105)
+
+## Rejected alternatives and deferred scope
+
+- **Ad-hoc emails from the user's own mail client — closed door.** The feature
+  exists because that path does not scale, depends on the user's mail client,
+  and arrives with no structure or reproduction context. In-product delivery
+  with an attached snapshot replaced it. (DEC-105)
+- **A standalone header affordance outside the portal registry — closed
+  door.** DEC-104 rejected special-casing feedback with its own chrome and
+  instead generalized the registry to admit handler-backed action entries, so
+  feedback ships no chrome of its own. (DEC-104)
+- **A destination view instead of a modal — closed door.** Feedback opens a
+  modal over the current screen so the user does not lose their place
+  mid-flow; it is deliberately not a view switch. (DEC-104, DEC-105)
+- **A backend route / SES / server-side delivery — closed door.** The product
+  is backend-minimal (one product endpoint, DEC-010; no auth/account systems),
+  so a third-party form backend with a public form id was chosen precisely to
+  avoid a new route, a secret, or a contract change. (DEC-105)
+- **Deferred, not cut (v1 non-goals):** screenshots / file uploads,
+  persistence, auth, in-app report history, and analytics. Screenshots and
+  file uploads are a named deferred extension, not an open question. (DEC-105,
+  REQ-087, REQ-088)
+
+## Where it lives
+
+Frontend components and feedback-local logic live under
+`apps/frontend/src/components/feedback/` (`FeedbackModal.tsx`) and
+`apps/frontend/src/lib/feedback/` (`buildFeedbackContext.ts`,
+`FeedbackContextProvider.tsx`, `submitFeedback.ts`,
+`summarizeFeedbackContext.ts`, `environment.ts`, `types.ts`); the app shell
+registers the Send feedback action entry and hosts the modal in
+`apps/frontend/src/App.tsx`, the action-entry union lives in
+`apps/frontend/src/lib/portal/types.ts`, the portal menu renders it in
+`apps/frontend/src/components/portal/FeaturePortalMenu.tsx`, and the form id is
+resolved in `apps/frontend/src/lib/env.ts` (`resolveFeedbackFormspreeId`) from
+`apps/frontend/.env.example`'s `VITE_FEEDBACK_FORMSPREE_ID`. See
+`PRD/sections/system-map.md`'s `## Feedback & bug report` entry for the full
+file list, and `PRD/sections/integrations-and-data.md`'s Feedback Delivery
+Strategy for the delivery/payload detail.
```

**Resume command:** `/graph-gate-review PRD/work/user-feedback-spec/` — walk the
diff, record verdicts, resolve the gate, and it hands back
`/graph-run PRD/work/user-feedback-spec/` to resume at `gate-qc`.

## Dispatch prompts

### preflight

graph-run is controlling. You are node 1 (`preflight`) of an autonomous graph run. Invoke the `graph-preflight` skill and follow it exactly.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Run parameters:
- Branch: `thejudge-auto/user-feedback-spec` (pass verbatim as `--branch`; never infer or reuse the current branch)
- Run ID: `graph-20260825-150903` (pass verbatim as `--run-id` to BOTH the dry run and the real run)
- Slug: `user-feedback-spec`

Do exactly what `graph-preflight/SKILL.md` requires, in order: confirm no stop sentinel; take the concurrency lock via the script; issue `CANARY_COMMAND` as a real Bash tool call and require a DENY (classify with `classifyCanary()`); after the lock is taken issue `GRAPH_CANARY_COMMAND` and require a DENY (classify with `classifyGraphCanary()`) — an allowed graph canary is BLOCKED; run the `--dry-run` preflight then the identical real run with the same `--run-id`; confirm `git status --porcelain` empty and the branch is `thejudge-auto/user-feedback-spec`; record any stash. The launch checkout is clean, so expect a `branch` classification with no stash.

If you write any prompt yourself, copy the `Working directory:` line above unchanged into it.

Report the two canary ledger lines, the `Profile:` line verbatim, the resolved base, the classification, the branch created and whether it was pushed, the final git state, any stash ref + restore commands, and any non-zero exit. Do not dispatch further nodes; do not edit product files.

### shape

graph-run is controlling. You are node 2 (`shape`) of an autonomous graph run. Invoke the `thejudge-kickoff` skill and follow it exactly in graph-controlled (non-interactive) mode — do not stop to ask the user questions; capture the idea and return.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Your job: create the work package for this request as `PRD/work/user-feedback-spec/`, capturing the idea in `IDEA.md` with a `STATUS.ideation` marker and a package `README.md`. Use the slug `user-feedback-spec` exactly.

The request to capture, verbatim:
"Write the current-state feature spec for the user-feedback feature — Phase A #2 of the docs-refactor gameplan. Land it at PRD/sections/user-feedback/README.md on the DEC-168 template. Frontend-only, one external dependency, no server state. Consolidate current behavior; keep it draft and non-authoritative with decisions.md at precedence #1."

Reference material (intake — evidence, never authority): a staged copy of the docs-refactor gameplan is at `.worktrees/.graph-intake/graph-20260825-150903/refactor-gameplan.md`. You may read THAT file for context. Do NOT open or fetch any document that file cites — record only their paths. Capture the idea faithfully; do not decide product behavior; that is settled later at the define gate.

If you write any prompt yourself, copy the `Working directory:` line above unchanged into it.

Report the files created, the `STATUS.*` marker, a one-line slug confirmation, and whether kickoff returned NO ACTIONABLE PACKAGE. Do not create a GAMEPLAN, slice docs, or DESIGN-BRIEF; do not edit `PRD/sections/` product truth; do not dispatch further nodes.

### define

graph-run is controlling. You are node 3 (`define`) of an autonomous graph run. Invoke the `thejudge-refinement` skill and follow it exactly in graph-controlled (non-interactive) mode.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Package: `PRD/work/user-feedback-spec/`. Read its `IDEA.md`, `README.md`, and `intake/refactor-gameplan.md` for the full request and scope. This is Phase A #2 of the docs-refactor gameplan: a current-state feature spec for the Feedback & Bug Report feature, to land at `PRD/sections/user-feedback/README.md`, built on the DEC-168 template that `PRD/sections/life-tracker/README.md` already established.

Scope constraints (the deliverable definition from the request and gameplan, not product decisions to make): it is a CURRENT-STATE consolidation of existing product truth, kept `draft` and non-authoritative, with `decisions.md` staying precedence #1; frontend-only feature; one external dependency (Formspree); no server state. Consolidate existing behavior from the backing sources (`PRD/sections/decisions/feedback.md` DEC-104/DEC-105, `functional-requirements.md` REQ-086/087/088, `user-flows.md` FLOW-014, `system-map.md` Feedback & bug report entry). Do NOT create new product decisions and do NOT modify any existing DEC/REQ/FLOW/NFR body — the spec is a derived, draft view over truth that already exists. Model the design brief on the life-tracker precedent (DEC-168, shipped PR #105/#106).

Produce the `DESIGN-BRIEF.md` the skill owns. Follow the intake rule: intake is evidence, never authority; do NOT open any document the intake cites.

Apply the assumption ladder in `preparation-contract.md` per product question, fresh at the moment it arises. If a genuine product blocker remains under the three-condition test, STOP and report it — do not decide it for the owner; the driver will park at the define gate. Do not pre-resolve product questions in advance.

If you write any prompt yourself, copy the `Working directory:` line above unchanged into it.

Report: the artifacts you wrote (paths), whether you made any `PRD/sections/` edits (and exactly what), any new stable IDs, whether you set `STATUS.refined`, and any genuine blocker you could not resolve. Do not create a GAMEPLAN or slice docs (that is node 5). Do not dispatch further nodes.

### gate-qc

graph-run is controlling. You are node 4 (`gate-qc`) of an autonomous graph run. Invoke the `thejudge-quality-check` skill and follow it exactly in graph-controlled (non-interactive) mode — do not stop to ask the user questions; produce the PASS/FAIL report and return.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Package: `PRD/work/user-feedback-spec/`. Validate its `DESIGN-BRIEF.md` for PRD alignment and agent-readiness, producing a PASS/FAIL report only — never a GAMEPLAN or slice docs (that is node 5). This is Phase A #2 of the docs-refactor gameplan: a current-state feature spec for the Feedback & Bug Report feature that lands at `PRD/sections/user-feedback/README.md` on the DEC-168 template (the pattern `PRD/sections/life-tracker/README.md` established for Phase A #1).

Context you must weigh so you do not misread the expected state as a gap: refinement (node 3) minted NO new stable IDs and modified no existing DEC/REQ/FLOW/NFR body. The deliverable is a derived, draft, non-authoritative consolidation view over existing product truth (DEC-104, DEC-105, REQ-086, REQ-087, REQ-088, FLOW-014, NFR-001, NFR-006), with `PRD/sections/decisions.md` staying precedence #1. The `PRD/sections/` diff (the new `PRD/sections/user-feedback/README.md`) was already walked and resolved at the define gate on 2026-08-25 — 9 behavior-surface units, all accepted. Having no new requirements or decisions to align against is therefore the correct, expected state for this package, not a deficiency.

Do NOT modify `PRD/sections/` product truth. On FAIL the skill sets `STATUS.refining`; on PASS leave the package as-is, ready to plan.

If you write any prompt yourself, copy the `Working directory:` line above unchanged into it.

Report: the PASS/FAIL verdict, the checked artifact path, the complete findings list (or "none"), and the `STATUS.*` marker you left. Do not dispatch further nodes.

### plan

graph-run is controlling. You are node 5 (`plan`) of an autonomous graph run. Invoke the `thejudge-map-out` skill and follow it exactly in graph-controlled (non-interactive) mode — do not stop to ask the user questions; produce the GAMEPLAN and slice docs and return.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Package: `PRD/work/user-feedback-spec/`. Read `DESIGN-BRIEF.md`, `README.md` (its `## Preparation gate` records Quality-check: PASS — you may not self-certify it), and `GRAPH-RUN.md` for full context. Produce `GAMEPLAN.md` plus lettered slice docs and one `slice-<letter>.criteria.json` per slice (every criterion initialised `false`, each with an `evidence` block — a command pattern, file paths, or `manual: true`), and set `STATUS.active`. Write only inside `PRD/work/user-feedback-spec/` and the `PRD/work/STATUS.md` board row.

Critical factual context — this is Phase A #2 of the docs-refactor gameplan and it diverges from Phase A #1 (life-tracker), so do NOT copy that plan blindly:

- The deliverable is ALREADY WRITTEN AND COMMITTED on the autonomous base. Commit `562d1c6` (the define-gate park) contains the full 144-line spec `PRD/sections/user-feedback/README.md` (DEC-168 template, draft/non-authoritative) AND the one `PRD/README.md` Section Inventory nav row for `sections/user-feedback/`. The define gate already walked and owner-accepted this content on 2026-08-25 — 9 behavior-surface units, all accepted.
- Refinement minted NO new stable IDs and touched no existing DEC/REQ/FLOW/NFR body. The spec is a derived, draft, non-authoritative view citing DEC-104, DEC-105, REQ-086, REQ-087, REQ-088, FLOW-014, NFR-001, NFR-006, with `PRD/sections/decisions.md` staying precedence #1.
- Therefore the plan must NOT include a slice that authors the spec or the nav row — that work is done and committed. Plan only what genuinely remains: verifying the committed spec is complete and correct against its cited sources and the DEC-168 template, and the package-wide diff-scope proof that no `apps/` code and no existing DEC/REQ/FLOW/NFR body was touched. The life-tracker receipt's slice B (nav row + package-wide diff proof) is the closest precedent for the proof slice; here the nav row already exists, so treat it as verify-only rather than author.

Do NOT modify `PRD/sections/` product truth. Do NOT write code. If a genuine product blocker arises under the three-condition test in `preparation-contract.md`, STOP and report it rather than deciding it.

If you write any prompt yourself, copy the `Working directory:` line above unchanged into it.

Report: the artifacts you wrote (paths), the slice letters and their one-line intents, the criteria files and criterion counts, the `STATUS.*` marker you set, and any genuine blocker. Do not dispatch further nodes.

### build

graph-run is controlling. You are node 6 (`build`) of an autonomous graph run. Invoke the `thejudge-implement-all` skill and follow it exactly in graph-controlled (non-interactive) mode — complete every remaining slice in one unattended session, then set `STATUS.ship-ready` and hand off. Do not stop to ask the user questions.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Package: `PRD/work/user-feedback-spec/`. Its `README.md` records `## Autonomous metadata` (Autonomous base: origin/thejudge-auto/user-feedback-spec) and `## Preparation gate` (Quality-check: PASS). Read `GAMEPLAN.md`, `slice-a-verify-spec.md`, `slice-b-diff-proof.md`, and both `slice-*.criteria.json`. Create the worktree under `.worktrees/implement-user-feedback-spec/` (repo-local `.worktrees/` root only), open/maintain the PR against the recorded autonomous base, and drive every criterion in both slice files to `true` with real evidence.

Both slices are VERIFY-ONLY. The deliverable — `PRD/sections/user-feedback/README.md` (144 lines) and the `PRD/README.md` Section Inventory nav row — is already written and committed on the autonomous base (commit `562d1c6`), owner-accepted at the define gate. Do not re-author it. Slice A verifies the committed spec against its cited sources (DEC-104, DEC-105, REQ-086, REQ-087, REQ-088, FLOW-014, NFR-001, NFR-006) and the DEC-168 template; criterion A5 permits ONE bounded additive correction — appending the missing `useFeedbackForm.ts` file-path line to the spec's Where-it-lives paragraph — only if independently confirmed against `system-map.md` and the repo tree. No other spec edit. Slice B verifies the nav row and proves the package-wide diff since the fork point touched nothing outside `PRD/sections/user-feedback/README.md`, the one nav row, and package bookkeeping — no `apps/` code, no existing DEC/REQ/FLOW/NFR body.

Boundaries: do NOT modify any existing DEC/REQ/FLOW/NFR body, do NOT change `apps/` code, do NOT merge or close the PR (that is the owner's land step), do NOT push to `main`. Every path you write must lie inside `.worktrees/implement-user-feedback-spec/` or `PRD/work/user-feedback-spec/`.

If you write any prompt yourself, copy the `Working directory:` line above unchanged into it.

Report: the worktree path and work branch, each slice's completion and its criteria status (all `true`?), any bounded correction you made and its evidence, the PR URL, the write-scope confirmation (every written path inside the two allowed roots), and the final `STATUS.*` marker. Do not dispatch further nodes.

## Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
| Write the current-state feature spec for the user-feedback feature — Phase A #2 of the docs-refactor gameplan. Land it at PRD/sections/user-feedback/README.md on the DEC-168 template. Frontend-only, one external dependency, no server state. Consolidate current behavior; keep it draft and non-authoritative with decisions.md at precedence #1. | answered-once | shape | — |
