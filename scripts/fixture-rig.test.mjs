import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import test from "node:test"

import {
  compareSnapshots,
  createRep,
  dispatchPrompt,
  layoutsAreIsolated,
  nodeModulesIsRealDirectory,
  repLayout,
  repLayouts,
  repUsesOwnOrigin,
  snapshotRepo
} from "./fixture-rig.mjs"

const git = (args, cwd) => execFileSync("git", args, { cwd, encoding: "utf8" })

function sandbox(body) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "fixture-rig-"))
  try {
    return body(root)
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
}

/** A stand-in for the repository that invokes the rig. */
function seedRepository(root) {
  const repo = path.join(root, "real-repo")
  fs.mkdirSync(repo, { recursive: true })
  git(["init", "-q", "-b", "main", repo])
  fs.writeFileSync(path.join(repo, "README.md"), "# real\n")
  fs.mkdirSync(path.join(repo, "PRD", "sections"), { recursive: true })
  fs.writeFileSync(path.join(repo, "PRD", "sections", "decisions.md"), "# decisions\n")
  git(["add", "-A"], repo)
  git(["-c", "user.email=a@b", "-c", "user.name=c", "commit", "-qm", "seed"], repo)
  return repo
}

test("fixture-rig - each rep gets its own clone and its own bare origin", () => {
  sandbox((root) => {
    const layouts = repLayouts(root, 3)
    assert.equal(layouts.length, 3)
    assert.ok(layoutsAreIsolated(layouts), "three reps must not share a clone or an origin")

    const seedRepo = seedRepository(root)
    for (const layout of layouts) createRep(layout, { seedRepo })

    for (const layout of layouts) {
      assert.ok(fs.existsSync(layout.clone), `rep ${layout.index} has no clone`)
      assert.ok(fs.existsSync(layout.origin), `rep ${layout.index} has no origin`)
      assert.ok(repUsesOwnOrigin(layout), `rep ${layout.index} does not point at its own origin`)
    }
  })
})

test("fixture-rig - two reps push the same branch without colliding", () => {
  // The scenario pushes `feature/collection-manager`. On a shared origin the
  // second rep's push fails and the run measures the collision, not the skill.
  sandbox((root) => {
    const seedRepo = seedRepository(root)
    const layouts = repLayouts(root, 2).map((layout) => createRep(layout, { seedRepo }))

    for (const layout of layouts) {
      git(["switch", "-q", "-c", "feature/collection-manager"], layout.clone)
      fs.writeFileSync(path.join(layout.clone, `rep-${layout.index}.txt`), "x\n")
      git(["add", "-A"], layout.clone)
      git(["-c", "user.email=a@b", "-c", "user.name=c", "commit", "-qm", "rep work"], layout.clone)
      git(["push", "-q", "origin", "feature/collection-manager"], layout.clone)
    }

    for (const layout of layouts) {
      const heads = git(["ls-remote", "--heads", layout.origin], layout.clone)
      assert.match(heads, /feature\/collection-manager/)
    }
    // Neither origin saw the other rep's work.
    assert.notEqual(
      git(["ls-remote", "--heads", layouts[0].origin], layouts[0].clone).split(/\s/)[0],
      git(["ls-remote", "--heads", layouts[1].origin], layouts[1].clone).split(/\s/)[0]
    )
  })
})

test("fixture-rig - a rep never points at the real remote", () => {
  sandbox((root) => {
    const seedRepo = seedRepository(root)
    git(["remote", "add", "origin", "https://github.com/example/real.git"], seedRepo)
    const layout = createRep(repLayout(root, 1), { seedRepo })

    const url = git(["remote", "get-url", "origin"], layout.clone).trim()
    assert.equal(url, layout.origin)
    assert.ok(!url.includes("github.com"), "a rep must never be pointed at the real remote")
  })
})

