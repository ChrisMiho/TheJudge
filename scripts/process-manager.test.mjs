import assert from "node:assert/strict";
import net from "node:net";
import { spawn } from "node:child_process";
import test from "node:test";

import { ProcessManager } from "./process-manager.mjs";

const NODE = process.execPath;
const silent = () => {};

// Long-running child that terminates on the default SIGTERM disposition. It
// announces itself on stdout so tests can stop a genuinely running process
// rather than racing its exec.
const LONG_RUNNING = [
  "-e",
  "process.stdout.write('ready\\n'); setInterval(() => {}, 1000);"
];
// Long-running child that deliberately ignores SIGTERM, forcing escalation.
const IGNORES_SIGTERM = [
  "-e",
  "process.on('SIGTERM', () => {}); process.stdout.write('ready\\n'); setInterval(() => {}, 1000);"
];
// stdio that keeps stdout readable for the readiness handshake.
const READY_STDIO = ["ignore", "pipe", "ignore"];

function whenReady(entry) {
  return new Promise((resolve, reject) => {
    entry.child.stdout.setEncoding("utf8");
    entry.child.stdout.on("data", (chunk) => {
      if (chunk.includes("ready")) resolve();
    });
    entry.child.once("exit", () => reject(new Error(`${entry.name} exited before becoming ready`)));
  });
}

function isAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

test("clean shutdown stops an owned tree within the grace period, without escalating", async () => {
  const manager = new ProcessManager({ gracePeriodMs: 5000, logger: silent });
  const entry = manager.start({
    name: "long-running",
    command: NODE,
    args: LONG_RUNNING,
    stdio: READY_STDIO
  });
  await whenReady(entry);

  const code = await manager.stop(0);

  assert.equal(code, 0);
  assert.equal(entry.exited, true);
  assert.equal(entry.exitSignal, "SIGTERM", "the graceful signal is what stopped it");
  assert.equal(manager.escalated, false, "graceful exit must not force-kill");
});

test("an owned process that fails on its own stops its siblings and propagates the code", async () => {
  const manager = new ProcessManager({ gracePeriodMs: 5000, logger: silent });
  const survivor = manager.start({
    name: "long-running",
    command: NODE,
    args: LONG_RUNNING,
    stdio: READY_STDIO
  });
  await whenReady(survivor);

  manager.start({
    name: "failing",
    command: NODE,
    args: ["-e", "process.exit(3);"],
    stdio: "ignore"
  });

  const code = await manager.settled;

  assert.equal(code, 3, "the failing child's exit code propagates");
  assert.equal(survivor.exited, true, "the sibling owned tree is stopped");
});

test("calling stop twice concurrently resolves once and signals each tree only once", async (t) => {
  if (process.platform === "win32") {
    t.skip("POSIX signal counting does not apply to the taskkill path");
    return;
  }

  const sent = [];
  const manager = new ProcessManager({
    gracePeriodMs: 5000,
    logger: silent,
    kill: (pid, signal) => {
      sent.push({ pid, signal });
      process.kill(pid, signal);
    }
  });
  const entry = manager.start({
    name: "long-running",
    command: NODE,
    args: LONG_RUNNING,
    stdio: READY_STDIO
  });
  await whenReady(entry);

  const [first, second] = await Promise.all([manager.stop(0), manager.stop(0)]);

  assert.equal(first, 0);
  assert.equal(second, 0);
  assert.equal(sent.length, 1, "the second stop must not re-signal the tree");
});

test("a tree that ignores the graceful signal is force-killed only after the grace period", async () => {
  const gracePeriodMs = 250;
  const manager = new ProcessManager({ gracePeriodMs, logger: silent });
  const entry = manager.start({
    name: "stubborn",
    command: NODE,
    args: IGNORES_SIGTERM,
    stdio: READY_STDIO
  });

  // Its readiness line is written after the SIGTERM handler is installed.
  await whenReady(entry);

  const startedAt = Date.now();
  await manager.stop(0);
  const elapsed = Date.now() - startedAt;

  assert.equal(manager.escalated, true, "escalation is required to stop it");
  assert.ok(
    elapsed >= gracePeriodMs,
    `escalated after ${elapsed}ms, expected at least ${gracePeriodMs}ms`
  );
  assert.equal(entry.exited, true, "stop resolves only once it actually exits");
});

test("only the owned tree is signaled; an unmanaged sibling process is left alone", async () => {
  const unmanaged = spawn(NODE, LONG_RUNNING, { stdio: READY_STDIO });
  await delay(200);
  assert.ok(isAlive(unmanaged.pid), "precondition: the unmanaged process runs");

  const manager = new ProcessManager({ gracePeriodMs: 5000, logger: silent });
  const owned = manager.start({
    name: "owned",
    command: NODE,
    args: LONG_RUNNING,
    stdio: READY_STDIO
  });
  await whenReady(owned);

  await manager.stop(0);

  assert.equal(owned.exited, true);
  assert.ok(isAlive(unmanaged.pid), "the unmanaged process must survive");

  unmanaged.kill("SIGKILL");
  await new Promise((resolve) => unmanaged.once("exit", resolve));
});

test("a strictPort-style service fails clearly instead of migrating off a taken port", async () => {
  const server = net.createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;

  const manager = new ProcessManager({ gracePeriodMs: 5000, logger: silent });
  const entry = manager.start({
    name: "strict-port",
    command: NODE,
    args: [
      "-e",
      "const net = require('node:net');" +
        "const s = net.createServer();" +
        "s.on('error', (error) => { console.error('listen failed: ' + error.code); process.exit(1); });" +
        "s.listen(Number(process.env.FRONTEND_PORT), '127.0.0.1', () => {});"
    ],
    env: { ...process.env, FRONTEND_PORT: String(port) },
    stdio: ["ignore", "ignore", "pipe"]
  });

  let stderr = "";
  entry.child.stderr.setEncoding("utf8");
  entry.child.stderr.on("data", (chunk) => {
    stderr += chunk;
  });

  const { code } = await entry.exit;

  assert.equal(code, 1, "the collision surfaces as a non-zero exit");
  assert.match(stderr, /EADDRINUSE/, "the failure names the port collision");

  await manager.stop(0);
  await new Promise((resolve) => server.close(resolve));
});

test("the assigned ports reach the spawned service through its explicit env", async () => {
  const manager = new ProcessManager({ gracePeriodMs: 5000, logger: silent });
  const entry = manager.start({
    name: "port-echo",
    command: NODE,
    args: ["-e", "process.stdout.write(process.env.PORT + ':' + process.env.FRONTEND_PORT);"],
    env: { ...process.env, PORT: "4000", FRONTEND_PORT: "4173" },
    stdio: ["ignore", "pipe", "ignore"]
  });

  let stdout = "";
  entry.child.stdout.setEncoding("utf8");
  entry.child.stdout.on("data", (chunk) => {
    stdout += chunk;
  });

  await entry.exit;

  assert.equal(stdout, "4000:4173");

  await manager.stop(0);
});
