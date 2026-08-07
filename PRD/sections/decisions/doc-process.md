# Doc process decisions

PRD documentation tooling: system-map catalog, detail files, the decisions.md router split, and agent workflow contracts.

### DEC-044
- Decision: Adopt a durable feature/subsystem catalog at `sections/system-map.md` so the truth layer states what is built, how it behaves at a glance, and where it lives — without re-deriving behavior from code.
- Status: confirmed
- Context: The PRD promotes decisions into the `sections/` truth layer during planning, and the `Status:` field tracks decision lifecycle (`confirmed`/`superseded`), not whether code shipped. As a result the truth layer mixes "decided" with "built," and answering "is this real / how does it work / where does it live?" requires a code-reading journey. A single consolidated catalog answers all three in one read and gives a low-maintenance shipped-vs-planned signal without overloading `Status:` or sprinkling a new field across every entry.
- Impact:
  - new durable artifact `sections/system-map.md`; two levels — subsystems, with features grouped under each subsystem
  - each entry records: `Status` (`shipped` | `planned` | `partial`), a one-line behavior summary, coarse file/module location (subsystem level, not per-line), and backing `DEC`/`REQ` IDs
  - the shipped-vs-planned signal lives in the catalog only; existing `Status: confirmed/superseded` semantics on `DEC`/`REQ` entries are unchanged and not overloaded
  - additive-first: the catalog is built and validated against real questions before any reconciliation of stale navigation or change to existing status conventions
  - lightweight promotion gate: a catalog entry is marked `shipped` only when code and a cleanup receipt exist; enforced at cleanup time and documented in `instructions/`
  - commit-message convention (conventional-commits-lite): `docs(prd):` for doc/plan-only changes, `feat:`/`fix:` for changes that ship product behavior; documented in `instructions/`
  - stale navigation is reconciled only after the catalog is validated: the `PRD/README.md` work-package table is corrected and a pointer to the catalog is added to the `PRD/README.md` Section Inventory
  - `DEC-043`/`REQ-031` (`gameStateNotes` / `ADDITIONAL GAME STATE`) are reconciled by representing them as `planned` in the catalog — their `Status: confirmed` lifecycle field is left unchanged, because shipped-vs-planned lives in the catalog only and `Status:` semantics are not overloaded
  - deep per-subsystem behavior prose is out of scope here and deferred to `PRD/work/system-map-detail/` (it covers prompt assembly and the System 2 / System 3 retrieval mechanics that `prompt-context-retrieval-tuning` will rewrite); the catalog links to it once it exists
  - no per-decision → code-line link maintenance is introduced (explicit non-goal preserved)
  - documentation and process only: no `POST /api/ask-ai` request/response, UI, or prompt-assembly behavior change
- Related requirements:
  - (none — documentation and process decision; no functional requirement is added or changed)
- Notes:
  - the promotion gate and commit convention are process rules implemented in instruction files (`instructions/doc-lifecycle.md`, `instructions/agent-working-rules.md`) during map-out/implement, not in section files
  - DEC-044 itself is tracked as `planned` in the catalog until the catalog ships, then flipped to `shipped` per the promotion gate
  - "correcting `DEC-043`" means giving it a `planned` catalog entry, not editing its `Status:` field; `DEC-043`/`REQ-031` prose stays in the normative present tense used across the truth layer, since disambiguating decided-vs-built is precisely the catalog's job
  - this decision does not change the "assistant, not judge" framing or any prompt behavior

