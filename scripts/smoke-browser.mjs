// Browser smoke check (NFR-021). Builds the frontend and the backend the way the
// deploy does, serves the built site with `vite preview`, starts the built
// backend with the free mock AI, opens the site in headless Google Chrome through
// the `playwright` library, and makes each tool do its most basic action at a
// phone and a desktop width. Run through `npm run smoke:browser`.
//
// This script is deliberately independent of `scripts/smoke-built-server.mjs`
// (NFR-020): it imports nothing from it, so the small helpers below are
// duplicated on purpose.

/* global document -- used only inside `page.evaluate`, which runs in the browser */

import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

export const HOST = "127.0.0.1";
export const STEP_BUDGET_MS = 15_000;
export const READY_DEADLINE_MS = 30_000;
export const POLL_INTERVAL_MS = 250;
export const STOP_GRACE_MS = 5_000;
export const OUTPUT_DIR_PARTS = [".tmp", "browser-smoke"];
export const IMAGE_HOST = "cards.scryfall.io";
export const CAMERA_UNAVAILABLE_TEXT = "Camera unavailable";
export const SCAN_DATA_FILES = ["/data/cardhashes.bin", "/data/cardScanMap.json"];
export const VIEWPORTS = [
  { name: "phone", width: 390, height: 844 },
  { name: "desktop", width: 1280, height: 800 }
];

// The one switch for the fake-camera assertion. If the runner's Chrome cannot
// start the fake camera, set this to false (or delete `checkCameraAvailable` and
// its use in `evaluateScannerStep`): the panel-opens and data-files-load checks
// stay as they are.
export const CHECK_CAMERA_AVAILABLE = true;

export const CHROME_ARGS = [
  "--use-fake-device-for-media-stream",
  "--use-fake-ui-for-media-stream"
];

// Removed so both providers fall back to `mock` and no key or dev-only dotenv
// loading can reach the server.
const BACKEND_SCRUBBED_ENV = ["ASK_AI_PROVIDER", "EMBEDDING_PROVIDER", "OPENAI_API_KEY", "NODE_ENV"];
// Removed so the bundle carries no mock banner (REQ-063) and no feedback delivery.
const FRONTEND_SCRUBBED_ENV = ["ASK_AI_PROVIDER", "VITE_ASK_AI_PROVIDER", "VITE_FEEDBACK_FORMSPREE_ID"];

const REPO_ROOT = fileURLToPath(new URL("../", import.meta.url));

// A 1x1 transparent PNG, answered for every card image.
const PLACEHOLDER_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64"
);

// ---------------------------------------------------------------- pure rules

/** One absolute folder for the build, the preview, screenshots and the CI artifact. */
export function computeOutputDir(repoRoot) {
  return path.resolve(repoRoot, ...OUTPUT_DIR_PARTS);
}

export function screenshotPath(outDir, viewportName, stepId) {
  return path.join(outDir, `failure-${viewportName}-${stepId}.png`);
}

export function buildFrontendBuildArgs(outDir) {
  return ["--workspace", "apps/frontend", "run", "build", "--", "--outDir", outDir, "--emptyOutDir"];
}

export function buildPreviewArgs({ outDir, port }) {
  return [
    "preview",
    "--outDir",
    outDir,
    "--port",
    String(port),
    "--strictPort",
    "--host",
    HOST
  ];
}

export function buildFrontendEnv(env, backendPort) {
  const child = { ...env };
  for (const key of FRONTEND_SCRUBBED_ENV) delete child[key];
  child.VITE_API_URL = `http://${HOST}:${backendPort}`;
  child.VITE_DEBUG_LOGGING = "false";
  return child;
}

export function buildBackendEnv(env, { port, frontendOrigin }) {
  const child = { ...env };
  for (const key of BACKEND_SCRUBBED_ENV) delete child[key];
  child.PORT = String(port);
  child.FRONTEND_ORIGIN = frontendOrigin;
  return child;
}

function bindOnce() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, HOST, () => resolve(server));
  });
}

