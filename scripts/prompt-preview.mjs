import { spawn } from "node:child_process";
import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { join, resolve } from "node:path";

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);

function getFlag(name) {
  const idx = args.indexOf(name);
  return idx !== -1 ? args[idx + 1] : null;
}

const allFixtures = args.includes("--all-fixtures");
const singleFixture = getFlag("--fixture");
const outputDir = resolve(getFlag("--output-dir") ?? "output/prompt-preview");
const port = parseInt(getFlag("--port") ?? "3099", 10);

const DEFAULT_FIXTURES = ["full-context", "cascade-keyword", "state-based-actions", "near-cap-stack", "follow-up-chat"];
const FIXTURES_DIR = resolve("apps/backend/src/eval/fixtures");

// ---------------------------------------------------------------------------
// Spawn / shutdown
// ---------------------------------------------------------------------------

const npmExecutable = process.platform === "win32" ? "npm.cmd" : "npm";
let backendProcess = null;
let isShuttingDown = false;

function shutdown(exitCode = 0) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  if (backendProcess && !backendProcess.killed) {
    backendProcess.kill("SIGTERM");
  }
  setTimeout(() => process.exit(exitCode), 150);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

// ---------------------------------------------------------------------------
// Backend startup + health poll
// ---------------------------------------------------------------------------

function spawnBackend() {
  const env = { ...process.env, ASK_AI_PROVIDER: "mock", PORT: String(port) };
  const child = spawn(
    `${npmExecutable} run dev --workspace apps/backend`,
    { shell: true, stdio: "pipe", env }
  );
  child.on("error", (err) => {
    console.error("[prompt-preview] Backend spawn error:", err.message);
    shutdown(1);
  });
  child.on("exit", (code, signal) => {
    if (isShuttingDown) return;
    console.error(`[prompt-preview] Backend exited unexpectedly (code=${code} signal=${signal})`);
    shutdown(1);
  });
  return child;
}

async function pollHealth(timeoutMs = 15_000) {
  const url = `http://127.0.0.1:${port}/api/health`;
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // not ready yet
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`Health poll timed out after ${timeoutMs}ms`);
}

// ---------------------------------------------------------------------------
// Fixture loading
// ---------------------------------------------------------------------------

async function loadFixtures() {
  const files = await readdir(FIXTURES_DIR);
  const fixtureFiles = files.filter((f) => f.endsWith(".fixture.json"));

  if (singleFixture) {
    const target = fixtureFiles.find((f) => f === `${singleFixture}.fixture.json`);
    if (!target) throw new Error(`Fixture not found: ${singleFixture}`);
    return [JSON.parse(await readFile(join(FIXTURES_DIR, target), "utf8"))];
  }

  if (allFixtures) {
    return Promise.all(
      fixtureFiles.map((f) => readFile(join(FIXTURES_DIR, f), "utf8").then(JSON.parse))
    );
  }

  const selected = fixtureFiles.filter((f) =>
    DEFAULT_FIXTURES.some((id) => f === `${id}.fixture.json`)
  );
  return Promise.all(
    selected.map((f) => readFile(join(FIXTURES_DIR, f), "utf8").then(JSON.parse))
  );
}

// ---------------------------------------------------------------------------
// Prompt text extraction
// ---------------------------------------------------------------------------

function extractPromptText(answer) {
  const MARKER = "FULL PROMPT (SENT TO PROVIDER)\n\n";
  const idx = answer.indexOf(MARKER);
  if (idx === -1) return null;
  return answer.slice(idx + MARKER.length);
}

// ---------------------------------------------------------------------------
// Per-fixture HTTP + artifact writing
// ---------------------------------------------------------------------------