test("fixture-rig - every dispatch prompt carries the rep's absolute clone path", () => {
  sandbox((root) => {
    for (const layout of repLayouts(root, 3)) {
      const prompt = dispatchPrompt(layout, "Run the scenario.")
      assert.ok(prompt.startsWith(`Working directory: ${layout.clone}`))
      assert.ok(path.isAbsolute(layout.clone))
      // The pin has to survive a fan-out, which is what "work in your clone" did not.
      assert.match(prompt, /Copy the line above, unchanged, into every prompt you write/)
    }
  })
})

test("fixture-rig - a relative clone path is refused rather than emitted", () => {
  assert.throws(
    () => dispatchPrompt({ index: 1, clone: "rep-1/clone" }, "body"),
    /must be absolute/
  )
})

test("fixture-rig - node_modules is a real directory, never a symlink", () => {
  sandbox((root) => {
    const layout = createRep(repLayout(root, 1), { seedRepo: seedRepository(root) })
    assert.ok(nodeModulesIsRealDirectory(layout))
    const stat = fs.lstatSync(layout.nodeModules)
    assert.ok(stat.isDirectory() && !stat.isSymbolicLink())

    // A symlink of that name is what `.gitignore`'s `node_modules/` misses, so
    // it reads as untracked and an in-place run would refuse the dirty tree.
    const other = repLayout(root, 2)
    fs.mkdirSync(other.clone, { recursive: true })
    fs.symlinkSync(layout.nodeModules, other.nodeModules)
    assert.equal(nodeModulesIsRealDirectory(other), false)
  })
})

test("fixture-rig - a well-behaved rep leaves the invoking repository unchanged", () => {
  sandbox((root) => {
    const repo = seedRepository(root)
    const before = snapshotRepo(repo)

    const layout = createRep(repLayout(root, 1), { seedRepo: repo })
    fs.writeFileSync(path.join(layout.clone, "work.txt"), "rep work\n")

    const after = snapshotRepo(repo)
    const result = compareSnapshots(before, after)
    assert.equal(result.ok, true, result.message)
    assert.equal(git(["status", "--porcelain"], repo).trim(), "")
  })
})

test("fixture-rig - THE LEAK CHECK: a rep writing into the invoking repository fails the run", () => {
  sandbox((root) => {
    const repo = seedRepository(root)
    const before = snapshotRepo(repo)

    createRep(repLayout(root, 1), { seedRepo: repo })
    // The 2026-08-17 failure, reproduced: a rep writes product truth into the
    // live checkout instead of its clone.
    fs.mkdirSync(path.join(repo, "PRD", "sections", "decisions"), { recursive: true })
    fs.writeFileSync(
      path.join(repo, "PRD", "sections", "decisions", "card-collection.md"),
      "### DEC-161\n"
    )

    const result = compareSnapshots(before, snapshotRepo(repo))
    assert.equal(result.ok, false, "a leak must fail the run")
    assert.deepEqual(result.leaked, ["PRD/sections/decisions/card-collection.md"])
    assert.match(result.message, /A rep wrote outside its clone/)
    assert.match(result.message, /card-collection\.md/)
  })
})

test("fixture-rig - a moved HEAD is a leak too, even with a clean status", () => {
  sandbox((root) => {
    const repo = seedRepository(root)
    const before = snapshotRepo(repo)

    fs.writeFileSync(path.join(repo, "leaked.md"), "x\n")
    git(["add", "-A"], repo)
    git(["-c", "user.email=a@b", "-c", "user.name=c", "commit", "-qm", "leaked commit"], repo)

    const result = compareSnapshots(before, snapshotRepo(repo))
    assert.equal(result.ok, false, "a committed leak leaves a clean status and must still fail")
    assert.equal(result.movedHead, true)
    assert.match(result.message, /HEAD moved/)
  })
})

test("fixture-rig - dirt present before the run is not reported as a leak", () => {
  // The invoking checkout may already be dirty. Only *new* paths are the rig's.
  sandbox((root) => {
    const repo = seedRepository(root)
    fs.writeFileSync(path.join(repo, "already-dirty.md"), "x\n")
    const before = snapshotRepo(repo)

    const result = compareSnapshots(before, snapshotRepo(repo))
    assert.equal(result.ok, true, result.message)
    assert.deepEqual(result.leaked, [])
  })
})
