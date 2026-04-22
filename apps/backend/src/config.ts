import { resolveDebugLoggingEnabled } from "./logging.js";

const DEFAULT_PORT = 3000;

export type ServerConfig = {
  port: number;
  frontendOrigin?: string;
  debugLoggingEnabled: boolean;
};

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
  return {
    port: parsePort(env.PORT),
    frontendOrigin: parseFrontendOrigin(env.FRONTEND_ORIGIN),
    debugLoggingEnabled: resolveDebugLoggingEnabled(env.DEBUG_LOGGING, env.NODE_ENV)
  };
}
