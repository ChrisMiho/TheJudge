import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import net from "node:net";
import path from "node:path";
import test from "node:test";

import {
  CAMERA_UNAVAILABLE_TEXT,
  CHECK_CAMERA_AVAILABLE,
  CHROME_ARGS,
  OUTPUT_DIR_PARTS,
  STEP_BUDGET_MS,
  buildBackendEnv,
  buildFrontendBuildArgs,
  buildFrontendEnv,
  buildLaunchFailureMessage,
  askQuestion,
  buildPreviewArgs,
  checkCameraAvailable,
  runStep,
  runWithBudget,
  classifyRequest,
  computeOutputDir,
  evaluateScannerStep,
  filterConsoleMessages,
  pickFreePorts,
  screenshotPath,
  withinStepBudget
} from "./smoke-browser.mjs";

const ORIGINS = ["http://127.0.0.1:4001", "http://127.0.0.1:4002"];

test("computeOutputDir is one absolute folder under the repo's .tmp", () => {
  const dir = computeOutputDir("/repo");
  assert.equal(dir, path.resolve("/repo", ".tmp", "browser-smoke"));
  assert.ok(path.isAbsolute(dir));
  assert.deepEqual(OUTPUT_DIR_PARTS, [".tmp", "browser-smoke"]);
});

test("computeOutputDir resolves a relative root to an absolute path", () => {
  assert.ok(path.isAbsolute(computeOutputDir(".")));
});

test("the same absolute outDir feeds the build, the preview and the screenshots", () => {
  const outDir = computeOutputDir("/repo");
  const build = buildFrontendBuildArgs(outDir);
  const preview = buildPreviewArgs({ outDir, port: 4002 });
  assert.equal(build[build.indexOf("--outDir") + 1], outDir);
  assert.equal(preview[preview.indexOf("--outDir") + 1], outDir);
  assert.ok(build.includes("--emptyOutDir"));
  assert.ok(screenshotPath(outDir, "phone", "ask").startsWith(outDir + path.sep));
});

test("no output path points into apps/frontend/dist", () => {
  const outDir = computeOutputDir("/repo");
  const all = [...buildFrontendBuildArgs(outDir), ...buildPreviewArgs({ outDir, port: 1 }), screenshotPath(outDir, "a", "b")];
  for (const value of all) assert.ok(!String(value).includes(path.join("apps", "frontend", "dist")));
});

test("preview binds 127.0.0.1 on the picked port and refuses to move", () => {
  const args = buildPreviewArgs({ outDir: "/o", port: 4321 });
  assert.ok(args.includes("--strictPort"));
  assert.equal(args[args.indexOf("--port") + 1], "4321");
  assert.equal(args[args.indexOf("--host") + 1], "127.0.0.1");
});

test("frontend env points at the local backend and drops mock and feedback variables", () => {
  const env = buildFrontendEnv(
    {
      PATH: "/bin",
      ASK_AI_PROVIDER: "openai",
      VITE_ASK_AI_PROVIDER: "mock",
      VITE_FEEDBACK_FORMSPREE_ID: "abc",
      VITE_DEBUG_LOGGING: "true"
    },
    4001
  );
  assert.equal(env.VITE_API_URL, "http://127.0.0.1:4001");
  assert.equal(env.VITE_DEBUG_LOGGING, "false");
  assert.equal(env.PATH, "/bin");
  for (const key of ["ASK_AI_PROVIDER", "VITE_ASK_AI_PROVIDER", "VITE_FEEDBACK_FORMSPREE_ID"]) {
    assert.ok(!(key in env), `${key} must be unset`);
  }
});

test("backend env sets one allowed origin and scrubs provider, key and NODE_ENV", () => {
  const env = buildBackendEnv(
    {
      PATH: "/bin",
      ASK_AI_PROVIDER: "openai",
      EMBEDDING_PROVIDER: "openai",
      OPENAI_API_KEY: "sk-secret",
      NODE_ENV: "production"
    },
    { port: 4001, frontendOrigin: "http://127.0.0.1:4002" }
  );
  assert.equal(env.PORT, "4001");
  assert.equal(env.FRONTEND_ORIGIN, "http://127.0.0.1:4002");
  assert.equal(env.PATH, "/bin");
  for (const key of ["ASK_AI_PROVIDER", "EMBEDDING_PROVIDER", "OPENAI_API_KEY", "NODE_ENV"]) {
    assert.ok(!(key in env), `${key} must be removed`);
  }
});

test("pickFreePorts returns distinct ports nothing is listening on", async () => {
  const [a, b] = await pickFreePorts(2);
  assert.notEqual(a, b);
  for (const port of [a, b]) {
    await new Promise((resolve, reject) => {
      const server = net.createServer();
      server.once("error", reject);
      server.listen(port, "127.0.0.1", () => server.close(resolve));
    });
  }
});

