import { config as loadDotenv, parse as parseDotenv } from "dotenv";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createApp } from "./app.js";
import { readServerConfig } from "./config.js";
import { createAppLogger } from "./logging.js";
import { createAskAiProvider } from "./providers/createAskAiProvider.js";

if (process.env.NODE_ENV === "development" && process.env.VITEST !== "true") {
  const backendDir = dirname(fileURLToPath(import.meta.url));
  const repoRoot = resolve(backendDir, "../../..");
  const backendEnvPath = resolve(backendDir, "../.env");
  loadDotenv({ path: backendEnvPath });
  const secretsEnvPath = resolve(repoRoot, ".secrets/aws-bedrock-dev.env");
  if (existsSync(secretsEnvPath)) {
    loadDotenv({ path: secretsEnvPath, override: true });
  }

  /**
   * dotenv does not override keys already present in process.env (including empty string).
   * Apply selected Bedrock-related keys from apps/backend/.env when the process value is unset or blank.
   */
  const fillFromFileIfBlank = (filePath: string, keys: readonly string[]) => {
    if (!existsSync(filePath)) return;
    const parsed = parseDotenv(readFileSync(filePath, "utf8"));
    for (const key of keys) {
      const fromFile = parsed[key];
      if (fromFile == null || String(fromFile).trim() === "") continue;
      const cur = process.env[key];
      if (cur === undefined || String(cur).trim() === "") {
        process.env[key] = fromFile;
      }
    }
  };
  fillFromFileIfBlank(backendEnvPath, ["AWS_REGION", "BEDROCK_MODEL_ID", "BEDROCK_TIMEOUT_MS", "BEDROCK_MAX_ATTEMPTS", "AWS_PROFILE"]);
  fillFromFileIfBlank(secretsEnvPath, ["AWS_REGION", "BEDROCK_MODEL_ID", "AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_SESSION_TOKEN"]);
}

const config = readServerConfig(process.env);
const startupLogger = createAppLogger(true);
const app = createApp({
  frontendOrigin: config.frontendOrigin,
  debugLoggingEnabled: config.debugLoggingEnabled,
  payloadLoggingEnabled: config.payloadLoggingEnabled,
  askAiProvider: createAskAiProvider(config)
});

app.listen(config.port, () => {
  startupLogger.info("backend.startup", {
    port: config.port,
    frontendOrigin: config.frontendOrigin ?? "(unset)",
    askAiProvider: config.askAiProvider,
    debugLoggingEnabled: config.debugLoggingEnabled,
    payloadLoggingEnabled: config.payloadLoggingEnabled
  });
});
