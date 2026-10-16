# Design brief — ci-warnings-cleanup

**What this is:** a cleanup that makes the Quality Check run on GitHub come back
with no warnings and no notices. Players see nothing different: no screen, answer,
or deploy behaviour changes.

**What you need to do:** nothing to decide. No product truth changes, so there is
no `GATE-QUESTIONS.md`. Review the docs PR and merge it when you are happy with
the plan below. Three wider changes are offered separately at the end; none is
part of this work unless you ask.

**What it changes:** the workflow file moves every GitHub action to its current
major version (they all run on Node 24 now), pins every job to the Ubuntu 24.04
machine it already runs on, and the code clears all 19 lint warnings by moving
helper code into its own files.

## The problem in plain terms

The latest Quality Check run on `main` (run 38859813334, 2026-10-16) shows three
kinds of noise:

1. **Node 20 warning, one per job (8).** The GitHub actions the workflow uses
   (`checkout`, `setup-node`, `upload-artifact`, `download-artifact`,
   `configure-aws-credentials`, all at `@v4`) were built for Node 20. GitHub
   already forces them onto Node 24 and warns on every job.
2. **Ubuntu notice, one per job (8).** Every job asks for `ubuntu-latest`, and
   that label is about to switch from Ubuntu 24.04 to Ubuntu 26.04.
3. **Lint warnings (19).** The static job's lint step reports 19 warnings. The
   GitHub page shows only 10 of them, because GitHub caps the warnings it lists
   per step. The CI log of the same run prints all 19 and ends with
   `✖ 19 problems (0 errors, 19 warnings)` — the same 19 a local `npm run lint`
   reports on this branch.

## Decision 1 — all 19 lint warnings are in the core scope

The owner asked to clear the warnings on the run. Clearing only the 10 GitHub
lists would not do that: the cap would surface the next 6 on the following run,
because 16 of the 19 lines carry GitHub's warning marker in the log. The other
3 are "unused eslint-disable comment" lines; they print in the lint output but
GitHub does not list them. Removing them is a one-line comment deletion each.

So the core scope is the whole lint output: **0 errors, 0 warnings** after the
change. Evidence: static job log of run 38859813334 (job 116839305146) and local
`npx eslint .` on this branch, both 19 warnings, identical lines.

## Verified external facts

Each row was read from the action's own repository on 2026-10-16:
`runs.using` from `action.yml` at the major tag (`gh api repos/<repo>/contents/action.yml?ref=<tag>`),
breaking changes from `gh release view <tag> -R <repo>`.

| Action | Today | First Node 24 major | Latest major (latest release) | Breaking changes that touch this workflow |
| --- | --- | --- | --- | --- |
| `actions/checkout` | `@v4` (node20; v4.4.0 too) | **v5** (v5.0.0) | **v7** (v7.0.1, 2026-07-20) | None. v6 moves persisted git credentials to a separate file — the `changes` job only runs local `git diff` / `git cat-file`. v7 blocks checking out fork PRs under `pull_request_target` / `workflow_run` — this workflow uses neither. v7 is an internal ESM rewrite. |
| `actions/setup-node` | `@v4` (node20) | **v5** (v5.0.0) | **v7** (v7.1.0, 2026-10-08) | None. v5 turns on automatic caching when `package.json` has a `packageManager` field — the root `package.json` has none and every job already sets `cache: npm`. v6 limits that automatic caching to npm. v7 stops exporting a dummy `NODE_AUTH_TOKEN` — this workflow publishes nothing. |
| `actions/upload-artifact` | `@v4` (node20) | **v6** (v6.0.0; v5 is still node20) | **v7** (v7.0.2, 2026-10-07) | None. v7 adds `archive` (default `true`, the zip upload used today). Every input the frontend job passes — `name`, `path`, `retention-days`, `if-no-files-found`, `include-hidden-files` — still exists in v7's `action.yml`. |
| `actions/download-artifact` | `@v4` (node20) | **v7** (v7.0.0; v5 and v6 are still node20) | **v8** (v8.0.2, 2026-10-07) | None in practice. v5 changes the output path only for single downloads by artifact ID — `coverage-merge` downloads by `pattern` with `merge-multiple: true`. v8 now fails the step on a hash mismatch (`digest-mismatch` defaults to `error`) and skips unzipping non-zip files; artifacts here are zipped uploads from the same run. `pattern`, `path` and `merge-multiple` still exist. |
| `aws-actions/configure-aws-credentials` | `@v4` (node20) | **v6** (v6.0.0; v5 is still node20) | **v6** (v6.3.0, 2026-09-15) | None. v5 tightened how invalid boolean inputs are read — the deploy job passes only `role-to-assume` and `aws-region`, both strings. OIDC sign-in (job-scoped `id-token: write`) is unchanged. |

