// Refuse to package a Lambda whose `sharp` has no native build for the
// function's platform.
//
// `@huggingface/transformers` (the bundled local embedder, REQ-181/REQ-184)
// imports `sharp` at module load — even for text-only feature extraction — and
// `sharp` loads its native binding from a platform package,
// `@img/sharp-<os>-<arch>` plus `@img/sharp-libvips-<os>-<arch>`, that npm
// installs as *optional dependencies matching the machine running the
// install*. The deploy runner is linux/x64 and a developer laptop is
// darwin/arm64; the function is linux/arm64 on glibc. So a plain `npm ci`
// never ships the build the Lambda needs, and `sharp` throws on import:
//
//   [embedding] local provider failed; falling back to lexical retrieval.
//   Error: Could not load the "sharp" module using the linux-arm64 runtime
//
// Found 2026-09-07, on the first cold start after PR #204 fixed the same
// class of bug for `onnxruntime-node`. `scripts/package-lambda.sh` now runs
// `npm ci --os=linux --cpu=<arch> --libc=glibc` so npm resolves the function's
// platform instead of the host's (the `libc` override matters: without it a
// macOS host satisfies neither `glibc` nor `musl` and npm installs no build at
// all), and this helper refuses (exit 1) when the resulting `node_modules`
// still lacks the binding — the same posture as
// `prune-onnxruntime-platforms.mjs`, because the fallback is a WARN by design
// and nothing else would fail loudly.
//
// Pure decision + a read-only fs check, kept out of the shell script so a unit
// test can prove the refusal without running `npm ci`.

import { existsSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

/** The two platform packages sharp resolves at load time, and the file inside each that proves the build is real. */
export function sharpPlatformFiles({ os, arch }) {
  const platform = `${os}-${arch}`;
  return {
    binding: join("@img", `sharp-${platform}`, "lib", `sharp-${platform}.node`),
    libvipsDir: join("@img", `sharp-libvips-${platform}`, "lib")
  };
}

/** `ok` only when both the binding and its libvips library directory exist. */
export function planSharpCheck({ hasBinding, hasLibvips, os, arch }) {
  return { platform: `${os}-${arch}`, ok: Boolean(hasBinding) && Boolean(hasLibvips), hasBinding, hasLibvips };
}

/**
 * Check `<nodeModulesDir>` for sharp's `<os>-<arch>` build. Throws, naming
 * what is missing and the `npm ci` flags that install it, when either half
 * is absent. Never writes.
 */
export function assertSharpPlatformBinding({ nodeModulesDir, os, arch, log = console.error }) {
  const files = sharpPlatformFiles({ os, arch });
  const plan = planSharpCheck({
    os,
    arch,
    hasBinding: existsSync(join(nodeModulesDir, files.binding)),
    hasLibvips: existsSync(join(nodeModulesDir, files.libvipsDir))
  });
  if (!plan.ok) {
    const missing = [
      plan.hasBinding ? null : files.binding,
      plan.hasLibvips ? null : files.libvipsDir
    ]
      .filter(Boolean)
      .join(" and ");
    throw new Error(
      `sharp has no ${plan.platform} build under ${nodeModulesDir} (missing ${missing}). ` +
        `@huggingface/transformers imports sharp at load, so a Lambda on ${os}/${arch} without it silently degrades ` +
        `EMBEDDING_PROVIDER=local to lexical retrieval on every cold start (REQ-184). ` +
        `Install for the function's platform, not the host's: npm ci --os=${os} --cpu=${arch} --libc=glibc. Refusing to package.`
    );
  }
  log(`sharp: ${plan.platform} build present (${files.binding})`);
  return plan;
}

function main(argv) {
  const [nodeModulesDir, os = "linux", arch = "arm64"] = argv;
  if (!nodeModulesDir) {
    console.error("usage: node scripts/lib/assert-sharp-platform-binding.mjs <node_modules dir> [os] [arch]");
    process.exit(2);
  }
  try {
    assertSharpPlatformBinding({ nodeModulesDir, os, arch });
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main(process.argv.slice(2));
}
