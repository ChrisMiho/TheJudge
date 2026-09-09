// Unit tests for scripts/refresh-and-open-pr.mjs.
//
// Every git/gh/pipeline effect is an injected fake. This file never invokes
// `npm run data:refresh`, `npm run data:build`, or any live git/gh network
// operation — the real implementations only exist behind `main()`'s
// `import.meta.url` guard in the module under test, which importing this
// file for `node --test` never runs.

import assert from "node:assert/strict"
import { test } from "node:test"

import {
  COMMITTED_ARTIFACT_PATHS,
  buildAddPathList,
  buildCommitMessage,
  classifyChange,
  commitArtifacts,
  deleteLocalBranch,
  formatDateStamp,
  openPullRequest,
  parseDirtyTree,
  planBranchActions,
  pushBranch,
  refreshAndOpenPr,
  refreshBranchName,
  runPipeline
} from "./refresh-and-open-pr.mjs"

const FIXED_DATE = new Date("2026-09-08T12:00:00.000Z")

// ---- A1: dirty-tree classifier ----

test("parseDirtyTree: empty porcelain output proceeds", () => {
  assert.equal(parseDirtyTree("").status, "proceed")
  assert.equal(parseDirtyTree(null).status, "proceed")
})

test("parseDirtyTree: non-empty porcelain output refuses with a reason", () => {
  const result = parseDirtyTree(" M apps/frontend/public/data/cardMetadata.json\n?? scratch.txt\n")
  assert.equal(result.status, "refuse")
  assert.match(result.reason, /refusing to run on a dirty working tree/)
  assert.equal(result.paths.length, 2)
})

// ---- A2: branch-plan function ----

test("planBranchActions: fetches origin before creating the branch, off origin/main", () => {
  const actions = planBranchActions(FIXED_DATE)
  assert.deepEqual(actions[0], ["fetch", "origin"])
  assert.equal(actions[1][0], "checkout")
  assert.equal(actions[1][1], "-b")
  assert.equal(actions[1][2], refreshBranchName(FIXED_DATE))
  assert.equal(actions[1][3], "origin/main")
})

test("refreshBranchName / formatDateStamp: YYYY-MM-DD form", () => {
  assert.equal(formatDateStamp(FIXED_DATE), "2026-09-08")
  assert.equal(refreshBranchName(FIXED_DATE), "chore/data-refresh-2026-09-08")
})

// ---- A3: pipeline runner order and short-circuit ----

test("runPipeline: invokes data:refresh before data:build", () => {
  const calls = []
  runPipeline((step) => calls.push(step))
  assert.deepEqual(calls, ["data:refresh", "data:build"])
})

test("runPipeline: a thrown first step means the second step's runner is never called", () => {
  const calls = []
  assert.throws(() => {
    runPipeline((step) => {
      calls.push(step)
      if (step === "data:refresh") throw new Error("boom")
    })
  }, /pipeline step "data:refresh" failed/)
  assert.deepEqual(calls, ["data:refresh"])
})

// ---- A4: explicit path list ----

test("buildAddPathList: exactly the eleven documented paths, hard-coded", () => {
  const paths = buildAddPathList()
  assert.equal(paths.length, 11)
  assert.deepEqual(paths, COMMITTED_ARTIFACT_PATHS)
  // A copy, not the live array — mutating the result must not mutate the constant.
  paths.push("apps/frontend/public/data/extra.json")
  assert.equal(buildAddPathList().length, 11)
})

// ---- A5: commit-message date ----

test("buildCommitMessage: contains the run date in YYYY-MM-DD form", () => {
  assert.equal(buildCommitMessage(FIXED_DATE), "chore: refresh data artifacts (2026-09-08)")
})

// ---- A7 / A8: PR-open function ----

test("openPullRequest: returns the URL from the injected gh runner's stdout", () => {
  const calls = []
  const url = openPullRequest({
    branch: "chore/data-refresh-2026-09-08",
    ghRunner: (args) => {
      calls.push(args)
      return "https://github.com/local/thejudge/pull/999\n"
    }
  })
  assert.equal(url, "https://github.com/local/thejudge/pull/999")
  assert.equal(calls.length, 1)
  assert.deepEqual(calls[0].slice(0, 5), ["pr", "create", "--base", "main", "--head"])
})