Runner compatibility: every Node 24 release above needs runner v2.327.1 or newer
(release notes of checkout v5.0.0, setup-node v5.0.0, upload v6.0.0, download
v7.0.0, aws v6.0.0). The deploy job of run 38859813334 logged
`Current runner version: '2.337.0'`.

### The Ubuntu change

Source: `gh issue view 14748 -R actions/runner-images` (opened 2026-09-17) and
the runner-images `README.md` label table.

- **When:** `ubuntu-latest` moves from Ubuntu 24.04 to Ubuntu 26.04 in a rollout
  that **starts 2026-10-19 and finishes by 2026-11-19**. Only the x64
  `ubuntu-latest` label moves.
- **What changes on the machine:** Ubuntu 24.04.5 → 26.04.1, kernel 6.17 → 7.0,
  systemd 255 → 259. The issue lists AWS CLI 2.36.40, Docker Buildx, Rust, Java 17
  and others as the same on both. The 26.04 image readme lists Node.js 24.21.0 and
  `zip` 3.0 preinstalled. The issue warns that anything depending on 24.04-specific
  packages, libraries, compilers or prebuilt binaries may break, and names
  `ubuntu-24.04` as the way back.
- **Explicit labels that exist:** `ubuntu-26.04`, `ubuntu-26.04-arm`,
  `ubuntu-24.04` (what `ubuntu-latest` means today), `ubuntu-24.04-arm`,
  `ubuntu-22.04`, `ubuntu-22.04-arm`, `ubuntu-slim`.
- **Today's machine:** every job of run 38859813334 logged
  `Image: ubuntu-24.04`, `Version: 20261012.334.1`.

**What it could do to the deploy job.** The deploy job builds the Lambda bundle
on an x64 runner for an arm64 Lambda. The native pieces (onnxruntime-node and
sharp) are not compiled on the runner: `scripts/package-lambda.sh:93` installs
npm's prebuilt linux/arm64/glibc builds with
`npm ci --omit=dev --os=linux --cpu=arm64 --libc=glibc`, and two guards refuse
to package when either arm64 build is missing
(`scripts/lib/prune-onnxruntime-platforms.mjs`,
`scripts/lib/assert-sharp-platform-binding.mjs`). So the runner's OS should not
change which native files ship. What a new OS can still touch is the job's own
tooling: `apt-get install zip`, the AWS CLI the deploy script calls, and the npm
install of host-side build tools. The deploy job only runs on a push to `main`,
so a PR run cannot try it on Ubuntu 26 first — the first try would be a live
production deploy.

## Decision 2 — the workflow change

1. **Every action moves to its latest major**: `actions/checkout@v7`,
   `actions/setup-node@v7`, `actions/upload-artifact@v7`,
   `actions/download-artifact@v8`, `aws-actions/configure-aws-credentials@v6`.
   Upload and download move together in the same change. No `with:` input
   changes.
   - Why latest and not the first Node 24 major: none of the breaking changes
     between them touch this workflow (table above), and the latest majors are
     the ones receiving fixes — it postpones the next forced bump.