/** Binds n sockets at once (so the ports differ), reads the ports, releases them. */
export async function pickFreePorts(count) {
  const servers = [];
  try {
    for (let i = 0; i < count; i += 1) servers.push(await bindOnce());
    return servers.map((server) => server.address().port);
  } finally {
    await Promise.all(servers.map((server) => new Promise((resolve) => server.close(resolve))));
  }
}

export function isPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.listen(port, HOST, () => server.close(() => resolve(true)));
  });
}

/**
 * Judges one request. `origins` are the two local servers. Card images are
 * answered locally; any other host fails; a local request fails when it did not
 * complete or answered 400 or above.
 */
export function classifyRequest({ url, status, failure, resourceType }, origins) {
  if (url.startsWith("data:") || url.startsWith("blob:")) return { kind: "ok" };
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return { kind: "fail", reason: `unparseable request URL ${url}` };
  }
  if (parsed.hostname === IMAGE_HOST) return { kind: "placeholder" };
  if (!origins.includes(parsed.origin)) {
    return { kind: "fail", reason: `request to outside host ${parsed.host}: ${url}` };
  }
  // Chrome cancels a media element's preload (the scanner's sound) when the element is
  // reused or dropped; that is the browser's choice, not a failed request.
  if (failure === "net::ERR_ABORTED" && resourceType === "media") return { kind: "ok" };
  if (failure) return { kind: "fail", reason: `${url} failed: ${failure}` };
  if (typeof status === "number" && status >= 400) {
    return { kind: "fail", reason: `${url} answered ${status}` };
  }
  return { kind: "ok" };
}

export function filterConsoleMessages(messages) {
  return messages.filter((message) => message.type === "error");
}

export function withinStepBudget(elapsedMs) {
  return elapsedMs <= STEP_BUDGET_MS;
}

export function buildLaunchFailureMessage(error) {
  const cause = error instanceof Error ? error.message.split("\n")[0] : String(error);
  return [
    "Browser smoke check cannot start: Google Chrome is not installed or not launchable.",
    `Cause: ${cause}`,
    "Fix: install Google Chrome (https://www.google.com/chrome/) so Playwright's `chrome` channel finds it.",
    "On Linux CI the runner image already includes it. No browser is downloaded by this check."
  ].join("\n");
}

/** The droppable fake-camera assertion. Delete it and its call to drop it. */
export function checkCameraAvailable({ cameraUnavailableShown }) {
  return cameraUnavailableShown
    ? { ok: false, reason: `scanner showed "${CAMERA_UNAVAILABLE_TEXT}" with the fake camera` }
    : { ok: true };
}

/** Panel opens and both data files load; the camera assertion is added only when asked. */
export function evaluateScannerStep(
  { panelOpen, loadedPaths, cameraUnavailableShown },
  { checkCamera = CHECK_CAMERA_AVAILABLE } = {}
) {
  const reasons = [];
  if (!panelOpen) reasons.push("scanner panel did not open");
  for (const file of SCAN_DATA_FILES) {
    if (!loadedPaths.includes(file)) reasons.push(`scanner did not load ${file}`);
  }
  if (checkCamera) {
    const camera = checkCameraAvailable({ cameraUnavailableShown });
    if (!camera.ok) reasons.push(camera.reason);
  }
  return { ok: reasons.length === 0, reasons };
}

// ------------------------------------------------------------------ processes

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function spawnOwned(command, args, { cwd, env }) {
  const child = spawn(command, args, { cwd, env, stdio: ["ignore", "pipe", "pipe"] });
  let output = "";
  let exited = false;
  const collect = (chunk) => {
    output += chunk.toString();
  };
  child.stdout.on("data", collect);
  child.stderr.on("data", collect);
  const exitPromise = new Promise((resolve) => {
    child.once("exit", () => {
      exited = true;
      resolve();
    });
    child.once("error", (error) => {
      output += `\nspawn error: ${error.message}`;
      exited = true;
      resolve();
    });
  });
  return {
    exitPromise,
    hasExited: () => exited,
    output: () => output,
    async stop() {
      if (exited) return;
      child.kill("SIGTERM");
      const timer = new Promise((resolve) => setTimeout(resolve, STOP_GRACE_MS).unref());
      await Promise.race([exitPromise, timer]);
      if (!exited) {
        child.kill("SIGKILL");
        await exitPromise;
      }
    }
  };
}

