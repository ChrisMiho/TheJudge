# Doc process decisions

PRD documentation tooling: system-map catalog, detail files, the decisions.md router split, and agent workflow output guidance.

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
- Decision: TheJudge workflow skills use shared, user-tunable output-verbosity guidance so session responses can be lean, standard, or detailed without changing the work each skill performs.
- Status: confirmed
- Context: The `thejudge-*` agent workflow skills can generate expensive user-facing output across a long PRD workflow: long summaries, full document dumps, repeated context restatement, and verbose closeouts. Output tokens cost materially more than input tokens, so response verbosity has a disproportionate cost while providing little value when the user only needs status, blockers, verification, and the next command. The skills need a consistent output contract that users can tune per session without changing the underlying PRD reads, writes, approval gates, verification, or handoff sequence.
- Impact:
  - documentation/process only: no `apps/` code, product UI, backend API, prompt assembly, provider behavior, or PRD content model change
  - add one shared canonical output-guidance artifact under `.cursor/skills/`, then sync it to `.agents/skills/` and `.claude/skills/` through the existing `npm run skills:ai-sync` workflow; individual skills reference that shared guidance instead of duplicating verbosity rules
  - output profiles are `lean`, `standard`, and `detailed`; `standard` is the default and should be shorter than the pre-decision baseline
  - a user may override the profile per session with plain-language instructions such as "use lean output" or "detailed output is OK"; no persistent settings store, config file, CLI flag, or workflow router is introduced
  - profile choice changes only response shape and amount of explanation; it never changes required reads, writes, approval gates, PASS/FAIL calls, blocker reporting, verification commands, status updates, or required `Next step` handoff blocks
  - skills avoid full document dumps, restated background, long command output, and broad summaries unless the user explicitly asks or the material is needed to explain a blocker or approval decision
  - mandatory output remains mandatory in every profile: approval requests, selected options/tradeoffs when required, PASS/FAIL outcomes, blocker details, verification results, files changed, and the required platform handoff blocks
  - canonical editing remains `.cursor/skills/thejudge-*`; synced copies remain implementation artifacts per `AGENT-SKILLS.md` and `PRD/instructions/workflow-reference.md`
- Related requirements:
  - (none — documentation and process decision; no functional requirement is added or changed)
- Notes:
  - this extends the same token-discipline theme as DEC-063, but targets response output rather than input retrieval structure
  - no `system-map.md` entry is added: the catalog tracks product/code subsystems, not the PRD's own agent workflow tooling
  - final implementation should update skill-maintenance docs only if needed to make the shared guidance artifact discoverable

### DEC-085
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
