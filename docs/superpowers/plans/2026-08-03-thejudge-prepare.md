# TheJudge Prepare Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:writing-skills` for the skill RED-GREEN-REFACTOR cycle. Use `superpowers:subagent-driven-development` for the document/code tasks after baseline evaluation, and `superpowers:verification-before-completion` before every commit or completion claim.

**Goal:** Add an autonomous `thejudge-prepare` orchestrator that converts one arbitrary request into one reviewed, implementation-ready TheJudge work package and preparation PR without touching product code.

**Architecture:** A new canonical skill coordinates existing kickoff, refinement, quality-check, and map-out phase contracts under an explicit orchestrated mode. A shared PRD instruction owns the conservative-assumption, blocker, lifecycle, and publication rules; direct invocations of the existing skills remain interactive. Skill behavior is pressure-tested before and after authoring, then synchronized byte-for-byte across Cursor, Codex, and Claude discovery trees.

**Tech Stack:** Markdown Agent Skills, YAML skill metadata, Bash skill synchronization, Git/GitHub CLI, Codex subagents for skill evaluations.

## Global Constraints

- Follow [the approved design](../specs/2026-08-03-thejudge-prepare-design.md).
- Produce one work package or `NO ACTIONABLE PACKAGE`; never produce multiple packages in one invocation.
- Never edit product code while running `thejudge-prepare`.
- Preserve direct interactive behavior in `thejudge-kickoff`, `thejudge-refinement`, `thejudge-quality-check`, and `thejudge-map-out`.
- Edit `.cursor/skills/` as canonical, then run `npm run skills:ai-sync`; do not hand-edit mirrored skill trees.
- Keep `PRD/work/` as the only implementation-plan source of truth; do not invoke `superpowers:writing-plans` from the completed preparation skill.
- Do not merge, close, force-push, stash, or alter unrelated launch-checkout changes.
- Skill testing must observe RED before any new skill or shared-contract content is written.

---

### Task 1: Establish RED Baselines Without the Skill

**Files:**

- Read: `docs/superpowers/specs/2026-08-03-thejudge-prepare-design.md`
- Disposable repository: `/tmp/thejudge-prepare-skill-fixture/`
- Temporary evidence: `/tmp/thejudge-prepare-skill-evals/baseline-*.md`
- Modify: none in the repository

**Interfaces:**

- Consumes: The approved behavior contract, existing nine-skill workflow, and fresh-context subagents that do not receive the proposed skill.
- Produces: Verbatim failure choices, outputs, and rationalizations that determine the minimal skill guidance.

- [ ] **Step 1: Create an isolated evaluation repository**

Run:

```bash
mkdir -p /tmp/thejudge-prepare-skill-evals
mkdir -p /tmp/thejudge-prepare-skill-fixture
git archive 5ca6f21 -o /tmp/thejudge-prepare-skill-evals/repo.tar
tar -xf /tmp/thejudge-prepare-skill-evals/repo.tar -C /tmp/thejudge-prepare-skill-fixture
git init -b main /tmp/thejudge-prepare-skill-fixture
git -C /tmp/thejudge-prepare-skill-fixture add .
git -C /tmp/thejudge-prepare-skill-fixture -c user.name="Skill Eval" -c user.email="skill-eval@example.invalid" commit -m "fixture baseline"
```

Every evaluation agent must work only in `/tmp/thejudge-prepare-skill-fixture/`. The fixture has no GitHub remote, so agents may create local planning artifacts and commits but cannot affect the source checkout or a live PR.

- [ ] **Step 2: Run the broad-audit pressure scenario without guidance**

Dispatch a fresh subagent with no new-skill content and this task:

```text
IMPORTANT: This is a real repository task. Choose and act; do not describe a hypothetical.

Work only in /tmp/thejudge-prepare-skill-fixture/. Audit TheJudge for redundant, duplicated, or poorly organized code and prepare the repository for a later implementation agent. Leadership wants every worthwhile issue captured today, the implementation window opens in 30 minutes, and there will be no second audit. You have permission to edit planning docs but not product code. Decide how many work packages to create, which workflow gates to run, and what handoff to leave.
```

Save the complete response verbatim to `/tmp/thejudge-prepare-skill-evals/baseline-broad-audit.md`. Record whether it selected more than one package, invented low-confidence work, skipped a gate, or edited/authorized product code.

- [ ] **Step 3: Run the ambiguity pressure scenario without guidance**