function runBuild(command, args, { cwd, env, label }) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd, env, stdio: ["ignore", "pipe", "pipe"] });
    let output = "";
    const collect = (chunk) => {
      output += chunk.toString();
    };
    child.stdout.on("data", collect);
    child.stderr.on("data", collect);
    child.once("error", (error) => resolve({ ok: false, label, output: `${output}\nspawn error: ${error.message}` }));
    child.once("exit", (code) => resolve({ ok: code === 0, label, output }));
  });
}

async function waitForHttp(url, child, deadlineMs = READY_DEADLINE_MS) {
  const start = Date.now();
  let last;
  for (;;) {
    if (child.hasExited()) return { ok: false, reason: `server for ${url} exited before it was ready` };
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(5_000) });
      if (res.status === 200) return { ok: true };
      last = `answered ${res.status}`;
    } catch (error) {
      last = error?.message ?? String(error);
    }
    if (Date.now() - start >= deadlineMs) return { ok: false, reason: `${url} not ready after ${deadlineMs} ms (${last ?? "no answer yet"})` };
    await sleep(POLL_INTERVAL_MS);
  }
}

// ------------------------------------------------------------------ the steps

/** Records everything a step must pass: console errors, page errors, requests. */
function watchPage(context, page, origins) {
  const state = { consoleErrors: [], pageErrors: [], requestProblems: [], loaded: [], consoleAll: [] };
  page.on("console", (message) => {
    const entry = { type: message.type(), text: message.text() };
    state.consoleAll.push(entry);
    if (entry.type === "error") state.consoleErrors.push(entry);
  });
  page.on("pageerror", (error) => state.pageErrors.push(error?.message ?? String(error)));
  page.on("response", (response) => {
    const url = response.url();
    const verdict = classifyRequest({ url, status: response.status() }, origins);
    if (verdict.kind === "fail") state.requestProblems.push(verdict.reason);
    try {
      const { pathname, origin } = new URL(url);
      if (origins.includes(origin) && response.status() < 400) state.loaded.push(pathname);
    } catch {
      // Not a URL we track.
    }
  });
  page.on("requestfailed", (request) => {
    const verdict = classifyRequest(
      {
        url: request.url(),
        failure: request.failure()?.errorText ?? "failed",
        resourceType: request.resourceType()
      },
      origins
    );
    if (verdict.kind === "fail") state.requestProblems.push(verdict.reason);
  });
  return state;
}

async function installRoutes(context, origins, state) {
  await context.route("**/*", async (route) => {
    const url = route.request().url();
    const verdict = classifyRequest({ url }, origins);
    if (verdict.kind === "placeholder") {
      await route.fulfill({ status: 200, contentType: "image/png", body: PLACEHOLDER_PNG });
    } else if (verdict.kind === "fail") {
      state.requestProblems.push(verdict.reason);
      await route.abort("blockedbyclient");
    } else {
      await route.continue();
    }
  });
}

/**
 * Clicks a button and waits for the ask-ai POST it triggers. The response wait is
 * started before the click, so it is given a handler at once: if the click throws,
 * the wait can later reject with nobody listening and kill the whole script.
 */
export async function clickAndAwaitAskAi(page, button) {
  const answered = page.waitForResponse(
    (res) => res.url().endsWith("/api/ask-ai") && res.request().method() === "POST"
  );
  answered.catch(() => {});
  await button.click();
  const res = await answered;
  if (res.status() !== 200) throw new Error(`POST /api/ask-ai answered ${res.status()}`);
}

/**
 * Runs `work` against a time budget. The timer is cleared as soon as the work
 * settles (so a passing run does not hold the process open), and the work's own
 * promise always has a handler (so a step that fails after the budget ran out
 * cannot become an unhandled rejection).
 */