### DEC-048
- Decision: The deep per-subsystem behavior layer deferred by DEC-044 lives as separate detail files under `PRD/sections/system-map/`, one file per catalog subsystem, each linked from the catalog by an optional `Details:` field and written to a fixed lightweight template.
- Status: confirmed
- Context: DEC-044 ships the shallow `sections/system-map.md` catalog (status + one-liner + location + backing IDs) and explicitly defers the depth layer — the prose explaining how a subsystem actually works — to `PRD/work/system-map-detail/`, because the highest-value subsystems to document (prompt assembly, System 2 / System 3 retrieval) were about to be rewritten by `prompt-context-retrieval-tuning`. That package has landed (DEC-045, DEC-046, DEC-047 confirmed), so the volatile detail can now be written once. The catalog is already optimized for one-read scanning; embedding deep prose inline would grow it past readability and mix the index with its detail.
- Impact:
  - documentation and process only: no `apps/` code, no `POST /api/ask-ai` request/response, UI, or prompt-assembly behavior change
  - depth prose lives in separate files under `PRD/sections/system-map/`, one detail file per catalog `##` subsystem (e.g. `system-map/prompt-assembly.md`); the catalog keeps its existing four-field shallow shape
  - the catalog format gains one optional, additive `Details:` field on a subsystem entry pointing to its detail file; this does not change or overload `Status:` semantics and is omitted for subsystems with no detail file
  - no dangling links: a `Details:` pointer and the detail file it references land together in the same change; a subsystem without a detail file has no `Details:` line
  - each detail file follows a fixed lightweight template: a `Backed by:` DEC/REQ line, then `How it works`, `Data flow`, `Where it lives` (coarse modules), one `Worked example`, and `Invariants / gotchas`
  - behavior-level prose only; no per-decision → code-line link maintenance (inherits the DEC-044 non-goal); prose that merely restates code is not added
  - coverage is by need, not exhaustive: this package writes detail files for the priority subsystems only — `prompt-assembly.md` and `game-rules-retrieval.md` (the latter covering System 1 card rulings, System 2 curated baseline, and System 3 supplemental retrieval, which the catalog groups together and which interrelate via dedup); other subsystems get a detail file and `Details:` link only when one is later written
  - maintenance rule: a detail file is revisited only when its subsystem's behavior changes, governed by the existing DEC-044 commit convention (`feat:`/`fix:` for behavior changes, `docs(prd):` for doc-only changes)
- Related requirements:
  - (none — documentation and process decision; no functional requirement is added or changed)
- Notes:
  - extends DEC-044; does not supersede it — the shallow catalog and its shipped-vs-planned signal are unchanged
  - the priority detail files must reflect the assembled prompt section order and the System 1/2/3 mechanics as defined by DEC-025, DEC-029, DEC-030, DEC-036, DEC-042, DEC-043 (planned), DEC-045, DEC-046, DEC-047; `Q-001` (keyword-vocabulary derivation) is the live open question for System 3 and should be referenced, not resolved, by the detail prose
  - this decision does not change the "assistant, not judge" framing or any prompt behavior

### DEC-063
- Decision: `PRD/sections/decisions.md` is split into a thin router/index plus per-domain decision files under `PRD/sections/decisions/`, organized by topic/subsystem (not by flow stage). The router keeps the `decisions.md` path and the precedence/lifecycle preamble, plus a `DEC-ID → domain file → one-line summary` table; decision bodies move verbatim into nine topic files. DEC-IDs stay globally unique and resolvable across files.
- Status: confirmed
- Context: `decisions.md` is a ~1,030-line / 62-decision monolith that is Read-First #1 and source-of-truth precedence #1 in every workflow. Because it loads whole, every feature pays the full context cost of every other feature's decision history (the trigger was the scan saga DEC-050→062 being relevant while ~750 unrelated lines loaded anyway). The root cause is structural — one file, loaded whole — not a readability bug; in-place hygiene alone was rejected as too small, and consolidating the supersession sagas was rejected as high-risk and unjustified by the trigger.
- Impact:
  - the router path `PRD/sections/decisions.md` is preserved, so every existing reference across skills, instructions, READMEs, and receipts stays valid — wording tweaks only, no path surgery
  - nine topic files under `sections/decisions/`: `framing` (001, 002, 013), `capture-and-stack` (004–009, 015, 018, 028), `game-context-model` (003, 019, 021–024, 026, 027, 034, 035, 037, 043), `prompt-assembly` (025, 036, 042), `rules-retrieval` (029, 030, 032, 045–047), `providers-and-contract` (010–012, 014, 016, 017, 020, 033, 049), `conversation-ux` (031, 038–041), `scanning` (050–062), `doc-process` (044, 048, 063)
  - the organizing axis is topic/subsystem, not flow stage: reusable topics that span the flow (notably `game-context-model`) stay unified rather than scattered across journey stages
  - DEC bodies move verbatim — no rewording or saga consolidation; `Status:` and cross-references are preserved; new IDs are added and existing IDs are never renumbered
  - `decisions.md` becomes a ~60–80-line router: the precedence/lifecycle preamble plus the DEC-ID index table; the `Read First #1` step then loads a thin map and the agent pulls only the one domain file it needs
  - lifecycle rule folded into `instructions/doc-lifecycle.md`: new decisions land in their domain file **and** get a router index line; fully-superseded bodies trim to a one-line tombstone kept in-domain (ID stays resolvable); deep "how the code behaves" detail belongs in `system-map/` detail files (DEC-044 / DEC-048), not in decision `Impact:` blocks
  - documentation and process only: no `apps/` code, prompt-assembly, API, or UI behavior change; receipts that pin literal `decisions.md` line numbers are frozen historical artifacts and left as-is
  - no `system-map.md` entry is added: the catalog tracks product/code subsystems, not the PRD's own doc tooling (consistent with how DEC-044 / DEC-048 are handled)