test("classifyRequest: local success is ok", () => {
  assert.deepEqual(classifyRequest({ url: "http://127.0.0.1:4001/api/health", status: 200 }, ORIGINS), { kind: "ok" });
  assert.deepEqual(classifyRequest({ url: "http://127.0.0.1:4002/", status: 304 }, ORIGINS), { kind: "ok" });
});

test("classifyRequest: a local 400+ or a local network failure fails", () => {
  assert.equal(classifyRequest({ url: "http://127.0.0.1:4001/api/ask-ai", status: 400 }, ORIGINS).kind, "fail");
  assert.equal(classifyRequest({ url: "http://127.0.0.1:4001/api/ask-ai", status: 500 }, ORIGINS).kind, "fail");
  assert.equal(classifyRequest({ url: "http://127.0.0.1:4002/x.js", failure: "net::ERR_FAILED" }, ORIGINS).kind, "fail");
});

test("classifyRequest: Chrome cancelling a media preload is not a failed request", () => {
  const aborted = { url: "http://127.0.0.1:4002/assets/scanSuccess.wav", failure: "net::ERR_ABORTED" };
  assert.deepEqual(classifyRequest({ ...aborted, resourceType: "media" }, ORIGINS), { kind: "ok" });
  // Any other abort, or any other failure of a media file, still fails.
  assert.equal(classifyRequest({ ...aborted, resourceType: "script" }, ORIGINS).kind, "fail");
  assert.equal(classifyRequest({ ...aborted }, ORIGINS).kind, "fail");
  assert.equal(
    classifyRequest({ ...aborted, failure: "net::ERR_CONNECTION_REFUSED", resourceType: "media" }, ORIGINS).kind,
    "fail"
  );
});

test("classifyRequest: card images are answered locally with a placeholder", () => {
  assert.equal(classifyRequest({ url: "https://cards.scryfall.io/normal/front/a/b.jpg" }, ORIGINS).kind, "placeholder");
});

test("classifyRequest: any other host fails, whatever its status", () => {
  const verdict = classifyRequest({ url: "https://example.com/track.js", status: 200 }, ORIGINS);
  assert.equal(verdict.kind, "fail");
  assert.match(verdict.reason, /example\.com/);
  assert.equal(classifyRequest({ url: "https://api.scryfall.com/cards", status: 200 }, ORIGINS).kind, "fail");
  assert.equal(classifyRequest({ url: "http://127.0.0.1:9999/", status: 200 }, ORIGINS).kind, "fail");
});

test("classifyRequest: data and blob URLs are not network requests", () => {
  assert.equal(classifyRequest({ url: "data:image/png;base64,AAAA" }, ORIGINS).kind, "ok");
  assert.equal(classifyRequest({ url: "blob:http://127.0.0.1:4002/1234" }, ORIGINS).kind, "ok");
});

test("filterConsoleMessages keeps only errors", () => {
  const kept = filterConsoleMessages([
    { type: "log", text: "hello" },
    { type: "warning", text: "careful" },
    { type: "info", text: "fyi" },
    { type: "error", text: "boom" }
  ]);
  assert.deepEqual(kept, [{ type: "error", text: "boom" }]);
});

test("withinStepBudget enforces 15 seconds", () => {
  assert.equal(STEP_BUDGET_MS, 15_000);
  assert.equal(withinStepBudget(14_999), true);
  assert.equal(withinStepBudget(15_000), true);
  assert.equal(withinStepBudget(15_001), false);
});

