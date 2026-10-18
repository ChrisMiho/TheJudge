# Graph run — scanner-recovers-and-runs-lighter

- Run ID: `graph-20261018-055113` (spec-forming half); `graph-20261018-063434` (build half)
- Profile: `loaded (env sentinel)` at node 1; build half `unverified`
- Canary: `denied — hook live (rm -rf canary: [graph-boundary] rm -rf is denied in every session; graph canary nohup: denied while a graph run holds the lock)`; build half: graph canary `nohup true` denied (`nohup` is denied while a graph run holds the lock)
- Autonomous base: `origin/main`
- Worktree: `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-scanner-recovers-and-runs-lighter`
- Staging: `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/.graph-intake/graph-20261018-055113/` (one file, `GRAPH-BRIEF-scanner.md`, copied verbatim to `PRD/work/scanner-recovers-and-runs-lighter/intake/`)
- Current node: `owner-action` (parked after `build` attempt 1)
- Next action: answer the slice D question under `## Open gate`, then `/graph-implement PRD/work/scanner-recovers-and-runs-lighter/` re-enters at `build` attempt 2 (slice D only)

## Node ledger

| # | Node | Model | Outcome | Heartbeat | Evidence | Date |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | preflight | haiku | ok | `0 → 7` | branch `thejudge-auto/scanner-recovers-and-runs-lighter` pushed (`git ls-remote` → `041eab94` = `origin/main`) from `.worktrees/kickoff-scanner-recovers-and-runs-lighter`; launch checkout still on `main`, porcelain only the pre-existing untracked `PRD/work/probe-codebase-health-pass/`; lock `.worktrees/.graph-run.lock` runId `graph-20261018-055113` pid 6563; universal canary and graph canary `nohup true` both denied | 2026-10-18 |
| 2 | shape | sonnet | ok | `0 → 17` | `PRD/work/scanner-recovers-and-runs-lighter/` (IDEA.md with 34 `## Prior run` lines, README.md, STATUS.ideation, `intake/GRAPH-BRIEF-scanner.md` byte-identical to staging) and board row committed `e030224f`, `8ecaff8e`, pushed (= origin tip); worktree porcelain empty | 2026-10-18 |
| 3 | define | opus | ok | `0 → 89` | commit `3b548f5c` (= origin tip): `DESIGN-BRIEF.md` (five changes, slice order recovery → shared identifier + per-frame → panel → scan map, ladder per open decision, disposition rows), `GATE-QUESTIONS.md` (REQ-214, REQ-056, REQ-048, REQ-066 amended; REQ-249 new — REQ-248 held by open PR #317; `## Blocker questions` none; 5 blank verdict slots), `evidence/measurements.md` (live, dev server port 5181, canvas fake camera, 390×844 and 1280×800: In-Depth ✕ covers the caution triangle at both widths, Quick Question and Trade do not; failed download stays stuck after the 503 lifts; port released, `browser_close`); `STATUS.refined` only marker, board row moved; `git diff --stat origin/main HEAD -- PRD/sections apps scripts` empty; REQ-249 unused in `PRD/sections/`; porcelain empty both checkouts (launch: pre-existing probe folder only) | 2026-10-18 |
| 4 | gate-qc | sonnet | ok | `0 → 26` | PASS, 0 blocking, 4 advisory (A1 parity check is `identify.test.ts` + `vectors.json`, `reference/identify.py` absent; A2 four test fixtures carry `imageUrl`; A3 name `npm run data:scan-map`, drop unused `getImageUrl`; A4 confirm no other `screen-layout.md` row contradicts); every diff hunk matches `PRD/sections/` once; REQ-249 unused; `QUALITY-CHECK.md` commit `c82d38c2` (= origin tip); README `## Preparation gate` PASS recorded by the driver; run stops at PASS → docs PR, `STATUS.owner-action`, board row moved to owner-action | 2026-10-18 |
| 5 | gate-review | sonnet | ok | `0 → 18` | build half run `graph-20261018-063434`: docs PR #318 and verdict PR #319 merged (`origin/main` `30433b2d`); kickoff worktree removed clean (`git worktree remove`); claim commit `4a4da393` on `thejudge-auto/scanner-recovers-and-runs-lighter-work` cut from `origin/main` `30433b2d`, pushed; lock taken from the launch root (pid 6563); graph canary `nohup true` denied; `graph-gate-review` commit `24ed40ca` (= origin tip): 5 accept / 0 edit / 0 reject, `### Brief reconciliation` none; `STATUS.refined` only marker; board row under refined; `git diff --stat origin/main HEAD -- PRD/sections apps scripts` empty; porcelain empty in worktree, launch checkout only the pre-existing untracked `PRD/work/probe-codebase-health-pass/` | 2026-10-18 |
| 4 | gate-qc (build half, attempt 2) | sonnet | ok | `0 → 18` | PASS, 0 blocking, A1–A4 carried forward (A3 adds: gitignored `apps/frontend/data/scryfall/default-cards.json` absent in the worktree); `origin/main` still `30433b2d`; 18 removed-line groups each match `PRD/sections/` once; REQ-249 unused; `QUALITY-CHECK.md` commit `2c840a0d` (= origin tip); `STATUS.refined` only marker; README `## Preparation gate` PASS rewritten by the driver; porcelain empty | 2026-10-18 |
| 5 | plan | sonnet | ok | `0 → 30` | commit `bf3578b7` (= origin tip): `GAMEPLAN.md`, `slice-a.md`–`slice-d.md` sequential (A recovery, B shared identifier + per-frame, C one scanner panel, D smaller scan map), `slice-<a–d>.criteria.json` 9/8/11/12 = 40 criteria, all `false`, 9 `manual`; A1–A4 folded in; `STATUS.active` only marker; board row moved to active; `git diff --stat origin/main HEAD -- PRD/sections apps scripts` empty; porcelain empty | 2026-10-18 |
| 6 | build | sonnet | parked | `0 → 164` | PR https://github.com/ChrisMiho/TheJudge/pull/320 (open, `[THEJUDGE-AUTO][BLOCKED]`, base `main`); commits `7ad402aa` (A), `be7fe746` (B), `ad5a0957` (C) = origin tip; criteria A 9/9, B 8/8, C 11/11, D 0/12 (`.graph-evidence.jsonl` not consulted — known build-half gap, criteria self-reported); reported frontend tests 154 files / 1664 pass, typecheck no errors, lint clean, prettier clean, `test:scripts` 1059 pass / 0 fail; `npm run quality:check` denied twice by the permission classifier, parts run separately; frontend build not run; `PRD/sections/` REQ-249, REQ-214, REQ-056 applied (`functional-requirements.md`, `scan/README.md`, `screen-layout.md`), REQ-048 and REQ-066 not applied. Two park causes: (1) slice D blocker — `npm run data:scan-map` over the launch checkout's `default-cards.json` (Oct 6 snapshot) rebuilt 99,814 entries vs committed 95,895 (3,936 new keys, 17 gone, 4 changed `oracleId`/`name`); rebuilt map discarded, D code left uncommitted in the worktree with a `## Handoff` block in `slice-d.md`; (2) write scope — `classifyBuildWrites` → `park`: `PRD/work/scanner-recovers-and-runs-lighter/.playwright-mcp/a-failed.png` and `a-recovered.png` written in the launch checkout (gitignored, so launch porcelain before/after identical), plus a scratchpad copy of the committed map outside the root; builder's removal of the two PNGs was denied and is left to the owner. Builder also reported python heredoc edits to source files inside the worktree (contract stated limit 1: an interpreter write evades the hook) | 2026-10-18 |

## Open gate

- Terminal state: PARKED at `owner-action` after `build` attempt 1 (2026-10-18). Slices A–C are built and in PR #320; slice D is not.
- Question: how should the slimmer scan map (REQ-048: the scan map stops storing image addresses) be produced? The rule in the brief was "rebuild only with `npm run data:scan-map`", but that script reads your local card dump, which is a newer card snapshot than the one the committed map — and the scanner's fingerprint file `cardhashes.bin` — were built from. Rebuilding from it would list 3,936 printings the scanner has no fingerprint for, lose 17 it does, and change 4 names or oracle ids, so the map and the fingerprints would disagree.
- Recommendation: produce the slim map from the committed map itself — a committed script step that drops only the image-address field and leaves every key, `oracleId` and `name` byte-for-byte, so it stays paired with the fingerprint file — and keep the build-script change so the next full rebuild emits the slim shape too. Before the rebuild the builder confirmed all 95,895 committed image addresses are the derived address plus a `?<timestamp>`, with 0 exceptions, so nothing is lost. A full map-plus-fingerprint refresh stays its own later change.
- Owner answer: <blank — answer here, or in the session>
- Also for the owner: two screenshots landed in the launch checkout, outside the build folder (gitignored, untracked): `PRD/work/scanner-recovers-and-runs-lighter/.playwright-mcp/a-failed.png` and `a-recovered.png`. The builder's removal was denied, so delete them yourself.
- Evidence: `slice-d.md` `## Handoff` and `slice-d.evidence.md` (uncommitted in the build worktree, together with the slice D code: `scripts/build-card-scan-map.mjs`, `resolveScanCandidates.ts`, five test files — reported green); `## Node ledger` row 6; PR https://github.com/ChrisMiho/TheJudge/pull/320.
- Resume: once answered, `/graph-implement PRD/work/scanner-recovers-and-runs-lighter/` re-enters at `build` attempt 2 for slice D only, then `review` grades all four slices.
- Earlier gate: `define` RESOLVED 2026-10-18 — 5 verdicts applied (5 accept, 0 edit, 0 reject); see `## Gate verdicts`.
  (spec-forming park after `gate-qc` PASS attempt 1; docs PR https://github.com/ChrisMiho/TheJudge/pull/318 merged, verdicts PR #319 merged).

## Gate verdicts

| Stable ID | Verdict | Reason |
| --- | --- | --- |
| `REQ-214` | accept | — |
| `REQ-056` | accept | — |
| `REQ-249` | accept | — |
| `REQ-048` | accept | — |
| `REQ-066` | accept | — |

`## Blocker questions`: none.

### Brief reconciliation

none (every verdict was accept; `DESIGN-BRIEF.md`, the README intake pointer and `GATE-QUESTIONS.md` diffs are untouched)

## Dispatch prompts

### preflight

graph is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

You are node 1 (`preflight`) of graph run `graph-20261018-055113`. Follow the skill at /Users/chrismiho/Coding/Projects/TheJudge/.claude/skills/graph-preflight/SKILL.md exactly (read it first, and read PRD/instructions/graph-workflow-contract.md as it asks).

Inputs:
- --branch thejudge-auto/scanner-recovers-and-runs-lighter
- --slug scanner-recovers-and-runs-lighter
- --run-id graph-20261018-055113
- --pid 6563 (the driver session's long-lived pid)
- base: default (origin/main)

Procedure:
1. Run `npm run graph:preflight -- --branch thejudge-auto/scanner-recovers-and-runs-lighter --slug scanner-recovers-and-runs-lighter --run-id graph-20261018-055113 --pid 6563 --dry-run` from the working directory above. Report the shape, base, worktree, planned commands, `profile sentinel:` and `Profile:` lines verbatim.
2. If it exits 1 or 2, stop and relay the message verbatim. Do not resolve anything by hand.
3. Otherwise run the identical command without `--dry-run`.
4. Issue the universal canary command the script prints (`CANARY_COMMAND`) as its own Bash tool call and confirm the hook denies it. Then issue the graph canary (`GRAPH_CANARY_COMMAND`, after the lock is taken) as its own Bash call and confirm it is denied. Report both reason texts verbatim. An allowed canary means BLOCKED: report it and stop.
5. Confirm end state with short separate commands: `cd /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-scanner-recovers-and-runs-lighter && git branch --show-current`; `git ls-remote --heads origin thejudge-auto/scanner-recovers-and-runs-lighter`; and at the launch root `git branch --show-current` (must still be `main`) and `git status --porcelain` (the only expected entry is the untracked `PRD/work/probe-codebase-health-pass/`, which was there before the run). Also `cat /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/.graph-run.lock`.

Rules: never commit, stash, or switch the launch checkout; never force-push; never remove the lock or any `.worktrees/` control file; never retry a denied call verbatim. If you write any file, use the Write/Edit tools, not heredocs or sed -i. Run git as short separate calls. If you dispatch any subagent, copy the `Working directory:` line above unchanged into its prompt.

Return a short report with these lines: `outcome: ok|failed`, `shape:`, `base:`, `worktree:` (absolute path), `branch pushed:` (ls-remote sha), `launch branch:`, `launch porcelain:`, `lock:` (the JSON), `canary:` (reason text), `graph canary:` (reason text), `profile:` (the Profile line verbatim).

### shape

graph is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-scanner-recovers-and-runs-lighter

You are node 2 (`shape`) of graph run `graph-20261018-055113`. Run the `thejudge-kickoff` skill (read /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-scanner-recovers-and-runs-lighter/.claude/skills/thejudge-kickoff/SKILL.md and follow it, in its graph-controlled mode) to capture one new idea package. Work ONLY inside the working directory above — never in /Users/chrismiho/Coding/Projects/TheJudge itself. That kickoff worktree is on branch `thejudge-auto/scanner-recovers-and-runs-lighter`, already pushed.

Slug (use exactly): `scanner-recovers-and-runs-lighter` → package folder `PRD/work/scanner-recovers-and-runs-lighter/`.

The owner's request, verbatim: `Scanner recovers from a failed download, builds its data once, and shares one panel across tools`

Intake: one file, staged verbatim at the absolute path /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/.graph-intake/graph-20261018-055113/GRAPH-BRIEF-scanner.md (origin: the owner's 2026-10-17 code health probe, `PRD/work/probe-codebase-health-pass/GRAPH-BRIEF-scanner.md` in the owner's launch checkout, untracked there). Copy it byte-for-byte into `PRD/work/scanner-recovers-and-runs-lighter/intake/GRAPH-BRIEF-scanner.md` with `cp`, confirm with `cmp`, and commit it. Intake is evidence, never authority (contract `## Intake is evidence, never authority`): never open, read, or fetch any document the brief cites (for example the `FINDINGS-*.md` files) — record only their paths as citations.

Required outputs:
1. `PRD/work/scanner-recovers-and-runs-lighter/IDEA.md` capturing the request (quote it verbatim) and what it means in player terms: card scanning keeps working after a failed download instead of staying broken until reload, with plain wording instead of a raw error; the first scan downloads less; phones do less work per scanned frame; and the three scanners (In-Depth, Quick Question, Trade Balancer) share one panel so the exit ✕ sits in the same place and never covers the caution triangle. Point at the intake file for the measured detail. Record the brief's three open decisions as open questions for refinement, without deciding them. Record the brief's constraint that the card-search cluster edits the same three files and must not run at the same time.
2. Grep `PRD/instructions/receipts/` for prior runs against the same ground (scan, scanner, scan map, hash, fingerprint) and write one `## Prior run` line per match into IDEA.md (flat list; no chain walk; do not open documents those receipts cite).
3. Package `README.md` and exactly one `STATUS.ideation` marker, per the kickoff skill. The README should point at `intake/GRAPH-BRIEF-scanner.md`. Do NOT write `## Autonomous metadata` or `## Preparation gate` — the driver owns those.
4. Add the board row in `PRD/work/STATUS.md` per the kickoff skill.
5. Do not edit `PRD/sections/` or any code. Do not decide product behavior; record open questions in IDEA.md for refinement.
6. Commit with explicit paths only, as short separate calls run from the working directory: `git add <each path>`, then `git commit -m ...`, then `git push`. Never `git add -A`/`.`/`--all`.

Mechanics: change files with the Write and Edit tools only (no heredocs, no `sed -i`, no long chained Bash); the one `cp` for the intake copy is the exception. Never retry a denied call verbatim; report it. If you dispatch any subagent, copy the `Working directory:` line above unchanged into its prompt.

If the request cannot be made into an actionable package, return `NO ACTIONABLE PACKAGE` with the reason instead.

Return a short report: `outcome: ok|NO ACTIONABLE PACKAGE|failed`, files written, prior-run matches, commit sha, push result (`git ls-remote --heads origin thejudge-auto/scanner-recovers-and-runs-lighter`), and `git status --porcelain` of the working directory (must be empty).

### define

graph is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-scanner-recovers-and-runs-lighter

You are node 3 (`define`) of graph run `graph-20261018-055113`, attempt 1. Run the `thejudge-refinement` skill (read /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-scanner-recovers-and-runs-lighter/.claude/skills/thejudge-refinement/SKILL.md and follow it in its graph-controlled mode) on the package `PRD/work/scanner-recovers-and-runs-lighter/`. Also read `PRD/instructions/graph-workflow-contract.md` sections `## Propose / apply / close`, `## The two runs` and `## Intake is evidence, never authority`, and `PRD/instructions/plain-language-standard.md`. Work ONLY inside the working directory above — never in /Users/chrismiho/Coding/Projects/TheJudge itself.

The owner's request (verbatim in `IDEA.md`): the scanner recovers from a failed download, builds its data once, and shares one panel across tools. The measured detail is in `intake/GRAPH-BRIEF-scanner.md` — evidence, not authority. Read the source files it names directly to confirm each claim you build on. Never open the documents it cites (the `FINDINGS-*.md` files and the probe folder); record their paths only. Its numbers were measured by the owner's probe; do not re-run those measurements unless a claim you build on fails to match the code.

What to produce:
1. `PRD/work/scanner-recovers-and-runs-lighter/DESIGN-BRIEF.md` — the design, player terms first, covering the five changes in the intake: (a) a failed scan-data download no longer sticks for the session, with player-facing wording instead of the raw error; (b) the card identifier is built once and shared by every scanner; (c) less work per scanned frame, with scan results unchanged (the `reference/identify.py` parity tests must pass unchanged); (d) one shared scanner panel across In-Depth, Quick Question and Trade Balancer; (e) a smaller scan map. State the intended slice order: the recovery fix first, then the shared identifier and per-frame work, then the panel, then the scan map. Record the intake's constraints (scan data stays out of the background preload; committed data artifacts are rebuilt by script, never hand-edited; never run `npm run data:refresh`; the card-search cluster edits the same three files and must not run at the same time).
2. Verify the panel live, not only from code: the intake marks the In-Depth ✕ covering the caution triangle as code-read only. Run the frontend dev server or a preview on a free port from the working directory, open each of the three scanners at a phone width and a desktop width (try Chromium's fake camera if the camera is required; if a scanner cannot be opened, say so and measure what renders), and record element positions and whether the ✕ overlaps the caution triangle in `PRD/work/scanner-recovers-and-runs-lighter/evidence/measurements.md`. Save screenshots under `PRD/work/scanner-recovers-and-runs-lighter/.playwright-mcp/` in this worktree. Call `browser_close` when done and stop the server you started; report the port and that it is free.
3. The intake lists three open decisions: where the ✕ sits on all three scanners, the player-facing wording when scan data fails to load, and whether scan images may drop the image host's timestamp cache-buster (which only the smallest scan map needs). Each is the owner's product decision. Apply the assumption ladder in `PRD/instructions/preparation-contract.md` to each one separately and fresh; the intake's recommendation is an input to that ladder, not a decision. Put each resulting product-truth choice in front of the owner in `GATE-QUESTIONS.md` — as a proposed `REQ`/`FLOW` diff with a blank verdict slot, or under `## Blocker questions` when it is a genuine blocker under the three-condition test — never settled silently in the brief.
4. If the change needs product truth (new or amended `REQ`/`FLOW` entries in `PRD/sections/`), write `PRD/work/scanner-recovers-and-runs-lighter/GATE-QUESTIONS.md` in the exact format the contract gives: one `## <STABLE-ID>` block per stable ID, each opening with the three plain-language lines (What this decides / In plain terms / What happens if you say no), then that ID's complete proposed diff, then `- Verdict:` and `- Reason:` left blank. Every proposed new or amended ID gets its own block. Enumerate the amendment set by a line-level grep over `PRD/sections/` (scan panel, ✕ / exit, caution triangle, scan map / `cardScanMap`, load failure wording, REQ-066, scanner row in `screen-layout.md`) and record a disposition row per hit in the brief. Do NOT edit `PRD/sections/` or any code; refinement proposes only. Never add a `DEC-###` entry (the decision log is retired). Check that any new stable ID is unused in `PRD/sections/`.
5. Set the status marker per the refinement skill (exactly one marker) and move the `PRD/work/STATUS.md` board row fully (remove from the old section, add to the new).
6. Commit with explicit paths only, as short separate calls from the working directory: `git add <each path>`, then `git commit -m ...`, then `git push`. Never `git add -A`/`.`/`--all`. Do not commit `.playwright-mcp/` captures if they are gitignored.

Budget: this node has a 150 tool-call cap that counts every call, including any subagent's. Work directly; spawn no subagents or forks; no sleeping or polling loops.

Mechanics: change files with the Write and Edit tools only (no heredocs, no `sed -i`, no long chained Bash). Never retry a denied call verbatim; report it. If you dispatch any subagent, copy the `Working directory:` line above unchanged into its prompt.

Return a short report: `outcome: ok|failed`, files written, the proposed stable IDs (one line each, in plain words), any blocker questions, whether the ✕ overlaps the caution triangle live, the status marker, commit sha, push result (`git ls-remote --heads origin thejudge-auto/scanner-recovers-and-runs-lighter`), `git diff --stat origin/main HEAD -- PRD/sections apps scripts` (must be empty), `git status --porcelain` of the working directory (must be empty), and the dev-server port released.

### gate-qc

graph is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-scanner-recovers-and-runs-lighter

You are node 4 (`gate-qc`) of graph run `graph-20261018-055113`, attempt 1. Run the `thejudge-quality-check` skill (read /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-scanner-recovers-and-runs-lighter/.claude/skills/thejudge-quality-check/SKILL.md and follow it in its graph-controlled mode) on `PRD/work/scanner-recovers-and-runs-lighter/DESIGN-BRIEF.md`, together with `GATE-QUESTIONS.md` and `evidence/measurements.md` in the same folder. `intake/GRAPH-BRIEF-scanner.md` is evidence, not authority; never open the documents it cites. Work ONLY inside the working directory above — never in /Users/chrismiho/Coding/Projects/TheJudge itself.

Check in particular:
- Every proposed diff in `GATE-QUESTIONS.md` (REQ-214, REQ-056, REQ-249 new, REQ-048, REQ-066) matches current `PRD/sections/` text exactly once and applies cleanly; every proposed new or amended stable ID has its own block; REQ-249 is unused in `PRD/sections/`.
- Every block opens with the three plain-language lines from `PRD/instructions/plain-language-standard.md`, with the substance of any cited `REQ` inlined; verdict and reason slots are blank; `## Blocker questions` is present.
- Where the brief departs from the intake, the departure is grounded in the code or current product truth: the ✕ as a 44 px square (against REQ-214, REQ-096 and REQ-068), and keeping `name` in the scan map because `scripts/lib/practice-suite-card-names.mjs` reads it. Confirm each against the files themselves.
- The scan-map change names the existing build script that regenerates `cardScanMap.json` and every runtime reader of `imageUrl`; no committed data artifact is to be hand-edited and `npm run data:refresh` is never run.
- The per-frame change keeps scan results identical, with the `reference/identify.py` parity tests named as the check.
- The disposition table covers every hit of the brief's own greps over `PRD/sections/`.
- The slice order is the recovery fix first, then shared identifier and per-frame work, then the panel, then the scan map; acceptance conditions are measurable and agent-ready.

Write `QUALITY-CHECK.md` in the package folder per the skill, with PASS or FAIL and the complete findings. Set the status marker as the skill directs (exactly one marker; on FAIL, `STATUS.refining`, and move the `PRD/work/STATUS.md` board row fully). Do NOT write the README `## Preparation gate` section — the driver owns it. Do not edit `PRD/sections/`, code, `DESIGN-BRIEF.md`, or `GATE-QUESTIONS.md`.

Commit with explicit paths only, as short separate calls from the working directory: `git add <each path>`, then `git commit -m ...`, then `git push`. Never `git add -A`/`.`/`--all`.

Budget: this node has a 60 tool-call cap that counts every call, including any subagent's. Verify directly; spawn no subagents or forks; no sleeping or polling loops; stay well under the cap.

Mechanics: change files with the Write and Edit tools only (no heredocs, no `sed -i`, no long chained Bash). Never retry a denied call verbatim; report it. If you dispatch any subagent, copy the `Working directory:` line above unchanged into its prompt.

Return a short report: `outcome: PASS|FAIL`, the complete findings (blocking and advisory), the status marker, commit sha, push result (`git ls-remote --heads origin thejudge-auto/scanner-recovers-and-runs-lighter`), and `git status --porcelain` of the working directory (must be empty).

### gate-review

graph is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-scanner-recovers-and-runs-lighter

You are the gate-resolution step of graph run `graph-20261018-063434` (build half of package `scanner-recovers-and-runs-lighter`; the spec-forming half was `graph-20261018-055113`). Run the `graph-gate-review` skill: read /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-scanner-recovers-and-runs-lighter/.claude/skills/graph-gate-review/SKILL.md and follow it exactly, on the package `PRD/work/scanner-recovers-and-runs-lighter/`. Also read `PRD/instructions/graph-workflow-contract.md` as the skill asks. Work ONLY inside the working directory above — never in /Users/chrismiho/Coding/Projects/TheJudge itself. The worktree is on the shared branch `thejudge-auto/scanner-recovers-and-runs-lighter-work`, already pushed; the owner answered `GATE-QUESTIONS.md` and merged it to `main` (PR #319).

Every verdict comes from the answered `GATE-QUESTIONS.md` alone. Parse all five blocks (REQ-214, REQ-056, REQ-249, REQ-048, REQ-066) and the `## Blocker questions` section; refuse and name any blank or malformed slot.

Required:
1. Apply each verdict inside `GATE-QUESTIONS.md` only. Never edit `PRD/sections/`, code, or anything under `intake/`.
2. Reconcile `DESIGN-BRIEF.md` and the README intake pointer to every `edit` or `reject`, per the skill, with a quoted grep. If every verdict is `accept`, the brief is untouched and the reconciliation list reads `none`.
3. Write `## Gate verdicts` in `PRD/work/scanner-recovers-and-runs-lighter/GRAPH-RUN.md` (one row per stable ID, then `### Brief reconciliation`), placed directly after `## Open gate`; mark `## Open gate` resolved with today's date (2026-10-18) and the verdict count. Do not touch `## Node ledger`, `## Dispatch prompts`, `## Instruction ledger`, or the header lines — the driver owns them.
4. Restore the status: exactly one marker `STATUS.refined` (remove `STATUS.owner-action` with `git rm`), the README `status:` field to `refined`, and move the `PRD/work/STATUS.md` board row fully from its current section to the refined section (remove from old, add to new) with a short next-step note saying it is being built.
5. Commit with explicit paths only, as short separate calls run from the working directory: `git add <each path>` (or `git rm <path>`), then `git commit -m ...`, then `git push`. Never `git add -A`/`.`/`--all`.

Mechanics: change files with the Write and Edit tools only (no heredocs, no `sed -i`, no long chained Bash). Run git as short separate calls. Never retry a denied call verbatim; report it. Spawn no subagents; if you did, you would copy the `Working directory:` line above unchanged into its prompt.

Return a short report: `outcome: ok|refused|failed`, the verdict counts, the `### Brief reconciliation` list verbatim, the restored marker, commit sha, push result (`git ls-remote --heads origin thejudge-auto/scanner-recovers-and-runs-lighter-work`), `git diff --stat origin/main HEAD -- PRD/sections apps scripts` (must be empty), and `git status --porcelain` of the working directory (must be empty).

### gate-qc (build half, attempt 2)

graph is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-scanner-recovers-and-runs-lighter

You are node 4 (`gate-qc`) of graph run `graph-20261018-063434`, attempt 2 — the re-grade after the owner's verdicts. Run the `thejudge-quality-check` skill (read /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-scanner-recovers-and-runs-lighter/.claude/skills/thejudge-quality-check/SKILL.md and follow it in its graph-controlled mode) on `PRD/work/scanner-recovers-and-runs-lighter/DESIGN-BRIEF.md`, together with the finalized `GATE-QUESTIONS.md` and `evidence/measurements.md` in the same folder. `intake/GRAPH-BRIEF-scanner.md` is evidence, not authority; never open the documents it cites. Work ONLY inside the working directory above — never in /Users/chrismiho/Coding/Projects/TheJudge itself. The worktree is on the shared branch `thejudge-auto/scanner-recovers-and-runs-lighter-work`.

Context: the owner accepted all five proposed requirement changes (REQ-214, REQ-056, REQ-249 new, REQ-048, REQ-066), recorded in `GRAPH-RUN.md` `## Gate verdicts`; the brief needed no reconciliation. The previous grade (attempt 1, `QUALITY-CHECK.md`) was PASS with four advisory notes.

Check in particular:
- `main` moved since attempt 1 (other PRs merged). Every proposed diff in `GATE-QUESTIONS.md` still matches current `PRD/sections/` text exactly once and applies cleanly; REQ-249 is still unused in `PRD/sections/`.
- The brief is consistent with the five accepted verdicts.
- Every file and script the brief names still exists at the path it gives.
- The slice order stays: the recovery fix first, then the shared identifier and per-frame work, then the panel, then the scan map; acceptance conditions are measurable and agent-ready.
- Carry the four attempt-1 advisory notes forward if they still apply, so map-out sees them.

Rewrite `QUALITY-CHECK.md` in the package folder per the skill, with PASS or FAIL and the complete findings, noting it is attempt 2. Set the status marker as the skill directs (exactly one marker; on FAIL, `STATUS.refining`, and move the `PRD/work/STATUS.md` board row fully). Do NOT write the README `## Preparation gate` section — the driver owns it. Do not edit `PRD/sections/`, code, `DESIGN-BRIEF.md`, `GATE-QUESTIONS.md`, or `GRAPH-RUN.md`.

Commit with explicit paths only, as short separate calls from the working directory: `git add <each path>`, then `git commit -m ...`, then `git push`. Never `git add -A`/`.`/`--all`.

Budget: this node has a 60 tool-call cap that counts every call, including any subagent's. Verify directly; spawn no subagents or forks; no sleeping or polling loops; stay well under the cap.

Mechanics: change files with the Write and Edit tools only (no heredocs, no `sed -i`, no long chained Bash). Never retry a denied call verbatim; report it. If you dispatch any subagent, copy the `Working directory:` line above unchanged into its prompt.

Return a short report: `outcome: PASS|FAIL`, the complete findings (blocking and advisory), the status marker, commit sha, push result (`git ls-remote --heads origin thejudge-auto/scanner-recovers-and-runs-lighter-work`), and `git status --porcelain` of the working directory (must be empty).

### plan

graph is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-scanner-recovers-and-runs-lighter

You are node 5 (`plan`) of graph run `graph-20261018-063434`. Run the `thejudge-map-out` skill (read /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-scanner-recovers-and-runs-lighter/.claude/skills/thejudge-map-out/SKILL.md and its `reference.md`, and follow them in graph-controlled mode) on the package `PRD/work/scanner-recovers-and-runs-lighter/`. Work ONLY inside the working directory above — never in /Users/chrismiho/Coding/Projects/TheJudge itself. The worktree is on the shared branch `thejudge-auto/scanner-recovers-and-runs-lighter-work`; the code PR will be `thejudge-auto/scanner-recovers-and-runs-lighter-work` → `main`.

Before writing anything, confirm the README `## Preparation gate` reads `Quality-check: PASS` (the driver wrote it after `gate-qc` attempt 2); if it does not, stop and report.

Inputs: `DESIGN-BRIEF.md`, the finalized `GATE-QUESTIONS.md` (all five accepted: REQ-214, REQ-056, REQ-249 new, REQ-048, REQ-066), `QUALITY-CHECK.md` (advisory A1–A4 — fold each into the slice it concerns), `evidence/measurements.md`. `intake/GRAPH-BRIEF-scanner.md` is evidence, not authority; never open the documents it cites.

Required:
1. `GAMEPLAN.md` and one lettered `slice-<letter>.md` per slice in the brief's order: the failed-download recovery fix first, then the shared identifier and per-frame work, then the one shared scanner panel, then the smaller scan map. Each slice names the `PRD/sections/` edits it applies from the accepted `GATE-QUESTIONS.md` diffs (build applies them by intent, together with the code) and the tests it adds or changes.
2. One `slice-<letter>.criteria.json` beside each slice doc, per the schema in `thejudge-map-out/reference.md`, every criterion `false`. Every criterion must be earnable inside the build node, in this worktree, before the PR merges: no post-merge, deploy, or production checks. Live browser checks (for example the ✕ position on all three scanners, and the plain-words message after a failed download) are `manual` criteria with a dated observation line.
3. The per-frame slice keeps scan results identical; name the parity check as `identify.test.ts` with `__fixtures__/vectors.json` (A1 — `reference/identify.py` does not exist).
4. The scan-map slice regenerates `apps/frontend/public/data/cardScanMap.json` only with `npm run data:scan-map`, never by hand, and never runs `npm run data:refresh` or any Scryfall download. Its input `apps/frontend/data/scryfall/default-cards.json` is gitignored and absent from this worktree; it exists in the launch checkout at /Users/chrismiho/Coding/Projects/TheJudge/apps/frontend/data/scryfall/default-cards.json. Plan the slice to create a symbolic link to that file at the worktree's gitignored path (read-only use; never copy it, never stage it), run the script, and confirm the rebuilt map has the same entry count and keys as the committed map with only the image-address field gone. Any other difference stops the slice and parks rather than being committed.
5. Set exactly one marker, `STATUS.active`, per the skill, and move the `PRD/work/STATUS.md` board row fully to the active section (remove from old, add to new).
6. Do not edit `PRD/sections/`, code, `DESIGN-BRIEF.md`, `GATE-QUESTIONS.md`, `QUALITY-CHECK.md`, or `GRAPH-RUN.md`.
7. Commit with explicit paths only, as short separate calls from the working directory: `git add <each path>`, then `git commit -m ...`, then `git push`. Never `git add -A`/`.`/`--all`.

Budget: this node has a 120 tool-call cap that counts every call, including any subagent's. Work directly; spawn no subagents or forks; no sleeping or polling loops.

Mechanics: change files with the Write and Edit tools only (no heredocs, no `sed -i`, no long chained Bash). Never retry a denied call verbatim; report it. If you dispatch any subagent, copy the `Working directory:` line above unchanged into its prompt.

Return a short report: `outcome: ok|failed`, the slice list (one line each, in player terms first), criteria count per slice and how many are `manual`, the status marker, commit sha, push result (`git ls-remote --heads origin thejudge-auto/scanner-recovers-and-runs-lighter-work`), `git diff --stat origin/main HEAD -- PRD/sections apps scripts` (must be empty), and `git status --porcelain` of the working directory (must be empty).

### build

graph is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-scanner-recovers-and-runs-lighter

You are node 6 (`build`) of graph run `graph-20261018-063434`, attempt 1. Run the `thejudge-implement-all` skill (read /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-scanner-recovers-and-runs-lighter/.claude/skills/thejudge-implement-all/SKILL.md and everything it tells you to read, and follow it in graph-controlled mode) on the package `PRD/work/scanner-recovers-and-runs-lighter/`, implementing slices A, B, C, D in order. Shared branch: `thejudge-auto/scanner-recovers-and-runs-lighter-work` — already checked out in the working directory above and pushed; work in it in place (no second worktree, no contributor branch). The code PR is `thejudge-auto/scanner-recovers-and-runs-lighter-work` → `main`; open it with `gh pr create --base main` and never merge or close it. End the PR body with these two lines: a line reading 🤖 Generated with [Claude Code](https://claude.com/claude-code) and then a line with https://claude.ai/code/session_01MyoXR52i9TAid8cFQd7vZ3

Work ONLY inside the working directory above. Every file you write — code, tests, `PRD/sections/`, slice status, criteria files, evidence, screenshots — lies under /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-scanner-recovers-and-runs-lighter/. Never write to /Users/chrismiho/Coding/Projects/TheJudge outside `.worktrees/implement-scanner-recovers-and-runs-lighter/`; a bare `PRD/work/...` path resolved against the launch checkout is a write outside scope and fails this node.

Setup: this worktree has no `node_modules`. Run `npm ci` from the working directory before the first test.

Product truth: apply the accepted proposal to `PRD/sections/` by intent, together with each slice's code, in the slice that names it — REQ-249 (new) in A; REQ-214 and REQ-056 in C; REQ-048 and REQ-066 in D. Re-derive each edit from the finalized `GATE-QUESTIONS.md` diff and `DESIGN-BRIEF.md` against current `PRD/sections/` text, never a blind replay. Never add a `DEC-###` entry.

Acceptance criteria: each slice's `slice-<letter>.criteria.json` starts all `false`. A criterion flips to `true` only after you have actually run its evidence command or touched its evidence path, and for a `manual` one only after you write a dated observation line naming its id (in a `slice-<letter>.evidence.md` beside the slice doc). The node is `ok` only when every criterion in all four files is `true`. Do not describe a passing criterion as proof the work is correct; report what each command printed.

Constraints from the package:
- Scan results stay identical: `identify.test.ts` against `__fixtures__/vectors.json` passes unchanged.
- Scan data stays out of the background preload.
- Slice D regenerates `apps/frontend/public/data/cardScanMap.json` only with `npm run data:scan-map`, never by hand. Its gitignored input is absent here; create a symbolic link at `apps/frontend/data/scryfall/default-cards.json` in this worktree pointing to /Users/chrismiho/Coding/Projects/TheJudge/apps/frontend/data/scryfall/default-cards.json (read only; never copy it, never stage it). Never run `npm run data:refresh` or any Scryfall download. If the rebuilt map differs from the committed one in anything beyond the dropped image-address field (key count, keys, `oracleId`, `name`), stop and report it as a blocker — do not commit that map.
- Local Node is 26; CI runs Node 22. If a test touches browser storage, mind that Node 26 has a built-in `localStorage` that can hide storage bugs CI would catch.

Live checks: for the `manual` browser criteria, start the frontend dev server from the working directory on a free port using the Bash tool's `run_in_background` option (never `&` or `nohup`, both denied while the lock is held), use Playwright MCP with screenshots saved under `PRD/work/scanner-recovers-and-runs-lighter/.playwright-mcp/` in this worktree (do not commit them if gitignored), call `browser_close` when done, and stop the server you started (`kill <pid>` of that server; `pkill`/`killall` are denied). Report the port and that it is free.

Budget: this node has a 4000 tool-call cap that counts every call, including any subagent's. Subagent fan-out is off: work as a single agent; spawn no subagents or forks. No sleeping or polling loops.

Mechanics: change files with the Write and Edit tools only (no heredocs, no `sed -i`, no long chained Bash). Run git as short separate calls from the working directory: `git add <each path>`, then `git commit -m ...`, then `git push`. Never `git add -A`/`.`/`--all`, never force-push, never `git stash`, never `git reset --hard` or `git clean`. Never edit `.claude/`, `CLAUDE.md`, any `thejudge-*` skill, or `GRAPH-RUN.md` (the driver owns it). Never retry a denied call verbatim; report it. If you dispatch any subagent, copy the `Working directory:` line above unchanged into its prompt.

When all four slices are done, set `STATUS.ship-ready` per the skill (exactly one marker) and move the `PRD/work/STATUS.md` board row fully.

Return a report with: `outcome: ok|failed|blocked`; the PR URL; one commit sha per slice and the origin tip (`git ls-remote --heads origin thejudge-auto/scanner-recovers-and-runs-lighter-work`); criteria counts per slice (`true`/total); the exact final lines printed by `npm --workspace apps/frontend run test`, `npm run typecheck`, `npm run quality:check`, and the frontend build; the `PRD/sections/` files changed; the scan-map comparison result and size before/after; the status marker; `git status --porcelain` of the working directory (must be empty); the dev-server port released; and a complete list of every file path you wrote or deleted, as absolute paths, one per line, under a `### Paths written` heading.

## Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
| Scanner recovers from a failed download, builds its data once, and shares one panel across tools | answered-once | shape | — |
| owner build signal: verdicts merged (PR #319, accept all five), then invoked `/graph-implement PRD/work/scanner-recovers-and-runs-lighter/` | answered-once | gate-review | — |
