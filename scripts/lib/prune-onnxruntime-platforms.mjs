// Keep exactly the onnxruntime-node native binding the Lambda will load.
//
// `onnxruntime-node` ships every platform's binaries inside its published
// package (`bin/napi-v6/<os>/<arch>/`), about 283 MB before pruning, so the
// Lambda package keeps one and drops the rest to stay under the 250 MB
// unzipped quota (NFR-017). The platform kept must be the one the function
// runs on: `scripts/aws-bootstrap.sh` creates the API function with
// `--architectures arm64`, so the binding to keep is `linux/arm64`.
//
// Found 2026-09-07: the packaging step kept `linux/x64` and deleted
// `linux/arm64`, so every production cold start since the local embedder
// shipped (REQ-184, 2026-09-06) logged
// `[embedding] local provider failed; falling back to lexical retrieval.
// Error: Cannot find module '../bin/napi-v6/linux/arm64/onnxruntime_binding.node'`
// and answered with lexical retrieval. Nothing failed loudly: the package
// budget passed, the deploy succeeded, and the fallback is a WARN by design.
// So this helper also refuses (exit 1) when the binding to keep is absent —
// the same posture as the model-cache refusal in `package-lambda.sh`.
//
// Pure decision + a small fs effect, kept out of the shell script so a unit
// test can prove which directory survives without running `npm ci`.

import { existsSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

export const BINDING_FILE = "onnxruntime_binding.node";
export const NAPI_DIR = join("onnxruntime-node", "bin", "napi-v6");

/**
 * Decide what to remove and whether the target binding is present.
 *
 * `platforms` is `{ [os]: [arch, ...] }` as found on disk. Returns the
 * `<os>/<arch>` pairs to delete and whether `<os>/<arch>` for the target
 * exists with its binding file (`hasBinding` is the caller's observation).
 */
export function planPrune({ platforms, os, arch, hasBinding }) {
  const remove = [];
  for (const [foundOs, arches] of Object.entries(platforms)) {
    if (foundOs !== os) {
      remove.push(foundOs);
      continue;
    }
    for (const foundArch of arches) if (foundArch !== arch) remove.push(`${foundOs}/${foundArch}`);
  }
  const keep = `${os}/${arch}`;
  return { keep, remove, ok: Boolean(hasBinding) };
}

function listPlatforms(napiDir) {
  const platforms = {};
  if (!existsSync(napiDir)) return platforms;
  for (const entry of readdirSync(napiDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const arches = readdirSync(join(napiDir, entry.name), { withFileTypes: true })
      .filter((child) => child.isDirectory())
      .map((child) => child.name);
    platforms[entry.name] = arches;
  }
  return platforms;
}

/**
 * Prune `<nodeModulesDir>/onnxruntime-node/bin/napi-v6` down to `<os>/<arch>`.
 *
 * Returns the plan it applied. Throws when the target binding is missing —
 * before deleting anything, so a wrong target never destroys the right one.
 */
export function pruneOnnxruntimePlatforms({ nodeModulesDir, os, arch, log = console.error }) {
  const napiDir = join(nodeModulesDir, NAPI_DIR);
  const platforms = listPlatforms(napiDir);
  const hasBinding = existsSync(join(napiDir, os, arch, BINDING_FILE));
  const plan = planPrune({ platforms, os, arch, hasBinding });
  if (!plan.ok) {
    const found = Object.entries(platforms)
      .flatMap(([foundOs, arches]) => arches.map((a) => `${foundOs}/${a}`))
      .join(", ");
    throw new Error(
      `onnxruntime-node has no ${plan.keep}/${BINDING_FILE} under ${napiDir} (found: ${found || "nothing"}). ` +
        `The Lambda runs ${os}/${arch} (scripts/aws-bootstrap.sh --architectures), and a package without that binding ` +
        `silently degrades EMBEDDING_PROVIDER=local to lexical retrieval on every cold start (REQ-184). Refusing to package.`
    );
  }
  for (const relative of plan.remove) rmSync(join(napiDir, relative), { recursive: true, force: true });
  log(`onnxruntime-node: kept ${plan.keep}, removed ${plan.remove.join(", ") || "nothing"}`);
  return plan;
}

function main(argv) {
  const [nodeModulesDir, os = "linux", arch = "arm64"] = argv;
  if (!nodeModulesDir) {
    console.error("usage: node scripts/lib/prune-onnxruntime-platforms.mjs <node_modules dir> [os] [arch]");
    process.exit(2);
  }
  try {
    pruneOnnxruntimePlatforms({ nodeModulesDir, os, arch });
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main(process.argv.slice(2));
}