- Related requirements:
  - (none — documentation and process decision; no functional requirement is added or changed)
- Notes:
  - DEC-063 itself lives in the `doc-process` domain file once the split lands
  - taxonomy finalized 2026-06-24 during refinement; `framing` and `conversation-ux` were renamed from the provisional `foundations` / `follow-up-and-wait` to keep every file on the topic/subsystem axis
  - this decision does not change the "assistant, not judge" framing or any prompt behavior

### DEC-064
- Superseded by DEC-115.

### DEC-086
- Decision: `npm run quality:check` runs the Vitest suite exactly once — coverage-mode execution is the single canonical regression + coverage gate and the redundant standalone `test` step is removed from the aggregate; alongside this, test files are reorganized for clarity (split the oversized `App.test.tsx`, extract shared EnrichmentStep fixtures/setup, group scan suites) as an assertion-preserving test refactor. Coverage thresholds, the eval golden gate, and product behavior are unchanged, and cross-workspace parallelism/sharding is explicitly deferred.
- Status: confirmed
- Context: The suite has grown to ~800 cases across ~82 source test files and GitHub Actions time is rising. `quality:check` chains `test` (`vitest run`) then `coverage:check` (`vitest run --coverage`); the coverage pass is a strict superset that re-executes every test, so CI runs the whole suite twice per job for no added protection. Navigation has also degraded: `App.test.tsx` is ~2,438 lines, EnrichmentStep setup is duplicated across three test files, and scan coverage is spread across ~10 colocated files. The fix must not weaken any gate — the IDEA forbids threshold reductions, arbitrary test deletion, eval-golden bypass, and product-behavior change. Workspace parallelism was considered but deferred: the single-pass collapse already ~halves test execution, and parallelism adds interleaved logs and config to maintain, better justified later with runner-core data.
- Impact:
  - CI/tooling and test-code only: no `apps/` product source, `POST /api/ask-ai` request/response, UI, or prompt-assembly behavior change
  - `quality:check` drops the standalone `test` step and relies on coverage-mode execution as the one suite run; `npm test` and `npm run test:coverage` remain for local iteration, and workspace/file-level targeting is preserved
  - all coverage thresholds stay at or above current values (frontend `lines: 45`; backend `lines: 45`, `src/prompt/** lines: 60`, `src/validation/** lines: 60`); the eval golden gate (`test:eval`, NFR-009) is untouched
  - test reorganization preserves existing assertions and case count: `App.test.tsx` is split into behavior-focused files, shared EnrichmentStep fixtures/setup are extracted to a single reusable helper (reuse-before-creating, technical-design-rules), and scan suites are grouped coherently
  - no test is removed to hit a timing target; hygiene never trades coverage for speed
  - cross-workspace (frontend + backend) parallelism and vitest sharding are deferred as a named follow-up, not part of this decision
- Related requirements:
  - NFR-012
- Notes:
  - continues the token/tooling-discipline lineage of DEC-063 (input structure) and DEC-064 (output verbosity); this decision targets test-execution and test-file structure
  - no `system-map.md` entry is added: the catalog tracks product/code subsystems, not the repo's own test/CI tooling (consistent with DEC-044 / DEC-063 / DEC-064)
  - this decision does not change the "assistant, not judge" framing or any prompt behavior

