// Built-backend boot check (NFR-020). Starts the compiled backend
// (`apps/backend/dist/index.js`, built by `npm --workspace apps/backend run
// build`) on a free port and requires the health check and a Sol Ring lookup to
// answer. Run through `npm run smoke:built-server`.
//
// The card lookup is required because a missing data file does not stop the
// server: health stays 200 while every card answers 404.

import { spawn } from "node:child_process";
import net from "node:net";
import { fileURLToPath, pathToFileURL } from "node:url";

export const READY_DEADLINE_MS = 30_000;
export const REQUEST_TIMEOUT_MS = 5_000;
export const POLL_INTERVAL_MS = 250;
export const STOP_GRACE_MS = 5_000;
export const SOL_RING_ORACLE_ID = "6ad8011d-3471-4369-9d68-b264cc027487";

const HOST = "127.0.0.1";
// Removed so both providers fall back to the checkout default `mock` and no
// dev-only dotenv loading or paid key can reach the server.
const SCRUBBED_ENV = ["ASK_AI_PROVIDER", "EMBEDDING_PROVIDER", "OPENAI_API_KEY", "NODE_ENV"];

const ENTRY = fileURLToPath(new URL("../apps/backend/dist/index.js", import.meta.url));
const REPO_ROOT = fileURLToPath(new URL("../", import.meta.url));

export function buildChildEnv(env, port) {
  const child = { ...env };
  for (const key of SCRUBBED_ENV) delete child[key];
  child.PORT = String(port);
  return child;
}

export function pickFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, HOST, () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

export function isPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.listen(port, HOST, () => server.close(() => resolve(true)));
  });
}

export async function fetchJson(url, fetchImpl = fetch) {
  const res = await fetchImpl(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  const body = await res.json().catch(() => null);
  return { status: res.status, body };
}

export function evaluateHealth({ status, body }) {
  if (status !== 200) return { ok: false, reason: `health answered ${status}, expected 200` };
  if (body?.ok !== true) return { ok: false, reason: "health body was not {\"ok\":true}" };
  return { ok: true };
}

const nonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;

export function evaluateCard({ status, body }) {
  if (status !== 200) return { ok: false, reason: `Sol Ring card lookup answered ${status}, expected 200` };
  if (!nonEmptyString(body?.oracleText)) return { ok: false, reason: "card has no oracleText" };
  if (!nonEmptyString(body?.typeLine)) return { ok: false, reason: "card has no typeLine" };
  return { ok: true };
}

export async function waitUntilReady({
  getHealth,
  childExited,
  now = Date.now,
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  deadlineMs = READY_DEADLINE_MS,
  pollMs = POLL_INTERVAL_MS
}) {
  const start = now();
  let lastReason;
  for (;;) {
    if (childExited()) return { ok: false, reason: "server exited before it was ready" };
    try {
      const verdict = evaluateHealth(await getHealth());
      if (verdict.ok) return { ok: true, bootMs: now() - start };
      lastReason = verdict.reason;
    } catch (error) {
      lastReason = `health request failed: ${error?.message ?? error}`;
    }
    if (now() - start >= deadlineMs) {
      return { ok: false, reason: `ready deadline of ${deadlineMs} ms passed (${lastReason})` };
    }
    await sleep(pollMs);
  }
}

export function spawnBuiltServer({ env }) {
  const child = spawn(process.execPath, [ENTRY], {
    cwd: REPO_ROOT,
    env,
    stdio: ["ignore", "pipe", "pipe"]
  });
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

export async function runSmoke({
  env = process.env,
  pickPort = pickFreePort,
  spawnChild = spawnBuiltServer,
  fetchJson: getJson = fetchJson,
  isPortFree: portFree = isPortFree,
  now = Date.now,
  sleep,
  log = console.log
} = {}) {
  const port = await pickPort();
  const base = `http://${HOST}:${port}`;
  const child = spawnChild({ port, env: buildChildEnv(env, port) });
  const result = { ok: false, port, reasons: [], healthStatus: null, cardStatus: null, bootMs: null, output: "" };
  try {
    const ready = await waitUntilReady({
      getHealth: async () => {
        const res = await getJson(`${base}/api/health`);
        result.healthStatus = res.status;
        return res;
      },
      childExited: () => child.hasExited(),
      now,
      sleep
    });
    if (!ready.ok) {
      result.reasons.push(ready.reason);
    } else {
      result.bootMs = ready.bootMs;
      const card = await getJson(`${base}/api/cards/${SOL_RING_ORACLE_ID}`);
      result.cardStatus = card.status;
      const verdict = evaluateCard(card);
      if (!verdict.ok) result.reasons.push(verdict.reason);
    }
  } catch (error) {
    result.reasons.push(`smoke check threw: ${error?.message ?? error}`);
  } finally {
    result.output = child.output();
    await child.stop();
  }
  if (!(await portFree(port))) result.reasons.push(`port ${port} is still in use after the server was stopped`);
  result.ok = result.reasons.length === 0;
  if (result.ok) {
    log(`built server ready in ${result.bootMs} ms on port ${port}`);
    log(`GET /api/health -> ${result.healthStatus}`);
    log(`GET /api/cards/${SOL_RING_ORACLE_ID} -> ${result.cardStatus}`);
    log(`port ${port} released`);
  } else {
    for (const reason of result.reasons) log(`FAIL: ${reason}`);
    log(`--- server output ---\n${result.output}\n--- end server output ---`);
  }
  return result;
}

async function main() {
  const result = await runSmoke();
  process.exitCode = result.ok ? 0 : 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
