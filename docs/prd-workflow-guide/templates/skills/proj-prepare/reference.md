# Prepare reference

PR shapes for autonomous preparation runs.

## Autonomous metadata — recorded in the package README

    ## Autonomous metadata

    - Autonomous base: origin/<branch>

## READY PR

Title:

    [PREP][READY] <work name> (<slug>)

Body:

    <!-- prepare:slug=<slug> -->

    ## Original request
    <verbatim request>

    ## Selected finding and evidence
    <the finding, file-level evidence, and why it outranks the alternatives>

    ## Material assumptions
    <assumption -> authoritative evidence, or None>

    ## PRD alignment
    <REQ/FLOW/DEC references and the durable PRD changes made>

    ## Work-package artifacts
    <IDEA, README, DESIGN-BRIEF, GAMEPLAN, and a slice summary>

    ## Planned slices and verification
    <slice list with the exact commands or checks per slice>

    ## Preparation checks
    <fresh verification evidence and the independent-review disposition>

    ## Recorded base
    origin/<branch>

    ## Post-merge command
    `$proj-implement-all PRD/work/<slug>/`

## BLOCKED PR

Title:

    [PREP][BLOCKED] <work name> (<slug>)

Body: the same sections as READY, with `Planned slices` marked intentionally
omitted if map-out was not reached, plus:

    ## Blocker
    - Question: <the unresolved question>
    - Question ID: <Q-###>
    - Why the PRD and code cannot answer it: <evidence>
    - Plausible outcomes: <the materially different answers>
    - Furthest valid phase: <phase>
    - Omitted as invalid: <downstream artifacts not produced>

    ## Restart prompt
    Use $proj-prepare to resume PRD/work/<slug>/ after resolving <Q-###>:
    <answer>. Re-run refinement, quality-check, map-out, independent review,
    and preparation verification before updating the PR.

## External publication blocker report

    ## External publication blocker
    - Failed operation: <exact operation>
    - Error: <exact relevant output>
    - Preserved locally: <worktree, branch, commit, artifacts>
    - Confirmed remote state: <what exists>
    - Not completed: <the push or PR operation that does not exist>
    - Recovery action: <exact command or human action, then what to re-verify>

The last two fields matter more than they look. An autonomous run that fails at
publication will otherwise report success for work that exists only locally.
