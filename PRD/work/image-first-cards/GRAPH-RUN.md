# Graph run — image-first-cards

- Run ID: `graph-20260903-093903`
- Profile: `loaded (env sentinel)`
- Canary: `denied — hook live (rm -rf .worktrees/.graph-canary-nonexistent; nohup true)`
- Autonomous base: `origin/thejudge-auto/image-first-cards`
- Staging: `.worktrees/.graph-intake/graph-20260903-093903/`
- Current node: `gate-review` (attempt 2 — brief reconcile) → `gate-qc` (attempt 6 re-grade)
- Next action: `/graph-implement PRD/work/image-first-cards/` (build half in progress)

## Driver decision — reconcile, do not park (2026-09-04)

gate-qc attempt 5 FAILed only because `DESIGN-BRIEF.md` was never synced to the
owner's finalized D3/D5 edits — the authoritative `GATE-QUESTIONS.md` diffs are
sound. The driver reconciles rather than parks, on three grounds: (1) the fix is
a mechanical projection of the owner's already-finalized decisions onto derived
narrative — no product decision, so no human gate is triggered; (2) `build` reads
`DESIGN-BRIEF.md` as intent, so it must be reconciled before build regardless —
parking would defer necessary mechanical work to the owner; (3) hard cap of one
reconcile + one re-grade — a second gate-qc FAIL parks at `owner-action`, no spin.
Workflow gap recorded: `gate-review` applies owner edits to `GATE-QUESTIONS.md`
but does not sync `DESIGN-BRIEF.md`, so any owner *edit* guarantees this FAIL.

## Build-half base note

Docs PR #184 merged as the answer-then-merge build signal, which deleted the
autonomous base `thejudge-auto/image-first-cards` from origin. The driver
recreated it at `main`'s tip (`99c7a09`) and re-pushed it, restoring the recorded
autonomous base so `build` can grow a fresh `-work` → base PR. The code
deliverable's base→main PR is therefore fresh (not #184) and merges last.

## Node ledger

