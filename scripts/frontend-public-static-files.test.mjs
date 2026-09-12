import assert from "node:assert/strict"
import fs from "node:fs"
import { createRequire } from "node:module"
import path from "node:path"
import { fileURLToPath } from "node:url"
import test from "node:test"
import { spawnSync } from "node:child_process"

/**
 * `apps/frontend/public/robots.txt` and `apps/frontend/public/.well-known/security.txt`
 * (REQ-198) are real files instead of the single-page-app shell CloudFront's
 * 403/404 -> /index.html mapping returns today for any missing path
 * (scripts/aws-bootstrap.sh's CustomErrorResponses). Vite copies `public/` into
 * the built output verbatim, but a dotted directory like `.well-known/` is
 * exactly the kind of path a bundler could silently skip — so this is proven
 * against a real production build, never assumed.
 */

const here = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.join(here, "..")
const frontendDir = path.join(repoRoot, "apps", "frontend")
const publicDir = path.join(frontendDir, "public")
const distDir = path.join(frontendDir, "dist")

const require = createRequire(import.meta.url)

test("apps/frontend/public/robots.txt exists, permits crawling, and declares no sitemap", () => {
  const content = fs.readFileSync(path.join(publicDir, "robots.txt"), "utf8")
  assert.match(content, /^User-agent:\s*\*/m)
  assert.match(content, /^Disallow:\s*$/m)
  assert.doesNotMatch(content, /^Sitemap:/im)
})

test("apps/frontend/public/.well-known/security.txt carries the owner-edited contact, a Send-feedback comment, an Expires date, and no email address", () => {
  const content = fs.readFileSync(path.join(publicDir, ".well-known", "security.txt"), "utf8")
  assert.match(content, /^Contact:\s*https:\/\/mtgjudge\.gg\/\s*$/m)
  assert.match(content, /Send feedback/i)
  assert.match(content, /shared action menu/i)
  assert.match(content, /^Expires:\s*\d{4}-\d{2}-\d{2}T/m)
  assert.doesNotMatch(content, /@/)
})

/** Resolve the installed `vite` CLI script without assuming its subpath is
 *  exported (it isn't, on the installed version) — read the bin field off its
 *  own package.json instead, which every package must expose. */
function resolveViteBinPath() {
  const vitePackageJsonPath = require.resolve("vite/package.json", { paths: [frontendDir] })
  const vitePackageJson = JSON.parse(fs.readFileSync(vitePackageJsonPath, "utf8"))
  const binField = vitePackageJson.bin
  const relativeBinPath = typeof binField === "string" ? binField : binField.vite
  return path.join(path.dirname(vitePackageJsonPath), relativeBinPath)
}

test("the frontend production build copies robots.txt and the dotted .well-known/ directory into dist/ (REQ-198)", () => {
  const viteBinPath = resolveViteBinPath()

  const result = spawnSync(process.execPath, [viteBinPath, "build"], {
    cwd: frontendDir,
    encoding: "utf8",
    timeout: 180000
  })

  assert.equal(
    result.status,
    0,
    `vite build failed (status ${result.status}, error: ${result.error}):\n--- stdout ---\n${result.stdout}\n--- stderr ---\n${result.stderr}`
  )

  const builtRobotsPath = path.join(distDir, "robots.txt")
  const builtSecurityTxtPath = path.join(distDir, ".well-known", "security.txt")
  const sourceRobotsPath = path.join(publicDir, "robots.txt")
  const sourceSecurityTxtPath = path.join(publicDir, ".well-known", "security.txt")

  assert.equal(fs.existsSync(builtRobotsPath), true, "dist/robots.txt must exist after a production build")
  assert.equal(
    fs.existsSync(builtSecurityTxtPath),
    true,
    "dist/.well-known/security.txt must exist after a production build — a bundler that silently skips dotfiles " +
      "would leave this path falling back to the SPA shell with nobody noticing until the owner curls it in production"
  )

  assert.equal(
    fs.readFileSync(builtRobotsPath, "utf8"),
    fs.readFileSync(sourceRobotsPath, "utf8"),
    "dist/robots.txt must match the public/ source byte-for-byte"
  )
  assert.equal(
    fs.readFileSync(builtSecurityTxtPath, "utf8"),
    fs.readFileSync(sourceSecurityTxtPath, "utf8"),
    "dist/.well-known/security.txt must match the public/ source byte-for-byte"
  )
})