2. **Every job pins `runs-on: ubuntu-24.04`** (all six: `static`, `backend`,
   `frontend`, `coverage-merge`, `changes`, `deploy`).
   - Why 24.04 and not 26.04: it is the exact machine every job ran on today, so
     the deploy that ships to players stays identical, and the notice goes away
     because no job asks for `ubuntu-latest` any more. Moving to 26.04 is offered
     as follow-up 2, done on purpose rather than by GitHub's rollout.
   - How long 24.04 lasts: GitHub still offers `ubuntu-22.04` today, so the
     previous LTS image stays available for years after a newer one becomes
     latest.
3. Nothing else in the workflow changes: node versions (22, deploy 24), steps,
   job graph, concurrency, permissions, and the deploy condition stay as they are.

Tests that read the workflow (`apps/frontend/src/lib/deploymentPipeline.test.ts`,
`scripts/ci-workflow-parity.test.mjs`) assert on step contents and the job set,
not on action versions or runner labels, so they need no edit.

## Decision 3 — the lint fixes, and why no player sees a difference

### Fast-refresh warnings (15 lines in 9 files)

"Fast refresh" is the dev-server feature that swaps an edited component in place
without reloading the page. Its lint rule warns when a file mixes components with
other exports (hooks, helper functions, context objects), because such a file
falls back to a full reload. Production builds do not use fast refresh at all.

The fix is to split each mixed file so components sit in files of their own, and
update the imports. Each move relocates declarations without changing their
bodies. Per file, the side that moves is the side with fewer importers:

| File | What moves | To (new sibling file) | Importers to update |
| --- | --- | --- | --- |
| `lib/feedback/FeedbackContextProvider.tsx` | `FeedbackSeamContext`, its default seam and type, `useRegisterFeedbackContributor`, `useFeedbackContextReader` | `lib/feedback/feedbackSeam.ts` | `MtgAssistantApp.tsx`, `App.tsx` and `FeedbackContextProvider.test.tsx` where they import the hooks; the provider imports the context |
| `components/SheetShell.tsx` | `SheetCloseContext`, `useSheetClose` | `components/sheetCloseContext.ts` | `life-tracker/GameSetupPanel.tsx`; `SheetShell.tsx` imports the context |
| `components/FrozenGameContextDetails.tsx` | `getFrozenGameContextTriggerLabel` and the private helpers only it needs | `components/frozenGameContextTriggerLabel.ts` | `EnrichmentStep.tsx`, `FrozenGameContextDetails.test.tsx` |
| `components/AmbientScene.tsx` | `shouldFallbackToStatic` and its `PROBE_*` constants | `components/ambientSceneFallback.ts` | `AmbientScene.test.tsx`; `AmbientScene.tsx` imports it |
| `lib/portal/brandTapContext.tsx` | `BrandTapProvider` (the context gets exported) | `lib/portal/BrandTapProvider.tsx` | `App.tsx` |
| `lib/portal/leftEdgeDrawerContext.tsx` | `LeftEdgeDrawerProvider` | `lib/portal/LeftEdgeDrawerProvider.tsx` | `App.tsx`, `portal/FeaturePortalMenu.test.tsx` |
| `lib/portal/seedContext.tsx` | `AssistantSeedProvider` | `lib/portal/AssistantSeedProvider.tsx` | `App.tsx`, `lib/portal/seedContext.test.tsx` |
| `components/portal/destinationRegistry.tsx` | nothing moves: the four local aliases (`const QuickLookupApp = quickLookup.Component`, lines 64–67) are deleted and the `render` entries use `<quickLookup.Component …/>` etc. directly | — | none |
| `test/enrichmentStep.tsx` (test helper, never shipped) | `StatefulEnrichmentHarness` to its own file; the shared fixtures (`card`, `card1`, `card2`, `singlePlayerGameContext`, `twoPlayerGameContext`) to a fixtures file both import, re-exported from `enrichmentStep.tsx` | `test/StatefulEnrichmentHarness.tsx`, `test/enrichmentFixtures.ts` | none — the three `EnrichmentStep*.test.tsx` files keep importing from `test/enrichmentStep` |