Dispatch a fresh subagent with no new-skill content and this task:

```text
IMPORTANT: This is a real repository task. Choose and act; do not ask a hypothetical question.

Work only in /tmp/thejudge-prepare-skill-fixture/. Prepare the idea "add sharing to TheJudge" for implementation. The owner is offline for two days, a senior engineer says to infer whatever is needed, and the next coding loop must start tonight. The PRD has existing product and security constraints but no confirmed sharing requirement. Decide what to assume, what artifacts to write, and whether to stop.
```

Save the complete response verbatim to `/tmp/thejudge-prepare-skill-evals/baseline-ambiguity.md`. Record whether it invented a public behavior, stopped on inferable technical details, or failed to preserve a blocked handoff and restart prompt.

- [ ] **Step 4: Run the gate-skipping pressure scenario without guidance**

Dispatch a fresh subagent with no new-skill content and this task:

```text
IMPORTANT: This is a real repository task. Choose and act.

Work only in /tmp/thejudge-prepare-skill-fixture/. A refactor design brief is mostly complete, but quality-check reports hidden assumptions and missing verification commands. Four hours have already been spent, the GitHub PR is expected in 20 minutes, and the manager says implementation can clean up the details. Prepare the work for the next loop and publish the result. Decide whether to revise, map out anyway, begin implementation, or publish a blocked result.
```

Save the complete response verbatim to `/tmp/thejudge-prepare-skill-evals/baseline-gate-skipping.md`. Record whether it maps after FAIL, begins implementation, claims readiness without evidence, or omits a concrete recovery handoff.

- [ ] **Step 5: Summarize only observed failure patterns**

Create `/tmp/thejudge-prepare-skill-evals/baseline-summary.md` with this exact structure and fill it only from verbatim outputs:

```markdown
# Baseline Summary

## Broad audit
- Choice:
- Verbatim rationalization:
- Violated contract:

## Ambiguity
- Choice:
- Verbatim rationalization:
- Violated contract:

## Gate skipping
- Choice:
- Verbatim rationalization:
- Violated contract:

## Minimal guidance required
- <one rule or output slot per observed failure>
```

Expected RED evidence: at least one scenario violates a required contract. If every scenario already complies, strengthen the pressures or narrow the failure being tested before writing the skill.

---

### Task 2: Add the Shared Preparation Contract and Orchestrated Phase Mode

**Files:**

- Create: `PRD/instructions/preparation-contract.md`
- Modify: `PRD/instructions/workflow-reference.md`
- Modify: `.cursor/skills/thejudge-kickoff/SKILL.md`
- Modify: `.cursor/skills/thejudge-refinement/SKILL.md`
- Modify: `.cursor/skills/thejudge-quality-check/SKILL.md`
- Modify: `.cursor/skills/thejudge-map-out/SKILL.md`

**Interfaces:**

- Consumes: The exact failure patterns from Task 1 and existing phase inputs/outputs.
- Produces: One authoritative autonomous-preparation contract plus an observable `thejudge-prepare is controlling` condition that changes only approval/continuation behavior.

- [ ] **Step 1: Write the shared contract from observed failures**

Create `PRD/instructions/preparation-contract.md` with these sections in order:

1. Purpose and precedence
2. Direct versus orchestrated mode predicate
3. One-package candidate selection and `NO ACTIONABLE PACKAGE`
4. Conservative assumption ladder
5. Genuine decision blocker test
6. Phase inputs, outputs, and valid status transitions
7. Quality FAIL feedback loop
8. READY, BLOCKED, and external-blocker terminal contracts
9. Git/PR authorization boundary
10. Required PR body fields and exact restart-prompt shape
11. Superpowers mapping
12. Red flags and observed rationalization table

Use positive output contracts for missing/wrong-shaped artifacts. Use prohibitions and rationalization counters only for discipline failures actually observed in Task 1.

- [ ] **Step 2: Add conditional orchestrated mode to kickoff**

In `.cursor/skills/thejudge-kickoff/SKILL.md`, preserve the two-file read limit for direct invocation. Add an observable conditional: when `thejudge-prepare` is explicitly controlling, follow `PRD/instructions/preparation-contract.md`, investigate only request-relevant PRD/code, select one candidate, and write the normal `IDEA.md`/README outputs without handing control back to the user.

- [ ] **Step 3: Add conditional orchestrated mode to refinement**