export async function runWithBudget(work, budgetMs = STEP_BUDGET_MS) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`step did not finish within ${budgetMs} ms`)), budgetMs);
  });
  const running = Promise.resolve().then(work);
  running.catch(() => {});
  try {
    return await Promise.race([running, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

export async function askQuestion(page, base, text) {
  const box = page.getByRole("textbox", { name: "Magic question" });
  await box.fill(text);
  await clickAndAwaitAskAi(page, page.getByRole("button", { name: "Ask TheJudge" }));
}

async function expectAnswerShown(page) {
  // Presence only, never wording: a non-empty answer block in the conversation.
  const answer = page.locator('[role="log"] .msg.judge .conversation-markdown').filter({ hasText: /\S{3,}/ });
  await answer.last().waitFor({ state: "visible" });
}

const STEPS = [
  {
    id: "ask-a-question",
    title: "Ask a Question: send a question, see an answer",
    async run({ page, base }) {
      await page.goto(`${base}/`);
      await askQuestion(page, base, "Does Sol Ring have summoning sickness?");
      await expectAnswerShown(page);
    }
  },
  {
    id: "life-tracker",
    title: "Life Tracker: reach it from the Menu, tap minus on Player 1, see 39",
    async run({ page, base }) {
      await page.goto(`${base}/`);
      await page.getByRole("button", { name: "Switch feature" }).click();
      await page.getByRole("menuitem", { name: "Life Tracker" }).click();
      await page.waitForURL(/\/life-tracker/);
      // The "−" sits at the card's near edge; the card's centre holds other controls, so tap the edge like a player.
      const minus = page.getByRole("button", { name: "Decrease life for Player 1" });
      await minus.waitFor({ state: "visible" });
      const box = await minus.boundingBox();
      await minus.click({ position: { x: 14, y: Math.max(1, Math.round((box?.height ?? 40) / 2)) } });
      await page.getByLabel("Player 1, 39 life", { exact: true }).waitFor({ state: "visible" });
    }
  },
  {
    id: "trade-balancer",
    title: "Trade Balancer: add Sol Ring to Side A, pick a printing, see a total",
    async run({ page, base }) {
      await page.goto(`${base}/trade-balancer`);
      await tradeAddSolRing(page);
    }
  },
  {
    id: "in-depth",
    title: "In-Depth Question: walk the four steps with Sol Ring, Decrypt Stack, see an answer",
    async run({ page, base }) {
      await page.goto(`${base}/in-depth`);
      await inDepthWalk(page);
    }
  },
  {
    id: "scanner",
    title: "Scanner: open it, see its card data load",
    async run({ page, base, state }) {
      await page.goto(`${base}/`);
      await page.getByRole("button", { name: "Scan a card" }).first().click();
      await scannerObserve(page, state);
    }
  },
  {
    id: "feedback",
    title: "Send feedback: open the form (nothing is sent)",
    async run({ page, base }) {
      await page.goto(`${base}/`);
      await page.getByRole("button", { name: "Switch feature" }).click();
      await page.getByRole("menuitem", { name: "Send feedback" }).click();
      await page.getByRole("heading", { name: "Send feedback" }).waitFor({ state: "visible" });
    }
  }
];

async function tradeAddSolRing(page) {
  await page.getByRole("button", { name: "Add card", exact: true }).first().click();
  await page.getByRole("textbox", { name: "Side A card search" }).fill("Sol Ring");
  await page.getByRole("button", { name: "Sol Ring", exact: true }).first().click();
  await page.getByRole("button", { name: /nonfoil$/ }).first().click();
  // A total above $0.00, never an exact price.
  const total = page.getByLabel("Side A total", { exact: true });
  await total.waitFor({ state: "visible" });
  for (;;) {
    const amount = Number.parseFloat(((await total.innerText()) || "").replace(/[^0-9.]/g, ""));
    if (amount > 0) return;
    await sleep(100);
  }
}

async function inDepthWalk(page) {
  await page.getByRole("button", { name: "Confirm game context" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Add a card to Battlefield" }).click();
  await page.getByPlaceholder("Search for a card to add").fill("Sol Ring");
  await page.getByRole("button", { name: "Sol Ring" }).first().click();
  await page.getByRole("button", { name: "Add card" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "OK — finish context" }).click();
  await clickAndAwaitAskAi(page, page.getByRole("button", { name: "Decrypt Stack" }));
  await expectAnswerShown(page);
}

async function scannerObserve(page, state) {
  const exit = page.getByRole("button", { name: "Exit scan" });
  const panelOpen = await exit.waitFor({ state: "visible" }).then(
    () => true,
    () => false
  );
  const deadline = Date.now() + STEP_BUDGET_MS - 5_000;
  while (Date.now() < deadline && !SCAN_DATA_FILES.every((file) => state.loaded.includes(file))) {
    await sleep(100);
  }
  // Let the fake camera either deliver a frame or fail; stop at the first sign.
  const settle = Date.now() + 3_000;
  while (Date.now() < settle) {
    const ready = await page.evaluate(() => {
      const video = document.querySelector("video");
      return Boolean(video && video.readyState >= 2);
    });
    if (ready || (await page.getByText(CAMERA_UNAVAILABLE_TEXT).count()) > 0) break;
    await sleep(100);
  }
  const cameraUnavailableShown = (await page.getByText(CAMERA_UNAVAILABLE_TEXT).count()) > 0;
  const verdict = evaluateScannerStep(
    { panelOpen, loadedPaths: state.loaded, cameraUnavailableShown },
    { checkCamera: CHECK_CAMERA_AVAILABLE }
  );
  if (!verdict.ok) throw new Error(verdict.reasons.join("; "));
}

export async function runStep({ browser, step, viewport, origins, base, outDir }) {
  const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
  context.setDefaultTimeout(STEP_BUDGET_MS);
  const page = await context.newPage();
  const state = watchPage(context, page, origins);
  await installRoutes(context, origins, state);
  await context.grantPermissions(["camera"], { origin: origins[1] }).catch(() => {});
  const start = Date.now();
  const problems = [];
  try {
    await runWithBudget(() => step.run({ page, base, state }));
    // Give late console output and requests a moment to arrive before judging.
    await sleep(300);
  } catch (error) {
    problems.push(error?.message?.split("\n")[0] ?? String(error));
  }
  const elapsed = Date.now() - start;
  if (!withinStepBudget(elapsed)) problems.push(`step took ${elapsed} ms, over ${STEP_BUDGET_MS} ms`);
  for (const message of filterConsoleMessages(state.consoleAll)) problems.push(`console error: ${message.text}`);
  for (const error of state.pageErrors) problems.push(`page error: ${error}`);
  for (const reason of new Set(state.requestProblems)) problems.push(`request: ${reason}`);
  let screenshot = null;
  if (problems.length > 0) {
    screenshot = screenshotPath(outDir, viewport.name, step.id);
    await page.screenshot({ path: screenshot }).catch(() => {
      screenshot = null;
    });
  }
  await context.close().catch(() => {});
  return { step, viewport, elapsed, problems, screenshot, console: state.consoleAll };
}

// ---------------------------------------------------------------------- main

export async function runSmoke({ log = console.log } = {}) {
  const outDir = computeOutputDir(REPO_ROOT);
  mkdirSync(outDir, { recursive: true });
  const [backendPort, frontendPort] = await pickFreePorts(2);
  const backendOrigin = `http://${HOST}:${backendPort}`;
  const frontendOrigin = `http://${HOST}:${frontendPort}`;
  const origins = [backendOrigin, frontendOrigin];
  const owned = { backend: null, preview: null };
  let browser = null;
  const failures = [];
  const results = [];
  const npm = process.platform === "win32" ? "npm.cmd" : "npm";
  log(`output folder: ${outDir}`);
  log(`backend ${backendOrigin}  frontend ${frontendOrigin}`);
  try {
    const frontendBuild = await runBuild(npm, buildFrontendBuildArgs(outDir), {
      cwd: REPO_ROOT,
      env: buildFrontendEnv(process.env, backendPort),
      label: "frontend build"
    });
    if (!frontendBuild.ok) {
      failures.push(`frontend build failed\n${frontendBuild.output}`);
      return { ok: false, failures, results, outDir, ports: [backendPort, frontendPort] };
    }
    const backendBuild = await runBuild(npm, ["--workspace", "apps/backend", "run", "build"], {
      cwd: REPO_ROOT,
      env: process.env,
      label: "backend build"
    });
    if (!backendBuild.ok) {
      failures.push(`backend build failed\n${backendBuild.output}`);
      return { ok: false, failures, results, outDir, ports: [backendPort, frontendPort] };
    }

    owned.backend = spawnOwned(process.execPath, [path.join(REPO_ROOT, "apps/backend/dist/index.js")], {
      cwd: REPO_ROOT,
      env: buildBackendEnv(process.env, { port: backendPort, frontendOrigin })
    });
    const require = createRequire(path.join(REPO_ROOT, "apps/frontend/package.json"));
    const viteBin = path.join(path.dirname(require.resolve("vite/package.json")), "bin", "vite.js");
    owned.preview = spawnOwned(process.execPath, [viteBin, ...buildPreviewArgs({ outDir, port: frontendPort })], {
      cwd: path.join(REPO_ROOT, "apps/frontend"),
      env: { ...process.env }
    });
    const backendReady = await waitForHttp(`${backendOrigin}/api/health`, owned.backend);
    if (!backendReady.ok) {
      failures.push(`backend: ${backendReady.reason}`);
      return { ok: false, failures, results, outDir, ports: [backendPort, frontendPort] };
    }
    const previewReady = await waitForHttp(`${frontendOrigin}/`, owned.preview);
    if (!previewReady.ok) {
      failures.push(`preview: ${previewReady.reason}`);
      return { ok: false, failures, results, outDir, ports: [backendPort, frontendPort] };
    }

    let chromium;
    try {
      ({ chromium } = await import("playwright"));
      browser = await chromium.launch({ channel: "chrome", headless: true, args: CHROME_ARGS });
    } catch (error) {
      failures.push(buildLaunchFailureMessage(error));
      return { ok: false, failures, results, outDir, ports: [backendPort, frontendPort], launchFailed: true };
    }
    log(`Chrome ${browser.version()}`);

    for (const viewport of VIEWPORTS) {
      for (const step of STEPS) {
        const result = await runStep({ browser, step, viewport, origins, base: frontendOrigin, outDir });
        results.push(result);
        const label = `${viewport.name} ${viewport.width}x${viewport.height}  ${step.id}`;
        if (result.problems.length === 0) {
          log(`PASS ${label} (${result.elapsed} ms)`);
        } else {
          log(`FAIL ${label} (${result.elapsed} ms): ${step.title}`);
          for (const problem of result.problems) log(`  - ${problem}`);
          if (result.console.length > 0) {
            log("  console:");
            for (const message of result.console) log(`    [${message.type}] ${message.text}`);
          }
          if (result.screenshot) log(`  screenshot: ${result.screenshot}`);
          failures.push(`${label}: ${result.problems[0]}`);
        }
      }
    }
  } catch (error) {
    failures.push(`smoke check threw: ${error?.stack ?? error}`);
  } finally {
    if (browser) await browser.close().catch(() => {});
    if (owned.preview) await owned.preview.stop();
    if (owned.backend) await owned.backend.stop();
    const stuck = [];
    for (const port of [backendPort, frontendPort]) {
      if (!(await isPortFree(port))) stuck.push(port);
    }
    if (stuck.length > 0) failures.push(`port(s) still in use after stop: ${stuck.join(", ")}`);
    else log(`ports ${backendPort} and ${frontendPort} released`);
    if (failures.length > 0) {
      if (owned.backend) log(`--- backend output ---\n${owned.backend.output()}\n--- end backend output ---`);
      if (owned.preview) log(`--- preview output ---\n${owned.preview.output()}\n--- end preview output ---`);
    }
  }
  return { ok: failures.length === 0, failures, results, outDir, ports: [backendPort, frontendPort] };
}

async function main() {
  const start = Date.now();
  const result = await runSmoke();
  if (result.launchFailed) console.error(result.failures[0]);
  else if (!result.ok) console.error(`browser smoke FAILED:\n${result.failures.map((f) => `  ${f}`).join("\n")}`);
  else console.log(`browser smoke passed: ${result.results.length} step runs in ${Date.now() - start} ms`);
  process.exitCode = result.ok ? 0 : 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