### DEC-115
- Decision: TheJudge workflow skill responses stay terse and high-signal by construction — status, decisions, files/IDs touched, verification, and the required handoff — with no document dumps, no restated background, and no long command output. Supersedes DEC-064.
- Status: confirmed
- Context: The 2026-08-02 skills refresh (`docs/superpowers/specs/2026-08-02-skills-refresh-design.md`) rewrites every `thejudge-*` skill from a blank page, calibrated for models that no longer need a shared verbosity-profile artifact to stay terse. DEC-064's mechanism — one shared `.cursor/skills/thejudge-output-guidance.md` file referenced by every skill, with `lean`/`standard`/`detailed` profiles — is the exact artifact the refresh deletes. Leaving DEC-064 `confirmed` while removing the file it mandates would put the corpus in self-contradiction and cause a later `thejudge-quality-check` to correctly FAIL against it.
- Impact:
  - documentation/process only: no `apps/` code, product UI, backend API, prompt assembly, provider behavior, or PRD content model change
  - the DEC-064 mechanism is retired and deleted: `.cursor/skills/thejudge-output-guidance.md` and its synced copies, plus the per-skill "Shared output guidance" boilerplate paragraph in every `thejudge-*` skill, are removed
  - the `lean` / `standard` / `detailed` output-profile vocabulary and its per-session override are dropped; a plain-language request to be more or less verbose needs no named profile system
  - response discipline becomes inherent to how each skill is written, not delegated to a referenced file — every rewritten `thejudge-*` skill is terse and high-signal by construction
  - unchanged from DEC-064 and still binding: profile or phrasing never alters required reads, writes, approval gates, PASS/FAIL calls, blocker reporting, verification, status updates, or the required `Next step` handoff; mandatory output stays mandatory
  - canonical editing remains `.cursor/skills/thejudge-*`; synced copies in `.agents/skills/` and `.claude/skills/` remain implementation artifacts, not edit targets
- Related requirements:
  - (none — documentation and process decision; no functional requirement is added or changed)
- Notes:
  - DEC-064's body is trimmed to a one-line tombstone in this file; the ID stays resolvable
  - DEC-063 and DEC-086 reference DEC-064 in their own Notes as lineage — those are historical mentions of a still-resolvable ID and are left alone
  - no `system-map.md` entry is added: the catalog tracks product/code subsystems, not the PRD's own agent workflow tooling (consistent with DEC-044 / DEC-063 / DEC-064)

### DEC-154
- Decision: TheJudge agent workflows use a contract-centered lifecycle: collaborative skills stay in the current checkout and branch with no automatic Git publication; explicitly invoked autonomous preparation requires an operator-named remote base and records it for one-package worktree/branch/PR ownership; implementation is sequential within a package and concurrent only across packages; deferral is reversible; and user-requested or browser-risk-triggered Playwright verification plus exact owned-process cleanup are completion gates.
- Status: confirmed
- Context: The skill catalog and shared workflow documents have drifted as autonomous preparation, all-slice implementation, dependency-wave implementation, and fanout were added. Existing autonomous contracts silently target `origin/main`, cleanup equates `ship-ready` with merge, and parallel skills allow nested slice-agent fleets despite the desired one-agent-per-package model. Browser verification is available but inconsistently required, while `scripts/dev.mjs` launches shell wrappers and exits after a fixed delay without proving descendant shutdown. A merge/reset incident during refinement also demonstrated the cost of ambiguous checkout ownership. The workflow needs one predictable operator map and auditable ownership without changing product behavior.
- Impact:
  - documentation, agent workflow, and developer tooling only; no product UI, API, prompt, provider, or data behavior changes
  - `AGENT-SKILLS.md` is the operator map; `workflow-reference.md` centralizes lifecycle rules; a focused `runtime-process-hygiene.md` owns browser/dev-server requirements; individual skills retain only phase-specific contracts and references
  - the catalog becomes ten skills: keep kickoff, refinement, quality-check, map-out, implement, implement-all, implement-fanout, cleanup, and prepare; add reversible `thejudge-defer`; delete `thejudge-map-out-parallel` and `thejudge-implement-parallel` from canonical and synchronized trees
  - ordinary collaborative work remains in the current checkout/current branch and does not automatically create worktrees, branches, commits, pushes, or PRs
  - explicit autonomous preparation requires a named remote base, records `origin/<base>` in package metadata, uses `.worktrees/prepare-<slug>`, and opens a preparation PR against that base; a human merge is required before implementation
  - autonomous implementation uses one agent and sequential slices in `.worktrees/implement-<slug>`, with one implementation branch/PR per package targeting the recorded base; fanout dispatches across packages only, requires a common recorded base, preserves cross-package file-overlap serialization, and assigns isolated port pairs
  - `ship-ready` means slice verification passed, not that a PR merged; autonomous cleanup runs locally on the recorded base, proves the implementation PR merged and the worktree is clean/fully merged, then removes the clean local implementation worktree/branch; it never deletes remote branches or automatically commits, pushes, merges, or closes PRs
  - `thejudge-defer` records the previous status and reason, moves the package to `deferred`, and restores it on the next invocation; artifacts and Git state are preserved; `ship-ready` and active packages with an `in-progress` slice cannot be deferred
  - Playwright MCP is required when the user asks for it or when browser-observable risk cannot be established by component tests (responsive geometry/containment, overlays/stacking, hit areas, focus/keyboard, scrolling, navigation/persistence, browser APIs, or integrated multi-screen behavior); no new Playwright CI harness is added
  - every browser/dev-server use records owner/session, worktree, ports, started-versus-attached state, cleanup evidence, and capture output path; owners call `browser_close`, stop exact owned process trees, wait for exit, and verify owned ports released before a slice/task completes; attached or user-owned servers are never stopped
  - agent-created worktrees live only under the repo-local `.worktrees/` root; preparation and implementation preflights refuse any other path (sibling `../<repo>-worktrees/`, temp/scratchpad, or elsewhere) at creation time rather than via a gate over pre-existing worktrees; the Claude Code harness's `**/.claude/worktrees/agent-*` isolation root is tolerated because no repo setting relocates it, and every ignore-consuming tool config (`eslint.config.mjs`, `.prettierignore`) must exclude both roots
  - browser captures are written to `PRD/work/<slug>/.playwright-mcp/` resolved against the current checkout root (the worktree for autonomous runs, the main checkout for collaborative and interactive ones), never the repo root, with root-level `.tmp/`/`.playwright-mcp/` as the no-package fallback; captures are disposable and are deleted with the package folder and worktree at cleanup, so no retention policy or capture archive is added
  - `scripts/dev.mjs` is hardened to accept explicit isolated ports, spawn without shell wrappers, own exact service trees, shut down idempotently, await graceful exit, and escalate after a bounded window only against the same owned trees; broad `pkill`/`killall`, `nohup`, and untracked background processes are prohibited
  - canonical skill edits follow failing-baseline-first contract scenarios, then `npm run skills:ai-sync` and byte-identical mirror verification; focused process-manager tests join the quality gate without duplicating the Vitest suite