test("buildLaunchFailureMessage names Chrome and how to fix it", () => {
  const message = buildLaunchFailureMessage(new Error("Executable doesn't exist at /opt/google/chrome/chrome"));
  assert.match(message, /Google Chrome/);
  assert.match(message, /not installed|not launchable/);
  assert.match(message, /install/i);
  assert.match(message, /Executable doesn't exist/);
});

test("buildLaunchFailureMessage copes with a non-Error", () => {
  assert.match(buildLaunchFailureMessage("nope"), /nope/);
});

test("chrome args carry the fake camera flags", () => {
  assert.ok(CHROME_ARGS.includes("--use-fake-device-for-media-stream"));
  assert.ok(CHROME_ARGS.includes("--use-fake-ui-for-media-stream"));
});

test("scanner: the camera assertion is its own function", () => {
  assert.equal(CAMERA_UNAVAILABLE_TEXT, "Camera unavailable");
  assert.deepEqual(checkCameraAvailable({ cameraUnavailableShown: false }), { ok: true });
  assert.equal(checkCameraAvailable({ cameraUnavailableShown: true }).ok, false);
  assert.equal(typeof CHECK_CAMERA_AVAILABLE, "boolean");
});

test("scanner: the other checks do not depend on the camera assertion", () => {
  const files = ["/data/cardhashes.bin", "/data/cardScanMap.json"];
  const withCameraError = { panelOpen: true, loadedPaths: files, cameraUnavailableShown: true };
  // Camera assertion off: a camera error changes nothing, the rest still passes.
  assert.deepEqual(evaluateScannerStep(withCameraError, { checkCamera: false }), { ok: true, reasons: [] });
  // Camera assertion on: the same input fails on the camera alone.
  const on = evaluateScannerStep(withCameraError, { checkCamera: true });
  assert.equal(on.ok, false);
  assert.equal(on.reasons.length, 1);
  assert.match(on.reasons[0], /Camera unavailable/);
  // The panel and data checks fail with the camera assertion off.
  assert.equal(
    evaluateScannerStep({ panelOpen: false, loadedPaths: files, cameraUnavailableShown: false }, { checkCamera: false }).ok,
    false
  );
  const missing = evaluateScannerStep(
    { panelOpen: true, loadedPaths: ["/data/cardhashes.bin"], cameraUnavailableShown: false },
    { checkCamera: false }
  );
  assert.equal(missing.ok, false);
  assert.match(missing.reasons.join(" "), /cardScanMap\.json/);
});

// ------------------------------------------------- a failing step is reported, never fatal

function fakeBrowser({ clickError, responseRejectsAfterMs = 20 }) {
  const calls = { screenshots: [], contextClosed: 0 };
  const button = {
    click: async () => {
      throw new Error(clickError);
    }
  };
  const page = {
    on() {},
    getByRole: () => ({ fill: async () => {}, click: button.click }),
    waitForResponse: () =>
      new Promise((_, reject) => setTimeout(() => reject(new Error("page.waitForResponse: Timeout exceeded")), responseRejectsAfterMs)),
    screenshot: async ({ path: file }) => {
      calls.screenshots.push(file);
    }
  };
  const context = {
    setDefaultTimeout() {},
    route: async () => {},
    grantPermissions: async () => {},
    newPage: async () => page,
    close: async () => {
      calls.contextClosed += 1;
    }
  };
  return { browser: { newContext: async () => context }, calls };
}

async function collectUnhandled(work) {
  const seen = [];
  const listener = (reason) => seen.push(reason);
  process.on("unhandledRejection", listener);
  try {
    await work();
    await new Promise((resolve) => setTimeout(resolve, 150));
  } finally {
    process.off("unhandledRejection", listener);
  }
  return seen;
}

test("a step whose Ask click fails is reported with a screenshot, closes its page, and leaves no unhandled rejection", async () => {
  const { browser, calls } = fakeBrowser({ clickError: "locator.click: button is disabled" });
  const step = { id: "ask-a-question", title: "Ask", run: ({ page, base }) => askQuestion(page, base, "q") };
  let result;
  const unhandled = await collectUnhandled(async () => {
    result = await runStep({
      browser,
      step,
      viewport: { name: "phone", width: 390, height: 844 },
      origins: ORIGINS,
      base: ORIGINS[1],
      outDir: "/out"
    });
  });
  assert.deepEqual(unhandled, []);
  assert.match(result.problems[0], /button is disabled/);
  assert.deepEqual(calls.screenshots, [screenshotPath("/out", "phone", "ask-a-question")]);
  assert.equal(result.screenshot, screenshotPath("/out", "phone", "ask-a-question"));
  assert.equal(calls.contextClosed, 1);
});

test("a step that fails after its budget ran out leaves no unhandled rejection", async () => {
  const unhandled = await collectUnhandled(async () => {
    await assert.rejects(
      runWithBudget(
        () => new Promise((_, reject) => setTimeout(() => reject(new Error("late failure")), 80)),
        20
      ),
      /did not finish within 20 ms/
    );
  });
  assert.deepEqual(unhandled, []);
});

test("runWithBudget clears its timer when the work settles, so the process can exit at once", async () => {
  const script = `import { runWithBudget } from ${JSON.stringify(new URL("./smoke-browser.mjs", import.meta.url).href)};
await runWithBudget(async () => "done", 8000);`;
  const start = Date.now();
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ["--input-type=module", "-e", script], { stdio: "inherit" });
    child.once("error", reject);
    child.once("exit", (code) => (code === 0 ? resolve() : reject(new Error(`child exited ${code}`))));
  });
  assert.ok(Date.now() - start < 4000, `took ${Date.now() - start} ms`);
});