async function runFixture(fixture) {
  const { id, description, request } = fixture;
  const fixtureDir = join(outputDir, id);
  await mkdir(fixtureDir, { recursive: true });

  const url = `http://127.0.0.1:${port}/api/ask-ai`;
  let res;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request)
    });
  } catch (err) {
    await writeFile(join(fixtureDir, "request.json"), JSON.stringify(request, null, 2));
    await writeFile(join(fixtureDir, "meta.json"), JSON.stringify({ id, description, result: "failed", error: err.message }, null, 2));
    console.error(`[prompt-preview] ${id}: network error — ${err.message}`);
    return { id, result: "failed" };
  }

  const httpStatus = res.status;
  await writeFile(join(fixtureDir, "request.json"), JSON.stringify(request, null, 2));

  if (!res.ok) {
    let errorBody;
    try {
      errorBody = await res.json();
    } catch {
      errorBody = { raw: await res.text() };
    }
    const headers = {};
    const corrId = res.headers.get("x-correlation-id");
    if (corrId) headers["x-correlation-id"] = corrId;

    await writeFile(join(fixtureDir, "meta.json"), JSON.stringify({ id, description, httpStatus, result: "api_error" }, null, 2));
    await writeFile(join(fixtureDir, "api-error.json"), JSON.stringify(errorBody, null, 2));
    await writeFile(join(fixtureDir, "response-headers.json"), JSON.stringify(headers, null, 2));
    console.log(`[prompt-preview] ${id}: api_error (HTTP ${httpStatus})`);
    return { id, result: "api_error", httpStatus, files: ["request.json", "meta.json", "api-error.json", "response-headers.json"] };
  }

  let body;
  try {
    body = await res.json();
  } catch {
    await writeFile(join(fixtureDir, "meta.json"), JSON.stringify({ id, description, httpStatus, result: "failed", error: "response parse error" }, null, 2));
    console.error(`[prompt-preview] ${id}: failed to parse response JSON`);
    return { id, result: "failed" };
  }

  const { answer, context, diagnostics, enrichmentDebug } = body;

  // Detect missing sidecars
  if (!context || !diagnostics || !enrichmentDebug) {
    const missing = ["context", "diagnostics", "enrichmentDebug"].filter((k) => !body[k]);
    await writeFile(join(fixtureDir, "meta.json"), JSON.stringify({ id, description, httpStatus, result: "failed", error: `missing sidecars: ${missing.join(", ")}` }, null, 2));
    console.error(`[prompt-preview] ${id}: failed — missing sidecars: ${missing.join(", ")}`);
    return { id, result: "failed" };
  }

  const promptText = extractPromptText(answer);
  if (promptText === null) {
    await writeFile(join(fixtureDir, "meta.json"), JSON.stringify({ id, description, httpStatus, result: "failed", error: "prompt section marker not found in answer" }, null, 2));
    console.error(`[prompt-preview] ${id}: failed — could not parse prompt text from answer`);
    return { id, result: "failed" };
  }

  const writtenFiles = ["request.json", "meta.json", "production.prompt.txt", "context.json", "diagnostics.json", "enrichment.json"];
  await Promise.all([
    writeFile(join(fixtureDir, "meta.json"), JSON.stringify({ id, description, httpStatus, result: "ok" }, null, 2)),
    writeFile(join(fixtureDir, "production.prompt.txt"), promptText),
    writeFile(join(fixtureDir, "context.json"), JSON.stringify(context, null, 2)),
    writeFile(join(fixtureDir, "diagnostics.json"), JSON.stringify(diagnostics, null, 2)),
    writeFile(join(fixtureDir, "enrichment.json"), JSON.stringify(enrichmentDebug, null, 2))
  ]);

  console.log(`[prompt-preview] ${id}: ok`);
  return { id, result: "ok", httpStatus, files: writtenFiles };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  let fixtures;
  try {
    fixtures = await loadFixtures();
  } catch (err) {
    console.error("[prompt-preview] Failed to load fixtures:", err.message);
    process.exit(1);
  }

  if (fixtures.length === 0) {
    console.error("[prompt-preview] No fixtures found.");
    process.exit(1);
  }

  console.log(`[prompt-preview] Starting backend on port ${port}…`);
  backendProcess = spawnBackend();

  try {
    await pollHealth();
  } catch (err) {
    console.error("[prompt-preview]", err.message);
    shutdown(1);
    return;
  }
  console.log(`[prompt-preview] Backend ready. Running ${fixtures.length} fixture(s)…`);

  await mkdir(outputDir, { recursive: true });

  const results = [];
  for (const fixture of fixtures) {
    const result = await runFixture(fixture);
    results.push(result);
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    outputDir,
    fixtures: results
  };
  await writeFile(join(outputDir, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log(`[prompt-preview] Wrote manifest.json`);

  const failed = results.filter((r) => r.result === "failed");
  shutdown(failed.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("[prompt-preview] Unexpected error:", err);
  shutdown(1);
});
