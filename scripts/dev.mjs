import { ProcessManager } from "./process-manager.mjs";

const npmExecutable = process.platform === "win32" ? "npm.cmd" : "npm";

// Explicit ports, defaulting to the historical values. thejudge-implement-fanout
// assigns unique pairs per dispatched package, so both must be overridable.
const backendPort = process.env.PORT ?? "3000";
const frontendPort = process.env.FRONTEND_PORT ?? "5173";
const frontendOrigin = process.env.FRONTEND_ORIGIN ?? `http://localhost:${frontendPort}`;
const apiUrl = process.env.VITE_API_URL ?? `http://localhost:${backendPort}`;

const manager = new ProcessManager();

manager.start({
  name: "backend",
  command: npmExecutable,
  args: ["run", "dev", "--workspace", "apps/backend"],
  env: { ...process.env, PORT: backendPort, FRONTEND_ORIGIN: frontendOrigin }
});

manager.start({
  name: "frontend",
  command: npmExecutable,
  args: ["run", "dev", "--workspace", "apps/frontend"],
  env: { ...process.env, FRONTEND_PORT: frontendPort, VITE_API_URL: apiUrl }
});

// Both handlers join the same in-flight shutdown, so a second Ctrl-C (or a
// SIGTERM crossing a SIGINT) neither re-signals the trees nor throws.
process.on("SIGINT", () => {
  void manager.stop(0);
});
process.on("SIGTERM", () => {
  void manager.stop(0);
});

// Exit only once every owned tree has actually exited — no blind timeout.
const exitCode = await manager.settled;
process.exit(exitCode);
