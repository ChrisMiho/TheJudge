# Graph run — tool-switch-load-delay

- Run ID: `graph-20261016-050510` (build half; spec-forming half `graph-20261016-040838`)
- Profile: `loaded (env sentinel)` — printed by `npm run graph:preflight` at node 1 (spec-forming half); build half `unverified`
- Canary: `denied — hook live (rm -rf .worktrees/.graph-canary-nonexistent)`; graph canary `denied — graph tier armed (nohup true)`
- Autonomous base: `origin/main`
- Worktree: `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-tool-switch-load-delay`
- Staging: `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/.graph-intake/graph-20261016-040838/` (no intake staged; the request is quoted in IDEA.md)
- Current node: `review`
- Next action: `/graph-implement PRD/work/tool-switch-load-delay/`

## Node ledger

| # | Node | Model | Outcome | Heartbeat | Evidence | Date |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | preflight | haiku | ok | `0 → 8` | branch `thejudge-auto/tool-switch-load-delay` pushed (`git ls-remote` → `21243d52`) from `.worktrees/kickoff-tool-switch-load-delay`; launch checkout still on `main`; lock `.worktrees/.graph-run.lock` runId `graph-20261016-040838` | 2026-10-15 |
| 2 | shape | sonnet | ok | `0 → 14` | `PRD/work/tool-switch-load-delay/` (IDEA.md, README.md, STATUS.ideation) and board row committed `f5cf16f6`, pushed | 2026-10-15 |
| 3 | define | opus | ok | `0 → 76` | `DESIGN-BRIEF.md`, `GATE-QUESTIONS.md` (one block, `NFR-014` amendment), `evidence/measurements.md` (live mtgjudge.gg + local preview, throttled and unthrottled), `STATUS.refined`, board row; committed `cf3c434c`, pushed `ed3e96b8..cf3c434c`; worktree `git status --porcelain` empty; port 4917 free | 2026-10-15 |
| 4 | gate-qc | sonnet | ok | `0 → 16` | PASS — `QUALITY-CHECK.md` committed `80112ad7` (on origin); README `## Preparation gate` recorded by the driver | 2026-10-15 |
| 5 | gate-review | sonnet | ok | `0 → 25` | build half run `graph-20261016-050510`: kickoff worktree removed clean (`git worktree remove`); claim commit `8abc7f2d` on `thejudge-auto/tool-switch-load-delay-work` cut from `origin/main` `a6b127da` (docs PR #313 merge), pushed; lock taken from the launch root; graph canary `nohup true` denied; `graph-gate-review` commit `063915ff` (= origin tip): 0 accept / 1 edit / 0 reject (NFR-014 widened to three tiers); `### Brief reconciliation` 15 passages in `DESIGN-BRIEF.md`; `STATUS.refined` only marker; board row under refined; `git diff --stat origin/main HEAD -- PRD/sections apps scripts` empty; worktree and launch-checkout porcelain empty | 2026-10-15 |
| 4 | gate-qc (build half, attempt 1) | sonnet | failed | `0 → 20` | FAIL — 4 blocking, 2 advisory; `QUALITY-CHECK.md` overwritten, commit `e256532b` (= origin tip); `STATUS.refining`; README `## Preparation gate` FAIL recorded by the driver; loops to `define` (FAIL 1 of 3) | 2026-10-15 |
| 3 | define (build half, attempt 1) | opus | ok | `0 → 53` | commit `24176fc1` (= origin tip): all 6 findings addressed in `DESIGN-BRIEF.md`, `GATE-QUESTIONS.md` (Diff 4 under NFR-014 rewording the REQ-064 ping overlap; NFR-014 verdict and reason untouched), `evidence/measurements.md` (live-site Life Tracker landing, read-only); new blocker question `Q-014` with blank slots (`GATE-QUESTIONS.md:202-252`: does a Life Tracker landing also download the card list in the background); `STATUS.refining`; `git diff --stat origin/main HEAD -- PRD/sections apps scripts` empty; porcelain empty both checkouts | 2026-10-15 |
| 4 | gate-qc (build half, attempt 2) | sonnet | failed | `0 → 17` | FAIL — 1 blocking (`integrations-and-data.md:165` missing from Diff 4 and the dispositions table), 3 advisory; attempt-1 findings 1, 2, 4, 5, 6 resolved; Diff 4 applies cleanly; Q-014 meets the plain-language standard; `QUALITY-CHECK.md` commit `6edb3a71` (= origin tip); `STATUS.refining`; README `## Preparation gate` FAIL recorded by the driver; loops to `define` (FAIL 2 of 3) | 2026-10-15 |
| 3 | define (build half, attempt 2) | opus | ok | `0 → 42` | commit `df85db45` (= origin tip): blocker fixed (Diff 4 hunk for `integrations-and-data.md:165`, intro count corrected), 3 advisories fixed (criteria 3, 4, 6); widened disposition grep over `PRD/sections/` → 96 hits, each dispositioned in `DESIGN-BRIEF.md`; Q-014 unchanged, slots blank at return; `STATUS.refining`; `git diff --stat origin/main HEAD -- PRD/sections apps scripts` empty; porcelain empty both checkouts. Owner then answered Q-014 in session (accept, transcribed by the driver) | 2026-10-15 |
| 5 | gate-review (build half, attempt 2) | sonnet | ok | `0 → 38` | driver verdict commit `9a969584` (Q-014 accept); `graph-gate-review` commit `f3d1d4c1` (= origin tip): Q-014 accept applied, diffs unchanged (already written for yes), `### Brief reconciliation` 13 passages (pending/no-answer wording removed), `Q-014` row in `## Gate verdicts`; `STATUS.refined` only marker; board row under refined; `git diff --stat origin/main HEAD -- PRD/sections apps scripts` empty; porcelain empty both checkouts | 2026-10-15 |
| 4 | gate-qc (build half, attempt 3) | sonnet | ok | `0 → 15` | PASS, no findings — `QUALITY-CHECK.md` commit `c96c77c4` (= origin tip); all 13 diff blocks match current `PRD/sections/` once each; tier order holds on every landing; README `## Preparation gate` PASS recorded by the driver | 2026-10-15 |
| 5 | plan | sonnet | ok | `0 → 26` | commit `4bd23212` (= origin tip): `GAMEPLAN.md`, `slice-a-shared-card-list.md` (Diff 4), `slice-b-background-download.md` (Diffs 1-3), `slice-c-live-verification.md` (promotion check, ship gates); `slice-a.criteria.json` 10, `slice-b.criteria.json` 10, `slice-c.criteria.json` 9 (7 manual), every `value` false; `STATUS.active` only marker; board row under active; worktree porcelain empty (published for `build`); launch-checkout porcelain empty | 2026-10-15 |
| 6 | build | sonnet | ok | `0 → 145` | PR https://github.com/ChrisMiho/TheJudge/pull/314 (open, base `main`); commits `8cff69ca` (A), `547d85ee` (B), `4b721b75` (C) = origin tip; 29/29 criteria `value: true` (A 10, B 10, C 9); `.graph-evidence.jsonl` holds 0 entries for this run id (known build-half gap: criteria are self-reported, review is the gate); reported `npm --workspace apps/frontend run test` 152 files / 1639 tests pass, `npm run typecheck` 0, `npm run quality:check` 0, build 0; C1-C7 dated observations in `slice-c.evidence.md`; Diffs 1-4 applied to `PRD/sections/`; `STATUS.ship-ready`; return side: launch-checkout porcelain empty before and after (identical), `classifyBuildWrites` over 41 reported paths → `ok`, 0 outside `.worktrees/implement-tool-switch-load-delay/`; worktree porcelain empty | 2026-10-15 |

## Gate verdicts

Applied by `graph-gate-review` (build half, 2026-10-15): 0 accept, 1 edit, 0 reject. Copied from `GATE-QUESTIONS.md` `## Gate verdicts`.

| Stable ID | Verdict | Reason |
| --- | --- | --- |
| `NFR-014` | edit | widen from two tools to a tiered download: tier 1 landing screen as today, tier 2 code for every other tool, tier 3 shared card list read once; Brotli, caching headers, list trimming out of scope |

## Open gate

- None (the `define` gate resolved: docs PR #313 merged with NFR-014 answered `edit`; verdict applied at gate-review)

## Dispatch prompts

### preflight

graph is controlling

You are node 1 (`preflight`) of graph run `graph-20261016-040838`. Follow the skill file `.claude/skills/graph-preflight/SKILL.md` exactly (read it first; read `PRD/instructions/graph-workflow-contract.md` sections it names as needed, but keep reads lean).

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Copy that Working directory line unchanged into any prompt you write. Do not spawn subagents. Stay well under 40 tool calls. Do not sleep or poll.

Inputs:
- --branch thejudge-auto/tool-switch-load-delay
- --slug tool-switch-load-delay
- --run-id graph-20261016-040838
- --pid 6563
- base: origin/main (default)

Procedure:
1. From the launch root (run `pwd` in the same call to prove it is /Users/chrismiho/Coding/Projects/TheJudge), run: `npm run graph:preflight -- --branch thejudge-auto/tool-switch-load-delay --slug tool-switch-load-delay --run-id graph-20261016-040838 --pid 6563 --dry-run`
2. If it exits 1 or 2, stop and report its message verbatim.
3. Otherwise run the identical command without `--dry-run`.
4. Issue the universal `CANARY_COMMAND` the script prints as its own Bash call and require a deny. Then issue `GRAPH_CANARY_COMMAND` as its own Bash call and require a deny. Never retry a denied call. An allowed canary means BLOCKED: report and stop.
5. Verify end state with short separate calls: `ls -la /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/.graph-run.lock`; `git -C /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-tool-switch-load-delay branch --show-current`; `git ls-remote --heads origin thejudge-auto/tool-switch-load-delay`; `git -C /Users/chrismiho/Coding/Projects/TheJudge branch --show-current` (must still be main).

Never commit, stash, or switch the launch checkout. Never write the lock by hand. Use the Write/Edit tools for any file change and short separate git calls.

Report back, verbatim where possible: the `shape:`, `base:`, `worktree:` lines, the `profile sentinel:` / `Profile:` lines, both canary commands and the exact deny reason text each returned, the lock file contents, and the four verification outputs. End with outcome `ok`, `failed`, or `BLOCKED`.

### shape

graph is controlling

You are node 2 (`shape`) of graph run `graph-20261016-040838`. Invoke and follow the `thejudge-kickoff` skill (read `.claude/skills/thejudge-kickoff/SKILL.md` in the working directory below) in its controlled mode.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-tool-switch-load-delay

Copy that Working directory line unchanged into any prompt you write. Every file you read or write lives under that path — never under /Users/chrismiho/Coding/Projects/TheJudge/PRD directly (that is the owner's launch checkout; do not touch it).

Slug (use exactly): `tool-switch-load-delay`. Branch already checked out there: `thejudge-auto/tool-switch-load-delay`. No staged intake for this run.

The owner's request, verbatim:

> why is there such a delay when i go from the question flow to the life tracker, over to the trade balancer, theres a few seconds of loading, is this something we could fix?

Your job: create `PRD/work/tool-switch-load-delay/` with the normal `IDEA.md`, `README.md`, and `STATUS.ideation` marker, and add the package row to `PRD/work/STATUS.md`. Search `PRD/instructions/receipts/` for prior runs on the same ground (keywords: trade balancer, life tracker, lazy, chunk, load, cold start, keep-warm, first-card) and write one `## Prior run` line per match. Investigate only request-relevant code to ground the IDEA: how the app switches between the question flow, the life tracker, and the trade balancer (route-level code splitting / lazy imports, data or price files fetched on entry, backend calls on entry). Record what you find as evidence with file paths, but do not decide a fix — product and design decisions belong to refinement and the owner. Do not run the app or a browser in this node.

Mechanics: change files with the Write and Edit tools. Run git as short separate calls from the working directory (`git add <explicit paths>`, then `git commit -m ...`, then `git push`). Never `git add -A` or `.`. Commit the package and the board row on the branch and push. Do not edit `PRD/sections/` or any code. Do not create `GRAPH-RUN.md` — the driver writes the ledger.

Do not spawn subagents or forks. Do not sleep or poll. Stay well under 60 tool calls.

Report back: outcome (`ok`, `failed`, or `NO ACTIONABLE PACKAGE`), the files created, the commit sha and push result, the prior-run matches, and a short evidence summary of where the switch delay likely comes from (file paths).

### define

graph is controlling

You are node 3 (`define`), attempt 1, of graph run `graph-20261016-040838`. Invoke the `thejudge-refinement` skill (read `.claude/skills/thejudge-refinement/SKILL.md` in the working directory below) and follow its controlled mode. Tool-call cap 150 — verify directly, spawn no subagents or forks, no sleeping or polling, stay well under the cap.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-tool-switch-load-delay

Copy that Working directory line unchanged into any prompt you write. Work only inside that directory (branch `thejudge-auto/tool-switch-load-delay`). Never write under /Users/chrismiho/Coding/Projects/TheJudge outside `.worktrees/kickoff-tool-switch-load-delay`.

Package: `PRD/work/tool-switch-load-delay/` (IDEA.md and README.md carry node 2's code-read evidence and prior-run receipts). The owner's symptom: moving from the question flow to the Life Tracker, then to the Trade Balancer, each switch shows a few seconds of loading. Keep the design scoped to that symptom; anything wider (other tools, price data, backend cold start for answers) goes in the brief as a separately offered follow-up, not into the core proposal.

Measure before you design. Node 2's evidence is code reading only and is unmeasured. Before writing the brief, measure in a real browser which cost actually makes the wait: the first-open code download for each tool, the Trade Balancer card list download (`/data/cardMetadata.json`) and its search-index build, and anything else you find. Measure against a production build (`npm run build` then a preview server, in this worktree) and, if reachable, the live site; include a throttled-network run (for example Fast 4G) as well as an unthrottled one, and the first visit versus a repeat visit. Record numbers in the brief with how each was taken. If the worktree lacks `node_modules`, install them in the worktree. Save browser captures under `PRD/work/tool-switch-load-delay/.playwright-mcp/` (gitignored). Stop any server you start with a plain `kill <pid>` and call `browser_close` when done. Leave no tracked file other than the package dirty.

Then write `DESIGN-BRIEF.md` per the skill. Product truth is proposed, not written: never edit `PRD/sections/` or code. When the design needs new or changed product truth, write `PRD/work/tool-switch-load-delay/GATE-QUESTIONS.md` with one `## <STABLE-ID>` block per stable ID, each opening with the three plain-language lines from `PRD/instructions/plain-language-standard.md` (What this decides, In plain terms, What happens if you say no), then that ID's complete proposed diff, then the verdict and reason slots. Check current truth (for example the REQs that keep visited tools mounted, the Trade Balancer warm-up ping, and the code-splitting requirements) and propose amendments in place rather than contradictions. Every product decision you cannot settle from confirmed truth under the preparation contract's assumption ladder goes to the owner through `GATE-QUESTIONS.md` — decide each one fresh, on its own evidence.

Mechanics: change files with the Write and Edit tools. Run git as short separate calls from the working directory (`git add <explicit paths>`, then `git commit -m ...`, then `git push`). Never `git add -A` or `.`. Set the package status marker per the skill. Do not edit `GRAPH-RUN.md` — the driver owns the ledger.

Report back: outcome (`ok` or `failed`), the measurements (numbers and method), the chosen design in plain words, the files written, whether `GATE-QUESTIONS.md` exists and the stable IDs in it, the commit sha and push result, and `git status --porcelain` for the worktree.

### gate-qc

graph is controlling

You are node 4 (`gate-qc`), attempt 1, of graph run `graph-20261016-040838`. Invoke the `thejudge-quality-check` skill (read `.claude/skills/thejudge-quality-check/SKILL.md` in the working directory below) and follow its controlled mode. Tool-call cap 60 — verify directly, spawn no subagents or forks, no sleeping or polling, do not re-run the browser measurements, stay well under the cap.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/kickoff-tool-switch-load-delay

Copy that Working directory line unchanged into any prompt you write. Work only inside that directory (branch `thejudge-auto/tool-switch-load-delay`).

Grade `PRD/work/tool-switch-load-delay/DESIGN-BRIEF.md` together with `GATE-QUESTIONS.md` and `evidence/measurements.md` against PRD alignment and agent-readiness. In graph runs refinement proposes product truth in `GATE-QUESTIONS.md` instead of writing `PRD/sections/`, so a brief whose truth lives only in that file is the expected shape, not a finding — but check that each proposed diff applies cleanly to current `PRD/sections/` text, that it amends existing rules in place rather than contradicting them, and that each block opens with the three plain-language lines from `PRD/instructions/plain-language-standard.md`. Check that the brief's design actually addresses the owner's reported symptom (a few seconds of loading when switching from the question flow to the Life Tracker and then the Trade Balancer, seen on the live site) and that the measurements support the scope it chose.

Write the report the skill produces into the package. On FAIL set the status marker the skill names. Do not edit `README.md`'s `## Preparation gate` section or `GRAPH-RUN.md` — the driver owns both. Never edit `PRD/sections/` or code.

Mechanics: change files with the Write and Edit tools. Run git as short separate calls (`git add <explicit paths>`, then `git commit -m ...`, then `git push`). Never `git add -A` or `.`.

Report back: PASS or FAIL, the complete findings list (each with file and line), the report path, the commit sha and push result, and `git status --porcelain`.

### gate-review

graph is controlling

You are the gate-resolution step (`gate-review`), attempt 1, of graph run `graph-20261016-050510` (build half of `tool-switch-load-delay`). Invoke the `graph-gate-review` skill (read `.claude/skills/graph-gate-review/SKILL.md` in the working directory below) and follow it exactly. Spawn no subagents or forks; no sleeping or polling; stay well under 60 tool calls.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-tool-switch-load-delay

Copy that Working directory line unchanged into any prompt you write. Work only inside that directory, on branch `thejudge-auto/tool-switch-load-delay-work` (already checked out and pushed; do not create another branch or worktree).

The owner answered `PRD/work/tool-switch-load-delay/GATE-QUESTIONS.md` and merged the docs PR (#313). Its one block, NFR-014, carries verdict `edit` with the owner's reason. Apply that verdict to the proposed diff inside `GATE-QUESTIONS.md` — the finalized NFR-014 text must carry the owner's edit by intent: the tiered background download (tier 1 the landing screen as today; tier 2 the code for every other tool, including both question tools; tier 3 the card list `/data/cardMetadata.json`, downloaded and read once and shared by Quick Question, the In-depth question flow and the Trade Balancer), with everything the reason says still stands and everything it puts out of scope recorded as out of scope. Never edit `PRD/sections/` or code; `build` applies truth later.

Reconcile `DESIGN-BRIEF.md` and the package README's intake pointer to the edit: every passage that contradicts the widened scope (for example two tools only, follow-ups F1 load-once and F3 now folded in, acceptance criteria, measurements targets) is rewritten to match; passages that agree stay. Bound the reconciliation to contradictions. `intake/` (if present) stays verbatim. Include a `### Brief reconciliation` list in your report: each passage changed, before and after in one line each.

Record the verdicts as the skill directs, restore `STATUS.refined` as the only status marker, and update the `PRD/work/STATUS.md` board row to match (a board move is remove-from-old plus add-to-new). Do not edit `GRAPH-RUN.md` or the README `## Preparation gate` section — the driver owns both.

Mechanics: change files with the Write and Edit tools. Run git as short separate calls (`git add <explicit paths>`, then `git commit -m ...`, then `git push`). Never `git add -A` or `.`. Never chain a heredoc or `sed -i`.

Report back: outcome (`ok` or `failed`), accept/edit/reject counts, the finalized NFR-014 text summary, the `### Brief reconciliation` list, files changed, the commit sha and push result, and `git status --porcelain` for the worktree.

### gate-qc (build half, attempt 1)

graph is controlling

You are node 4 (`gate-qc`), attempt 1, of graph run `graph-20261016-050510` (build half of `tool-switch-load-delay`), re-grading the package after the owner's `edit` verdict. Invoke the `thejudge-quality-check` skill (read `.claude/skills/thejudge-quality-check/SKILL.md` in the working directory below) and follow its controlled mode. Tool-call cap 60 — verify directly, spawn no subagents or forks, no sleeping or polling, do not re-run browser measurements, stay well under the cap.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-tool-switch-load-delay

Copy that Working directory line unchanged into any prompt you write. Work only inside that directory (branch `thejudge-auto/tool-switch-load-delay-work`).

Grade `PRD/work/tool-switch-load-delay/DESIGN-BRIEF.md` together with the finalized `GATE-QUESTIONS.md` (NFR-014 now carries the owner's `edit`: a tiered background download — tier 1 the landing screen, tier 2 the code for every other tool, tier 3 the card list read once and shared by Quick Question, In-depth and the Trade Balancer) and `evidence/measurements.md`, against PRD alignment and agent-readiness. Check that the brief and every proposed diff agree with the owner's verdict and with each other; that each diff applies cleanly to current `PRD/sections/` text and amends existing rules in place rather than contradicting them (REQ-064 wake-up ping only on balancer open, REQ-067 visited tools stay open); that the shared card-list design names how the three screens consume one load without changing what each screen shows; and that the acceptance criteria are measurable by an implementer. In graph runs refinement proposes truth in `GATE-QUESTIONS.md` instead of writing `PRD/sections/`, so a brief whose truth lives only in that file is the expected shape, not a finding.

Overwrite the package's `QUALITY-CHECK.md` with the new report. On FAIL set the status marker the skill names. Do not edit `README.md`'s `## Preparation gate` section or `GRAPH-RUN.md` — the driver owns both. Never edit `PRD/sections/` or code.

Mechanics: change files with the Write and Edit tools. Run git as short separate calls (`git add <explicit paths>`, then `git commit -m ...`, then `git push`). Never `git add -A` or `.`. Never chain a heredoc or `sed -i`.

Report back: PASS or FAIL, the complete findings list (each with file and line), the report path, the commit sha and push result, and `git status --porcelain`.

### define (build half, attempt 1)

graph is controlling

You are node 3 (`define`), attempt 1 of the build half, graph run `graph-20261016-050510`, for package `tool-switch-load-delay`. The re-grade after the owner's `edit` verdict FAILED (FAIL 1 of 3). Invoke the `thejudge-refinement` skill (read `.claude/skills/thejudge-refinement/SKILL.md` in the working directory below) in its controlled mode and revise the package to resolve the findings in `PRD/work/tool-switch-load-delay/QUALITY-CHECK.md`. Spawn no subagents or forks; no sleeping or polling; tool-call cap 150, stay well under it.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-tool-switch-load-delay

Copy that Working directory line unchanged into any prompt you write. Work only inside that directory, on branch `thejudge-auto/tool-switch-load-delay-work`.

Read `QUALITY-CHECK.md` in full first. It lists four blocking findings: (1) a player landing on the Life Tracker would download the card list under tier 3 though they do not today, while the brief and the NFR-014 cost line say no player downloads more than today; (2) the shared card-list design does not say how Quick Question, In-depth and the Trade Balancer each keep their current loading, failure and unmount behaviour; (3) `PRD/sections/trade-balancer/README.md` still describes the card list downloading when the balancer opens, with no diff or disposition; (4) the acceptance criteria pin neither tier order nor the Life Tracker landing case. Two advisory notes follow.

The owner's verdict on NFR-014 is settled and recorded in `GATE-QUESTIONS.md` (`- Verdict: edit` and its `- Reason:`); do not reopen it or change its verdict line. Where a finding is a factual correction, a missing design detail, or a consequence that follows directly from the owner's recorded reason, fix it in `DESIGN-BRIEF.md`, the finalized diffs in `GATE-QUESTIONS.md`, and `evidence/` as the skill directs. Where a finding raises a product choice the owner's recorded verdict does not settle, decide it on its own evidence under the assumption ladder in `PRD/instructions/preparation-contract.md`, at the moment it arises; if the genuine-blocker test holds, write it to `GATE-QUESTIONS.md` under `## Blocker questions` in the plain-language form with blank verdict slots, and say so in your report — do not answer it yourself. Any product-truth change beyond what the owner's verdict already covers gets its own `## <STABLE-ID>` block with the three plain-language lines, the complete diff, and blank verdict slots; spec text that stays true gets a one-line disposition in the brief instead. You may measure in the browser if a number the brief states is unmeasured (use the local production build; save captures under `PRD/work/tool-switch-load-delay/.playwright-mcp/`; stop any server you start with a plain `kill <pid>` and call `browser_close` when done).

Never edit `PRD/sections/` or code. Do not edit `GRAPH-RUN.md` or the README `## Preparation gate` section — the driver owns both. Set the package status marker per the skill (one marker only) and keep the `PRD/work/STATUS.md` board row in step (a board move is remove-from-old plus add-to-new).

Mechanics: change files with the Write and Edit tools. Run git as short separate calls (`git add <explicit paths>`, then `git commit -m ...`, then `git push`). Never `git add -A` or `.`. Never chain a heredoc or `sed -i`.

Report back: outcome (`ok` or `failed`), how each of the six findings was resolved (file and line), whether any new `GATE-QUESTIONS.md` block or blocker question with blank slots was written (and its ID), any measurements taken, files changed, the commit sha and push result, the status marker, and `git status --porcelain`.

### gate-qc (build half, attempt 2)

graph is controlling

You are node 4 (`gate-qc`), attempt 2, of graph run `graph-20261016-050510` (build half of `tool-switch-load-delay`), re-grading the package after `define` revised it for the attempt-1 findings. Invoke the `thejudge-quality-check` skill (read `.claude/skills/thejudge-quality-check/SKILL.md` in the working directory below) and follow its controlled mode. Tool-call cap 60 — verify directly, spawn no subagents or forks, no sleeping or polling, do not re-run browser measurements, stay well under the cap.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-tool-switch-load-delay

Copy that Working directory line unchanged into any prompt you write. Work only inside that directory (branch `thejudge-auto/tool-switch-load-delay-work`).

Read the previous `QUALITY-CHECK.md` first, then grade `PRD/work/tool-switch-load-delay/DESIGN-BRIEF.md` together with `GATE-QUESTIONS.md` and `evidence/measurements.md` against PRD alignment and agent-readiness. Confirm each of the six attempt-1 findings is resolved, and grade the new material: Diff 4 under NFR-014 (trade-balancer, REQ-064, user-flows and system-map wording) must apply cleanly to current `PRD/sections/` text and amend in place without changing the wake-up ping's behaviour; the shared card-list contract (design item 7) and acceptance criteria 3, 4, 5 and 9 must be measurable by an implementer; the `Product truth dispositions` table must cover the spots it claims. `GATE-QUESTIONS.md` now carries an open blocker question `Q-014` with blank verdict slots — that is expected and is the owner's to answer, not a finding; check only that it meets the plain-language standard and that both answers are fully specified in the package (what changes under each). In graph runs refinement proposes truth in `GATE-QUESTIONS.md` instead of writing `PRD/sections/`, so truth living only in that file is the expected shape.

Overwrite the package's `QUALITY-CHECK.md` with the new report. On FAIL set the status marker the skill names; on PASS set the marker the skill names for PASS. Do not edit `README.md`'s `## Preparation gate` section or `GRAPH-RUN.md` — the driver owns both. Never edit `PRD/sections/` or code.

Mechanics: change files with the Write and Edit tools. Run git as short separate calls (`git add <explicit paths>`, then `git commit -m ...`, then `git push`). Never `git add -A` or `.`. Never chain a heredoc or `sed -i`.

Report back: PASS or FAIL, the complete findings list (each with file and line), the report path, the commit sha and push result, the status marker, and `git status --porcelain`.

### define (build half, attempt 2)

graph is controlling

You are node 3 (`define`), attempt 2 of the build half, graph run `graph-20261016-050510`, for package `tool-switch-load-delay`. The gate-qc re-grade FAILED again (FAIL 2 of 3; a third FAIL still loops, a fourth parks). Invoke the `thejudge-refinement` skill (read `.claude/skills/thejudge-refinement/SKILL.md` in the working directory below) in its controlled mode and revise the package to resolve the findings in `PRD/work/tool-switch-load-delay/QUALITY-CHECK.md`. Spawn no subagents or forks; no sleeping or polling; tool-call cap 150, stay well under it. Do not re-run browser measurements.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-tool-switch-load-delay

Copy that Working directory line unchanged into any prompt you write. Work only inside that directory, on branch `thejudge-auto/tool-switch-load-delay-work`.

Read `QUALITY-CHECK.md` in full first. One blocking finding: `PRD/sections/integrations-and-data.md:165` states the REQ-064 ping overlaps the card-list download, which tier 3 makes stale exactly as the spots Diff 4 already rewords, yet it is in neither Diff 4 nor the `Product truth dispositions` table, and the brief's quoted grep misses it because of the hyphenated spelling; Diff 4's intro count is also wrong. Three advisory notes follow (criterion 6 needs the Q-014 no-answer clause criterion 4 already has; criterion 4's fixed wait should wait for the card-list request to end; criterion 3 needs a defined landing-rendered marker). Resolve the blocker and the advisories.

Before writing, re-run the brief's disposition grep widened to every spelling (`card list`, `card-list`, `cardMetadata`, and the ping/overlap wording) across all of `PRD/sections/`, and add a Diff 4 hunk or a dispositions row for every hit, so no further spot is left for a third re-grade. Keep the open blocker question `Q-014` exactly as the owner will see it unless a fix requires its text to change; its verdict slots stay blank. The owner's NFR-014 verdict and reason stay untouched.

Never edit `PRD/sections/` or code. Do not edit `GRAPH-RUN.md` or the README `## Preparation gate` section — the driver owns both. Keep one status marker per the skill and the `PRD/work/STATUS.md` board row in step.

Mechanics: change files with the Write and Edit tools. Run git as short separate calls (`git add <explicit paths>`, then `git commit -m ...`, then `git push`). Never `git add -A` or `.`. Never chain a heredoc or `sed -i`.

Report back: outcome (`ok` or `failed`), how each of the four findings was resolved (file and line), the widened grep command and its hit count with each hit's disposition, whether Q-014 changed, files changed, the commit sha and push result, the status marker, and `git status --porcelain`.

### gate-review (build half, attempt 2)

graph is controlling

You are the gate-resolution step (`gate-review`), attempt 2, of graph run `graph-20261016-050510` (build half of `tool-switch-load-delay`). Invoke the `graph-gate-review` skill (read `.claude/skills/graph-gate-review/SKILL.md` in the working directory below) and follow it for the one newly answered item. Spawn no subagents or forks; no sleeping or polling; stay well under 60 tool calls.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-tool-switch-load-delay

Copy that Working directory line unchanged into any prompt you write. Work only inside that directory, on branch `thejudge-auto/tool-switch-load-delay-work`.

`PRD/work/tool-switch-load-delay/GATE-QUESTIONS.md` carries blocker question `Q-014` under `## Blocker questions`; the owner answered it in session and the driver transcribed the answer into its slots (`- Verdict: accept`, with the owner's words in `- Reason:`). The NFR-014 verdict (`edit`) was already applied at gate-review attempt 1 and is not to be touched. Apply the Q-014 verdict: the package's diffs must carry the accepted answer, and `DESIGN-BRIEF.md` must be reconciled to it — every passage that still offers or hedges on the other answer (for example the alternative clauses in acceptance criteria 4 and 6, the A10 assumption, and any pending-Q-014 wording in the header, the plain-terms block, or the board row) is rewritten to the accepted answer; passages that already agree stay. Bound the reconciliation to contradictions and hedges. Add a `Q-014` row to the `## Gate verdicts` table in `GATE-QUESTIONS.md`.

Restore `STATUS.refined` as the only status marker (the package is awaiting a re-grade) and move the `PRD/work/STATUS.md` board row to match (remove from the old section, add to the new). Never edit `PRD/sections/` or code. Do not edit `GRAPH-RUN.md` or the README `## Preparation gate` section — the driver owns both.

Mechanics: change files with the Write and Edit tools. Run git as short separate calls (`git add <explicit paths>`, then `git commit -m ...`, then `git push`). Never `git add -A` or `.`. Never chain a heredoc or `sed -i`.

Report back: outcome (`ok` or `failed`), the verdict applied, a `### Brief reconciliation` list (each passage changed, before and after in one line each), files changed, the commit sha and push result, the status marker, and `git status --porcelain`.

### gate-qc (build half, attempt 3)

graph is controlling

You are node 4 (`gate-qc`), attempt 3, of graph run `graph-20261016-050510` (build half of `tool-switch-load-delay`), re-grading after `define` attempt 2 fixed the attempt-2 findings and the owner's `accept` on blocker question Q-014 was applied. Invoke the `thejudge-quality-check` skill (read `.claude/skills/thejudge-quality-check/SKILL.md` in the working directory below) and follow its controlled mode. Tool-call cap 60 — verify directly, spawn no subagents or forks, no sleeping or polling, do not re-run browser measurements, stay well under the cap.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-tool-switch-load-delay

Copy that Working directory line unchanged into any prompt you write. Work only inside that directory (branch `thejudge-auto/tool-switch-load-delay-work`).

Read the previous `QUALITY-CHECK.md` first, then grade `PRD/work/tool-switch-load-delay/DESIGN-BRIEF.md` together with `GATE-QUESTIONS.md` and `evidence/measurements.md` against PRD alignment and agent-readiness. Confirm the attempt-2 blocker (`integrations-and-data.md:165` now in Diff 4, intro count correct, widened disposition grep) and its three advisories are resolved, and that every Diff 4 hunk still applies cleanly to current `PRD/sections/` text. Both owner verdicts are now settled and are not findings: NFR-014 `edit` (tier 1 the landing screen, tier 2 every other tool's code, tier 3 the shared card list, downloaded last) and Q-014 `accept` (a Life Tracker landing downloads the card list too, still last). Check that the brief, every diff, and the acceptance criteria agree with both verdicts and with each other — in particular that tier order (all tier-2 code requested before the card list) holds on every landing including the Life Tracker, and that no passage still hedges on a Q-014 answer the owner did not give. In graph runs truth living only in `GATE-QUESTIONS.md` is the expected shape.

Overwrite the package's `QUALITY-CHECK.md` with the new report. On FAIL set the status marker the skill names; on PASS set the marker the skill names for PASS. Do not edit `README.md`'s `## Preparation gate` section or `GRAPH-RUN.md` — the driver owns both. Never edit `PRD/sections/` or code.

Mechanics: change files with the Write and Edit tools. Run git as short separate calls (`git add <explicit paths>`, then `git commit -m ...`, then `git push`). Never `git add -A` or `.`. Never chain a heredoc or `sed -i`.

Report back: PASS or FAIL, the complete findings list (each with file and line), the report path, the commit sha and push result, the status marker, and `git status --porcelain`.

### plan

graph is controlling

You are node 5 (`plan`), attempt 1, of graph run `graph-20261016-050510` (build half of `tool-switch-load-delay`). Invoke the `thejudge-map-out` skill (read `.claude/skills/thejudge-map-out/SKILL.md` and its `reference.md` in the working directory below) and follow its controlled mode. Tool-call cap 120 — spawn no subagents or forks, no sleeping or polling, stay well under the cap.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-tool-switch-load-delay

Copy that Working directory line unchanged into any prompt you write. Work only inside that directory, on branch `thejudge-auto/tool-switch-load-delay-work`.

Verify `## Preparation gate` in `PRD/work/tool-switch-load-delay/README.md` reads `Quality-check: PASS` before writing anything. Slice `DESIGN-BRIEF.md` with the finalized `GATE-QUESTIONS.md` (NFR-014 `edit`, Q-014 `accept`; Diffs 1-4 are the product truth `build` applies by intent, together with the code). Write `GAMEPLAN.md`, the lettered slice docs, and one `slice-<letter>.criteria.json` beside each slice doc with every criterion initialised `false` and an evidence block per the skill's reference. Each slice names which `GATE-QUESTIONS.md` diffs it applies to `PRD/sections/`, carries the brief's acceptance criteria that belong to it, and states the verification commands (the repo's own test and quality scripts as the package and `package.json` name them). Set `STATUS.active` as the only marker and move the `PRD/work/STATUS.md` board row to match (remove from the old section, add to the new).

Never edit `PRD/sections/` or code. Do not edit `GRAPH-RUN.md` or the README `## Preparation gate` / `## Autonomous metadata` sections — the driver owns them.

Mechanics: change files with the Write and Edit tools. Run git as short separate calls (`git add <explicit paths>`, then `git commit -m ...`, then `git push`). Never `git add -A` or `.`. Never chain a heredoc or `sed -i`.

Report back: outcome (`ok` or `failed`), the slices (letter, title, one line each, which diffs and acceptance criteria each carries), the criteria file paths with their criterion counts, files written, the commit sha and push result, the status marker, and `git status --porcelain`.

### build

graph is controlling

You are node 6 (`build`), attempt 1, of graph run `graph-20261016-050510`, package `tool-switch-load-delay`. Invoke the `thejudge-implement-all` skill (read `.claude/skills/thejudge-implement-all/SKILL.md` and its `reference.md` in the working directory below) and follow its controlled mode exactly: implement every remaining slice (A, B, C) in order, in place in this worktree. Tool-call cap 4000. Do not spawn subagents or forks (fan-out is off for this run). No sleeping or polling loops; the skill's own READY loop is the exception.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-tool-switch-load-delay

Copy that Working directory line unchanged into any prompt you write. Shared branch: `thejudge-auto/tool-switch-load-delay-work` (already checked out in that worktree and pushed; the recorded autonomous base is `origin/main`). Work only in that worktree on that branch: no second worktree, no contributor branch. Every file you write must lie inside `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-tool-switch-load-delay/`; never write to the launch checkout `/Users/chrismiho/Coding/Projects/TheJudge` outside `.worktrees/implement-tool-switch-load-delay/` — a bare `PRD/work/...` path resolved against the launch root is a write to the launch checkout. The worktree may have no `node_modules`; install dependencies inside the worktree with the repo's lockfile install before the first test run.

Apply product truth by intent: each slice applies the `GATE-QUESTIONS.md` diffs its slice doc names (NFR-014 `edit` and Q-014 `accept` are the owner's settled verdicts) to the real `PRD/sections/` files together with that slice's code, re-deriving each edit against current text rather than blind-replaying it. Open the code PR `thejudge-auto/tool-switch-load-delay-work` into `main` after the first push (title and body per the skill and `PRD/instructions/plain-language-standard.md`, opening with what the player experiences: every tool opens without a Loading screen, the card list downloads once in the background and last). Never merge or close it.

Acceptance criteria are earned: run each slice's verification commands as its slice doc names them, and flip a criterion `value` to true only after its evidence exists; for `manual` criteria write the dated observation line the skill's reference requires. For slice C's browser checks, start your own production preview on a port you own, save captures under `PRD/work/tool-switch-load-delay/.playwright-mcp/` inside the worktree, stop servers with a plain `kill <pid>`, call `browser_close`, and record the cleanup evidence. If a criterion cannot be met, or a product decision arises that the finalized package and the assumption ladder in `PRD/instructions/preparation-contract.md` do not settle, stop and report it as a blocker — do not decide it. When every slice is done, set `STATUS.ship-ready` as the only marker and move the board row per the skill.

Do not edit `GRAPH-RUN.md` or the README `## Preparation gate` / `## Autonomous metadata` sections — the driver owns them.

Mechanics: change files with the Write and Edit tools. Run git as short separate calls (`git add <explicit paths>`, then `git commit -m ...`, then `git push`). Never `git add -A` or `.`, never force-push, never `git stash`, never chain a heredoc or `sed -i` into a longer command. If a command is denied, do not retry it verbatim; report it.

Report back: outcome (`ok`, `failed`, or `blocked`), per slice what changed (files, `PRD/sections/` edits applied, tests added), each criterion id with its final value and evidence, the verification command outputs (pass/fail counts), the PR URL, every commit sha and the final push result, the complete list of every file path you wrote (absolute or worktree-relative), the browser cleanup evidence, the status marker, and `git status --porcelain` for the worktree.

### review

graph is controlling

You are node 7 (`review`), attempt 1, of graph run `graph-20261016-050510`, package `tool-switch-load-delay`: a fresh-context, no-write reviewer. You hold no Write, Edit or NotebookEdit, and you must not change any file by any other means (no Bash redirection, no git commit, no PR comments). Read only. Tool-call cap 120; spawn no subagents; stay well under the cap.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-tool-switch-load-delay

Copy that Working directory line unchanged into any prompt you write.

Material: the diff `git diff e44216e7 4b721b75` in that worktree (the build node's three slice commits on `thejudge-auto/tool-switch-load-delay-work`; PR https://github.com/ChrisMiho/TheJudge/pull/314), the slice docs `PRD/work/tool-switch-load-delay/slice-a-shared-card-list.md`, `slice-b-background-download.md`, `slice-c-live-verification.md`, their `slice-*.criteria.json`, `slice-c.evidence.md`, and the package artifacts `DESIGN-BRIEF.md` and `GATE-QUESTIONS.md` (finalized: NFR-014 `edit`, Q-014 `accept`). You may run the frontend tests read-only to confirm them.

Rubric: each slice's own acceptance criteria, quoted here (inner quotes shown as backticks).

Slice A: (1) the shared load fetches once, is reused by concurrent and later callers, and hands back the finished list synchronously (unit test); (2) after a failed download every waiting caller is rejected and the next call fetches again (unit test); (3) the test-only reset runs after each test in `apps/frontend/src/test/setup.ts`; (4) Quick Question: card search works once the list arrives; a failed list shows `Card search is unavailable. You can still ask without a card.` and asking still works; (5) In-Depth: zone-step card search works; a failed list shows no message and logs the error; (6) Trade Balancer: `Loading card list…` while waiting, search disabled until arrival, search finds cards after, failed list shows existing error copy with the reason; (7) a screen that unmounts while the list downloads does not cancel it for another screen still waiting; (8) a screen opened after the list has arrived renders with the list in hand and its loading flag false on first render; (9) Diff 4 is applied to the five `PRD/sections/` files as finalized; (10) frontend tests and `npm run quality:check` pass with no coverage threshold lowered (NFR-012).

Slice B: (1) the background download calls the loader of every other destination and not the landing one; (2) every tier-2 call is made before the tier-3 card-list request; (3) it runs once per page load and never mounts a destination; (4) a rejected preload clears the cached promise and a later tap loads and shows the tool; (5) a destination whose code has already arrived renders without the `Loading…` fallback; (6) a tap before the download finishes shows `Loading…` only until the in-flight download lands, with exactly one request for that chunk; (7) no `GET /api/health` is sent before the Trade Balancer opens; (8) the production-never-preloads comments in `destinationRegistry.tsx` are updated; (9) Diffs 1, 2 and 3 are applied to `PRD/sections/` as finalized; (10) frontend tests and `npm run quality:check` pass with no coverage threshold lowered.

Slice C: (1) Quick Question landing, wait 3 s, tap Life Tracker: no `Loading…` frame, tool on screen within 100 ms, at Fast 4G + CPU 4x and Slow 4G + CPU 4x; (2) continuing: Trade Balancer, In-Depth, Quick Question each with no `Loading…` frame within 100 ms; the Trade Balancer shows no `Loading card list…` frame; (3) tier order by Resource Timing on Quick Question and Life Tracker landings; (4) Life Tracker landing on Fast 4G + CPU 4x, after the card list responseEnd: the three card-search tools each within 100 ms, no `Loading…` frame, card list requested exactly once, no `Loading card list…` frame; (5) first screen not slower than the pre-change build over three runs, no consistent slowdown over 50 ms; (6) no `GET /api/health` before the balancer opens, card list requested exactly once per page load on every landing, no tool mounted by the download; (7) browser closed, owned servers stopped, ports released, captures under the package `.playwright-mcp/`; (8) Diffs 1-4 present in `PRD/sections/`; (9) the slice doc's ship gates met.

Grade each criterion as met, not met, or not evidenced, citing file and line or evidence-file line. Flag only gaps affecting correctness or these stated requirements. Severity rule: a preference, a style note, or an improvement outside the slices' stated requirements is never Critical or Important and never sends the work back to `build`; rate it Minor or omit it. Critical means a stated requirement is broken in a way that harms players or product truth; Important means a stated criterion is not met or not evidenced. Where the evidence file states a profile-specific caveat, judge it against the criterion's own wording, not against the builder's reading of it.

Report back: verdict `APPROVE` or `CHANGES REQUESTED`, then each finding with severity (Critical, Important, Minor), the criterion it concerns, file and line, and the concrete fix; then a per-criterion table (A1-A10, B1-B10, C1-C9) of met / not met / not evidenced.

## Mid-node relays

Messages sent to a running node (not dispatches; no new attempt), verbatim.

- define attempt 1, via SendMessage: Owner update: the owner says they notice the tool-switch delay on the live site, not only locally. Treat the live site as the primary measurement target (first visit, repeat visit, throttled and unthrottled), and use the local production build to confirm causes and test whether a candidate fix helps. Record in the brief that the symptom was reported on the live site. This is an observation about where to measure, not a product decision; everything else in your dispatch stands.

## Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
| owner launch request (verbatim in IDEA.md): why is there such a delay when going from the question flow to the life tracker to the trade balancer, can we fix it | answered-once | shape | — |
| owner mid-run note: the delay is seen on the live server — relayed to define as a measurement target | answered-once | define | — |
| owner build signal: merged, go ahead (docs PR #313 merged) | answered-once | gate-review | — |
| owner answer to blocker Q-014: Q-014 yes, Life Tracker landings download it too — transcribed by the driver into the Q-014 verdict slot as `accept` | answered-once | define | — |
| owner clarification on Q-014: asked whether the Life Tracker did it last; the driver explained the card list stays tier 3, downloaded last after the landing screen and every tool's code; owner confirmed: yes, last is what I meant, continue | answered-once | gate-review | — |