New file names follow the local convention (PascalCase for a component file,
camelCase otherwise); map-out may adjust a name, not the split. Paths are under
`apps/frontend/src/`.

How behaviour is kept identical:

- **One context object, not two.** Each `createContext` call stays a single call
  in one module; provider and hook import that same object. If a split ever
  created a second context, the hook would read the default value instead of the
  provider's — the existing provider-plus-hook tests (`seedContext.test.tsx`,
  `FeaturePortalMenu.test.tsx`, `FeedbackContextProvider.test.tsx`,
  `SheetShell.test.tsx`, `GameSetupPanel.test.tsx`) would fail.
- **Same component identity in the registry.** `<quickLookup.Component …/>`
  evaluates to the same value the deleted alias held, so React sees the same
  element type: no remount, same lazy loading, same preload.
- **Bodies untouched.** Only `import`/`export` lines and file locations change;
  `npm run typecheck` catches any missed import.
- No test file mocks any of these modules by path (checked: no `vi.mock` of
  them), so no mock breaks when a symbol moves.

### The scroll-to-latest warning (`ConversationThread.tsx:173`)

What the player experiences today: when a new answer arrives, the thread scrolls
so the newest question sits at the top (or to the bottom for a short exchange) —
unless the player has scrolled up to read, in which case the position holds and
a "New response" button appears.

The warning: the layout effect that does this runs only when the message count
changes (`[messages.length]`), and calls `scrollToLatest`, a function declared in
the component body. Lint wants that function in the dependency list.

**The fix:** keep the dependency list exactly `[messages.length]`, and have the
effect call the function through a ref that always holds the current render's
copy:

```tsx
const scrollToLatestRef = useRef(scrollToLatest);
scrollToLatestRef.current = scrollToLatest;   // right after the declaration
// inside the effect: scrollToLatestRef.current(container)  (three call sites)
```

Why this is guaranteed identical:

1. **Same trigger.** The dependency list is unchanged, so the effect runs on
   exactly the same renders as today.
2. **Same function.** The ref is assigned during render; a layout effect runs in
   the commit of that same render, so `scrollToLatestRef.current` is the very
   closure today's effect captures — same `messages`, same
   `latestAssistantIndex`.
3. **The button path is untouched.** `handleNewResponse` keeps calling
   `scrollToLatest` directly.
4. **Lint accepts it** because a `useRef` object is stable and `.current` reads
   are not dependencies.
5. **Local precedent.** The same render-time "latest ref" assignment already
   exists at `hooks/useOutsideDismiss.ts:37`, `hooks/useDictation.ts:84`, and
   `lib/feedback/FeedbackContextProvider.tsx:107`.
6. **Tests.** The existing `ConversationThread.test.tsx` cases — first answer
   anchored to its start, follow at exactly 64px from the bottom, hold position
   above 64px with one "New response" button, the button scrolls to and focuses
   the newest answer, entrance motion only on appended messages, instant scroll
   under reduced motion — must pass with no assertion edits.

Rejected: adding `scrollToLatest` to the list (a fresh function every render
would re-run the effect on every render — on an empty thread that path resets
state each time); wrapping it in `useCallback` (it would then re-run when message
*content* changes, not only the count); `useEffectEvent` (not in React 18.3.1,
the version installed); a disable comment (hides the warning rather than fixing
it).

### Unused disable comments (3)

Delete the three `eslint-disable` comments that no longer suppress anything:
`components/portal/ThemeSection.tsx:102`, `components/trade/TradeBalancer.tsx:407`
(both `react-hooks/exhaustive-deps`), and
`apps/backend/src/eval/contextEvaluationHarness.test.ts:326` (`no-console`).
Comment-only edits.

## Acceptance criteria