- Related requirements:
  - (none — repository workflow and developer tooling only; no functional requirement is added or changed)
- Notes:
  - extends DEC-115's agent-workflow lineage without changing its terse-output rule
  - `.worktrees/` is the only repo-local autonomous worktree root; existing unrelated worktrees are not silently removed
  - runtime cleanup occurs at the end of every owning invocation, including failure paths; final package cleanup verifies the recorded evidence and owns post-merge Git worktree cleanup
  - no `system-map.md` entry is added because the catalog tracks product/code subsystems rather than repository agent workflow tooling

### DEC-155
- Decision: The GitHub Actions gate is restructured for parallelism instead of running as one serial step — `quality:check`'s sub-checks are decomposed into concurrent CI jobs, the frontend Vitest coverage run is sharded across parallel jobs whose blob reports are merged before thresholds are evaluated, jsdom is scoped per-file rather than applied to every test file, `Deploy AWS` depends on the gate instead of re-running it, and PR runs cancel superseded in-progress runs. `npm run quality:check` remains the single canonical local command, every test and threshold is preserved, and coverage still runs on every CI run. Discharges the parallelism/sharding follow-up DEC-086 deferred.
- Status: confirmed
- Context: Gate wall time grew from ~30s to ~4min. Step-level timing on run `31077630789` attributes 3m41s of a 3m57s job to `npm run quality:check`; checkout, `setup-node`, and cached `npm ci` cost 14s combined, so dependency install is not the cause. Local isolation shows typecheck (2.9s), lint (2.1s), `format:check` (0.5s), `test:scripts` (1.0s) and the entire backend suite (1.8s / 271 cases) are noise, while frontend `test:coverage` is 24.5s of a ~33s local gate. Case growth alone does not explain it: the same frontend suite runs in 15.2s without `--coverage`, so v8 instrumentation adds ~52s CPU (+86%), and the penalty is worst on tight numeric loops — `src/lib/scan/**` measures 7.0s of test CPU uninstrumented versus 32.3s instrumented (4.6x). Separately, a global `environment: "jsdom"` charges all 115 frontend files 54.1s CPU even though the 15 scan files pass unchanged under `node` (environment CPU 8.51s → 0.002s). Total gate CPU (~210s) is close to CI wall (221s), so the 4-vCPU public runner extracts almost no parallelism from a serial `&&` chain. Workflow shape compounds it: `deploy-aws.yml` re-runs the identical gate (3m22s of a 4m41s deploy, versus 12s build and 37s deploy), and because the two workflows run concurrently that duplicated step is currently the only thing actually gating production; neither workflow sets a `concurrency` group, so superseded pushes keep running (four overlapping runs on one branch within 25 minutes). DEC-086 deferred exactly this work pending CI-runner-core data, which now exists.
- Impact:
  - CI/tooling and test-configuration only: no `apps/` product source, `POST /api/ask-ai` request/response, UI, prompt-assembly, provider, or data behavior change
  - CI decomposes the gate into concurrent jobs (static checks, backend coverage, N frontend coverage shards) followed by a coverage-merge job; `npm run quality:check` is unchanged as the canonical local pre-PR command and gains no CI-only fast mode
  - frontend coverage is sharded with `--shard`/blob reports and merged before thresholds are applied, so thresholds are evaluated once on merged totals; a deliberate threshold breach must still fail the merged job
  - all coverage thresholds stay at current values (frontend `lines: 45`; backend `lines: 45`, `src/prompt/** 60`, `src/validation/** 60`), coverage still runs on every CI run, and the `test:eval` golden gate (NFR-009) is untouched
  - jsdom becomes per-file opt-in via `environmentMatchGlobs`, extended only to globs a green run proves; blanket directory- or extension-based rules are prohibited because `src/lib/lifeTracker/useLifeTracker.test.ts`, `src/lib/feedback/FeedbackContextProvider.test.tsx`, `src/lib/portal/seedContext.test.tsx`, and `src/lib/theme/applyPalette.test.ts` measurably still need a DOM — the last of these applies a palette to `document` while its sibling `src/lib/theme/**` suites run DOM-free, which is precisely why the rule is per-file rather than per-directory
  - `Deploy AWS` stops re-running `quality:check` and instead depends on the gate jobs via `needs:`, converting a concurrent duplicate into a real precondition; because `needs:` is only valid within a single workflow, the deploy job moves into the gate workflow and is guarded by an `if:` restricting it to `push` on `main`, rather than using `workflow_run` (which would run in default-branch context and require manual SHA handling)
  - OIDC `id-token: write` is scoped at the deploy job rather than the workflow, so pull-request gate jobs — which run on contributor-controlled refs — never receive AWS-assumable credentials; the `VITE_FEEDBACK_FORMSPREE_ID` build-step-only env scoping from the deploy hotfix is preserved
  - "the suite runs once" is measured per CI run across all jobs, not per job: a shard executing a subset satisfies DEC-086's no-duplicate-execution rule, and NFR-012's wording is generalized accordingly
  - deploy is deliberately serialized behind the gate rather than racing it: time-to-deployed becomes gate plus deploy job instead of the deploy job alone, which is accepted because today's concurrent shape lets a `main` push deploy a commit whose gate is still running or has already failed; both the deploy job duration and end-to-end time-to-deployed still improve on baseline, and they are tracked as separate metrics so the job figure is never reported as time-to-deployed
  - because CI executes `quality:check`'s sub-scripts individually rather than the aggregate, a `scripts/*.test.mjs` drift guard (run by `test:scripts`) asserts every sub-script in the `quality:check` chain is executed by some CI job, so a check added locally cannot silently go unrun in CI
  - PR runs use a `concurrency` group with `cancel-in-progress: true`; the `main` deploy path is excluded so a deploy is never cancelled mid-flight
  - oversized outlier test files may be split assertion-preserving to lower the shard floor, on the same basis DEC-086 authorized for `App.test.tsx`; no test is deleted, skipped, or weakened to hit a timing target
  - moving coverage off PR runs was considered and rejected as contradicting DEC-086's single canonical coverage gate; excluding hot numeric source from coverage and swapping v8 for istanbul were also rejected
- Related requirements:
  - NFR-012
  - NFR-009
- Notes:
  - continues the tooling-discipline lineage of DEC-063, DEC-064, and DEC-086; DEC-086's single-pass collapse stands and is not superseded — this decision only discharges its named deferral
  - shard count is tuned against runner cores observed in CI, not assumed; the runner is 4-vCPU because the repository is public
  - no `system-map.md` entry is added: the catalog tracks product/code subsystems, not the repo's own test/CI tooling (consistent with DEC-044 / DEC-063 / DEC-064 / DEC-086)