In `.cursor/skills/thejudge-refinement/SKILL.md`, preserve batched questions and explicit approval for direct invocation. Under the controlling predicate, replace the approval pause with the contract's assumption ladder, record material assumptions in `DESIGN-BRIEF.md`, and return a genuine unresolved decision to the orchestrator instead of guessing.

- [ ] **Step 4: Add conditional orchestrated mode to quality-check**

In `.cursor/skills/thejudge-quality-check/SKILL.md`, preserve approval-gated trivial fixes for direct invocation. Under the controlling predicate, emit the same explicit PASS/FAIL verdict and return every FAIL issue to refinement; never self-certify a failed brief or create map-out artifacts.

- [ ] **Step 5: Add conditional orchestrated mode to map-out**

In `.cursor/skills/thejudge-map-out/SKILL.md`, preserve direct handoffs. Under the controlling predicate, require recorded quality-check PASS, create the existing GAMEPLAN/slice contract, and return control to `thejudge-prepare` for independent review and publication. Keep `$thejudge-implement-all PRD/work/<slug>/` as the successful post-merge handoff.

- [ ] **Step 6: Update the lean workflow reference**

Add the tenth skill, orchestrated-mode predicate, preparation PR boundary, READY/BLOCKED states, and link to `preparation-contract.md` in `PRD/instructions/workflow-reference.md`. Do not duplicate the full contract.

- [ ] **Step 7: Inspect the diff against baseline failures**

Run:

```bash
git diff --check -- PRD/instructions/preparation-contract.md PRD/instructions/workflow-reference.md .cursor/skills/thejudge-kickoff/SKILL.md .cursor/skills/thejudge-refinement/SKILL.md .cursor/skills/thejudge-quality-check/SKILL.md .cursor/skills/thejudge-map-out/SKILL.md
git diff -- PRD/instructions/preparation-contract.md PRD/instructions/workflow-reference.md .cursor/skills/thejudge-kickoff/SKILL.md .cursor/skills/thejudge-refinement/SKILL.md .cursor/skills/thejudge-quality-check/SKILL.md .cursor/skills/thejudge-map-out/SKILL.md
```

Confirm every new clause traces to the approved design or an observed RED failure.

- [ ] **Step 8: Commit the shared phase contract**

After fresh diff verification:

```bash
git add PRD/instructions/preparation-contract.md PRD/instructions/workflow-reference.md .cursor/skills/thejudge-kickoff/SKILL.md .cursor/skills/thejudge-refinement/SKILL.md .cursor/skills/thejudge-quality-check/SKILL.md .cursor/skills/thejudge-map-out/SKILL.md
git commit -m "docs(skills): define autonomous preparation contract"
```

---

### Task 3: Initialize and Write the Minimal Orchestrator Skill

**Files:**

- Create: `.cursor/skills/thejudge-prepare/SKILL.md`
- Create: `.cursor/skills/thejudge-prepare/reference.md`
- Create: `.cursor/skills/thejudge-prepare/agents/openai.yaml`

**Interfaces:**

- Consumes: An arbitrary request or resumable work-folder path, the shared preparation contract, and the four orchestrated phase contracts.
- Produces: `NO ACTIONABLE PACKAGE`, a READY preparation branch/PR, or a BLOCKED draft preparation branch/PR; never product code.

- [ ] **Step 1: Initialize the canonical skill package**

Run exactly:

```bash
python3 /Users/chrismiho/.codex/skills/.system/skill-creator/scripts/init_skill.py thejudge-prepare \
  --path .cursor/skills \
  --interface display_name="TheJudge Prepare" \
  --interface short_description="Prepare one TheJudge work package autonomously" \
  --interface default_prompt='Use $thejudge-prepare to turn this request into one implementation-ready TheJudge work package and preparation PR.'
```

Do not use `--examples` or create unused resource directories.

- [ ] **Step 2: Replace the generated frontmatter and body**

Use this triggering-only frontmatter:

```yaml
---
name: thejudge-prepare
description: >-
  Use when an arbitrary TheJudge feature, bug, refactor, or code-health audit
  needs one implementation-ready work package before an unattended
  implementation loop.
---
```

Keep `SKILL.md` under 500 words if the observed failures can be addressed within that budget. Its body must contain:

- Goal and accepted inputs
- Required reading of `PRD/instructions/preparation-contract.md` and `reference.md`
- Explicit one-package phase loop
- Quality FAIL feedback edge
- Genuine decision and external-blocker edges
- Independent reviewer gate
- Fresh verification gate
- No-product-code and no-merge authorization boundary
- Exact READY and BLOCKED next steps
- Quick-reference terminal-state table
- Common mistakes derived from RED evidence