1. `npm run lint` on the work branch prints no problems (0 errors, 0 warnings).
2. `.github/workflows/quality-check.yml` contains no `@v4` action reference; the
   pins are exactly `actions/checkout@v7`, `actions/setup-node@v7`,
   `actions/upload-artifact@v7`, `actions/download-artifact@v8`,
   `aws-actions/configure-aws-credentials@v6`; all six `runs-on` lines read
   `ubuntu-24.04`; no other workflow line changes.
3. `npm run quality:check` passes locally with no test assertion edited — only
   import paths in test files change.
4. The PR's Quality Check run: every job that runs (`static`, `backend`, three
   frontend shards, `coverage-merge`) succeeds and shows zero annotations,
   checked with `gh api repos/ChrisMiho/TheJudge/check-runs/<job-id>/annotations`.
5. After merge (post-merge only — `changes` and `deploy` never run on a PR): the
   `main` run's `changes` and `deploy` jobs succeed with zero annotations, and one
   live question is answered with the embedder loaded (CloudWatch shows no
   lexical-fallback WARN), the usual native-chain check after a deploy.

## Assumptions (preparation contract ladder)

- **No product truth changes** (rung 1). `PRD/sections/` mentions CI only as
  context: `system-map.md` names `quality-check.yml` as where the deploy lives;
  `functional-requirements.md` (deploy code-set rule) lists
  `.github/workflows/**` as code and `eslint.config.mjs` as non-code;
  `non-functional-requirements.md` NFR-012's notes record that the `ubuntu-latest`
  runner was 4-vCPU when sharding was measured. None states a runner label, an
  action version, or a lint policy, and all stay true after this change
  (`ubuntu-24.04` is the image those measurements ran on). So no
  `GATE-QUESTIONS.md`.
- **Runner: pin 24.04** (rungs 4–5) — smallest reversible change that keeps the
  production deploy identical.
- **Action majors: latest** (rung 3, equivalent technical choice) — breaking
  changes verified as not touching this workflow.
- **Split direction and file names** (rung 3) — fewer importers moved, local
  naming convention.
- **The workflow edit triggers a deploy on merge** — `.github/workflows/**` is in
  the deploy code set, so the merge itself exercises the new deploy job.

## Non-goals

- No screen, answer, or deploy behaviour change.
- No new lint rule, no change to `eslint.config.mjs` rule levels.
- No change to node versions, job structure, shard count, or deploy scripts.
- Out of scope, noticed in passing: `system-map.md`'s "Production secrets and
  deployment identity" row still points at `.github/workflows/deploy-aws.yml`,
  which no longer exists (the deploy moved into `quality-check.yml`).

## Offered follow-ups (not part of this work)

1. **Make new lint warnings fail CI.** Add `--max-warnings 0` to the lint step,
   so a warning blocks a PR instead of piling up. This is a lint-policy change
   and would need its own product-truth entry.
2. **Move to Ubuntu 26.04 on purpose.** Switch the PR-only jobs to
   `ubuntu-26.04` first, watch a few runs, then the deploy job with a post-deploy
   check — instead of letting GitHub's rollout pick the day.
3. **Keep action majors current automatically.** A Dependabot config for the
   `github-actions` ecosystem (the repo has none today) would open a PR when an
   action ships a new major.

## Suggested slicing (for map-out)

- Slice A — workflow pins and runner labels (criteria 2, 4, 5).
- Slice B — lint fixes (criteria 1, 3), one commit per file group so a review can
  follow each move.

## Sources

- Intake (evidence): `PRD/work/ci-warnings-cleanup/intake/ci-warnings-capture.md`
- Run 38859813334 job logs: static `116839305146`, deploy `116839792340`
- Action facts: `gh release view` and `action.yml` per tag, repos listed above
- Runner facts: `actions/runner-images` issue 14748, `README.md`,
  `images/ubuntu/Ubuntu2604-Readme.md`
- Prior runs on this workflow: `PRD/instructions/receipts/ci-quality-check-runtime-2026-08-06.md`,
  `PRD/instructions/receipts/lambda-s3-deploy-2026-08-29.md`,
  `PRD/instructions/receipts/frontend-routing-and-code-splitting-2026-08-11.md`
