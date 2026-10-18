# Graph run — scanner-recovers-and-runs-lighter

- Run ID: `graph-20261018-055113`
- Profile: `loaded (env sentinel)`
- Canary: `denied — hook live (rm -rf canary: [graph-boundary] rm -rf is denied in every session; graph canary nohup: denied while a graph run holds the lock)`
- Autonomous base: `origin/thejudge-auto/scanner-recovers-and-runs-lighter` (rewritten to `origin/main` by the build half's claim)
- Worktree: `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-scanner-recovers-and-runs-lighter` (rewritten to `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-scanner-recovers-and-runs-lighter` by the build half's claim)
- Staging: `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/.graph-intake/graph-20261018-055113/` (one file, `GRAPH-BRIEF-scanner.md`, copied verbatim to `PRD/work/scanner-recovers-and-runs-lighter/intake/`)
- Current node: `define`
- Next action: `/graph-kickoff PRD/work/scanner-recovers-and-runs-lighter/`

## Node ledger

| # | Node | Model | Outcome | Heartbeat | Evidence | Date |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | preflight | haiku | ok | `0 → 7` | branch `thejudge-auto/scanner-recovers-and-runs-lighter` pushed (`git ls-remote` → `041eab94` = `origin/main`) from `.worktrees/kickoff-scanner-recovers-and-runs-lighter`; launch checkout still on `main`, porcelain only the pre-existing untracked `PRD/work/probe-codebase-health-pass/`; lock `.worktrees/.graph-run.lock` runId `graph-20261018-055113` pid 6563; universal canary and graph canary `nohup true` both denied | 2026-10-18 |
| 2 | shape | sonnet | ok | `0 → 17` | `PRD/work/scanner-recovers-and-runs-lighter/` (IDEA.md with 34 `## Prior run` lines, README.md, STATUS.ideation, `intake/GRAPH-BRIEF-scanner.md` byte-identical to staging) and board row committed `e030224f`, `8ecaff8e`, pushed (= origin tip); worktree porcelain empty | 2026-10-18 |

## Open gate

- None

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

## Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
| Scanner recovers from a failed download, builds its data once, and shares one panel across tools | answered-once | shape | — |