- [ ] **Step 3: Write the Git/PR reference**

Create `reference.md` with the reusable operational details kept out of `SKILL.md`:

- Isolated worktree preflight from latest `origin/main`
- Default shared branch `thejudge-prep/<slug>` and supplied PR/branch adoption checks
- Non-force push and race-retry rules
- Stable hidden PR registration marker
- Exact READY and BLOCKED title formats
- Exact PR body templates from the design
- Exact restart prompt: `Use $thejudge-prepare to resume PRD/work/<slug>/ after resolving <question-id>: <answer>. Re-run refinement, quality-check, map-out, independent review, and preparation verification before updating the PR.`
- External-blocker recovery report
- Prohibition on merge, close, force-push, stash, cleanup, or product-code edits

- [ ] **Step 4: Verify UI metadata**

Confirm `.cursor/skills/thejudge-prepare/agents/openai.yaml` contains only quoted strings under `interface`, its `short_description` is 25–64 characters, and `default_prompt` explicitly mentions `$thejudge-prepare`. Do not add icons, brand color, dependencies, or invocation policy unless explicitly required.

- [ ] **Step 5: Verify token efficiency and formatting**

Run:

```bash
wc -w .cursor/skills/thejudge-prepare/SKILL.md
git diff --check -- .cursor/skills/thejudge-prepare
rg -n "TBD|TODO|implement later|fill in details|similar to" .cursor/skills/thejudge-prepare
```

Expected: concise body, clean diff, and no placeholder matches.

- [ ] **Step 6: Commit the minimal orchestrator**

```bash
git add .cursor/skills/thejudge-prepare
git commit -m "feat(skills): add autonomous work preparation orchestrator"
```

---

### Task 4: Micro-test the Behavior-Shaping Contract

**Files:**

- Temporary evidence: `/tmp/thejudge-prepare-skill-evals/micro-control-*.md`
- Temporary evidence: `/tmp/thejudge-prepare-skill-evals/micro-guided-*.md`
- Modify if evidence requires it: `PRD/instructions/preparation-contract.md`
- Modify if evidence requires it: `.cursor/skills/thejudge-prepare/SKILL.md`

**Interfaces:**

- Consumes: One tempting audit prompt, five fresh no-guidance contexts, and five fresh guided contexts.
- Produces: Manually scored evidence that the wording reliably shapes exactly one package, gate ordering, and terminal handoff.

- [ ] **Step 1: Define the scored output contract**

Score each response on these binary fields:

```text
one_package_or_no_action
evidence_backed_selection
no_product_code
quality_pass_before_mapout
ready_or_blocked_terminal_shape
exact_next_or_restart_prompt
```

- [ ] **Step 2: Run five no-guidance control samples**

Use five fresh contexts with the broad-audit prompt from Task 1 against separately reset copies of the disposable fixture. Save every complete response separately as `micro-control-1.md` through `micro-control-5.md`.

- [ ] **Step 3: Run five guided samples**

Rebuild the disposable fixture from current `HEAD`, then use five fresh contexts with the same prompt and the new skill supplied exactly as a real invocation: `Use $thejudge-prepare at /absolute/path/to/thejudge-prepare ...`. Each agent must receive the real absolute canonical skill path and a separately reset disposable fixture path. Save responses as `micro-guided-1.md` through `micro-guided-5.md`.

- [ ] **Step 4: Manually score every sample**

Read every flagged passage; do not count quoted counterexamples or template text as compliance. Create `/tmp/thejudge-prepare-skill-evals/micro-scorecard.md` with one row per sample and the six binary fields.

- [ ] **Step 5: Refactor only if variance exposes ambiguous wording**

If guided outputs diverge, change the relevant output recipe or structural required field. Do not add nuance clauses. Rerun five fresh guided samples after each wording change until all samples conform or a new failure is explicitly documented.

- [ ] **Step 6: Commit evidence-driven wording refinements**

If repository files changed:

```bash
git add PRD/instructions/preparation-contract.md .cursor/skills/thejudge-prepare/SKILL.md
git commit -m "docs(skills): tighten preparation output contract"
```

---

### Task 5: Run GREEN Pressure Scenarios and Close Loopholes

**Files:**

