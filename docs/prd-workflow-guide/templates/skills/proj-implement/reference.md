# Implement reference

Constraints that apply to every slice implementation.

1. **Reuse before creating.** Search for an existing helper, hook, or module
   first, and say what you found.
2. **Stay in scope.** A discovery outside the slice is noted in the slice doc,
   not acted on.
3. **Tests follow `test-naming.md`.** No slice letters or planning IDs in
   titles.
4. **Verification is a command, not an opinion.** Record the actual output.
5. **Never mark `done` on an unverified slice.** This is the single rule that
   keeps the whole status system trustworthy.
6. **Never commit unless the user explicitly asks.**
7. **Never introduce a dependency, endpoint, contract, or layer** that is not
   backed by a `REQ` or `DEC`.
8. **If you stop early, write the handoff block first.**

## Handoff block

    ## Status: in-progress

    ### Handoff
    - Done: <what is verified so far, or "nothing verified yet">
    - Next: <the concrete next action, specific enough to start cold>
    - Stopped because: <usage limit / blocker / session end>

`Next` is the field that gets written lazily. "Continue the work" is useless.
Name the file, the function, and the change.
