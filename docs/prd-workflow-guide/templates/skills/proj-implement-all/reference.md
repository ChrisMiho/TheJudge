# Implement-all reference

PR conventions for unattended runs. The goal of every convention here is that a
human can open the PR mid-run and understand the state without reading the diff.

## PR titles

    [AUTO][IN PROGRESS] <Feature name> (<slug>)
    [AUTO][BLOCKED] <Feature name> (<slug>)
    [AUTO][READY] <Feature name> (<slug>)

## Initial PR body

    <!-- auto:v1:registered:<slug> -->

    ## Automated implementation

    ### Feature
    - Work package: `<slug>`
    - Gameplan: `PRD/work/<slug>/GAMEPLAN.md`
    - Shared branch: `<branch>`
    - Base: `<origin/branch>` at `<sha>`

    <One-paragraph goal.>

    ### Slices
    - A — <title>
    - B — <title>

    ### Quality gates
    - Per slice: <commands from the slice docs>
    - Repository: `<quality-command>`

    ### Policy
    One green milestone commit per slice. Single-agent sequential
    implementation. Rebase and re-verify before every push. Manual merge only.

## Blocker comment

    <!-- auto:v1:blocker:<slug>:<slice> -->

    ## [AUTO] Blocker — <slug> / Slice <letter>

    ### Failure
    <Command or operation, and concise evidence.>

    ### Attempts
    - <Action and result.>

    ### Impact
    No milestone was pushed and no later slice started.
    <State whether an unpushed local milestone exists.>

    ### Needed resolution
    <The concrete decision or external change required.>

## Scope or decision update comment

    <!-- auto:v1:decision:<slug> -->

    ## [AUTO] Scope or decision update

    ### Discovery
    <What was learned.>

    ### Plan impact
    <Changed scope, dependency, or sequencing.>

    ### Action and verification impact
    <What changed, why, and how coverage changed.>

## Conflict resolution comment

    <!-- auto:v1:conflict:<slug>:<slice> -->

    ## [AUTO] Shared-branch conflict resolved

    - Upstream head: `<sha>`
    - Resulting head: `<sha>`
    - Conflicting files: `<paths>`

    ### Resolution
    <How both flows' intent was preserved.>

    ### Post-resolution verification
    - Passed: `<quality-command>`

## Why the HTML comment markers

They make comments idempotent. A resumed run can find its own previous comment
and update it instead of appending a duplicate. Without them, a long run leaves
a PR with fifteen near-identical status comments.
