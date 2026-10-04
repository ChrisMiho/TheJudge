# Graph run — scanner-caution-always-visible

- Run ID: `graph-20261004-154238`
- Profile: `loaded (env sentinel)` (reported by graph-preflight at node 1)
- Canary: `denied — hook live (universal: rm -rf denied in every session; graph: nohup denied while lock held)`
- Autonomous base: `origin/main` (rewritten by the build half's claim; docs PR #255 merged)
- Worktree: `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-scanner-caution-always-visible`
- Staging: `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/.graph-intake/graph-20261004-154238/`
- Current node: `owner-action` (claimed by build half; resolving the answered gate)
- Next action: `/graph-implement PRD/work/scanner-caution-always-visible/`

## Node ledger

| # | Node | Model | Outcome | Heartbeat | Evidence | Date |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | preflight | haiku | ok | `0 → 11` | branch `thejudge-auto/scanner-caution-always-visible` cut from origin/main, pushed from `.worktrees/kickoff-scanner-caution-always-visible`; lock taken pid 53602; canary denied both tiers (universal rm -rf, graph nohup); Profile loaded (env sentinel); launch checkout untouched (on main) | 2026-10-04 |
| 2 | shape | sonnet | ok | `0 → 10` | package `PRD/work/scanner-caution-always-visible/` created (IDEA.md, README.md, STATUS.ideation, intake/request.md, intake/observations.md); board row added under `## ideation`; 2 receipt matches noted (trade-balancer-first-card-ux-2026-09-10, ui-look-translation-2026-10-02); intake copied→committed→staged-copy-deleted; commit a50d541 | 2026-10-04 |
| 3 | define | opus | ok | `0 → 41` | DESIGN-BRIEF.md + GATE-QUESTIONS.md written; one stable-id proposal amending REQ-214 (caution triangle shows from scanner open) with complete 4-spot diff (functional-requirements.md Description+Acceptance, scan/README.md, user-flows.md, screen-layout.md); B1 scope fork (all surfaces vs Trade Balancer only, recommend all — shared component + no-fork rule) and B2 (count-pill default) in `## Blocker questions`; PRD/sections/ untouched; STATUS.refined; no run-halting blocker; commit 4e92284 | 2026-10-04 |
| 4 | gate-qc | sonnet | ok | `0 → 10` | PASS — DESIGN-BRIEF + GATE-QUESTIONS checked; all 4 REQ-214 diff spots anchor against live PRD (functional-requirements.md 5486/5493, scan/README.md 107-111, user-flows.md 131/136, screen-layout.md 213); REQ-214 confirmed right owner (already says "every host that scans"); no other live spot needs amending; code claim re-verified (ScanReviewBubble.tsx:40 null-return); B1/B2 well-formed; one minor non-blocking nit (scan/README wording "Beside the count pill" while pill may be absent — note for build); no changes/commit; STATUS.refined stood → moved to owner-action at park | 2026-10-04 |
| — | gate-review | sonnet | ok | `0 → 32` | build-half claim: kickoff worktree removed, `thejudge-auto/scanner-caution-always-visible-work` cut from origin/main (README base→origin/main, ledger worktree→implement; commit 212d57f), pushed; lock taken pid 32963; graph canary `nohup true` denied (graph tier live). graph-gate-review applied 3 verdicts (REQ-214 accept, B1 all surfaces, B2 keep pill as-is), 0 edit/reject IDs; reconciled B2 wording in GATE-QUESTIONS.md diffs 3 & 5 (alongside the count pill once it appears) + DESIGN-BRIEF count-pill/A1/A2; PRD/sections/ untouched; STATUS.refined restored; board row owner-action→refined; commit 3175d92 | 2026-10-04 |
| 4 | gate-qc | sonnet | failed | `0 → 11` | FAIL (build-half re-entry) — premise invalidated: the always-on caution shipped in CODE while this package was in flight. ui-pass-2 slice E (commit 0ee1928, merged in PR #254 2026-10-04 23:08Z) removed `ScanReviewBubble.tsx`'s `if (entries.length === 0) return null` null-return, so the caution triangle now shows from scanner open on all three surfaces (shared component). Slice E also amended `user-flows.md` (steps 1 & 5), so the proposal's diff-4b (user-flows.md step-5 removal) no longer anchors. Slice E did NOT touch the other three PRD files — `functional-requirements.md` REQ-214 Acceptance (5493), `scan/README.md` (108-111), `screen-layout.md` (213) still describe the old "caution beside the count pill / hidden until held" behaviour, now contradicting the shipped code + user-flows.md. No code left to build; residual is PRD-truth reconciliation only. STATUS→refining (by node) → owner-action (at park) | 2026-10-04 |

## Open gate

- **Parked at `owner-action` 2026-10-04 (build half, gate-qc FAIL).** The thing this package was created to build — the scanner's always-on caution triangle — **already shipped in code** before the build started, so there is a scope decision only the owner should make.
- **What happened (evidence):** ui-pass-2 slice E (commit `0ee1928`, merged in PR #254 at 2026-10-04 23:08Z) deleted the `if (entries.length === 0) return null` guard in the shared `apps/frontend/src/components/ScanReviewBubble.tsx`. The caution triangle now renders from the moment the scanner opens, on all three scanner surfaces at once (Trade Balancer, In-Depth card picker, Quick Lookup) because they share that one component. The warning still opens only on tap; the count pill still appears on the first held card. That is exactly REQ-214 as this package proposed it, including B1 (all surfaces) and B2 (pill unchanged). The docs PR #255 merged at 23:28Z, after #254; the build branch was cut from `origin/main` after both, so the fix is already in this worktree's base.
- **What is left:** PRD truth is only half reconciled. Slice E amended `user-flows.md` (steps 1 & 5) but **not** the other three truth files. `functional-requirements.md` REQ-214 Acceptance (line 5493), `scan/README.md` (lines 108-111), and `screen-layout.md` Chrome row (line 213) still describe the old "caution beside the count pill, hidden until a card is held" behaviour, which now contradicts both the shipped code and user-flows.md.
- **Decision for the owner (recommendation first):**
  - **(A) Recommended — close as already-shipped.** The feature is live on `main`. Close this package (`thejudge-cleanup`), and handle the three stale PRD files as a small doc-hygiene follow-up (or accept the drift). Running the full build lifecycle to merge three prose edits with no code change is heavier than the work warrants.
  - **(B) Docs-only build.** Keep the package and let `build` apply only the residual PRD truth — amend `functional-requirements.md` REQ-214 Description+Acceptance, `scan/README.md`, and `screen-layout.md` to match the shipped code and user-flows.md. No code change. (This needs the proposal re-anchored first: drop the stale diff-4b, and reconcile the brief's claim that all four files still say "beside the count pill".)
- **Resume after you choose:** for (B), `/graph-implement PRD/work/scanner-caution-always-visible/` (it will loop to `define` to re-anchor the proposal, then re-grade). For (A), say so and I will close the package.

## Gate verdicts

| Stable ID | Verdict | Reason |
| --- | --- | --- |
| `REQ-214` | accept | "yes — the triangle always displays and brings up the pop-up warning when clicked on" |
| `B1` | all surfaces | "all scanners get this; the same scanner component should be used for all flows ... Fix the shared component once." |
| `B2` | keep pill as-is | "leave the pill as-is (appears on first hold) — just make sure the triangle and the count pill sit next to each other whenever both are present" |

### Brief reconciliation

- grep: `grep -nEi "beside|alongside|next to|flip the owner|self-resolved|recommendation, not" DESIGN-BRIEF.md GATE-QUESTIONS.md` (no hits left contradicting a verdict)
- `GATE-QUESTIONS.md` diff 3 (scan/README.md) — said "Beside the count pill, a caution control ..." → now says the triangle sits top-right from open, "with the count pill alongside it once the pill appears" (B2 wording nit)
- `GATE-QUESTIONS.md` diff 5 (screen-layout.md Chrome row) — said pill "beside/beneath it" → now "alongside it (always adjacent, never overlapping) once the pill appears on the first held card" (B2)
- `DESIGN-BRIEF.md` design section (count pill bullet) — added: triangle and pill sit alongside each other whenever both present (B2)
- `DESIGN-BRIEF.md` A1 — evidence "flip the owner can request" → owner verdict B2 (keep pill as-is; adjacent when both present)
- `DESIGN-BRIEF.md` A2 — "recommendation, not a self-resolved decision" → owner verdict B1 (all surfaces, fix shared component once)
- `README.md` intake pointer — none needed (intake does not state superseded behaviour)

## Dispatch prompts

### preflight

graph is controlling

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

You are node 1 (`preflight`) of an autonomous graph run. Invoke the `graph-preflight` skill and follow it exactly. Do not improvise or hand-resolve anything; if the script exits non-zero, relay its message verbatim and stop.

Run parameters:
- --branch thejudge-auto/scanner-caution-always-visible
- --slug scanner-caution-always-visible
- --run-id graph-20261004-154238
- --pid 53602

Procedure (from the graph-preflight skill):
1. Run the dry run first:
   `npm run graph:preflight -- --branch thejudge-auto/scanner-caution-always-visible --slug scanner-caution-always-visible --run-id graph-20261004-154238 --pid 53602 --dry-run`
   Report the `shape:`, resolved `base:`, `worktree:`, and the `profile sentinel:` / `Profile:` lines verbatim.
2. If the script exits 1 or 2, stop and relay its message verbatim. Do not retry or repair.
3. Otherwise re-run the identical command WITHOUT `--dry-run` and with the same `--run-id`. This takes the concurrency lock and creates/pushes the branch.
4. Liveness canary: the script prints a `CANARY_COMMAND` (universal tier) and a `GRAPH_CANARY_COMMAND` (graph tier). Issue each as a real Bash tool call and require the boundary hook to DENY it. The deny reason text is the proof. Issue the universal canary and the graph canary (the graph canary must be issued AFTER the lock is taken, i.e. after the real run). Classify each with the skill's `classifyCanary` / `classifyGraphCanary` guidance and report the resulting ledger lines. An ALLOWED canary means no enforcer — report the BLOCKED message verbatim and stop; do NOT dispatch onward.
5. Confirm end state: in `.worktrees/kickoff-scanner-caution-always-visible`, `git branch --show-current` is `thejudge-auto/scanner-caution-always-visible`, `git ls-remote --heads origin thejudge-auto/scanner-caution-always-visible` shows it pushed, and `git branch --show-current` at the launch root `/Users/chrismiho/Coding/Projects/TheJudge` is UNCHANGED (still `main`).

Report back, in a compact block:
- shape: line
- base: line
- worktree: absolute path
- Profile: line (verbatim)
- Canary (universal): the ledger line
- Canary (graph): the ledger line
- lock record: the contents of `.worktrees/.graph-run.lock`
- branch pushed: yes/no
- launch root branch after: the value (must be `main`)
- any non-zero exit and its verbatim message

Do not edit any file. Do not commit. Do not touch the launch checkout. If you fan out to any sub-subagent (you should not need to), copy the `Working directory:` line above unchanged into its prompt.

### shape

graph is controlling

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-scanner-caution-always-visible

You are node 2 (`shape`) of an autonomous graph-kickoff run. Invoke the `thejudge-kickoff` skill and run it to completion under graph control. Do not pause for user approval — graph is controlling. Return your result to the graph driver.

Request (verbatim; inner quotes rendered curly so the span records as one instruction): "In the Trade Balancer card scanner, the “experimental” caution triangle only shows after a card has been scanned, so people whose scans fail never get warned. Make it always visible in the scanner's top-right from the moment it opens (like the direction-1 mockup), with the warning popping up only when the triangle is tapped."

Supplied slug (use verbatim, do NOT propose your own): scanner-caution-always-visible
Run ID: graph-20261004-154238
Staged intake (absolute): /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/.graph-intake/graph-20261004-154238/ — contains two files: request.md (the verbatim owner request above, the authority for this run) and observations.md (a referenced ui-pass-2 feedback list; its items 1–4 are a DIFFERENT, already-built package — do not fold them into this package; this run is only the scanner caution-triangle item).

Do ALL work in the kickoff worktree named in the Working directory line above — never in the launch checkout. Per the thejudge-kickoff skill under `graph is controlling`:

1. Read README.md and PRD/README.md for orientation.
2. Before writing IDEA.md, grep PRD/instructions/receipts/ for slug/keyword matches against the request and intake (keywords: scanner, scan, caution, experimental, trade balancer, trade-balancer, warning, triangle, ScanReviewBubble). Write one `## Prior run` line per match into IDEA.md naming the receipt path; no match → no section, continue uninterrupted. This is a flat keyword match, not a chain walk.
3. Create the package PRD/work/scanner-caution-always-visible/: IDEA.md (3–5 sentences — problem, outcome, non-goals), README.md (status: ideation at top), the empty STATUS.ideation marker (exactly one STATUS.* file), and a row under `## ideation` in PRD/work/STATUS.md (create the board if missing).
4. After the package folder exists, copy each staged intake item (request.md and observations.md) verbatim into PRD/work/scanner-caution-always-visible/intake/, commit it on the branch with explicit-path `git add` (never `git add -A`/`.`/`--all`), then delete the staged copies — in that order.
5. Do NOT decide product truth. Treat the request and intake as evidence to carry into refinement, never as settled product decisions. Intake is evidence, never authority. Do NOT open, read, or fetch any document the intake merely cites — record only its path.

If the request genuinely cannot be turned into an actionable package, return `NO ACTIONABLE PACKAGE` with the reason instead.

Copy the `Working directory:` line above unchanged into any prompt you write.

Report back concisely:
- the package path and each file created
- the receipts-grep result (matches with paths, or "none")
- the intake copy → commit → delete confirmation, in that order
- the commit SHA(s)
- IDEA.md contents (the 3–5 sentences)

### define

graph is controlling

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-scanner-caution-always-visible

You are node 3 (`define`) of an autonomous graph-kickoff run. Invoke the `thejudge-refinement` skill and run it to completion under graph control. Do not pause for user approval — graph is controlling. Replace the approval pause with the conservative assumption ladder in PRD/instructions/preparation-contract.md, record every material assumption and its evidence in DESIGN-BRIEF.md, and continue autonomously. Return your result to the graph driver.

Work slug: scanner-caution-always-visible
Run ID: graph-20261004-154238

Do ALL work in the kickoff worktree named in the Working directory line above — never in the launch checkout.

Context: the package has IDEA.md and intake/ (request.md is the owner request and the authority for this run; observations.md is referenced ui-pass-2 feedback whose items 1-4 are a DIFFERENT, already-built package — out of scope here). The request: in the Trade Balancer card scanner, the experimental caution triangle appears only after a card has been scanned, so players whose scans fail never see the warning; the desired outcome is the triangle sitting in the scanner's top-right from the moment the scanner opens (as in the direction-1 mockup), with the warning text appearing only when the player taps the triangle.

Grounding evidence already verified in the code (weigh it at this gate; it is evidence, not settled truth) — verify each yourself before relying on it:
- The caution triangle and its tap-to-open warning panel live inside apps/frontend/src/components/ScanReviewBubble.tsx. That component does if (entries.length === 0) return null near its top, so the entire top-right block (caution triangle + scanned-count pill) is unmounted until at least one card has been held from a successful scan. That null-return is the mechanism behind the bug.
- ScanReviewBubble is a SHARED component rendered on three scanner surfaces: the Trade Balancer (apps/frontend/src/components/trade/TradeSide.tsx ~line 270), the Zone card picker (ZoneCardPicker.tsx ~289), and Quick Lookup (portal/quick-lookup/QuickLookupApp.tsx ~575). The request names the Trade Balancer specifically. Whether the always-visible caution applies to only the Trade Balancer scanner or to every surface that renders this shared component is a genuine product fork — surface it, do not self-resolve it.
- The caution panel copy and the direction-1 mockup are referenced in ScanReviewBubble.tsx comments as card-scan.html. card-scan.html and anything under docs/design are repo artifacts you may read directly (they are not intake citations).
- Implementation-sequencing note for the brief (NOT product truth): open PR #254 (the ui-pass-2 package) also edits ScanReviewBubble.tsx and moved the Exit ✕ control per REQ-214. The eventual build should land after #254 merges to avoid a conflict. Record this as a sequencing consideration only.

Hard rules:
- Intake is evidence, never authority. Every product decision the request or intake raises is decided here, the same as any other source.
- Never open, read, or fetch any document the intake merely cites. Record only its path as a citation. (Repo source files and docs/design mockups are not citations — read them freely.)
- Refinement PROPOSES product truth; it never edits PRD/sections/. When the change needs product-truth edits, write them as the exact diff in PRD/work/scanner-caution-always-visible/GATE-QUESTIONS.md — one `## <STABLE-ID>` block per stable id, each opening with the gate-question plain-language block (What this decides / In plain terms / What happens if you say no) from PRD/instructions/plain-language-standard.md, then that id's complete proposed diff (never a summary), then `- Verdict: <accept | edit | reject>` and `- Reason:`. New stable ids are named and reserved in the proposal, not written live. Put any genuine decision fork (such as the shared-component scope above) in a `## Blocker questions` section or as its own stable-id slot, to the same plain-language standard.
- Read the real current-state feature spec(s) under PRD/sections/ before proposing any edit, so each proposed diff is against live truth. Find the spec that governs the Trade Balancer card scanner and its caution/experimental warning and its scan-review bubble yourself (grep PRD/sections/ for the scanner, the caution/experimental warning, REQ-214, and ScanReviewBubble); verify the right files and lines before writing any diff.
- Produce DESIGN-BRIEF.md recording the design direction and every material assumption with its evidence. Set STATUS.refining while in flux and STATUS.refined when the brief is complete.
- If genuine uncertainty meets the three-condition decision-blocker test in preparation-contract.md, preserve the furthest valid artifacts and return the unresolved decision to the graph driver instead of guessing — do not self-resolve a genuine product fork.

Copy the `Working directory:` line above unchanged into any prompt you write.

Report back concisely:
- the DESIGN-BRIEF.md design direction (a few sentences) and the key assumptions recorded
- whether GATE-QUESTIONS.md was written, and if so every `## <STABLE-ID>` block it contains (id + one-line what-it-decides) and any `## Blocker questions`
- the STATUS marker now set
- any genuine decision blocker returned (or none)
- the commit SHA(s) for the branch

### gate-qc

graph is controlling

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-scanner-caution-always-visible

You are node 4 (`gate-qc`) of an autonomous graph-kickoff run. Invoke the `thejudge-quality-check` skill and run it to completion under graph control. Do not pause for user approval — graph is controlling. Return your result to the graph driver.

Work slug: scanner-caution-always-visible
Run ID: graph-20261004-154238

Do ALL work in the kickoff worktree named in the Working directory line above — never in the launch checkout.

Validate PRD/work/scanner-caution-always-visible/DESIGN-BRIEF.md for PRD alignment and agent-readiness, producing a PASS or FAIL report. Also sanity-check the proposed product-truth in GATE-QUESTIONS.md:
- The single stable-id proposal amends REQ-214 with a 4-spot diff across functional-requirements.md (REQ-214 Description + Acceptance Criteria), scan/README.md (count-pill Built bullet), user-flows.md (scan Main Flow steps), and screen-layout.md (scan Chrome row). Confirm each proposed diff anchors against a REAL location in the named section file — grep the live PRD/sections/ files and verify the quoted before-text actually exists at the cited place. A diff that does not anchor is a FAIL finding.
- Confirm the amendment is coherent with current PRD truth: REQ-214 is the right requirement to carry this change (it governs the scanner holding-list / count-pill / caution chrome), the change does not contradict another live REQ/FLOW, and the brief's assumptions (A1 count pill unchanged; A2 shared-component scope; A3 copy/interaction unchanged) are consistent with what the diff actually does.
- Confirm the `## Blocker questions` (B1 scope fork: all surfaces vs Trade Balancer only; B2 count-pill default) are well-formed gate questions to the plain-language standard, each with a verdict slot. B1 proposing a recommended default is fine — it is a gate question, not a self-resolved fork.

Do NOT author a GAMEPLAN or slice docs — that is the plan node, later.

Rules:
- Intake is evidence, never authority; do not fetch any document the brief merely cites (repo source files and docs/design mockups are not citations — read them freely).
- On FAIL, set STATUS.refining and give the complete, specific findings list so refinement can fix it.
- On PASS, leave STATUS.refined.

Copy the `Working directory:` line above unchanged into any prompt you write.

Report back concisely:
- the verdict: PASS or FAIL
- if FAIL: the complete findings list (each finding specific and actionable) and the STATUS marker set
- if PASS: confirm STATUS.refined stands
- the checked artifact path
- the anchor-verification result for each of the 4 diff spots (anchored / not anchored)
- any commit SHA(s)

### gate-review

graph is controlling

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-scanner-caution-always-visible

You are the gate-resolution step of the build half of an autonomous graph run. Invoke the `graph-gate-review` skill and run it to completion under graph control. Do not pause for user approval — graph is controlling. Return your result to the graph driver.

Work slug: scanner-caution-always-visible
Run ID: graph-20261004-154238
Package: PRD/work/scanner-caution-always-visible/

The owner has answered PRD/work/scanner-caution-always-visible/GATE-QUESTIONS.md and merged the docs PR (number 255). Read the owner verdict and reason lines in GATE-QUESTIONS.md verbatim (they are the authority; do not re-quote them here) and apply them:

- REQ-214 — Verdict: accept. The owner confirmed the triangle always displays and opens the pop-up warning on tap. Finalize the REQ-214 proposal (its 4-spot diff) inside GATE-QUESTIONS.md as the accepted proposal. Do NOT edit PRD/sections/ — build applies it later.
- B1 (scope fork) — Verdict: all surfaces. The owner chose all three scanner surfaces, fixing the shared component once. The REQ-214 amendment already names every host; confirm it stays all-surfaces and that the brief shared-component scope assumption A2 agrees.
- B2 (count pill) — Verdict: keep pill as-is. The owner kept the count pill unchanged (it appears on first hold) and added one requirement: the caution triangle and the count pill must sit alongside each other whenever both are present. Reconcile the brief and the proposal to this: the count pill stays unchanged; the caution triangle sits in the scanner top-right from open, with the count pill alongside it once the first card is held; and resolve the known wording nit in the scan/README.md proposed diff so it reads alongside the count pill once it appears rather than beside a pill that may be absent. This reconciles wording to the owner verdict; it is not a new product decision.

Then:
- Reconcile DESIGN-BRIEF.md (and the README intake pointer, if any) to every edit/reject so the re-grade and plan see one consistent package. B1 and B2 confirm the proposal existing direction, so the reconciliation is bounded to the B2 wording nuance above.
- Restore STATUS.refined.
- Record the verdicts in GATE-QUESTIONS.md.
- Do NOT commit — leave the edits in the worktree for the driver to commit between nodes.

Copy the `Working directory:` line above unchanged into any prompt you write.

Report back concisely:
- the verdict applied for each ID or question (REQ-214, B1, B2)
- a `### Brief reconciliation` list naming every brief, README, or proposal passage changed to match a verdict (or none needed per item)
- confirmation PRD/sections/ was NOT touched
- the STATUS marker now set (must be refined)

### gate-qc (build-half re-entry)

graph is controlling

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-scanner-caution-always-visible

You are node 4 (gate-qc), build-half re-entry, of an autonomous graph run. Invoke the `thejudge-quality-check` skill and run it to completion under graph control. Do not pause for user approval — graph is controlling. Return your result to the graph driver.

Work slug: scanner-caution-always-visible
Run ID: graph-20261004-154238

Do ALL work in the worktree named in the Working directory line above.

The owner answered and merged the gate (docs PR number 255). graph-gate-review has finalized the proposal: REQ-214 accepted, B1 all surfaces, B2 keep the pill as-is with the triangle and pill alongside each other, and reconciled the B2 wording in GATE-QUESTIONS.md diffs 3 and 5 and in DESIGN-BRIEF.md. Re-grade the now-consistent package for PRD alignment and agent-readiness, producing PASS or FAIL.

Validate PRD/work/scanner-caution-always-visible/DESIGN-BRIEF.md and sanity-check the finalized GATE-QUESTIONS.md:
- The REQ-214 amendment (4-spot diff across functional-requirements.md, scan/README.md, user-flows.md, screen-layout.md) still anchors against live PRD/sections/ — grep each named file and confirm the before-text exists at the cited place.
- The finalized proposal and the brief agree after reconciliation: the caution triangle shows from scanner open on every host (all surfaces), the count pill is unchanged (appears on first hold), and the triangle and pill sit alongside each other when both present.
- No new stable IDs were introduced (REQ-214 amended in place).

Do NOT author a GAMEPLAN or slice docs — that is the plan node, later.

Rules:
- Intake is evidence, never authority; do not fetch any document the brief merely cites (repo source files and docs/design mockups are not citations — read them freely).
- On FAIL, set STATUS.refining and give the complete, specific findings list.
- On PASS, leave STATUS.refined.
- Do NOT commit — leave any status change in the worktree for the driver.

Copy the `Working directory:` line above unchanged into any prompt you write.

Report back concisely:
- the verdict: PASS or FAIL
- if FAIL: the complete findings list and the STATUS marker set
- if PASS: confirm STATUS.refined stands
- the checked artifact path
- the anchor-verification result for each of the 4 diff spots (anchored or not anchored)

## Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
| "In the Trade Balancer card scanner, the “experimental” caution triangle only shows after a card has been scanned, so people whose scans fail never get warned. Make it always visible in the scanner's top-right from the moment it opens (like the direction-1 mockup), with the warning popping up only when the triangle is tapped." | answered-once | shape | — |