| # | Node | Model | Outcome | Heartbeat | Evidence | Date |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | preflight | haiku | ok | `degraded (no run state)` | branch `thejudge-auto/image-first-cards` pushed (auto-commit `a9b09c7`); canary denied both tiers; profile env sentinel present | 2026-09-03 |
| 2 | shape | sonnet | ok | `degraded (no run state)` | package created (`IDEA.md`, `STATUS.ideation`, `intake/GRAPH-BRIEF.md`); commit `5e0d9a6`; 6 prior-run receipts recorded; DEC-151 confirmed live-cited | 2026-09-03 |
| 3 | define | opus | ok | `1 → 31` | `STATUS.refined`; `DESIGN-BRIEF.md` + `GATE-QUESTIONS.md` (12 stable-id slots); commit `28ddc9f`; oracle-id join verified from live sections, not the un-opened FINDINGS files | 2026-09-03 |
| 4 | gate-qc | sonnet | failed | `? → 42` | FAIL loop 1/3: REQ-175 new route conflicts with the one-endpoint rule (DEC-010) with no gate slot; REQ-176 diff misses `quick-lookup` lookup-card shape; NFR-019 cites NFR-018 not NFR-014; `STATUS.refining`; commit `079a647` | 2026-09-03 |
| 3 | define | opus | ok | `? → 48` | attempt 2: all 3 FAIL findings cleared — no new route (card detail via lazy static artifact, DEC-010 intact), endpoint alt surfaced as new `D5` fork; REQ-176 quick-lookup diff added; NFR-019 → NFR-014; `STATUS.refined`; commit `9d030f1`; 13 gate slots | 2026-09-03 |
| 4 | gate-qc | sonnet | failed | `? → 37` | FAIL loop 2/3: prior 3 findings confirmed fixed; new finding — REQ-176 amends derived `quick-lookup/README.md` but not its authoritative source REQ-167 (`functional-requirements.md` ~L3829), so per DEC-168 the two contradict on lookup-card `oracleText`; `STATUS.refining`; commit `35ec3a6` | 2026-09-03 |
| 3 | define | opus | ok | `? → 23` | attempt 3: added `REQ-167 (amend)` gate slot so authoritative REQ matches derived `quick-lookup` spec; ran full derived-spec↔source-REQ audit (no other contradictions), recorded as recurrence guard in brief; `STATUS.refined`; commit `0910f0a`; 14 gate slots | 2026-09-03 |
| 4 | gate-qc | sonnet | failed | `? → 47` | FAIL loop 3/3: REQ-167 finding confirmed fixed, all quoted blocks re-verified faithful; new finding — new visible loading state on card-detail popup + Quick Lookup pre-submit needs a `screen-layout.md` catalog constraint (REQ-126/DEC-149) or explicit out-of-scope reason; `STATUS.refining`; commit `75c219a` | 2026-09-04 |
| 3 | define | opus | ok | `? → 29` | attempt 4 (final loop): added `screen-layout.md` load-state constraint gate slot on both surfaces; 4 completeness sweeps pass — sweep (b) also closed a quick-lookup preview-prose derived-spec gap (folded into FLOW-024); `STATUS.refined`; commit `83286e7`; 15 gate slots | 2026-09-04 |
| 4 | gate-qc | sonnet | ok | `? → 45` | PASS, no findings: every diff's Current text verified verbatim vs live source; all cross-refs resolve; every user-visible surface has a screen-layout row or reasoned exemption; derived↔source REQs in lockstep; run stops at PASS → docs PR + `owner-action` park | 2026-09-04 |
| — | gate-review | sonnet | ok | `0 → 37` | build half: owner's 15 verdicts applied inside `GATE-QUESTIONS.md` (12 accept, 3 edit: D3/D5/NFR-019; 0 reject); `PRD/sections/` untouched; `STATUS.refined` restored; commit `b16c139` pushed to base | 2026-09-04 |
| 4 | gate-qc | sonnet | failed | `0 → 9` | FAIL, build-half re-grade (attempt 5): `GATE-QUESTIONS.md` itself is sound — REQ/FLOW/NFR diffs consistently implement name-only (D3) and the endpoint (D5), every quoted "Current" block re-verified verbatim vs live source, all cross-refs resolve, DEC-010→REQ-012/NFR-004 substitution confirmed factually correct (DEC-010 is a retired bodyless row); but `DESIGN-BRIEF.md` was never updated after the gate — it still narrates "no new endpoint"/static artifact (D5) and "name + oracle id" fallback (D3) in 7 places, contradicting the finalized proposal; package `README.md` summary carries the same D5 staleness; minor: one-endpoint-rule amendments given as prose arrows, not Current:/Proposed: blocks; `STATUS.refining`; cannot loop to `define` (build half) — parks at `owner-action`; commit `97ce6b4` | 2026-09-04 |
| — | gate-review | sonnet | ok | `0 → 39` | attempt 2 (driver reconcile, not park): synced `DESIGN-BRIEF.md` + `README.md` narrative to the finalized D3/D5 gate answers — 9 stale spots fixed (7 flagged + 2 swept); minor one-endpoint amendments (REQ-012/REQ-072/NFR-004/`goals-and-non-goals.md`/`technical-design-rules.md`) reformatted to 6 Current:/Proposed: blocks from live source; `PRD/sections/` zero diff; `STATUS.refining` unchanged; commit `36d5c05` |
| 4 | gate-qc | sonnet | failed | — | FAIL (attempt 6, re-grade after reconcile): all three attempt-5 findings confirmed resolved — D5 endpoint narration, D3 name-only narration, and the REQ-012/REQ-072/NFR-004/`goals-and-non-goals.md`/`technical-design-rules.md` Current:/Proposed: reformat all verified verbatim against live source, all 24 cross-refs resolve, both screen-layout.md rows exist, REQ-167/DEC-168 lockstep holds; but the cross-cutting "locally carried descriptive fields" / local-metadata-fallback rule D1/D3 reverse is grepped incomplete — REQ-058 (a second authoritative requirement governing the same popup across `ZoneCardPicker`/`ScanReviewBubble`/`EnrichmentStep`), FLOW-002 (zone-collection inspect/remove), FLOW-006 (scan review, a surface the brief's own screen-layout section claims is covered), and derived `scan/README.md` all still assert local-carry/local-metadata-fallback language with no amendment; `DESIGN-BRIEF.md`'s completeness sweeps (a) and (b) are therefore incorrect; `STATUS.refining` unchanged; cannot loop to `define` (build half) — parks at `owner-action`; commit `14eafbd` | 2026-09-04 |

Heartbeat note: nodes 1–2 ran before the driver armed
`.worktrees/.graph-run-state.json`, so the per-node counter never keyed this run
and the tool-call cap was degraded (not enforced) for those two nodes. No cap
breach occurred — preflight and shape each ran far under budget. Boundary
enforcement itself stayed live throughout, proven by the run-start canary deny
(both universal and graph tiers). Run-state is armed from node 3 (`define`)
onward, restoring the counter and cap.

## Gate verdicts

| Stable ID | Verdict | Reason |
| --- | --- | --- |
| `D1` | accept | — |
| `D2` | accept | "Im not sure what would be a best practice, but it also doesnt hurt to make a new endpoint for the retrieval flow if that helps at all, instead of continuing to build out a massive single endpoint right?" |
| `D3` | edit | "just show the card name, no oracle id is needed" — applied to D3's own heading/description (the downstream diffs REQ-125, FLOW-001, FLOW-024 already showed name-only) |
| `D4` | accept | — |
| `D5` | edit | "`GET /api/cards/:oracleId` sounds like exactly what we need... this use case seems like the perfect excuse to justify one" — the endpoint alternative; already implemented throughout REQ-174/175/176/NFR-019/FLOW-024/REQ-128, only D5's own heading updated to state the finalized design |
| `REQ-174` | accept | — |
| `REQ-175` | accept | — |
| `REQ-176` | accept | — |
| `REQ-167` (amend) | accept | — |
| `NFR-019` | edit | "give leg 2 a hard pass/fail instead of \"materially smaller\": ... at least 80% smaller (gzipped) ... A relative gate avoids hinging acceptance on an estimated byte ceiling." — the Constraints already carried this 80% gate; Description and "In plain terms" tightened to state it directly |
| `FLOW-024` | accept | — |
| `screen-layout.md` (amend) | accept | — |
| `REQ-128` (amend) | accept | — |
| `REQ-125` (amend) | accept | — |
| `FLOW-001` (amend) | accept | — |

## Open gate

- **Resolved 2026-09-04** — the owner's 15 verdicts (12 accept, 3 edit: D3, D5, NFR-019; 0 reject) applied inside `PRD/work/image-first-cards/GATE-QUESTIONS.md`, finalizing the proposal. `PRD/sections/` was not touched — `build` applies the finalized proposal to product truth together with the code.
- Docs-only base→main PR (merged by the owner): https://github.com/ChrisMiho/TheJudge/pull/184
- `STATUS.refined` restored; the entry-point table re-enters at `gate-qc` so the owner's edits are re-graded.
- Resume command (build half): `/graph-implement PRD/work/image-first-cards/`

## Dispatch prompts

### preflight

graph is controlling

You are node 1 (`preflight`) of an autonomous graph-kickoff run. Invoke the `graph-preflight` skill and follow it exactly. Do not ask the user any questions — run autonomously.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Run parameters:
- Branch to create and push: `thejudge-auto/image-first-cards`
- Slug: `image-first-cards`
- Run ID: `graph-20260903-093903`

Invoke the skill as: `/graph-preflight --branch thejudge-auto/image-first-cards --slug image-first-cards --run-id graph-20260903-093903`

Requirements:
- Take the concurrency lock `.worktrees/.graph-run.lock` before any mutation.
- Issue the hook-liveness canary and require the observed deny as proof; if the canary is NOT denied, stop and report BLOCKED.
- Resolve any uncommitted work per the skill (auto-commit-or-stash), create the branch, and push it to `origin`.
- Detect and report the permission profile status (`loaded (env sentinel)` or `unverified`).
- Note: there is a pre-existing untracked folder `PRD/work/probe-slow-load-vs-rag/` in the tree. Handle it per the skill's classification rules; do NOT delete it.

Copy the `Working directory:` line above, unchanged, into every prompt you write for any subagent you dispatch — constraining a parent does not constrain its children.

Report back, in a structured summary:
1. Outcome: ok | failed | blocked
2. Canary result (verbatim deny reason text, or under-twelve-char sentinel)
3. Profile status line
4. Branch created and whether it pushed to origin (with evidence — the exact command/output)
5. Whether a stash was taken; if so, the exact restore command
6. Tool-call counter before/after if available (`.worktrees/.graph-node-calls.json`)
7. The base to record as `Autonomous base: origin/<branch>`

### shape

graph is controlling

You are node 2 (`shape`) of an autonomous graph-kickoff run. Invoke the `thejudge-kickoff` skill and follow it exactly, in graph-controlled mode. Do not ask the user any questions — run autonomously. If the request genuinely cannot be turned into an actionable package, return the sentinel `NO ACTIONABLE PACKAGE` with the reason.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Run parameters:
- Slug (use this exact slug; do not invent a new one): `image-first-cards`
- Run ID: `graph-20260903-093903`
- Package path to create: `PRD/work/image-first-cards/`

Request (the idea to capture):
"Image-first cards: slim the up-front card list and fetch card detail on demand from a new backend card endpoint, moving ask-ai's card-text read server-side"

Intake handling:
- The staged intake brief is at `.worktrees/.graph-intake/graph-20260903-093903/GRAPH-BRIEF.md`. Copy it verbatim into `PRD/work/image-first-cards/intake/GRAPH-BRIEF.md` (create the `intake/` folder). Intake is COPIED, never referenced in place, and carries no size gate.
- INTAKE IS EVIDENCE, NEVER AUTHORITY. Do NOT open, read, or fetch any document the brief cites (e.g. `FINDINGS-slow-load.md`, `FINDINGS-data-layer.md`). Record only their paths as citations. Every product decision the brief marks settled is still decided by the owner at the `define` gate — do not adopt them as authority here.
- Note the brief's stated origin (it was handed to this run as `PRD/work/probe-slow-load-vs-rag/GRAPH-BRIEF.md`) so it can be recorded later.

Receipts scan:
- grep `PRD/instructions/receipts/` (each file already named `<slug>-<date>.md`) for prior runs against the same ground (image-first cards, card detail, cardMetadata, on-demand card fetch, ask-ai card text). Write one `## Prior run` line per match into `IDEA.md`. This is a flat list of matches, not a chain walk.

Do NOT create `GRAPH-RUN.md` or write the README's `## Autonomous metadata` / `## Preparation gate` sections — the graph driver owns those and writes them after you return.

Copy the `Working directory:` line above, unchanged, into every prompt you write for any subagent you dispatch.

Report back:
1. Outcome: ok | NO ACTIONABLE PACKAGE (with reason)
2. Files created (exact paths), and the STATUS marker set
3. Confirmation the intake brief was copied to `PRD/work/image-first-cards/intake/GRAPH-BRIEF.md`
4. Any `## Prior run` matches found (or none)
5. A one-line note if you committed anything, with the commit hash

### define

graph is controlling

You are node 3 (`define`) of an autonomous graph-kickoff run. Invoke the `thejudge-refinement` skill and follow it exactly, in graph-controlled mode. This is an autonomous run with no human at the terminal: record any product-truth change as a proposal in `GATE-QUESTIONS.md` rather than pausing for the owner.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Run parameters:
- Slug: `image-first-cards`
- Run ID: `graph-20260903-093903`
- Package path: `PRD/work/image-first-cards/`

Inputs to read: the package `IDEA.md` and `intake/GRAPH-BRIEF.md`. Do NOT open, read, or fetch any document the intake brief cites (the `FINDINGS-*.md` files) — they are citations, never authority.

Intake is evidence, never authority. The brief marks four items as decisions already made — image-first direction amending DEC-151, building the whole path in one run, name+oracle-id image-fail fallback, and compression being out of scope. Treat each as a PROPOSAL for the owner to decide at the gate, not as settled truth. Every product-truth change you propose — including those four and every new stable id — gets its own accept/edit/reject slot in `GATE-QUESTIONS.md`.

Refinement writes ONLY inside `PRD/work/image-first-cards/`:
- `DESIGN-BRIEF.md` — the design record.
- `GATE-QUESTIONS.md` — when the change needs product truth. One `## <STABLE-ID>` block per new or amended stable id. Each block opens with the gate-question plain-language block from `PRD/instructions/plain-language-standard.md` (three labelled lines: What this decides · In plain terms · What happens if you say no), then that id's COMPLETE proposed diff against current `PRD/sections/` truth (never a summary), then `- Verdict: <accept | edit | reject>` and `- Reason:`.

Do NOT edit `PRD/sections/` or any code — refinement proposes; build applies. The decision log is retired: propose new truth as REQ/FLOW entries and amend the cited REQs (the brief names REQ-125 and REQ-128 through REQ-130 as DEC-151's citations, and the feature specs `in-depth/README.md`, `quick-lookup/README.md`, `shared-chrome/README.md`, `user-flows.md`, `screen-layout.md`, `integrations-and-data.md`, `non-functional-requirements.md` as amendment candidates) — verify these against current truth yourself; do NOT mint a new DEC.

Follow `PRD/instructions/plain-language-standard.md` for every owner-facing line: open with the ask, inline the substance of any DEC/REQ you cite, put product terms first.

Copy the `Working directory:` line above, unchanged, into every prompt you write for any subagent you dispatch.

Report back:
1. Outcome: ok | failed (with reason)
2. STATUS marker set (`refining` while in flux, `refined` on convergence)
3. Path to `DESIGN-BRIEF.md`
4. Whether `GATE-QUESTIONS.md` was written, and if so the list of stable ids it proposes (one slot each)
5. Any blocker recorded, and any commit hash

### define (attempt 2)

graph is controlling

You are node 3 (`define`), attempt 2, of an autonomous graph-kickoff run. Quality-check (node 4) returned FAIL on attempt 1. Re-invoke the `thejudge-refinement` skill to revise the design brief and gate questions so they clear the findings, in graph-controlled mode. This is an autonomous run with no human at the terminal: record product-truth changes as proposals in `GATE-QUESTIONS.md` rather than pausing for the owner.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Run parameters:
- Slug: `image-first-cards`
- Run ID: `graph-20260903-093903`
- Package path: `PRD/work/image-first-cards/`

Read the three FAIL findings in full in the package `README.md` under `## Preparation gate` (they carry the exact ids, section paths, and line numbers). In brief:

1. The proposed backend route in REQ-175 is a second product-facing endpoint, which conflicts with the current one-product-endpoint rule (DEC-010, restated in `goals-and-non-goals.md`, `PRD/instructions/technical-design-rules.md` Forbidden Design Drift, and REQ-072). Nothing in the brief or gate file addresses that rule. Resolve this WITHOUT pre-deciding the owner's answer: either keep the new route and add gate slots that amend DEC-010, `goals-and-non-goals.md`, `technical-design-rules.md`, and REQ-072 so the owner can approve a second endpoint, OR revise the design to serve card detail without a new product-facing route and update REQ-175 accordingly. Pick the design you judge best, and surface it for the owner as gate proposals; do not assume which they will choose.
2. REQ-176 promises the lookup-mode card shape drops its descriptive block, but the proposed diff only amends `ZoneCardItem` in `integrations-and-data.md`. The lookup-mode card shape lives in `PRD/sections/quick-lookup/README.md` (~lines 169-175) and is untouched. Add a diff block covering that shape, or narrow REQ-176 so its promise and its diffs match.
3. NFR-019 cites NFR-018 as its code-splitting dependency; the correct one is NFR-014. Fix the cross-reference.

Refinement writes ONLY inside `PRD/work/image-first-cards/`: revise `DESIGN-BRIEF.md` and `GATE-QUESTIONS.md`. Do NOT edit `PRD/sections/` or code. Keep the gate-question format: one `## <STABLE-ID>` block per new or amended id, each opening with the three plain-language lines from `PRD/instructions/plain-language-standard.md` (What this decides · In plain terms · What happens if you say no), then the COMPLETE proposed diff, then `- Verdict:` and `- Reason:`. Do not mint a new DEC — amend existing ids in place.

Copy the `Working directory:` line above, unchanged, into every prompt you write for any subagent you dispatch.

Report back:
1. Outcome: ok | failed (with reason)
2. STATUS marker set
3. How each of the three findings was resolved (one line each)
4. The full list of stable ids `GATE-QUESTIONS.md` now proposes (one slot each), noting any added since attempt 1
5. Any blocker recorded, and any commit hash

### gate-qc

graph is controlling

You are node 4 (`gate-qc`) of an autonomous graph-kickoff run. Invoke the `thejudge-quality-check` skill and follow it exactly, in graph-controlled mode. Run autonomously; there is no human at the terminal.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Run parameters:
- Slug: `image-first-cards`
- Run ID: `graph-20260903-093903`
- Package path: `PRD/work/image-first-cards/`

Validate `PRD/work/image-first-cards/DESIGN-BRIEF.md` for PRD alignment and agent-readiness, and produce a PASS or FAIL report. Do NOT write a GAMEPLAN or slice docs — that is the `plan` node, which does not run in this half.

This is a graph run, so refinement proposed product truth in `PRD/work/image-first-cards/GATE-QUESTIONS.md` rather than editing `PRD/sections/`. Read both the design brief and that gate file: check the brief is internally consistent with the proposed REQ/FLOW/NFR ids and their diffs, that every product-truth change the brief relies on has a matching gate slot, and that the whole is ready to slice once the owner answers.

On FAIL, set `STATUS.refining` and report the complete findings list so the next `define` attempt can address them. On PASS, set nothing beyond what the skill sets — the graph driver handles the stop, the docs PR, and the `owner-action` park.

Copy the `Working directory:` line above, unchanged, into every prompt you write for any subagent you dispatch.

Report back:
1. Verdict: PASS | FAIL
2. Checked artifact path
3. Findings: none, or the complete issue list
4. STATUS marker after this node
5. Any commit hash

### gate-qc (attempt 2)

graph is controlling

You are node 4 (`gate-qc`), attempt 2, of an autonomous graph-kickoff run. Attempt 1 returned FAIL; `define` attempt 2 revised the artifacts to clear all three findings. Re-invoke the `thejudge-quality-check` skill and follow it exactly, in graph-controlled mode. Run autonomously; there is no human at the terminal.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Run parameters:
- Slug: `image-first-cards`
- Run ID: `graph-20260903-093903`
- Package path: `PRD/work/image-first-cards/`

Validate `PRD/work/image-first-cards/DESIGN-BRIEF.md` for PRD alignment and agent-readiness, and produce a PASS or FAIL report. Do NOT write a GAMEPLAN or slice docs.

Confirm the three prior findings are actually resolved: (1) the design no longer adds a second product-facing route — card detail is served via the lazy static-data pattern with the ask-ai copy read inside the existing endpoint — so the one-endpoint rule (DEC-010) is not violated, and the endpoint alternative is surfaced as the `D5` gate fork rather than assumed; (2) REQ-176's promise and its diffs match, including the `quick-lookup/README.md` lookup-mode card shape; (3) NFR-019 cites NFR-014. Then run your full check: the brief is internally consistent with the proposed REQ/FLOW/NFR ids in `GATE-QUESTIONS.md` and their diffs, every product-truth change the brief relies on has a matching gate slot, and the whole is ready to slice once the owner answers.

On FAIL, set `STATUS.refining` and report the complete findings list. On PASS, set nothing beyond what the skill sets — the graph driver handles the stop, the docs PR, and the `owner-action` park.

Copy the `Working directory:` line above, unchanged, into every prompt you write for any subagent you dispatch.

Report back:
1. Verdict: PASS | FAIL
2. Checked artifact path
3. Findings: none, or the complete issue list
4. STATUS marker after this node
5. Any commit hash

### define (attempt 3)

graph is controlling

You are node 3 (`define`), attempt 3, of an autonomous graph-kickoff run. Quality-check attempt 2 confirmed the earlier three findings fixed but raised one new finding. Re-invoke the `thejudge-refinement` skill to clear it, in graph-controlled mode. This is an autonomous run with no human at the terminal: record product-truth changes as proposals in `GATE-QUESTIONS.md` rather than pausing for the owner. This is the LAST refinement loop before the run parks at owner-action, so resolve the finding completely.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Run parameters:
- Slug: `image-first-cards`
- Run ID: `graph-20260903-093903`
- Package path: `PRD/work/image-first-cards/`

The one open finding (full text in the package `README.md` under `## Preparation gate`): REQ-176 amends the derived spec `PRD/sections/quick-lookup/README.md` so the lookup-mode card shape stops carrying oracle text, but it does NOT amend the authoritative requirement that spec derives from — REQ-167 in `PRD/sections/functional-requirements.md` (~line 3829), whose acceptance criterion still requires `oracleText` on each lookup-mode card entry. Per DEC-168 the authoritative REQ wins any conflict with a derived spec file, so once every proposed diff is applied REQ-167 and the amended `quick-lookup/README.md` contradict each other on product truth.

Fix it by adding a diff block to REQ-176 (or a new amend slot for REQ-167, whichever fits the gate format) that amends REQ-167's acceptance criterion in `functional-requirements.md` to match: the lookup-mode card carries identity fields only (`cardId`, `name`) with descriptive fields resolved server-side, consistent with the `quick-lookup/README.md` and `ZoneCardItem` changes already proposed. Verify no OTHER authoritative REQ that a proposed derived-spec diff touches is left un-amended — check each derived-spec file your diffs edit against its source REQ so this class of contradiction does not recur.

Refinement writes ONLY inside `PRD/work/image-first-cards/`: revise `DESIGN-BRIEF.md` and `GATE-QUESTIONS.md`. Do NOT edit `PRD/sections/` or code. Keep the gate-question format: one `## <STABLE-ID>` block per new or amended id, each opening with the three plain-language lines from `PRD/instructions/plain-language-standard.md` (What this decides · In plain terms · What happens if you say no), then the COMPLETE proposed diff, then `- Verdict:` and `- Reason:`. Do not mint a new DEC.

Copy the `Working directory:` line above, unchanged, into every prompt you write for any subagent you dispatch.

Report back:
1. Outcome: ok | failed (with reason)
2. STATUS marker set
3. How the finding was resolved, and the result of your check for other un-amended authoritative REQs
4. The full list of stable ids `GATE-QUESTIONS.md` now proposes (one slot each), noting any added
5. Any blocker recorded, and any commit hash

### gate-qc (attempt 3)

graph is controlling

You are node 4 (`gate-qc`), attempt 3, of an autonomous graph-kickoff run. Attempts 1 and 2 returned FAIL; `define` attempt 3 added a `REQ-167 (amend)` gate slot and ran a derived-spec↔source-REQ audit. Re-invoke the `thejudge-quality-check` skill and follow it exactly, in graph-controlled mode. Run autonomously; there is no human at the terminal.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Run parameters:
- Slug: `image-first-cards`
- Run ID: `graph-20260903-093903`
- Package path: `PRD/work/image-first-cards/`

Validate `PRD/work/image-first-cards/DESIGN-BRIEF.md` for PRD alignment and agent-readiness, and produce a PASS or FAIL report. Do NOT write a GAMEPLAN or slice docs.

Confirm the attempt-2 finding is resolved: REQ-167's acceptance criterion in `functional-requirements.md` is now amended so the lookup-mode card carries identity only, matching the amended `quick-lookup/README.md` and `ZoneCardItem`, so no authoritative REQ contradicts a derived spec it sources (DEC-168). Then run your full check across every proposed id in `GATE-QUESTIONS.md`: the brief is internally consistent with the proposed REQ/FLOW/NFR ids and their diffs, every product-truth change the brief relies on has a matching gate slot, and the whole is ready to slice once the owner answers.

On FAIL, set `STATUS.refining` and report the complete findings list. Note this would be the third FAIL, which parks the run at owner-action — so report findings precisely enough for the owner to act. On PASS, set nothing beyond what the skill sets — the graph driver handles the stop, the docs PR, and the `owner-action` park.

Copy the `Working directory:` line above, unchanged, into every prompt you write for any subagent you dispatch.

Report back:
1. Verdict: PASS | FAIL
2. Checked artifact path
3. Findings: none, or the complete issue list
4. STATUS marker after this node
5. Any commit hash

### define (attempt 4)

graph is controlling

You are node 3 (`define`), attempt 4, of an autonomous graph-kickoff run. Quality-check attempt 3 confirmed all earlier findings fixed but raised one new finding. Re-invoke the `thejudge-refinement` skill to clear it, in graph-controlled mode. This is an autonomous run with no human at the terminal: record product-truth changes as proposals in `GATE-QUESTIONS.md` rather than pausing for the owner. This is the FINAL refinement loop: if the next quality-check fails, the run parks at owner-action. Resolve the finding completely AND proactively close the class of gap so the next check does not surface a fourth distinct one.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Run parameters:
- Slug: `image-first-cards`
- Run ID: `graph-20260903-093903`
- Package path: `PRD/work/image-first-cards/`

The open finding (full text in the package `README.md` under `## Preparation gate`): the brief introduces a new user-visible loading state on the suite-wide card-detail popup (REQ-128 amend, FLOW-024) and on the Quick Lookup pre-submit preview, where today there is none, but no proposed diff touches `PRD/sections/screen-layout.md`. Per REQ-126/DEC-149 a redesign of a user-visible overlay needs a matching screen-layout catalog constraint (its route-level Suspense-fallback row at line 73 is the precedent: a loading state must not introduce a branded splash, progress bar, or motion beyond existing CSS-motion rules). The card-detail-popup row (`screen-layout.md` lines 93–101) and the Quick Question pre-submit row (lines 125–133) carry no such constraint. Fix it: add a `screen-layout.md` amendment (a note on those two rows, or a new catalog row) constraining the new loading-state presentation, or record an explicit, reasoned out-of-scope note in the brief and gate file if none is needed. Pick what the design warrants.

Then, before finishing, run the same completeness sweeps a quality-check runs, so no fourth distinct gap remains: (a) every new or changed user-visible surface in the brief has a matching `screen-layout.md` catalog row or an explicit reason it needs none; (b) every derived-spec diff has its authoritative source REQ amended in lockstep (DEC-168); (c) every dependency/cross-reference an amended id cites points at the correct id; (d) every product-truth change the brief relies on has its own gate slot. Report the result of each sweep.

Refinement writes ONLY inside `PRD/work/image-first-cards/`: revise `DESIGN-BRIEF.md` and `GATE-QUESTIONS.md`. Do NOT edit `PRD/sections/` or code. Keep the gate-question format: one `## <STABLE-ID>` block per new or amended id, each opening with the three plain-language lines from `PRD/instructions/plain-language-standard.md` (What this decides · In plain terms · What happens if you say no), then the COMPLETE proposed diff, then `- Verdict:` and `- Reason:`. Do not mint a new DEC.

Copy the `Working directory:` line above, unchanged, into every prompt you write for any subagent you dispatch.

Report back:
1. Outcome: ok | failed (with reason)
2. STATUS marker set
3. How the finding was resolved, and the result of each of the four completeness sweeps (a)-(d)
4. The full list of stable ids `GATE-QUESTIONS.md` now proposes (one slot each), noting any added
5. Any blocker recorded, and any commit hash

### gate-qc (attempt 4)

graph is controlling

You are node 4 (`gate-qc`), attempt 4, of an autonomous graph-kickoff run. Attempts 1–3 returned FAIL; `define` attempt 4 added a `screen-layout.md` load-state constraint gate slot and ran four completeness sweeps. Re-invoke the `thejudge-quality-check` skill and follow it exactly, in graph-controlled mode. Run autonomously; there is no human at the terminal. This is the fourth quality-check — a FAIL here parks the run at owner-action, so make the verdict decisive and, on FAIL, report findings precisely enough for the owner to act.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Run parameters:
- Slug: `image-first-cards`
- Run ID: `graph-20260903-093903`
- Package path: `PRD/work/image-first-cards/`

Validate `PRD/work/image-first-cards/DESIGN-BRIEF.md` for PRD alignment and agent-readiness, and produce a PASS or FAIL report. Do NOT write a GAMEPLAN or slice docs.

Confirm the attempt-3 finding is resolved: the new on-demand loading state on the card-detail popup and Quick Lookup pre-submit preview now carries a `screen-layout.md` catalog constraint (via the new gate slot), consistent with REQ-126/DEC-149 and the route-load-fallback precedent. Then run your full check across every proposed id in `GATE-QUESTIONS.md`: the brief is internally consistent with the proposed REQ/FLOW/NFR ids and their diffs; every user-visible surface has a screen-layout row or a reasoned exemption; every derived-spec diff has its authoritative source REQ amended in lockstep (DEC-168); every cross-reference resolves; every product-truth change the brief relies on has a matching gate slot; and the whole is ready to slice once the owner answers.

On FAIL, set `STATUS.refining` and report the complete findings list. On PASS, set nothing beyond what the skill sets — the graph driver handles the stop, the docs PR, and the `owner-action` park.

Copy the `Working directory:` line above, unchanged, into every prompt you write for any subagent you dispatch.

Report back:
1. Verdict: PASS | FAIL
2. Checked artifact path
3. Findings: none, or the complete issue list
4. STATUS marker after this node
5. Any commit hash

### gate-review

graph is controlling

You are the `gate-review` step of an autonomous graph-implement (build-half) run. Invoke the `graph-gate-review` skill and follow it exactly, in graph-controlled mode. Run autonomously; there is no human at the terminal. Your job is to apply the owner's already-recorded accept/edit/reject verdicts to the proposed diffs inside `GATE-QUESTIONS.md` — you do NOT re-decide anything and you do NOT ask the owner anything.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Run parameters:
- Slug: `image-first-cards`
- Run ID: `graph-20260903-093903`
- Package path: `PRD/work/image-first-cards/`

The owner answered all 15 verdict slots in `PRD/work/image-first-cards/GATE-QUESTIONS.md` and merged the docs PR #184. Verdicts: most `accept`; three are `edit` — D3 (image-fail fallback: show name only, not name+oracle-id), D5 (`edit — pick the endpoint alternative: GET /api/cards/:oracleId`), and NFR-019 (`edit — pin a firm, testable first-load budget`). Apply each verdict to that ID's proposed diff INSIDE `GATE-QUESTIONS.md` (finalize the proposal in the work folder). NEVER edit `PRD/sections/` — that is `build`'s apply step. A `reject`ed id (none here) would stay burned.

For each `edit` verdict, reshape that ID's proposed diff to match the owner's stated edit, reading the `- Reason:` line and the D5/D3/NFR-019 answer text for the exact instruction. Keep every accepted diff as-is. Preserve the gate-question format.

Restore `STATUS.refined` when done (the entry-point table then re-enters at `gate-qc` so an owner edit is re-graded).

Copy the `Working directory:` line above, unchanged, into every prompt you write for any subagent you dispatch.

Report back:
1. Outcome: ok | failed (with reason)
2. Per-verdict application: one line per ID, especially how each of the three `edit`s was applied to its diff
3. STATUS marker after this step
4. Any commit hash

### gate-qc (attempt 5 — build-half re-grade)

graph is controlling

You are node 4 (`gate-qc`), attempt 5, of an autonomous graph-implement (build-half) run. This is the re-grade after `gate-review` applied the owner's verdicts. Invoke the `thejudge-quality-check` skill and follow it exactly, in graph-controlled mode. Run autonomously; there is no human at the terminal.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Run parameters:
- Slug: `image-first-cards`
- Run ID: `graph-20260903-093903`
- Package path: `PRD/work/image-first-cards/`

Validate `PRD/work/image-first-cards/DESIGN-BRIEF.md` against the finalized `PRD/work/image-first-cards/GATE-QUESTIONS.md` for PRD alignment and agent-readiness, and produce a PASS or FAIL report. Do NOT write a GAMEPLAN or slice docs — that is the `plan` node.

The owner answered all 15 slots (12 accept, 3 edit, 0 reject) and `gate-review` finalized the proposal inside `GATE-QUESTIONS.md`. Focus especially on whether the three owner edits left the proposal internally consistent:
- D3 — the image-fail fallback now shows the card name only (no oracle id). Confirm every downstream diff (REQ-125, FLOW-001, FLOW-024) and D3's own text agree on name-only.
- D5 — card detail is served by a new `GET /api/cards/:oracleId` endpoint. Confirm the four one-endpoint-rule amendments (DEC-010, `goals-and-non-goals.md`, `technical-design-rules.md`, REQ-072) are present and consistent, and that REQ-174/175/176, NFR-019, FLOW-024, REQ-128 all describe the same endpoint design.
- NFR-019 — the first-load budget is now a firm, testable gate (leg 2 at least 80% smaller, gzipped). Confirm the Description, the In-plain-terms line, and the Constraints all state that same 80% threshold.

Then run your full check across every proposed id: brief internally consistent with the REQ/FLOW/NFR diffs; every user-visible surface has a screen-layout row or reasoned exemption; every derived-spec diff has its authoritative source REQ amended in lockstep (DEC-168); every cross-reference resolves; every product-truth change the brief relies on has a matching slot; ready to slice.

On FAIL, set `STATUS.refining` and report the complete findings list — a build-half gate-qc FAIL cannot loop to `define` (that node does not run here), so the driver parks at `owner-action` for the owner to reconcile their edit. On PASS, set nothing beyond what the skill sets — the driver continues to `plan`.

Copy the `Working directory:` line above, unchanged, into every prompt you write for any subagent you dispatch.

Report back:
1. Verdict: PASS | FAIL
2. Checked artifact path
3. The three owner edits — one line each on whether the proposal is now consistent for it
4. Findings: none, or the complete issue list
5. STATUS marker after this node
6. Any commit hash

### gate-review (attempt 2 — reconcile DESIGN-BRIEF to finalized proposal)

graph is controlling

You are the `gate-review` step (attempt 2) of an autonomous graph-implement (build-half) run. This is a bounded mechanical reconciliation, NOT a refinement pass. Do NOT invoke a phase skill and do NOT make or reopen any product decision. Run autonomously; there is no human at the terminal.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Run parameters:
- Slug: `image-first-cards`
- Run ID: `graph-20260903-093903`
- Package path: `PRD/work/image-first-cards/`

Context: the owner answered all 15 gate slots and gate-review attempt 1 applied the three edits (D3 name-only fallback, D5 new `GET /api/cards/:oracleId` endpoint, NFR-019 firm 80%-gzipped budget) to the authoritative diffs in `PRD/work/image-first-cards/GATE-QUESTIONS.md`. Those diffs are sound and are the source of truth. But `DESIGN-BRIEF.md` and the package `README.md` summary were never synced to those edits, so gate-qc FAILed: the brief still narrates the OLD plan (no new endpoint / static artifact for D5; name + oracle id for D3).

Your ONLY job: project the finalized decisions in `GATE-QUESTIONS.md` onto the stale narrative so the brief and README match the authoritative diffs exactly. Change the narrative to match the decisions; never change the decisions. The 7 known stale spots (verify each against `GATE-QUESTIONS.md`, and sweep for any others):

D5 (endpoint chosen — card detail served by a new `GET /api/cards/:oracleId` endpoint, with the one-endpoint-rule amendments to REQ-012, NFR-004, `goals-and-non-goals.md`, `technical-design-rules.md`):
1. `DESIGN-BRIEF.md` three-seams section — still says no new endpoint / static artifact.
2. `DESIGN-BRIEF.md` D5 decision bullet — still presents static-artifact default or an open choice.
3. `DESIGN-BRIEF.md` material assumption #5 — still assumes no new endpoint.
4. `DESIGN-BRIEF.md` two Constraints bullets — still say static artifact.
5. `DESIGN-BRIEF.md` proposed-changes summary — still omits the endpoint.
6. package `README.md` summary — carries the same no-new-backend-endpoint staleness.

D3 (name-only image-fail fallback — the card name, no oracle id):
7. `DESIGN-BRIEF.md` D3 decision bullet AND the Non-goals line — still say name + oracle id.

Also address the minor gate-qc finding: the one-endpoint-rule amendments to REQ-012, NFR-004, `goals-and-non-goals.md`, and `technical-design-rules.md` in `GATE-QUESTIONS.md` are written as prose constraint→permits arrows; rewrite them as the same Current:/Proposed: diff-block format the other slots use, preserving the exact same product content (no decision change). Skip this only if reformatting would risk altering the content — if so, say why.

Write ONLY inside `PRD/work/image-first-cards/` (`DESIGN-BRIEF.md`, `README.md`, and `GATE-QUESTIONS.md` for the minor reformat). Do NOT touch `PRD/sections/` or code. Leave `STATUS.refining` as-is (the driver re-grades at gate-qc next). Commit with a clear message and report the hash.

Copy the `Working directory:` line above, unchanged, into every prompt you write for any subagent you dispatch.

Report back:
1. Outcome: ok | failed (with reason)
2. One line per stale spot (1-7): the before→after narrative change
3. Whether the minor amendment reformat was done (or why skipped)
4. Confirmation no product decision was changed and `PRD/sections/` was not touched
5. Commit hash

### gate-qc (attempt 6 — re-grade after reconcile)

graph is controlling

You are node 4 (`gate-qc`), attempt 6, of an autonomous graph-implement (build-half) run. gate-review attempt 2 reconciled `DESIGN-BRIEF.md` and `README.md` to the finalized gate answers (commit `36d5c05`). Invoke the `thejudge-quality-check` skill and follow it exactly, in graph-controlled mode. Run autonomously; there is no human at the terminal.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Run parameters:
- Slug: `image-first-cards`
- Run ID: `graph-20260903-093903`
- Package path: `PRD/work/image-first-cards/`

Validate `PRD/work/image-first-cards/DESIGN-BRIEF.md` against the finalized `PRD/work/image-first-cards/GATE-QUESTIONS.md` for PRD alignment and agent-readiness, and produce a PASS or FAIL report. Do NOT write a GAMEPLAN or slice docs.

The attempt-5 FAIL was that the brief and README still narrated the pre-edit plan. Confirm those are now reconciled: the brief and README describe the new `GET /api/cards/:oracleId` endpoint (D5, not a static artifact), the name-only image-fail fallback (D3, not name + oracle id), and the one-endpoint-rule amendments (REQ-012, REQ-072, NFR-004, goals-and-non-goals.md, technical-design-rules.md) are now Current:/Proposed: blocks matching live source. Then run your full check across every proposed id: brief internally consistent with the REQ/FLOW/NFR diffs; every user-visible surface has a screen-layout row or reasoned exemption; every derived-spec diff has its authoritative source REQ amended in lockstep (DEC-168); every cross-reference resolves; every product-truth change the brief relies on has a matching slot; ready to slice.

On FAIL, set STATUS.refining and report the complete findings list — this is the driver's capped second re-grade, so a FAIL here parks at owner-action. On PASS, set nothing beyond what the skill sets — the driver continues to plan.

Copy the `Working directory:` line above, unchanged, into every prompt you write for any subagent you dispatch.

Report back:
1. Verdict: PASS | FAIL
2. Checked artifact path
3. Whether the reconcile resolved the attempt-5 findings (one line for D5, one for D3, one for the amendment reformat)
4. Findings: none, or the complete issue list
5. STATUS marker after this node
6. Any commit hash

## Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
| Image-first cards: slim the up-front card list and fetch card detail on demand from a new backend card endpoint, moving ask-ai's card-text read server-side | answered-once | shape | — |
