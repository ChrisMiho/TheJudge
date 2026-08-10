# test-naming.md

## Purpose

A hierarchical test-title convention so failures are self-locating and titles do
not rot.

## Hierarchy

    <Layer> - <Feature>  >  <Area>  >  <verb-led behavior>

In code:

    describe("Frontend - <Feature>", () => {
      describe("<Area>", () => {
        it("<verb-led behavior>", () => {
          // ...
        });
      });
    });

| Segment | Rule |
|---|---|
| Layer | Exactly one of the closed layer set below |
| Feature | Exactly one of the closed feature vocabulary below |
| Area | The surface or state under test; nesting is optional |
| `it` | Verb-led description of observable behavior |

## Layer vocabulary (closed)

`Frontend`, `Backend`

<!-- Adjust to your architecture: `Api`, `Worker`, `Cli`, `Web`. Keep it small
     and closed. -->

## Feature vocabulary (closed)

> **Rewrite this list for your product.** It is the one part of this file that
> cannot be copied.

- Frontend: `<Feature>`, `<Feature>`, `Shared`
- Backend: `<Feature>`, `<Feature>`, `Shared`

Adding a feature to the vocabulary is a deliberate act — it means a new
subsystem exists. If a test does not fit the vocabulary, that is a signal worth
examining, not a reason to invent an ad-hoc title.

## Anti-patterns

Never appear in a test title:

- slice letters — `Slice A`, `Slice-04`
- requirement or decision IDs — `REQ-054`, `(DEC-112)`, even parenthetically
- milestone framing — `MVP`, `Phase 2`
- file or class names used as the whole title

Slice letters and planning IDs are ephemeral or relocatable; tests are
permanent. Behavior is the durable name.

## Good and bad

| Bad | Good |
|---|---|
| `Slice-A: frozen summary renders` | `Frontend - <Feature>` > `Answered state` > `shows the frozen summary after a successful request` |
| `handles it correctly (REQ-054)` | `Backend - <Feature>` > `Validation` > `rejects a payload with an empty item list` |
| `UserCard.test.ts` | `Frontend - <Feature>` > `User card` > `truncates a display name over 40 characters` |
