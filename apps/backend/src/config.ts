import { resolveDebugLoggingEnabled, resolvePayloadLoggingEnabled } from "./logging.js";

const DEFAULT_PORT = 3000;
const DEFAULT_OPENAI_TIMEOUT_MS = 15000;
const DEFAULT_OPENAI_MAX_RETRIES = 2;
const ASK_AI_PROVIDER_MODES = ["mock", "openai"] as const;
const DEFAULT_ASK_AI_PROVIDER_MODE = "mock";
type AskAiProviderMode = (typeof ASK_AI_PROVIDER_MODES)[number];

export type ServerConfig = {
  port: number;
  frontendOrigin?: string;
  debugLoggingEnabled: boolean;
  payloadLoggingEnabled: boolean;
  askAiProvider: AskAiProviderMode;
  openAiApiKey?: string;
  openAiModel?: string;
  openAiTimeoutMs?: number;
  openAiMaxRetries?: number;
};

function parseAskAiProviderMode(rawProvider: string | undefined): AskAiProviderMode {
  const provider = (rawProvider?.trim().toLowerCase() ?? DEFAULT_ASK_AI_PROVIDER_MODE) as AskAiProviderMode;
  if (!ASK_AI_PROVIDER_MODES.includes(provider)) {
    throw new Error(`Invalid ASK_AI_PROVIDER value "${rawProvider}". Expected one of: mock, openai.`);
  }

  return provider;
}

function parsePort(rawPort: string | undefined): number {
  if (!rawPort) return DEFAULT_PORT;

  const parsed = Number(rawPort);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    throw new Error(`Invalid PORT value "${rawPort}". Expected an integer between 1 and 65535.`);
  }

  return parsed;
}

function parseFrontendOrigin(rawOrigin: string | undefined): string | undefined {
  if (!rawOrigin || rawOrigin.trim().length === 0) {
    return undefined;
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(rawOrigin);
  } catch {
    throw new Error(
      `Invalid FRONTEND_ORIGIN value "${rawOrigin}". Expected an absolute URL such as "http://localhost:5173".`
    );
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new Error(
      `Invalid FRONTEND_ORIGIN protocol "${parsedUrl.protocol}". Only http and https are supported.`
    );
  }

  return parsedUrl.toString().replace(/\/$/, "");
}

function parseOptionalPositiveInteger(rawValue: string | undefined, envName: string): number | undefined {
  if (!rawValue || rawValue.trim().length === 0) {
    return undefined;
  }

  const parsed = Number(rawValue);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`Invalid ${envName} value "${rawValue}". Expected a positive integer.`);
  }

  return parsed;
}

export function readServerConfig(env: NodeJS.ProcessEnv): ServerConfig {
  const provider = parseAskAiProviderMode(env.ASK_AI_PROVIDER);
  const openAiApiKey = env.OPENAI_API_KEY?.trim() || undefined;
  const openAiModel = env.OPENAI_MODEL?.trim() || undefined;
  const openAiTimeoutMs = parseOptionalPositiveInteger(env.OPENAI_TIMEOUT_MS, "OPENAI_TIMEOUT_MS");
  const openAiMaxRetries = parseOptionalPositiveInteger(env.OPENAI_MAX_RETRIES, "OPENAI_MAX_RETRIES");
  if (provider === "openai" && (!openAiApiKey || !openAiModel)) {
    const missing: string[] = [];
    if (!openAiApiKey) missing.push("OPENAI_API_KEY");
    if (!openAiModel) missing.push("OPENAI_MODEL");
    throw new Error(
      `ASK_AI_PROVIDER=openai requires both OPENAI_API_KEY and OPENAI_MODEL (missing: ${missing.join(", ")}). ` +
        `Set OPENAI_MODEL in apps/backend/.env and OPENAI_API_KEY in .secrets/openai-dev.env (or export them in your shell).`
    );
  }

  return {
    port: parsePort(env.PORT),
    frontendOrigin: parseFrontendOrigin(env.FRONTEND_ORIGIN),
    debugLoggingEnabled: resolveDebugLoggingEnabled(env.DEBUG_LOGGING, env.NODE_ENV),
    payloadLoggingEnabled: resolvePayloadLoggingEnabled(env.LOG_PAYLOADS, env.NODE_ENV),
    askAiProvider: provider,
    openAiApiKey,
    openAiModel,
    openAiTimeoutMs: provider === "openai" ? (openAiTimeoutMs ?? DEFAULT_OPENAI_TIMEOUT_MS) : undefined,
    openAiMaxRetries: provider === "openai" ? (openAiMaxRetries ?? DEFAULT_OPENAI_MAX_RETRIES) : undefined
  };
}