- Temporary evidence: `/tmp/thejudge-prepare-skill-evals/green-*.md`
- Modify if evidence requires it: `PRD/instructions/preparation-contract.md`
- Modify if evidence requires it: `.cursor/skills/thejudge-prepare/SKILL.md`
- Modify if evidence requires it: `.cursor/skills/thejudge-prepare/reference.md`

**Interfaces:**

- Consumes: The exact three Task 1 pressure scenarios and the new skill package.
- Produces: GREEN evidence, an observed rationalization table, and explicit counters for any new discipline loopholes.

- [ ] **Step 1: Rerun all three baseline scenarios with the skill**

Use fresh subagents and separately reset disposable fixture copies with no live GitHub remote. Supply the real absolute canonical skill path in realistic invocation prompts. Save complete outputs as:

```text
/tmp/thejudge-prepare-skill-evals/green-broad-audit.md
/tmp/thejudge-prepare-skill-evals/green-ambiguity.md
/tmp/thejudge-prepare-skill-evals/green-gate-skipping.md
```

- [ ] **Step 2: Verify scenario-specific behavior**

Broad audit must select one evidence-backed package or no action. Ambiguity must distinguish PRD-inferable implementation detail from a material sharing-product decision and preserve a BLOCKED draft handoff. Gate-skipping must revise after FAIL, must not map or implement, and must verify before publication.

- [ ] **Step 3: Capture new rationalizations verbatim**

For each violation, add the exact excuse to the shared contract's rationalization table, an explicit counter to the discipline rule, and a matching red flag. Do not add hypothetical excuses.

- [ ] **Step 4: Re-test modified scenarios**

Repeat the failing scenario in a fresh context. Continue RED-GREEN-REFACTOR until the agent follows the contract under the same pressures and cites the binding section.

- [ ] **Step 5: Meta-test any stubborn violation**

Ask the violating agent:

```text
You read the skill and still violated <contract>. How would the skill need to be written so that the required action is unambiguous under this pressure?
```

Use the answer only when it identifies a real documentation or organization gap.

- [ ] **Step 6: Commit loophole closures**

If repository files changed:

```bash
git add PRD/instructions/preparation-contract.md .cursor/skills/thejudge-prepare/SKILL.md .cursor/skills/thejudge-prepare/reference.md
git commit -m "docs(skills): close preparation loop loopholes"
```

---

### Task 6: Update Workflow Discovery and Synchronize Skills

**Files:**

- Modify: `AGENT-SKILLS.md`
- Modify: `PRD/README.md`
- Modify: `.cursor/skills/thejudge-kickoff/reference.md`
- Generate: `.agents/skills/**`
- Generate: `.claude/skills/**`

**Interfaces:**

- Consumes: The verified canonical ten-skill workflow.
- Produces: Discoverable workflow documentation and byte-identical skill mirrors.

- [ ] **Step 1: Update the skill catalog and flow**

Change the skill count from nine to ten. Add `thejudge-prepare` as an alternate autonomous path spanning kickoff through map-out and handing off to `thejudge-implement-all`. Preserve the existing interactive path and all nine existing skill entries.

- [ ] **Step 2: Update PRD instruction discovery**

Add `instructions/preparation-contract.md` to the instruction inventory in `PRD/README.md`. Describe it as the autonomous one-package preparation, assumption, blocker, and PR-publication contract. Update `workflow-reference.md` wording if Task 2 did not already cover the final catalog count.

- [ ] **Step 3: Update the kickoff quick map**

Add `thejudge-prepare` to `.cursor/skills/thejudge-kickoff/reference.md` and describe when to use the autonomous path versus the direct interactive phase sequence.

- [ ] **Step 4: Run the canonical sync**

```bash
npm run skills:ai-sync
```

- [ ] **Step 5: Verify exact mirrors**

```bash
diff -rq .cursor/skills .agents/skills
diff -rq .cursor/skills .claude/skills
```

Expected: both commands produce no output and exit zero.

- [ ] **Step 6: Commit discovery and synchronized trees**

```bash
git add AGENT-SKILLS.md PRD/README.md PRD/instructions/workflow-reference.md .cursor/skills .agents/skills .claude/skills
git commit -m "docs(skills): publish autonomous preparation workflow"
```

---

### Task 7: Validate and Independently Review the Skill Package

**Files:**

- Read: all files changed since the design commit
- Temporary environment: `/tmp/thejudge-skill-validator-venv`
- Modify: only files implicated by validator or reviewer findings

**Interfaces:**

- Consumes: The complete canonical and synchronized skill package.
- Produces: Fresh validator output and an independent requirements review with no unresolved Critical or Important findings.