test("openPullRequest: a throwing gh runner rejects identifying PR creation as the failed step, not a false success", () => {
  assert.throws(
    () =>
      openPullRequest({
        branch: "chore/data-refresh-2026-09-08",
        ghRunner: () => {
          throw new Error("gh: not authenticated")
        }
      }),
    /PR creation failed \(gh pr create/
  )
})

// ---- B1: change classification ----

test("classifyChange: empty diff is no-op, non-empty diff is changed", () => {
  assert.equal(classifyChange("").status, "no-op")
  assert.equal(classifyChange("\n").status, "no-op")
  assert.equal(classifyChange(null).status, "no-op")
  const changed = classifyChange("apps/backend/data/cardPrintingPricesByOracleId.json.br\n")
  assert.equal(changed.status, "changed")
  assert.deepEqual(changed.paths, ["apps/backend/data/cardPrintingPricesByOracleId.json.br"])
})

// ---- commitArtifacts / pushBranch / deleteLocalBranch plumbing ----

test("commitArtifacts: adds the explicit paths then commits with the message, no wildcard staging", () => {
  const calls = []
  commitArtifacts({ paths: ["a.json", "b.json"], message: "chore: refresh data artifacts (2026-09-08)", gitRunner: (args) => calls.push(args) })
  assert.deepEqual(calls[0], ["add", "--", "a.json", "b.json"])
  assert.deepEqual(calls[1], ["commit", "-m", "chore: refresh data artifacts (2026-09-08)"])
})

test("pushBranch: pushes to origin with no force flag", () => {
  const calls = []
  pushBranch({ branch: "chore/data-refresh-2026-09-08", gitRunner: (args) => calls.push(args) })
  assert.deepEqual(calls[0], ["push", "origin", "chore/data-refresh-2026-09-08"])
})

test("deleteLocalBranch: switches back then deletes the local-only branch", () => {
  const calls = []
  deleteLocalBranch({ branch: "chore/data-refresh-2026-09-08", gitRunner: (args) => calls.push(args) })
  assert.deepEqual(calls[0], ["checkout", "-"])
  assert.deepEqual(calls[1], ["branch", "-D", "chore/data-refresh-2026-09-08"])
})

// ---- Orchestration: refreshAndOpenPr over fully injected effects ----

function makeEffects(overrides = {}) {
  const calls = { git: [], gh: [], pipeline: [], commit: 0, push: 0, openPr: 0, deleteBranch: 0, order: [] }
  const base = {
    getDirtyTreeOutput: () => "",
    gitRunner: (args) => {
      calls.git.push(args)
      return ""
    },
    runPipelineImpl: (step) => {
      calls.pipeline.push(step)
    },
    // Non-empty by default so the ordinary "changed" path is exercised
    // without every test having to opt in; the no-op tests override it.
    getArtifactDiffOutput: () => "apps/backend/data/cardPrintingPricesByOracleId.json.br\n",
    ghRunner: (args) => {
      calls.gh.push(args)
      return "https://github.com/local/thejudge/pull/1\n"
    },
    commit: (opts) => {
      calls.commit += 1
      calls.order.push("commit")
      return opts
    },
    push: (opts) => {
      calls.push += 1
      calls.order.push("push")
      return opts
    },
    openPr: () => {
      calls.openPr += 1
      calls.order.push("openPr")
      return "https://github.com/local/thejudge/pull/1"
    },
    deleteBranch: (opts) => {
      calls.deleteBranch += 1
      calls.order.push("deleteBranch")
      return opts
    },
    now: FIXED_DATE,
    log: () => {},
    errorLog: () => {}
  }
  return { effects: { ...base, ...overrides }, calls }
}

test("refreshAndOpenPr: refuses on a dirty tree and takes no git action", async () => {
  const { effects, calls } = makeEffects({ getDirtyTreeOutput: () => " M package.json\n" })
  const result = await refreshAndOpenPr(effects)
  assert.equal(result.status, "refused")
  assert.equal(calls.git.length, 0)
  assert.equal(calls.pipeline.length, 0)
})

// ---- B2: no-op path ----

test("refreshAndOpenPr: no-op path never calls commit/push/PR-open, and deletes the branch", async () => {
  const { effects, calls } = makeEffects({ getArtifactDiffOutput: () => "" })
  const result = await refreshAndOpenPr(effects)
  assert.equal(result.status, "no-op")
  assert.equal(calls.commit, 0)
  assert.equal(calls.push, 0)
  assert.equal(calls.openPr, 0)
  assert.equal(calls.deleteBranch, 1)
})

// ---- B3: changed path, exactly once, in order ----

test("refreshAndOpenPr: changed path calls commit, push, and PR-open exactly once each, in order", async () => {
  const { effects, calls } = makeEffects()
  const result = await refreshAndOpenPr(effects)
  assert.equal(result.status, "pr-opened")
  assert.equal(result.url, "https://github.com/local/thejudge/pull/1")
  assert.equal(calls.commit, 1)
  assert.equal(calls.push, 1)
  assert.equal(calls.openPr, 1)
  assert.equal(calls.deleteBranch, 0)
  assert.deepEqual(calls.order, ["commit", "push", "openPr"])
})

// ---- B4: pipeline failure preserves partial state ----

test("refreshAndOpenPr: a pipeline failure prevents commit/push/PR-open and leaves the branch undeleted", async () => {
  const { effects, calls } = makeEffects({
    runPipelineImpl: (step) => {
      calls.pipeline.push(step)
      if (step === "data:build") throw new Error("build script exited 1")
    }
  })
  const result = await refreshAndOpenPr(effects)
  assert.equal(result.status, "pipeline-failed")
  assert.deepEqual(calls.pipeline, ["data:refresh", "data:build"])
  assert.equal(calls.commit, 0)
  assert.equal(calls.push, 0)
  assert.equal(calls.openPr, 0)
  assert.equal(calls.deleteBranch, 0)
})

test("refreshAndOpenPr: a throwing gh runner on the changed path still commits and pushes, then surfaces the PR error", async () => {
  const { effects, calls } = makeEffects({
    openPr: () => {
      calls.openPr += 1
      throw new Error("PR creation failed (gh pr create --base main --head chore/data-refresh-2026-09-08): gh: not authenticated")
    }
  })
  await assert.rejects(() => refreshAndOpenPr(effects), /PR creation failed/)
  assert.equal(calls.commit, 1)
  assert.equal(calls.push, 1)
  assert.equal(calls.openPr, 1)
})
