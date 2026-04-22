import { spawn } from "node:child_process";

const npmExecutable = process.platform === "win32" ? "npm.cmd" : "npm";
const services = [
  { name: "backend", args: ["run", "dev", "--workspace", "apps/backend"] },
  { name: "frontend", args: ["run", "dev", "--workspace", "apps/frontend"] }
];

const children = [];
let isShuttingDown = false;

function startService(service) {
  const child = spawn(`${npmExecutable} ${service.args.join(" ")}`, {
    shell: true,
    stdio: "inherit",
    env: process.env
  });

  children.push({ ...service, process: child });

  child.on("error", (error) => {
    console.error(`[dev] Failed to start ${service.name}:`, error);
    shutdown(1);
  });

  child.on("exit", (code, signal) => {
    if (isShuttingDown) return;

    if (signal) {
      console.log(`[dev] ${service.name} exited from signal ${signal}`);
    } else {
      console.log(`[dev] ${service.name} exited with code ${code ?? 0}`);
    }

    shutdown(code ?? 0);
  });
}

function shutdown(exitCode = 0) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  for (const child of children) {
    if (!child.process.killed) {
      child.process.kill("SIGTERM");
    }
  }

  setTimeout(() => {
    process.exit(exitCode);
  }, 150);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

for (const service of services) {
  startService(service);
}