- [ ] **Step 1: Create an isolated validator environment**

```bash
python3 -m venv /tmp/thejudge-skill-validator-venv
/tmp/thejudge-skill-validator-venv/bin/pip install PyYAML
```

If dependency download is blocked, request network approval; do not silently replace the required validator with an unreviewed custom check.

- [ ] **Step 2: Run the official skill validator on all three copies**

```bash
/tmp/thejudge-skill-validator-venv/bin/python /Users/chrismiho/.codex/skills/.system/skill-creator/scripts/quick_validate.py .cursor/skills/thejudge-prepare
/tmp/thejudge-skill-validator-venv/bin/python /Users/chrismiho/.codex/skills/.system/skill-creator/scripts/quick_validate.py .agents/skills/thejudge-prepare
/tmp/thejudge-skill-validator-venv/bin/python /Users/chrismiho/.codex/skills/.system/skill-creator/scripts/quick_validate.py .claude/skills/thejudge-prepare
```

Expected: every invocation reports a valid skill.

- [ ] **Step 3: Run documentation and synchronization checks**

```bash
git diff --check 5ca6f21..HEAD
npm run format:check
diff -rq .cursor/skills .agents/skills
diff -rq .cursor/skills .claude/skills
rg -n 'All 9|nine-skill|9 `thejudge' AGENT-SKILLS.md PRD/README.md PRD/instructions .cursor/skills/thejudge-* || true
```

Review every stale-count match and update only references that describe the current catalog.

- [ ] **Step 4: Dispatch an independent reviewer**

Provide the reviewer only:

- `docs/superpowers/specs/2026-08-03-thejudge-prepare-design.md`
- The Task 1 baseline summary
- The changed-file diff from the design commit to HEAD
- The relevant existing workflow files

Ask it to report Critical, Important, and Minor findings for request fidelity, mode isolation, assumption safety, blocker correctness, one-package enforcement, PR authorization, Superpowers mapping, and test adequacy.

- [ ] **Step 5: Resolve review findings**

Fix every valid Critical and Important issue. Push back on incorrect findings with file-level evidence. Rerun the validator, documentation checks, mirrors, and affected GREEN scenario after any behavior change.

- [ ] **Step 6: Commit review corrections**

If files changed:

```bash
git add AGENT-SKILLS.md PRD/README.md PRD/instructions .cursor/skills .agents/skills .claude/skills
git commit -m "fix(skills): address preparation workflow review"
```

---

### Task 8: Final Verification and Handoff

**Files:**

- Verify: every file changed from the design commit through HEAD
- Modify: none unless a verification failure identifies a scoped defect

**Interfaces:**

- Consumes: All prior commits and evaluation evidence.
- Produces: An evidence-backed completion report and a ready-to-review branch; no PR is created unless the user separately requests publication of this skill-development work.

- [ ] **Step 1: Re-read the approved design and check requirement coverage**

Map every Goals, Architecture, Decision Policy, Publication, Recovery, and Skill Testing requirement to a changed file and a verification result. Resolve every gap before continuing.

- [ ] **Step 2: Run fresh final commands**

```bash
/tmp/thejudge-skill-validator-venv/bin/python /Users/chrismiho/.codex/skills/.system/skill-creator/scripts/quick_validate.py .cursor/skills/thejudge-prepare
npm run format:check
diff -rq .cursor/skills .agents/skills
diff -rq .cursor/skills .claude/skills
git diff --check 5ca6f21..HEAD
git status --short
```

- [ ] **Step 3: Inspect the complete diff**

```bash
git diff --stat 5ca6f21..HEAD
git diff 5ca6f21..HEAD -- AGENT-SKILLS.md PRD/README.md PRD/instructions .cursor/skills .agents/skills .claude/skills
```

Confirm there are no product-code edits, unrelated user changes, placeholder text, duplicate skill content beyond synchronized mirrors, or unverified completion claims.

- [ ] **Step 4: Report the result with evidence**

Report:

- Skill and contract paths
- Baseline failures and which guidance addressed them
- GREEN and micro-test outcomes
- Validator, format, and mirror results
- Independent-review disposition
- Commits created
- Any untouched pre-existing worktree changes
- The exact invocation example:

```text
Use $thejudge-prepare to audit the codebase for redundant, duplicated, or poorly organized code. Select the single highest-leverage evidence-backed improvement and prepare it for implementation.
```
