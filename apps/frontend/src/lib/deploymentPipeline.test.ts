import { spawnSync } from "node:child_process";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const repoRoot = resolve(process.cwd(), "../..");
const deployScript = resolve(repoRoot, "scripts/aws-deploy.sh");
const workflowPath = resolve(repoRoot, ".github/workflows/deploy-aws.yml");
const tempDirs: string[] = [];

function writeExecutable(path: string, body: string): void {
  writeFileSync(path, body);
  chmodSync(path, 0o755);
}

/**
 * Puts fake `aws`, `npm`, and `bash` on PATH so the real deploy script runs to
 * completion without touching AWS or building anything. The stubs log how they
 * were called, which is what the assertions inspect.
 */
function createDeployHarness(): { binDir: string; awsLog: string; npmLog: string } {
  const root = mkdtempSync(join(tmpdir(), "thejudge-deploy-test-"));
  tempDirs.push(root);
  const binDir = join(root, "bin");
  const awsLog = join(root, "aws.log");
  const npmLog = join(root, "npm.log");
  writeFileSync(awsLog, "");
  writeFileSync(npmLog, "");
  mkdirSync(binDir);

  // Stands in for `bash scripts/package-lambda.sh`, which prints the artifact path.
  writeExecutable(join(binDir, "bash"), "#!/bin/sh\nprintf '/tmp/lambda.zip\\n'\n");
  writeExecutable(
    join(binDir, "aws"),
    `#!/bin/sh
printf '%s\\n' "$*" >> "$AWS_CALL_LOG"
case "$*" in
  *get-function-url-config*) printf 'https://api.example.test/\\n' ;;
  *list-distributions*) printf 'DIST123\\n' ;;
  *get-distribution*) printf 'web.example.test\\n' ;;
esac
`
  );
  writeExecutable(
    join(binDir, "npm"),
    `#!/bin/sh
printf '%s|%s\\n' "\${VITE_FEEDBACK_FORMSPREE_ID-}" "$*" >> "$NPM_CALL_LOG"
`
  );

  return { binDir, awsLog, npmLog };
}

function runDeploy(feedbackId?: string) {
  const harness = createDeployHarness();
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    PATH: `${harness.binDir}:${process.env.PATH ?? ""}`,
    AWS_ACCOUNT_ID: "123456789012",
    AWS_CALL_LOG: harness.awsLog,
    NPM_CALL_LOG: harness.npmLog
  };
  // Always start from "unset" so a developer's local .env or exported shell
  // value cannot decide the outcome of these assertions.
  delete env.VITE_FEEDBACK_FORMSPREE_ID;
  if (feedbackId !== undefined) {
    env.VITE_FEEDBACK_FORMSPREE_ID = feedbackId;
  }

  return {
    ...harness,
    result: spawnSync("/bin/bash", [deployScript], { cwd: repoRoot, env, encoding: "utf8" })
  };
}

afterEach(() => {
  for (const path of tempDirs.splice(0)) {
    rmSync(path, { recursive: true, force: true });
  }
});

describe("Frontend - Shared", () => {
  describe("AWS deployment configuration", () => {
    it("scopes the Formspree repository variable to the step that builds the uploaded artifact", () => {
      const workflow = readFileSync(workflowPath, "utf8");
      const deployStep = workflow.match(/ {6}- name: Deploy\n([\s\S]*?)(?=\n {6}- name:|$)/)?.[1];

      // aws-deploy.sh runs its own frontend build, so the variable has to reach
      // the Deploy step. On "Build project" it only reaches a discarded artifact.
      expect(deployStep).toContain(
        "VITE_FEEDBACK_FORMSPREE_ID: ${{ vars.VITE_FEEDBACK_FORMSPREE_ID }}"
      );
    });

    it("stops before AWS mutations when the Formspree ID is missing", () => {
      const { result, awsLog } = runDeploy();

      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("VITE_FEEDBACK_FORMSPREE_ID");
      expect(existsSync(awsLog) ? readFileSync(awsLog, "utf8") : "").toBe("");
    });

    it("reaches the frontend build that is uploaded", () => {
      const { result, npmLog } = runDeploy("configured-form-id");

      expect(result.status).toBe(0);
      expect(readFileSync(npmLog, "utf8")).toBe(
        "configured-form-id|--workspace apps/frontend run build\n"
      );
    });

    it("forwards the validated value explicitly rather than relying on ambient inheritance", () => {
      // The assertion above passes either way, because an unset-but-inherited
      // variable reaches `npm` through the script's own environment. Only a
      // structural check catches removal of the explicit forward, which is what
      // keeps the build independent of a sanitized or reordered environment.
      const script = readFileSync(deployScript, "utf8");

      expect(script).toMatch(
        /VITE_FEEDBACK_FORMSPREE_ID="\$feedback_formspree_id"[\s\\]*\n?\s*npm --workspace apps\/frontend run build/
      );
    });
  });
});
