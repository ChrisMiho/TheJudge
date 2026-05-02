import { resolveDebugLoggingEnabled, resolvePayloadLoggingEnabled } from "./logging.js";

const DEFAULT_PORT = 3000;
const ASK_AI_PROVIDER_MODES = ["mock", "bedrock"] as const;
const DEFAULT_ASK_AI_PROVIDER_MODE = "mock";
type AskAiProviderMode = (typeof ASK_AI_PROVIDER_MODES)[number];

export type ServerConfig = {
  port: number;
  frontendOrigin?: string;
  debugLoggingEnabled: boolean;
  payloadLoggingEnabled: boolean;
  askAiProvider: AskAiProviderMode;
  awsRegion?: string;
  bedrockModelId?: string;
};

function parseAskAiProviderMode(rawProvider: string | undefined): AskAiProviderMode {
  const provider = (rawProvider?.trim().toLowerCase() ?? DEFAULT_ASK_AI_PROVIDER_MODE) as AskAiProviderMode;
  if (!ASK_AI_PROVIDER_MODES.includes(provider)) {
    throw new Error(`Invalid ASK_AI_PROVIDER value "${rawProvider}". Expected one of: mock, bedrock.`);
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

export function readServerConfig(env: NodeJS.ProcessEnv): ServerConfig {
  const provider = parseAskAiProviderMode(env.ASK_AI_PROVIDER);

  const awsRegion = env.AWS_REGION?.trim() || undefined;
  const bedrockModelId = env.BEDROCK_MODEL_ID?.trim() || undefined;
  if (provider === "bedrock" && (!awsRegion || !bedrockModelId)) {
    throw new Error(
      `ASK_AI_PROVIDER=bedrock requires both AWS_REGION and BEDROCK_MODEL_ID to be configured.`
    );
  }

  return {
    port: parsePort(env.PORT),
    frontendOrigin: parseFrontendOrigin(env.FRONTEND_ORIGIN),
    debugLoggingEnabled: resolveDebugLoggingEnabled(env.DEBUG_LOGGING, env.NODE_ENV),
    payloadLoggingEnabled: resolvePayloadLoggingEnabled(env.LOG_PAYLOADS, env.NODE_ENV),
    askAiProvider: provider,
    awsRegion,
    bedrockModelId
  };
}
