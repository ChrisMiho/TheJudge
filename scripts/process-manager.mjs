import { spawn as nodeSpawn } from "node:child_process";

/**
 * Owned-process-tree management for locally launched services.
 *
 * The contract this implements lives in
 * `PRD/instructions/runtime-process-hygiene.md`: an agent (or the dev
 * launcher) owns exactly the process trees it started, stops them through
 * their own handles, waits for them to actually exit, and escalates only
 * against that same exact tree. Nothing here matches processes by name or
 * sweeps the host, and nothing here knows which services a given launcher
 * runs — callers supply those.
 */

export const DEFAULT_GRACE_PERIOD_MS = 10_000;

function isWindows(platform) {
  return platform === "win32";
}

export class ProcessManager {
  #entries = [];
  #gracePeriodMs;
  #spawnFn;
  #killFn;
  #platform;
  #logger;
  #shutdown = null;
  #escalated = false;
  #settled;
  #resolveSettled;

  constructor({
    gracePeriodMs = DEFAULT_GRACE_PERIOD_MS,
    spawnFn = nodeSpawn,
    kill = process.kill.bind(process),
    platform = process.platform,
    logger = (message) => console.log(message)
  } = {}) {
    this.#gracePeriodMs = gracePeriodMs;
    this.#spawnFn = spawnFn;
    this.#killFn = kill;
    this.#platform = platform;
    this.#logger = logger;
    this.#settled = new Promise((resolve) => {
      this.#resolveSettled = resolve;
    });
  }

  /** Resolves with the final exit code once every owned tree has stopped. */
  get settled() {
    return this.#settled;
  }

  /** True once any owned tree had to be force-killed past the grace period. */
  get escalated() {
    return this.#escalated;
  }

  get entries() {
    return [...this.#entries];
  }

  /**
   * Spawn one service directly — no shell, no string-concatenated command —
   * as its own process-group leader on POSIX so the exact tree can be
   * signaled later.
   */
  start({ name, command, args = [], env = process.env, cwd, stdio = "inherit" }) {
    const child = this.#spawnFn(command, args, {
      stdio,
      env,
      cwd,
      // A detached child leads its own process group, which is what makes
      // `kill(-pid)` target exactly this tree and nothing else.
      detached: !isWindows(this.#platform)
    });

    const entry = {
      name,
      child,
      exited: false,
      exitCode: null,
      exitSignal: null,
      signaled: false,
      forced: false
    };

    entry.exit = new Promise((resolve) => {
      child.once("exit", (code, signal) => {
        entry.exited = true;
        entry.exitCode = code;
        entry.exitSignal = signal;
        resolve({ code, signal });

        if (this.#shutdown) return;

        if (signal) {
          this.#logger(`[dev] ${name} exited from signal ${signal}`);
        } else {
          this.#logger(`[dev] ${name} exited with code ${code ?? 0}`);
        }
        void this.stop(code ?? 0);
      });
    });

    child.once("error", (error) => {
      this.#logger(`[dev] Failed to start ${name}: ${error.message}`);
      entry.exited = true;
      if (!this.#shutdown) void this.stop(1);
    });

    this.#entries.push(entry);
    return entry;
  }

  /**
   * Stop every owned tree and resolve with `exitCode`. Idempotent: concurrent
   * or repeated calls (a second SIGINT, a SIGTERM crossing a SIGINT) join the
   * first in-flight shutdown instead of re-signaling anything.
   */
  stop(exitCode = 0) {
    if (!this.#shutdown) {
      this.#shutdown = this.#runShutdown(exitCode);
    }
    return this.#shutdown;
  }

  async #runShutdown(exitCode) {
    const running = this.#entries.filter((entry) => !entry.exited);
    for (const entry of running) {
      this.#signalTree(entry, false);
    }

    const stoppedGracefully = await this.#waitForExits(running, this.#gracePeriodMs);

    if (!stoppedGracefully) {
      const stubborn = this.#entries.filter((entry) => !entry.exited);
      for (const entry of stubborn) {
        this.#escalated = true;
        this.#logger(`[dev] ${entry.name} ignored graceful shutdown; force-killing its tree`);
        this.#signalTree(entry, true);
      }
      await Promise.all(this.#entries.map((entry) => entry.exit));
    }

    this.#resolveSettled(exitCode);
    return exitCode;
  }

  /** Signal exactly the owned tree — never a name match, never a broad sweep. */
  #signalTree(entry, forced) {
    const { pid } = entry.child;
    if (entry.exited || pid == null) return;

    entry.signaled = true;
    if (forced) entry.forced = true;

    if (isWindows(this.#platform)) {
      // Windows has no POSIX process groups; taskkill /T covers the tree.
      const args = forced
        ? ["/pid", String(pid), "/T", "/F"]
        : ["/pid", String(pid), "/T"];
      this.#spawnFn("taskkill", args, { stdio: "ignore" });
      return;
    }

    try {
      this.#killFn(-pid, forced ? "SIGKILL" : "SIGTERM");
    } catch (error) {
      // ESRCH means the tree is already gone, which is the outcome we wanted.
      if (error.code !== "ESRCH") throw error;
    }
  }

  /** Resolve true when all entries exit before the timeout, false otherwise. */
  async #waitForExits(entries, timeoutMs) {
    if (entries.length === 0) return true;

    const allExited = Promise.all(entries.map((entry) => entry.exit)).then(() => true);
    let timer;
    const timedOut = new Promise((resolve) => {
      timer = setTimeout(() => resolve(false), timeoutMs);
    });

    try {
      return await Promise.race([allExited, timedOut]);
    } finally {
      clearTimeout(timer);
    }
  }
}
